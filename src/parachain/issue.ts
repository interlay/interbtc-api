import { ApiPromise } from "@polkadot/api";
import { AddressOrPair, SubmittableExtrinsic } from "@polkadot/api/submittable/types";
import { Bytes } from "@polkadot/types";
import { AccountId, H256, Hash, EventRecord, Header } from "@polkadot/types/interfaces";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { Bitcoin, BitcoinUnit, Currency, MonetaryAmount } from "@interlay/monetary-js";

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
    newMonetaryAmount,
} from "../utils";
import { DefaultFeeAPI, FeeAPI } from "./fee";
import { ElectrsAPI } from "../external";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { CollateralUnit, Issue, IssueStatus, WrappedCurrency } from "../types";
import BN from "bn.js";

export type IssueLimits = {
    singleVaultMaxIssuable: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    totalMaxIssuable: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
};

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
    getRequestLimits(vaults?: Map<AccountId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>): Promise<IssueLimits>;

    /**
     * Request issuing wrapped tokens (e.g. interBTC, kBTC).
     * @param amount wrapped token amount to issue.
     * @param vaultId (optional) ID of the vault to issue with.
     * @param atomic (optional) Whether the issue request should be handled atomically or not. Only makes a difference
     * if more than one vault is needed to fulfil it. Defaults to false.
     * @param retries (optional) Number of times to retry issuing, if some of the requests fail. Defaults to 0.
     * @param availableVaults (optional) A list of all vaults usable for issue. If not provided, will fetch from the parachain.
     * @returns An array of type {issueId, issueRequest} if the requests succeeded. The function throws an error otherwise.
     */
    request(
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>,
        vaultId?: AccountId,
        atomic?: boolean,
        retries?: number,
        availableVaults?: Map<AccountId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>
    ): Promise<Issue[]>;

    /**
     * Send a batch of aggregated issue transactions (to one or more vaults)
     * @param amountsPerVault A mapping of vaults to issue from, and wrapped token amounts to issue using each vault
     * @param atomic Whether the issue request should be handled atomically or not. Only makes a difference if more than
     * one vault is needed to fulfil it.
     * @returns An array of `Issue` objects, if the requests succeeded.
     * @throws Rejects the promise if none of the requests succeeded (or if at least one failed, when atomic=true).
     */
    requestAdvanced(
        amountsPerVault: Map<AccountId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>,
        atomic: boolean
    ): Promise<Issue[]>;

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
     * the issuance request can be cancelled. As a result, the griefing collateral
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
    getFeesToPay(amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     * @param amountBtc The amount, in BTC, for which to compute the griefing collateral
     * @param collateralCurrency The collateral, as a currency object (using `Monetary.js`)
     * @returns The griefing collateral, a collateral currency amount
     */
    getGriefingCollateral<C extends CollateralUnit>(
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>,
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
    /**
     * Fetch the issue requests associated with a vault
     *
     * @param vaultId The AccountId of the vault used to filter issue requests
     * @returns A map with issue ids to issue requests involving said vault
     */
    mapIssueRequests(vaultId: AccountId): Promise<Map<H256, Issue>>;
}

export class DefaultIssueAPI extends DefaultTransactionAPI implements IssueAPI {
    private vaultsAPI: VaultsAPI;
    private feeAPI: FeeAPI;

    constructor(
        api: ApiPromise,
        private btcNetwork: Network,
        private electrsAPI: ElectrsAPI,
        private wrappedCurrency: WrappedCurrency,
        account?: AddressOrPair
    ) {
        super(api, account);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork, electrsAPI, wrappedCurrency);
        this.feeAPI = new DefaultFeeAPI(api, wrappedCurrency);
    }

    async getRequestLimits(vaults?: Map<AccountId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>): Promise<IssueLimits> {
        if (!vaults) vaults = await this.vaultsAPI.getVaultsWithIssuableTokens();
        const vaultsArr = [...vaults.entries()];
        if (vaultsArr.length === 0) {
            return {
                singleVaultMaxIssuable: newMonetaryAmount(0, this.wrappedCurrency),
                totalMaxIssuable: newMonetaryAmount(0, this.wrappedCurrency),
            };
        }
        const singleVaultMaxIssuable = vaultsArr[0][1];
        const totalMaxIssuable = vaultsArr.reduce((total, [_, vaultAvailable]) => {
            return total.add(vaultAvailable);
        }, newMonetaryAmount(0, this.wrappedCurrency));
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
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>,
        vaultId?: AccountId,
        atomic: boolean = true,
        retries: number = 0,
        cachedVaults?: Map<AccountId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>
    ): Promise<Issue[]> {
        try {
            if (vaultId) {
                // If a vault account id is defined, request to issue with that vault only.
                // Initialize the `amountsPerVault` map with a single entry, the (vaultId, amount) pair
                const amountsPerVault = new Map<AccountId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>([
                    [vaultId, amount],
                ]);
                return await this.requestAdvanced(amountsPerVault, atomic);
            }
            const availableVaults = cachedVaults || (await this.vaultsAPI.getVaultsWithIssuableTokens());
            const amountsPerVault = allocateAmountsToVaults(availableVaults, amount);
            const result = await this.requestAdvanced(amountsPerVault, atomic);
            const successfulSum = result.reduce(
                (sum, req) => sum.add(req.wrappedAmont),
                newMonetaryAmount(0, this.wrappedCurrency)
            );
            const remainder = amount.sub(successfulSum);
            if (remainder.isZero() || retries === 0) return result;
            else {
                return (await this.request(remainder, vaultId, atomic, retries - 1, availableVaults)).concat(result);
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async craftRequestTx(
        vaultId: AccountId,
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>
    ): Promise<SubmittableExtrinsic<"promise">> {
        const vault = await this.vaultsAPI.get(vaultId);
        let griefingCollateral = await this.getGriefingCollateral(amount, vault.collateralCurrency);
        // add() here is a hacky workaround for rounding errors
        const oneHundred = newMonetaryAmount(100, vault.collateralCurrency);
        griefingCollateral = griefingCollateral.add(oneHundred);
        return this.api.tx.issue.requestIssue(
            amount.toString(amount.currency.rawBase),
            vaultId,
            griefingCollateral.toString(Bitcoin.units.Satoshi)
        );
    }

    async requestAdvanced(
        amountsPerVault: Map<AccountId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>,
        atomic: boolean
    ): Promise<Issue[]> {
        const txs = await Promise.all(
            Array.from(amountsPerVault.entries()).map(
                ([vaultId, amount]) =>
                    new Promise<SubmittableExtrinsic<"promise">>((resolve) => {
                        this.craftRequestTx(vaultId, amount).then((tx) => resolve(tx));
                    })
            )
        );
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
        return await Promise.all(
            issueRequests.map(([id, req]) =>
                parseIssueRequest(this.vaultsAPI, req, this.btcNetwork, storageKeyToNthInner(id))
            )
        );
    }

    async mapForUser(account: AccountId): Promise<Map<H256, Issue>> {
        const issueRequestPairs: [H256, IssueRequest][] = await this.api.rpc.issue.getIssueRequests(account);
        const mapForUser: Map<H256, Issue> = new Map<H256, Issue>();
        await Promise.all(
            issueRequestPairs.map(
                (issueRequestPair) =>
                    new Promise<void>((resolve) => {
                        parseIssueRequest(
                            this.vaultsAPI,
                            issueRequestPair[1],
                            this.btcNetwork,
                            issueRequestPair[0]
                        ).then((issueRequest) => {
                            mapForUser.set(issueRequestPair[0], issueRequest);
                            resolve();
                        });
                    })
            )
        );
        return mapForUser;
    }

    async getGriefingCollateral<C extends CollateralUnit>(
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const griefingCollateralRate = await this.feeAPI.getIssueGriefingCollateralRate();
        return await this.feeAPI.getGriefingCollateral(amount, griefingCollateralRate, collateralCurrency);
    }

    async getFeesToPay(
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>
    ): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>> {
        const feePercentage = await this.getFeeRate();
        return amount.mul(feePercentage);
    }

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
        return await Promise.all(
            issueIds.map(async (issueId) =>
                parseIssueRequest(
                    this.vaultsAPI,
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

    async mapIssueRequests(vaultId: AccountId): Promise<Map<H256, Issue>> {
        try {
            const issueRequestPairs: [H256, IssueRequest][] = await this.api.rpc.issue.getVaultIssueRequests(vaultId);
            const requests = await Promise.all(
                issueRequestPairs.map(
                    ([id, req]) =>
                        new Promise<[H256, Issue]>((resolve) => {
                            parseIssueRequest(this.vaultsAPI, req, this.btcNetwork, id).then((issueRequest) => {
                                resolve([id, issueRequest]);
                            });
                        })
                )
            );
            return new Map(requests);
        } catch (err) {
            return Promise.reject(new Error(`Error during issue request retrieval: ${err}`));
        }
    }
}
