import { ApiPromise } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/submittable/types";
import { Option } from "@polkadot/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { AccountId, H256 } from "@polkadot/types/interfaces";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { MonetaryAmount } from "@interlay/monetary-js";
import { InterbtcPrimitivesIssueIssueRequest, InterbtcPrimitivesVaultId } from "@polkadot/types/lookup";

import { VaultsAPI } from "./vaults";
import {
    decodeFixedPointType,
    getTxProof,
    allocateAmountsToVaults,
    storageKeyToNthInner,
    ensureHashEncoded,
    addHexPrefix,
    parseIssueRequest,
    newMonetaryAmount,
    newVaultId,
    newCurrencyId,
} from "../utils";
import { ElectrsAPI } from "../external";
import { TransactionAPI } from "./transaction";
import { CollateralCurrencyExt, CurrencyExt, ExtrinsicData, Issue, WrappedCurrency } from "../types";
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
     * Build an issue request extrinsic (transaction) without sending it.
     *
     * @param vaultId The vault ID of the vault to issue with.
     * @param amount wrapped token amount to issue.
     * @param griefingCollateralCurrency (optional) Currency in which griefing collateral will be locked.
     * @returns An execute issue submittable extrinsic.
     */
    buildRequestIssueExtrinsic(
        vaultId: InterbtcPrimitivesVaultId,
        amount: MonetaryAmount<WrappedCurrency>,
        griefingCollateralCurrency?: CurrencyExt
    ): SubmittableExtrinsic<"promise", ISubmittableResult>;

    /**
     * Request issuing wrapped tokens (e.g. interBTC, kBTC).
     * @param amount wrapped token amount to issue.
     * @param vaultId (optional) Account ID of the vault to issue with.
     * @param collateralCurrency (optional) Collateral currency for backing wrapped tokens
     * @param atomic (optional) Whether the issue request should be handled atomically or not. Only makes a difference
     * if more than one vault is needed to fulfil it. Defaults to false.
     * @param availableVaults (optional) A list of all vaults usable for issue. If not provided, will fetch from the parachain.
     * @param griefingCollateralCurrency (optional) Currency in which griefing collateral will be locked.
     * @returns {Promise<ExtrinsicData>} An extrinsic with event.
     */
    request(
        amount: MonetaryAmount<WrappedCurrency>,
        vaultAccountId?: AccountId,
        collateralCurrency?: CollateralCurrencyExt,
        atomic?: boolean,
        availableVaults?: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>,
        griefingCollateralCurrency?: CurrencyExt
    ): Promise<ExtrinsicData>;

    /**
     * Create a batch of aggregated issue transactions (to one or more vaults).
     * @param amountsPerVault A mapping of vaults to issue from, and wrapped token amounts to issue using each vault
     * @param atomic Whether the issue request should be handled atomically or not. Only makes a difference if more than
     * one vault is needed to fulfil it.
     * @param griefingCollateralCurrency (optional) Currency in which griefing collateral will be locked.
     * @returns {ExtrinsicData} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    requestAdvanced(
        amountsPerVault: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>,
        atomic: boolean,
        griefingCollateralCurrency?: CurrencyExt
    ): ExtrinsicData;

    /**
     * Build an issue execution extrinsic (transaction) without sending it.
     *
     * @param issueId The ID returned by the issue request transaction
     * @param btcTxId Bitcoin transaction ID
     * @returns An execute issue submittable extrinsic.
     */
    buildExecuteIssueExtrinsic(
        issueId: string,
        btcTxId: string
    ): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>>;

    /**
     * Create an issue execution transaction
     * @remarks If `txId` is not set, the `merkleProof` and `rawTx` must both be set.
     *
     * @param issueId The ID returned by the issue request transaction
     * @param btcTxId Bitcoin transaction ID
     * @returns {Promise<ExtrinsicData>} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    execute(requestId: string, btcTxId: string): Promise<ExtrinsicData>;

    /**
     * Build a cancel issue extrinsic (transaction) without sending it.
     *
     * @param issueId The ID returned by the issue request transaction
     * @returns A cancel issue submittable extrinsic.
     */
    buildCancelIssueExtrinsic(issueId: string): SubmittableExtrinsic<"promise", ISubmittableResult>;

    /**
     * Create an issue cancellation transaction. After the issue period has elapsed,
     * the issuance request can be cancelled. As a result, the griefing collateral
     * of the requester will be slashed and sent to the vault that had prepared to issue.
     * @param issueId The ID returned by the issue request transaction
     * @returns {ExtrinsicData} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    cancel(issueId: string): ExtrinsicData;
    /**
     * @remarks Testnet utility function
     * @param blocks The time difference in number of blocks between an issue request is created
     * and required completion time by a user. The issue period has an upper limit
     * to prevent griefing of vault collateral.
     * @returns {ExtrinsicData} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    setIssuePeriod(blocks: number): ExtrinsicData;
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
        private vaultsAPI: VaultsAPI,
        private transactionAPI: TransactionAPI
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

    async request(
        amount: MonetaryAmount<WrappedCurrency>,
        vaultAccountId?: AccountId,
        collateralCurrency?: CollateralCurrencyExt,
        atomic: boolean = true,
        cachedVaults?: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>,
        griefingCollateralCurrency?: CurrencyExt
    ): Promise<ExtrinsicData> {
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
                    await currencyIdToMonetaryCurrency(this.api, collateralCurrencyId),
                    this.wrappedCurrency
                );
                const amountsPerVault = new Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>([
                    [vaultId, amount],
                ]);
                return this.requestAdvanced(amountsPerVault, atomic, griefingCollateralCurrency);
            }
            const availableVaults = cachedVaults || (await this.vaultsAPI.getVaultsWithIssuableTokens());
            const amountsPerVault = allocateAmountsToVaults(availableVaults, amount);
            return this.requestAdvanced(amountsPerVault, atomic, griefingCollateralCurrency);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    buildRequestIssueExtrinsic(
        vaultId: InterbtcPrimitivesVaultId,
        amount: MonetaryAmount<WrappedCurrency>,
        griefingCollateralCurrency?: CurrencyExt
    ): SubmittableExtrinsic<"promise", ISubmittableResult> {
        // NOTE: If griefing collateral currency is not used, native currency is required as griefing collateral.
        const griefingCollateralCurrencyId = griefingCollateralCurrency
            ? newCurrencyId(this.api, griefingCollateralCurrency)
            : this.api.consts.currency.getNativeCurrencyId;

        return this.api.tx.issue.requestIssue(amount.toString(true), vaultId, griefingCollateralCurrencyId);
    }

    requestAdvanced(
        amountsPerVault: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>,
        atomic: boolean,
        griefingCollateralCurrency?: CurrencyExt
    ): ExtrinsicData {
        const txs = Array.from(amountsPerVault.entries()).map(([vaultId, amount]) =>
            this.buildRequestIssueExtrinsic(vaultId, amount, griefingCollateralCurrency)
        );
        const batch = this.transactionAPI.buildBatchExtrinsic(txs, atomic);
        return { extrinsic: batch, event: this.api.events.issue.RequestIssue };
    }

    async buildExecuteIssueExtrinsic(
        requestId: string,
        btcTxId: string
    ): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>> {
        const parsedRequestId = ensureHashEncoded(this.api, requestId);
        const txInclusionDetails = await getTxProof(this.electrsAPI, btcTxId);
        return this.api.tx.issue.executeIssue(
            parsedRequestId,
            txInclusionDetails.merkleProof,
            txInclusionDetails.transaction,
            txInclusionDetails.lengthBound
        );
    }

    async execute(requestId: string, btcTxId: string): Promise<ExtrinsicData> {
        const tx = await this.buildExecuteIssueExtrinsic(requestId, btcTxId);
        return { extrinsic: tx, event: this.api.events.issue.ExecuteIssue };
    }

    buildCancelIssueExtrinsic(requestId: string): SubmittableExtrinsic<"promise", ISubmittableResult> {
        const parsedRequestId = this.api.createType("H256", addHexPrefix(requestId));
        return this.api.tx.issue.cancelIssue(parsedRequestId);
    }

    cancel(requestId: string): ExtrinsicData {
        const cancelIssueTx = this.buildCancelIssueExtrinsic(requestId);
        return { extrinsic: cancelIssueTx, event: this.api.events.issue.CancelIssue };
    }

    setIssuePeriod(blocks: number): ExtrinsicData {
        const period = this.api.createType("BlockNumber", blocks);
        const tx = this.api.tx.sudo.sudo(this.api.tx.issue.setIssuePeriod(period));
        return { extrinsic: tx };
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
                // can be unwrapped because the filter removes `None` values
                .map(([id, req]) =>
                    parseIssueRequest(this.api, this.vaultsAPI, req.unwrap(), this.btcNetwork, storageKeyToNthInner(id))
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
        const api = await this.api.at(head);
        const issueRequestData = await Promise.all(
            issueIds.map(
                async (issueId): Promise<[Option<InterbtcPrimitivesIssueIssueRequest>, H256 | string]> =>
                    new Promise((resolve, reject) => {
                        api.query.issue
                            .issueRequests(ensureHashEncoded(this.api, issueId))
                            .then((request) => resolve([request, issueId]))
                            .catch(reject);
                    })
            )
        );
        // TODO: pass head to parseIssueRequest since it queries chain state
        return Promise.all(
            issueRequestData
                .filter(([option, _]) => option.isSome)
                .map(([issueRequest, issueId]) =>
                    parseIssueRequest(this.api, this.vaultsAPI, issueRequest.unwrap(), this.btcNetwork, issueId)
                )
        );
    }

    async getVaultIssuableAmount(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<WrappedCurrency>> {
        return this.vaultsAPI.getIssuableTokensFromVault(vaultAccountId, collateralCurrency);
    }
}
