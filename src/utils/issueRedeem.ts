import { Hash, EventRecord } from "@polkadot/types/interfaces";
import { ApiTypes, AugmentedEvent } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import type { AnyTuple } from "@polkadot/types/types";
import { ApiPromise } from "@polkadot/api";
import { MonetaryAmount } from "@interlay/monetary-js";
import { InterbtcPrimitivesVaultId } from "@polkadot/types/lookup";

import { Issue, Redeem, WrappedCurrency } from "../types";
import { newMonetaryAmount } from "./currency";
import { InterBtcApi } from "../interbtc-api";

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
