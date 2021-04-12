import { AddressOrPair, SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { EventRecord, DispatchError } from "@polkadot/types/interfaces/system";
import { ApiPromise } from "@polkadot/api";
import { ACCOUNT_NOT_SET_ERROR_MESSAGE, IGNORED_ERROR_MESSAGES } from "./constants";
import { AugmentedEvent, ApiTypes } from "@polkadot/api/types";
import type { AnyTuple } from "@polkadot/types/types";
export interface TransactionAPI {
    setAccount(account: AddressOrPair): void;
    sendLogged<T extends AnyTuple>(
        transaction: SubmittableExtrinsic<"promise">,
        successEventType?: AugmentedEvent<ApiTypes, T>
    ): Promise<ISubmittableResult>;
}

export class DefaultTransactionAPI {
    constructor(public api: ApiPromise, private account?: AddressOrPair) {}

    public setAccount(account: AddressOrPair): void {
        this.account = account;
    }

    async sendLogged<T extends AnyTuple>(
        transaction: SubmittableExtrinsic<"promise">,
        successEventType?: AugmentedEvent<ApiTypes, T>
    ): Promise<ISubmittableResult> {
        const { unsubscribe, result } = await new Promise((resolve, reject) => {
            if (this.account === undefined) {
                return Promise.reject(ACCOUNT_NOT_SET_ERROR_MESSAGE);
            }

            let unsubscribe: () => void;
            // When passing { nonce: -1 } to signAndSend the API will use system.accountNextIndex to determine the nonce
            transaction
                .signAndSend(this.account, { nonce: -1 }, (result: ISubmittableResult) => callback({ unsubscribe, result }))
                .then((u: () => void) => (unsubscribe = u))
                .catch((error) => reject(error));
    
            function callback(callbackObject: { unsubscribe: () => void; result: ISubmittableResult }): void {
                const status = callbackObject.result.status;
                if (status.isFinalized) {
                    resolve(callbackObject);
                }
            }
        });

        console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
        unsubscribe(result);
        this.printEvents(result.events);

        if (successEventType && !DefaultTransactionAPI.doesArrayContainEvent(result.events, successEventType)) {
            Promise.reject("Transaction failed");
        }
        return result;
    }
    
    private printEvents(events: EventRecord[]): void {
        let foundErrorEvent = false;
        let errorMessage = "";
        events
            .map(({ event }) => event.data)
            .forEach((eventData) => {
                if (DefaultTransactionAPI.isDispatchError(eventData)) {
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

    static async waitForEvent<T extends AnyTuple>(api: ApiPromise, event: AugmentedEvent<ApiTypes, T>): Promise<boolean> {
        // Use this function with a timeout.
        // Unless the awaited event occurs, this Promise will never resolve. 

        await new Promise<void>((resolve, _reject) => {
            api.query.system.events((eventsVec) => {
                const events = eventsVec.toArray();
                if(this.doesArrayContainEvent(events, event)) {
                    resolve();
                }
            });
        });
        return true;
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
