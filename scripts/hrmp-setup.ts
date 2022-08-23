/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { ApiPromise, Keyring } from "@polkadot/api";
import { DefaultTransactionAPI } from "../src/parachain";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { XcmVersionedMultiLocation } from "@polkadot/types/lookup";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { assert } from "console";

const readline = require("readline");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const args = yargs(hideBin(process.argv))
    .option("submit-proposal", {
        type: "boolean",
        description: "Submit the on-chain proposal. The account seed will be queried.",
    })
    .option("sudo", {
        type: "boolean",
        description: "Print the sudo-wrapped extrinsic",
        conflicts: "submit-proposal",
    })
    .option("relay-endpoint", {
        description: "The wss url of the relay chain",
        type: "string",
    })
    .option("parachain-endpoint", {
        description: "The wss url of the parachain",
        type: "string",
    })
    .option("destination-parachain-id", {
        description: "The parachain id of the destination",
        type: "number",
        demandOption: true,
    })
    .option("refund-hex-address", {
        description: "The hex-encoded account id to return left-over fees to. DO NOT SS58 ENCODE.",
        type: "string",
        demandOption: true,
    })
    .option("action", {
        description: "The action to do",
        demandOption : true,
        choices: ['request', 'accept', 'batched'],
    })
    .option("xcm-fee", {
        description: "The amount to use for the xcm fee",
        type: "number",
    })
    .option("transact-weight", {
        description: "Upperbound to specify for the transact weight",
        type: "number",
    })
    .option("with-defaults-of", {
        description: "Which default values to use",
        choices: ['kintsugi', 'polkadot'],
    })
    .argv;

const PROPOSED_MAX_CAPACITY = 1000;
const PROPOSED_MAX_MESSAGE_SIZE = 102400;

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

function construct_xcm(api: ApiPromise, transact: string) {
    const xcmFee = args['xcm-fee'];
    const transactWeight = args['transact-weight'];

    const withdrawAssetInstruction = api.createType("XcmV2Instruction", {
        withdrawAsset: api.createType("XcmV1MultiassetMultiAssets", [{
            id: api.createType("XcmV1MultiassetAssetId", {
                concrete: api.createType("XcmV1MultiLocation", {
                    parents: 0,
                    interior: api.createType("XcmV1MultilocationJunctions", {
                        here: true
                    })
                })
            }),
            fun: api.createType("XcmV1MultiassetFungibility", {
                fungible: xcmFee
            })
        }])
    });
    const buyExecutionInstruction = api.createType("XcmV2Instruction", {
        buyExecution: {
            fees: api.createType("XcmV1MultiAsset", {
                id: api.createType("XcmV1MultiassetAssetId", {
                    concrete: api.createType("XcmV1MultiLocation", {
                        parents: 0,
                        interior: api.createType("XcmV1MultilocationJunctions", {
                            here: true,
                        }),
                    }),
                }),
                fun: api.createType("XcmV1MultiassetFungibility", {
                    fungible: xcmFee
                })
            }),
            weightLimit: api.createType("XcmV2WeightLimit", {
                unlimited: true,
            }),
        },
    });
    const transactInstruction = api.createType("XcmV2Instruction", {
        transact: {
            originType: api.createType("XcmV0OriginKind", { native: true }),
            requireWeightAtMost: transactWeight,
            call: api.createType("XcmDoubleEncoded", {
                encoded: transact,
            }),
        },
    });
    const refundSurplusInstruction = api.createType("XcmV2Instruction", {
        refundSurplus: true,
    });
    const depositAssetsInstruction = api.createType("XcmV2Instruction", {
        depositAsset: {
            assets: api.createType("XcmV1MultiassetMultiAssetFilter", { wild: true }),
            maxAssets: 1,
            beneficiary: api.createType("XcmV1MultiLocation", {
                parents: 0,
                interior: api.createType("XcmV1MultilocationJunctions", {
                    x1: api.createType("XcmV1Junction", {
                        accountId32: {
                            network: api.createType("XcmV0JunctionNetworkId", { any: true }),
                            id: args["refund-hex-address"],
                        },
                    }),
                }),
            }),
        },
    });

    const xcmV2 = api.createType("XcmV2Xcm", [
        withdrawAssetInstruction,
        buyExecutionInstruction,
        transactInstruction,
        refundSurplusInstruction,
        depositAssetsInstruction,
    ]);
    const message = api.createType("XcmVersionedXcm", {
        v2: xcmV2,
    });

    const dest = api.createType<XcmVersionedMultiLocation>("XcmVersionedMultiLocation", {
        v1: api.createType("XcmV1MultiLocation", {
            parents: 1,
            interior: api.createType("XcmV1MultilocationJunctions", {
                here: true,
            }),
        }),
    });

    return api.tx.polkadotXcm.send(dest, message);
}

