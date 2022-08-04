import { BitcoinUnit, Currency, MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { InterbtcPrimitivesVaultId } from "@polkadot/types/lookup";
import Big from "big.js";

import { UnsignedFixedPoint } from "../interfaces";
import { OracleAPI, SystemAPI } from "../parachain";
import { decodeFixedPointType, newMonetaryAmount } from "../utils";
import { CollateralUnit, currencyIdToMonetaryCurrency } from "./currency";

export enum VaultStatusExt {
    Active,
    Inactive,
    Liquidated,
}

export class VaultExt<WrappedUnit extends BitcoinUnit> {
    backingCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    id: InterbtcPrimitivesVaultId;
    status: VaultStatusExt;
    bannedUntil: number | undefined;
    toBeIssuedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    issuedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    toBeRedeemedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    toBeReplacedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    replaceCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    liquidatedCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;

    constructor(
        private api: ApiPromise,
        private oracleAPI: OracleAPI,
        private systemAPI: SystemAPI,
        backingCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>,
        id: InterbtcPrimitivesVaultId,
        status: VaultStatusExt,
        bannedUntil: number | undefined,
        toBeIssuedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>,
        issuedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>,
        toBeRedeemedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>,
        toBeReplacedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>,
        replaceCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>,
        liquidatedCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>
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
    }

    getRedeemableTokens(): MonetaryAmount<Currency<WrappedUnit>, WrappedUnit> {
        return this.issuedTokens.sub(this.toBeRedeemedTokens);
    }

    async getIssuableTokens(): Promise<MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>> {
        const balance = await this.api.rpc.vaultRegistry.getIssueableTokensFromVault({
            account_id: this.id.accountId,
            currencies: this.id.currencies,
        });
        const wrapped = currencyIdToMonetaryCurrency(this.id.currencies.wrapped) as Currency<WrappedUnit>;
        return newMonetaryAmount(balance.amount.toString(), wrapped);
    }

    async isBanned(): Promise<boolean> {
        const currentBlockNumber = await this.systemAPI.getCurrentActiveBlockNumber();
        if (!this.bannedUntil) {
            return false;
        }
        return this.bannedUntil >= currentBlockNumber;
    }

    getBackedTokens(): MonetaryAmount<Currency<WrappedUnit>, WrappedUnit> {
        return this.issuedTokens.add(this.toBeIssuedTokens);
    }

    async getFreeCollateral(): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const usedCollateral = await this.getUsedCollateral();
        const totalCollateral = await this.computeBackingCollateral();
        return totalCollateral.sub(usedCollateral);
    }

    async getUsedCollateral(): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const backedTokens = this.getBackedTokens();
        const backedTokensInCollateral = await this.oracleAPI.convertWrappedToCurrency(
            // Force type-assert here as the oracle API only uses wrapped Bitcoin
            backedTokens as unknown as MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>,
            currencyIdToMonetaryCurrency(this.id.currencies.collateral) as Currency<CollateralUnit>
        );
        const secureCollateralThreshold = await this.getSecureCollateralThreshold();
        const usedCollateral = backedTokensInCollateral.mul(secureCollateralThreshold);
        const totalCollateral = await this.computeBackingCollateral();
        return totalCollateral.min(usedCollateral);
    }

    // TODO: The functions below are duplicated from other APIs. Remove them after APIs
    // are refactored to the builder pattern

    async getSecureCollateralThreshold(): Promise<Big> {
        const threshold = await this.api.query.vaultRegistry.secureCollateralThreshold(this.id.currencies);
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async computeBackingCollateral(nonce?: number): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce();
        }
        const rawBackingCollateral = await this.api.query.vaultStaking.totalCurrentStake(nonce, this.id);
        const collateralCurrency = currencyIdToMonetaryCurrency(this.id.currencies.collateral);
        return newMonetaryAmount(
            decodeFixedPointType(rawBackingCollateral),
            collateralCurrency as Currency<CollateralUnit>
        );
    }

    async getStakingPoolNonce(): Promise<number> {
        const rawNonce = await this.api.query.vaultStaking.nonce(this.id);
        return rawNonce.toNumber();
    }
}

export interface SystemVaultExt<WrappedUnit extends BitcoinUnit> {
    toBeIssuedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    issuedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    toBeRedeemedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    collateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    currencyPair: {
        collateralCurrency: Currency<CollateralUnit>;
        wrappedCurrency: Currency<WrappedUnit>;
    };
}
