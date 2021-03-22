import { ApiPromise } from "@polkadot/api";
import { AddressOrPair, SubmittableExtrinsic } from "@polkadot/api/submittable/types";
import { AccountId, H256, Hash } from "@polkadot/types/interfaces";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { Bytes } from "@polkadot/types/primitive";
import { DOT, H256Le, IssueRequest, PolkaBTC } from "../interfaces/default";
import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import {
    pagedIterator,
    decodeFixedPointType,
    Transaction,
    roundUpBtcToNearestSatoshi,
    encodeParachainRequest,
    ACCOUNT_NOT_SET_ERROR_MESSAGE,
} from "../utils";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { DefaultFeeAPI, FeeAPI } from "./fee";

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
     * Request issuing of PolkaBTC.
     * @param amountSat PolkaBTC amount (denoted in Satoshi) to issue.
     * @returns An array of type {issueId, vault, error} if the requests succeeded. error will be null for successful
     * requests; issueId and vault will be null for failed ones.
     */
    request(amountSat: PolkaBTC): Promise<IssueRequestResult[]>;

    /**
     * Send a batch of aggregated issue transactions (to one or more vaults)
     * @param amountSat PolkaBTC amounts (denoted in Satoshi) to issue using each vault
     * @param vaultId The vaults from which to request issue
     * @returns An array of type {issueId, vault, error} if the requests succeeded. error will be null for successful
     * requests; issueId and vault will be null for failed ones.
     */
    requestAdvanced(
        amountsPerVault: Map<AccountId, PolkaBTC>,
        griefingCollateralRate: Big
    ): Promise<IssueRequestResult[]>;

    /**
     * Send an issue execution transaction
     * @param issueId The ID or IDs returned by the issue request transaction
     * @param txId The ID of the Bitcoin transaction that sends funds to the vault address(es)
     * @param merkleProof The merkle inclusion proof of the Bitcoin transaction
     * @param rawTx The raw bytes of the Bitcoin transaction
     */
    execute(issueId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<void>;

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
     * @param issueId The IDs of the batch of issue request to fetch
     * @returns The issue request objects
     */
    getRequestsByIds(issueIds: H256[]): Promise<IssueRequestExt[]>;
    /**
     * @returns The time difference in number of blocks between when an issue request is created
     * and required completion time by a user.
     */
    getIssuePeriod(): Promise<BlockNumber>;
    /**
     * @returns The fee charged for issuing. For instance, "0.005" stands for 0.5%
     */
    getFeeRate(): Promise<Big>;
    /**
     * @param amountBtc The amount, in BTC, for which to compute the issue fees
     * @returns The fees, in BTC
     */
    getFeesToPay(amountBtc: string): Promise<string>;
    /**
     * @param amountBtc The amount, in Satoshi, for which to compute the griefing collateral
     * @returns The griefing collateral, in Planck
     */
    getGriefingCollateralInPlanck(amountSat: PolkaBTC): Promise<Big>;
}

export class DefaultIssueAPI implements IssueAPI {
    private vaultsAPI: VaultsAPI;
    private feeAPI: FeeAPI;
    transaction: Transaction;

