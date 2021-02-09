import { AddressOrPair } from "@polkadot/api/submittable/types";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { EventRecord, DispatchError } from "@polkadot/types/interfaces/system";
import { ApiPromise } from "@polkadot/api";

export async function sendLoggedTx(
    transaction: SubmittableExtrinsic<"promise">,
    signer: AddressOrPair,
    api: ApiPromise
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
    printEvents(result.events, api);
    return result;
}

function printEvents(events: EventRecord[], api: ApiPromise) {
    let foundErrorEvent = false;
    let errorMessage = "";
    events
        .flatMap(({ event }) => event.data)
        .forEach((eventData) => {
            if (isDispatchError(eventData)) {
                try {
                    const decoded = api.registry.findMetaError(eventData.asModule);
                    const { documentation, name, section } = decoded;
                    if (documentation) {
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
    } else {
        throw new Error(errorMessage);
    }
}

function isDispatchError(eventData: unknown): eventData is DispatchError {
    return (eventData as DispatchError).isModule !== undefined;
}
