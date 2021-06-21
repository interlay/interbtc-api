import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { DefaultTreasuryAPI, TreasuryAPI } from "../../../../src/parachain/treasury";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import Big from "big.js";

describe("TreasuryAPI", () => {
    let api: ApiPromise;
    let treasury: TreasuryAPI;
    let alice: KeyringPair;
    let bob: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
        bob = keyring.addFromUri("//Bob");
        treasury = new DefaultTreasuryAPI(api, alice);
    });

    after(() => {
        return api.disconnect();
    });

    describe("Treasury", () => {
        it("should subscribe to treasury balanace updates", async () => {
            // Subscribe and receive two balance updates

            let updatedBalance = new Big(0);
            let updatedAccount = "";
            function balanceUpdateCallback(account: string, newBalance: Big) {
                updatedBalance = newBalance;
                updatedAccount = account;
            }
            const amountToUpdateBobsAccountBy = new Big(0.00000001);
            const bobBalanceBeforeTransfer = 
                await treasury.balance(api.createType("AccountId", bob.address));
            const unsubscribe = await treasury.subscribeToBalance(bob.address, balanceUpdateCallback);

            // Send the first transfer, expect the callback to be called with correct values
            await treasury.transfer(bob.address, amountToUpdateBobsAccountBy);
            assert.equal(updatedAccount, bob.address);
            const expectedBobBalanceAfterFirstTransfer = bobBalanceBeforeTransfer.add(amountToUpdateBobsAccountBy);
            assert.equal(updatedBalance.toString(), expectedBobBalanceAfterFirstTransfer.toString());

            // Send the second transfer, expect the callback to be called with correct values
            await treasury.transfer(bob.address, amountToUpdateBobsAccountBy);
            assert.equal(updatedAccount, bob.address);
            const expectedBobBalanceAfterSecondTransfer = expectedBobBalanceAfterFirstTransfer.add(amountToUpdateBobsAccountBy);
            assert.equal(updatedBalance.toString(), expectedBobBalanceAfterSecondTransfer.toString());
            
            unsubscribe();
        });
    });

});

