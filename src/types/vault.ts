import { BitcoinUnit, Currency, MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { InterbtcPrimitivesVaultId, VaultRegistryVaultStatus } from "@polkadot/types/lookup";
import Big from "big.js";

import { UnsignedFixedPoint } from "../interfaces";
import { OracleAPI, SystemAPI } from "../parachain";
import { decodeFixedPointType, newMonetaryAmount } from "../utils";
import { CollateralUnit, currencyIdToMonetaryCurrency } from "./currency";

export interface WalletExt {
    // network encoded btc addresses
    addresses: Array<string>;
}

export enum VaultStatusExt {
    Active,
    Inactive,
    Liquidated,
    CommittedTheft,
}

export namespace VaultStatusExt {
    export function parseVaultStatus(status: VaultRegistryVaultStatus): VaultStatusExt {
        if (status.isActive) {
            return status.asActive.isTrue ? VaultStatusExt.Active : VaultStatusExt.Inactive;
        } else if (status.isLiquidated) {
            return VaultStatusExt.Liquidated;
        } else if (status.isCommittedTheft) {
            return VaultStatusExt.CommittedTheft;
        } else {
            throw new Error("Unknown vault status");
        }
    }
}

export class VaultExt<WrappedUnit extends BitcoinUnit> {
    wallet: WalletExt;
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
        wallet: WalletExt,
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
        this.wallet = wallet;
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
        const isBanned = await this.isBanned();
        if (isBanned) {
            return newMonetaryAmount(0, currencyIdToMonetaryCurrency(this.id.currencies.wrapped));
        }
        const freeCollateral = await this.getFreeCollateral();
        const secureCollateralThreshold = await this.getSecureCollateralThreshold();
        const backableWrappedTokens = await this.oracleAPI.convertCollateralToWrapped(
            freeCollateral,
            currencyIdToMonetaryCurrency(this.id.currencies.wrapped)
        );
        // Force type-assert here as the oracle API only uses wrapped Bitcoin
        return backableWrappedTokens.div(secureCollateralThreshold) as unknown as MonetaryAmount<
            Currency<WrappedUnit>,
            WrappedUnit
        >;
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
