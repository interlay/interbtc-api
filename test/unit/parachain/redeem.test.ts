import { expect } from "../../chai";
import sinon from "sinon";
import { DefaultRedeemAPI, DefaultVaultsAPI, VaultsAPI } from "../../../src";
import { newMonetaryAmount } from "../../../src/utils";
import { ExchangeRate, KBtc, Kintsugi } from "@interlay/monetary-js";
import Big from "big.js";
import { NO_LIQUIDATION_VAULT_FOUND_REJECTION } from "../../../src/parachain/vaults";

describe("DefaultRedeemAPI", () => {
    let redeemApi: DefaultRedeemAPI;

    let stubbedVaultsApi: sinon.SinonStubbedInstance<DefaultVaultsAPI>;

    beforeEach(() => {
        // only mock/stub what we really need
        // add more if/when needed
        stubbedVaultsApi = sinon.createStubInstance(DefaultVaultsAPI);
        redeemApi = new DefaultRedeemAPI(
            null as any,
            null as any,
            null as any,
            null as any,
            stubbedVaultsApi as VaultsAPI,
            null as any,
            null as any,
            null as any
        );
    });

    afterEach(() => {
        sinon.restore();
        sinon.reset();
    });

    describe("getBurnExchangeRate", () => {
        afterEach(() => {
            sinon.restore();
            sinon.reset();
        });

        it("should reject if burnable amount is zero", async () => {
            const zeroKbtcAmount = newMonetaryAmount(0, KBtc);
            const mockVaultExt = {
                toBeIssuedTokens: zeroKbtcAmount,
                issuedTokens: zeroKbtcAmount,
                toBeRedeemedTokens: zeroKbtcAmount,
                collateral: newMonetaryAmount(10, Kintsugi),
            };

            // stub internal call to reutn our mocked vault
            stubbedVaultsApi.getLiquidationVault.withArgs(sinon.match.any).resolves(mockVaultExt as any);

            await expect(redeemApi.getBurnExchangeRate(Kintsugi)).to.be.rejectedWith("no burnable tokens");
        });

        it("should return an exchange rate", async () => {
            const mockVaultExt = {
                toBeIssuedTokens: newMonetaryAmount(1, KBtc),
                issuedTokens: newMonetaryAmount(10, KBtc),
                toBeRedeemedTokens: newMonetaryAmount(2, KBtc),
                collateral: newMonetaryAmount(100, Kintsugi),
            };

            // stub internal call to reutn our mocked vault
            stubbedVaultsApi.getLiquidationVault.withArgs(sinon.match.any).resolves(mockVaultExt as any);

            const exchangeRate = await redeemApi.getBurnExchangeRate(Kintsugi);
            expect(exchangeRate).to.be.an.instanceof(ExchangeRate);
            expect(exchangeRate.rate.toNumber()).to.be.greaterThan(0);
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

            // stub internal call to reutn our mocked vault
            stubbedVaultsApi.getLiquidationVault.withArgs(sinon.match.any).resolves(mockVaultExt as any);

            const exchangeRate = await redeemApi.getBurnExchangeRate(Kintsugi);
            expect(exchangeRate).to.be.an.instanceof(ExchangeRate);
            expect(exchangeRate.rate.mul(testMultiplier).toNumber()).to.be.closeTo(
                expectedExchangeRate.mul(testMultiplier).toNumber(),
                0.000001
            );
        });
    });

    describe("getMaxBurnableTokens", () => {
        afterEach(() => {
            sinon.restore();
            sinon.reset();
        });

        it("should return zero if getLiquidationVault rejects with no liquidation vault message", async () => {
            // stub internal call to return no liquidation vault
            stubbedVaultsApi.getLiquidationVault.withArgs(sinon.match.any).returns(Promise.reject(NO_LIQUIDATION_VAULT_FOUND_REJECTION));

            const actualValue = await redeemApi.getMaxBurnableTokens(Kintsugi);
            expect(actualValue.toBig().toNumber()).to.be.eq(0);
        });

        it("should propagate rejection if getLiquidationVault rejects with other message", async () => {
            // stub internal call to return no liquidation vault
            stubbedVaultsApi.getLiquidationVault.withArgs(sinon.match.any).returns(Promise.reject("foobar happened here"));

            await expect(redeemApi.getMaxBurnableTokens(Kintsugi)).to.be.rejectedWith("foobar happened here");
        });
    });
});
