import Big, { BigSource } from "big.js";
import BN from "bn.js";
import {
    Bitcoin,
    Currency,
    ExchangeRate,
    InterBtc,
    Interlay,
    KBtc,
    Kintsugi,
    Kusama,
    MonetaryAmount,
    Polkadot,
    VoteInterlay,
    VoteKintsugi,
} from "@interlay/monetary-js";
import { u32, u128 } from "@polkadot/types";
import { InterbtcPrimitivesOracleKey } from "@polkadot/types/lookup";
import {
    GovernanceCurrency,
    CurrencyExt,
    ForeignAsset,
    CollateralCurrencyExt,
    LendToken,
    CurrencyIdentifier,
    StandardLpToken,
    StableLpToken,
    StandardPooledTokenIdentifier,
} from "../types/currency";
import { decodeBytesAsString, newForeignAssetId, newCurrencyId, storageKeyToNthInner } from "./encoding";
import { ApiPromise } from "@polkadot/api";
import { InterbtcPrimitivesCurrencyId, InterbtcPrimitivesTokenSymbol } from "../interfaces";
import { DefaultAssetRegistryAPI } from "../parachain/asset-registry";
import { Option } from "@polkadot/types/codec";
import { DefaultLoansAPI } from "../parachain";
import { DefaultAMMAPI } from "../parachain/amm1";

// set maximum exponents
Big.PE = 21;
Big.NE = -12;

export const ATOMIC_UNIT = 0;

export function computeLazyDistribution(stake: Big, perToken: Big, tally: Big): Big {
    return stake.mul(perToken).sub(tally);
}

export function atomicToBaseAmount(atomicAmount: BigSource, currency: Currency): Big {
    return new Big(atomicAmount).div(new Big(10).pow(currency.decimals));
}

export function newMonetaryAmount<CurrencyT extends CurrencyExt>(
    amount: BigSource,
    currency: CurrencyT,
    base = false,
): MonetaryAmount<CurrencyT> {
    const finalAmount = base ? new Big(amount) : atomicToBaseAmount(amount, currency);
    return new MonetaryAmount<CurrencyT>(currency, finalAmount);
}

export function newCollateralBTCExchangeRate(
    rate: Big,
    counterCurrency: Currency,
    useBaseUnits = false,
): ExchangeRate<Bitcoin, Currency> {
    const [baseCurrencyUnit, counterCurrencyUnit] = useBaseUnits
        ? [Bitcoin.decimals, counterCurrency.decimals]
        : [ATOMIC_UNIT, ATOMIC_UNIT];
    return new ExchangeRate<Bitcoin, Currency>(Bitcoin, counterCurrency, rate, baseCurrencyUnit, counterCurrencyUnit);
}

export function createFeeEstimationOracleKey(api: ApiPromise): InterbtcPrimitivesOracleKey {
    return api.createType("InterbtcPrimitivesOracleKey", { FeeEstimation: null });
}

export function createExchangeRateOracleKey(
    api: ApiPromise,
    collateralCurrency: CurrencyExt,
): InterbtcPrimitivesOracleKey {
    const currencyId = newCurrencyId(api, collateralCurrency);
    return api.createType("InterbtcPrimitivesOracleKey", { ExchangeRate: currencyId });
}

export function toVoting(governanceCurrency: GovernanceCurrency): Currency {
    switch (governanceCurrency) {
        case Interlay:
            return VoteInterlay;
        case Kintsugi:
            return VoteKintsugi;
        default:
            throw new Error("Provided currency is not a governance currency");
    }
}

/**
 * Get all collateral currencies (tokens as well as foreign assets).
 *
 * Will return all collateral currencies for which the parachain has a system collateral ceiling value
 * greater than zero.
 * @param api ApiPromise instance to query the parachain
 * @returns An array of collateral currencies.
 */
export async function getCollateralCurrencies(api: ApiPromise): Promise<Array<CollateralCurrencyExt>> {
    const collatCeilEntries = await api.query.vaultRegistry.systemCollateralCeiling.entries();

    const isOptionGreaterThanZero = (value: Option<u128>) =>
        value.isNone ? false : value.unwrap().toBn().gt(new BN(0));

    const collateralCurrencyPrimitives = collatCeilEntries
        .filter(([_, ceiling]) => isOptionGreaterThanZero(ceiling))
        .map(([storageKey, _]) => storageKeyToNthInner(storageKey));

    return Promise.all(
        collateralCurrencyPrimitives.map((currencyPair) => currencyIdToMonetaryCurrency(api, currencyPair.collateral)),
    );
}

