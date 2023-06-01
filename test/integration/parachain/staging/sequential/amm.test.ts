import { assert } from "../../../../chai";
import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { InterbtcPrimitivesCurrencyId } from "@polkadot/types/lookup";
import { createSubstrateAPI } from "../../../../../src/factory";
import { ESPLORA_BASE_PATH, PARACHAIN_ENDPOINT, SUDO_URI } from "../../../../config";
import {
    CurrencyExt,
    DefaultInterBtcApi,
    DefaultTransactionAPI,
    LiquidityPool,
    newAccountId,
    newCurrencyId,
    newMonetaryAmount,
} from "../../../../../src";
import { makeRandomPolkadotKeyPair, submitExtrinsic } from "../../../../utils/helpers";
import BN from "bn.js";
import { AnyNumber } from "@polkadot/types-codec/types";

async function setBalance(
    api: ApiPromise,
    sudoAccount: KeyringPair,
    userAccount: KeyringPair,
    currencyId: InterbtcPrimitivesCurrencyId,
    amountFree: AnyNumber
) {
    await DefaultTransactionAPI.sendLogged(
        api,
        sudoAccount,
        api.tx.sudo.sudo(api.tx.tokens.setBalance(userAccount.address, currencyId, amountFree, 0))
    );
}

async function createAndFundPair(
    api: ApiPromise,
    sudoAccount: KeyringPair,
    asset0: InterbtcPrimitivesCurrencyId,
    asset1: InterbtcPrimitivesCurrencyId,
    amount0: BN,
    amount1: BN
) {
    await DefaultTransactionAPI.sendLogged(
        api,
        sudoAccount,
        api.tx.sudo.sudo(api.tx.dexGeneral.createPair(asset0, asset1, 30))
    );
    await setBalance(api, sudoAccount, sudoAccount, asset0, "1152921504606846976");
    await setBalance(api, sudoAccount, sudoAccount, asset1, "1152921504606846976");

    await DefaultTransactionAPI.sendLogged(
        api,
        sudoAccount,
        api.tx.dexGeneral.addLiquidity(asset0, asset1, amount0, amount1, amount0, amount1, 999999)
    );
}

describe("AMM", () => {
    let api: ApiPromise;
    let interBtcAPI: DefaultInterBtcApi;

    let lpAccount: KeyringPair;
    let sudoAccount: KeyringPair;

    let currency0: CurrencyExt;
    let currency1: CurrencyExt;
    let asset0: InterbtcPrimitivesCurrencyId;
    let asset1: InterbtcPrimitivesCurrencyId;

    before(async () => {
        const keyring = new Keyring({ type: "sr25519" });
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);

        sudoAccount = keyring.addFromUri(SUDO_URI);
        lpAccount = makeRandomPolkadotKeyPair(keyring);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", lpAccount, ESPLORA_BASE_PATH);

        currency0 = interBtcAPI.getRelayChainCurrency();
        currency1 = interBtcAPI.getWrappedCurrency();
        asset0 = newCurrencyId(api, currency0);
        asset1 = newCurrencyId(api, currency1);

        // fund liquidity provider so they can pay tx fees
        await setBalance(
            api,
            sudoAccount,
            lpAccount,
            newCurrencyId(api, interBtcAPI.getGovernanceCurrency()),
            "1152921504606846976"
        );
    });

    after(async () => {
        return api.disconnect();
    });

    it("should create and get liquidity pool", async () => {
        await createAndFundPair(api, sudoAccount, asset0, asset1, new BN(8000000000000000), new BN(2000000000));

        const liquidityPools = await interBtcAPI.amm.getLiquidityPools();
        assert.isNotEmpty(liquidityPools, "Should have at least one pool");

        const lpTokens = await interBtcAPI.amm.getLpTokens();
        assert.isNotEmpty(liquidityPools, "Should have at least one token");

        assert.deepEqual(liquidityPools[0].lpToken, lpTokens[0]);
    });

    describe("should add liquidity", () => {
        let lpPool: LiquidityPool;

        before(async () => {
            const liquidityPools = await interBtcAPI.amm.getLiquidityPools();
            lpPool = liquidityPools[0];

            const inputAmount = newMonetaryAmount(1000000000, currency0);
            const amounts = lpPool.getLiquidityDepositInputAmounts(inputAmount);

            for (const amount of amounts) {
                await setBalance(
                    api,
                    sudoAccount,
                    lpAccount,
                    newCurrencyId(api, amount.currency),
                    amount.toString(true)
                );
            }

            console.log("Adding liquidity...");
            await submitExtrinsic(
                interBtcAPI,
                await interBtcAPI.amm.addLiquidity(amounts, lpPool, 0, 999999, lpAccount.address)
            );
        });

        it("should compute liquidity", async () => {
            const lpAmounts = await interBtcAPI.amm.getLiquidityProvidedByAccount(newAccountId(api, lpAccount.address));
            assert.isNotEmpty(lpAmounts, "Should have at least one position");

            const poolAmounts = lpPool.getLiquidityWithdrawalPooledCurrencyAmounts(lpAmounts[0] as any);
            for (const poolAmount of poolAmounts) {
                assert.isTrue(!poolAmount.isZero(), "Should compute withdrawal tokens");
            }
        });

        it("should remove liquidity", async () => {
            const lpToken = lpPool.lpToken;

            const lpAmount = newMonetaryAmount(100, lpToken);
            await submitExtrinsic(
                interBtcAPI,
                await interBtcAPI.amm.removeLiquidity(lpAmount, lpPool, 0, 999999, lpAccount.address)
            );
        });
    });

    it("should swap currencies", async () => {
        const inputAmount = newMonetaryAmount(1000000000, currency0);
        const liquidityPools = await interBtcAPI.amm.getLiquidityPools();
        const trade = interBtcAPI.amm.getOptimalTrade(inputAmount, currency1, liquidityPools);

        await setBalance(api, sudoAccount, lpAccount, asset0, inputAmount.toString(true));

        const [asset0AccountBefore, asset1AccountBefore] = await Promise.all([
            api.query.tokens.accounts(lpAccount.address, asset0),
            api.query.tokens.accounts(lpAccount.address, asset1),
        ]);

        assert.isDefined(trade, "Did not find trade");
        const outputAmount = trade!.getMinimumOutputAmount(0);
        await submitExtrinsic(interBtcAPI, interBtcAPI.amm.swap(trade!, outputAmount, lpAccount.address, 999999));

        const [asset0AccountAfter, asset1AccountAfter] = await Promise.all([
            api.query.tokens.accounts(lpAccount.address, asset0),
            api.query.tokens.accounts(lpAccount.address, asset1),
        ]);

        assert.equal(
            asset0AccountAfter.free.toBn().toString(),
            asset0AccountBefore.free
                .toBn()
                .sub(new BN(inputAmount.toString(true)))
                .toString()
        );
        assert.equal(
            asset1AccountAfter.free.toBn().toString(),
            asset1AccountBefore.free
                .toBn()
                .add(new BN(outputAmount.toString(true)))
                .toString()
        );
    });
});
