import { SubmittableExtrinsic, ApiTypes, AugmentedEvent } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { newMonetaryAmount, tokenSymbolToCurrency } from "./currency";
import { TransactionAPI } from "../parachain";
import { Currency, MonetaryAmount } from "@interlay/monetary-js";
/**
 * This class exposes extrinsic metadata and allows simple extrinsic submission,
 * fee estimation or batching with other extrinsics.
 */
class ExtrinsicHandler {
    constructor(
        private transactionAPI: TransactionAPI,
        public extrinsic: SubmittableExtrinsic<"promise">,
        public event?: AugmentedEvent<"promise">
    ) {}

    /**
     * Getter for fee estimation of the extrinsic.
     *
     * @returns {MonetaryAmount<Currency>} amount of native currency that will be paid as transaction fee.
     * @note This fee estimation does not include tip.
     */
    public async getFeeEstimation(): Promise<MonetaryAmount<Currency>> {
        const nativeCurrency = tokenSymbolToCurrency(
            this.transactionAPI.api.consts.currency.getNativeCurrencyId.asToken
        );

        const account = this.transactionAPI.getAccount();
        if (account === undefined) {
            return newMonetaryAmount(0, nativeCurrency);
        }

        const paymentInfo = await this.extrinsic.paymentInfo(account);
        return newMonetaryAmount(paymentInfo.partialFee.toString(), nativeCurrency);
    }

    /**
     * This method submits the extrinsic signed by account set in TransactionAPI. Wrapper around TransactionAPI.sendLogged.
     *
     * @param {boolean} onlyInBlock Optional parameter to set waiting for transaction inclusion only (true) or finalisation (false).
     *                              Defaults to true.
     * @returns {ISubmittableResult} Result of the extrinsic submission.
     */
    public submit(onlyInBlock: boolean = true): Promise<ISubmittableResult> {
        return this.transactionAPI.sendLogged(this.extrinsic, this.event, onlyInBlock);
    }

    /**
     * Batch current and another extrinsic together.
     *
     * @param {ExtrinsicHandler} extrinsicToBatchWith Another extrinsic that will be batched with current extrinsic.
     * @param {boolean} atomic Optional parameter to set whether the extrinsics execution should be atomic or not. Defaults to true.
     * @returns {ExtrinsicHandler} New instance of this class with batched extrinsics.
     * @note Passed extrinsic is added after the current one into batch. Therefore, order of execution
     *       is defined by choosing the instance this method is called this on.
     */
    public batchWith(extrinsicToBatchWith: ExtrinsicHandler, atomic: boolean = true): ExtrinsicHandler {
        return this.batchWithRawExtrinsic(extrinsicToBatchWith.extrinsic, atomic);
    }

    /**
     * Batch current extrinsic with another raw extrinsic.
     *
     * @param {SubmittableExtrinsic<ApiTypes>} extrinsicToBatchWith Raw extrinsic that will be batched with current extrinsic.
     * @param {boolean} atomic Optional parameter to set whether the extrinsics execution should be atomic or not. Defaults to true.
     * @returns {ExtrinsicHandler} New instance of this class with batched extrinsics.
     * @note Passed extrinsic is added after the current one into batch.
     */
    public batchWithRawExtrinsic(
        rawExtrinsicToBatchWith: SubmittableExtrinsic<ApiTypes>,
        atomic: boolean = true
    ): ExtrinsicHandler {
        const batchExtrinsic = this.transactionAPI.buildBatchExtrinsic(
            [this.extrinsic, rawExtrinsicToBatchWith],
            atomic
        );
        const batchEvent = this.transactionAPI.api.events.utility.BatchCompleted;

        return new ExtrinsicHandler(this.transactionAPI, batchExtrinsic, batchEvent);
    }
}

export { ExtrinsicHandler };
