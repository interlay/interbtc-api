import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, H256, Hash } from "@polkadot/types/interfaces";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { Bytes } from "@polkadot/types/primitive";
import { DOT, H256Le, IssueRequest, PolkaBTC } from "../interfaces/default";
import { DefaultVaultsAPI, VaultsAPI, VaultExt } from "./vaults";
import { encodeBtcAddress, pagedIterator, decodeFixedPointType, sendLoggedTx } from "../utils";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { DefaultOracleAPI, OracleAPI } from "./oracle";

export type RequestResult = { id: Hash; vault: VaultExt };

export interface IssueRequestExt extends Omit<IssueRequest, "btc_address"> {
    // network encoded btc address
    btc_address: string;
}

export function encodeIssueRequest(req: IssueRequest, network: Network): IssueRequestExt {
    const { btc_address, ...obj } = req;
    return Object.assign(
        {
            btc_address: encodeBtcAddress(btc_address, network),
        },
        obj
    ) as IssueRequestExt;
}

export interface IssueAPI {
    request(amountSat: PolkaBTC, vaultId?: AccountId, griefingCollateral?: DOT): Promise<RequestResult>;
    execute(issueId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<boolean>;
    cancel(issueId: H256): Promise<void>;
    setAccount(account: AddressOrPair): void;
    getGriefingCollateralInPlanck(amountBtc: string): Promise<string>;
    list(): Promise<IssueRequestExt[]>;
    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]>;
    mapForUser(account: AccountId): Promise<Map<H256, IssueRequestExt>>;
    getRequestById(issueId: string | Uint8Array | H256): Promise<IssueRequestExt>;
    getIssuePeriod(): Promise<BlockNumber>;
    isExecutionSuccessful(events: EventRecord[]): boolean;
    getFeesToPay(amountBtc: string): Promise<string>;
}

export class DefaultIssueAPI implements IssueAPI {
    private vaultsAPI: VaultsAPI;
    private btcNetwork: Network;
    private oracleAPI: OracleAPI;
    requestHash: Hash;

