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
import { USER_1_URI, USER_2_URI, PARACHAIN_ENDPOINT, ESPLORA_BASE_PATH, SUDO_URI } from "../../../../config";
import { APPROX_BLOCK_TIME_MS, waitForEvent } from "../../../../utils/helpers";
import { InterbtcPrimitivesCurrencyId } from "@polkadot/types/lookup";
import { expect } from "../../../../chai";
import sinon from "sinon";

import { Kusama, MonetaryAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";

describe("Loans", () => {
    const approx10Blocks = 10 * APPROX_BLOCK_TIME_MS;

    let api: ApiPromise;
    let keyring: Keyring;
    let userInterBtcAPI: InterBtcApi;
    let user2InterBtcAPI: InterBtcApi;
    let sudoInterBtcAPI: InterBtcApi;
    let TransactionAPI: DefaultTransactionAPI;
    let LoansAPI: DefaultLoansAPI;

    let userAccount: KeyringPair;
    let user2Account: KeyringPair;
    let sudoAccount: KeyringPair;
    let userAccountId: AccountId;
    let user2AccountId: AccountId;

    let lendTokenId: InterbtcPrimitivesCurrencyId;
    let underlyingCurrencyId: InterbtcPrimitivesCurrencyId;
    let underlyingCurrency: CurrencyExt;

    before(async function () {
        this.timeout(approx10Blocks);

        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        userAccount = keyring.addFromUri(USER_1_URI);
        user2Account = keyring.addFromUri(USER_2_URI);
        userInterBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);
        user2InterBtcAPI = new DefaultInterBtcApi(api, "regtest", user2Account, ESPLORA_BASE_PATH);

        sudoAccount = keyring.addFromUri(SUDO_URI);
        sudoInterBtcAPI = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);
        userAccountId = newAccountId(api, userAccount.address);
        user2AccountId = newAccountId(api, user2Account.address);
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
        let lendAmount: MonetaryAmount<CurrencyExt>;
        before(async function () {
            this.timeout(approx10Blocks);
            lendAmount = newMonetaryAmount(1, underlyingCurrency, true);
            await userInterBtcAPI.loans.lend(underlyingCurrency, lendAmount);
        });

        it("should get all lend positions of account in correct format", async () => {
            const [lendPosition] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

            expect(lendPosition.amount.toString()).to.be.equal(lendAmount.toString());
            expect(lendPosition.currency).to.be.equal(underlyingCurrency);
            expect(lendPosition.isCollateral).to.be.false;

            // No interest & reward because no one borrowed yet and no reward subsidies enabled.
            expect(lendPosition.earnedInterest.toBig().eq(0)).to.be.true;
            expect(lendPosition.earnedReward?.toBig().eq(0)).to.be.true;

            // TODO: add tests for more markets
        });
        it("should get correct data after position is enabled as collateral", async function () {
            this.timeout(approx10Blocks);

            await userInterBtcAPI.loans.enableAsCollateral(underlyingCurrency);

            const [lendPosition] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);
            expect(lendPosition.isCollateral).to.be.true;
        });
        it("should get empty array when no lend position exists for account", async () => {
            const lendPositions = await user2InterBtcAPI.loans.getLendPositionsOfAccount(user2AccountId);

            expect(lendPositions).to.be.empty;
        });

        it.skip("should get correct interest amount", async function () {
            this.timeout(approx10Blocks);

            // Borrows underlying currency with 2nd user account
            const user2LendAmount = newMonetaryAmount(100, underlyingCurrency, true);
            const user2BorrowAmount = newMonetaryAmount(20, underlyingCurrency, true);
            const user2LendExtrinsic = user2InterBtcAPI.api.tx.loans.mint(
                underlyingCurrencyId,
                user2LendAmount.toString(true)
            );
            const user2CollateralExtrinsic = user2InterBtcAPI.api.tx.loans.depositAllCollateral(underlyingCurrencyId);
            const user2BorrowExtrinsic = user2InterBtcAPI.api.tx.loans.borrow(
                underlyingCurrencyId,
                user2BorrowAmount.toString(true)
            );

            const [eventFound] = await Promise.all([
                waitForEvent(user2InterBtcAPI, user2InterBtcAPI.api.events.loans.Borrowed),
                user2InterBtcAPI.api.tx.utility.batchAll([
                    user2LendExtrinsic,
                    user2CollateralExtrinsic,
                    user2BorrowExtrinsic,
                ]),
            ]);
            expect(eventFound, "No event found for depositing collateral");

            // TODO: cannot submit timestamp.set - gettin error
            //   'RpcError: 1010: Invalid Transaction: Transaction dispatch is mandatory; transactions may not have mandatory dispatches.'

            // Manipulates time to accredit interest.
            const timestamp1MonthInFuture = Date.now() + 1000 * 60 * 60 * 24 * 30;
            const setTimeToFutureExtrinsic = sudoInterBtcAPI.api.tx.timestamp.set(timestamp1MonthInFuture);

            const [sudoEventFound] = await Promise.all([
                waitForEvent(sudoInterBtcAPI, sudoInterBtcAPI.api.events.sudo.Sudid, false, approx10Blocks),
                api.tx.sudo.sudo(setTimeToFutureExtrinsic).signAndSend(sudoAccount),
            ]);
            expect(sudoEventFound, `Sudo event to manipulate time not found - timed out after ${approx10Blocks} ms`).to
                .be.true;

            const [lendPosition] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

            // test printing out to see earned Interest value
            console.log(lendPosition.earnedInterest.toHuman());
        });
    });

    describe("getUnderlyingCurrencyFromLendTokenId", () => {
        it("should return correct underlying currency for lend token", async () => {
            const returnedUnderlyingCurrency = await userInterBtcAPI.loans.getUnderlyingCurrencyFromLendTokenId(
                lendTokenId
            );

            expect(returnedUnderlyingCurrency).to.deep.equal(underlyingCurrency);
        });
        it("should throw when lend token id is of non-existing currency", async () => {
            const invalidLendTokenId = (lendTokenId = newCurrencyId(sudoInterBtcAPI.api, {
                lendToken: { id: 999 },
            } as LendToken));

            await expect(userInterBtcAPI.loans.getUnderlyingCurrencyFromLendTokenId(invalidLendTokenId)).to.be.rejected;
        });
    });

    describe("lend", () => {
        it("should lend expected amount of currency to protocol", async function () {
            this.timeout(approx10Blocks);
            const [{ amount: lendAmountBefore }] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

            const lendAmount = newMonetaryAmount(100, underlyingCurrency, true);
            await userInterBtcAPI.loans.lend(underlyingCurrency, lendAmount);

            const [{ amount: lendAmountAfter }] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);
            const actuallyLentAmount = lendAmountAfter.sub(lendAmountBefore);

            // Check that lent amount is same as sent amount
            expect(actuallyLentAmount.eq(lendAmount)).to.be.true;
        });
        it("should throw if trying to lend from inactive market", async () => {
            const inactiveUnderlyingCurrency = Kusama;
            const amount = newMonetaryAmount(1, inactiveUnderlyingCurrency);

            await expect(userInterBtcAPI.loans.lend(inactiveUnderlyingCurrency, amount)).to.be.rejected;
        });
        it("should throw if trying to lend more than free balance", async () => {
            const tooBigAmount = newMonetaryAmount("1000000000000000000000000000000000000", underlyingCurrency);

            await expect(userInterBtcAPI.loans.lend(underlyingCurrency, tooBigAmount)).to.be.rejected;
        });
    });

    describe("withdraw", () => {
        before(async function () {
            this.timeout(approx10Blocks);

            const [eventFound] = await Promise.all([
                waitForEvent(userInterBtcAPI, api.events.loans.WithdrawCollateral, false, approx10Blocks),
                userInterBtcAPI.api.tx.loans.withdrawAllCollateral(underlyingCurrencyId).signAndSend(userAccount),
            ]);

            expect(eventFound, "No event found for withdrawing all collateral").to.be.true;
        });

        it("should withdraw part of lent amount", async function () {
            this.timeout(approx10Blocks);
            const [{ amount: lendAmountBefore }] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

            const amountToWithdraw = newMonetaryAmount(1, underlyingCurrency, true);
            await userInterBtcAPI.loans.withdraw(underlyingCurrency, amountToWithdraw);

            const [{ amount: lendAmountAfter }] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);
            const actuallyWithdrawnAmount = lendAmountBefore.sub(lendAmountAfter);

            expect(
                actuallyWithdrawnAmount.eq(amountToWithdraw),
                // eslint-disable-next-line max-len
                `Expected withdrawn amount: ${amountToWithdraw.toHuman()} is different from the actual amount: ${actuallyWithdrawnAmount.toHuman()}!`
            ).to.be.true;
        });
    });

    describe("withdrawAll", () => {
        it("should withdraw full amount from lending protocol", async function () {
            this.timeout(approx10Blocks);

            await userInterBtcAPI.loans.withdrawAll(underlyingCurrency);

            const lendPositions = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

            expect(lendPositions, "Expected to withdraw full amount and close position!").to.be.empty;
        });
    });

    describe("enableAsCollateral", () => {
        it("should enable lend position as collateral", async function () {
            this.timeout(approx10Blocks);

            const lendAmount = newMonetaryAmount(1, underlyingCurrency, true);
            await userInterBtcAPI.loans.lend(underlyingCurrency, lendAmount);
            await userInterBtcAPI.loans.enableAsCollateral(underlyingCurrency);
            const [{ isCollateral }] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

            expect(isCollateral).to.be.true;
        });
    });

    describe("disableAsCollateral", () => {
        it("should disable enabled collateral position if there are no borrows", async function () {
            this.timeout(approx10Blocks);

            await userInterBtcAPI.loans.disableAsCollateral(underlyingCurrency);
            const [{ isCollateral }] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

            expect(isCollateral).to.be.false;
        });
    });
});
