import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import {
    ATOMIC_UNIT,
    CollateralCurrencyExt,
    currencyIdToMonetaryCurrency,
    DefaultInterBtcApi,
    getCorrespondingCollateralCurrencies,
    InterBtcApi,
    InterbtcPrimitivesVaultId,
    IssueStatus,
    newAccountId,
    newMonetaryAmount,
} from "../../../../../src/index";
import { createSubstrateAPI } from "../../../../../src/factory";
import { assert } from "../../../../chai";
import {
    USER_1_URI,
    VAULT_1_URI,
    VAULT_2_URI,
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_PORT,
    BITCOIN_CORE_USERNAME,
    BITCOIN_CORE_WALLET,
    PARACHAIN_ENDPOINT,
    ESPLORA_BASE_PATH,
} from "../../../../config";
import { BitcoinCoreClient } from "../../../../../src/utils/bitcoin-core-client";
import { issueSingle } from "../../../../../src/utils/issueRedeem";
import { newVaultId, WrappedCurrency } from "../../../../../src";
import { runWhileMiningBTCBlocks, sudo } from "../../../../utils/helpers";

describe("issue", () => {
    let api: ApiPromise;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let userInterBtcAPI: InterBtcApi;

    let userAccount: KeyringPair;
    let vault_1: KeyringPair;
    let vault_1_ids: Array<InterbtcPrimitivesVaultId>;
    let vault_2: KeyringPair;
    let vault_2_ids: Array<InterbtcPrimitivesVaultId>;

    let wrappedCurrency: WrappedCurrency;
    let collateralCurrencies: Array<CollateralCurrencyExt>;

    before(async function () {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        userAccount = keyring.addFromUri(USER_1_URI);
        userInterBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);
        collateralCurrencies = getCorrespondingCollateralCurrencies(userInterBtcAPI.getGovernanceCurrency());
        wrappedCurrency = userInterBtcAPI.getWrappedCurrency();

        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_1_ids = collateralCurrencies.map((collateralCurrency) =>
            newVaultId(api, vault_1.address, collateralCurrency, wrappedCurrency)
        );
        vault_2_ids = collateralCurrencies.map((collateralCurrency) =>
            newVaultId(api, vault_2.address, collateralCurrency, wrappedCurrency)
        );

        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );
    });

    after(async () => {
        api.disconnect();
    });

    it("should request one issue", async () => {
        // may fail if the relay isn't fully initialized
        const amount = newMonetaryAmount(0.0001, wrappedCurrency, true);
        const feesToPay = await userInterBtcAPI.issue.getFeesToPay(amount);
        const requestResults = await userInterBtcAPI.issue.request(amount);
        assert.equal(
            requestResults.length,
            1,
            "Created multiple requests instead of one (ensure vault has sufficient collateral)"
        );
        const requestResult = requestResults[0];
        const issueRequest = await userInterBtcAPI.issue.getRequestById(requestResult.id);
        assert.equal(
            issueRequest.wrappedAmount.toString(),
            amount.sub(feesToPay).toString(),
            "Amount different than expected"
        );
    });

    it("should list existing requests", async () => {
        const issueRequests = await userInterBtcAPI.issue.list();
        assert.isAtLeast(issueRequests.length, 1, "Should have at least 1 issue request");
    });

    // FIXME: not used at the moment. Fix in a more elegant way, i.e., check what is issuable
    // by two vaults can request exactly that amount instead of multiplying by 1.1
    it.skip("should batch request across several vaults", async () => {
        const requestLimits = await userInterBtcAPI.issue.getRequestLimits();
        const amount = requestLimits.singleVaultMaxIssuable.mul(1.1);
        const issueRequests = await userInterBtcAPI.issue.request(amount);
        assert.equal(issueRequests.length, 2, "Created wrong amount of requests, vaults have insufficient collateral");
        const issuedAmount1 = issueRequests[0].wrappedAmount;
        const issueFee1 = issueRequests[0].bridgeFee;
        const issuedAmount2 = issueRequests[1].wrappedAmount;
        const issueFee2 = issueRequests[1].bridgeFee;
        assert.equal(
            issuedAmount1.add(issueFee1).add(issuedAmount2).add(issueFee2).toBig().round(5).toString(),
            amount.toBig().round(5).toString(),
            "Issued amount is not equal to requested amount"
        );
    });

    it("should fail to request a value finer than 1 Satoshi", async () => {
        for (const vault_1_id of vault_1_ids) {
            const amount = newMonetaryAmount(0.00000121, wrappedCurrency, true);
            await assert.isRejected(
                issueSingle(userInterBtcAPI, bitcoinCoreClient, userAccount, amount, vault_1_id, true, false)
            );
        }
    });

    // auto-execution tests may stall indefinitely, due to vault client inaction.
    // This will cause the testing pipeline to time out.
    // TODO: Discuss if we want to test this in the lib. Should rather be tested in the clients
    it.skip("should request and auto-execute issue", async () => {
        for (const vault_1_id of vault_1_ids) {
            const amount = newMonetaryAmount(0.00121, wrappedCurrency, true);

            const feesToPay = await userInterBtcAPI.issue.getFeesToPay(amount);
            const issueResult = await issueSingle(
                userInterBtcAPI,
                bitcoinCoreClient,
                userAccount,
                amount,
                vault_1_id,
                true,
                false
            );
            assert.equal(
                issueResult.finalWrappedTokenBalance.sub(issueResult.initialWrappedTokenBalance).toString(),
                amount.sub(feesToPay).toString(),
                "Final balance was not increased by the exact amount specified"
            );
        }
    }).timeout(1000000);

    it("should request and manually execute issue", async () => {
        for (const vault_2_id of vault_2_ids) {
            const currencyTicker = (
                await currencyIdToMonetaryCurrency(userInterBtcAPI.assetRegistry, vault_2_id.currencies.collateral)
            ).ticker;

            const amount = newMonetaryAmount(0.00001, wrappedCurrency, true);
            const feesToPay = await userInterBtcAPI.issue.getFeesToPay(amount);
            const oneSatoshi = newMonetaryAmount(1, wrappedCurrency, false);
            const issueResult = await issueSingle(
                userInterBtcAPI,
                bitcoinCoreClient,
                userAccount,
                amount,
                vault_2_id,
                false,
                false
            );

            // calculate expected final balance and round the fees value as the parachain will do so when calculating fees.
            const amtInSatoshi = amount.toBig(ATOMIC_UNIT);
            const feesInSatoshiRounded = feesToPay.toBig(ATOMIC_UNIT).round(0);
            const expectedFinalBalance = amtInSatoshi
                .sub(feesInSatoshiRounded)
                .sub(oneSatoshi.toBig(ATOMIC_UNIT))
                .toString();
            assert.equal(
                issueResult.finalWrappedTokenBalance
                    .sub(issueResult.initialWrappedTokenBalance)
                    .toBig(ATOMIC_UNIT)
                    .toString(),
                expectedFinalBalance,
                `Final balance was not increased by the exact amount specified (collateral: ${currencyTicker})`
            );
        }
    }).timeout(1000000);

    // TODO: maybe add this to issue API
    it("should get issueBtcDustValue", async () => {
        const dust = await userInterBtcAPI.api.query.issue.issueBtcDustValue();
        assert.equal(dust.toString(), "1000");
    });

    it("should getFeesToPay", async () => {
        const amount = newMonetaryAmount(2, wrappedCurrency, true);
        const feesToPay = await userInterBtcAPI.issue.getFeesToPay(amount);
        const feeRate = await userInterBtcAPI.issue.getFeeRate();

        const expectedFeesInBTC = amount.toBig().toNumber() * feeRate.toNumber();
        // compare floating point values in BTC, allowing for small delta difference
        assert.closeTo(
            feesToPay.toBig().toNumber(),
            expectedFeesInBTC,
            0.00001,
            "Calculated fees in BTC do not match expectations"
        );
    });

    it("should getFeeRate", async () => {
        const feePercentage = await userInterBtcAPI.issue.getFeeRate();
        assert.equal(feePercentage.toString(), "0.0015");
    });

    // FIXME: don't use magic numbers for these tests
    it("should getRequestLimits", async () => {
        const requestLimits = await userInterBtcAPI.issue.getRequestLimits();
        const singleMaxIssuable = requestLimits.singleVaultMaxIssuable;
        const totalMaxIssuable = requestLimits.singleVaultMaxIssuable;
        const expected = newMonetaryAmount(0.0005, wrappedCurrency, true);
        assert.isTrue(
            singleMaxIssuable.gt(expected),
            `singleVaultMaxIssuable is ${singleMaxIssuable.toHuman()}, expected greater than ${expected.toHuman()}`
        );
        assert.isTrue(
            totalMaxIssuable.gte(singleMaxIssuable),
            `totalMaxIssuable is ${totalMaxIssuable.toHuman()}, expected greater than or equal to ${singleMaxIssuable.toHuman()}`
        );
    });

    // TODO: Unskip after `subscribeToIssueExpiry` is reimplemented
    // This test should be kept at the end of the file as it will ban the vault used for issuing
    it.skip("should cancel an issue request", async () => {
        for (const vault_2_id of vault_2_ids) {
            await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
                const initialIssuePeriod = await userInterBtcAPI.issue.getIssuePeriod();
                await sudo(userInterBtcAPI, () => userInterBtcAPI.issue.setIssuePeriod(0));
                try {
                    // request issue
                    const amount = newMonetaryAmount(0.0000121, wrappedCurrency, true);
                    const vaultCollateral = await currencyIdToMonetaryCurrency(
                        userInterBtcAPI.assetRegistry,
                        vault_2_id.currencies.collateral
                    );
                    const requestResults = await userInterBtcAPI.issue.request(
                        amount,
                        newAccountId(api, vault_2.address),
                        vaultCollateral
                    );
                    assert.equal(requestResults.length, 1, "Test broken: more than one issue request created"); // sanity check
                    const requestResult = requestResults[0];

                    // Wait for issue expiry callback
                    // await new Promise<void>((resolve, _) => {
                    //     userInterBtcAPI.issue.subscribeToIssueExpiry(newAccountId(api, userAccount.address), (requestId) => {
                    //         if (stripHexPrefix(requestResult.id.toString()) === stripHexPrefix(requestId.toString())) {
                    //             resolve();
                    //         }
                    //     });
                    // });

                    await userInterBtcAPI.issue.cancel(requestResult.id);

                    const issueRequest = await userInterBtcAPI.issue.getRequestById(requestResult.id);
                    assert.isTrue(issueRequest.status === IssueStatus.Cancelled, "Failed to cancel issue request");

                    // Set issue period back to its initial value to minimize side effects.
                    await sudo(userInterBtcAPI, () => userInterBtcAPI.issue.setIssuePeriod(initialIssuePeriod));
                } catch (e) {
                    // Set issue period back to its initial value to minimize side effects.
                    await sudo(userInterBtcAPI, () => userInterBtcAPI.issue.setIssuePeriod(initialIssuePeriod));
                    throw e;
                }
            });
        }
    }).timeout(10 * 60000);
});
