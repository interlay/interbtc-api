import { MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { InterbtcPrimitivesVaultId } from "@polkadot/types/lookup";
import Big from "big.js";

import { AssetRegistryAPI, LoansAPI, OracleAPI, SystemAPI } from "../parachain";
import { decodeFixedPointType, currencyIdToMonetaryCurrency, newMonetaryAmount } from "../utils";
import { CollateralCurrencyExt, WrappedCurrency } from "./currency";

export enum VaultStatusExt {
    Active,
    Inactive,
    Liquidated,
}

export class VaultExt {
    backingCollateral: MonetaryAmount<CollateralCurrencyExt>;
    id: InterbtcPrimitivesVaultId;
    status: VaultStatusExt;
    bannedUntil: number | undefined;
    toBeIssuedTokens: MonetaryAmount<WrappedCurrency>;
    issuedTokens: MonetaryAmount<WrappedCurrency>;
    toBeRedeemedTokens: MonetaryAmount<WrappedCurrency>;
    toBeReplacedTokens: MonetaryAmount<WrappedCurrency>;
    replaceCollateral: MonetaryAmount<CollateralCurrencyExt>;
    liquidatedCollateral: MonetaryAmount<CollateralCurrencyExt>;
    secureCollateralThreshold: Big;

    constructor(
        private api: ApiPromise,
        private oracleAPI: OracleAPI,
        private systemAPI: SystemAPI,
        private assetRegistryAPI: AssetRegistryAPI,
        private loansAPI: LoansAPI,
        backingCollateral: MonetaryAmount<CollateralCurrencyExt>,
        id: InterbtcPrimitivesVaultId,
        status: VaultStatusExt,
        bannedUntil: number | undefined,
        toBeIssuedTokens: MonetaryAmount<WrappedCurrency>,
        issuedTokens: MonetaryAmount<WrappedCurrency>,
        toBeRedeemedTokens: MonetaryAmount<WrappedCurrency>,
        toBeReplacedTokens: MonetaryAmount<WrappedCurrency>,
        replaceCollateral: MonetaryAmount<CollateralCurrencyExt>,
        liquidatedCollateral: MonetaryAmount<CollateralCurrencyExt>,
        secureCollateralThreshold: Big
    ) {
        this.backingCollateral = backingCollateral;
        this.id = id;
        this.status = status;
        this.bannedUntil = bannedUntil;
        this.toBeIssuedTokens = toBeIssuedTokens;
        this.issuedTokens = issuedTokens;
        this.toBeRedeemedTokens = toBeRedeemedTokens;
        this.toBeReplacedTokens = toBeReplacedTokens;
        this.replaceCollateral = replaceCollateral;
        this.liquidatedCollateral = liquidatedCollateral;
        this.secureCollateralThreshold = secureCollateralThreshold;
    }

    getRedeemableTokens(): MonetaryAmount<WrappedCurrency> {
        return this.issuedTokens.sub(this.toBeRedeemedTokens);
    }

    async getIssuableTokens(): Promise<MonetaryAmount<WrappedCurrency>> {
        const balance = await this.api.rpc.vaultRegistry.getIssueableTokensFromVault({
            account_id: this.id.accountId,
            currencies: this.id.currencies,
        });
        const wrapped = await currencyIdToMonetaryCurrency(this.assetRegistryAPI, this.loansAPI, this.id.currencies.wrapped);
        return newMonetaryAmount(balance.amount.toString(), wrapped);
    }

    async isBanned(): Promise<boolean> {
        const currentBlockNumber = await this.systemAPI.getCurrentActiveBlockNumber();
        if (!this.bannedUntil) {
            return false;
        }
        return this.bannedUntil >= currentBlockNumber;
    }

    getBackedTokens(): MonetaryAmount<WrappedCurrency> {
        return this.issuedTokens.add(this.toBeIssuedTokens);
    }

    async getFreeCollateral(): Promise<MonetaryAmount<CollateralCurrencyExt>> {
        const usedCollateral = await this.getUsedCollateral();
        const totalCollateral = await this.computeBackingCollateral();
        return totalCollateral.sub(usedCollateral);
    }

    async getUsedCollateral(): Promise<MonetaryAmount<CollateralCurrencyExt>> {
        const backedTokens = this.getBackedTokens();
        const backedTokensInCollateral = await this.oracleAPI.convertWrappedToCurrency(
            // Force type-assert here as the oracle API only uses wrapped Bitcoin
            backedTokens,
            await currencyIdToMonetaryCurrency(this.assetRegistryAPI, this.loansAPI, this.id.currencies.collateral)
        );
        const secureCollateralThreshold = this.getSecureCollateralThreshold();
        const usedCollateral = backedTokensInCollateral.mul(secureCollateralThreshold);
        const totalCollateral = await this.computeBackingCollateral();
        return totalCollateral.min(usedCollateral);
    }

    getSecureCollateralThreshold(): Big {
        return this.secureCollateralThreshold;
    }

    // TODO: The functions below are duplicated from other APIs. Remove them after APIs
    // are refactored to the builder pattern
    async computeBackingCollateral(nonce?: number): Promise<MonetaryAmount<CollateralCurrencyExt>> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce();
        }
        const rawBackingCollateral = await this.api.query.vaultStaking.totalCurrentStake(nonce, this.id);
        const collateralCurrency = await currencyIdToMonetaryCurrency(
            this.assetRegistryAPI,
            this.loansAPI,
            this.id.currencies.collateral
        );
        return newMonetaryAmount(decodeFixedPointType(rawBackingCollateral), collateralCurrency);
    }

    async getStakingPoolNonce(): Promise<number> {
        const rawNonce = await this.api.query.vaultStaking.nonce(this.id);
        return rawNonce.toNumber();
    }
}

export interface SystemVaultExt {
    toBeIssuedTokens: MonetaryAmount<WrappedCurrency>;
    issuedTokens: MonetaryAmount<WrappedCurrency>;
    toBeRedeemedTokens: MonetaryAmount<WrappedCurrency>;
    collateral: MonetaryAmount<CollateralCurrencyExt>;
    currencyPair: {
        collateralCurrency: CollateralCurrencyExt;
        wrappedCurrency: WrappedCurrency;
    };
}
