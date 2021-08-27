import { ApiPromise } from "@polkadot/api";
import { AddressOrPair, SubmittableExtrinsic } from "@polkadot/api/submittable/types";
import { Bytes } from "@polkadot/types";
import { AccountId, H256, Hash, EventRecord, Header } from "@polkadot/types/interfaces";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { Bitcoin, BTCAmount, Currency, MonetaryAmount, Polkadot } from "@interlay/monetary-js";

import { IssueRequest } from "../interfaces/default";
import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import {
    decodeFixedPointType,
    getTxProof,
    allocateAmountsToVaults,
    getRequestIdsFromEvents,
    storageKeyToNthInner,
    ensureHashEncoded,
    addHexPrefix,
    parseIssueRequest,
} from "../utils";
import { DefaultFeeAPI, FeeAPI } from "./fee";
import { ElectrsAPI } from "../external";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { CollateralUnit, Issue, IssueStatus } from "../types";
import BN from "bn.js";

export type IssueLimits = { singleVaultMaxIssuable: BTCAmount; totalMaxIssuable: BTCAmount };

/**
 * @category InterBTC Bridge
 */
export interface IssueAPI extends TransactionAPI {
    /**
     * Gets the threshold for issuing with a single vault, and the maximum total
     * issue request size. Additionally passes the list of vaults for caching.
     * @param vaults (optional) A list of the vaults available to issue from. If not provided, will fetch from the
     * parachain (incurring an extra request).
     * @returns An object of type {singleVault, maxTotal, vaultsCache}
     */
    getRequestLimits(vaults?: Map<AccountId, BTCAmount>): Promise<IssueLimits>;

    /**
     * Request issuing of InterBTC.
     * @param amount InterBTC amount to issue.
     * @param vaultId (optional) ID of the vault to issue with.
     * @param atomic (optional) Whether the issue request should be handled atomically or not. Only makes a difference
     * if more than one vault is needed to fulfil it. Defaults to false.
     * @param retries (optional) Number of times to re-try issuing, if some of the requests fail. Defaults to 0.
     * @param availableVaults (optional) A list of all vaults usable for issue. If not provided, will fetch from the parachain.
     * @returns An array of type {issueId, issueRequest} if the requests succeeded. The function throws an error otherwise.
     */
    request(
        amount: BTCAmount,
        vaultId?: AccountId,
        atomic?: boolean,
        retries?: number,
        availableVaults?: Map<AccountId, BTCAmount>
    ): Promise<Issue[]>;

    /**
     * Send a batch of aggregated issue transactions (to one or more vaults)
     * @param amountsPerVault A mapping of vaults to issue from, and InterBTC amounts to issue using each vault
     * @param atomic Whether the issue request should be handled atomically or not. Only makes a difference if more than
     * one vault is needed to fulfil it.
     * @returns An array of `Issue` objects, if the requests succeeded.
     * @throws Rejects the promise if none of the requests succeeded (or if at least one failed, when atomic=true).
     */
    requestAdvanced(amountsPerVault: Map<AccountId, BTCAmount>, atomic: boolean): Promise<Issue[]>;

