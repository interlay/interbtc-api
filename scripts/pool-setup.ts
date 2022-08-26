/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { ApiPromise } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { addHexPrefix, newAccountId, stripHexPrefix } from "../src";

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const args = yargs(hideBin(process.argv))
    .option("parachain-endpoint", {
        description: "The wss url of the parachain",
        type: "string",
    })
    .option("x-tokens-parachain-id", {
        description: "The parachain id of the destination",
        type: "number",
        demandOption: true,
    })
    .option("x-tokens-currency-id", {
        description: "The currency to send",
        type: "string",
        demandOption: true,
    })
    .option("x-tokens-amount", {
        description: "The amount to send",
        type: "number",
        demandOption: true,
    })
    .option("destination-address", {
        description: "The hex-encoded account id",
        type: "string",
    })
    .option("destination-sovereign", {
        description: "Indicates we should transfer to the sovereign account",
        type: "bool",
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

function printExtrinsic(extrinsic: SubmittableExtrinsic<"promise">, endpoint: string) {
    console.log("Data:", extrinsic.method.toHex());
    console.log("Hash:", extrinsic.method.hash.toHex());
    const url =
        "https://polkadot.js.org/apps/?rpc=" +
        encodeURIComponent(endpoint) +
        "#/extrinsics/decode/" +
        extrinsic.method.toHex();
    console.log("Url:", url);
    console.log("");
}

function palletIdToAccountId(api: ApiPromise, palletId: any): string {
    const accountId = Buffer.concat([
        Buffer.from("modl"), // 4 bytes
        Buffer.from(palletId), // 8 bytes
    ], 32);
    return newAccountId(api, addHexPrefix(accountId.toString("hex"))).toHuman();
}

function parachainIdToAccountId(paraId: number): string {
    let paraIdBytes = Buffer.alloc(2);
    paraIdBytes.writeInt16LE(paraId);
    const accountId = Buffer.concat([
        Buffer.from("sibl"), // 4 bytes
        paraIdBytes, // 2 bytes
    ], 32);
    return addHexPrefix(accountId.toString("hex"));
}

const DEST_WEIGHT = 5000000000;

async function main(): Promise<void> {
    await cryptoWaitReady();

    switch (args['with-defaults-of']) {
        case 'interlay':
            if (args['parachain-endpoint'] === undefined) {
                args['parachain-endpoint'] = "wss://api.interlay.io/parachain";
            }
            break;
        case 'kintsugi':
            if (args['parachain-endpoint'] === undefined) {
                args['parachain-endpoint'] = "wss://api-kusama.interlay.io/parachain";
            }
            break;
    }
    if (args['parachain-endpoint'] === undefined) {
        console.log("Not all required arguments supplied");
        return;
    }

    const paraApi = await createSubstrateAPI(args['parachain-endpoint']);

    let destAccountId;
    if (args['destination-address'] !== undefined) {
        const destination = Buffer.from(stripHexPrefix(args['destination-address']), "hex");
        if (destination.byteLength == 32) {
            destAccountId = {
                AccountId32: {
                    network: "Any",
                    id: addHexPrefix(destination.toString("hex"))
                }
            }
        } else if (destination.byteLength == 20) {
            destAccountId = {
                AccountKey20: {
                    network: "Any",
                    key: addHexPrefix(destination.toString("hex"))
                }
            }
        }
    } else if (args['destination-sovereign'] === true) {
        destAccountId = {
            AccountId32: {
                network: "Any",
                id: parachainIdToAccountId(paraApi.consts.system.ss58Prefix.toNumber())
            }
        }
    } else {
        console.log("No destination account set");
        return;
    }

    const treasuryAccountId = palletIdToAccountId(paraApi, paraApi.consts.treasury.palletId);

    printExtrinsic(
        paraApi.tx.utility.dispatchAs(
            { system: { Signed: treasuryAccountId } },
            paraApi.tx.xTokens.transfer(
                { Token: args['x-tokens-currency-id'].toUpperCase() },
                args['x-tokens-amount'],
                {
                    V1: {
                        parents: 1,
                        interior: {
                            X2: [
                                { Parachain: args['x-tokens-parachain-id'] },
                                destAccountId,
                            ]
                        }
                    }
                },
                DEST_WEIGHT,
            )
        ),
        args["parachain-endpoint"]
    );

    await paraApi.disconnect();
}
