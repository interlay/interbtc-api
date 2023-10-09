import { MonetaryAmount } from "@interlay/monetary-js";
import { InterbtcPrimitivesVaultId } from "@polkadot/types/lookup";

import { WrappedCurrency } from "../types";
import { newMonetaryAmount } from "./currency";

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
