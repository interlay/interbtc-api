// /* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import {
    getTxProof,qwe
} from "../src/utils";
import {ElectrsAPI, DefaultElectrsAPI} from "../src/external/electrs"

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

async function main(): Promise<void> {
    await cryptoWaitReady();
    const api = await createSubstrateAPI("ws://127.0.0.1:8000");
    const electrsAPI = new DefaultElectrsAPI("mainnet");
    qwe();
    const q = await getTxProof(electrsAPI, "e38dd37a96c74a4b9ecddbff221e1b23b90c3e32ceb47b05255119a56068d5c6");
    const codec1 = api.createType("BitcoinMerkleMerkleProof", q.merkleProof);
    const codec2 = api.createType("BitcoinTransaction", q.transaction);

    // console.log(JSON.stringify(q));
    // console.log(q.toString());
    const result = api.tx.issue.executeIssue("b90c3e32ceb47b05255119a56068d5c6",
    q.merkleProof,
    q.transaction,
    q.lengthBound);
    console.log("done");
}
