import { AddressOrPair } from "@polkadot/api/submittable/types";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { EventRecord, DispatchError } from "@polkadot/types/interfaces/system";
import { ApiPromise } from "@polkadot/api";
import { IGNORED_ERROR_MESSAGES } from "./constants";
import { AugmentedEvent, ApiTypes } from "@polkadot/api/types";
import type { AnyTuple } from "@polkadot/types/types";

export interface TransactionAPI {
    /**
     * Send a transaction using PolkadotJs API and log the events to console 
     * @param transaction Transaction object bundled with auto-generated polkadot-js methods. For instance,
     * `this.api.tx.issue.requestIssue(amountSat, vaultId, griefingCollateralPlanck)`
     * @param signer The account to sign this transaction with
     * @param successEventType (Optional) The type of the event whose emission confirms successful
     * transaction execution. If this event is absent, reject the promise.
     * @returns A result object with information from the attempt to broadcast this transaction
     */
     sendLogged<T extends AnyTuple>(
        transaction: SubmittableExtrinsic<"promise">,
        signer: AddressOrPair,
        successEventType?: AugmentedEvent<ApiTypes, T>
    ): Promise<ISubmittableResult>;
}

export class Transaction implements TransactionAPI {
    constructor(private api: ApiPromise) {}

    async sendLogged<T extends AnyTuple>(
        transaction: SubmittableExtrinsic<"promise">,
        signer: AddressOrPair,
        successEventType?: AugmentedEvent<ApiTypes, T>
    ): Promise<ISubmittableResult> {
        // When passing { nonce: -1 } to signAndSend the API will use system.accountNextIndex to determine the nonce
        const { unsubscribe, result } = await new Promise((resolve, reject) => {
            let unsubscribe: () => void;
            // When passing { nonce: -1 } to signAndSend the API will use system.accountNextIndex to determine the nonce
            // signAndSend: Promise<() => void>
            // signAndSend -> signAndSend resolves (we set unsubscribe) -> callback is called
            transaction
                .signAndSend(signer, { nonce: -1 }, (result: ISubmittableResult) => callback({ unsubscribe, result }))
                .then((u: () => void) => (unsubscribe = u))
                .catch((error) => reject(error));
    
            function callback(callbackObject: { unsubscribe: () => void; result: ISubmittableResult }): void {
                // could log events here as they are being emitted
                // using callbackObject.result.events
                // noting that sometimes several events are
                // emitted at once
                const status = callbackObject.result.status;
                if (status.isFinalized) {
                    resolve(callbackObject);
                }
            }
        });

        console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
        unsubscribe(result);
        this.printEvents(result.events);

        if (successEventType && !this.isSuccessful(result.events, successEventType)) {
            Promise.reject("Transaction failed");
        }
        return result;
    }
    
    printEvents(events: EventRecord[]): void {
        let foundErrorEvent = false;
        let errorMessage = "";
        events
            .flatMap(({ event }) => event.data)
            .forEach((eventData) => {
                if (this.isDispatchError(eventData)) {
                    try {
                        const decoded = this.api.registry.findMetaError(eventData.asModule);
                        const { documentation, name, section } = decoded;
                        if (documentation && documentation.length > 0) {
                            errorMessage = `${section}.${name}: ${documentation.join(" ")}`;
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
    
    isDispatchError(eventData: unknown): eventData is DispatchError {
        return (eventData as DispatchError).isModule !== undefined;
    }

    isSuccessful<T extends AnyTuple>(
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
