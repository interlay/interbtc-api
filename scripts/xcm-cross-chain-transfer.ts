/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { ApiPromise, Keyring } from "@polkadot/api";
import { DefaultTransactionAPI } from "../src/parachain";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { XcmVersionedMultiLocation } from "@polkadot/types/lookup";

// const PARACHAIN_ENDPOINT = "wss://api-dev-moonbeam.interlay.io/parachain";
const PARACHAIN_ENDPOINT = "ws://127.0.0.1:9988";
const ACCOUNT_URI = "//Alice";

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

function construct_kint_transfer(api: ApiPromise, dest: XcmVersionedMultiLocation) {
    const kint = api.createType("InterbtcPrimitivesCurrencyId", {
        token: api.createType("InterbtcPrimitivesTokenSymbol", {
            kint: true,
        }),
    });

    return api.tx.xTokens.transfer(kint, 100000000000, dest, "Unlimited");
}

function construct_kbtc_transfer(api: ApiPromise, dest: XcmVersionedMultiLocation) {
    const kint = api.createType("InterbtcPrimitivesCurrencyId", {
        token: api.createType("InterbtcPrimitivesTokenSymbol", {
            kint: true,
        }),
    });
    const kbtc = api.createType("InterbtcPrimitivesCurrencyId", {
        token: api.createType("InterbtcPrimitivesTokenSymbol", {
            kbtc: true,
        }),
    });

    return api.tx.xTokens.transferMulticurrencies(
        [
            [kint, 100000000000],
            [kbtc, 100000],
        ],
        1,
        dest,
        "Unlimited"
    );
}

function construct_dest_rococo(api: ApiPromise) {
    return api.createType<XcmVersionedMultiLocation>("XcmVersionedMultiLocation", {
        v1: api.createType("XcmV1MultiLocation", {
            parents: 1,
            interior: api.createType("XcmV1MultilocationJunctions", {
                x2: [
                    api.createType("XcmV1Junction", {
                        parachain: 3000,
                    }),
                    api.createType("XcmV1Junction", {
                        accountId32: {
                            network: api.createType("XcmV0JunctionNetworkId", { any: true }),
                            id: "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d", // alice
                        },
                    }),
                ],
            }),
        }),
    });
}

function construct_dest_moonbase_alpha(api: ApiPromise) {
    return api.createType<XcmVersionedMultiLocation>("XcmVersionedMultiLocation", {
        v1: api.createType("XcmV1MultiLocation", {
            parents: 1,
            interior: api.createType("XcmV1MultilocationJunctions", {
                x2: [
                    api.createType("XcmV1Junction", {
                        parachain: 1000,
                    }),
                    api.createType("XcmV1Junction", {
                        accountKey20: {
                            network: api.createType("XcmV0JunctionNetworkId", { any: true }),
                            key: "0x09Af4E864b84706fbCFE8679BF696e8c0B472201",
                        },
                    }),
                ],
            }),
        }),
    });
}

async function main(): Promise<void> {
    await cryptoWaitReady();
    console.log("Running xcm script...");
    const keyring = new Keyring({ type: "sr25519" });
    const userKeyring = keyring.addFromUri(ACCOUNT_URI);
    const api = await createSubstrateAPI(PARACHAIN_ENDPOINT);

    const dest_rococo = construct_dest_rococo(api);
    const dest_moonbase_alpha = construct_dest_moonbase_alpha(api);

    // a basic transfer, sending one currency that is also used to pay xcm fee
    const xcmKintTransferTx = construct_kint_transfer(api, dest_rococo);
    // send kbtc but use kint to pay for xcm fee on target chain
    const xcmKbtcTransferTx = construct_kbtc_transfer(api, dest_rococo);

    const transactionAPI = new DefaultTransactionAPI(api, userKeyring);
    console.log("broadcasting...");
    await transactionAPI.sendLogged(xcmKintTransferTx, undefined);

    api.disconnect();
}
