import { AddressOrPair, SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { EventRecord, DispatchError } from "@polkadot/types/interfaces/system";
import { ExtrinsicStatus } from "@polkadot/types/interfaces/author";
import { ApiPromise } from "@polkadot/api";
import { AugmentedEvent, ApiTypes } from "@polkadot/api/types";
import type { AnyTuple } from "@polkadot/types/types";

import { ACCOUNT_NOT_SET_ERROR_MESSAGE, IGNORED_ERROR_MESSAGES } from "../utils/constants";
import { MonetaryAmount, Currency } from "@interlay/monetary-js";
import { tokenSymbolToCurrency, newMonetaryAmount } from "../utils";

export interface TransactionAPI {
    api: ApiPromise;
    setAccount(account: AddressOrPair): void;
    removeAccount(): void;
    getAccount(): AddressOrPair | undefined;
    sendLogged<T extends AnyTuple>(
        transaction: SubmittableExtrinsic<"promise">,
        successEventType?: AugmentedEvent<ApiTypes, T>,
        extrinsicStatus?: ExtrinsicStatus
    ): Promise<ISubmittableResult>;

    /**
     * Builds a submittable extrinsic to send other extrinsic in batch.
     *
     * @param extrinsics An array of extrinsics to be submitted as batch.
     * @param atomic Whether the given extrinsics should be handled atomically or not.
     *   When true (default) all extrinsics will rollback if one fails (batchAll), otherwise allows partial successes (batch).
     * @returns A batch/batchAll submittable extrinsic.
     */
    buildBatchExtrinsic(
        extrinsics: SubmittableExtrinsic<"promise", ISubmittableResult>[],
        atomic?: boolean
    ): SubmittableExtrinsic<"promise", ISubmittableResult>;

    /**
     * Getter for fee estimation of the extrinsic.
     *
     * @param {SubmittableExtrinsic<"promise">} extrinsic Extrinsic to get fee estimation about.
     * @returns {MonetaryAmount<Currency>} amount of native currency that will be paid as transaction fee.
     * @note This fee estimation does not include tip.
     */
    getFeeEstimation(extrinsic: SubmittableExtrinsic<"promise">): Promise<MonetaryAmount<Currency>>;

    /**
     * Tests extrinsic execution against runtime.
     *
     * @param {SubmittableExtrinsic<"promise">} extrinsic Extrinsic to dry run.
     * @return {boolean} True if extrinsic was successfully executed, false otherwise.
     */
    dryRun(extrinsic: SubmittableExtrinsic<"promise">): Promise<boolean>;
}

export class DefaultTransactionAPI implements TransactionAPI {
    constructor(public api: ApiPromise, private account?: AddressOrPair) {}

    public setAccount(account: AddressOrPair): void {
        this.account = account;
    }

    public removeAccount(): void {
        this.account = undefined;
    }

    public getAccount(): AddressOrPair | undefined {
        return this.account;
    }

    async sendLogged<T extends AnyTuple>(
        transaction: SubmittableExtrinsic<"promise">,
        successEventType?: AugmentedEvent<ApiTypes, T>,
        extrinsicStatus?: ExtrinsicStatus
    ): Promise<ISubmittableResult> {
        if (this.account === undefined) {
            return Promise.reject(new Error(ACCOUNT_NOT_SET_ERROR_MESSAGE));
        }
        return DefaultTransactionAPI.sendLogged(this.api, this.account, transaction, successEventType, extrinsicStatus);
    }

    async getFeeEstimation(extrinsic: SubmittableExtrinsic<"promise">): Promise<MonetaryAmount<Currency>> {
        const nativeCurrency = tokenSymbolToCurrency(this.api.consts.currency.getNativeCurrencyId.asToken);

        const account = this.account;
        if (account === undefined) {
            return newMonetaryAmount(0, nativeCurrency);
        }

        const paymentInfo = await extrinsic.paymentInfo(account);
        return newMonetaryAmount(paymentInfo.partialFee.toString(), nativeCurrency);
    }

    async dryRun(extrinsic: SubmittableExtrinsic<"promise">): Promise<boolean> {
        if (this.account === undefined) {
            return Promise.reject(new Error(ACCOUNT_NOT_SET_ERROR_MESSAGE));
        }
        try {
            await extrinsic.dryRun(this.account);
            return true;
        } catch {
            return false;
        }
    }

    buildBatchExtrinsic(
        extrinsics: SubmittableExtrinsic<"promise", ISubmittableResult>[],
        atomic: boolean = true
    ): SubmittableExtrinsic<"promise", ISubmittableResult> {
        return DefaultTransactionAPI.buildBatchExtrinsic(this.api, extrinsics, atomic);
    }

    /**
     * Builds a submittable extrinsic to send other extrinsic in batch.
     *
     * @param api The ApiPromis instance to construct the batch extrinsic with.
     * @param extrinsics An array of extrinsics to be submitted as batch.
     * @param atomic Whether the given extrinsics should be handled atomically or not.
     *   When true (default) all extrinsics will rollback if one fails (batchAll), otherwise allows partial successes (batch).
     * @returns A batch/batchAll submittable extrinsic.
     */
    static buildBatchExtrinsic(
        api: ApiPromise,
        extrinsics: SubmittableExtrinsic<"promise", ISubmittableResult>[],
        atomic: boolean = true
    ): SubmittableExtrinsic<"promise", ISubmittableResult> {
        const batchExtrinsic = (atomic ? api.tx.utility.batchAll : api.tx.utility.batch)(extrinsics);
        return batchExtrinsic;
    }

    static async sendLogged<T extends AnyTuple>(
        api: ApiPromise,
        account: AddressOrPair,
        transaction: SubmittableExtrinsic<"promise">,
        successEventType?: AugmentedEvent<ApiTypes, T>,
        extrinsicStatus?: ExtrinsicStatus
    ): Promise<ISubmittableResult> {
        const { unsubscribe, result } = await new Promise((resolve, reject) => {
            let unsubscribe: () => void;
            // When passing { nonce: -1 } to signAndSend the API will use system.accountNextIndex to determine the nonce
            transaction
                .signAndSend(account, { nonce: -1 }, (result: ISubmittableResult) => callback({ unsubscribe, result }))
                .then((u: () => void) => (unsubscribe = u))
                .catch((error) => reject(error));

            let foundStatus = false;
            // only need to check this if we do want to wait for the success event
            let foundEvent = successEventType !== undefined;
            function callback(callbackObject: { unsubscribe: () => void; result: ISubmittableResult }): void {
                const status = callbackObject.result.status;
                foundStatus =
                    foundStatus || (extrinsicStatus ? extrinsicStatus.type === status.type : status.isInBlock);
                foundEvent =
                    // if we found it before there is no need to check again
                    foundEvent ||
                    // if the event we are looking for is undefined, assume it has been found
                    successEventType === undefined ||
                    DefaultTransactionAPI.doesArrayContainEvent(callbackObject.result.events, successEventType);

                if (foundStatus && foundEvent) {
                    resolve(callbackObject);
                }
            }
        });

        if (result.status.isInBlock) {
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`);
        } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
        }
        unsubscribe(result);

        // Print all events for debugging
        DefaultTransactionAPI.printEvents(api, result.events);

        const dispatchError = result.dispatchError;
        if (dispatchError) {
            // Construct error message
            let message = "The transaction failed.";
            // Runtime error in one of the parachain modules
            if (dispatchError.isModule) {
                // for module errors, we have the section indexed, lookup
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                const { docs, name, section } = decoded;
                message = message.concat(` The error code is ${section}.${name}. ${docs.join(" ")}`);
                // Bad origin
            } else if (dispatchError.isBadOrigin) {
                message = message.concat(` The error is caused by using an incorrect account.
                The error code is BadOrigin ${dispatchError}.`);
            }
            // Other, CannotLookup, no extra info
            else {
                message = message.concat(` The error is ${dispatchError}.`);
            }
            console.log(message);
            return Promise.reject(new Error(message));
        }
        return result;
    }

    static printEvents(api: ApiPromise, events: EventRecord[]): void {
        let foundErrorEvent = false;
        let errorMessage = "";
        events
            .map(({ event }) => event.data)
            .forEach((eventData) => {
                if (DefaultTransactionAPI.isDispatchError(eventData)) {
                    try {
                        const { docs, name, section } = api.registry.findMetaError(eventData.asModule);
                        if (docs?.length > 0) {
                            errorMessage = `${section}.${name}: ${docs.join(" ")}`;
                        } else {
                            errorMessage = `${section}.${name}`;
                        }
                        foundErrorEvent = true;
                    } catch (err) {
                        errorMessage = "Error. Could not find transaction failure details.";
                    }
                }
            });

        if (!foundErrorEvent) {
            events.forEach(({ phase, event: { data, method, section } }) => {
                console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
            });
        } else if (!IGNORED_ERROR_MESSAGES.includes(errorMessage)) {
            throw new Error(errorMessage);
        }
    }

    static isDispatchError(eventData: unknown): eventData is DispatchError {
        return (eventData as DispatchError).isModule !== undefined;
    }

    static doesArrayContainEvent<T extends AnyTuple>(
        events: EventRecord[],
        eventType: AugmentedEvent<ApiTypes, T>
    ): boolean {
        for (const { event } of events) {
            if (eventType.is(event)) {
                return true;
            }
        }
        return false;
    }
}
