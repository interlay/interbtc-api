import { ApiPromise, Keyring } from "@polkadot/api";
import { assert } from "chai";
import { KeyringPair } from "@polkadot/keyring/types";
import BN from "bn.js";
import Big, { RoundingMode } from "big.js";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { AccountId } from "@polkadot/types/interfaces";

import { createSubstrateAPI } from "../../../../../src/factory";
import { ESPLORA_BASE_PATH, PARACHAIN_ENDPOINT, SUDO_URI } from "../../../../config";
import {
    decodeFixedPointType,
    DefaultInterBtcApi,
    GovernanceCurrency,
    InterBtcApi,
    newAccountId,
    newCurrencyId,
    newMonetaryAmount,
} from "../../../../../src";

import { setRawStorage } from "../../../../../src/utils/storage";
import { makeRandomPolkadotKeyPair, submitExtrinsic } from "../../../../utils/helpers";

function fundAccountCall(api: InterBtcApi, address: string): SubmittableExtrinsic<"promise"> {
    return api.api.tx.tokens.setBalance(
        address,
        newCurrencyId(api.api, api.getGovernanceCurrency()),
        "1152921504606846976",
        0
    );
}

async function getEscrowStake(api: ApiPromise, accountId: AccountId): Promise<Big> {
    const rawStake = await api.query.escrowRewards.stake([null, accountId]);
    return decodeFixedPointType(rawStake);
}

async function getEscrowTotalStake(api: ApiPromise): Promise<Big> {
    const rawTotalStake = await api.query.escrowRewards.totalStake(null);
    return decodeFixedPointType(rawTotalStake);
}

async function getEscrowRewardPerToken(api: InterBtcApi): Promise<Big> {
    const governanceCurrencyId = newCurrencyId(api.api, api.getGovernanceCurrency());
    const rawRewardPerToken = await api.api.query.escrowRewards.rewardPerToken(governanceCurrencyId, null);
    return decodeFixedPointType(rawRewardPerToken);
}

