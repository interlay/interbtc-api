import { DefaultRedeemAPI, DefaultVaultsAPI, VaultsAPI } from "../../../src";
import { newMonetaryAmount } from "../../../src/utils";
import { KBtc, Kintsugi } from "@interlay/monetary-js";
import Big from "big.js";
import { NO_LIQUIDATION_VAULT_FOUND_REJECTION } from "../../../src/parachain/vaults";

describe("DefaultRedeemAPI", () => {
    // instances will be fully/partially mocked where needed
    let vaultsApi: DefaultVaultsAPI;
    let redeemApi: DefaultRedeemAPI;


    beforeEach(() => {
        // only mock/stub what we really need
        // add more if/when needed
        vaultsApi = new DefaultVaultsAPI(
            null as any,
            null as any,
            null as any,
            null as any,
            null as any,
            null as any,
            null as any,
            null as any,
            null as any,
            null as any
        );

        redeemApi = new DefaultRedeemAPI(
            null as any,
            null as any,
            null as any,
            null as any,
            vaultsApi as VaultsAPI,
            null as any,
            null as any,
            null as any
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getBurnExchangeRate", () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should reject if burnable amount is zero", async () => {
            const zeroKbtcAmount = newMonetaryAmount(0, KBtc);
            const mockVaultExt = {
                toBeIssuedTokens: zeroKbtcAmount,
                issuedTokens: zeroKbtcAmount,
                toBeRedeemedTokens: zeroKbtcAmount,
                collateral: newMonetaryAmount(10, Kintsugi),
            };

            // stub internal call to return our mocked vault
            jest.spyOn(vaultsApi, "getLiquidationVault").mockClear().mockResolvedValue(mockVaultExt as any);

            await expect(redeemApi.getBurnExchangeRate(Kintsugi)).rejects.toThrow("no burnable tokens");
        });

        it("should return an exchange rate", async () => {
            const mockVaultExt = {
                toBeIssuedTokens: newMonetaryAmount(1, KBtc),
                issuedTokens: newMonetaryAmount(10, KBtc),
                toBeRedeemedTokens: newMonetaryAmount(2, KBtc),
                collateral: newMonetaryAmount(100, Kintsugi),
            };

            // stub internal call to return our mocked vault
            jest.spyOn(vaultsApi, "getLiquidationVault").mockClear().mockResolvedValue(mockVaultExt as any);

            const exchangeRate = await redeemApi.getBurnExchangeRate(Kintsugi);
            expect(exchangeRate.rate.toNumber()).toBeGreaterThan(0);
        });

        it("should return a specific exchange rate for given values", async () => {
            // This test serves as canary / regression test when code gets refactored.
            // Using specific values from when we found an issue with the calculation.
            const mockVaultExt = {
                toBeIssuedTokens: newMonetaryAmount(1000, KBtc),
                issuedTokens: newMonetaryAmount(300000, KBtc),
                toBeRedeemedTokens: newMonetaryAmount(200000, KBtc),
                collateral: newMonetaryAmount(Big("39518270000"), Kintsugi),
            };

            // nmagic number of which rate to expect with collateral / (issued + toBeIssued - toBeRedeemed)
            // (manually calculated)
            const expectedExchangeRate = Big("391270");
            // bring the numbers back down into a easier readable range of a JS number (expect 3.9127)
            const testMultiplier = 0.00001;

            // stub internal call to return our mocked vault
            jest.spyOn(vaultsApi, "getLiquidationVault").mockClear().mockResolvedValue(mockVaultExt as any);

            const exchangeRate = await redeemApi.getBurnExchangeRate(Kintsugi);

            const delta = Math.abs(exchangeRate.rate.mul(testMultiplier).toNumber() - expectedExchangeRate.mul(testMultiplier).toNumber());
            expect(delta).toBeLessThan(0.000001);
        });
    });

    describe("getMaxBurnableTokens", () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it(
            "should return zero if getLiquidationVault rejects with no liquidation vault message",
            async () => {
                // stub internal call to return no liquidation vault
                jest.spyOn(vaultsApi, "getLiquidationVault").mockClear().mockRejectedValue(NO_LIQUIDATION_VAULT_FOUND_REJECTION);

                const actualValue = await redeemApi.getMaxBurnableTokens(Kintsugi);
                expect(actualValue.toBig().toNumber()).toBe(0);
            }
        );

        it(
            "should propagate rejection if getLiquidationVault rejects with other message",
            async () => {
                // stub internal call to return no liquidation vault
                jest.spyOn(vaultsApi, "getLiquidationVault").mockClear().mockRejectedValue("foobar happened here");

                await expect(redeemApi.getMaxBurnableTokens(Kintsugi)).rejects.toEqual("foobar happened here");
            }
        );
    });
});