export function isForeignAsset(currencyExt: CurrencyExt): currencyExt is ForeignAsset {
    // disable rule, use of any is deliberate for run time check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (currencyExt as any).foreignAsset !== undefined;
}

export function isLendToken(currencyExt: CurrencyExt): currencyExt is LendToken {
    // disable rule, use of any is deliberate for run time check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (currencyExt as any).lendToken !== undefined;
}

export function isStandardLpToken(currencyExt: CurrencyExt): currencyExt is StandardLpToken {
    return (currencyExt as StandardLpToken).lpToken !== undefined;
}

export function isStableLpToken(currencyExt: CurrencyExt): currencyExt is StableLpToken {
    return (currencyExt as StableLpToken).stableLpToken !== undefined;
}

export function isCurrency(currencyExt: CurrencyExt): currencyExt is Currency {
    return (
        !isForeignAsset(currencyExt) &&
        !isLendToken(currencyExt) &&
        !isStandardLpToken(currencyExt) &&
        !isStableLpToken(currencyExt)
    );
}

export function isCurrencyEqual(currency: CurrencyExt, otherCurrency: CurrencyExt): boolean {
    if (isCurrency(currency) && isCurrency(otherCurrency)) {
        return currency.ticker === otherCurrency.ticker;
    } else if (isForeignAsset(currency) && isForeignAsset(otherCurrency)) {
        return currency.foreignAsset.id === otherCurrency.foreignAsset.id;
    } else if (isLendToken(currency) && isLendToken(otherCurrency)) {
        return currency.lendToken.id === otherCurrency.lendToken.id;
    } else if (isStandardLpToken(currency) && isStandardLpToken(otherCurrency)) {
        return (
            isCurrencyEqual(currency.lpToken.token0, otherCurrency.lpToken.token0) &&
            isCurrencyEqual(currency.lpToken.token1, otherCurrency.lpToken.token1)
        );
    } else if (isStableLpToken(currency) && isStableLpToken(otherCurrency)) {
        return currency.stableLpToken.poolId === otherCurrency.stableLpToken.poolId;
    }

    return false;
}

export function getCurrencyIdentifier(currency: CurrencyExt): CurrencyIdentifier {
    if (isForeignAsset(currency)) {
        return { foreignAsset: currency.foreignAsset.id };
    }
    if (isLendToken(currency)) {
        return { lendToken: currency.lendToken.id };
    }
    if (isStableLpToken(currency)) {
        return { stableLpToken: currency.stableLpToken.poolId };
    }
    if (isStandardLpToken(currency)) {
        const token0 = getCurrencyIdentifier(currency.lpToken.token0) as StandardPooledTokenIdentifier;
        const token1 = getCurrencyIdentifier(currency.lpToken.token1) as StandardPooledTokenIdentifier;
        return { lpToken: [token0, token1] };
    }

    return { token: currency.ticker };
}

export async function currencyIdToMonetaryCurrency(
    api: ApiPromise,
    currencyId: InterbtcPrimitivesCurrencyId,
): Promise<CurrencyExt> {
    if (currencyId.isToken) {
        return tokenSymbolToCurrency(currencyId.asToken);
    } else if (currencyId.isForeignAsset) {
        const foreignAssetId = currencyId.asForeignAsset;
        return getForeignAssetFromId(api, foreignAssetId);
    } else if (currencyId.isLendToken) {
        const underlyingCurrency = await getUnderlyingCurrencyFromLendTokenId(api, currencyId);
        return DefaultLoansAPI.getLendTokenFromUnderlyingCurrency(underlyingCurrency, currencyId);
    } else if (currencyId.isLpToken) {
        return getStandardLpTokenFromCurrencyId(api, currencyId);
    } else if (currencyId.isStableLpToken) {
        return getStableLpTokenFromCurrencyId(api, currencyId);
    }

    throw new Error(`No handling implemented for currencyId type of ${currencyId.type}`);
}

/**
 * A method that will only try to find a hard-coded currencies.
 * Only for use when we are certain the currency is not a foreign asset.
 * @param tokenSymbol the InterbtcPrimitivesTokenSymbol to look up
 */
