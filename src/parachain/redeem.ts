import { PolkaBTC, RedeemRequest, H256Le } from "../interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, Hash, H256, Header } from "@polkadot/types/interfaces";
import { Bytes } from "@polkadot/types/primitive";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { VaultsAPI, DefaultVaultsAPI } from "./vaults";
import {
    decodeBtcAddress,
    pagedIterator,
    decodeFixedPointType,
    Transaction,
    encodeParachainRequest,
    ACCOUNT_NOT_SET_ERROR_MESSAGE
} from "../utils";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { stripHexPrefix } from "../utils";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { ApiTypes, AugmentedEvent } from "@polkadot/api/types";
import type { AnyTuple } from "@polkadot/types/types";

export type RequestResult = { id: Hash; redeemRequest: RedeemRequestExt };

export interface RedeemRequestExt extends Omit<RedeemRequest, "btc_address"> {
    // network encoded btc address
    btc_address: string;
}

export function encodeRedeemRequest(req: RedeemRequest, network: Network): RedeemRequestExt {
    return encodeParachainRequest<RedeemRequest, RedeemRequestExt>(req, network);
}

/**
 * @category PolkaBTC Bridge
 */
export interface RedeemAPI {
    /**
     * @returns An array containing the redeem requests
     */
    list(): Promise<RedeemRequestExt[]>;
    /**
     * Send a redeem request transaction
     * @param amountSat PolkaBTC amount (denoted in Satoshi) to redeem
     * @param btcAddressEnc Bitcoin address where the redeemed BTC should be sent
     * @returns An object of type {redeemId, vault} if the request succeeded. The function throws an error otherwise.
     */
    request(amount: PolkaBTC, btcAddressEnc: string, vaultId?: AccountId): Promise<RequestResult>;
    /**
     * Send a redeem execution transaction
     * @param redeemId The ID returned by the redeem request transaction
     * @param txId The ID of the Bitcoin transaction that sends funds from the vault to the redeemer's address
     * @param merkleProof The merkle inclusion proof of the Bitcoin transaction
     * @param rawTx The raw bytes of the Bitcoin transaction
     * @returns A boolean value indicating whether the execution was successful. The function throws an error otherwise.
     */
    execute(redeemId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<boolean>;
    /**
     * Send a redeem cancellation transaction. After the redeem period has elapsed,
     * the redeemal of PolkaBTC can be cancelled. As a result, the griefing collateral
     * of the vault will be slashed and sent to the redeemer
     * @param redeemId The ID returned by the redeem request transaction
     * @param reimburse (Optional) In case of redeem failure:
     *  - `false` = retry redeeming, with a different Vault
     *  - `true` = accept reimbursement in polkaBTC
     */
    cancel(redeemId: H256, reimburse?: boolean): Promise<void>;
    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void;
    /**
     * @param perPage Number of redeem requests to iterate through at a time
     * @returns An AsyncGenerator to be used as an iterator
     */
    getPagedIterator(perPage: number): AsyncGenerator<RedeemRequest[]>;
    /**
     * @param account The ID of the account whose redeem requests are to be retrieved
     * @returns A mapping from the redeem request ID to the redeem request object, corresponding to the requests of
     * the given account
     */
    mapForUser(account: AccountId): Promise<Map<H256, RedeemRequestExt>>;
    /**
     * @param redeemId The ID of the redeem request to fetch
     * @returns A redeem request object
     */
    getRequestById(redeemId: H256): Promise<RedeemRequestExt>;
    /**
     * Whenever a redeem request associated with `account` expires, call the callback function with the
     * ID of the expired request. Already expired requests are stored in memory, so as not to call back
     * twice for the same request.
     * @param account The ID of the account whose redeem requests are to be checked for expiry
     * @param callback Function to be called whenever a redeem request expires
     */
    subscribeToRedeemExpiry(account: AccountId, callback: (requestRedeemId: H256) => void): Promise<() => void>;
    /**
     * @returns The minimum amount of btc that is accepted for redeem requests; any lower values would
     * risk the bitcoin client to reject the payment
     */
    getDustValue(): Promise<PolkaBTC>;
    /**
     * @returns The fee charged for redeeming. For instance, "0.005" stands for 0.5%
     */
    getFeeRate(): Promise<Big>;
    /**
     * @param amountBtc The amount, in BTC, for which to compute the redeem fees
     * @returns The fees, in BTC
     */
    getFeesToPay(amount: string): Promise<string>;
    /**
     * @returns If users execute a redeem with a Vault flagged for premium redeem,
     * they can earn a DOT premium, slashed from the Vault's collateral.
     */
    getPremiumRedeemFee(): Promise<string>;
    /**
     * @returns The time difference in number of blocks between when a redeem request is created
     * and required completion time by a user.
     */
    getRedeemPeriod(): Promise<BlockNumber>;
}

export class DefaultRedeemAPI {
    private vaultsAPI: VaultsAPI;
    requestHash: Hash = this.api.createType("Hash");
    events: EventRecord[] = [];
    transaction: Transaction;

    constructor(private api: ApiPromise, private btcNetwork: Network, private account?: AddressOrPair) {
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork);
        this.transaction = new Transaction(api);
    }

