import { BitcoinUnit, Currency, MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { InterbtcPrimitivesVaultId } from "@polkadot/types/lookup";
import Big from "big.js";

import { UnsignedFixedPoint } from "../interfaces";
import { DefaultOracleAPI, DefaultSystemAPI } from "../parachain";
import { decodeFixedPointType, newMonetaryAmount } from "../utils";
import { CollateralUnit, currencyIdToMonetaryCurrency } from "./currency";

export interface WalletExt {
    // network encoded btc addresses
    publicKey: string;
    addresses: Array<string>;
}

export enum VaultStatusExt {
    Active,
    Inactive,
    Liquidated,
    CommittedTheft,
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
        liquidatedCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>,
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
        const oracleAPI = new DefaultOracleAPI(this.api, currencyIdToMonetaryCurrency(this.id.currencies.wrapped));
        const backableWrappedTokens = await oracleAPI.convertCollateralToWrapped(freeCollateral);
        // Force type-assert here as the oracle API only uses wrapped Bitcoin
        return backableWrappedTokens.div(secureCollateralThreshold) as unknown as MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    }

    async isBanned(): Promise<boolean> {
        const systemAPI = new DefaultSystemAPI(this.api);
        const currentBlockNumber = await systemAPI.getCurrentActiveBlockNumber();
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
        const oracleAPI = new DefaultOracleAPI(this.api, currencyIdToMonetaryCurrency(this.id.currencies.wrapped));
        const backedTokens = this.getBackedTokens();
        const backedTokensInCollateral = await oracleAPI.convertWrappedToCollateral(
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
        const head = await this.api.rpc.chain.getFinalizedHead();
        const threshold = await this.api.query.vaultRegistry.secureCollateralThreshold.at(head, this.id.currencies);
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async computeBackingCollateral(
        nonce?: number
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce();
        }
        const rawBackingCollateral = await this.api.query.staking.totalCurrentStake(nonce, this.id);
        const collateralCurrency = currencyIdToMonetaryCurrency(this.id.currencies.collateral);
        return newMonetaryAmount(
            decodeFixedPointType(rawBackingCollateral),
            collateralCurrency as Currency<CollateralUnit>
        );
    }

    async getStakingPoolNonce(): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const rawNonce = await this.api.query.staking.nonce.at(head, this.id);
        return rawNonce.toNumber();
    }
}

export interface SystemVaultExt<WrappedUnit extends BitcoinUnit> {
    toBeIssuedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    issuedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    toBeRedeemedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
}
