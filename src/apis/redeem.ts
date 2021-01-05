import { PolkaBTC, RedeemRequest, Vault, H256Le, DOT } from "../interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, Hash, H256, Header } from "@polkadot/types/interfaces";
import { Bytes } from "@polkadot/types/primitive";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { VaultsAPI, DefaultVaultsAPI, VaultExt } from "./vaults";
import { decodeBtcAddress, encodeBtcAddress, pagedIterator, scaleFixedPointType, sendLoggedTx } from "../utils";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { stripHexPrefix } from "../utils";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";

export type RequestResult = { id: Hash; vault: VaultExt };

export interface RedeemRequestExt extends Omit<RedeemRequest, "btc_address"> {
    // network encoded btc address
    btc_address: string;
}

export function encodeRedeemRequest(req: RedeemRequest, network: Network): RedeemRequestExt {
    const { btc_address, ...obj } = req;
    return Object.assign(
        {
            btc_address: encodeBtcAddress(btc_address, network),
        },
        obj
    ) as RedeemRequestExt;
}

export interface RedeemAPI {
    list(): Promise<RedeemRequestExt[]>;
    request(amount: PolkaBTC, btcAddressEnc: string, vaultId?: AccountId): Promise<RequestResult>;
    execute(redeemId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<boolean>;
    cancel(redeemId: H256, reimburse?: boolean): Promise<boolean>;
    setAccount(account: AddressOrPair): void;
    getPagedIterator(perPage: number): AsyncGenerator<RedeemRequest[]>;
    mapForUser(account: AccountId): Promise<Map<H256, RedeemRequestExt>>;
    getRequestById(redeemId: string | Uint8Array | H256): Promise<RedeemRequestExt>;
    subscribeToRedeemExpiry(account: AccountId, callback: (requestRedeemId: string) => void): Promise<() => void>;
    getDustValue(): Promise<PolkaBTC>;
    getFeesToPay(amount: string): Promise<string>;
    getPremiumRedeemFee(): Promise<string>;
    getRedeemPeriod(): Promise<BlockNumber>;
    getFeePercentage(): Promise<string>;
}

export class DefaultRedeemAPI {
    private vaultsAPI: VaultsAPI;
    private btcNetwork: Network;
    requestHash: Hash = this.api.createType("Hash");
    events: EventRecord[] = [];

    constructor(private api: ApiPromise, btcNetwork: Network, private account?: AddressOrPair) {
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork);
        this.btcNetwork = btcNetwork;
    }

    /**
     * @param events The EventRecord array returned after sending a redeem transaction
     * @param methodToCheck The name of the event method whose existence to check
     * @returns The redeemId associated with the transaction. If the EventRecord array does not
     * contain redeem events, the function throws an error.
     */
    private getRedeemIdFromEvents(events: EventRecord[], methodToCheck: string): Hash {
        for (const {
            event: { method, section, data },
        } of events) {
            if (section == "redeem" && methodToCheck === method) {
                // the redeem id as H256 is always the first item of the event
                const id = this.api.createType("Hash", data[0]);
                return id;
            }
        }

        throw new Error("Transaction failed");
    }

    /**
     * A successful `execute` produces the following events:
        - vaultRegistry.IncreaseToBeRedeemedTokens
        - polkaBtc.Reserved
        - treasury.Lock
        - redeem.RequestRedeem
        - system.ExtrinsicSuccess
     * @param events The EventRecord array returned after sending a redeem request transaction
     * @returns A boolean value
     */
    isRequestSuccessful(events: EventRecord[]): boolean {
        for (const {
            event: { method, section },
        } of events) {
            if (section == "redeem" && method == "RequestRedeem") {
                return true;
            }
        }

        return false;
    }

    /**
     * @param events The EventRecord array returned after sending a redeem execution transaction
     * @returns A boolean value
     */
    isExecutionSuccessful(events: EventRecord[]): boolean {
        for (const {
            event: { method, section },
        } of events) {
            if (section == "redeem" && method == "ExecuteRedeem") {
                return true;
            }
        }

        return false;
    }

