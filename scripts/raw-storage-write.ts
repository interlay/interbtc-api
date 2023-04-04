/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { Keyring } from "@polkadot/api";
import { DefaultTransactionAPI } from "../src/parachain";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { DemocracyVote } from "@polkadot/types/lookup";

const PARACHAIN_ENDPOINT = "ws://127.0.0.1:8000";
const ACCOUNT_URI = "//Alice";

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

async function main(): Promise<void> {
    const api = await createSubstrateAPI(PARACHAIN_ENDPOINT);

    const collaterals = [
        { Token: "KSM" },
        { Token: "KINT" },
        { ForeignAsset: 3 },
    ];

    let collateralAmount = 1000000000000;

    const newPairs = collaterals.map(function (collateralAsset) {
        const key = api.query.vaultRegistry.liquidationVault.key({collateral: collateralAsset, wrapped: {Token: "KBTC"} });
        const value =  api.createType("VaultRegistrySystemVault",
        {
            toBeIssuedTokens: 50000,
            issuedTokens: 100000,
            toBeRedeemedTokens: 50000,
            collateral: collateralAmount,
            currencyPair: {
              collateral: collateralAsset,
              wrapped: {
                Token: "KBTC"
              }
            }
          }
        ).toHex();
        return [key, value]
    });

    const fundingTxs = collaterals.map(function (collateralAsset) {
       return api.tx.tokens.setBalance('a3cgeH7D28bBsHbch2n7DChKEapamDqY9yAm441K9WUQZbBGJ', collateralAsset, collateralAmount, 0); 
    });
    const tx = api.tx.system.setStorage(newPairs as any);
    const batch = api.tx.utility.batchAll([fundingTxs, tx].flat());
    const sudo = api.tx.sudo.sudo(batch);
    console.log(sudo.method.toHex());
}
