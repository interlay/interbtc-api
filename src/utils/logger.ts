import { AddressOrPair } from "@polkadot/api/submittable/types";
import { SubmittableExtrinsic, ApiTypes } from "@polkadot/api/types";
import { Callback, ISubmittableResult } from "@polkadot/types/types";
import { EventRecord, DispatchError } from "@polkadot/types/interfaces/system";
import { ApiPromise } from "@polkadot/api";

declare type AnyFunctionReturningSubmittableExtrinsicApis =
    SubmittableExtrinsic<ApiTypes>;

interface EventContainer {
    events: EventRecord[];
}

export async function sendLoggedTx(
    transaction: AnyFunctionReturningSubmittableExtrinsicApis,
    signer: AddressOrPair,
    api: ApiPromise,
    eventContainer: EventContainer
): Promise<void> {
    // When passing { nonce: -1 } to signAndSend the API will use system.accountNextIndex to determine the nonce
    const unsubscribe: Callback<ISubmittableResult> = await transaction
        .signAndSend(
            signer, { nonce: -1 }, (result) => txCallback(unsubscribe, result, api, eventContainer)
        ) as Callback<ISubmittableResult>;
}

function txCallback(
    unsubscribe: Callback<ISubmittableResult>,
    result: ISubmittableResult,
    api: ApiPromise,
    eventContainer: EventContainer
) {
    if (result.status.isFinalized) {
        console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
        unsubscribe(result);
        printEvents(result.events, api);
        eventContainer.events = result.events;
    }
}

function printEvents(events: EventRecord[], api: ApiPromise) {
    let foundErrorEvent = false;
    events.forEach(({ event }) => {
        event.data.forEach(async (eventData: any) => {
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
    });

    if (!foundErrorEvent) {
        events.forEach(({ phase, event: { data, method, section } }) => {
            console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
        });
    }
}