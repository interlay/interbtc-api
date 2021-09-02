import { AccountId, Hash, EventRecord } from "@polkadot/types/interfaces";
import { ApiTypes, AugmentedEvent } from "@polkadot/api/types";
import type { AnyTuple } from "@polkadot/types/types";
import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bitcoin, BTCAmount, BTCUnit, Currency, InterBTC, MonetaryAmount } from "@interlay/monetary-js";

import { newAccountId } from "../utils";
import { getBitcoinNetwork } from "../interbtc-api";
import { DefaultElectrsAPI, ElectrsAPI } from "../external/electrs";
import { DefaultIssueAPI } from "../parachain/issue";
import { DefaultTokensAPI } from "../parachain/tokens";
import { BitcoinCoreClient } from "./bitcoin-core-client";
import { stripHexPrefix } from "../utils/encoding";
import { BTCRelayAPI, DefaultBTCRelayAPI, DefaultRedeemAPI } from "../parachain";
import { CollateralUnit, Issue, IssueStatus, Redeem, RedeemStatus } from "../types";
import { BitcoinNetwork } from "../types/bitcoinTypes";
import { REGTEST_ESPLORA_BASE_PATH, waitForBlockFinalization } from "..";

export const SLEEP_TIME_MS = 1000;

export interface IssueResult<C extends CollateralUnit> {
    request: Issue;
    initialDotBalance: MonetaryAmount<Currency<C>, C>;
    finalDotBalance: MonetaryAmount<Currency<C>, C>;
    initialInterBtcBalance: MonetaryAmount<Bitcoin, BTCUnit>;
    finalInterBtcBalance: MonetaryAmount<Bitcoin, BTCUnit>;
}

export enum ExecuteRedeem {
    False,
    Manually,
    Auto,
}

/**
 * @param events The EventRecord array returned after sending a transaction
 * @param methodToCheck The name of the event method whose existence to check
 * @returns The id associated with the transaction. If the EventRecord array does not
 * contain required events, the function throws an error.
 */
export function getRequestIdsFromEvents(
    events: EventRecord[],
    eventToFind: AugmentedEvent<ApiTypes, AnyTuple>,
    api: ApiPromise
): Hash[] {
    const ids = new Array<Hash>();
    for (const { event } of events) {
        if (eventToFind.is(event)) {
            // the redeem id has type H256 and is the first item of the event data array
            const id = api.createType("Hash", event.data[0]);
            ids.push(id);
        }
    }

    if (ids.length > 0) return ids;
    throw new Error("Transaction failed");
}

/**
 * Given a list of vaults with availabilities (e.g. collateral for issue, tokens
 * for redeem) and an amount to allocate, selects one or more vaults to fulfil
 * the request.
 * If the amount cannot be allocated by a single vault, greedily selects the vault
 * with highest available amount and tries again for the remainder. If at leaast
 * one vault can fulfil a request alone, a random one among them is selected.
 **/
export function allocateAmountsToVaults(
    vaultsWithAvailableAmounts: Map<AccountId, BTCAmount>,
    amountToAllocate: BTCAmount
): Map<AccountId, BTCAmount> {
    const maxReservationPercent = 95; // don't reserve more than 95% of a vault's collateral
    const allocations = new Map<AccountId, BTCAmount>();
    // iterable array in ascending order of issuing capacity:
    const vaultsArray = [...vaultsWithAvailableAmounts.entries()]
        .reverse()
        .map((entry) => [entry[0], entry[1].div(100).mul(maxReservationPercent)] as [AccountId, BTCAmount]);
    while (amountToAllocate.gt(BTCAmount.zero)) {
        // find first vault that can fulfil request (or undefined if none)
        const firstSuitable = vaultsArray.findIndex(([_, available]) => available.gte(amountToAllocate));
        let vault, amount;
        if (firstSuitable !== -1) {
            // at least one vault can fulfil in full
            // select random vault able to fulfil request
            const range = vaultsArray.length - firstSuitable;
            const idx = Math.floor(Math.random() * range) + firstSuitable;
            vault = vaultsArray[idx][0];
            amount = amountToAllocate;
        } else {
            // else allocate greedily
            if (vaultsArray.length === 0) throw new Error("Insufficient capacity to fulfil request");
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const largestVault = vaultsArray.pop()!; // length >= 1, so never undefined
            [vault, amount] = largestVault;
        }
        allocations.set(vault, amount);
        amountToAllocate = amountToAllocate.sub(amount);
    }
    return allocations;
}

