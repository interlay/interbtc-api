/* eslint @typescript-eslint/no-var-requires: "off" */
import { createPolkadotAPI } from "../factory";
import { Keyring } from "@polkadot/api";
import {
    DefaultTransactionAPI,
} from "../parachain";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { XcmVersionedMultiLocation } from "@polkadot/types/lookup";
import { XcmV1MultiLocation } from "@polkadot/types/lookup";


const PARACHAIN_ENDPOINT = "ws://127.0.0.1:9988";
const ACCOUNT_URI = "//Alice";

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

async function main(): Promise<void> {
    await cryptoWaitReady();
    console.log("Running xcm script...");
    const keyring = new Keyring({ type: "sr25519" });
    const userKeyring = keyring.addFromUri(ACCOUNT_URI);
    const api = await createPolkadotAPI(PARACHAIN_ENDPOINT);

    const transactionAPI = new DefaultTransactionAPI(api, userKeyring);

    const currencyId = api.createType("InterbtcPrimitivesCurrencyId", { 
        token: api.createType("InterbtcPrimitivesTokenSymbol", {
            kint: true,
        }) 
    });

    const dest = api.createType<XcmVersionedMultiLocation>("XcmVersionedMultiLocation", {
        v1: api.createType("XcmV1MultiLocation", {
            parents: 1,
            interior: api.createType("XcmV1MultilocationJunctions", {
                x2: [
                    api.createType("XcmV1Junction", { 
                    parachain: 3000 
                }), api.createType("XcmV1Junction", { 
                    accountId32: {
                        network: api.createType("XcmV0JunctionNetworkId", { any: true }),
                        id: "0x8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48" // bob 
                    }
                })]
            })
        })
    });

    
    const sibling = api.createType<XcmV1MultiLocation>("XcmV1MultiLocation", {
        parents: 1,
        interior: api.createType("XcmV1MultilocationJunctions", {
            x1: api.createType("XcmV1Junction", { parachain: 3000 })
        })
    });

    const setupTx = api.tx.sudo.sudo(api.tx.polkadotXcm.forceXcmVersion(sibling, 2));
    const xcmTx = api.tx.xTokens.transfer(currencyId, 1000000000, dest, 4000000000);

    console.log("Constructed the tx, broadcasting first...");
    await transactionAPI.sendLogged(setupTx, undefined);
    console.log("broadcasting second...");
    await transactionAPI.sendLogged(xcmTx, undefined);

    api.disconnect();
}