    /**
     * Send a redeem request transaction
     * @param amountSat PolkaBTC amount (denoted in Satoshi) to redeem
     * @param btcAddressEnc Bitcoin address where the redeemed BTC should be sent
     * @returns An object of type {redeemId, vault} if the request succeeded. The function throws an error otherwise.
     */
    async request(amountSat: PolkaBTC, btcAddressEnc: string, vaultId?: AccountId): Promise<RequestResult> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        let vault: VaultExt;
        if (vaultId) {
            vault = await this.vaultsAPI.get(vaultId);
        } else {
            vaultId = await this.vaultsAPI.selectRandomVaultRedeem(amountSat);
            vault = await this.vaultsAPI.get(vaultId);
        }

        const btcAddress = this.api.createType("BtcAddress", decodeBtcAddress(btcAddressEnc, this.btcNetwork));
        const requestRedeemTx = this.api.tx.redeem.requestRedeem(amountSat, btcAddress, vault.id);
        const result = await sendLoggedTx(requestRedeemTx, this.account, this.api);
        if (!this.isRequestSuccessful(result.events)) {
            throw new Error("Request failed");
        }
        const id = this.getRedeemIdFromEvents(result.events, "RequestRedeem");
        return { id, vault };
    }

    /**
     * Send a redeem execution transaction
     * @param redeemId The ID returned by the redeem request transaction
     * @param txId The ID of the Bitcoin transaction that sends funds from the vault to the redeemer's address
     * @param merkleProof The merkle inclusion proof of the Bitcoin transaction
     * @param rawTx The raw bytes of the Bitcoin transaction
     * @returns A boolean value indicating whether the execution was successful. The function throws an error otherwise.
     */
    async execute(redeemId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<boolean> {
        if (!this.account) {
            throw new Error("cannot execute without setting account");
        }
        const executeRedeemTx = this.api.tx.redeem.executeRedeem(redeemId, txId, merkleProof, rawTx);
        const result = await sendLoggedTx(executeRedeemTx, this.account, this.api);
        if (!this.isExecutionSuccessful(result.events)) {
            throw new Error("Execution failed");
        }
        const id = this.getRedeemIdFromEvents(result.events, "ExecuteRedeem");
        if (id) {
            return true;
        }
        return false;
    }

    /**
     * Send a redeem cancellation transaction. After the redeem period has elapsed,
     * the redeemal of PolkaBTC can be cancelled. As a result, the griefing collateral
     * of the vault will be slashed and sent to the redeemer
     * @param redeemId The ID returned by the redeem request transaction
     * @param reimburse (Optional) In case of redeem failure:
     *  - `false` = retry redeeming, with a different Vault
     *  - `true` = accept reimbursement in polkaBTC
     * @returns A boolean value indicating whether the cancellation was successful.
     * The function throws an error otherwise.
     */
    async cancel(redeemId: H256, reimburse?: boolean): Promise<boolean> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }
        const reimburseValue = reimburse ? reimburse : false;
        const cancelRedeemTx = this.api.tx.redeem.cancelRedeem(redeemId, reimburseValue);
        const result = await sendLoggedTx(cancelRedeemTx, this.account, this.api);
        const id = this.getRedeemIdFromEvents(result.events, "CancelRedeem");
        if (id) {
            return true;
        }
        return false;
    }

    /**
     * @returns An array containing the redeem requests
     */
    async list(): Promise<RedeemRequestExt[]> {
        const redeemRequests = await this.api.query.redeem.redeemRequests.entries();
        return redeemRequests.map((v) => encodeRedeemRequest(v[1], this.btcNetwork));
    }

    /**
     * @param account The ID of the account whose redeem requests are to be retrieved
     * @returns A mapping from the redeem request ID to the redeem request object, corresponding to the requests of
     * the given account
     */
    async mapForUser(account: AccountId): Promise<Map<H256, RedeemRequestExt>> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customAPIRPC = this.api.rpc as any;
        const redeemRequestPairs: [H256, RedeemRequest][] = await customAPIRPC.redeem.getRedeemRequests(account);
        const mapForUser: Map<H256, RedeemRequestExt> = new Map<H256, RedeemRequestExt>();
        redeemRequestPairs.forEach((redeemRequestPair) =>
            mapForUser.set(redeemRequestPair[0], encodeRedeemRequest(redeemRequestPair[1], this.btcNetwork))
        );
        return mapForUser;
    }

    /**
     * Whenever a redeem request associated with `account` expires, call the callback function with the
     * ID of the expired request. Already expired requests are stored in memory, so as not to call back
     * twice for the same request.
     * @param account The ID of the account whose redeem requests are to be checked for expiry
     * @param callback Function to be called whenever a redeem request expires
     */
    async subscribeToRedeemExpiry(
        account: AccountId,
        callback: (requestRedeemId: string) => void
    ): Promise<() => void> {
        const expired = new Set();
        const unsubscribe = await this.api.rpc.chain.subscribeNewHeads(async (header: Header) => {
            const redeemRequests = await this.mapForUser(account);
            const redeemPeriod = await this.getRedeemPeriod();
            const currentParachainBlockHeight = header.number.toBn();
            redeemRequests.forEach((request, id) => {
                if (request.opentime.add(redeemPeriod).lte(currentParachainBlockHeight) && !expired.has(id)) {
                    expired.add(id);
                    callback(stripHexPrefix(id.toString()));
                }
            });
        });
        return unsubscribe;
    }

    /**
     * @param amountBtc The amount, in BTC, for which to compute the redeem fees
     * @returns The fees, in BTC
     */
    async getFeesToPay(amount: string): Promise<string> {
        const feePercentage = await this.getFeePercentage();
        const feePercentageBN = new Big(feePercentage);
        const amountBig = new Big(amount);
        return amountBig.mul(feePercentageBN).toString();
    }

    /**
     * @returns The fee percentage charged for redeeming. For instance, "0.005" stands for 0.005%
     */
    async getFeePercentage(): Promise<string> {
        const redeemFee = await this.api.query.fee.redeemFee();
        return scaleFixedPointType(redeemFee);
    }

    /**
     * @returns The time difference in number of blocks between when a redeem request is created
     * and required completion time by a user.
     */
    async getRedeemPeriod(): Promise<BlockNumber> {
        return await this.api.query.redeem.redeemPeriod();
    }

    /**
     * @returns The minimum amount of btc that is accepted for redeem requests; any lower values would
     * risk the bitcoin client to reject the payment
     */
    async getDustValue(): Promise<PolkaBTC> {
        return await this.api.query.redeem.redeemBtcDustValue();
    }

    /**
     * @returns If users execute a redeem with a Vault flagged for premium redeem,
     * they can earn a DOT premium, slashed from the Vault's collateral.
     */
    async getPremiumRedeemFee(): Promise<string> {
        const premiumRedeemFee = await this.api.query.fee.premiumRedeemFee();
        return scaleFixedPointType(premiumRedeemFee);
    }

    /**
     * @param perPage Number of redeem requests to iterate through at a time
     * @returns An AsyncGenerator to be used as an iterator
     */
    getPagedIterator(perPage: number): AsyncGenerator<RedeemRequest[]> {
        return pagedIterator<RedeemRequest>(this.api.query.redeem.redeemRequests, perPage);
    }

    /**
     * @param redeemId The ID of the redeem request to fetch
     * @returns A redeem request object
     */
    async getRequestById(redeemId: string | Uint8Array | H256): Promise<RedeemRequestExt> {
        return encodeRedeemRequest(await this.api.query.redeem.redeemRequests(redeemId), this.btcNetwork);
    }

    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void {
        this.account = account;
    }
}