function printExtrinsic(name: string, extrinsic: SubmittableExtrinsic<"promise">, endpoint: string) {
    console.log(name, "Data:", extrinsic.method.toHex());
    console.log(name, "Hash:", extrinsic.method.hash.toHex());
    const url =
        "https://polkadot.js.org/apps/?rpc=" +
        encodeURIComponent(endpoint) +
        "#/extrinsics/decode/" +
        extrinsic.method.toHex();
    console.log(name, "url:", url);
    console.log("");
}

async function maybeSubmitProposal(
    name: string,
    extrinsic: SubmittableExtrinsic<"promise">,
    endpoint: string,
    api: ApiPromise,
    shouldSubmit: boolean
) {
    printExtrinsic(name, extrinsic, endpoint);

    if (args['sudo']) {
        printExtrinsic('sudo', api.tx.sudo.sudo(extrinsic), endpoint);
    }

    if (!shouldSubmit) {
        return;
    }

    // construct the proposal
    const deposit = api.consts.democracy.minimumDeposit.toNumber();
    const preImageSubmission = api.tx.democracy.notePreimage(extrinsic.method.toHex());
    const proposal = api.tx.democracy.propose(extrinsic.method.hash.toHex(), deposit);
    const batched = api.tx.utility.batchAll([preImageSubmission, proposal]);

    printExtrinsic('proposal', batched, endpoint);

    console.log("Please check the printed extrinsic and enter the seed phrase to submit the proposal.");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const it = rl[Symbol.asyncIterator]();
    const seed = await it.next();

    console.log("Submitting proposal...");
    const keyring = new Keyring({ type: "sr25519" });
    const userKeyring = keyring.addFromUri(seed.value);
    const transactionAPI = new DefaultTransactionAPI(api, userKeyring);
    await transactionAPI.sendLogged(batched, undefined);

    rl.close();
}

async function main(): Promise<void> {
    await cryptoWaitReady();

    switch (args['with-defaults-of']) {
        case 'polkadot':
            if (args['parachain-endpoint'] === undefined) {
                args['parachain-endpoint'] = "wss://api.interlay.io/parachain";
            }
            if (args['relay-endpoint'] === undefined) {
                args['relay-endpoint'] = "wss://rpc.polkadot.io";
            }
            if (args['xcm-fee'] === undefined) {
                args['xcm-fee'] = 5000000000; // 0.5 dot
            }
            if (args['transact-weight'] === undefined) {
                args['transact-weight'] = 10000000000;
            }
            break;
        case 'kintsugi':
            if (args['parachain-endpoint'] === undefined) {
                args['parachain-endpoint'] = "wss://api-kusama.interlay.io/parachain";
            }
            if (args['relay-endpoint'] === undefined) {
                args['relay-endpoint'] = "wss://kusama-rpc.polkadot.io";
            }
            if (args['xcm-fee'] === undefined) {
                args['xcm-fee'] = 410000000000;
            }
            if (args['transact-weight'] === undefined) {
                args['transact-weight'] = 10000000000;
            }
            break;
    }
    if (args['parachain-endpoint'] === undefined
            || args['relay-endpoint'] === undefined
            || args['xcm-fee'] === undefined
            || args['transact-weight'] === undefined) {
        console.log("Not all required arguments supplied");
        return;
    }

    
    const paraApi = await createSubstrateAPI(args['parachain-endpoint']);
    const relayApi = await createSubstrateAPI(args['relay-endpoint']);

    const requestOpenTransact = relayApi.tx.hrmp.hrmpInitOpenChannel(
        args["destination-parachain-id"],
        PROPOSED_MAX_CAPACITY,
        PROPOSED_MAX_MESSAGE_SIZE
    );
    const acceptOpenTransact = relayApi.tx.hrmp.hrmpAcceptOpenChannel(args["destination-parachain-id"]);

    const requestOpen = construct_xcm(paraApi, requestOpenTransact.method.toHex());
    const acceptOpen = construct_xcm(paraApi, acceptOpenTransact.method.toHex());
    const batched = paraApi.tx.utility.batchAll([requestOpen, acceptOpen]);

    const shouldSubmit = args["submit-proposal"];

    switch (args["action"]) {
        case "request":
            printExtrinsic("Relaychain::RequestOpenTransact", requestOpenTransact, args["relay-endpoint"]);
            await maybeSubmitProposal("RequestOpen", requestOpen, args["parachain-endpoint"], paraApi, shouldSubmit);
            break;
        case "accept":
            printExtrinsic("Relaychain::acceptOpenTransact", acceptOpenTransact, args["relay-endpoint"]);
            await maybeSubmitProposal("AcceptOpen", acceptOpen, args["parachain-endpoint"], paraApi, shouldSubmit);
            break;
        case "batched":
            printExtrinsic("Relaychain::RequestOpenTransact", requestOpenTransact, args["relay-endpoint"]);
            printExtrinsic("Relaychain::AcceptOpenTransact", acceptOpenTransact, args["relay-endpoint"]);
            await maybeSubmitProposal("Batched", batched, args["parachain-endpoint"], paraApi, shouldSubmit);
            break;
    }

    await paraApi.disconnect();
    await relayApi.disconnect();
}
