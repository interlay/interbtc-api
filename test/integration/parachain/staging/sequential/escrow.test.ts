import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import BN from "bn.js";
import Big, { RoundingMode } from "big.js";
import { SubmittableExtrinsic } from "@polkadot/api/types";

import { createSubstrateAPI } from "../../../../../src/factory";
import { ESPLORA_BASE_PATH, PARACHAIN_ENDPOINT, SUDO_URI } from "../../../../config";
import {
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

    beforeAll(async () => {
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

    afterAll(async () => {
        await api.disconnect();
    });

    // PRECONDITION: This test must run first, so no tokens are locked.
    it("Non-negative voting supply", async () => {
        const totalVotingSupply = await interBtcAPI.escrow.totalVotingSupply();
        expect(totalVotingSupply.toString()).toEqual("0");
    });

    // PRECONDITION: This test must run second, so no tokens are locked.
    it("should return 0 reward and apy estimate", async () => {
        const rewardsEstimate = await interBtcAPI.escrow.getRewardEstimate(newAccountId(api, userAccount1.address));

        const expected = new Big(0);
        expect(expected.eq(rewardsEstimate.apy)).toBe(true);
        expect(rewardsEstimate.amount.isZero()).toBe(true);
    });

    it(
        "should compute voting balance, total supply, and total staked balance",
        async () => {
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
            expect(votingBalance.toString()).toEqual(votingSupply.toString());

            // Hardcoded value here to match the parachain
            expect(votingSupply.toBig().round(2, RoundingMode.RoundDown).toString()).toEqual("0.62");

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

            const rewardsEstimate = await interBtcAPI.escrow.getRewardEstimate(account1);

            expect(rewardsEstimate.amount.toBig().gt(0)).toBe(true);
            expect(rewardsEstimate.apy.gte(100)).toBe(true);

            // Lock the tokens of a second user, to ensure total voting supply is still correct
            interBtcAPI.setAccount(userAccount2);
            await submitExtrinsic(
                interBtcAPI,
                interBtcAPI.escrow.createLock(user2Amount, currentBlockNumber + unlockHeightDiff)
            );
            const votingSupplyAfterSecondUser = await interBtcAPI.escrow.totalVotingSupply(
                currentBlockNumber + 0.4 * unlockHeightDiff
            );
            expect(
                votingSupplyAfterSecondUser.toBig().round(2, RoundingMode.RoundDown).toString()
            ).toEqual("0.99");

            const stakedTotalAfter = await interBtcAPI.escrow.getTotalStakedBalance();
            const lockedBalanceTotal = user1Amount.add(user2Amount);
            const expectedNewBalance = stakedTotalBefore.add(lockedBalanceTotal);

            expect(stakedTotalAfter.eq(expectedNewBalance)).toBe(true);
        }
    );

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
