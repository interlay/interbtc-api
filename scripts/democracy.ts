/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { Keyring } from "@polkadot/api";
import { DefaultTransactionAPI } from "../src/parachain";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { DemocracyVote } from "@polkadot/types/lookup";

// const PARACHAIN_ENDPOINT = "wss://api-dev-kintsugi.interlay.io/parachain";
// const ACCOUNT_URI = "quick sense network ozone ostrich bone hole possible timber clog urban primary//account/1";

const PARACHAIN_ENDPOINT = "ws://127.0.0.1:9988";
const ACCOUNT_URI = "//Alice";

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

async function main(): Promise<void> {
    const rawData = require("fs").readFileSync("testnet_runtime_parachain.compact.compressed.wasm");
    const data = "0x" + rawData.toString("hex");
    await cryptoWaitReady();
    const keyring = new Keyring({ type: "sr25519" });
    const userKeyring = keyring.addFromUri(ACCOUNT_URI);
    const api = await createSubstrateAPI(PARACHAIN_ENDPOINT);

    const transactionAPI = new DefaultTransactionAPI(api, userKeyring);

    const proposal = api.tx.parachainSystem.authorizeUpgrade(
        "0x72e1663c5c98310ff9654700738b4f2987a7d8d9d4ccbfd39babe98517ddd7eb"
    );
    const proposalData = proposal.method.toHex();
    const proposalHash = proposal.method.hash.toHex();

    // // sudo-upgrade using set-code
    // await transactionAPI.sendLogged(api.tx.sudo.sudoUncheckedWeight(api.tx.system.setCode(data), 0), undefined);

    console.log("Locking KINT...");
    await transactionAPI.sendLogged(api.tx.escrow.createLock(10000000000000, 2628000), undefined);

    console.log("Submitting preimage...");
    await transactionAPI.sendLogged(api.tx.democracy.notePreimage(proposalData), undefined);

    console.log("Submitting proposal...");
    await transactionAPI.sendLogged(api.tx.democracy.propose(proposalHash, 5000000000000), undefined);

    console.log("Fastracking proposal...");
    await transactionAPI.sendLogged(api.tx.sudo.sudo(api.tx.democracy.fastTrack(0, 3)), undefined);

    console.log("Voting on proposal...");
    await transactionAPI.sendLogged(
        api.tx.democracy.vote(
            0,
            api.createType<DemocracyVote>("DemocracyVote", {
                aye: true,
                balance: 1000000000000,
            })
        ),
        undefined
    );

    api.disconnect();
}
