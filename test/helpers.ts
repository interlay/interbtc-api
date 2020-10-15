import { DispatchError, EventRecord } from "@polkadot/types/interfaces/system";
import { ApiPromise } from "@polkadot/api";

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function printEvents(api: ApiPromise, testType: string, events: EventRecord[]): void {
    console.log(`\n${testType} events:`);

    let foundErrorEvent = false;
    events.forEach(({ event }) => {
        event.data.forEach((eventData: any) => {
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
