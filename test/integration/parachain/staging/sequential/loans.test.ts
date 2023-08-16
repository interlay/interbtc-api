import mock from "jest-mock";
import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import {
    CurrencyExt,
    currencyIdToMonetaryCurrency,
    DefaultInterBtcApi,
    DefaultLoansAPI,
    DefaultOracleAPI,
    DefaultTransactionAPI,
    getUnderlyingCurrencyFromLendTokenId,
    InterBtcApi,
    LendToken,
    newAccountId,
    newCurrencyId,
    newMonetaryAmount,
} from "../../../../../src/index";
import { createSubstrateAPI } from "../../../../../src/factory";
import { USER_1_URI, USER_2_URI, PARACHAIN_ENDPOINT, ESPLORA_BASE_PATH, SUDO_URI } from "../../../../config";
import { callWithExchangeRate, includesStringified, submitExtrinsic } from "../../../../utils/helpers";
import { InterbtcPrimitivesCurrencyId } from "@polkadot/types/lookup";
import Big from "big.js";
import { InterBtc, MonetaryAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";

describe("Loans", () => {
    let api: ApiPromise;
    let keyring: Keyring;
    let userInterBtcAPI: InterBtcApi;
    let user2InterBtcAPI: InterBtcApi;
    let sudoInterBtcAPI: InterBtcApi;
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

    beforeAll(async () => {
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
        const wrappedCurrency = sudoInterBtcAPI.getWrappedCurrency();
        const oracleAPI = new DefaultOracleAPI(api, wrappedCurrency);

        LoansAPI = new DefaultLoansAPI(api, wrappedCurrency, oracleAPI);

        // Add market for governance currency.
        underlyingCurrencyId = sudoInterBtcAPI.api.consts.currency.getNativeCurrencyId;
        underlyingCurrency = sudoInterBtcAPI.getGovernanceCurrency();

        underlyingCurrencyId2 = sudoInterBtcAPI.api.consts.currency.getRelayChainCurrencyId;
        underlyingCurrency2 = await currencyIdToMonetaryCurrency(api, underlyingCurrencyId2);

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

        const result = await DefaultTransactionAPI.sendLogged(
            api,
            sudoAccount,
            api.tx.sudo.sudo(addMarkets),
            api.events.sudo.Sudid
        );

        expect(result.isCompleted).toBe(true);
    });

    afterAll(async () => {
        api.disconnect();
    });

    afterEach(() => {
        // discard any stubbed methods after each test
        jest.restoreAllMocks();
    });

    describe("getLendTokens", () => {
        it("should get lend token for each existing market", async () => {
            const [markets, lendTokens] = await Promise.all([
                api.query.loans.markets.entries(),
                userInterBtcAPI.loans.getLendTokens(),
            ]);

            const marketsUnderlyingCurrencyId = markets[0][0].args[0];

            expect(markets.length).toBe(lendTokens.length);

            expect(marketsUnderlyingCurrencyId.eq(underlyingCurrencyId)).toBe(true);
        });

        it(
            "should return LendToken in correct format - 'q' prefix, correct id",
            async () => {
                // Requires first market to be initialized for governance currency.
                const lendTokens = await userInterBtcAPI.loans.getLendTokens();
                const lendToken = lendTokens[0];

                // Should have same amount of decimals as underlying currency.
                expect(lendToken.decimals).toBe(underlyingCurrency.decimals);

                // Should add 'q' prefix.
                expect(lendToken.name).toBe(`q${underlyingCurrency.name}`);
                expect(lendToken.ticker).toBe(`q${underlyingCurrency.ticker}`);

                expect(lendToken.lendToken.id).toBe(lendTokenId1.asLendToken.toNumber());
            }
        );

        it("should return empty array if no market exists", async () => {
            // Mock empty list returned from chain.
            mock.spyOn(LoansAPI, "getLoansMarkets").mockClear().mockReturnValue(Promise.resolve([]));

            const lendTokens = await LoansAPI.getLendTokens();
            expect(lendTokens).toHaveLength(0);
        });
    });

    describe("getLendPositionsOfAccount", () => {
        let lendAmount: MonetaryAmount<CurrencyExt>;
        beforeAll(async () => {
            lendAmount = newMonetaryAmount(1, underlyingCurrency, true);
            await submitExtrinsic(userInterBtcAPI, await userInterBtcAPI.loans.lend(underlyingCurrency, lendAmount));
        });

        it(
            "should get all lend positions of account in correct format",
            async () => {
                const [lendPosition] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

                expect(lendPosition.amount.toString()).toBe(lendAmount.toString());
                expect(lendPosition.amount.currency).toBe(underlyingCurrency);
                expect(lendPosition.isCollateral).toBe(false);
                // TODO: add tests for more markets
            }
        );

        it(
            "should get correct data after position is enabled as collateral",
            async () => {
                await submitExtrinsic(userInterBtcAPI, await userInterBtcAPI.loans.enableAsCollateral(underlyingCurrency));

                const [lendPosition] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);
                expect(lendPosition.isCollateral).toBe(true);
            }
        );

        it(
            "should get empty array when no lend position exists for account",
            async () => {
                const lendPositions = await user2InterBtcAPI.loans.getLendPositionsOfAccount(user2AccountId);

                expect(lendPositions).toHaveLength(0);
            }
        );

        it.skip("should get correct interest amount", async function () {
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

            const result1 = await DefaultTransactionAPI.sendLogged(
                api,
                user2Account,
                api.tx.utility.batchAll([user2LendExtrinsic, user2CollateralExtrinsic, user2BorrowExtrinsic]),
                api.events.loans.Borrowed
            );
            expect(result1.isCompleted).toBe(true);

            // TODO: cannot submit timestamp.set - gettin error
            //   'RpcError: 1010: Invalid Transaction: Transaction dispatch is mandatory; transactions may not have mandatory dispatches.'
            // Solution: Move APR calculation to separate function and unit test it without using actual parachain value,
            // mock the parachain response for this.

            // Manipulates time to accredit interest.
            const timestamp1MonthInFuture = Date.now() + 1000 * 60 * 60 * 24 * 30;
            const setTimeToFutureExtrinsic = sudoInterBtcAPI.api.tx.timestamp.set(timestamp1MonthInFuture);

            const result2 = await DefaultTransactionAPI.sendLogged(
                api,
                sudoAccount,
                api.tx.sudo.sudo(setTimeToFutureExtrinsic),
                api.events.sudo.Sudid
            );
            expect(result2.isCompleted).toBe(true);
        });
    });

    describe("getUnderlyingCurrencyFromLendTokenId", () => {
        it("should return correct underlying currency for lend token", async () => {
            const returnedUnderlyingCurrency = await getUnderlyingCurrencyFromLendTokenId(api, lendTokenId1);

            expect(returnedUnderlyingCurrency).toEqual(underlyingCurrency);
        });

        it(
            "should throw when lend token id is of non-existing currency",
            async () => {
                const invalidLendTokenId = (lendTokenId1 = newCurrencyId(sudoInterBtcAPI.api, {
                    lendToken: { id: 999 },
                } as LendToken));

                await expect(getUnderlyingCurrencyFromLendTokenId(api, invalidLendTokenId)).rejects.toThrow();
            }
        );
    });

    describe("lend", () => {
        it("should lend expected amount of currency to protocol", async () => {
            const [{ amount: lendAmountBefore }] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

            const lendAmount = newMonetaryAmount(100, underlyingCurrency, true);
            await submitExtrinsic(userInterBtcAPI, await userInterBtcAPI.loans.lend(underlyingCurrency, lendAmount));

            const [{ amount: lendAmountAfter }] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);
            const actuallyLentAmount = lendAmountAfter.sub(lendAmountBefore);

            // Check that lent amount is same as sent amount
            expect(actuallyLentAmount.eq(lendAmount)).toBe(true);
        });
        it("should throw if trying to lend from inactive market", async () => {
            const inactiveUnderlyingCurrency = InterBtc;
            const amount = newMonetaryAmount(1, inactiveUnderlyingCurrency);
            const lendPromise = userInterBtcAPI.loans.lend(inactiveUnderlyingCurrency, amount);

            await expect(lendPromise).rejects.toThrow();
        });
    });

    describe("withdraw", () => {
        it("should withdraw part of lent amount", async () => {
            const [{ amount: lendAmountBefore }] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

            const amountToWithdraw = newMonetaryAmount(1, underlyingCurrency, true);
            await submitExtrinsic(
                userInterBtcAPI,
                await userInterBtcAPI.loans.withdraw(underlyingCurrency, amountToWithdraw)
            );

            const [{ amount: lendAmountAfter }] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);
            const actuallyWithdrawnAmount = lendAmountBefore.sub(lendAmountAfter).toBig().round(2);

            try {
                expect(actuallyWithdrawnAmount.eq(amountToWithdraw.toBig())).toBe(true);
            } catch(_) {
                // eslint-disable-next-line max-len
                throw Error(`Expected withdrawn amount: ${amountToWithdraw.toHuman()} is different from the actual amount: ${actuallyWithdrawnAmount.toString()}!`);
            }
        });
    });

    describe("withdrawAll", () => {
        it("should withdraw full amount from lending protocol", async () => {
            await submitExtrinsic(userInterBtcAPI, await userInterBtcAPI.loans.withdrawAll(underlyingCurrency));

            const lendPositions = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

            try {
                expect(lendPositions).toHaveLength(0);
            } catch(_) {
                throw Error("Expected to withdraw full amount and close position!");
            }
        });
    });

    describe("enableAsCollateral", () => {
        it("should enable lend position as collateral", async () => {
            const lendAmount = newMonetaryAmount(1, underlyingCurrency, true);
            await submitExtrinsic(userInterBtcAPI, await userInterBtcAPI.loans.lend(underlyingCurrency, lendAmount));
            await submitExtrinsic(userInterBtcAPI, await userInterBtcAPI.loans.enableAsCollateral(underlyingCurrency));
            const [{ isCollateral }] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

            expect(isCollateral).toBe(true);
        });
    });

    describe("disableAsCollateral", () => {
        it(
            "should disable enabled collateral position if there are no borrows",
            async () => {
                await submitExtrinsic(userInterBtcAPI, await userInterBtcAPI.loans.disableAsCollateral(underlyingCurrency));
                const [{ isCollateral }] = await userInterBtcAPI.loans.getLendPositionsOfAccount(userAccountId);

                expect(isCollateral).toBe(false);
            }
        );
    });

    describe("getLoanAssets", () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should get loan assets in correct format", async () => {
            const loanAssets = await userInterBtcAPI.loans.getLoanAssets();
            const underlyingCurrencyLoanAsset = loanAssets[underlyingCurrency.ticker];

            expect(underlyingCurrencyLoanAsset).toBeDefined();
            expect(underlyingCurrencyLoanAsset.currency).toEqual(underlyingCurrency);
            expect(underlyingCurrencyLoanAsset.isActive).toBe(true);
            // TODO: add more tests to check data validity
        });

        it("should return empty object if there are no added markets", async () => {
            // Mock empty list returned from chain.
            mock.spyOn(LoansAPI, "getLoansMarkets").mockClear().mockReturnValue(Promise.resolve([]));

            const loanAssets = await LoansAPI.getLoanAssets();
            expect(loanAssets).toHaveLength(0);
        });
    });

    describe("getAccruedRewardsOfAccount", () => {
        beforeAll(async () => {
            const addRewardExtrinsic = sudoInterBtcAPI.api.tx.loans.addReward("100000000000000");
            const updateRewardSpeedExtrinsic_1 = sudoInterBtcAPI.api.tx.loans.updateMarketRewardSpeed(
                underlyingCurrencyId,
                "1000000000000",
                "0"
            );
            const updateRewardSpeedExtrinsic_2 = sudoInterBtcAPI.api.tx.loans.updateMarketRewardSpeed(
                underlyingCurrencyId2,
                "0",
                "1000000000000"
            );

            const updateRewardSpeed = api.tx.sudo.sudo(
                sudoInterBtcAPI.api.tx.utility.batchAll([updateRewardSpeedExtrinsic_1, updateRewardSpeedExtrinsic_2])
            );

            const rewardExtrinsic = sudoInterBtcAPI.api.tx.utility.batchAll([addRewardExtrinsic, updateRewardSpeed]);

            const result = await DefaultTransactionAPI.sendLogged(
                api,
                sudoAccount,
                rewardExtrinsic,
                api.events.sudo.Sudid
            );

            try {
                expect(result.isCompleted).toBe(true);
            } catch(_) {
                throw Error("Sudo event to add rewards not found");
            }
        });

        it("should return correct amount of rewards", async () => {
            await submitExtrinsic(
                userInterBtcAPI,
                await userInterBtcAPI.loans.lend(underlyingCurrency, newMonetaryAmount(1, underlyingCurrency, true)),
                false
            );

            const rewards = await userInterBtcAPI.loans.getAccruedRewardsOfAccount(userAccountId);

            expect(rewards.total.toBig().eq(1)).toBe(true);

            await submitExtrinsic(userInterBtcAPI, {
                extrinsic: userInterBtcAPI.api.tx.utility.batchAll([
                    (
                        await userInterBtcAPI.loans.lend(
                            underlyingCurrency2,
                            newMonetaryAmount(0.1, underlyingCurrency2, true)
                        )
                    ).extrinsic,
                    (await userInterBtcAPI.loans.enableAsCollateral(underlyingCurrency)).extrinsic,
                    (
                        await userInterBtcAPI.loans.borrow(
                            underlyingCurrency2,
                            newMonetaryAmount(0.1, underlyingCurrency2, true)
                        )
                    ).extrinsic,
                ]),
                event: userInterBtcAPI.api.events.loans.Borrowed,
            });

            const rewardsAfterBorrow = await userInterBtcAPI.loans.getAccruedRewardsOfAccount(userAccountId);

            expect(rewardsAfterBorrow.total.toBig().eq(2)).toBe(true);

            // repay the loan to clean the state
            await submitExtrinsic(userInterBtcAPI, await userInterBtcAPI.loans.repayAll(underlyingCurrency2));
            await submitExtrinsic(userInterBtcAPI, await userInterBtcAPI.loans.withdrawAll(underlyingCurrency2));
        });
    });

    describe("claimAllSubsidyRewards", () => {
        it("should claim all subsidy rewards", () => {
            // TODO
        });
    });

    describe("borrow", () => {
        it("should borrow specified amount", async () => {
            const lendAmount = newMonetaryAmount(100, underlyingCurrency, true);
            const borrowAmount = newMonetaryAmount(1, underlyingCurrency, true);
            await submitExtrinsic(user2InterBtcAPI, await user2InterBtcAPI.loans.lend(underlyingCurrency, lendAmount));
            await submitExtrinsic(
                user2InterBtcAPI,
                await user2InterBtcAPI.loans.enableAsCollateral(underlyingCurrency)
            );
            let borrowers = await user2InterBtcAPI.loans.getBorrowerAccountIds();

            try {
                expect(!includesStringified(borrowers, user2AccountId)).toBe(true);
            } catch(_) {
                throw Error(`Expected ${user2AccountId.toString()} not to be included in the result of \`getBorrowerAccountIds\``);
            }
            await submitExtrinsic(
                user2InterBtcAPI,
                await user2InterBtcAPI.loans.borrow(underlyingCurrency, borrowAmount)
            );
            borrowers = await user2InterBtcAPI.loans.getBorrowerAccountIds();

            try {
                expect(includesStringified(borrowers, user2AccountId)).toBe(true);
            } catch(_) {
                throw Error(`Expected ${user2AccountId.toString()} to be included in the result of \`getBorrowerAccountIds\``);
            }

            const [{ amount }] = await user2InterBtcAPI.loans.getBorrowPositionsOfAccount(user2AccountId);
            const roundedAmount = amount.toBig().round(2);

            try {
                expect(roundedAmount.eq(borrowAmount.toBig())).toBe(true);
            } catch(_) {
                throw Error(`Expected borrowed amount to equal ${borrowAmount.toString()}, but it is ${amount.toString()}.`);
            }
        });
    });

    describe("repay", () => {
        it("should repay specified amount", async () => {
            const repayAmount = newMonetaryAmount(0.5, underlyingCurrency, true);
            const [{ amount: borrowAmountBefore }] = await user2InterBtcAPI.loans.getBorrowPositionsOfAccount(
                user2AccountId
            );
            await submitExtrinsic(
                user2InterBtcAPI,
                await user2InterBtcAPI.loans.repay(underlyingCurrency, repayAmount)
            );
            const [{ amount: borrowAmountAfter }] = await user2InterBtcAPI.loans.getBorrowPositionsOfAccount(
                user2AccountId
            );

            const borrowAmountAfterRounded = borrowAmountAfter.toBig().round(2);
            const expectedRemainingAmount = borrowAmountBefore.sub(repayAmount);

            expect(borrowAmountAfterRounded.toNumber()).toBe(expectedRemainingAmount.toBig().toNumber());
        });
    });

    describe("repayAll", () => {
        it("should repay whole loan", async () => {
            await submitExtrinsic(user2InterBtcAPI, await user2InterBtcAPI.loans.repayAll(underlyingCurrency));
            const borrowPositions = await user2InterBtcAPI.loans.getBorrowPositionsOfAccount(user2AccountId);

            try {
                expect(borrowPositions).toHaveLength(0);
            } catch(_) {
                throw Error(`Expected to repay full borrow position, but positions: ${borrowPositions} were found`);
            }
        });
    });

    describe.skip("getBorrowPositionsOfAccount", () => {
        beforeAll(async () => {
            // TODO
        });

        it("should get borrow positions in correct format", async () => {
            // TODO
        });
    });

    // Prerequisites: This test depends on the ones above. User 2 must have already
    // deposited funds and enabled them as collateral, so that they can successfully borrow.
    describe("liquidateBorrowPosition", () => {
        it("should liquidate position when possible", async () => {
            // Supply asset by account1, borrow by account2
            const borrowAmount = newMonetaryAmount(10, underlyingCurrency2, true);
            await submitExtrinsic(userInterBtcAPI, await userInterBtcAPI.loans.lend(underlyingCurrency2, borrowAmount));
            await submitExtrinsic(
                user2InterBtcAPI,
                await user2InterBtcAPI.loans.borrow(underlyingCurrency2, borrowAmount)
            );

            const exchangeRateValue = new Big(1);
            await callWithExchangeRate(sudoInterBtcAPI, underlyingCurrency2, exchangeRateValue, async () => {
                const repayAmount = newMonetaryAmount(1, underlyingCurrency2); // repay smallest amount
                const undercollateralizedBorrowers = await user2InterBtcAPI.loans.getUndercollateralizedBorrowers();

                expect(undercollateralizedBorrowers).toHaveLength(1);
                expect(undercollateralizedBorrowers[0].accountId.toString()).toBe(user2AccountId.toString());
                await submitExtrinsic(
                    userInterBtcAPI,
                    userInterBtcAPI.loans.liquidateBorrowPosition(
                        user2AccountId,
                        underlyingCurrency2,
                        repayAmount,
                        underlyingCurrency
                    )
                );
            });
        });

        it("should throw when no position can be liquidated", async () => {
            const repayAmount = newMonetaryAmount(1, underlyingCurrency2, true); // repay smallest amount

            await expect(
                submitExtrinsic(
                    userInterBtcAPI,
                    userInterBtcAPI.loans.liquidateBorrowPosition(
                        user2AccountId,
                        underlyingCurrency2,
                        repayAmount,
                        underlyingCurrency
                    )
                )
            ).rejects.toThrow();
        });
    });
});
