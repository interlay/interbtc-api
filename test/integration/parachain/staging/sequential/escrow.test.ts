import { ApiPromise, Keyring } from "@polkadot/api";
import { assert } from "chai";
import { KeyringPair } from "@polkadot/keyring/types";
import BN from "bn.js";
import Big, { RoundingMode } from "big.js";

import { createSubstrateAPI } from "../../../../../src/factory";
import {
    ESPLORA_BASE_PATH,
    PARACHAIN_ENDPOINT,
    SUDO_URI,
    VAULT_3_URI,
    VAULT_TO_BAN_URI,
    VAULT_TO_LIQUIDATE_URI,
} from "../../../../config";
import { DefaultInterBtcApi, GovernanceCurrency, newAccountId, newMonetaryAmount } from "../../../../../src";
import { setNumericStorage } from "../../../../../src/utils/storage";
import { sudo } from "../../../../utils/helpers";

describe("escrow", () => {
    let api: ApiPromise;
    let interBtcAPI: DefaultInterBtcApi;

    let userAccount_1: KeyringPair;
    let userAccount_2: KeyringPair;
    let userAccount_3: KeyringPair;
    let sudoAccount: KeyringPair;

    let governanceCurrency: GovernanceCurrency;

    before(async function () {
        const keyring = new Keyring({ type: "sr25519" });
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);

        // Use vault accounts as they are not involved in other tests but are prefunded with governance tokens
        userAccount_1 = keyring.addFromUri(VAULT_3_URI);
        userAccount_2 = keyring.addFromUri(VAULT_TO_LIQUIDATE_URI);
        userAccount_3 = keyring.addFromUri(VAULT_TO_BAN_URI);
        sudoAccount = keyring.addFromUri(SUDO_URI);

        interBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount_1, ESPLORA_BASE_PATH);
        governanceCurrency = interBtcAPI.getGovernanceCurrency();
    });

    after(async () => {
        api.disconnect();
    });

    // PRECONDITION: This test must run first, so no tokens are locked.
    it("Non-negative voting supply", async () => {
        const totalVotingSupply = await interBtcAPI.escrow.totalVotingSupply();
        assert.equal(
            totalVotingSupply.toString(),
            "0",
            "Voting supply balance should be zero before any tokens are locked"
        );
    }).timeout(100000);

    // PRECONDITION: This test must run second, so no tokens are locked.
    it("should return 0 reward and apy estimate", async () => {
        const rewardsEstimate = await interBtcAPI.escrow.getRewardEstimate(newAccountId(api, userAccount_1.address), {
            ticker: "KINT",
            decimals: 0,
            name: "Kintsugi",
        });

        const expected = new Big(0);
        assert.isTrue(expected.eq(rewardsEstimate.apy), `APY should be 0, but is ${rewardsEstimate.apy.toString()}`);
        assert.isTrue(
            rewardsEstimate.amount.isZero(),
            `Rewards should be 0, but are ${rewardsEstimate.amount.toHuman()}`
        );
    });

    it("should compute voting balance, total supply, and total staked balance", async () => {
        const user1_intrAmount = newMonetaryAmount(100, governanceCurrency, true);
        const user2_intrAmount = newMonetaryAmount(60, governanceCurrency, true);
        const chargedFees = newMonetaryAmount(2, governanceCurrency, true);

        const currentBlockNumber = await interBtcAPI.system.getCurrentBlockNumber();
        const unlockHeightDiff = (await interBtcAPI.escrow.getSpan()).toNumber();

        const userIntrPairs: [KeyringPair, typeof user2_intrAmount][] = [
            [userAccount_1, user1_intrAmount],
            [userAccount_2, user2_intrAmount],
        ];

        const stakedTotalBefore = await interBtcAPI.escrow.getTotalStakedBalance();

        // FIXME: remove magic multiplier
        for (const [userKeyring, amount] of userIntrPairs) {
            const userAccount = newAccountId(api, userKeyring.address);
            const existingBalance = await interBtcAPI.tokens.balance(governanceCurrency, userAccount);

            await sudo(interBtcAPI, () =>
                interBtcAPI.tokens.setBalance(
                    userAccount,
                    amount.mul(2).add(chargedFees.mul(3)).add(existingBalance.free),
                    existingBalance.reserved
                )
            );
        }

        interBtcAPI.setAccount(userAccount_1);
        await interBtcAPI.escrow.createLock(user1_intrAmount, currentBlockNumber + unlockHeightDiff);

        const votingBalance = await interBtcAPI.escrow.votingBalance(
            newAccountId(api, userAccount_1.address),
            currentBlockNumber + 0.4 * unlockHeightDiff
        );
        const votingSupply = await interBtcAPI.escrow.totalVotingSupply(currentBlockNumber + 0.4 * unlockHeightDiff);
        assert.equal(votingBalance.toString(), votingSupply.toString());

        // Hardcoded value here to match the parachain
        assert.equal(votingSupply.toBig().round(2, RoundingMode.RoundDown).toString(), "0.62");
        const firstYearRewards = 125000000000000000;
        const blocksPerYear = 5256000;

        await setNumericStorage(
            api,
            "EscrowAnnuity",
            "RewardPerBlock",
            new BN(firstYearRewards / blocksPerYear),
            sudoAccount,
            128
        );

        const rewardsEstimate = await interBtcAPI.escrow.getRewardEstimate(newAccountId(api, userAccount_1.address), {
            ticker: "KINT",
            decimals: 0,
            name: "Kintsugi",
        });
        const expectedRewards = newMonetaryAmount(
            (firstYearRewards / blocksPerYear) * unlockHeightDiff,
            interBtcAPI.getGovernanceCurrency()
        );

        assert.isTrue(
            expectedRewards.toBig().div(rewardsEstimate.amount.toBig()).lt(1.1) &&
                expectedRewards.toBig().div(rewardsEstimate.amount.toBig()).gt(0.9),
            "The estimate should be within 10% of the actual first year rewards"
        );
        assert.isTrue(
            rewardsEstimate.apy.gte(100),
            `Expected more than 100% APY, got ${rewardsEstimate.apy.toString()}`
        );

        // Lock the tokens of a second user, to ensure total voting supply is still correct
        interBtcAPI.setAccount(userAccount_2);
        await interBtcAPI.escrow.createLock(user2_intrAmount, currentBlockNumber + unlockHeightDiff);
        const votingSupplyAfterSecondUser = await interBtcAPI.escrow.totalVotingSupply(
            currentBlockNumber + 0.4 * unlockHeightDiff
        );
        assert.equal(votingSupplyAfterSecondUser.toBig().round(2, RoundingMode.RoundDown).toString(), "0.99");

        const stakedTotalAfter = await interBtcAPI.escrow.getTotalStakedBalance();
        const lockedBalanceTotal = user1_intrAmount.add(user2_intrAmount);
        const expectedNewBalance = stakedTotalBefore.add(lockedBalanceTotal);

        assert.isTrue(
            stakedTotalAfter.eq(expectedNewBalance),
            `Expected total staked balance to have increased by locked amounts: ${lockedBalanceTotal.toHuman()},
            but old balance was ${stakedTotalBefore.toHuman()} and new balance is ${stakedTotalAfter.toHuman()}`
        );
    }).timeout(15 * 60000);

    // TODO: Unskip and implement once instant-seal is added to interbtc-standalone. Otherwise this test would take a week.
    // it.skip("should withdraw locked funds", async () => {}).timeout(100000);

    it("should increase amount and unlock height", async () => {
        const user_intrAmount = newMonetaryAmount(1000, governanceCurrency, true);
        const userAccount = newAccountId(api, userAccount_3.address);
        const chargedFees = newMonetaryAmount(2, governanceCurrency, true);

        const currentBlockNumber = await interBtcAPI.system.getCurrentBlockNumber();
        const unlockHeightDiff = (await interBtcAPI.escrow.getSpan()).toNumber();

        // FIXME: remove magic multiplier
        await sudo(interBtcAPI, () =>
            interBtcAPI.tokens.setBalance(userAccount, user_intrAmount.mul(2).add(chargedFees.mul(3)))
        );

        interBtcAPI.setAccount(userAccount_3);
        await interBtcAPI.escrow.createLock(user_intrAmount, currentBlockNumber + unlockHeightDiff);
        await interBtcAPI.escrow.increaseAmount(user_intrAmount);
        await interBtcAPI.escrow.increaseUnlockHeight(currentBlockNumber + unlockHeightDiff + unlockHeightDiff);
    }).timeout(200000);
});
