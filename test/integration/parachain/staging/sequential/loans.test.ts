import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import {
    CurrencyExt,
    DefaultInterBtcApi,
    DefaultLoansAPI,
    DefaultTransactionAPI,
    InterBtcApi,
    LendToken,
    newAccountId,
    newCurrencyId,
    newMonetaryAmount,
} from "../../../../../src/index";
import { createSubstrateAPI } from "../../../../../src/factory";
import { USER_1_URI, PARACHAIN_ENDPOINT, ESPLORA_BASE_PATH, SUDO_URI } from "../../../../config";
import { APPROX_BLOCK_TIME_MS, waitForEvent } from "../../../../utils/helpers";
import { InterbtcPrimitivesCurrencyId } from "@polkadot/types/lookup";
import { expect } from "chai";
import sinon from "sinon";

import { MonetaryAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";

describe("Loans", () => {
    const approx10Blocks = 10 * APPROX_BLOCK_TIME_MS;

    let api: ApiPromise;
    let keyring: Keyring;
    let userInterBtcAPI: InterBtcApi;
    let sudoInterBtcAPI: InterBtcApi;
    let TransactionAPI: DefaultTransactionAPI;
    let LoansAPI: DefaultLoansAPI;

    let userAccount: KeyringPair;
    let sudoAccount: KeyringPair;
    let userAccountId: AccountId;

    let lendTokenId: InterbtcPrimitivesCurrencyId;
    let underlyingCurrencyId: InterbtcPrimitivesCurrencyId;
    let underlyingCurrency: CurrencyExt;

    before(async function () {
        this.timeout(approx10Blocks);

        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        userAccount = keyring.addFromUri(USER_1_URI);
        userInterBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);

        sudoAccount = keyring.addFromUri(SUDO_URI);
        sudoInterBtcAPI = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);
        userAccountId = newAccountId(api, userAccount.address);
        TransactionAPI = new DefaultTransactionAPI(api, userAccount);
        LoansAPI = new DefaultLoansAPI(api, userInterBtcAPI.assetRegistry, TransactionAPI);

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
            lendTokenId,
        };

        const addMarketExtrinsic = sudoInterBtcAPI.api.tx.loans.addMarket(underlyingCurrencyId, marketData);
        const activateMarketExtrinsic = sudoInterBtcAPI.api.tx.loans.activateMarket(underlyingCurrencyId);
        const addMarketAndActivateExtrinsic = sudoInterBtcAPI.api.tx.utility.batchAll([
            addMarketExtrinsic,
            activateMarketExtrinsic,
        ]);

        const [eventFound] = await Promise.all([
            waitForEvent(sudoInterBtcAPI, sudoInterBtcAPI.api.events.sudo.Sudid, false, approx10Blocks),
            api.tx.sudo.sudo(addMarketAndActivateExtrinsic).signAndSend(sudoAccount),
        ]);
        expect(
            eventFound,
            `Sudo event to create new market not found - timed out after ${approx10Blocks} ms`
        ).to.be.true;
    });

    after(async () => {
        api.disconnect();
    });

    afterEach(() => {
        // discard any stubbed methods after each test
        sinon.restore();
    });

    describe("getLendTokens", () => {
        it("should get lend token for each existing market", async () => {
            const [markets, lendTokens] = await Promise.all([
                api.query.loans.markets.entries(),
                userInterBtcAPI.loans.getLendTokens(),
            ]);

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

            expect(lendToken.lendToken.id).to.be.eq(lendTokenId.asLendToken.toNumber());
        });

        it("should return empty array if no market exists", async () => {
            // Mock empty list returned from chain.
            sinon.stub(LoansAPI, "getLoansMarketsEntries").returns(Promise.resolve([]));

            const lendTokens = await LoansAPI.getLendTokens();
            expect(lendTokens).to.be.empty;

            sinon.restore();
            sinon.reset();
        });
    });

    describe("getLendPositionsOfAccount", () => {
        let lentAmount: MonetaryAmount<CurrencyExt>;
        before(async function () {
            this.timeout(approx10Blocks);

            lentAmount = newMonetaryAmount(1, underlyingCurrency, true);
            const lendExtrinsic = api.tx.loans.mint(underlyingCurrencyId, lentAmount.toString(true));

            const [eventFound] = await Promise.all([
                waitForEvent(userInterBtcAPI, api.events.loans.Deposited, false, approx10Blocks),
                lendExtrinsic.signAndSend(userAccount),
            ]);

            expect(
                eventFound,
                `Event for lending 1 governance currency with account ${userAccount.address} not found!`
            ).to.be.true;
        });
        it("should get all lend positions of account in correct format", async () => {
            const [lendPosition] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

            expect(lendPosition.amount.toString()).to.be.equal(lentAmount.toString());
            expect(lendPosition.currency).to.be.equal(underlyingCurrency);
            expect(lendPosition.isCollateral).to.be.false;

            // No interest because no one borrowed and no reward subsidies enabled.
            expect(lendPosition.earnedInterest.toBig().eq(0)).to.be.true;
            expect(lendPosition.earnedReward).to.be.null;

            // TODO: add tests for more markets
        });
        it("should get correct data after position is enabled as collateral", async function() {
            this.timeout(approx10Blocks);

            const enableCollateralExtrinsic = api.tx.loans.depositAllCollateral(underlyingCurrencyId);

            const [eventFound] = await Promise.all([
                waitForEvent(userInterBtcAPI, api.events.loans.DepositCollateral, false, approx10Blocks),
                enableCollateralExtrinsic.signAndSend(userAccount),
            ]);

            expect(eventFound, "No event found for depositing collateral");

            const [lendPosition] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);
            expect(lendPosition.isCollateral).to.be.true;
        });
        it("should get correct interest and subsidy reward amount", async () => {
          //TODO
        });
        it("should get empty array when no lend position exists for account");
    });

    describe("getUnderlyingCurrencyFromLendTokenId", () => {
        it("should return correct underlying currency for lend token");
        it("should throw when lend token id is of non-existing currency");
    });
});