export function tokenSymbolToCurrency(tokenSymbol: InterbtcPrimitivesTokenSymbol): Currency {
    if (tokenSymbol.isIbtc) {
        return InterBtc;
    } else if (tokenSymbol.isDot) {
        return Polkadot;
    } else if (tokenSymbol.isKsm) {
        return Kusama;
    } else if (tokenSymbol.isKbtc) {
        return KBtc;
    } else if (tokenSymbol.isKint) {
        return Kintsugi;
    } else if (tokenSymbol.isIntr) {
        return Interlay;
    }
    throw new Error(`No entry provided for token symbol of type '${tokenSymbol?.type}'`);
}

/**
 * Get foreign asset by its id.
 * @param id The id of the foreign asset.
 * @returns The foreign asset.
 */
export async function getForeignAssetFromId(api: ApiPromise, id: number | u32): Promise<ForeignAsset> {
    const u32Id = id instanceof u32 ? id : newForeignAssetId(api, id);
    const optionMetadata = await api.query.assetRegistry.metadata(u32Id);

    if (!optionMetadata.isSome) {
        return Promise.reject(new Error("Foreign asset not found"));
    }
    const currencyPart = DefaultAssetRegistryAPI.metadataToCurrency(optionMetadata.unwrap());
    const coingeckoId = decodeBytesAsString(optionMetadata.unwrap().additional.coingeckoId);

    const numberId = id instanceof u32 ? id.toNumber() : id;

    return {
        foreignAsset: {
            id: numberId,
            coingeckoId,
        },
        ...currencyPart,
    };
}

/**
 * Get underlying currency of lend token id,
 *
 * @param lendTokenId Currency id of the lend token to get currency from
 * @returns Underlying CurrencyExt for provided lend token
 */
export async function getUnderlyingCurrencyFromLendTokenId(
    api: ApiPromise,
    lendTokenId: InterbtcPrimitivesCurrencyId,
): Promise<CurrencyExt> {
    const underlyingCurrencyId = await api.query.loans.underlyingAssetId(lendTokenId);

    const underlyingCurrency = await currencyIdToMonetaryCurrency(api, underlyingCurrencyId.unwrap());

    return underlyingCurrency;
}

/**
 * Get standard LP token currency lib type from currencyId primitive.
 *
 * @param currencyId Id of standard LP token.
 * @returns {StandardLpToken} Lib type currency object for standard LP token.
 */
export async function getStandardLpTokenFromCurrencyId(
    api: ApiPromise,
    currencyId: InterbtcPrimitivesCurrencyId,
): Promise<StandardLpToken> {
    if (!currencyId.isLpToken) {
        throw new Error("Provided currencyId is not standard LP token.");
    }
    const standardLpTokenCurrencyId = currencyId.asLpToken;
    const [token0, token1] = await Promise.all(
        standardLpTokenCurrencyId.map((currencyId) =>
            currencyIdToMonetaryCurrency(api, currencyId as InterbtcPrimitivesCurrencyId),
        ),
    );

    return {
        name: `LP ${token0.ticker}-${token1.ticker}`,
        ticker: `LP ${token0.ticker}-${token1.ticker}`,
        decimals: 18,
        lpToken: {
            token0,
            token1,
        },
    };
}

/**
 * Get stable LP token currency lib type from currencyId primitive.
 *
 * @param currencyId Id of stable LP token.
 * @returns {StableLpToken} Lib type currency object for stable LP token.
 */
export async function getStableLpTokenFromCurrencyId(
    api: ApiPromise,
    currencyId: InterbtcPrimitivesCurrencyId,
): Promise<StableLpToken> {
    if (!currencyId.isStableLpToken) {
        throw new Error("Provided currencyId is not stable LP token.");
    }

    const poolId = currencyId.asStableLpToken.toNumber();
    const poolData = await api.query.dexStable.pools(poolId);

    if (!poolData.isSome) {
        throw new Error(`getStableLpToken: Invalid pool data for currencyId ${currencyId.toString()}`);
    }

    const basePoolData = DefaultAMMAPI.getStablePoolInfo(poolData.unwrap());

    if (basePoolData === null) {
        throw new Error("Provided currencyId is not active LP token.");
    }

    return DefaultAMMAPI.getStableLpTokenFromPoolData(poolId, basePoolData);
}