    /**
     * @param events The EventRecord array returned after sending a redeem transaction
     * @param methodToCheck The name of the event method whose existence to check
     * @returns The redeemId associated with the transaction. If the EventRecord array does not
     * contain redeem events, the function throws an error.
     */
    private getRedeemIdFromEvents(events: EventRecord[], eventToFind: AugmentedEvent<ApiTypes, AnyTuple>): Hash {
        for (const { event } of events) {
            if (eventToFind.is(event)) {
                // the redeem id has type H256 and is the first item of the event data array
                const id = this.api.createType("Hash", event.data[0]);
                return id;
            }
        }

        throw new Error("Transaction failed");
    }

    async request(amountSat: PolkaBTC, btcAddressEnc: string, vaultId?: AccountId): Promise<RequestResult> {
        if (!this.account) {
            return Promise.reject(ACCOUNT_NOT_SET_ERROR_MESSAGE);
        }

        if (!vaultId) {
            vaultId = await this.vaultsAPI.selectRandomVaultIssue(amountSat);
        }
        const btcAddress = this.api.createType("BtcAddress", decodeBtcAddress(btcAddressEnc, this.btcNetwork));
        const requestRedeemTx = this.api.tx.redeem.requestRedeem(amountSat, btcAddress, vaultId);
        const result = await this.transaction.sendLogged(requestRedeemTx, this.account, this.api.events.redeem.RequestRedeem);
        const id = this.getRedeemIdFromEvents(result.events, this.api.events.redeem.RequestRedeem);
        const redeemRequest = await this.getRequestById(id);
        return { id, redeemRequest };
    }

    async execute(redeemId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<boolean> {
        if (!this.account) {
            throw new Error("cannot execute without setting account");
        }
        const executeRedeemTx = this.api.tx.redeem.executeRedeem(redeemId, txId, merkleProof, rawTx);
        const result = await this.transaction.sendLogged(executeRedeemTx, this.account, this.api.events.redeem.ExecuteRedeem);
        const id = this.getRedeemIdFromEvents(result.events, this.api.events.redeem.ExecuteRedeem);
        if (id) {
            return true;
        }
        return false;
    }

    async cancel(redeemId: H256, reimburse?: boolean): Promise<void> {
        if (!this.account) {
            return Promise.reject(ACCOUNT_NOT_SET_ERROR_MESSAGE);
        }
        const reimburseValue = reimburse ? reimburse : false;
        const cancelRedeemTx = this.api.tx.redeem.cancelRedeem(redeemId, reimburseValue);
        await this.transaction.sendLogged(cancelRedeemTx, this.account, this.api.events.redeem.CancelRedeem);
    }

    async list(): Promise<RedeemRequestExt[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const redeemRequests = await this.api.query.redeem.redeemRequests.entriesAt(head);
        return redeemRequests.map((v) => encodeRedeemRequest(v[1], this.btcNetwork));
    }

    async mapForUser(account: AccountId): Promise<Map<H256, RedeemRequestExt>> {
        const redeemRequestPairs: [H256, RedeemRequest][] = await this.api.rpc.redeem.getRedeemRequests(account);
        const mapForUser: Map<H256, RedeemRequestExt> = new Map<H256, RedeemRequestExt>();
        redeemRequestPairs.forEach((redeemRequestPair) =>
            mapForUser.set(redeemRequestPair[0], encodeRedeemRequest(redeemRequestPair[1], this.btcNetwork))
        );
        return mapForUser;
    }

    async subscribeToRedeemExpiry(account: AccountId, callback: (requestRedeemId: H256) => void): Promise<() => void> {
        const expired = new Set();
        try {
            const unsubscribe = await this.api.rpc.chain.subscribeFinalizedHeads(async (header: Header) => {
                const redeemRequests = await this.mapForUser(account);
                const redeemPeriod = await this.getRedeemPeriod();
                const currentParachainBlockHeight = header.number.toBn();
                redeemRequests.forEach((request, id) => {
                    if (request.opentime.add(redeemPeriod).lte(currentParachainBlockHeight) && !expired.has(id)) {
                        expired.add(id);
                        callback(this.api.createType("H256", stripHexPrefix(id.toString())));
                    }
                });
            });
            return unsubscribe;
        } catch (error) {
            console.log(`Error during expired redeem callback: ${error}`);
        }
        // as a fallback, return an empty void function
        return () => {
            return;
        };
    }

    async getFeesToPay(amount: string): Promise<string> {
        const feePercentage = await this.getFeeRate();
        const feePercentageBN = new Big(feePercentage);
        const amountBig = new Big(amount);
        return amountBig.mul(feePercentageBN).toString();
    }

    async getFeeRate(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const redeemFee = await this.api.query.fee.redeemFee.at(head);
        return new Big(decodeFixedPointType(redeemFee));
    }

    async getRedeemPeriod(): Promise<BlockNumber> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return await this.api.query.redeem.redeemPeriod.at(head);
    }

    async getDustValue(): Promise<PolkaBTC> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return await this.api.query.redeem.redeemBtcDustValue.at(head);
    }

    async getPremiumRedeemFee(): Promise<string> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const premiumRedeemFee = await this.api.query.fee.premiumRedeemFee.at(head);
        return decodeFixedPointType(premiumRedeemFee);
    }

    getPagedIterator(perPage: number): AsyncGenerator<RedeemRequest[]> {
        return pagedIterator<RedeemRequest>(this.api.query.redeem.redeemRequests, perPage);
    }

    async getRequestById(redeemId: H256): Promise<RedeemRequestExt> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return encodeRedeemRequest(await this.api.query.redeem.redeemRequests.at(head, redeemId), this.btcNetwork);
    }

    setAccount(account: AddressOrPair): void {
        this.account = account;
    }
}
