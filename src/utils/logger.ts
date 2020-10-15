import { AddressOrPair } from "@polkadot/api/submittable/types";
import { SubmittableExtrinsic, ApiTypes } from "@polkadot/api/types";
import { Callback, ISubmittableResult } from "@polkadot/types/types";
import { EventRecord, DispatchError } from "@polkadot/types/interfaces/system";
import { ApiPromise } from "@polkadot/api";

export async function sendLoggedTx(
    transaction: SubmittableExtrinsic<"promise">,
    signer: AddressOrPair,
    api: ApiPromise
): Promise<EventRecord[]> {
    // When passing { nonce: -1 } to signAndSend the API will use system.accountNextIndex to determine the nonce
    const { unsubscribe, result } = await new Promise((resolve) => {
        let unsubscribe: () => void;
        // When passing { nonce: -1 } to signAndSend the API will use system.accountNextIndex to determine the nonce
        // signAndSend: Promise<() => void>
        // signAndSend -> signAndSend resolves (we set unsubscribe) -> callback is called
        transaction
            .signAndSend(signer, { nonce: -1 }, (result: ISubmittableResult) => resolve({ unsubscribe, result }))
            .then((u: () => void) => (unsubscribe = u));
    });

    console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
    unsubscribe(result);
    printEvents(result.events, api);
    return result.events;
}

function printEvents(events: EventRecord[], api: ApiPromise) {
    let foundErrorEvent = false;
    events.flatMap(({ event }) => event.data).forEach((eventData: any) => {
        if (eventData.isModule) {
            try {
                const parsedEventData = eventData as DispatchError;
                const decoded = api.registry.findMetaError(parsedEventData.asModule);
                const { documentation, name, section } = decoded;
                if (documentation) {
                    console.log(`\t${section}.${name}: ${documentation.join(" ")}`);
                } else {
                    console.log(`\t${section}.${name}`);
                }
                foundErrorEvent = true;
            } catch (err) {
                console.log("\tCould not find transaction failure details.");
            }
        }
    });

    if (!foundErrorEvent) {
        events.forEach(({ phase, event: { data, method, section } }) => {
            console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
        });
    }
}
