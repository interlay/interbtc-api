import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bitcoin, Currency, MonetaryAmount, Polkadot } from "@interlay/monetary-js";

import { DefaultTokensAPI, TokensAPI } from "../../../../src/parachain/tokens";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { ALICE_URI, BOB_URI, DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import { CurrencyUnit } from "../../../../src";

describe("TokensAPI", () => {
    let api: ApiPromise;
    let tokens: TokensAPI;
    let alice: KeyringPair;
    let bob: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri(ALICE_URI);
        bob = keyring.addFromUri(BOB_URI);
        tokens = new DefaultTokensAPI(api, alice);
    });

    after(() => {
        return api.disconnect();
    });

    it("should subscribe to DOT balance updates", async () => {
        testBalanceSubscription(Polkadot);
    });

    it("should subscribe to INTERBTC balance updates", async () => {
        testBalanceSubscription(Bitcoin);
    });

    async function testBalanceSubscription<C extends CurrencyUnit>(currency: Currency<C>): Promise<void> {
        // Subscribe and receive two balance updates
        let updatedBalance = new MonetaryAmount<Currency<C>, C>(currency, 0);
        let updatedAccount = "";
        function balanceUpdateCallback(account: string, newBalance: MonetaryAmount<Currency<C>, C>) {
            updatedBalance = newBalance;
            updatedAccount = account;
        }
        const amountToUpdateBobsAccountBy = new MonetaryAmount<Currency<C>, C>(currency, 0.00000001);
        const bobBalanceBeforeTransfer =
            await tokens.balance<typeof currency.units>(currency, api.createType("AccountId", bob.address));
        const unsubscribe = await tokens.subscribeToBalance(currency, bob.address, balanceUpdateCallback);

        // Send the first transfer, expect the callback to be called with correct values
        await tokens.transfer(bob.address, amountToUpdateBobsAccountBy);
        assert.equal(updatedAccount, bob.address);
        const expectedBobBalanceAfterFirstTransfer = bobBalanceBeforeTransfer.add(amountToUpdateBobsAccountBy);
        assert.equal(updatedBalance.toString(), expectedBobBalanceAfterFirstTransfer.toString());

        // Send the second transfer, expect the callback to be called with correct values
        await tokens.transfer(bob.address, amountToUpdateBobsAccountBy);
        assert.equal(updatedAccount, bob.address);
        const expectedBobBalanceAfterSecondTransfer = expectedBobBalanceAfterFirstTransfer.add(amountToUpdateBobsAccountBy);
        assert.equal(updatedBalance.toString(), expectedBobBalanceAfterSecondTransfer.toString());

        unsubscribe();
    }

});

