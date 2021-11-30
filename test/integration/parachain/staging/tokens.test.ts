import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Currency, MonetaryAmount } from "@interlay/monetary-js";

import { DefaultTokensAPI, TokensAPI } from "../../../../src/parachain/tokens";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { USER_1_URI, USER_2_URI, PARACHAIN_ENDPOINT } from "../../../config";
import { CollateralCurrency, CurrencyUnit, newAccountId, newMonetaryAmount, WrappedCurrency } from "../../../../src";

describe("TokensAPI", () => {
    let api: ApiPromise;
    let tokens: TokensAPI;
    let user1Account: KeyringPair;
    let user2Account: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        user1Account = keyring.addFromUri(USER_1_URI);
        user2Account = keyring.addFromUri(USER_2_URI);
        tokens = new DefaultTokensAPI(api, user1Account);
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
        const amountToUpdateUser2sAccountBy = newMonetaryAmount(0.00000001, currency);
        const user2BalanceBeforeTransfer =
            await tokens.balance<typeof currency.units>(currency, newAccountId(api, user2Account.address));
        const unsubscribe = await tokens.subscribeToBalance(currency, user2Account.address, balanceUpdateCallback);

        // Send the first transfer, expect the callback to be called with correct values
        await tokens.transfer(user2Account.address, amountToUpdateUser2sAccountBy);
        assert.equal(updatedAccount, user2Account.address);
        const expectedUser2BalanceAfterFirstTransfer = user2BalanceBeforeTransfer.add(amountToUpdateUser2sAccountBy);
        assert.equal(updatedBalance.toString(), expectedUser2BalanceAfterFirstTransfer.toString());

        // Send the second transfer, expect the callback to be called with correct values
        await tokens.transfer(user2Account.address, amountToUpdateUser2sAccountBy);
        assert.equal(updatedAccount, user2Account.address);
        const expectedUser2BalanceAfterSecondTransfer = expectedUser2BalanceAfterFirstTransfer.add(amountToUpdateUser2sAccountBy);
        assert.equal(updatedBalance.toString(), expectedUser2BalanceAfterSecondTransfer.toString());

        unsubscribe();
    }

});

