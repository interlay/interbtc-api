import { expect } from "../../chai";
import sinon from "sinon";
import { DefaultRedeemAPI, DefaultVaultsAPI, newMonetaryAmount, VaultsAPI } from "../../../src";
import { ExchangeRate, KBtc, Kintsugi } from "@interlay/monetary-js";

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
    });
});
