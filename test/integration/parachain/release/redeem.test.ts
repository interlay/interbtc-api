import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import { DefaultRedeemAPI } from "../../../../src/parachain/redeem";
import { createPolkadotAPI } from "../../../../src/factory";
import { Vault } from "../../../../src/interfaces/default";
import { defaultParachainEndpoint } from "../../../config";
import * as bitcoinjs from "bitcoinjs-lib";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import Big from "big.js";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";
import { issueSingle } from "../../../../src/utils/issue";
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
        api = await createPolkadotAPI(defaultParachainEndpoint);
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
            const vaultToLiquidate = keyring.addFromUri("//Bob");
            const aliceBitcoinCoreClient = new BitcoinCoreClient("regtest", "0.0.0.0", "rpcuser", "rpcpassword", "18443", "Alice");
            await issueSingle(api, electrsAPI, aliceBitcoinCoreClient, alice, new Big("0.0001"), vaultToLiquidate.address, true, false);
            const vaultBitcoinCoreClient = new BitcoinCoreClient(
                "regtest",
                "0.0.0.0",
                "rpcuser",
                "rpcpassword",
                "18443",
                "Bob"
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
