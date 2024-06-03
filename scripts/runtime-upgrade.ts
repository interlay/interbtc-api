/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { ApiPromise } from "@polkadot/api";
import { cryptoWaitReady, blake2AsHex } from "@polkadot/util-crypto";
import fetch from "cross-fetch";

import { printDiscordProposal } from "./util";

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const args = yargs(hideBin(process.argv))
    .option("clients-version", {
        description: "The version of the clients",
        type: "string",
        demandOption: true,
    })
    .option("parachain-endpoint", {
        description: "The wss url of the parachain",
        type: "string",
    })
    .option("parachain-version", {
        description: "The version of the parachain",
        type: "string",
        demandOption: true,
    })
    .option("runtime-name", {
        description: "The name of the runtime",
        type: "string",
    })
    .option("with-defaults-of", {
        description: "Which default values to use",
        choices: ["kintsugi", "interlay"],
    }).argv;

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

async function setAllClientReleases(api: ApiPromise, baseUrl: string, runtimeName: string) {
    let checksumFile;
    try {
        checksumFile = await fetch(baseUrl + "sha256sums.txt").then((res) => {
            if (!res.ok) {
                throw new Error("Bad response from server");
            }
            return res.text();
        });
    } catch (error) {
        console.error("Error fetching checksum file:", error);
        return [];
    }

    const regex = new RegExp(
        "([a-f0-9]+)\\s*[.]/((oracle|vault|faucet)-parachain-metadata-" + runtimeName + ")\n",
        "g"
    );
    const matches = [];
    let match;
    while ((match = regex.exec(checksumFile)) !== null) {
        matches.push([match[1], match[2], match[3]]);
    }

    return matches.map(([checksum, fullFileName, clientName]) => {
        return api.tx.clientsInfo.setPendingClientRelease(clientName, {
            uri: baseUrl + fullFileName,
            checksum: "0x" + checksum,
        });
    });
}

async function main(): Promise<void> {
    await cryptoWaitReady();

    switch (args["with-defaults-of"]) {
        case "interlay":
            if (args["parachain-endpoint"] === undefined) {
                args["parachain-endpoint"] = "wss://api.interlay.io/parachain";
            }
            if (args["runtime-name"] === undefined) {
                args["runtime-name"] = "interlay";
            }
            break;
        case "kintsugi":
            if (args["parachain-endpoint"] === undefined) {
                args["parachain-endpoint"] = "wss://api-kusama.interlay.io/parachain";
            }
            if (args["runtime-name"] === undefined) {
                args["runtime-name"] = "kintsugi";
            }
            break;
    }
    if (args["parachain-endpoint"] === undefined || args["runtime-name"] === undefined) {
        console.log("Not all required arguments supplied");
        return;
    }

    const parachainRepo = "https://github.com/interlay/interbtc";
    const parachainVersion = args["parachain-version"];
    console.log(`Downloading parachain runtime (${parachainVersion})...`);
    const runtimeFileName = `${args["runtime-name"]}_runtime_parachain.compact.compressed.wasm`;

    let wasmRuntime;
    try {
        wasmRuntime = await fetch(`${parachainRepo}/releases/download/${parachainVersion}/${runtimeFileName}`);
        if (!wasmRuntime.ok) {
            throw wasmRuntime.statusText;
        }
    } catch (error) {
        console.error("Error fetching WASM runtime:", error);
        return;
    }

    const wasmRuntimeRaw = await wasmRuntime.arrayBuffer();
    const codeHash = blake2AsHex(Buffer.from(wasmRuntimeRaw));
    console.log(`Blake2-256 hash: ${codeHash}`);

    const clientsRepo = "https://github.com/interlay/interbtc-clients";
    const clientsVersion = args["clients-version"];
    const clientsBaseUrl = `${clientsRepo}/releases/download/${clientsVersion}/`;

    try {
        const paraApi = await createSubstrateAPI(args["parachain-endpoint"]);

        const batched = paraApi.tx.utility.batchAll(
            [paraApi.tx.parachainSystem.authorizeUpgrade(codeHash, true)].concat(
                await setAllClientReleases(paraApi, clientsBaseUrl, args["runtime-name"])
            )
        );

        const title = `Runtime Upgrade ${parachainVersion}`;
        printDiscordProposal(title, batched, args["parachain-endpoint"], paraApi);

        await paraApi.disconnect();
    } catch (error) {
        console.error("Error with Polkadot API:", error);
    }
}
