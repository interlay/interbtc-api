import { ApiPromise, Keyring } from "@polkadot/api";

import { createPolkadotAPI } from "../../../../src/factory";
import { ORACLE_URI, PARACHAIN_ENDPOINT, USER_1_URI, USER_2_URI, VAULT_TO_BAN_URI } from "../../../config";
import { DefaultEscrowAPI, DefaultSystemAPI, DefaultTokensAPI, EscrowAPI, FeeAPI, newAccountId, newMonetaryAmount, SystemAPI, TokensAPI } from "../../../../src";
import { assert } from "chai";
import { Interlay } from "@interlay/monetary-js";
import { KeyringPair } from "@polkadot/keyring/types";
import { sudo } from "../../../utils/helpers";

describe("escrow", () => {
    let api: ApiPromise;
    let systemAPI: SystemAPI;
    let escrowAPI: EscrowAPI;
    let tokensAPI: TokensAPI;

    let userAccount_1: KeyringPair;
    let userAccount_2: KeyringPair;
    let userAccount_3: KeyringPair;

    before(async function () {
        const keyring = new Keyring({ type: "sr25519" });
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        systemAPI = new DefaultSystemAPI(api);
        escrowAPI = new DefaultEscrowAPI(api, Interlay, systemAPI);
        tokensAPI = new DefaultTokensAPI(api);
        userAccount_1 = keyring.addFromUri(USER_1_URI);
        userAccount_2 = keyring.addFromUri(USER_2_URI);
        userAccount_3 = keyring.addFromUri(VAULT_TO_BAN_URI);
    });

    after(async () => {
        api.disconnect();
    });

    // PRECONDITION: This test must run first, so no tokens are locked.
    it("Non-negative voting supply", async () => {
        const totalVotingSupply = await escrowAPI.totalVotingSupply();
        assert.equal(
            totalVotingSupply.toString(),
            "0",
            "Voting supply balance should be zero before any tokens are locked"
        );
    }).timeout(100000);

    it("should compute voting balance and total supply", async () => {
        const user1_intrAmount = newMonetaryAmount(1000, Interlay, true);
        const user2_intrAmount = newMonetaryAmount(600, Interlay, true);

        const currentBlockNumber = await systemAPI.getCurrentBlockNumber();
        const unlockHeightDiff = (await escrowAPI.getSpan()).toNumber();

        const userIntrPairs: [KeyringPair, typeof user2_intrAmount][] = [
            [userAccount_1, user1_intrAmount],
            [userAccount_2, user2_intrAmount],
        ];
        
        for (const [userKeyring, amount] of userIntrPairs) {
            const userAccount = newAccountId(api, userKeyring.address);
            await sudo(
                tokensAPI,
                (a) => a.setBalance(
                    userAccount,
                    amount
                )
            );
        }

        escrowAPI.setAccount(userAccount_1);
        await escrowAPI.createLock(user1_intrAmount, currentBlockNumber + unlockHeightDiff);

        const votingBalance = 
            await escrowAPI.votingBalance(newAccountId(api, userAccount_1.address), currentBlockNumber + 0.4 * unlockHeightDiff);
        const votingSupply = await escrowAPI.totalVotingSupply(currentBlockNumber + 0.4 * unlockHeightDiff);
        assert.equal(votingBalance.toString(votingBalance.currency.base), votingSupply.toString(votingSupply.currency.base));

        // Hardcoded value here to match the parachain
        assert.equal(
            votingSupply.toBig(votingSupply.currency.base).round(2, 0).toString(),
            "2.87"
        );

        console.log(`checking at height: ${currentBlockNumber + 0.4 * unlockHeightDiff}`);

        // Lock the tokens of a second user, to ensure total voting supply is still correct
        escrowAPI.setAccount(userAccount_2);
        await escrowAPI.createLock(user2_intrAmount, currentBlockNumber + unlockHeightDiff);
        const votingSupplyAfterSecondUser = await escrowAPI.totalVotingSupply(currentBlockNumber + 0.4 * unlockHeightDiff);
        assert.equal(
            votingSupplyAfterSecondUser.toBig(votingSupplyAfterSecondUser.currency.base).round(2, 0).toString(),
            "4.6"
        );
    }).timeout(100000);

    // TODO: Unskip and implement once instant-seal is added to interbtc-standalone. Otherwise this test would take a week.
    it.skip("should withdraw locked funds", async () => {}).timeout(100000);
    
    it("should increase amount and unlock height", async () => {
        const user_intrAmount = newMonetaryAmount(1000, Interlay, true);
        const userAccount = newAccountId(api, userAccount_3.address);

        const currentBlockNumber = await systemAPI.getCurrentBlockNumber();
        const unlockHeightDiff = (await escrowAPI.getSpan()).toNumber();
        
        await sudo(
            tokensAPI,
            (a) => a.setBalance(
                userAccount,
                user_intrAmount.mul(2)
            )
        );

        escrowAPI.setAccount(userAccount_3);
        await escrowAPI.createLock(user_intrAmount, currentBlockNumber + unlockHeightDiff);
        await escrowAPI.increaseAmount(user_intrAmount);
        await escrowAPI.increaseUnlockHeight(currentBlockNumber + unlockHeightDiff + unlockHeightDiff);
    }).timeout(100000);

});
