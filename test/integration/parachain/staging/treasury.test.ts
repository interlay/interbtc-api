import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { DefaultTokensAPI, TokensAPI } from "../../../../src/parachain/tokens";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import Big from "big.js";
import { CurrencyIdLiteral } from "../../../../src";

describe("TokensAPI", () => {
    let api: ApiPromise;
    let tokens: TokensAPI;
    let alice: KeyringPair;
    let bob: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
        bob = keyring.addFromUri("//Bob");
        tokens = new DefaultTokensAPI(api, alice);
    });

    after(() => {
        return api.disconnect();
    });

    it("should subscribe to DOT balanace updates", async () => {
        testBalanceSubscription(CurrencyIdLiteral.DOT);
    });

    it("should subscribe to INTERBTC balanace updates", async () => {
        testBalanceSubscription(CurrencyIdLiteral.INTERBTC);
    });

    async function testBalanceSubscription(currencyId: CurrencyIdLiteral): Promise<void> {
        // Subscribe and receive two balance updates
        let updatedBalance = new Big(0);
        let updatedAccount = "";
        function balanceUpdateCallback(account: string, newBalance: Big) {
            updatedBalance = newBalance;
            updatedAccount = account;
        }
        const amountToUpdateBobsAccountBy = new Big(0.00000001);
        const bobBalanceBeforeTransfer = 
            await tokens.balance(currencyId, api.createType("AccountId", bob.address));
        const unsubscribe = await tokens.subscribeToBalance(currencyId, bob.address, balanceUpdateCallback);

        // Send the first transfer, expect the callback to be called with correct values
        await tokens.transfer(currencyId, bob.address, amountToUpdateBobsAccountBy);
        assert.equal(updatedAccount, bob.address);
        const expectedBobBalanceAfterFirstTransfer = bobBalanceBeforeTransfer.add(amountToUpdateBobsAccountBy);
        assert.equal(updatedBalance.toString(), expectedBobBalanceAfterFirstTransfer.toString());

        // Send the second transfer, expect the callback to be called with correct values
        await tokens.transfer(currencyId, bob.address, amountToUpdateBobsAccountBy);
        assert.equal(updatedAccount, bob.address);
        const expectedBobBalanceAfterSecondTransfer = expectedBobBalanceAfterFirstTransfer.add(amountToUpdateBobsAccountBy);
        assert.equal(updatedBalance.toString(), expectedBobBalanceAfterSecondTransfer.toString());
        
        unsubscribe();
    }

});