    constructor(private api: ApiPromise, private btcNetwork: Network, private account?: AddressOrPair) {
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork);
        this.feeAPI = new DefaultFeeAPI(api);
        this.transaction = new Transaction(api);
    }

    /**
     * @param events The EventRecord array returned after sending an issue request transaction
     * @returns The issueId associated with the request. If the EventRecord array does not
     * contain issue request events, the function throws an error.
     */
    private getRequestIdsFromEvents(events: EventRecord[]): Hash[] {
        const ids = new Array<Hash>();
        for (const { event } of events) {
            if (this.api.events.issue.RequestIssue.is(event)) {
                const hash = this.api.createType("Hash", event.data[0]);
                ids.push(hash);
            }
        }
        if (ids.length > 0) return ids;
        throw new Error("Request transaction failed");
    }

    private allocateAmountsToVaults(
        vaultsWithIssuableTokens: Map<AccountId, PolkaBTC>,
        amountToAllocate: PolkaBTC
    ): Map<AccountId, PolkaBTC> {
        return new Map(
            [...vaultsWithIssuableTokens.entries()]
                .sort((a, b) => b[1].sub(a[1]).toNumber()) // vaults in descending order of capacity
                .map(([vault, available]): [AccountId, PolkaBTC] => {
                    const allocated = available.lte(amountToAllocate) ? available : amountToAllocate; // bootleg min
                    amountToAllocate = amountToAllocate.sub(allocated) as PolkaBTC;
                    return [vault, allocated];
                })
                .filter(([_, allocated]) => allocated.gtn(0))
        );
    }

    async request(amountSat: PolkaBTC): Promise<IssueRequestResult[]> {
        if (!this.account) {
            return Promise.reject(ACCOUNT_NOT_SET_ERROR_MESSAGE);
        }

        try {
            const availableVaults = await this.vaultsAPI.getVaultsWithIssuableTokens();
            const griefingCollateralRate = await this.feeAPI.getIssueGriefingCollateralRate();
            const amountsPerVault = this.allocateAmountsToVaults(availableVaults, amountSat);
            return this.requestAdvanced(amountsPerVault, griefingCollateralRate);
        } catch (e) {
            return Promise.reject(e.message);
        }
    }

    async requestAdvanced(
        amountsPerVault: Map<AccountId, PolkaBTC>,
        griefingCollateralRate: Big
    ): Promise<IssueRequestResult[]> {
        if (!this.account) {
            return Promise.reject(ACCOUNT_NOT_SET_ERROR_MESSAGE);
        }

        const txes = new Array<SubmittableExtrinsic<"promise">>();
        for (const [vault, amount] of amountsPerVault) {
            console.log(`Vault: ${vault}, amount: ${amount}`);
            const griefingCollateral = await this.feeAPI.getGriefingCollateralInPlanck(amount, griefingCollateralRate);
            txes.push(this.api.tx.issue.requestIssue(amount, vault, griefingCollateral.toString()));
        }
        const batch = this.api.tx.utils.batch(txes);
        try {
            const result = await this.transaction.sendLogged(batch, this.account, this.api.events.issue.RequestIssue);
            const ids = this.getRequestIdsFromEvents(result.events);
            const issueRequests = await this.getRequestsByIds(ids);
            console.log("\n\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n\n");
            console.log(ids);
            console.log(issueRequests);
            console.log("\n\nBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB\n\n");
            return ids.map((issueId, idx) => ({ id: issueId, issueRequest: issueRequests[idx] }));
        } catch (e) {
            return Promise.reject(e.message);
        }
    }

    async execute(issueId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<void> {
        if (!this.account) {
            return Promise.reject(ACCOUNT_NOT_SET_ERROR_MESSAGE);
        }
        const executeIssueTx = this.api.tx.issue.executeIssue(issueId, txId, merkleProof, rawTx);
        await this.transaction.sendLogged(executeIssueTx, this.account, this.api.events.issue.ExecuteIssue);
    }

    async cancel(issueId: H256): Promise<void> {
        if (!this.account) {
            return Promise.reject(ACCOUNT_NOT_SET_ERROR_MESSAGE);
        }

        const cancelIssueTx = this.api.tx.issue.cancelIssue(issueId);
        await this.transaction.sendLogged(cancelIssueTx, this.account, this.api.events.issue.CancelIssue);
    }

    async list(): Promise<IssueRequestExt[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const issueRequests = await this.api.query.issue.issueRequests.entriesAt(head);
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

    async getGriefingCollateralInPlanck(amountSat: PolkaBTC): Promise<Big> {
        const griefingCollateralRate = await this.feeAPI.getIssueGriefingCollateralRate();
        return await this.feeAPI.getGriefingCollateralInPlanck(amountSat, griefingCollateralRate);
    }

    async getFeesToPay(amountBtc: string): Promise<string> {
        const feePercentage = await this.getFeeRate();
        const amountBig = new Big(amountBtc);
        const feeBtc = amountBig.mul(feePercentage);
        return roundUpBtcToNearestSatoshi(feeBtc.toString());
    }

    /**
     * @returns The fee charged for issuing. For instance, "0.005" stands for 0.5%
     */
    async getFeeRate(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const issueFee = await this.api.query.fee.issueFee.at(head);
        // TODO: return Big from decodeFixedPointType
        return new Big(decodeFixedPointType(issueFee));
    }

    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]> {
        return pagedIterator<IssueRequest>(this.api.query.issue.issueRequests, perPage);
    }

    async getIssuePeriod(): Promise<BlockNumber> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return (await this.api.query.issue.issuePeriod.at(head)) as BlockNumber;
    }

    async getRequestById(issueId: H256): Promise<IssueRequestExt> {
        return (await this.getRequestsByIds([issueId]))[0];
    }

    async getRequestsByIds(issueIds: H256[]): Promise<IssueRequestExt[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return Promise.all(
            issueIds.map(async (issueId) =>
                encodeIssueRequest(await this.api.query.issue.issueRequests.at(head, issueId), this.btcNetwork)
            )
        );
    }

    setAccount(account: AddressOrPair): void {
        this.account = account;
    }
}
