/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { ApiPromise } from "@polkadot/api";
import { cryptoWaitReady, blake2AsHex, sha256AsU8a } from "@polkadot/util-crypto";
import { SubmittableExtrinsic } from "@polkadot/api/types";

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
        choices: ['kintsugi', 'interlay'],
    })
    .argv;

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

function toUrl(extrinsic: SubmittableExtrinsic<"promise">, endpoint: string) {
    return "https://polkadot.js.org/apps/?rpc=" +
        encodeURIComponent(endpoint) +
        "#/extrinsics/decode/" +
        extrinsic.method.toHex();
}

function constructProposal(api: ApiPromise, extrinsic: SubmittableExtrinsic<"promise">) {
    const deposit = api.consts.democracy.minimumDeposit.toNumber();
    const preImageSubmission = api.tx.democracy.notePreimage(extrinsic.method.toHex());
    const proposal = api.tx.democracy.propose(extrinsic.method.hash.toHex(), deposit);
    const batched = api.tx.utility.batchAll([preImageSubmission, proposal]);
    return batched
}

async function printDiscordProposal(
    description: string,
    extrinsic: SubmittableExtrinsic<"promise">,
    endpoint: string,
    api: ApiPromise,
) {
    const proposal = constructProposal(api, extrinsic);
    const invocation = process.argv.map(function (x) { return x.substring(x.lastIndexOf('/') + 1) }).join(" ");

    console.log("");
    console.log("");
    console.log("**" + description + "**");
    console.log("");
    console.log("**Extrinsic:**", toUrl(extrinsic, endpoint));
    console.log("");
    console.log("**Proposal:**", toUrl(proposal, endpoint));
    console.log("");
    console.log("_Generated with_: `" + invocation + "`");
    console.log("");
    console.log("");
}

async function setAllClientReleases(api: ApiPromise, baseUrl: String, runtimeName: String) {
    const checksumFile = await fetch(baseUrl + 'sha256sums.txt')
        .then(res => {
            if (res.status >= 400) {
                throw new Error("Bad response from server");
            }
            return res.text();
        });

    const regex = new RegExp("([a-f0-9]+)\\\s*[.]\/((oracle|vault)-parachain-metadata-" + runtimeName + ")\n", "g");
    let matches = [];
    let match;
    while ((match = regex.exec(checksumFile)) !== null) {
        matches.push([match[1], match[2], match[3]]);
    }

    return matches.map(([checksum, fullFileName, clientName]) => {
        return api.tx.clientsInfo.setCurrentClientRelease(
            clientName,
            {
                uri: baseUrl + fullFileName,
                checksum: "0x" + checksum,
            }
        )
    });
}

async function main(): Promise<void> {
    await cryptoWaitReady();

    switch (args['with-defaults-of']) {
        case 'interlay':
            if (args['parachain-endpoint'] === undefined) {
                args['parachain-endpoint'] = "wss://api.interlay.io/parachain";
            }
            if (args['runtime-name'] === undefined) {
                args['runtime-name'] = "interlay";
            }
            break;
        case 'kintsugi':
            if (args['parachain-endpoint'] === undefined) {
                args['parachain-endpoint'] = "wss://api-kusama.interlay.io/parachain";
            }
            if (args['runtime-name'] === undefined) {
                args['runtime-name'] = "kintsugi";
            }
            break;
    }
    if (args['parachain-endpoint'] === undefined
        || args['runtime-name'] === undefined) {
        console.log("Not all required arguments supplied");
        return;
    }

    const parachainRepo = "https://github.com/interlay/interbtc";
    const parachainVersion = args['parachain-version'];
    console.log(`Downloading parachain runtime (${parachainVersion})...`);
    const runtimeFileName = `${args['runtime-name']}_runtime_parachain.compact.compressed.wasm`;
    // NOTE: fetch flagged as experimental, not sure if there is a better alternative
    const wasmRuntime = await fetch(`${parachainRepo}/releases/download/${parachainVersion}/${runtimeFileName}`);
    const wasmRuntimeRaw = await wasmRuntime.arrayBuffer();
    const codeHash = blake2AsHex(Buffer.from(wasmRuntimeRaw));
    console.log(`Blake2-256 hash: ${codeHash}`);

    const clientsRepo = "https://github.com/interlay/interbtc-clients";
    const clientsVersion = args['clients-version'];
    const clientsBaseUrl = `${clientsRepo}/releases/download/${clientsVersion}/`;

    const paraApi = await createSubstrateAPI(args['parachain-endpoint']);

    const batched = paraApi.tx.utility.batchAll([
        paraApi.tx.parachainSystem.authorizeUpgrade(codeHash),
    ].concat(await setAllClientReleases(paraApi, clientsBaseUrl, args['runtime-name'])));

    const title = `Runtime Upgrade ${parachainVersion}`;
    printDiscordProposal(title, batched, args["parachain-endpoint"], paraApi);

    await paraApi.disconnect();
}
