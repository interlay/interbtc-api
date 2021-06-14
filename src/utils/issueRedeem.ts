import { AccountId, Hash } from "@polkadot/types/interfaces";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { ApiTypes, AugmentedEvent } from "@polkadot/api/types";
import type { AnyTuple } from "@polkadot/types/types";
import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import Big from "big.js";
import BN from "bn.js";

import { satToBTC, getBitcoinNetwork, newAccountId } from "..";
import { ElectrsAPI } from "../external/electrs";
import { DefaultCollateralAPI } from "../parachain/collateral";
import { IssueRequestResult, DefaultIssueAPI } from "../parachain/issue";
import { DefaultTreasuryAPI } from "../parachain/treasury";
import { BitcoinCoreClient } from "./bitcoin-core-client";
import { stripHexPrefix } from "..";
import { DefaultRedeemAPI } from "../parachain";
import { RequestResult } from "../parachain/redeem";

export interface IssueResult {
    request: IssueRequestResult;
    initialDotBalance: Big;
    finalDotBalance: Big;
    initialPolkaBtcBalance: Big;
    finalPolkaBtcBalance: Big;
}

export enum ExecuteRedeem {
    False,
    Manually, 
    Auto
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
    vaultsWithAvailableAmounts: Map<AccountId, Big>,
    amountToAllocate: Big
): Map<AccountId, Big> {
    const maxReservationPercent = 95; // don't reserve more than 95% of a vault's collateral
    amountToAllocate = new Big(amountToAllocate); //will mutate
    const allocations = new Map<AccountId, Big>();
    // iterable array in ascending order of issuing capacity:
    const vaultsArray = [...vaultsWithAvailableAmounts.entries()]
        .reverse()
        .map((entry) => [entry[0], entry[1].div(100).mul(maxReservationPercent)] as [AccountId, Big]);
    while (amountToAllocate.gt(0)) {
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
        allocations.set(vault, new Big(amount));
        amountToAllocate = amountToAllocate.minus(amount);
    }

    return allocations;
}

