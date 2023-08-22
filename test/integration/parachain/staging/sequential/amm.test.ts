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

    beforeAll(async () => {
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

    afterAll(async () => {
        await api.disconnect();
    });

    it("should create and get liquidity pool", async () => {
        await createAndFundPair(api, sudoAccount, asset0, asset1, new BN(8000000000000000), new BN(2000000000));

        const liquidityPools = await interBtcAPI.amm.getLiquidityPools();
        expect(liquidityPools).not.toHaveLength(0);

        const lpTokens = await interBtcAPI.amm.getLpTokens();
        expect(liquidityPools).not.toHaveLength(0);

        expect(liquidityPools[0].lpToken).toEqual(lpTokens[0]);
    });

    describe("should add liquidity", () => {
        let lpPool: LiquidityPool;

        beforeAll(async () => {
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
            expect(lpAmounts).not.toHaveLength(0);

            const poolAmounts = lpPool.getLiquidityWithdrawalPooledCurrencyAmounts(lpAmounts[0] as any);
            for (const poolAmount of poolAmounts) {
                expect(poolAmount.isZero()).toBe(false);
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

        expect(trade).toBeDefined();

        const outputAmount = trade!.getMinimumOutputAmount(0);
        await submitExtrinsic(interBtcAPI, interBtcAPI.amm.swap(trade!, outputAmount, lpAccount.address, 999999));

        const [asset0AccountAfter, asset1AccountAfter] = await Promise.all([
            api.query.tokens.accounts(lpAccount.address, asset0),
            api.query.tokens.accounts(lpAccount.address, asset1),
        ]);

        expect(asset0AccountAfter.free.toBn().toString()).toBe(asset0AccountBefore.free
            .toBn()
            .sub(new BN(inputAmount.toString(true)))
            .toString()
        );

        expect(asset1AccountAfter.free.toBn().toString()).toBe(asset1AccountBefore.free
            .toBn()
            .sub(new BN(inputAmount.toString(true)))
            .toString()
        );
    });
});
