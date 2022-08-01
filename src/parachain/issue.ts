import { ApiPromise } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/submittable/types";
import { Option } from "@polkadot/types";
import { AccountId, H256, Hash, EventRecord } from "@polkadot/types/interfaces";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { MonetaryAmount } from "@interlay/monetary-js";
import { InterbtcPrimitivesIssueIssueRequest, InterbtcPrimitivesVaultId } from "@polkadot/types/lookup";

import { VaultsAPI } from "./vaults";
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
    newVaultId,
    newCurrencyId,
} from "../utils";
import { FeeAPI } from "./fee";
import { ElectrsAPI } from "../external";
import { TransactionAPI } from "./transaction";
import { CollateralCurrencyExt, Issue, WrappedCurrency } from "../types";
import { AssetRegistryAPI } from "../parachain/asset-registry";
import { currencyIdToMonetaryCurrency } from "../utils";

export type IssueLimits = {
    singleVaultMaxIssuable: MonetaryAmount<WrappedCurrency>;
    totalMaxIssuable: MonetaryAmount<WrappedCurrency>;
};

/**
 * @category BTC Bridge
 */
export interface IssueAPI {
    /**
     * Gets the threshold for issuing with a single vault, and the maximum total
     * issue request size. Additionally passes the list of vaults for caching.
     * @param vaults (optional) A list of the vaults available to issue from. If not provided, will fetch from the
     * parachain (incurring an extra request).
     * @returns An object of type {singleVault, maxTotal, vaultsCache}
     */
    getRequestLimits(vaults?: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>): Promise<IssueLimits>;

    /**
     * Request issuing wrapped tokens (e.g. interBTC, kBTC).
     * @param amount wrapped token amount to issue.
     * @param vaultId (optional) Account ID of the vault to issue with.
     * @param collateralCurrency (optional) Collateral currency for backing wrapped tokens
     * @param atomic (optional) Whether the issue request should be handled atomically or not. Only makes a difference
     * if more than one vault is needed to fulfil it. Defaults to false.
     * @param retries (optional) Number of times to retry issuing, if some of the requests fail. Defaults to 0.
     * @param availableVaults (optional) A list of all vaults usable for issue. If not provided, will fetch from the parachain.
     * @returns An array of type {issueId, issueRequest} if the requests succeeded. The function throws an error otherwise.
     */
    request(
        amount: MonetaryAmount<WrappedCurrency>,
        vaultAccountId?: AccountId,
        collateralCurrency?: CollateralCurrencyExt,
        atomic?: boolean,
        retries?: number,
        availableVaults?: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>
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
        amountsPerVault: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>,
        atomic: boolean
    ): Promise<Issue[]>;

    /**
     * Send an issue execution transaction
     * @remarks If `txId` is not set, the `merkleProof` and `rawTx` must both be set.
     *
     * @param issueId The ID returned by the issue request transaction
     * @param btcTxId Bitcoin transaction ID
     */
    execute(requestId: string, btcTxId: string): Promise<void>;
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
     * @returns The minimum amount of wrapped tokens that is accepted for issue requests; any lower values would
     * risk the bitcoin client to reject the payment
     */
    getDustValue(): Promise<MonetaryAmount<WrappedCurrency>>;
    /**
     * @returns The fee charged for issuing. For instance, "0.005" stands for 0.5%
     */
    getFeeRate(): Promise<Big>;
    /**
     * @param amount The amount, in BTC, for which to compute the issue fees
     * @returns The fees, in BTC
     */
    getFeesToPay(amount: MonetaryAmount<WrappedCurrency>): Promise<MonetaryAmount<WrappedCurrency>>;
    /**
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object
     * @returns The amount of wrapped tokens issuable by this vault
     */
    getVaultIssuableAmount(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<WrappedCurrency>>;
}

export class DefaultIssueAPI implements IssueAPI {
    constructor(
        private api: ApiPromise,
        private btcNetwork: Network,
        private electrsAPI: ElectrsAPI,
        private wrappedCurrency: WrappedCurrency,
        private feeAPI: FeeAPI,
        private vaultsAPI: VaultsAPI,
        private transactionAPI: TransactionAPI,
        private assetRegistryAPI: AssetRegistryAPI
    ) {}