// NOTE: we don't test withdraw here because even with instant-seal
// it is significantly slow to produce many blocks
describe("escrow", () => {
    let api: ApiPromise;
    let interBtcAPI: DefaultInterBtcApi;

    let userAccount1: KeyringPair;
    let userAccount2: KeyringPair;
    let userAccount3: KeyringPair;
    let sudoAccount: KeyringPair;

    let governanceCurrency: GovernanceCurrency;

    before(async function () {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);
        governanceCurrency = interBtcAPI.getGovernanceCurrency();

        const keyring = new Keyring({ type: "sr25519" });
        sudoAccount = keyring.addFromUri(SUDO_URI);

        userAccount1 = makeRandomPolkadotKeyPair(keyring);
        userAccount2 = makeRandomPolkadotKeyPair(keyring);
        userAccount3 = makeRandomPolkadotKeyPair(keyring);

        await api.tx.sudo
            .sudo(
                api.tx.utility.batchAll([
                    fundAccountCall(interBtcAPI, userAccount1.address),
                    fundAccountCall(interBtcAPI, userAccount2.address),
                    fundAccountCall(interBtcAPI, userAccount3.address),
                ])
            )
            .signAndSend(sudoAccount);
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
    });

    // PRECONDITION: This test must run second, so no tokens are locked.
    it("should return 0 reward and apy estimate", async () => {
        const rewardsEstimate = await interBtcAPI.escrow.getRewardEstimate(newAccountId(api, userAccount1.address));

        const expected = new Big(0);
        assert.isTrue(expected.eq(rewardsEstimate.apy), `APY should be 0, but is ${rewardsEstimate.apy.toString()}`);
        assert.isTrue(
            rewardsEstimate.amountAnnualized.isZero(),
            `Annualized rewards should be 0, but are ${rewardsEstimate.amountAnnualized.toHuman()}`
        );
        assert.isTrue(
            rewardsEstimate.amountTotal.isZero(),
            `Total rewards should be 0, but are ${rewardsEstimate.amountTotal.toHuman()}`
        );
    });

    it("should compute voting balance, total supply, and total staked balance", async () => {
        const user1Amount = newMonetaryAmount(100, governanceCurrency, true);
        const user2Amount = newMonetaryAmount(60, governanceCurrency, true);

        const currentBlockNumber = await interBtcAPI.system.getCurrentBlockNumber();
        const unlockHeightDiff = (await interBtcAPI.escrow.getSpan()).toNumber();
        const stakedTotalBefore = await interBtcAPI.escrow.getTotalStakedBalance();

        interBtcAPI.setAccount(userAccount1);
        await submitExtrinsic(
            interBtcAPI,
            interBtcAPI.escrow.createLock(user1Amount, currentBlockNumber + unlockHeightDiff)
        );

        const votingBalance = await interBtcAPI.escrow.votingBalance(
            newAccountId(api, userAccount1.address),
            currentBlockNumber + 0.4 * unlockHeightDiff
        );
        const votingSupply = await interBtcAPI.escrow.totalVotingSupply(currentBlockNumber + 0.4 * unlockHeightDiff);
        assert.equal(votingBalance.toString(), votingSupply.toString());

        // Hardcoded value here to match the parachain
        assert.equal(votingSupply.toBig().round(2, RoundingMode.RoundDown).toString(), "0.62");

        const firstYearRewards = "125000000000000000";
        const blocksPerYear = 2628000;
        const rewardPerBlock = new BN(firstYearRewards).divn(blocksPerYear).abs();

        await setRawStorage(
            api,
            api.query.escrowAnnuity.rewardPerBlock.key(),
            api.createType("Balance", rewardPerBlock),
            sudoAccount
        );

        const account1 = newAccountId(api, userAccount1.address);
        const stake = await getEscrowStake(api, account1);
        const totalStake = await getEscrowTotalStake(api);
        let rewardPerToken = await getEscrowRewardPerToken(interBtcAPI);
        // estimate RPC withdraws rewards first
        const rewardTally = stake.mul(rewardPerToken);
        // update with previous rewards
        rewardPerToken = rewardPerToken.add(new Big(firstYearRewards).div(totalStake));

        const expectedRewards = newMonetaryAmount(
            // rewardPerToken = rewardPerToken + reward / totalStake
            // stake * rewardPerToken - rewardTally
            stake.mul(rewardPerToken).sub(rewardTally),
            interBtcAPI.getGovernanceCurrency()
        );
        const rewardsEstimate = await interBtcAPI.escrow.getRewardEstimate(account1);

        assert.isTrue(
            expectedRewards.toBig().div(rewardsEstimate.amountAnnualized.toBig()).lt(1.1) &&
                expectedRewards.toBig().div(rewardsEstimate.amountAnnualized.toBig()).gt(0.9),
            "The estimate should be within 10% of the actual first year rewards"
        );
        assert.isTrue(
            rewardsEstimate.apy.gte(100),
            `Expected more than 100% APY, got ${rewardsEstimate.apy.toString()}`
        );

        // Lock the tokens of a second user, to ensure total voting supply is still correct
        interBtcAPI.setAccount(userAccount2);
        await submitExtrinsic(
            interBtcAPI,
            interBtcAPI.escrow.createLock(user2Amount, currentBlockNumber + unlockHeightDiff)
        );
        const votingSupplyAfterSecondUser = await interBtcAPI.escrow.totalVotingSupply(
            currentBlockNumber + 0.4 * unlockHeightDiff
        );
        assert.equal(votingSupplyAfterSecondUser.toBig().round(2, RoundingMode.RoundDown).toString(), "0.99");

        const stakedTotalAfter = await interBtcAPI.escrow.getTotalStakedBalance();
        const lockedBalanceTotal = user1Amount.add(user2Amount);
        const expectedNewBalance = stakedTotalBefore.add(lockedBalanceTotal);

        assert.isTrue(
            stakedTotalAfter.eq(expectedNewBalance),
            `Expected total staked balance to have increased by locked amounts: ${lockedBalanceTotal.toHuman()},
            but old balance was ${stakedTotalBefore.toHuman()} and new balance is ${stakedTotalAfter.toHuman()}`
        );
    });

    it("should increase amount and unlock height", async () => {
        const userAmount = newMonetaryAmount(1000, governanceCurrency, true);
        const currentBlockNumber = await interBtcAPI.system.getCurrentBlockNumber();
        const unlockHeightDiff = (await interBtcAPI.escrow.getSpan()).toNumber();

        interBtcAPI.setAccount(userAccount3);
        await submitExtrinsic(
            interBtcAPI,
            interBtcAPI.escrow.createLock(userAmount, currentBlockNumber + unlockHeightDiff)
        );
        await submitExtrinsic(interBtcAPI, interBtcAPI.escrow.increaseAmount(userAmount));
        await submitExtrinsic(
            interBtcAPI,
            interBtcAPI.escrow.increaseUnlockHeight(currentBlockNumber + unlockHeightDiff + unlockHeightDiff)
        );
    });
});
