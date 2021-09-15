import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Currency, MonetaryAmount } from "@interlay/monetary-js";

import { DefaultTokensAPI, TokensAPI } from "../../../../src/parachain/tokens";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { ALICE_URI, BOB_URI, DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import { CollateralCurrency, CurrencyUnit, newMonetaryAmount, WrappedCurrency } from "../../../../src";

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

    it("should subscribe to balance updates", async () => {
        for (const currency of [...CollateralCurrency, ...WrappedCurrency]) {
            await testBalanceSubscription(currency as Currency<CurrencyUnit>);
        }
    });

    async function testBalanceSubscription<U extends CurrencyUnit>(currency: Currency<U>): Promise<void> {
        // Subscribe and receive two balance updates
        let updatedBalance = newMonetaryAmount(0, currency);
        let updatedAccount = "";
        function balanceUpdateCallback(account: string, newBalance: MonetaryAmount<Currency<U>, U>) {
            updatedBalance = newBalance;
            updatedAccount = account;
        }
        const amountToUpdateBobsAccountBy = newMonetaryAmount(0.00000001, currency);
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

