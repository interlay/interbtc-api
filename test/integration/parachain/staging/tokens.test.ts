import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";

import { createSubstrateAPI } from "../../../../src/factory";
import { USER_1_URI, USER_2_URI, PARACHAIN_ENDPOINT, ESPLORA_BASE_PATH } from "../../../config";
import {
    ATOMIC_UNIT,
    ChainBalance,
    CollateralCurrencyExt,
    CurrencyExt,
    DefaultInterBtcApi,
    InterBtcApi,
} from "../../../../src";
import { newAccountId, newMonetaryAmount } from "../../../../src/utils";
import { getCorrespondingCollateralCurrenciesForTests, submitExtrinsic } from "../../../utils/helpers";

describe("TokensAPI", () => {
    let api: ApiPromise;
    let user1Account: KeyringPair;
    let user2Account: KeyringPair;
    let interBtcAPI: InterBtcApi;
    let collateralCurrencies: Array<CollateralCurrencyExt>;

    beforeAll(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        user1Account = keyring.addFromUri(USER_1_URI);
        user2Account = keyring.addFromUri(USER_2_URI);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", user1Account, ESPLORA_BASE_PATH);
        collateralCurrencies = getCorrespondingCollateralCurrenciesForTests(interBtcAPI.getGovernanceCurrency());
    });

    afterAll(() => {
        return api.disconnect();
    });

    it("should subscribe to balance updates", async () => {
        for (const currency of collateralCurrencies) {
            await testBalanceSubscription(currency);
        }
    });

    async function testBalanceSubscription(currency: CurrencyExt): Promise<void> {
        // Subscribe and receive two balance updates
        let updatedBalance = new ChainBalance(currency);
        let updatedAccount = "";
        function balanceUpdateCallback(account: string, newBalance: ChainBalance) {
            updatedBalance = newBalance;
            updatedAccount = account;
        }
        const amountToUpdateUser2sAccountBy = newMonetaryAmount(10, currency, true);
        const user2BalanceBeforeTransfer = await interBtcAPI.tokens.balance(
            currency,
            newAccountId(api, user2Account.address)
        );
        const unsubscribe = await interBtcAPI.tokens.subscribeToBalance(
            currency,
            user2Account.address,
            balanceUpdateCallback
        );

        // Send the first transfer, expect the callback to be called with correct values
        await submitExtrinsic(
            interBtcAPI,
            interBtcAPI.tokens.transfer(user2Account.address, amountToUpdateUser2sAccountBy)
        );
        expect(updatedAccount).toEqual(user2Account.address);
        const expectedUser2BalanceAfterFirstTransfer = new ChainBalance(
            currency,
            user2BalanceBeforeTransfer.free.add(amountToUpdateUser2sAccountBy).toBig(ATOMIC_UNIT),
            user2BalanceBeforeTransfer.transferable.add(amountToUpdateUser2sAccountBy).toBig(ATOMIC_UNIT),
            user2BalanceBeforeTransfer.reserved.toBig(ATOMIC_UNIT)
        );
        expect(updatedBalance.toString()).toEqual(expectedUser2BalanceAfterFirstTransfer.toString());

        // Send the second transfer, expect the callback to be called with correct values
        await submitExtrinsic(
            interBtcAPI,
            interBtcAPI.tokens.transfer(user2Account.address, amountToUpdateUser2sAccountBy)
        );
        expect(updatedAccount).toEqual(user2Account.address);
        const expectedUser2BalanceAfterSecondTransfer = new ChainBalance(
            currency,
            expectedUser2BalanceAfterFirstTransfer.free.add(amountToUpdateUser2sAccountBy).toBig(ATOMIC_UNIT),
            expectedUser2BalanceAfterFirstTransfer.transferable.add(amountToUpdateUser2sAccountBy).toBig(ATOMIC_UNIT),
            expectedUser2BalanceAfterFirstTransfer.reserved.toBig(ATOMIC_UNIT)
        );
        expect(updatedBalance.toString()).toEqual(expectedUser2BalanceAfterSecondTransfer.toString());

        // TODO: Commented out because it blocks release, fix.
        // Fails because it conflicts with the escrowAPI test:
        // Error: tokens.LiquidityRestrictions Failed because liquidity restrictions due to locking

        // if (currency.name === Interlay.name) {
        //     const currentBlockNumber = await interBtcAPI.system.getCurrentBlockNumber();
        //     const unlockHeightDiff = (await escrowAPI.getSpan()).toNumber();

        //     const amountToFreeze = newMonetaryAmount(600, currency as Currency<U>, true);
        //     await escrowAPI.createLock(
        //         amountToFreeze as unknown as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>,
        //         currentBlockNumber + unlockHeightDiff
        //     );

        //     const expectedUser2BalanceAfterEscrowLock = new ChainBalance<U>(
        //         currency,
        //         expectedUser2BalanceAfterSecondTransfer.free.toBig(),
        //         expectedUser2BalanceAfterSecondTransfer.transferable.sub(amountToFreeze).toBig(),
        //         expectedUser2BalanceAfterSecondTransfer.reserved.toBig()
        //     );

        //     assert.equal(updatedAccount, user2Account.address);
        //     assert.equal(updatedBalance.toString(), expectedUser2BalanceAfterEscrowLock.toString());
        // }
        unsubscribe();
    }
});
