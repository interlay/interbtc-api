import { ApiPromise } from "@polkadot/api";
import { AddressOrPair, SubmittableExtrinsic } from "@polkadot/api/submittable/types";
import { Option } from "@polkadot/types";
import { AccountId, H256, Hash, EventRecord } from "@polkadot/types/interfaces";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { BitcoinUnit, Currency, MonetaryAmount } from "@interlay/monetary-js";
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
import { FeeAPI, GriefingCollateralType } from "./fee";
import { ElectrsAPI } from "../external";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import {
    CollateralCurrency,
    CollateralIdLiteral,
    CurrencyIdLiteral,
    currencyIdToMonetaryCurrency,
    Issue,
    WrappedCurrency,
} from "../types";

export type IssueLimits = {
    singleVaultMaxIssuable: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    totalMaxIssuable: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
};

/**
 * @category BTC Bridge
 */
export interface IssueAPI extends TransactionAPI {
    /**
     * Gets the threshold for issuing with a single vault, and the maximum total
     * issue request size. Additionally passes the list of vaults for caching.
     * @param vaults (optional) A list of the vaults available to issue from. If not provided, will fetch from the
     * parachain (incurring an extra request).
     * @returns An object of type {singleVault, maxTotal, vaultsCache}
     */
    getRequestLimits(vaults?: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>): Promise<IssueLimits>;

    /**
     * Request issuing wrapped tokens (e.g. interBTC, kBTC).
     * @param amount wrapped token amount to issue.
     * @param vaultId (optional) Account ID of the vault to issue with.
     * @param collateralCurrencyIdLiteral (optional) Collateral currency for backing wrapped tokens
     * @param atomic (optional) Whether the issue request should be handled atomically or not. Only makes a difference
     * if more than one vault is needed to fulfil it. Defaults to false.
     * @param retries (optional) Number of times to retry issuing, if some of the requests fail. Defaults to 0.
     * @param availableVaults (optional) A list of all vaults usable for issue. If not provided, will fetch from the parachain.
     * @returns An array of type {issueId, issueRequest} if the requests succeeded. The function throws an error otherwise.
     */
    request(
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>,
        vaultAccountId?: AccountId,
        collateralCurrencyIdLiteral?: CurrencyIdLiteral,
        atomic?: boolean,
        retries?: number,
        availableVaults?: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>
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
        amountsPerVault: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>,
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
     * @returns The fee charged for issuing. For instance, "0.005" stands for 0.5%
     */
    getFeeRate(): Promise<Big>;
    /**
     * @param amount The amount, in BTC, for which to compute the issue fees
     * @returns The fees, in BTC
     */
    getFeesToPay(
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>
    ): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object
     * @returns The amount of wrapped tokens issuable by this vault
     */
    getVaultIssuableAmount(
        vaultAccountId: AccountId,
        collateralCurrency: CurrencyIdLiteral
    ): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
}

export class DefaultIssueAPI extends DefaultTransactionAPI implements IssueAPI {
    constructor(
        api: ApiPromise,
        private btcNetwork: Network,
        private electrsAPI: ElectrsAPI,
        private wrappedCurrency: WrappedCurrency,
        private feeAPI: FeeAPI,
        private vaultsAPI: VaultsAPI,
        account?: AddressOrPair
    ) {
        super(api, account);
    }

    async getRequestLimits(vaults?: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>): Promise<IssueLimits> {
        if (!vaults) vaults = await this.vaultsAPI.getVaultsWithIssuableTokens();
        const vaultsArr = [...vaults.entries()]
            .sort(
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
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>,
        vaultAccountId?: AccountId,
        collateralCurrencyIdLiteral?: CurrencyIdLiteral,
        atomic: boolean = true,
        retries: number = 0,
        cachedVaults?: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>,
    ): Promise<Issue[]> {
        try {
            if (vaultAccountId) {
                if (!collateralCurrencyIdLiteral) {
                    return Promise.reject(
                        new Error("A collateral currency must be specified along with the vault account ID")
                    );
                }
                // If a vault account id is defined, request to issue with that vault only.
                // Initialize the `amountsPerVault` map with a single entry, the (vaultId, amount) pair
                const collateralCurrencyId = newCurrencyId(this.api, collateralCurrencyIdLiteral);
                const vaultId = newVaultId(
                    this.api,
                    vaultAccountId.toString(),
                    currencyIdToMonetaryCurrency(collateralCurrencyId) as CollateralCurrency,
                    this.wrappedCurrency
                );
                const amountsPerVault = new Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>([
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
                        collateralCurrencyIdLiteral,
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
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>
    ): Promise<SubmittableExtrinsic<"promise">> {
        let griefingCollateral = await this.feeAPI.getGriefingCollateral(amount, GriefingCollateralType.Issue);
        // add() here is a hacky workaround for rounding errors
        const oneHundred = newMonetaryAmount(100, griefingCollateral.currency);
        griefingCollateral = griefingCollateral.add(oneHundred);
        return this.api.tx.issue.requestIssue(
            amount.toString(amount.currency.rawBase),
            vaultId,
            griefingCollateral.toString(griefingCollateral.currency.rawBase)
        );
    }

    async requestAdvanced(
        amountsPerVault: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>,
        atomic: boolean
    ): Promise<Issue[]> {
        const txs = await Promise.all(
            Array.from(amountsPerVault.entries()).map(
                ([vaultId, amount]) =>
                    new Promise<SubmittableExtrinsic<"promise">>((resolve) => {
                        this.craftRequestTx(
                            vaultId,
                            amount
                        ).then(resolve);
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

    async execute(requestId: string, btcTxId: string): Promise<void> {
        const parsedRequestId = ensureHashEncoded(this.api, requestId);
        const txInclusionDetails = await getTxProof(this.electrsAPI, btcTxId);
        const tx = this.api.tx.issue.executeIssue(parsedRequestId, txInclusionDetails.merkleProof, txInclusionDetails.rawTx);
        await this.sendLogged(tx, this.api.events.issue.ExecuteIssue);
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
            issueRequests
                .filter(([_, req]) => req.isSome.valueOf())
                // Can be unwrapped because the filter removes `None` values
                .map(([id, req]) =>
                    parseIssueRequest(this.vaultsAPI, req.unwrap(), this.btcNetwork, storageKeyToNthInner(id))
                )
        );
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
                    parseIssueRequest(this.vaultsAPI, issueRequest.unwrap(), this.btcNetwork, issueId)
                )
        );
    }

    async getVaultIssuableAmount(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralIdLiteral
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        const vault = await this.vaultsAPI.get(vaultAccountId, collateralCurrency);
        const wrappedTokenCapacity = await this.vaultsAPI.calculateCapacity(vault.backingCollateral);
        const issuedAmount = vault.issuedTokens.add(vault.toBeIssuedTokens);
        const issuableAmountExcludingFees = wrappedTokenCapacity.sub(issuedAmount);
        const fees = await this.getFeesToPay(issuableAmountExcludingFees);
        return issuableAmountExcludingFees.sub(fees);
    }
}
