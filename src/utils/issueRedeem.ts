import { Hash, EventRecord } from "@polkadot/types/interfaces";
import { ApiTypes, AugmentedEvent } from "@polkadot/api/types";
import type { AnyTuple } from "@polkadot/types/types";
import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bitcoin, BitcoinAmount, InterBtcAmount, MonetaryAmount } from "@interlay/monetary-js";
import { InterbtcPrimitivesVaultId } from "@polkadot/types/lookup";
import { ISubmittableResult } from "@polkadot/types/types";

import { newAccountId } from "../utils";
import { BitcoinCoreClient } from "./bitcoin-core-client";
import { stripHexPrefix } from "../utils/encoding";
import { Issue, IssueStatus, Redeem, RedeemStatus, WrappedCurrency } from "../types";
import { waitForBlockFinalization } from "./bitcoin";
import { atomicToBaseAmount, currencyIdToMonetaryCurrency, newMonetaryAmount } from "./currency";
import { InterBtcApi } from "../interbtc-api";
import { sleep, SLEEP_TIME_MS } from "../utils";

export interface IssueResult {
    request: Issue;
    initialWrappedTokenBalance: MonetaryAmount<WrappedCurrency>;
    finalWrappedTokenBalance: MonetaryAmount<WrappedCurrency>;
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

export const getIssueRequestsFromExtrinsicResult = async (
    interBtcApi: InterBtcApi,
    result: ISubmittableResult
): Promise<Array<Issue>> => {
    const ids = getRequestIdsFromEvents(result.events, interBtcApi.api.events.issue.RequestIssue, interBtcApi.api);
    const issueRequests = await interBtcApi.issue.getRequestsByIds(ids);
    return issueRequests;
};

export const getRedeemRequestsFromExtrinsicResult = async (
    interBtcApi: InterBtcApi,
    result: ISubmittableResult
): Promise<Array<Redeem>> => {
    const ids = getRequestIdsFromEvents(result.events, interBtcApi.api.events.redeem.RequestRedeem, interBtcApi.api);
    const redeemRequests = await interBtcApi.redeem.getRequestsByIds(ids);
    return redeemRequests;
};

/**
 * Given a list of vaults with availabilities (e.g. collateral for issue, tokens
 * for redeem) and an amount to allocate, selects one or more vaults to fulfil
 * the request.
 * If the amount cannot be allocated by a single vault, greedily selects the vault
 * with highest available amount and tries again for the remainder. If at leaast
 * one vault can fulfil a request alone, a random one among them is selected.
 **/
export function allocateAmountsToVaults(
    vaultsWithAvailableAmounts: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>,
    amountToAllocate: MonetaryAmount<WrappedCurrency>
): Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>> {
    const maxReservationPercent = 95; // don't reserve more than 95% of a vault's collateral
    const allocations = new Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>();
    // iterable array in ascending order of issuing capacity:
    const vaultsArray = [...vaultsWithAvailableAmounts.entries()]
        .reverse()
        .map(
            (entry) =>
                [entry[0], entry[1].div(100).mul(maxReservationPercent)] as [
                    InterbtcPrimitivesVaultId,
                    MonetaryAmount<WrappedCurrency>
                ]
        );
    while (amountToAllocate.gt(newMonetaryAmount(0, amountToAllocate.currency))) {
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

export async function issueSingle(
    interBtcApi: InterBtcApi,
    bitcoinCoreClient: BitcoinCoreClient,
    issuingAccount: KeyringPair,
    amount: MonetaryAmount<WrappedCurrency>,
    vaultId?: InterbtcPrimitivesVaultId,
    autoExecute = true,
    triggerRefund = false,
    atomic = true
): Promise<IssueResult> {
    const prevAccount = interBtcApi.account;
    interBtcApi.setAccount(issuingAccount);
    try {
        const requesterAccountId = newAccountId(interBtcApi.api, issuingAccount.address);
        const initialWrappedTokenBalance = (await interBtcApi.tokens.balance(amount.currency, requesterAccountId)).free;
        const blocksToMine = 3;

        const collateralCurrency = vaultId
            ? await currencyIdToMonetaryCurrency(interBtcApi.api, vaultId.currencies.collateral)
            : undefined;
        const { extrinsic, event } = await interBtcApi.issue.request(
            amount,
            vaultId?.accountId,
            collateralCurrency,
            atomic
        );

        const result = await interBtcApi.transaction.sendLogged(extrinsic, event);
        const issueRequests = await getIssueRequestsFromExtrinsicResult(interBtcApi, result);
        if (issueRequests.length !== 1) {
            throw new Error("More than one issue request created");
        }
        const issueRequest = issueRequests[0];

        let amountAsBtc = issueRequest.wrappedAmount.add(issueRequest.bridgeFee);
        if (triggerRefund) {
            // Send 1 more Btc than needed
            amountAsBtc = amountAsBtc.add(new BitcoinAmount(1));
        } else if (autoExecute === false) {
            // Send 1 less Satoshi than requested
            // to trigger the user failsafe and disable auto-execution.
            const oneSatoshiInBtc = atomicToBaseAmount(1, Bitcoin);
            const oneSatoshi = new BitcoinAmount(oneSatoshiInBtc);
            amountAsBtc = amountAsBtc.sub(oneSatoshi);
        }

        // send btc tx
        const vaultBtcAddress = issueRequest.vaultWrappedAddress;
        if (vaultBtcAddress === undefined) {
            throw new Error("Undefined vault address returned from RequestIssue");
        }

        const txData = await bitcoinCoreClient.sendBtcTxAndMine(vaultBtcAddress, amountAsBtc, blocksToMine);

        if (autoExecute === false) {
            console.log("Manually executing, waiting for relay to catchup");
            await waitForBlockFinalization(bitcoinCoreClient, interBtcApi.btcRelay);
            console.log("Block successfully relayed");
            await interBtcApi.electrsAPI.waitForTxInclusion(txData.txid, SLEEP_TIME_MS * 10, SLEEP_TIME_MS);
            console.log("Transaction included in electrs");
            // execute issue, assuming the selected vault has the `--no-issue-execution` flag enabled
            const { extrinsic: executeExtrinsic, event: executeEvent } = await interBtcApi.issue.execute(
                issueRequest.id,
                txData.txid
            );
            await interBtcApi.transaction.sendLogged(executeExtrinsic, executeEvent);
        } else {
            console.log("Auto-executing, waiting for vault to submit proof");
            // wait for vault to execute issue
            while ((await interBtcApi.issue.getRequestById(issueRequest.id)).status !== IssueStatus.Completed) {
                await sleep(SLEEP_TIME_MS);
            }
        }

        const finalWrappedTokenBalance = (await interBtcApi.tokens.balance(amount.currency, requesterAccountId)).free;
        return {
            request: issueRequest,
            initialWrappedTokenBalance,
            finalWrappedTokenBalance,
        };
    } catch (e) {
        // IssueCompleted errors occur when multiple vaults attempt to execute the same request
        return Promise.reject(new Error(`Issuing failed: ${e}`));
    } finally {
        if (prevAccount) {
            interBtcApi.setAccount(prevAccount);
        }
    }
}

export async function redeem(
    interBtcApi: InterBtcApi,
    bitcoinCoreClient: BitcoinCoreClient,
    redeemingAccount: KeyringPair,
    amount: MonetaryAmount<WrappedCurrency>,
    vaultId?: InterbtcPrimitivesVaultId,
    autoExecute = ExecuteRedeem.Auto,
    atomic = true,
    timeout = 5 * 60 * 1000
): Promise<Redeem> {
    const prevAccount = interBtcApi.account;
    interBtcApi.setAccount(redeemingAccount);
    const btcAddress = "bcrt1qujs29q4gkyn2uj6y570xl460p4y43ruayxu8ry";
    const { extrinsic, event } = await interBtcApi.redeem.request(amount, btcAddress, vaultId, atomic);
    const result = await interBtcApi.transaction.sendLogged(extrinsic, event);
    const [redeemRequest] = await getRedeemRequestsFromExtrinsicResult(interBtcApi, result);

    switch (autoExecute) {
        case ExecuteRedeem.Manually: {
            const opreturnData = stripHexPrefix(redeemRequest.id.toString());
            const btcTxId = await interBtcApi.electrsAPI.waitForOpreturn(opreturnData, timeout, 5000).catch((_) => {
                throw new Error("Redeem request was not executed, timeout expired");
            });
            // Even if the tx was found, the block needs to be relayed to the parachain before `execute` can be called.
            await waitForBlockFinalization(bitcoinCoreClient, interBtcApi.btcRelay);

            // manually execute issue
            await interBtcApi.redeem.execute(redeemRequest.id.toString(), btcTxId);
            break;
        }
        case ExecuteRedeem.Auto: {
            // wait for vault to execute issue
            while ((await interBtcApi.redeem.getRequestById(redeemRequest.id)).status !== RedeemStatus.Completed) {
                await sleep(SLEEP_TIME_MS);
            }
            break;
        }
    }
    if (prevAccount) {
        interBtcApi.setAccount(prevAccount);
    }
    return redeemRequest;
}

export async function issueAndRedeem(
    InterBtcApi: InterBtcApi,
    bitcoinCoreClient: BitcoinCoreClient,
    account: KeyringPair,
    vaultId?: InterbtcPrimitivesVaultId,
    issueAmount: MonetaryAmount<WrappedCurrency> = new InterBtcAmount(0.1),
    redeemAmount: MonetaryAmount<WrappedCurrency> = new InterBtcAmount(0.009),
    autoExecuteIssue = true,
    autoExecuteRedeem = ExecuteRedeem.Auto,
    triggerRefund = false,
    atomic = true
): Promise<[Issue, Redeem]> {
    const issueResult = await issueSingle(
        InterBtcApi,
        bitcoinCoreClient,
        account,
        issueAmount,
        vaultId,
        autoExecuteIssue,
        triggerRefund,
        atomic
    );

    const redeemRequest = await redeem(
        InterBtcApi,
        bitcoinCoreClient,
        account,
        redeemAmount,
        issueResult.request.vaultId,
        autoExecuteRedeem,
        atomic
    );
    return [issueResult.request, redeemRequest];
}
