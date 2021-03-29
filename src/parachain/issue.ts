import { ApiPromise } from "@polkadot/api";
import { AddressOrPair, SubmittableExtrinsic } from "@polkadot/api/submittable/types";
import { AccountId, H256, Hash } from "@polkadot/types/interfaces";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { Bytes } from "@polkadot/types/primitive";
import { H256Le, IssueRequest, PolkaBTC } from "../interfaces/default";
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
import BN from "bn.js";

export type IssueRequestResult = { id: Hash; issueRequest: IssueRequestExt };
export type IssueLimits = { singleVaultMaxIssuable: PolkaBTC; totalMaxIssuable: PolkaBTC };

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
     * Gets the threshold for issuing with a single vault, and the maximum total
     * issue request size. Additionally passes the list of vaults for caching.
     * @param vaults (optional) A list of the vaults available to issue from. If not provided, will fetch from the
     * parachain (incurring an extra request).
     * @returns An object of type {singleVault, maxTotal, vaultsCache}
     */
    getRequestLimits(vaults?: Map<AccountId, PolkaBTC>): Promise<IssueLimits>;

    /**
     * Request issuing of PolkaBTC.
     * @param amountSat PolkaBTC amount (denoted in Satoshi) to issue.
     * @param availableVaults (optional) A list of all vaults usable for issue. If not provided, will fetch from the
     * parachain (incurring an extra request).
     * @param atomic (optional) Whether the issue request should be handled atomically or not. Only makes a difference
     * if more than one vault is needed to fulfil it. Defaults to false.
     * @returns An array of type {issueId, vault, error} if the requests succeeded. error will be null for successful
     * requests; issueId and vault will be null for failed ones.
     */
    request(
        amountSat: PolkaBTC,
        availableVaults?: Map<AccountId, PolkaBTC>,
        atomic?: boolean
    ): Promise<IssueRequestResult[]>;

    /**
     * Send a batch of aggregated issue transactions (to one or more vaults)
     * @param amountsPerVault A mapping of vaults to issue from, and PolkaBTC amounts (in Satoshi) to issue using each vault
     * @param griefingCollateralRate The percentage of an issue request which must be locked as griefing collateral
     * (must correspond to the parachain property)
     * @param atomic Whether the issue request should be handled atomically or not. Only makes a difference if more than
     * one vault is needed to fulfil it.
     * @returns An array of type {issueId, vault, error} if the requests succeeded. error will be null for successful
     * requests; issueId and vault will be null for failed ones.
     * @throws Rejects the promise if none of the requests succeeded (or if at least one failed, when atomic=true).
     */
    requestAdvanced(
        amountsPerVault: Map<AccountId, PolkaBTC>,
        griefingCollateralRate: Big,
        atomic: boolean
    ): Promise<IssueRequestResult[]>;

    /**
     * Send an issue execution transaction
     * @param issueId The ID returned by the issue request transaction
     * @param txId The ID of the Bitcoin transaction that sends funds to the vault address
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

    async getRequestLimits(vaults?: Map<AccountId, PolkaBTC>): Promise<IssueLimits> {
        if (!vaults) vaults = await this.vaultsAPI.getVaultsWithIssuableTokens();
        const [singleVaultMaxIssuable, totalMaxIssuable] = [...vaults.entries()].reduce(
            ([singleVault, maxTotal], [_, vaultAvailable]) => {
                maxTotal.iadd(vaultAvailable);
                singleVault = BN.max(singleVault, vaultAvailable) as PolkaBTC;
                return [singleVault, maxTotal];
            },
            [new BN(0) as PolkaBTC, new BN(0) as PolkaBTC]
        );
        return { singleVaultMaxIssuable, totalMaxIssuable };
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
        const maxReservationPercent = 100; // don't reserve more than 90% of a vault's collateral
        const allocations = new Map<AccountId, PolkaBTC>();
        // iterable array in ascending order of issuing capacity:
        const vaultsArray = [...vaultsWithIssuableTokens.entries()].reverse().map((entry) => [entry[0],
            entry[1].divn(100).muln(maxReservationPercent)] as [AccountId, PolkaBTC]);
        console.log(`AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa\n starting to allocate: ${amountToAllocate.toString()}`);
        while (amountToAllocate.gtn(0)) {
            // find first vault that can fulfil request (or undefined if none)
            const firstSuitable = vaultsArray.findIndex(([_, available]) => available.gte(amountToAllocate));
            console.log(`index ${firstSuitable} will be used`);
            let vault, amount;
            if (firstSuitable !== -1) {
                // at least one vault can fulfil in full
                // select random vault able to fulfil request
                const range = vaultsArray.length - firstSuitable;
                const idx = Math.floor(Math.random() * range) + firstSuitable;
                console.log(`Selecting vault at index ${idx}`);
                vault = vaultsArray[idx][0];
                amount = amountToAllocate;
                console.log(`Allocating ${amount} to ${vault} all at once`);
            } else {
                // else allocate greedily
                if (vaultsArray.length === 0) throw new Error("Insufficient capacity to fulfil request");
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const largestVault = vaultsArray.pop()!; // length >= 1, so never undefined
                [vault, amount] = largestVault;
                console.log(`Allocating ${amount} to ${vault} as part of batching`);
            }
            allocations.set(vault, amount.clone() as PolkaBTC);
            amountToAllocate.isub(amount);
        }

        console.log(`BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB\n finished allocating`);
        return allocations;
    }

    private printMap(prefix: string, map: Map<AccountId, PolkaBTC>) {
        console.log([...map.entries()].reduce((acc, entry) =>
            acc += `vault: ${entry[0]}, amount: ${entry[1]}; `
        , prefix));
    }

    async request(
        amountSat: PolkaBTC,
        availableVaults?: Map<AccountId, PolkaBTC>,
        atomic = false
    ): Promise<IssueRequestResult[]> {
        if (!this.account) {
            return Promise.reject(ACCOUNT_NOT_SET_ERROR_MESSAGE);
        }

        try {
            if (!availableVaults) availableVaults = await this.vaultsAPI.getVaultsWithIssuableTokens();
            this.printMap("Available vaults: ", availableVaults);
            const griefingCollateralRate = await this.feeAPI.getIssueGriefingCollateralRate();
            const amountsPerVault = this.allocateAmountsToVaults(availableVaults, amountSat);
            this.printMap("Allocated amounts: ", amountsPerVault);
            return this.requestAdvanced(amountsPerVault, griefingCollateralRate, atomic);
        } catch (e) {
            return Promise.reject(e.message);
        }
    }

    async requestAdvanced(
        amountsPerVault: Map<AccountId, PolkaBTC>,
        griefingCollateralRate: Big,
        atomic: boolean
    ): Promise<IssueRequestResult[]> {
        if (!this.account) {
            return Promise.reject(ACCOUNT_NOT_SET_ERROR_MESSAGE);
        }

        const txes = new Array<SubmittableExtrinsic<"promise">>();
        for (const [vault, amount] of amountsPerVault) {
            const griefingCollateral = await this.feeAPI.getGriefingCollateralInPlanck(amount, griefingCollateralRate);
            txes.push(this.api.tx.issue.requestIssue(amount, vault, griefingCollateral.toString()));
        }
        const batch = (atomic ? this.api.tx.utility.batchAll : this.api.tx.utility.batch)(txes);
        console.log(`Atomic: ${atomic}`);
        try {
            const result = await this.transaction.sendLogged(batch, this.account, this.api.events.issue.RequestIssue);
            const ids = this.getRequestIdsFromEvents(result.events);
            console.log(ids);
            const issueRequests = await this.getRequestsByIds(ids);
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
