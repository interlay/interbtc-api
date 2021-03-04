import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, H256, Hash } from "@polkadot/types/interfaces";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { Bytes } from "@polkadot/types/primitive";
import { DOT, H256Le, IssueRequest, PolkaBTC } from "../interfaces/default";
import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import {
    pagedIterator,
    decodeFixedPointType,
    sendLoggedTx,
    roundUpBtcToNearestSatoshi,
    encodeParachainRequest,
} from "../utils";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { DefaultOracleAPI, OracleAPI } from "./oracle";

export type IssueRequestResult = { id: Hash; issueRequest: IssueRequestExt };

export interface IssueRequestExt extends Omit<IssueRequest, "btc_address"> {
    // network encoded btc address
    btc_address: string;
}

export function encodeIssueRequest(req: IssueRequest, network: Network): IssueRequestExt {
    return encodeParachainRequest<IssueRequest, IssueRequestExt>(req, network);
}

/**
 * @category PolkaBTC Bridge
 */
export interface IssueAPI {
    /**
     * Send an issue request transaction
     * @param amountSat PolkaBTC amount (denoted in Satoshi) to issue
     * @param vaultId (optional) Request the issue from a specific vault. If this parameter is unspecified,
     * a random vault will be selected
     * @returns An object of type {issueId, vault} if the request succeeded. The function throws an error otherwise.
     */
    request(amountSat: PolkaBTC, vaultId?: AccountId, griefingCollateral?: DOT): Promise<IssueRequestResult>;
    /**
     * Send an issue execution transaction
     * @param issueId The ID returned by the issue request transaction
     * @param txId The ID of the Bitcoin transaction that sends funds to the vault address
     * @param merkleProof The merkle inclusion proof of the Bitcoin transaction
     * @param rawTx The raw bytes of the Bitcoin transaction
     * @returns A boolean value indicating whether the execution was successful. The function throws an error otherwise.
     */
    execute(issueId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<boolean>;
    /**
     * Send an issue cancellation transaction. After the issue period has elapsed,
     * the issuance of PolkaBTC can be cancelled. As a result, the griefing collateral
     * of the requester will be slashed and sent to the vault that had prepared to issue.
     * @param issueId The ID returned by the issue request transaction
     */
    cancel(issueId: H256): Promise<void>;
    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void;
    /**
     * @param amountSat Amount, in Satoshi, for which to compute the required
     * griefing collateral, in Planck
     * @returns The griefing collateral, in Planck
     */
    getGriefingCollateralInPlanck(amountBtc: string): Promise<string>;
    /**
     * @returns An array containing the issue requests
     */
    list(): Promise<IssueRequestExt[]>;
    /**
     * @param perPage Number of issue requests to iterate through at a time
     * @returns An AsyncGenerator to be used as an iterator
     */
    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]>;
    /**
     * @param account The ID of the account whose issue requests are to be retrieved
     * @returns A mapping from the issue request ID to the issue request object, corresponding to the requests of
     * the given account
     */
    mapForUser(account: AccountId): Promise<Map<H256, IssueRequestExt>>;
    /**
     * @param issueId The ID of the issue request to fetch
     * @returns An issue request object
     */
    getRequestById(issueId: H256): Promise<IssueRequestExt>;
    /**
     * @returns The time difference in number of blocks between when an issue request is created
     * and required completion time by a user.
     */
    getIssuePeriod(): Promise<BlockNumber>;
    /**
     * @param events The EventRecord array returned after sending an request issue transaction
     * @returns A boolean value
     */
    isRequestSuccessful(events: EventRecord[]): boolean;
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
    isExecutionSuccessful(events: EventRecord[]): boolean;
    /**
     * @param amountBtc The amount, in BTC, for which to compute the issue fees
     * @returns The fees, in BTC
     */
    getFeesToPay(amountBtc: string): Promise<string>;
}

export class DefaultIssueAPI implements IssueAPI {
    private vaultsAPI: VaultsAPI;
    private oracleAPI: OracleAPI;
    requestHash: Hash;