export async function issueSingle<C extends CollateralUnit>(
    api: ApiPromise,
    electrsAPI: ElectrsAPI,
    bitcoinCoreClient: BitcoinCoreClient,
    issuingAccount: KeyringPair,
    amount: BTCAmount,
    collateralCurrency: Currency<C>,
    vaultAddress?: string,
    autoExecute = true,
    triggerRefund = false,
    network: BitcoinNetwork = "regtest",
    atomic = true
): Promise<IssueResult<C>> {
    try {
        const bitcoinjsNetwork = getBitcoinNetwork(network);
        const issueAPI = new DefaultIssueAPI(api, bitcoinjsNetwork, new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH));
        const btcRelayAPI = new DefaultBTCRelayAPI(api, electrsAPI);
        const tokensAPI = new DefaultTokensAPI(api);

        const vaultId = vaultAddress !== undefined ? newAccountId(api, vaultAddress) : vaultAddress;
        issueAPI.setAccount(issuingAccount);
        const requesterAccountId = api.createType("AccountId", issuingAccount.address);
        const initialBalanceDOT = await tokensAPI.balance(collateralCurrency, requesterAccountId);
        const initialBalanceInterBTC = await tokensAPI.balance(InterBTC, requesterAccountId);
        const blocksToMine = 3;

        const rawRequestResult = await issueAPI.request(amount, vaultId, atomic);
        if (rawRequestResult.length !== 1) {
            throw new Error("More than one issue request created");
        }
        const issueRequest = rawRequestResult[0];

        let amountAsBtc = issueRequest.amountInterBTC.add(issueRequest.bridgeFee);
        if (triggerRefund) {
            // Send 1 more Btc than needed
            amountAsBtc = amountAsBtc.add(BTCAmount.from.BTC(1));
        } else if (autoExecute === false) {
            // Send 1 less Satoshi than requested
            // to trigger the user failsafe and disable auto-execution.
            const oneSatoshi = BTCAmount.from.Satoshi(1);
            amountAsBtc = amountAsBtc.sub(oneSatoshi);
        }

        // send btc tx
        const vaultBtcAddress = issueRequest.vaultBTCAddress;
        if (vaultBtcAddress === undefined) {
            throw new Error("Undefined vault address returned from RequestIssue");
        }

        const txData = await bitcoinCoreClient.sendBtcTxAndMine(vaultBtcAddress, amountAsBtc, blocksToMine);

        if (autoExecute === false) {
            console.log("Manually executing, waiting for relay to catchup");
            await waitForBlockFinalization(bitcoinCoreClient, btcRelayAPI);
            // execute issue, assuming the selected vault has the `--no-issue-execution` flag enabled
            await issueAPI.execute(issueRequest.id, txData.txid);
        } else {
            console.log("Auto-executing, waiting for vault to submit proof");
            // wait for vault to execute issue
            while ((await issueAPI.getRequestById(issueRequest.id)).status !== IssueStatus.Completed) {
                await sleep(SLEEP_TIME_MS);
            }
        }

        const [finalBalanceInterBTC, finalBalanceDOT] = await Promise.all([
            tokensAPI.balance(InterBTC, requesterAccountId),
            tokensAPI.balance(collateralCurrency, requesterAccountId),
        ]);
        return {
            request: issueRequest,
            initialDotBalance: initialBalanceDOT,
            finalDotBalance: finalBalanceDOT,
            initialInterBtcBalance: initialBalanceInterBTC,
            finalInterBtcBalance: finalBalanceInterBTC,
        };
    } catch (e) {
        // IssueCompleted errors occur when multiple vaults attempt to execute the same request
        return Promise.reject(new Error(`Issuing failed: ${e}`));
    }
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function redeem(
    api: ApiPromise,
    electrsAPI: ElectrsAPI,
    bitcoinCoreClient: BitcoinCoreClient,
    btcRelayAPI: BTCRelayAPI,
    redeemingAccount: KeyringPair,
    amount: BTCAmount,
    vaultAddress?: string,
    autoExecute = ExecuteRedeem.Auto,
    network: BitcoinNetwork = "regtest",
    atomic = true,
    timeout = 5 * 60 * 1000
): Promise<Redeem> {
    const bitcoinjsNetwork = getBitcoinNetwork(network);
    const redeemAPI = new DefaultRedeemAPI(api, bitcoinjsNetwork, electrsAPI);
    redeemAPI.setAccount(redeemingAccount);

    const btcAddress = "bcrt1qujs29q4gkyn2uj6y570xl460p4y43ruayxu8ry";
    const [redeemRequest] = await redeemAPI.request(
        amount,
        btcAddress,
        vaultAddress ? newAccountId(api, vaultAddress) : undefined,
        atomic,
        0 // retries
    );

    switch (autoExecute) {
        case ExecuteRedeem.Manually: {
            const opreturnData = stripHexPrefix(redeemRequest.id.toString());
            const btcTxId = await electrsAPI.waitForOpreturn(opreturnData, timeout, 5000).catch((_) => {
                throw new Error("Redeem request was not executed, timeout expired");
            });
            // Even if the tx was found, the block needs to be relayed to the parachain before `execute` can be called.
            await waitForBlockFinalization(bitcoinCoreClient, btcRelayAPI);

            // manually execute issue
            await redeemAPI.execute(redeemRequest.id.toString(), btcTxId);
            break;
        }
        case ExecuteRedeem.Auto: {
            // wait for vault to execute issue
            while ((await redeemAPI.getRequestById(redeemRequest.id)).status !== RedeemStatus.Completed) {
                await sleep(SLEEP_TIME_MS);
            }
            break;
        }
    }
    return redeemRequest;
}

export async function issueAndRedeem<C extends CollateralUnit>(
    api: ApiPromise,
    electrsAPI: ElectrsAPI,
    btcRelayAPI: BTCRelayAPI,
    bitcoinCoreClient: BitcoinCoreClient,
    account: KeyringPair,
    collateralCurrency: Currency<C>,
    vaultAddress?: string,
    issueAmount = BTCAmount.from.BTC(0.1),
    redeemAmount = BTCAmount.from.BTC(0.009),
    autoExecuteIssue = true,
    autoExecuteRedeem = ExecuteRedeem.Auto,
    triggerRefund = false,
    network: BitcoinNetwork = "regtest",
    atomic = true
): Promise<[Issue, Redeem]> {
    const issueResult = await issueSingle(
        api,
        electrsAPI,
        bitcoinCoreClient,
        account,
        issueAmount,
        collateralCurrency,
        vaultAddress,
        autoExecuteIssue,
        triggerRefund,
        network,
        atomic
    );

    const redeemRequest = await redeem(
        api,
        electrsAPI,
        bitcoinCoreClient,
        btcRelayAPI,
        account,
        redeemAmount,
        issueResult.request.vaultDOTAddress,
        autoExecuteRedeem,
        network,
        atomic
    );
    return [issueResult.request, redeemRequest];
}
