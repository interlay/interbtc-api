/* eslint @typescript-eslint/no-var-requires: "off" */
import { createPolkadotAPI } from "../factory";
import { Keyring } from "@polkadot/api";
import {
    DefaultTransactionAPI,
} from "../parachain";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { XcmVersionedXcm } from "@polkadot/types/lookup";


const PARACHAIN_ENDPOINT = "ws://127.0.0.1:9944";
const ACCOUNT_URI = "//Alice";

main().catch((err) => {
    console.log("Error during initialization:");
    console.log(err);
});

async function main(): Promise<void> {
    await cryptoWaitReady();
    console.log("Running xcm script...");
    const keyring = new Keyring({ type: "sr25519" });
    const userKeyring = keyring.addFromUri(ACCOUNT_URI);
    const api = await createPolkadotAPI(PARACHAIN_ENDPOINT);

    const transactionAPI = new DefaultTransactionAPI(api, userKeyring);

    const maxWeight = 1000000000;

    const interior = api.createType("XcmV1MultilocationJunctions", {
        here: true
    });
    const concrete = api.createType("XcmV1MultiLocation", {
        parents: 0,
        interior: interior
    });
    const withdrawAsset = api.createType("XcmV1MultiassetMultiAssets", [{
        id: api.createType("XcmV1MultiassetAssetId", {
            concrete: concrete
        }),
        fun: api.createType("XcmV1MultiassetFungibility", {
            fungible: 100000000000
        })
        
    }])
    const xcmV2Instruction = api.createType("XcmV2Instruction", {
        withdrawAsset: withdrawAsset
    });
    const xcmV2 = api.createType("XcmV2Xcm", [xcmV2Instruction])
    const message = api.createType<XcmVersionedXcm>("XcmVersionedXcm", {
        v2: xcmV2
    });

    const tx = api.tx.polkadotXcm.execute(message, maxWeight);

    // Optionally define a success event to listen for
    // const successEvent = api.events.polkadotXcm.ResponseReady;
    const successEvent = undefined;

    console.log("Constructed the tx, broadcasting...");
    await transactionAPI.sendLogged(tx, successEvent);

    api.disconnect();
}