export async function issueSingle(
    api: ApiPromise,
    electrsAPI: ElectrsAPI,
    bitcoinCoreClient: BitcoinCoreClient,
    issuingAccount: KeyringPair,
    amount: Big,
    vaultAddress?: string,
    autoExecute = true,
    triggerRefund = false,
    network = "regtest",
    atomic = true
): Promise<IssueResult> {
    try {
        const treasuryAPI = new DefaultTreasuryAPI(api);
        const collateralAPI = new DefaultCollateralAPI(api);
        const bitcoinjsNetwork = getBitcoinNetwork(network);
        const issueAPI = new DefaultIssueAPI(api, bitcoinjsNetwork, electrsAPI);

        const vaultId = vaultAddress !== undefined ? newAccountId(api, vaultAddress) : vaultAddress;

        issueAPI.setAccount(issuingAccount);
        const requesterAccountId = api.createType("AccountId", issuingAccount.address);
        const initialBalanceDOT = await collateralAPI.balance(requesterAccountId);
        const initialBalancePolkaBTC = await treasuryAPI.balance(requesterAccountId);
        const blocksToMine = 3;

        // request issue
        const rawRequestResult = await issueAPI.request(amount, vaultId, atomic);
        if (rawRequestResult.length !== 1) {
            throw new Error("More than one issue request created");
        }
        const requestResult = rawRequestResult[0];
        const issueRequest = await issueAPI.getRequestById(requestResult.id);

        let amountAsBtc = satToBTC(issueRequest.amount.add(issueRequest.fee));

        if (triggerRefund) {
            // Send 1 more Btc than needed
            amountAsBtc = amountAsBtc.add(1);
        } else if (autoExecute === false) {
            // Send 1 less Satoshi than requested
            // to trigger the user failsafe and disable auto-execution.
            const oneSatoshi = satToBTC(new BN(1));
            amountAsBtc = amountAsBtc.sub(oneSatoshi);
        }

        // send btc tx
        const vaultBtcAddress = requestResult.issueRequest.btc_address;
        if (vaultBtcAddress === undefined) {
            throw new Error("Undefined vault address returned from RequestIssue");
        }

        const txData = await bitcoinCoreClient.sendBtcTxAndMine(vaultBtcAddress, amountAsBtc, blocksToMine);

        if (autoExecute === false) {
            // manually execute issue
            await issueAPI.execute(requestResult.id.toString(), txData.txid);
        } else {
            // wait for vault to execute issue
            while (!(await issueAPI.getRequestById(requestResult.id)).status.isCompleted) {
                await sleep(1000);
            }
        }

        const [finalBalancePolkaBTC, finalBalanceDOT] = await Promise.all([
            treasuryAPI.balance(requesterAccountId),
            collateralAPI.balance(requesterAccountId)
        ]);
        return {
            request: requestResult,
            initialDotBalance: initialBalanceDOT,
            finalDotBalance: finalBalanceDOT,
            initialPolkaBtcBalance: initialBalancePolkaBTC,
            finalPolkaBtcBalance: finalBalancePolkaBTC,
        };
    } catch (e) {
        // IssueCompleted errors occur when multiple vaults attempt to execute the same request
        console.log(e);
        throw new Error(`Issuing failed: ${e.toString()}`);
    }
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function redeem(
    api: ApiPromise,
    electrsAPI: ElectrsAPI,
    redeemingAccount: KeyringPair,
    amount: Big,
    vaultAddress?: string,
    autoExecute = ExecuteRedeem.Auto,
    network = "regtest",
    atomic = true,
    timeout = 5 * 60 * 1000
): Promise<RequestResult> {
    const bitcoinjsNetwork = getBitcoinNetwork(network);
    const redeemAPI = new DefaultRedeemAPI(api, bitcoinjsNetwork, electrsAPI);
    redeemAPI.setAccount(redeemingAccount);

    const btcAddress = "bcrt1qujs29q4gkyn2uj6y570xl460p4y43ruayxu8ry";
    const [redeemRequest] = await redeemAPI.request(
        amount,
        btcAddress,
        vaultAddress ? newAccountId(api, vaultAddress) : undefined,
        atomic,
        0, // retries
    );

    switch (autoExecute) {
    case ExecuteRedeem.Manually: {
        const opreturnData = stripHexPrefix(redeemRequest.id.toString());
        const btcTxId = await electrsAPI.waitForOpreturn(opreturnData, timeout, 5000)
            .catch(_ => { throw new Error("Redeem request was not executed, timeout expired"); });
        // manually execute issue
        await redeemAPI.execute(redeemRequest.id.toString(), btcTxId);
        break;
    }
    case ExecuteRedeem.Auto: {
        // wait for vault to execute issue
        while (!(await redeemAPI.getRequestById(redeemRequest.id)).status.isCompleted) {
            await sleep(1000);
        }
        break;
    }
    }
    return redeemRequest;
}

export async function issueAndRedeem(
    api: ApiPromise,
    electrsAPI: ElectrsAPI,
    bitcoinCoreClient: BitcoinCoreClient,
    account: KeyringPair,
    vaultAddress?: string,
    issueAmount = new Big(0.1),
    redeemAmount = new Big(0.009),
    autoExecuteIssue = true,
    autoExecuteRedeem = ExecuteRedeem.Auto,
    triggerRefund = false,
    network = "regtest",
    atomic = true
): Promise<[IssueRequestResult, RequestResult]> {
    const issueResult = await issueSingle(
        api,
        electrsAPI,
        bitcoinCoreClient,
        account,
        issueAmount,
        vaultAddress,
        autoExecuteIssue,
        triggerRefund,
        network,
        atomic
    );

    const redeemRequest = await redeem(
        api,
        electrsAPI,
        account,
        redeemAmount,
        issueResult.request.issueRequest.vault.toString(),
        autoExecuteRedeem,
        network,
        atomic
    );
    return [issueResult.request, redeemRequest];
}
