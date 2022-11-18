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
        demandOption: true,
        choices: ['request', 'accept', 'batched', 'statemin*'],
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
        choices: ['kintsugi', 'interlay', 'rococo'],
    })
    .argv;

const PROPOSED_MAX_CAPACITY = 1000;
const PROPOSED_MAX_MESSAGE_SIZE = 102400;

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

function constructXcm(api: ApiPromise, transact: string) {
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

    // the pallet is called xcmPallet on the relaychain
    let xcmPallet = api.tx.polkadotXcm === undefined ? api.tx.xcmPallet : api.tx.polkadotXcm;
    return xcmPallet.send(dest, message);
}

function printExtrinsic(name: string, extrinsic: SubmittableExtrinsic<"promise">, endpoint: string) {
    console.log(name, "Data:", extrinsic.method.toHex());
    console.log(name, "Hash:", extrinsic.method.hash.toHex());
    console.log(name, "Url:", toUrl(extrinsic, endpoint));
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
    const batched = constructProposal(api, extrinsic);

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

function printDiscordProposal(
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

async function main(): Promise<void> {
    await cryptoWaitReady();

    switch (args['with-defaults-of']) {
        case 'interlay':
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
        case 'rococo':
            if (args['parachain-endpoint'] === undefined) {
                args['parachain-endpoint'] = "wss://api-rococo.interlay.io/parachain";
            }
            if (args['relay-endpoint'] === undefined) {
                args['relay-endpoint'] = "wss://rococo-rpc.polkadot.io";
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

    const requestOpen = constructXcm(paraApi, requestOpenTransact.method.toHex());
    const acceptOpen = constructXcm(paraApi, acceptOpenTransact.method.toHex());
    const batched = paraApi.tx.utility.batchAll([requestOpen, acceptOpen]);

    const shouldSubmit = args["submit-proposal"];


    switch (args["action"]) {
        case "request":
            if (args["submit-proposal"]) {
                printExtrinsic("Relaychain::RequestOpenTransact", requestOpenTransact, args["relay-endpoint"]);
                await maybeSubmitProposal("RequestOpen", requestOpen, args["parachain-endpoint"], paraApi, shouldSubmit);
            } else {
                printDiscordProposal("Request HRMP to remote [step 1/2]", requestOpen, args["parachain-endpoint"], paraApi);
            }
            break;
        case "accept":
            if (args["submit-proposal"]) {
                printExtrinsic("Relaychain::acceptOpenTransact", acceptOpenTransact, args["relay-endpoint"]);
                await maybeSubmitProposal("AcceptOpen", acceptOpen, args["parachain-endpoint"], paraApi, shouldSubmit);
            } else {
                printDiscordProposal("Accept HRMP from remote [step 2/2]", acceptOpen, args["parachain-endpoint"], paraApi);
            }
            break;
        case "batched":
            if (args["submit-proposal"]) {
                printExtrinsic("Relaychain::RequestOpenTransact", requestOpenTransact, args["relay-endpoint"]);
                printExtrinsic("Relaychain::AcceptOpenTransact", acceptOpenTransact, args["relay-endpoint"]);
                await maybeSubmitProposal("Batched", batched, args["parachain-endpoint"], paraApi, shouldSubmit);
            } else {
                printDiscordProposal("Accept & request HRMP [step 1/1]", batched, args["parachain-endpoint"], paraApi);
            }
            break;
        case "statemin*":
            // used args for statemine (kusama): yarn hrmp-setup --action 'statemin*' --submit-proposal --destination-parachain-id 2092 --refund-hex-address 0x6d6f646c70792f74727372790000000000000000000000000000000000000000 --with-defaults-of kintsugi --parachain-endpoint "wss://statemine.api.onfinality.io/public-ws" --xcm-fee 1000000000000 --transact-weight 2000000000
            // construct batched transact call to be executed on relay chain, to accept and request
            const batchedTransact = relayApi.tx.utility.batchAll([requestOpenTransact, acceptOpenTransact]);
            const xcmStateminToRelay = constructXcm(paraApi, batchedTransact.method.toHex());

            const transferAmount = 11000000000000;
            const balanceTransfer = relayApi.tx.balances.forceTransfer('F3opxRbN5ZbjJNU511Kj2TLuzFcDq9BGduA9TgiECafpg29', 'F7fq1jSNVTPfJmaHaXCMtatT1EZefCUsa7rRiQVNR5efcah', transferAmount);

            const message = paraApi.createType("XcmVersionedXcm", {
                v2: paraApi.createType("XcmV2Xcm", [
                    paraApi.createType("XcmV2Instruction", {
                        transact: {
                            originType: paraApi.createType("XcmV0OriginKind", { superUser: true }),
                            requireWeightAtMost: 1000000000,
                            call: paraApi.createType("XcmDoubleEncoded", {
                                encoded: xcmStateminToRelay.method.toHex(),
                            }),
                        },
                    }),
                ]),
            });

            const dest = paraApi.createType<XcmVersionedMultiLocation>("XcmVersionedMultiLocation", {
                v1: paraApi.createType("XcmV1MultiLocation", {
                    parents: 0,
                    interior: paraApi.createType("XcmV1MultilocationJunctions", {
                        x1: paraApi.createType("XcmV1Junction", {
                            parachain: 1000,
                        }),
                    }),
                }),
            });

            const xcmRelayToStatemin = relayApi.tx.xcmPallet.send(dest, message);
            const preimage = relayApi.tx.utility.batchAll([balanceTransfer, xcmRelayToStatemin]);

            printExtrinsic("Statemin* xcm call", xcmStateminToRelay, args["parachain-endpoint"]);
            printExtrinsic("Relaychain::Transact", batchedTransact, args["relay-endpoint"]);
            printExtrinsic("Relaychain preimage", preimage, args["relay-endpoint"]);
            break;
    }

    await paraApi.disconnect();
    await relayApi.disconnect();
}
