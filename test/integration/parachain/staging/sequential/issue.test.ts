import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import {
    ATOMIC_UNIT,
    CollateralCurrencyExt,
    currencyIdToMonetaryCurrency,
    DefaultInterBtcApi,
    getIssueRequestsFromExtrinsicResult,
    InterBtcApi,
    InterbtcPrimitivesVaultId,
    IssueStatus,
    newAccountId,
    newMonetaryAmount,
} from "../../../../../src/index";
import { createSubstrateAPI } from "../../../../../src/factory";
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
import {
    getCorrespondingCollateralCurrenciesForTests,
    getIssuableAmounts,
    runWhileMiningBTCBlocks,
    submitExtrinsic,
    sudo,
} from "../../../../utils/helpers";

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

    beforeAll(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        userAccount = keyring.addFromUri(USER_1_URI);
        userInterBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);
        collateralCurrencies = getCorrespondingCollateralCurrenciesForTests(userInterBtcAPI.getGovernanceCurrency());
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

    afterAll(async () => {
        api.disconnect();
    });

    it("should request one issue", async () => {
        // may fail if the relay isn't fully initialized
        const amount = newMonetaryAmount(0.0001, wrappedCurrency, true);
        const feesToPay = await userInterBtcAPI.issue.getFeesToPay(amount);
        const requestResults = await getIssueRequestsFromExtrinsicResult(
            userInterBtcAPI,
            await submitExtrinsic(userInterBtcAPI, await userInterBtcAPI.issue.request(amount))
        );
        expect(requestResults).toHaveLength(1);
        const requestResult = requestResults[0];
        const issueRequest = await userInterBtcAPI.issue.getRequestById(requestResult.id);

        expect(issueRequest.wrappedAmount.toString()).toBe(amount.sub(feesToPay).toString());
    });

    it("should list existing requests", async () => {
        const issueRequests = await userInterBtcAPI.issue.list();
        expect(issueRequests.length).toBeGreaterThanOrEqual(1);
    });

    // FIXME: can we make this test more elegant? i.e. check what is issuable
    // by two vaults can request exactly that amount instead of multiplying by 1.1
    it("should batch request across several vaults", async () => {
        const requestLimits = await userInterBtcAPI.issue.getRequestLimits();
        const amount = requestLimits.singleVaultMaxIssuable.mul(1.1);
        const issueRequests = await getIssueRequestsFromExtrinsicResult(
            userInterBtcAPI,
            await submitExtrinsic(userInterBtcAPI, await userInterBtcAPI.issue.request(amount))
        );
        expect(issueRequests).toHaveLength(2);
        const issuedAmount1 = issueRequests[0].wrappedAmount;
        const issueFee1 = issueRequests[0].bridgeFee;
        const issuedAmount2 = issueRequests[1].wrappedAmount;
        const issueFee2 = issueRequests[1].bridgeFee;

        expect(issuedAmount1.add(issueFee1).add(issuedAmount2).add(issueFee2).toBig().round(5).toString())
            .toBe(amount.toBig().round(5).toString());
    });

    it("should request and manually execute issue", async () => {
        for (const vault_2_id of vault_2_ids) {
            const currencyTicker = (await currencyIdToMonetaryCurrency(api, vault_2_id.currencies.collateral)).ticker;

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

            expect(
                issueResult.finalWrappedTokenBalance
                    .sub(issueResult.initialWrappedTokenBalance)
                    .toBig(ATOMIC_UNIT)
                    .toString()
                ).toBe(expectedFinalBalance);
        }
    }, 1000 * 60);

    it("should get issueBtcDustValue", async () => {
        const dust = await userInterBtcAPI.api.query.issue.issueBtcDustValue();
        expect(dust.toString()).toBe("1000");
    });

    it("should getFeesToPay", async () => {
        const amount = newMonetaryAmount(2, wrappedCurrency, true);
        const feesToPay = await userInterBtcAPI.issue.getFeesToPay(amount);
        const feeRate = await userInterBtcAPI.issue.getFeeRate();

        const expectedFeesInBTC = amount.toBig().toNumber() * feeRate.toNumber();

        // compare floating point values in BTC, allowing for small delta difference
        const decimalsToCheck = 5;
        const maxDelta = 10**(-decimalsToCheck); // 0.00001
        // rounded after max delta's decimals, 
        // probably not needed, but safeguards against Big -> Number conversion having granularity issues.
        const differenceRounded = Math.abs(feesToPay.toBig().sub(expectedFeesInBTC).round(decimalsToCheck+2).toNumber());
        expect(differenceRounded).toBeLessThan(maxDelta);
    });

    it("should getFeeRate", async () => {
        const feePercentage = await userInterBtcAPI.issue.getFeeRate();
        expect(feePercentage.toNumber()).toBe(0.0015);
    });

    it("should getRequestLimits", async () => {
        const requestLimits = await userInterBtcAPI.issue.getRequestLimits();
        const singleMaxIssuable = requestLimits.singleVaultMaxIssuable;
        const totalMaxIssuable = requestLimits.totalMaxIssuable;

        const issuableAmounts = await getIssuableAmounts(userInterBtcAPI);
        const singleIssueable = issuableAmounts.reduce(
            (prev, curr) => (prev > curr ? prev : curr),
            newMonetaryAmount(0, wrappedCurrency)
        );
        const totalIssuable = issuableAmounts.reduce((prev, curr) => prev.add(curr));

        try {
            expect(singleMaxIssuable.toBig().sub(singleIssueable.toBig()).abs().lte(1)).toBe(true);
        } catch(_) {
            throw Error(`${singleMaxIssuable.toHuman()} != ${singleIssueable.toHuman()}`);
        }

        try {
            expect(totalMaxIssuable.toBig().sub(totalIssuable.toBig()).abs().lte(1)).toBe(true);
        } catch(_) {
            throw Error(`${totalMaxIssuable.toHuman()} != ${totalIssuable.toHuman()}`);
        }
    });

    // This test should be kept at the end of the file as it will ban the vault used for issuing
    it("should cancel an issue request", async () => {
        for (const vault_2_id of vault_2_ids) {
            await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
                const initialIssuePeriod = await userInterBtcAPI.issue.getIssuePeriod();
                await sudo(userInterBtcAPI, async () => {
                    await submitExtrinsic(userInterBtcAPI, userInterBtcAPI.issue.setIssuePeriod(1));
                });
                try {
                    // request issue
                    const amount = newMonetaryAmount(0.0000121, wrappedCurrency, true);
                    const vaultCollateral = await currencyIdToMonetaryCurrency(api, vault_2_id.currencies.collateral);
                    const requestResults = await getIssueRequestsFromExtrinsicResult(
                        userInterBtcAPI,
                        await submitExtrinsic(
                            userInterBtcAPI,
                            await userInterBtcAPI.issue.request(
                                amount,
                                newAccountId(api, vault_2.address),
                                vaultCollateral
                            )
                        )
                    );
                    expect(requestResults).toHaveLength(1);
                    const requestResult = requestResults[0];

                    await submitExtrinsic(userInterBtcAPI, userInterBtcAPI.issue.cancel(requestResult.id));

                    const issueRequest = await userInterBtcAPI.issue.getRequestById(requestResult.id);
                    expect(issueRequest.status).toBe(IssueStatus.Cancelled);

                    // Set issue period back to its initial value to minimize side effects.
                    await sudo(userInterBtcAPI, async () => {
                        await submitExtrinsic(
                            userInterBtcAPI,
                            userInterBtcAPI.issue.setIssuePeriod(initialIssuePeriod)
                        );
                    });
                } catch (e) {
                    // Set issue period back to its initial value to minimize side effects.
                    await sudo(userInterBtcAPI, async () => {
                        await submitExtrinsic(
                            userInterBtcAPI,
                            userInterBtcAPI.issue.setIssuePeriod(initialIssuePeriod)
                        );
                    });
                    throw e;
                }
            });
        }
    });
});
