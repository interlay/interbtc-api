import { AccountId } from "@polkadot/types/interfaces";
import { MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api/promise";

import {
    computeLazyDistribution,
    currencyIdToMonetaryCurrency,
    decodeFixedPointType,
    newMonetaryAmount,
    newVaultId,
} from "../utils";
import { InterbtcPrimitivesVaultId } from "../parachain";
import { TransactionAPI } from "../parachain/transaction";
import { WrappedCurrency, CollateralCurrencyExt, CurrencyExt } from "../types";
import { SignedFixedPoint } from "..";

export interface RewardsAPI {
    /**
     * @param currency The staked currency
     * @param vaultId The account ID of the staking pool nominee
     * @returns The current nonce of the staking pool
     */
    getStakingPoolNonce(currency: CurrencyExt, vaultId: AccountId): Promise<number>;
    /**
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns A Monetary.js amount object, representing the collateral in the given currency
     */
    computeCollateralInStakingPool(
        vaultId: InterbtcPrimitivesVaultId,
        nominatorId: AccountId
    ): Promise<MonetaryAmount<CollateralCurrencyExt>>;
    /**
     * @param vaultId VaultId object
     * @param nonce Staking pool nonce
     * @remarks Withdraw all rewards from the current account in the `vaultId` staking pool.
     */
    withdrawRewards(vaultId: InterbtcPrimitivesVaultId, nonce?: number): Promise<void>;
}

export class DefaultRewardsAPI implements RewardsAPI {
    constructor(
        public api: ApiPromise,
        private wrappedCurrency: WrappedCurrency,
        private transactionAPI: TransactionAPI
    ) {}

    async getStakingPoolNonce(collateralCurrency: CollateralCurrencyExt, vaultAccountId: AccountId): Promise<number> {
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        const rawNonce = await this.api.query.vaultStaking.nonce(vaultId);
        return rawNonce.toNumber();
    }

    async computeCollateralInStakingPool(
        vaultId: InterbtcPrimitivesVaultId,
        nominatorId: AccountId
    ): Promise<MonetaryAmount<CollateralCurrencyExt>> {
        const collateralCurrency = await currencyIdToMonetaryCurrency(this.api, vaultId.currencies.collateral);
        const nonce = await this.getStakingPoolNonce(collateralCurrency, vaultId.accountId);
        const [stake, slashPerToken, slashTally] = await this.api
            .queryMulti<[SignedFixedPoint, SignedFixedPoint, SignedFixedPoint]>([
                [this.api.query.vaultStaking.stake, [nonce, [vaultId, nominatorId]]],
                [this.api.query.vaultStaking.slashPerToken, [nonce, vaultId]],
                [this.api.query.vaultStaking.slashTally, [nonce, [vaultId, nominatorId]]],
            ])
            .then((data) => data.map((value) => decodeFixedPointType(value)));
        const toSlash = computeLazyDistribution(stake, slashPerToken, slashTally);
        return newMonetaryAmount(
            stake.sub(toSlash),
            await currencyIdToMonetaryCurrency(this.api, vaultId.currencies.collateral)
        );
    }

    async withdrawRewards(vaultId: InterbtcPrimitivesVaultId, nonce?: number): Promise<void> {
        const definedNonce = nonce
            ? nonce
            : await this.getStakingPoolNonce(
                  await currencyIdToMonetaryCurrency(this.api, vaultId.currencies.collateral),
                  vaultId.accountId
              );
        const tx = this.api.tx.fee.withdrawRewards(vaultId, definedNonce.toString());
        await this.transactionAPI.sendLogged(tx, this.api.events.vaultStaking.WithdrawReward, true);
    }
}
