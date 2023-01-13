import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import {
    CurrencyExt,
    currencyIdToMonetaryCurrency,
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
import { APPROX_BLOCK_TIME_MS, callWithExchangeRateOverwritten, waitForEvent } from "../../../../utils/helpers";
import { InterbtcPrimitivesCurrencyId } from "@polkadot/types/lookup";
import { expect } from "../../../../chai";
import sinon from "sinon";

import { InterBtc, MonetaryAmount } from "@interlay/monetary-js";
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

    let lendTokenId1: InterbtcPrimitivesCurrencyId;
    let lendTokenId2: InterbtcPrimitivesCurrencyId;
    let underlyingCurrencyId: InterbtcPrimitivesCurrencyId;
    let underlyingCurrency: CurrencyExt;
    let underlyingCurrencyId2: InterbtcPrimitivesCurrencyId;
    let underlyingCurrency2: CurrencyExt;

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

        underlyingCurrencyId2 = sudoInterBtcAPI.api.consts.currency.getRelayChainCurrencyId;
        underlyingCurrency2 = await currencyIdToMonetaryCurrency(
            userInterBtcAPI.assetRegistry,
            user2InterBtcAPI.loans,
            underlyingCurrencyId2
        );

        lendTokenId1 = newCurrencyId(sudoInterBtcAPI.api, { lendToken: { id: 1 } } as LendToken);
        lendTokenId2 = newCurrencyId(sudoInterBtcAPI.api, { lendToken: { id: 2 } } as LendToken);

        const percentageToPermill = (percentage: number) => percentage * 10000;

        const marketData = (id: InterbtcPrimitivesCurrencyId) => ({
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
            lendTokenId: id,
        });

        const addMarket1Extrinsic = sudoInterBtcAPI.api.tx.loans.addMarket(
            underlyingCurrencyId,
            marketData(lendTokenId1)
        );
        const addMarket2Extrinsic = sudoInterBtcAPI.api.tx.loans.addMarket(
            underlyingCurrencyId2,
            marketData(lendTokenId2)
        );
        const activateMarket1Extrinsic = sudoInterBtcAPI.api.tx.loans.activateMarket(underlyingCurrencyId);
        const activateMarket2Extrinsic = sudoInterBtcAPI.api.tx.loans.activateMarket(underlyingCurrencyId2);
        const addMarkets = sudoInterBtcAPI.api.tx.utility.batchAll([
            addMarket1Extrinsic,
            addMarket2Extrinsic,
            activateMarket1Extrinsic,
            activateMarket2Extrinsic,
        ]);

        const [eventFound] = await Promise.all([
            waitForEvent(sudoInterBtcAPI, sudoInterBtcAPI.api.events.sudo.Sudid, false, approx10Blocks),
            api.tx.sudo.sudo(addMarkets).signAndSend(sudoAccount),
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

            expect(lendToken.lendToken.id).to.be.eq(lendTokenId1.asLendToken.toNumber());
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
            // Solution: Move APR calculation to separate function and unit test it without using actual parachain value,
            // mock the parachain response for this.

            // Manipulates time to accredit interest.
            const timestamp1MonthInFuture = Date.now() + 1000 * 60 * 60 * 24 * 30;
            const setTimeToFutureExtrinsic = sudoInterBtcAPI.api.tx.timestamp.set(timestamp1MonthInFuture);

            const [sudoEventFound] = await Promise.all([
                waitForEvent(sudoInterBtcAPI, sudoInterBtcAPI.api.events.sudo.Sudid, false, approx10Blocks),
                api.tx.sudo.sudo(setTimeToFutureExtrinsic).signAndSend(sudoAccount),
            ]);
            expect(sudoEventFound, `Sudo event to manipulate time not found - timed out after ${approx10Blocks} ms`).to
                .be.true;
        });
    });

    describe("getUnderlyingCurrencyFromLendTokenId", () => {
        it("should return correct underlying currency for lend token", async () => {
            const returnedUnderlyingCurrency = await userInterBtcAPI.loans.getUnderlyingCurrencyFromLendTokenId(
                lendTokenId1
            );

            expect(returnedUnderlyingCurrency).to.deep.equal(underlyingCurrency);
        });
        it("should throw when lend token id is of non-existing currency", async () => {
            const invalidLendTokenId = (lendTokenId1 = newCurrencyId(sudoInterBtcAPI.api, {
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
            const inactiveUnderlyingCurrency = InterBtc;
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
            const actuallyWithdrawnAmount = lendAmountBefore.sub(lendAmountAfter).toBig().round(2);

            expect(
                actuallyWithdrawnAmount.eq(amountToWithdraw.toBig()),
                // eslint-disable-next-line max-len
                `Expected withdrawn amount: ${amountToWithdraw.toHuman()} is different from the actual amount: ${actuallyWithdrawnAmount.toString()}!`
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

    describe("getLoanAssets", () => {
        it("should get loan assets in correct format", async () => {
            const loanAssets = await userInterBtcAPI.loans.getLoanAssets();
            const underlyingCurrencyLoanAsset = loanAssets[underlyingCurrency.ticker];

            expect(underlyingCurrencyLoanAsset).is.not.undefined;
            expect(underlyingCurrencyLoanAsset.currency).to.be.deep.equal(underlyingCurrency);
            expect(underlyingCurrencyLoanAsset.isActive).to.be.true;
            // TODO: add more tests to check data validity
        });

        it("should return empty object if there are no added markets", async () => {
            // Mock empty list returned from chain.
            sinon.stub(LoansAPI, "getLoansMarketsEntries").returns(Promise.resolve([]));

            const loanAssets = await LoansAPI.getLoanAssets();
            expect(loanAssets).to.be.empty;

            sinon.restore();
            sinon.reset();
        });
    });

    describe("getAccruedRewardsOfAccount", () => {
        it("should return correct amount of reward", () => {
            //TODO
        });
    });

    describe("claimAllSubsidyRewards", () => {
        it("should claim all subsidy rewards", () => {
            //TODO
        });
    });

    describe("borrow", () => {
        it("should borrow specified amount", async function () {
            this.timeout(approx10Blocks);
            const lendAmount = newMonetaryAmount(100, underlyingCurrency, true);
            const borrowAmount = newMonetaryAmount(1, underlyingCurrency, true);
            await user2InterBtcAPI.loans.lend(underlyingCurrency, lendAmount);
            await user2InterBtcAPI.loans.enableAsCollateral(underlyingCurrency);
            await user2InterBtcAPI.loans.borrow(underlyingCurrency, borrowAmount);

            const [{ amount }] = await user2InterBtcAPI.loans.getBorrowPositionsOfAccount(user2AccountId);
            const roundedAmount = amount.toBig().round(2);
            expect(
                roundedAmount.eq(borrowAmount.toBig()),
                `Expected borrowed amount to equal ${borrowAmount.toString()}, but it is ${amount.toString()}.`
            ).to.be.true;
        });
    });

    describe("repay", () => {
        it("should repay specified amount", async function () {
            this.timeout(approx10Blocks);
            const repayAmount = newMonetaryAmount(0.5, underlyingCurrency, true);
            const [{ amount: borrowAmountBefore }] = await user2InterBtcAPI.loans.getBorrowPositionsOfAccount(
                user2AccountId
            );
            await user2InterBtcAPI.loans.repay(underlyingCurrency, repayAmount);
            const [{ amount: borrowAmountAfter }] = await user2InterBtcAPI.loans.getBorrowPositionsOfAccount(
                user2AccountId
            );

            const borrowAmountAfterRounded = borrowAmountAfter.toBig().round(2);
            const expectedRemainingAmount = borrowAmountBefore.sub(repayAmount);

            expect(
                borrowAmountAfterRounded.eq(expectedRemainingAmount.toBig()),
                `Expected remaining borrow amount to equal ${expectedRemainingAmount.toString()}, but it is ${borrowAmountAfter.toString()}`
            ).to.be.true;
        });
    });

    describe("repayAll", () => {
        it("should repay whole loan", async function () {
            this.timeout(approx10Blocks);
            await user2InterBtcAPI.loans.repayAll(underlyingCurrency);
            const borrowPositions = await user2InterBtcAPI.loans.getBorrowPositionsOfAccount(user2AccountId);

            expect(
                borrowPositions,
                `Expected to repay full borrow position, but positions: ${borrowPositions} were found`
            ).to.be.empty;
        });
    });

    describe("getBorrowPositionsOfAccount", () => {
        before(async function () {
            this.timeout(approx10Blocks);
            // TODO:borrow
        });

        it("should get borrow positions in correct format", async function () {
            //TODO
        });
    });

    describe("liquidateBorrowPosition", () => {
        it("should liquidate position when possible", async function () {
            this.timeout(approx10Blocks * 2);
            // Supply asset by account1, borrow by account2
            const borrowAmount = newMonetaryAmount(10, underlyingCurrency2, true);
            await userInterBtcAPI.loans.lend(underlyingCurrency2, borrowAmount);
            await user2InterBtcAPI.loans.borrow(underlyingCurrency2, borrowAmount);

            // Increase exchange rate of borrowed asset to trigger liquidation.
            const newExchangeRate = "0x00000000000000000001000000000000";
            const wrappedCall = async () => {
                const repayAmount = newMonetaryAmount(1, underlyingCurrency2); // repay smallest amount
                await userInterBtcAPI.loans.liquidateBorrowPosition(
                    user2AccountId,
                    underlyingCurrency2,
                    repayAmount,
                    underlyingCurrency
                );
            };

            await callWithExchangeRateOverwritten(sudoInterBtcAPI, underlyingCurrency2, newExchangeRate, wrappedCall);
        });
        it("should throw when no position can be liquidated", async function () {
            this.timeout(approx10Blocks);
            const repayAmount = newMonetaryAmount(1, underlyingCurrency2, true); // repay smallest amount

            await expect(
                userInterBtcAPI.loans.liquidateBorrowPosition(
                    user2AccountId,
                    underlyingCurrency2,
                    repayAmount,
                    underlyingCurrency
                )
            ).to.be.rejected;
        });
    });
});