    constructor(private api: ApiPromise, btcNetwork: Network, private account?: AddressOrPair) {
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork);
        this.oracleAPI = new DefaultOracleAPI(api);
        this.btcNetwork = btcNetwork;
        this.requestHash = this.api.createType("Hash");
    }

    /**
     * A successful `request` produces four events:
        - collateral.LockCollateral
        - vaultRegistry.IncreaseToBeIssuedTokens
        - issue.RequestIssue
        - system.ExtrinsicSuccess
     * @param events The EventRecord array returned after sending an issue request transaction
     * @returns The issueId associated with the request. If the EventRecord array does not
     * contain issue request events, the function throws an error.
     */
    private getIssueIdFromEvents(events: EventRecord[]): Hash {
        for (const {
            event: { method, section, data },
        } of events) {
            if (section == "issue" && method == "RequestIssue") {
                const hash = this.api.createType("Hash", data[0]);
                return hash;
            }
        }

        throw new Error("Request transaction failed");
    }

    /**
     * @param events The EventRecord array returned after sending an request issue transaction
     * @returns A boolean value
     */
    isRequestSuccessful(events: EventRecord[]): boolean {
        for (const {
            event: { method, section },
        } of events) {
            if (section == "issue" && method == "RequestIssue") {
                return true;
            }
        }

        return false;
    }

    /**
     * A successful `execute` produces the following events:
        - vaultRegistry.IssueTokens
        - system.NewAccount
        - polkaBtc.Endowed
        - treasury.Mint
        - issue.ExecuteIssue
        - system.ExtrinsicSuccess
     * @param events The EventRecord array returned after sending an execute request transaction
     * @returns A boolean value
     */
    isExecutionSuccessful(events: EventRecord[]): boolean {
        for (const {
            event: { method, section },
        } of events) {
            if (section == "issue" && method == "ExecuteIssue") {
                return true;
            }
        }

        return false;
    }

    /**
     * Send an issue request transaction
     * @param amountSat PolkaBTC amount (denoted in Satoshi) to issue
     * @param vaultId (optional) Request the issue from a specific vault. If this parameter is unspecified,
     * a random vault will be selected
     * @returns An object of type {issueId, vault} if the request succeeded. The function throws an error otherwise.
     */
    async request(amountSat: PolkaBTC, vaultId?: AccountId): Promise<RequestResult> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        let vault: VaultExt;
        if (vaultId) {
            vault = await this.vaultsAPI.get(vaultId);
        } else {
            vaultId = await this.vaultsAPI.selectRandomVaultIssue(amountSat);
            vault = await this.vaultsAPI.get(vaultId);
        }
        const griefingCollateralPlanck = await this.getGriefingCollateralInPlanck(amountSat.toString());
        const requestIssueTx = this.api.tx.issue.requestIssue(amountSat, vault.id, griefingCollateralPlanck);
        const result = await sendLoggedTx(requestIssueTx, this.account, this.api);
        if (!this.isRequestSuccessful(result.events)) {
            Promise.reject("Request failed");
        }

        const id = this.getIssueIdFromEvents(result.events);
        return { id, vault };
    }

    /**
     * Send an issue execution transaction
     * @param issueId The ID returned by the issue request transaction
     * @param txId The ID of the Bitcoin transaction that sends funds to the vault address
     * @param merkleProof The merkle inclusion proof of the Bitcoin transaction
     * @param rawTx The raw bytes of the Bitcoin transaction
     * @returns A boolean value indicating whether the execution was successful. The function throws an error otherwise.
     */
    async execute(issueId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<boolean> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }
        const executeIssueTx = this.api.tx.issue.executeIssue(issueId, txId, merkleProof, rawTx);
        const result = await sendLoggedTx(executeIssueTx, this.account, this.api);
        return this.isExecutionSuccessful(result.events);
    }

    /**
     * Send an issue cancellation transaction. After the issue period has elapsed,
     * the issuance of PolkaBTC can be cancelled. As a result, the griefing collateral
     * of the requester will be slashed and sent to the vault that had prepared to issue.
     * @param issueId The ID returned by the issue request transaction
     */
    async cancel(issueId: H256): Promise<void> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        const cancelIssueTx = this.api.tx.issue.cancelIssue(issueId);
        await sendLoggedTx(cancelIssueTx, this.account, this.api);
    }

    /**
     * @returns An array containing the issue requests
     */
    async list(): Promise<IssueRequestExt[]> {
        const issueRequests = await this.api.query.issue.issueRequests.entries();
        return issueRequests.map((v) => v[1]).map((req: IssueRequest) => encodeIssueRequest(req, this.btcNetwork));
    }

    /**
     * @param account The ID of the account whose issue requests are to be retrieved
     * @returns A mapping from the issue request ID to the issue request object, corresponding to the requests of
     * the given account
     */
    async mapForUser(account: AccountId): Promise<Map<H256, IssueRequestExt>> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customAPIRPC = this.api.rpc as any;
        const issueRequestPairs: [H256, IssueRequest][] = await customAPIRPC.issue.getIssueRequests(account);
        const mapForUser: Map<H256, IssueRequestExt> = new Map<H256, IssueRequestExt>();
        issueRequestPairs.forEach((issueRequestPair) =>
            mapForUser.set(issueRequestPair[0], encodeIssueRequest(issueRequestPair[1], this.btcNetwork))
        );
        return mapForUser;
    }

    /**
     * @param amountBtc The amount, in BTC, for which to compute the issue fees
     * @returns The fees, in BTC
     */
    async getFeesToPay(amountBtc: string): Promise<string> {
        const feePercentage = await this.getFeePercentage();
        const feePercentageBN = new Big(feePercentage);
        const amountBig = new Big(amountBtc);
        return amountBig.mul(feePercentageBN).toString();
    }

    /**
     * @returns The fee percentage charged for issuing. For instance, "0.005" stands for 0.005%
     */
    async getFeePercentage(): Promise<string> {
        const issueFee = await this.api.query.fee.issueFee();
        return decodeFixedPointType(issueFee);
    }

    /**
     * @param perPage Number of issue requests to iterate through at a time
     * @returns An AsyncGenerator to be used as an iterator
     */
    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]> {
        return pagedIterator<IssueRequest>(this.api.query.issue.issueRequests, perPage);
    }

    /**
     * @returns The time difference in number of blocks between when an issue request is created
     * and required completion time by a user.
     */
    async getIssuePeriod(): Promise<BlockNumber> {
        return (await this.api.query.issue.issuePeriod()) as BlockNumber;
    }

    /**
     * @param amountSat Amount, in Satoshi, for which to compute the required
     * griefing collateral, in Planck
     * @returns The griefing collateral, in Planck
     */
    async getGriefingCollateralInPlanck(amountSat: string): Promise<string> {
        const griefingCollateralRate = await this.api.query.fee.issueGriefingCollateral();
        const griefingCollateralRateBig = new Big(decodeFixedPointType(griefingCollateralRate));
        const planckPerSatoshi = await this.oracleAPI.getExchangeRate();
        const planckPerSatoshiBig = new Big(planckPerSatoshi);
        const amountSatoshiBig = new Big(amountSat);
        const amountInPlanck = planckPerSatoshiBig.mul(amountSatoshiBig);
        const griefingCollateralPlanck = amountInPlanck.mul(griefingCollateralRateBig).toString();
        return griefingCollateralPlanck;
    }

    /**
     * @param issueId The ID of the issue request to fetch
     * @returns An issue request object
     */
    async getRequestById(issueId: string | Uint8Array | H256): Promise<IssueRequestExt> {
        return encodeIssueRequest(await this.api.query.issue.issueRequests(issueId), this.btcNetwork);
    }

    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void {
        this.account = account;
    }
}