    async getRequestLimits(
        vaults?: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>
    ): Promise<IssueLimits> {
        if (!vaults) vaults = await this.vaultsAPI.getVaultsWithIssuableTokens();
        const vaultsArr = [...vaults.entries()].sort(
            // sort in descending order
            ([_id_1, amount_1], [_id_2, amount_2]) => amount_2.sub(amount_1).toBig().toNumber()
        );

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
        amount: MonetaryAmount<WrappedCurrency>,
        vaultAccountId?: AccountId,
        collateralCurrency?: CollateralCurrencyExt,
        atomic: boolean = true,
        retries: number = 0,
        cachedVaults?: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>
    ): Promise<Issue[]> {
        try {
            if (vaultAccountId) {
                if (!collateralCurrency) {
                    return Promise.reject(
                        new Error("A collateral currency must be specified along with the vault account ID")
                    );
                }
                // If a vault account id is defined, request to issue with that vault only.
                // Initialize the `amountsPerVault` map with a single entry, the (vaultId, amount) pair
                const collateralCurrencyId = newCurrencyId(this.api, collateralCurrency);
                const vaultId = newVaultId(
                    this.api,
                    vaultAccountId.toString(),
                    await currencyIdToMonetaryCurrency(this.assetRegistryAPI, collateralCurrencyId),
                    this.wrappedCurrency
                );
                const amountsPerVault = new Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>([
                    [vaultId, amount],
                ]);
                return await this.requestAdvanced(amountsPerVault, atomic);
            }
            const availableVaults = cachedVaults || (await this.vaultsAPI.getVaultsWithIssuableTokens());
            const amountsPerVault = allocateAmountsToVaults(availableVaults, amount);
            const result = await this.requestAdvanced(amountsPerVault, atomic);
            const successfulSum = result.reduce(
                (sum, req) => sum.add(req.wrappedAmount),
                newMonetaryAmount(0, this.wrappedCurrency)
            );
            const remainder = amount.sub(successfulSum);
            if (remainder.isZero() || retries === 0) return result;
            else {
                return (
                    await this.request(
                        remainder,
                        vaultAccountId,
                        collateralCurrency,
                        atomic,
                        retries - 1,
                        availableVaults
                    )
                ).concat(result);
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async craftRequestTx(
        vaultId: InterbtcPrimitivesVaultId,
        amount: MonetaryAmount<WrappedCurrency>
    ): Promise<SubmittableExtrinsic<"promise">> {
        return this.api.tx.issue.requestIssue(amount.toString(true), vaultId);
    }

    async requestAdvanced(
        amountsPerVault: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>,
        atomic: boolean
    ): Promise<Issue[]> {
        const txs = await Promise.all(
            Array.from(amountsPerVault.entries()).map(
                ([vaultId, amount]) =>
                    new Promise<SubmittableExtrinsic<"promise">>((resolve) => {
                        this.craftRequestTx(vaultId, amount).then(resolve);
                    })
            )
        );
        // batchAll fails atomically, batch allows partial successes
        const batch = (atomic ? this.api.tx.utility.batchAll : this.api.tx.utility.batch)(txs);
        try {
            const result = await this.transactionAPI.sendLogged(batch, this.api.events.issue.RequestIssue);
            const ids = this.getIssueIdsFromEvents(result.events);
            const issueRequests = await this.getRequestsByIds(ids);
            return issueRequests;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async execute(requestId: string, btcTxId: string): Promise<void> {
        const parsedRequestId = ensureHashEncoded(this.api, requestId);
        const txInclusionDetails = await getTxProof(this.electrsAPI, btcTxId);
        const tx = this.api.tx.issue.executeIssue(
            parsedRequestId,
            txInclusionDetails.merkleProof,
            txInclusionDetails.rawTx
        );
        await this.transactionAPI.sendLogged(tx, this.api.events.issue.ExecuteIssue, true);
    }

    async cancel(requestId: string): Promise<void> {
        const parsedRequestId = this.api.createType("H256", addHexPrefix(requestId));
        const cancelIssueTx = this.api.tx.issue.cancelIssue(parsedRequestId);
        await this.transactionAPI.sendLogged(cancelIssueTx, this.api.events.issue.CancelIssue, true);
    }

    async setIssuePeriod(blocks: number): Promise<void> {
        const period = this.api.createType("BlockNumber", blocks);
        const tx = this.api.tx.sudo.sudo(this.api.tx.issue.setIssuePeriod(period));
        await this.transactionAPI.sendLogged(tx, undefined, true);
    }

    async getIssuePeriod(): Promise<number> {
        const blockNumber = await this.api.query.issue.issuePeriod();
        return blockNumber.toNumber();
    }

    async list(): Promise<Issue[]> {
        const issueRequests = await this.api.query.issue.issueRequests.entries();
        return await Promise.all(
            issueRequests
                .filter(([_, req]) => req.isSome.valueOf())
                // Can be unwrapped because the filter removes `None` values
                .map(([id, req]) =>
                    parseIssueRequest(
                        this.vaultsAPI,
                        this.assetRegistryAPI,
                        req.unwrap(),
                        this.btcNetwork,
                        storageKeyToNthInner(id)
                    )
                )
        );
    }

    async getFeesToPay(amount: MonetaryAmount<WrappedCurrency>): Promise<MonetaryAmount<WrappedCurrency>> {
        const feePercentage = await this.getFeeRate();
        return amount.mul(feePercentage);
    }

    async getDustValue(): Promise<MonetaryAmount<WrappedCurrency>> {
        const dustValueSat = await this.api.query.issue.issueBtcDustValue();
        return newMonetaryAmount(dustValueSat.toString(), this.wrappedCurrency);
    }

    async getFeeRate(): Promise<Big> {
        const issueFee = await this.api.query.fee.issueFee();
        return decodeFixedPointType(issueFee);
    }

    async getRequestById(issueId: H256 | string): Promise<Issue> {
        return (await this.getRequestsByIds([issueId]))[0];
    }

    async getRequestsByIds(issueIds: (H256 | string)[]): Promise<Issue[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const issueRequestData = await Promise.all(
            issueIds.map(
                async (issueId): Promise<[Option<InterbtcPrimitivesIssueIssueRequest>, H256 | string]> =>
                    new Promise((resolve, reject) => {
                        this.api.query.issue.issueRequests
                            .at(head, ensureHashEncoded(this.api, issueId))
                            .then((request) => resolve([request, issueId]))
                            .catch(reject);
                    })
            )
        );
        return Promise.all(
            issueRequestData
                .filter(([option, _]) => option.isSome)
                .map(([issueRequest, issueId]) =>
                    parseIssueRequest(
                        this.vaultsAPI,
                        this.assetRegistryAPI,
                        issueRequest.unwrap(),
                        this.btcNetwork,
                        issueId
                    )
                )
        );
    }

    async getVaultIssuableAmount(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<WrappedCurrency>> {
        return this.vaultsAPI.getIssueableTokensFromVault(vaultAccountId, collateralCurrency);
    }
}