    constructor(private api: ApiPromise, private btcNetwork: Network, private account?: AddressOrPair) {
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork);
        this.oracleAPI = new DefaultOracleAPI(api);
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
        for (const { event } of events) {
            if (this.api.events.issue.RequestIssue.is(event)) {
                const hash = this.api.createType("Hash", event.data[0]);
                return hash;
            }
        }
        throw new Error("Request transaction failed");
    }

    isRequestSuccessful(events: EventRecord[]): boolean {
        for (const { event } of events) {
            if (this.api.events.issue.RequestIssue.is(event)) {
                return true;
            }
        }
        return false;
    }

    isExecutionSuccessful(events: EventRecord[]): boolean {
        for (const { event } of events) {
            if (this.api.events.issue.ExecuteIssue.is(event)) {
                return true;
            }
        }
        return false;
    }

    async request(amountSat: PolkaBTC, vaultId?: AccountId): Promise<IssueRequestResult> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        if (!vaultId) {
            vaultId = await this.vaultsAPI.selectRandomVaultIssue(amountSat);
        }
        const griefingCollateralPlanck = await this.getGriefingCollateralInPlanck(amountSat.toString());
        const requestIssueTx = this.api.tx.issue.requestIssue(amountSat, vaultId, griefingCollateralPlanck);
        const result = await sendLoggedTx(requestIssueTx, this.account, this.api);
        if (!this.isRequestSuccessful(result.events)) {
            Promise.reject("Request failed");
        }

        const id = this.getIssueIdFromEvents(result.events);
        const issueRequest = await this.getRequestById(id);
        return { id, issueRequest };
    }

    async execute(issueId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<boolean> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }
        const executeIssueTx = this.api.tx.issue.executeIssue(issueId, txId, merkleProof, rawTx);
        const result = await sendLoggedTx(executeIssueTx, this.account, this.api);
        return this.isExecutionSuccessful(result.events);
    }

    async cancel(issueId: H256): Promise<void> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        const cancelIssueTx = this.api.tx.issue.cancelIssue(issueId);
        await sendLoggedTx(cancelIssueTx, this.account, this.api);
    }

    async list(): Promise<IssueRequestExt[]> {
        const issueRequests = await this.api.query.issue.issueRequests.entries();
        return issueRequests.map((v) => v[1]).map((req: IssueRequest) => encodeIssueRequest(req, this.btcNetwork));
    }

    async mapForUser(account: AccountId): Promise<Map<H256, IssueRequestExt>> {
        const issueRequestPairs: [H256, IssueRequest][] = await this.api.rpc.issue.getIssueRequests(account);
        const mapForUser: Map<H256, IssueRequestExt> = new Map<H256, IssueRequestExt>();
        issueRequestPairs.forEach((issueRequestPair) =>
            mapForUser.set(issueRequestPair[0], encodeIssueRequest(issueRequestPair[1], this.btcNetwork))
        );
        return mapForUser;
    }

    async getFeesToPay(amountBtc: string): Promise<string> {
        const feePercentage = await this.getFeePercentage();
        const feePercentageBN = new Big(feePercentage);
        const amountBig = new Big(amountBtc);
        const feeBtc = amountBig.mul(feePercentageBN);
        return roundUpBtcToNearestSatoshi(feeBtc.toString());
    }

    /**
     * @returns The fee percentage charged for issuing. For instance, "0.005" stands for 0.005%
     */
    async getFeePercentage(): Promise<string> {
        const issueFee = await this.api.query.fee.issueFee();
        return decodeFixedPointType(issueFee);
    }

    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]> {
        return pagedIterator<IssueRequest>(this.api.query.issue.issueRequests, perPage);
    }

    async getIssuePeriod(): Promise<BlockNumber> {
        return (await this.api.query.issue.issuePeriod()) as BlockNumber;
    }

    async getGriefingCollateralInPlanck(amountSat: string): Promise<string> {
        const griefingCollateralRate = await this.api.query.fee.issueGriefingCollateral();
        const griefingCollateralRateBig = new Big(decodeFixedPointType(griefingCollateralRate));
        const planckPerSatoshi = await this.oracleAPI.getRawExchangeRate();
        const amountSatoshiBig = new Big(amountSat);
        const amountInPlanck = planckPerSatoshi.mul(amountSatoshiBig);
        const griefingCollateralPlanck = amountInPlanck.mul(griefingCollateralRateBig).toString();

        // Compute the ceiling of the griefing collateral, because the parachain
        // ignores the decimal place (123.456 -> 123456), because there is nothing
        // smaller than 1 Planck
        const griefingCollateralPlanckRoundedUp = new Big(griefingCollateralPlanck).round(0, 3).toString();
        return griefingCollateralPlanckRoundedUp;
    }

    async getRequestById(issueId: H256): Promise<IssueRequestExt> {
        return encodeIssueRequest(await this.api.query.issue.issueRequests(issueId), this.btcNetwork);
    }

    setAccount(account: AddressOrPair): void {
        this.account = account;
    }
}
