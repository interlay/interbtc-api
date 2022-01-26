/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../factory";
import { ApiPromise, Keyring } from "@polkadot/api";
import {
    DefaultTransactionAPI,
} from "../parachain";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { XcmVersionedXcm } from "@polkadot/types/lookup";
import { XcmVersionedMultiLocation } from "@polkadot/types/lookup";
import { XcmV1MultiLocation } from "@polkadot/types/lookup";
import type { 
    BTreeMap, Bytes, Compact, Enum, Null, Option, Result, Struct, Text, U256, U8aFixed, Vec, bool, i128, i32, i64, u128, u16, u32, u64, u8
} from "@polkadot/types";


const PARACHAIN_ENDPOINT = "ws://127.0.0.1:9988";
const ACCOUNT_URI = "//Alice";

// const PARACHAIN_ENDPOINT = "wss://api-dev-moonbeam.interlay.io/parachain";
// const ACCOUNT_URI = "quick sense network ozone ostrich bone hole possible timber clog urban primary//sudo/1";

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

function construct_xcm(api: ApiPromise, this_chain: number, transact: string) {
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
    const depositAssetsInstruction = api.createType("XcmV2Instruction", {
        depositAsset: {
            assets:  api.createType("XcmV1MultiassetMultiAssetFilter", { wild: true }),
            maxAssets: 1,
            beneficiary: api.createType("XcmV1MultiLocation", {
                parents: 0,
                interior: api.createType("XcmV1MultilocationJunctions", {
                    // x1: api.createType("XcmV1Junction", { parachain: this_chain }) // 2000 on rococo-local
                    x1: api.createType("XcmV1Junction", { accountId32: {
                        network: api.createType("XcmV0JunctionNetworkId", { any: true }),
                        id: "0x9e5ebde744b381c1fa89428bf4aefd3a09d14789b5dd14ff52dbadd0f3ab3715" // testuser 
                    }}) // 2000 on rococo-local
                })
            })
        }
    });

    const xcmV2 = api.createType(
        "XcmV2Xcm", 
        [withdrawAssetInstruction, buyExecutionInstruction, transactInstruction, depositAssetsInstruction]
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

    return api.tx.ormlXcm.sendAsSovereign(dest, message);
}

async function main(): Promise<void> {
    await cryptoWaitReady();
    const keyring = new Keyring({ type: "sr25519" });
    const userKeyring = keyring.addFromUri(ACCOUNT_URI);
    const api = await createSubstrateAPI(PARACHAIN_ENDPOINT);

    const parent = api.createType<XcmV1MultiLocation>("XcmV1MultiLocation", {
        parents: 1,
        interior: api.createType("XcmV1MultilocationJunctions", {
            here: true
        })
    });
    const setupTx = api.tx.sudo.sudo(api.tx.polkadotXcm.forceXcmVersion(parent, 2));

    // transactions used for the purestake alpha test
    const westendRequestXcmTx = construct_xcm(api, 1002, "0x3300e80300000800000000040000");
    const westendCancelXcmTx = construct_xcm(api, 1002, "0x3306ea030000e9030000");
    const westendAcceptXcmTx = construct_xcm(api, 1002, "0x3301e8030000");
    
    // transactions used for rococo-local test
    const rococoRequestXcmTx = construct_xcm(api, 2000, "0x1700b80b00000800000000900100");

    // transactions to be used on kintsugi
    const kinstugiRequestXcmTx = construct_xcm(api, 2092, "0x3c00d0070000e803000000900100");

    console.log(kinstugiRequestXcmTx.toHex());

    const transactionAPI = new DefaultTransactionAPI(api, userKeyring);
    console.log("Constructed the tx, broadcasting first...");
    await transactionAPI.sendLogged(setupTx, undefined);
    console.log("broadcasting second...");
    await transactionAPI.sendLogged(api.tx.sudo.sudo(rococoRequestXcmTx), undefined);

    api.disconnect();
}
