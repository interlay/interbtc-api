/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { ApiPromise, Keyring } from "@polkadot/api";
import {
    DefaultTransactionAPI,
} from "../src/parachain";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { XcmVersionedXcm } from "@polkadot/types/lookup";
import { XcmVersionedMultiLocation } from "@polkadot/types/lookup";
import { XcmV1MultiLocation } from "@polkadot/types/lookup";
import type { 
    BTreeMap, Bytes, Compact, Enum, Null, Option, Result, Struct, Text, U256, U8aFixed, Vec, bool, i128, i32, i64, u128, u16, u32, u64, u8
} from "@polkadot/types";
import { SubmittableExtrinsic } from "@polkadot/api/types";

// Modify these consts when using this script for new channels
const RELAYCHAIN_ENDPOINT = "wss://kusama-rpc.polkadot.io";
const PARACHAIN_ENDPOINT = "wss://api-kusama.interlay.io/parachain";
const DEST_PARA = 2085;
const PROPOSED_MAX_CAPACITY = 1000;
const PROPOSED_MAX_MESSAGE_SIZE = 102400;
const REFUND_ADDRESS_HEX = "0xa2e1685f62b2a1a996a2a1ba10ac6836c2b72174cab1bd1c6907454e6365fb70";

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

function construct_xcm(api: ApiPromise, transact: string) {
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
                fungible: 410000000000
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
                            here: true
                        })
                    })
                }),
                fun: api.createType("XcmV1MultiassetFungibility", {
                    fungible: 400000000000
                })
            }),
            weightLimit: api.createType("XcmV2WeightLimit", {
                unlimited: true
            })
        }
    });
    const transactInstruction = api.createType("XcmV2Instruction", {
        transact: {
            originType: api.createType("XcmV0OriginKind", { native: true }),
            requireWeightAtMost: 10000000000, // 42.9996 micro KSM on 20 jan. 42_999_600. About 20x margin, more than enough
            call: api.createType("XcmDoubleEncoded", {
                encoded: transact
            })
        }
    });
    const refundSurplusInstruction = api.createType("XcmV2Instruction", {
        refundSurplus: true
    });
    const depositAssetsInstruction = api.createType("XcmV2Instruction", {
        depositAsset: {
            assets:  api.createType("XcmV1MultiassetMultiAssetFilter", { wild: true }),
            maxAssets: 1,
            beneficiary: api.createType("XcmV1MultiLocation", {
                parents: 0,
                interior: api.createType("XcmV1MultilocationJunctions", {
                    x1: api.createType("XcmV1Junction", { accountId32: {
                        network: api.createType("XcmV0JunctionNetworkId", { any: true }),
                        id: REFUND_ADDRESS_HEX 
                    }})
                })
            })
        }
    });

    const xcmV2 = api.createType(
        "XcmV2Xcm", 
        [withdrawAssetInstruction, buyExecutionInstruction, transactInstruction, refundSurplusInstruction, depositAssetsInstruction]
    );
    const message = api.createType<XcmVersionedXcm>("XcmVersionedXcm", {
        v2: xcmV2
    });

    const dest = api.createType<XcmVersionedMultiLocation>("XcmVersionedMultiLocation", {
        v1: api.createType("XcmV1MultiLocation", {
            parents: 1,
            interior: api.createType("XcmV1MultilocationJunctions", {
                here: true
            })
        })
    });

    return api.tx.polkadotXcm.send(dest, message);
}

function printExtrinsic(name: string, extrinsic: SubmittableExtrinsic<"promise">, endpoint: string) {
    console.log(name, "Data:", extrinsic.method.toHex());
    console.log(name, "Hash:", extrinsic.method.hash.toHex());
    const url = 'https://polkadot.js.org/apps/?rpc=' 
        + encodeURIComponent(endpoint) 
        + '#/extrinsics/decode/' 
        + extrinsic.method.toHex();
    console.log(name, "url:", url);
    console.log("");
}

async function main(): Promise<void> {
    await cryptoWaitReady();
    const paraApi = await createSubstrateAPI(PARACHAIN_ENDPOINT);
    const relayApi = await createSubstrateAPI(RELAYCHAIN_ENDPOINT);

    const requestOpenTransact = relayApi.tx.hrmp.hrmpInitOpenChannel(DEST_PARA, PROPOSED_MAX_CAPACITY, PROPOSED_MAX_MESSAGE_SIZE);
    const acceptOpenTransact = relayApi.tx.hrmp.hrmpAcceptOpenChannel(DEST_PARA);

    const requestOpen = construct_xcm(paraApi, requestOpenTransact.method.toHex());
    const acceptOpen = construct_xcm(paraApi, acceptOpenTransact.method.toHex());
    const batched = paraApi.tx.utility.batchAll([requestOpen, acceptOpen]);

    // The transact calls to be executed on the relay chain
    printExtrinsic("Relaychain::RequestOpenTransact", requestOpenTransact, RELAYCHAIN_ENDPOINT);
    printExtrinsic("Relaychain::acceptOpenTransact", requestOpen, RELAYCHAIN_ENDPOINT);
    
    // To be executed on parachain
    printExtrinsic("Parachain::RequestOpen", requestOpen, PARACHAIN_ENDPOINT);
    printExtrinsic("Parachain::AcceptOpen", acceptOpen, PARACHAIN_ENDPOINT);
    printExtrinsic("Parachain::Batched", batched, PARACHAIN_ENDPOINT);

    paraApi.disconnect();
    relayApi.disconnect();
}
