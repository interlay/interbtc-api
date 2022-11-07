import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import {
    CollateralCurrencyExt,
    CurrencyExt,
    currencyIdToMonetaryCurrency,
    DefaultInterBtcApi,
    DefaultLoansAPI,
    GovernanceCurrency,
    InterBtcApi,
    LendToken,
    newCurrencyId,
} from "../../../../../src/index";
import { createSubstrateAPI } from "../../../../../src/factory";
import {
    USER_1_URI,
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_PORT,
    BITCOIN_CORE_USERNAME,
    BITCOIN_CORE_WALLET,
    PARACHAIN_ENDPOINT,
    ESPLORA_BASE_PATH,
    SUDO_URI,
} from "../../../../config";
import { BitcoinCoreClient } from "../../../../../src/utils/bitcoin-core-client";
import { WrappedCurrency } from "../../../../../src";
import { getCorrespondingCollateralCurrenciesForTests, sudo } from "../../../../utils/helpers";
import { InterbtcPrimitivesCurrencyId, PalletLoansMarket } from "@polkadot/types/lookup";
import { expect } from "chai";
import sinon from "sinon";
import { SingleAccountSigner } from "test/utils/SingleAccountSigner";
import { CLIENT_RENEG_LIMIT } from "tls";

describe("Loans", () => {
    let api: ApiPromise;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let userInterBtcAPI: InterBtcApi;
    let sudoInterBtcAPI: InterBtcApi;

    let userAccount: KeyringPair;
    let sudoAccount: KeyringPair;

    let lendTokenId: InterbtcPrimitivesCurrencyId;
    let underlyingCurrencyId: InterbtcPrimitivesCurrencyId;
    let underlyingCurrency: CurrencyExt;

    before(async function () {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        userAccount = keyring.addFromUri(USER_1_URI);
        userInterBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);

        sudoAccount = keyring.addFromUri(SUDO_URI);
        sudoInterBtcAPI = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);

        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );

        // Add market for governance currency.
        underlyingCurrencyId = sudoInterBtcAPI.api.consts.escrowRewards.getNativeCurrencyId;
        underlyingCurrency = sudoInterBtcAPI.getGovernanceCurrency();

        lendTokenId = newCurrencyId(sudoInterBtcAPI.api, { lendToken: { id: 1 } } as LendToken);

        const percentageToPermill = (percentage: number) => percentage * 10000;

        const marketData = {
            collateralFactor: percentageToPermill(50),
            liquidationThreshold: percentageToPermill(55),
            reserveFactor: percentageToPermill(15),
            closeFactor: percentageToPermill(50),
            liquidateIncentive: "1100000000000000000",
            liquidateIncentiveReservedFactor: percentageToPermill(3),
            rateModel: {
                Jump: {
                    baseRate: "20000000000000000",
                    jumpRate: "100000000000000000",
                    fullRate: "320000000000000000",
                    jumpUtilization: percentageToPermill(80),
                },
            },
            state: "Pending",
            supplyCap: "5000000000000000000000",
            borrowCap: "5000000000000000000000",
            ptokenId: lendTokenId,
        };

        const addMarketExtrinsic = sudoInterBtcAPI.api.tx.loans.addMarket(underlyingCurrencyId, marketData);
        await api.tx.sudo.sudo(addMarketExtrinsic).signAndSend(sudoAccount);
    });

    after(async () => {
        api.disconnect();
    });

    afterEach(() => {
        // discard any stubbed methods after each test
        // sinon.restore();
    });

    describe("getLendTokens", () => {
        it("should get lend token for each existing market", async () => {
            const [markets, lendTokens] = await Promise.all([
                api.query.loans.markets.entries(),
                userInterBtcAPI.loans.getLendTokens(),
            ]);
            console.log(markets);
            const marketsUnderlyingCurrencyId = markets[0][0].args[0];

            expect(markets.length).to.be.equal(lendTokens.length);

            expect(marketsUnderlyingCurrencyId.eq(underlyingCurrencyId)).to.be.true;
        });

        it("should return LendToken in correct format - 'q' prefix, correct id", async () => {
            // Requires first market to be initialized for governance currency.
            const lendTokens = await userInterBtcAPI.loans.getLendTokens();
            const lendToken = lendTokens[0];

            // Should have same amount of decimals as underlying currency.
            expect(lendToken.decimals).to.be.eq(underlyingCurrency.decimals);

            // Should add 'q' prefix.
            expect(lendToken.name).to.be.eq(`q${underlyingCurrency.name}`);
            expect(lendToken.ticker).to.be.eq(`q${underlyingCurrency.ticker}`);

            expect(lendToken.lendToken.id).to.be.eq(lendTokenId.asPToken.toNumber());
        });

        it("should return empty array if no market exists", async () => {
            const LoansAPI = new DefaultLoansAPI(api, sudoInterBtcAPI.assetRegistry);
            // mock empty list returned from chain
            sinon.stub(LoansAPI, "getLoansMarketsEntries").returns(Promise.resolve([]));

            const lendTokens = await LoansAPI.getLendTokens();
            expect(lendTokens).to.be.empty;

            sinon.restore();
            sinon.reset();
        });
    });

    describe("getLendPositionsOfAccount", () => {
        it("should get all lend positions of account in correct format");
        it("should get correct data after position is enabled as collateral");
        it("should get correct interest and subsidy reward amount");
        it("should get empty array when no lend position exists for account");
    });

    describe("getUnderlyingCurrencyFromLendTokenId", () => {
        it("should return correct underlying currency for lend token");
        it("should throw when lend token id is of non-existing currency");
    });
});