    /**
     * Send an issue execution transaction
     * @remarks If `txId` is not set, the `merkleProof` and `rawTx` must both be set.
     *
     * @param issueId The ID returned by the issue request transaction
     * @param txId (Optional) The ID of the Bitcoin transaction that sends funds to the vault address.
     * @param merkleProof (Optional) The merkle inclusion proof of the Bitcoin transaction.
     * @param rawTx (Optional) The raw bytes of the Bitcoin transaction
     */
    execute(issueId: string, txId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void>;
    /**
     * Send an issue cancellation transaction. After the issue period has elapsed,
     * the issuance of InterBTC can be cancelled. As a result, the griefing collateral
     * of the requester will be slashed and sent to the vault that had prepared to issue.
     * @param issueId The ID returned by the issue request transaction
     */
    cancel(issueId: string): Promise<void>;
    /**
     * @remarks Testnet utility function
     * @param blocks The time difference in number of blocks between an issue request is created
     * and required completion time by a user. The issue period has an upper limit
     * to prevent griefing of vault collateral.
     */
    setIssuePeriod(blocks: number): Promise<void>;
    /**
     *
     * @returns The time difference in number of blocks between an issue request is created
     * and required completion time by a user. The issue period has an upper limit
     * to prevent griefing of vault collateral.
     */
    getIssuePeriod(): Promise<number>;
    /**
     * @returns An array containing the issue requests
     */
    list(): Promise<Issue[]>;
    /**
     * @param account The ID of the account whose issue requests are to be retrieved
     * @returns A mapping from the issue request ID to the issue request object, corresponding to the requests of
     * the given account
     */
    mapForUser(account: AccountId): Promise<Map<H256, Issue>>;
    /**
     * @param issueId The ID of the issue request to fetch
     * @returns An issue request object
     */
    getRequestById(issueId: H256 | string): Promise<Issue>;
    /**
     * @param issueId The IDs of the batch of issue request to fetch
     * @returns The issue request objects
     */
    getRequestsByIds(issueIds: (H256 | string)[]): Promise<Issue[]>;
    /**
     * @returns The fee charged for issuing. For instance, "0.005" stands for 0.5%
     */
    getFeeRate(): Promise<Big>;
    /**
     * @param amount The amount, in BTC, for which to compute the issue fees
     * @returns The fees, in BTC
     */
    getFeesToPay(amount: BTCAmount): Promise<BTCAmount>;
    /**
     * @param amountBtc The amount, in BTC, for which to compute the griefing collateral
     * @param collateralCurrency The collateral, as a currency object (using `Monetary.js`)
     * @returns The griefing collateral, in DOT
     */
    getGriefingCollateral<C extends CollateralUnit>(
        amount: BTCAmount,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * Whenever an issue request associated with `account` expires, call the callback function with the
     * ID of the expired request. Already expired requests are stored in memory, so as not to call back
     * twice for the same request.
     * @param account The ID of the account whose issue requests are to be checked for expiry
     * @param callback Function to be called whenever an issue request expires
     */
    subscribeToIssueExpiry(account: AccountId, callback: (requestIssueId: H256) => void): Promise<() => void>;
}

export class DefaultIssueAPI extends DefaultTransactionAPI implements IssueAPI {
    private vaultsAPI: VaultsAPI;
    private feeAPI: FeeAPI;

    constructor(api: ApiPromise, private btcNetwork: Network, private electrsAPI: ElectrsAPI, account?: AddressOrPair) {
        super(api, account);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork, electrsAPI);
        this.feeAPI = new DefaultFeeAPI(api);
    }

    async getRequestLimits(vaults?: Map<AccountId, BTCAmount>): Promise<IssueLimits> {
        if (!vaults) vaults = await this.vaultsAPI.getVaultsWithIssuableTokens();
        const vaultsArr = [...vaults.entries()];
        if (vaultsArr.length === 0) {
            return { singleVaultMaxIssuable: BTCAmount.zero, totalMaxIssuable: BTCAmount.zero };
        }
        const singleVaultMaxIssuable = vaultsArr[0][1];
        const totalMaxIssuable = vaultsArr.reduce((total, [_, vaultAvailable]) => {
            return total.add(vaultAvailable);
        }, BTCAmount.zero);
        return { singleVaultMaxIssuable, totalMaxIssuable };
    }

    /**
     * @param events The EventRecord array returned after sending an issue request transaction
     * @returns The issueId associated with the request. If the EventRecord array does not
     * contain issue request events, the function throws an error.
     */
    private getIssueIdsFromEvents(events: EventRecord[]): Hash[] {
        return getRequestIdsFromEvents(events, this.api.events.issue.RequestIssue, this.api);
    }

    async request(
        amount: BTCAmount,
        vaultId?: AccountId,
        atomic: boolean = true,
        retries: number = 0,
        cachedVaults?: Map<AccountId, BTCAmount>
    ): Promise<Issue[]> {
        try {
            if (vaultId) {
                // If a vault account id is defined, request to issue with that vault only.
                // Initialize the `amountsPerVault` map with a single entry, the (vaultId, amount) pair
                const amountsPerVault = new Map<AccountId, BTCAmount>([[vaultId, amount]]);
                return await this.requestAdvanced(amountsPerVault, atomic);
            }
            const availableVaults = cachedVaults || (await this.vaultsAPI.getVaultsWithIssuableTokens());
            const amountsPerVault = allocateAmountsToVaults(availableVaults, amount);
            const result = await this.requestAdvanced(amountsPerVault, atomic);
            const successfulSum = result.reduce((sum, req) => sum.add(req.amountInterBTC), BTCAmount.zero);
            const remainder = amount.sub(successfulSum);
            if (remainder.isZero() || retries === 0) return result;
            else {
                return (await this.request(remainder, vaultId, atomic, retries - 1, availableVaults)).concat(result);
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async requestAdvanced(
        amountsPerVault: Map<AccountId, BTCAmount>,
        atomic: boolean,
        collateralCurrency = Polkadot
    ): Promise<Issue[]> {
        const txs = new Array<SubmittableExtrinsic<"promise">>();
        for (const [vault, amount] of amountsPerVault) {
            let griefingCollateral = await this.getGriefingCollateral(amount, collateralCurrency);
            // add() here is a hacky workaround for rounding errors
            const oneHundred = new MonetaryAmount<typeof collateralCurrency, typeof collateralCurrency.units>(
                collateralCurrency,
                100,
                collateralCurrency.rawBase
            );
            griefingCollateral = griefingCollateral.add(oneHundred);
            txs.push(
                this.api.tx.issue.requestIssue(
                    amount.toString(Bitcoin.units.Satoshi),
                    vault,
                    griefingCollateral.toString(Bitcoin.units.Satoshi)
                )
            );
        }
        // batchAll fails atomically, batch allows partial successes
        const batch = (atomic ? this.api.tx.utility.batchAll : this.api.tx.utility.batch)(txs);
        try {
            const result = await this.sendLogged(batch, this.api.events.issue.RequestIssue);
            const ids = this.getIssueIdsFromEvents(result.events);
            const issueRequests = await this.getRequestsByIds(ids);
            return issueRequests;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async execute(requestId: string, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void> {
        const parsedRequestId = ensureHashEncoded(this.api, requestId);
        [merkleProof, rawTx] = await getTxProof(this.electrsAPI, btcTxId, merkleProof, rawTx);
        const executeIssueTx = this.api.tx.issue.executeIssue(parsedRequestId, merkleProof, rawTx);
        await this.sendLogged(executeIssueTx, this.api.events.issue.ExecuteIssue);
    }

    async cancel(requestId: string): Promise<void> {
        const parsedRequestId = this.api.createType("H256", addHexPrefix(requestId));
        const cancelIssueTx = this.api.tx.issue.cancelIssue(parsedRequestId);
        await this.sendLogged(cancelIssueTx, this.api.events.issue.CancelIssue);
    }

    async setIssuePeriod(blocks: number): Promise<void> {
        const period = this.api.createType("BlockNumber", blocks);
        const tx = this.api.tx.sudo.sudo(this.api.tx.issue.setIssuePeriod(period));
        await this.sendLogged(tx);
    }

    async getIssuePeriod(): Promise<number> {
        const blockNumber = await this.api.query.issue.issuePeriod();
        return blockNumber.toNumber();
    }

    async list(): Promise<Issue[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const issueRequests = await this.api.query.issue.issueRequests.entriesAt(head);
        return issueRequests.map(([id, req]) => parseIssueRequest(req, this.btcNetwork, storageKeyToNthInner(id)));
    }

    async mapForUser(account: AccountId): Promise<Map<H256, Issue>> {
        const issueRequestPairs: [H256, IssueRequest][] = await this.api.rpc.issue.getIssueRequests(account);
        const mapForUser: Map<H256, Issue> = new Map<H256, Issue>();
        issueRequestPairs.forEach((issueRequestPair) =>
            mapForUser.set(
                issueRequestPair[0],
                parseIssueRequest(issueRequestPair[1], this.btcNetwork, issueRequestPair[0])
            )
        );
        return mapForUser;
    }

    async getGriefingCollateral<C extends CollateralUnit>(
        amount: BTCAmount,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const griefingCollateralRate = await this.feeAPI.getIssueGriefingCollateralRate();
        return await this.feeAPI.getGriefingCollateral(amount, griefingCollateralRate, collateralCurrency);
    }

    async getFeesToPay(amount: BTCAmount): Promise<BTCAmount> {
        const feePercentage = await this.getFeeRate();
        return amount.mul(feePercentage);
    }

    /**
     * @returns The fee charged for issuing. For instance, "0.005" stands for 0.5%
     */
    async getFeeRate(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const issueFee = await this.api.query.fee.issueFee.at(head);
        return decodeFixedPointType(issueFee);
    }

    async getRequestById(issueId: H256 | string): Promise<Issue> {
        return (await this.getRequestsByIds([issueId]))[0];
    }

    async getRequestsByIds(issueIds: (H256 | string)[]): Promise<Issue[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return Promise.all(
            issueIds.map(async (issueId) =>
                parseIssueRequest(
                    await this.api.query.issue.issueRequests.at(head, ensureHashEncoded(this.api, issueId)),
                    this.btcNetwork,
                    issueId
                )
            )
        );
    }

    async subscribeToIssueExpiry(account: AccountId, callback: (requestIssueId: H256) => void): Promise<() => void> {
        const issuePeriod = await this.getIssuePeriod();
        const unsubscribe = this.onIssue(
            account,
            (seen: Set<H256>, request: Issue, id: H256, currentBlockNumber: BN) => {
                if (
                    currentBlockNumber.gtn(request.creationBlock + issuePeriod) &&
                    !seen.has(id) &&
                    request.status === IssueStatus.PendingWithBtcTxNotFound
                ) {
                    seen.add(id);
                    callback(id);
                }
            }
        );
        return unsubscribe;
    }

    async onIssue(
        account: AccountId,
        fn: (set: Set<H256>, request: Issue, id: H256, blockNumber: BN) => void
    ): Promise<() => void> {
        const seen = new Set<H256>();
        try {
            const unsubscribe = await this.api.rpc.chain.subscribeFinalizedHeads(async (header: Header) => {
                const issueRequests = await this.mapForUser(account);
                issueRequests.forEach((request, id) => {
                    fn(seen, request, id, header.number.toBn());
                });
            });
            return unsubscribe;
        } catch (error) {
            return Promise.reject(new Error(`Error onIssue: ${error}`));
        }
    }
}
