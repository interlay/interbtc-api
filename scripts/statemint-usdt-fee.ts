
import { createSubstrateAPI } from "../src/factory";
import { Keyring } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";


async function sendTx(
    transaction: SubmittableExtrinsic<"promise">,
    onlyInBlock?: boolean
): Promise<ISubmittableResult> {
    const keyring = new Keyring({ type: "sr25519" });
    const account = keyring.addFromUri("//Alice");
    const { unsubscribe, result } = await new Promise((resolve, reject) => {
        let unsubscribe: () => void;
        transaction
            .signAndSend(account, { nonce: -1, assetId: 1984 }, (result: ISubmittableResult) => callback({ unsubscribe, result }))
            .then((u: () => void) => (unsubscribe = u))
            .catch((error) => reject(error));

        let foundStatus = false;
        // only need to check this if we do want to wait for the success event
        function callback(callbackObject: { unsubscribe: () => void; result: ISubmittableResult }): void {
            const status = callbackObject.result.status;
            foundStatus = foundStatus || (onlyInBlock && status.isInBlock) || status.isFinalized;
  
            if (foundStatus) {
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

    if (result.dispatchError) {
        return Promise.reject();
    }
    return result;
}

async function main(): Promise<void> {
    const api = await createSubstrateAPI("ws://127.0.0.1:8000");
    let tx = api.tx.system.remark("test");
    await sendTx(tx, true);
}

main();