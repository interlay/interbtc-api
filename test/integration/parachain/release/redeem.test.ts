import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import Big from "big.js";
import * as bitcoinjs from "bitcoinjs-lib";

import { DefaultRedeemAPI } from "../../../../src/parachain/redeem";
import { createPolkadotAPI } from "../../../../src/factory";
import { Vault } from "../../../../src/interfaces/default";
import { DEFAULT_BITCOIN_CORE_HOST, DEFAULT_BITCOIN_CORE_NETWORK, DEFAULT_BITCOIN_CORE_PASSWORD, DEFAULT_BITCOIN_CORE_PORT, DEFAULT_BITCOIN_CORE_USERNAME, DEFAULT_BITCOIN_CORE_WALLET, DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";
import { issueSingle } from "../../../../src/utils";
import { DefaultTransactionAPI } from "../../../../src";

export type RequestResult = { hash: Hash; vault: Vault };

describe("redeem", () => {
    let redeemAPI: DefaultRedeemAPI;
    let electrsAPI: DefaultElectrsAPI;
    let api: ApiPromise;
    let keyring: Keyring;
    // alice is the root account
    let alice: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
        electrsAPI = new DefaultElectrsAPI("http://0.0.0.0:3002");
    });

    beforeEach(() => {
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI);
    });

    after(() => {
        return api.disconnect();
    });

    describe("liquidation redeem", () => {
        it("should liquidate a vault that committed theft", async () => {
            const vaultToLiquidate = keyring.addFromUri("//Ferdie//stash");
            const aliceBitcoinCoreClient = new BitcoinCoreClient(
                DEFAULT_BITCOIN_CORE_NETWORK,
                DEFAULT_BITCOIN_CORE_HOST,
                DEFAULT_BITCOIN_CORE_USERNAME,
                DEFAULT_BITCOIN_CORE_PASSWORD,
                DEFAULT_BITCOIN_CORE_PORT,
                DEFAULT_BITCOIN_CORE_WALLET
            );
            await issueSingle(api, electrsAPI, aliceBitcoinCoreClient, alice, new Big("0.0001"), vaultToLiquidate.address, true, false);
            const vaultBitcoinCoreClient = new BitcoinCoreClient(
                DEFAULT_BITCOIN_CORE_NETWORK,
                DEFAULT_BITCOIN_CORE_HOST,
                DEFAULT_BITCOIN_CORE_USERNAME,
                DEFAULT_BITCOIN_CORE_PASSWORD,
                DEFAULT_BITCOIN_CORE_PORT,
                "ferdie_stash"
            );

            // Steal some bitcoin (spend from the vault's account)
            const foreignBitcoinAddress = "bcrt1qefxeckts7tkgz7uach9dnwer4qz5nyehl4sjcc";
            const amount = new Big("0.00001");
            await vaultBitcoinCoreClient.sendToAddress(foreignBitcoinAddress, amount);
            await vaultBitcoinCoreClient.mineBlocks(3);
            await DefaultTransactionAPI.waitForEvent(api, api.events.stakedRelayers.VaultTheft, 17 * 60000);

            // Burn PolkaBTC for a premium, to restore peg
            redeemAPI.setAccount(alice);
            await redeemAPI.burn(amount);

            // it takes about 15 mins for the theft to be reported
        }).timeout(18 * 60000);
    });
});
