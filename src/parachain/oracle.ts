import { ApiPromise } from "@polkadot/api";
import { Option, Bool } from "@polkadot/types";
import { Moment } from "@polkadot/types/interfaces";
import Big from "big.js";
import { Bitcoin, ExchangeRate, MonetaryAmount } from "@interlay/monetary-js";
import { SecurityErrorCode, InterbtcPrimitivesOracleKey } from "@polkadot/types/lookup";

import {
    ATOMIC_UNIT,
    convertMoment,
    createExchangeRateOracleKey,
    createFeeEstimationOracleKey,
    decodeFixedPointType,
    encodeUnsignedFixedPoint,
    isCurrencyEqual,
    storageKeyToNthInner,
    unwrapRawExchangeRate,
} from "../utils";
import { UnsignedFixedPoint } from "../interfaces/default";
import { CollateralCurrencyExt, CurrencyExt, WrappedCurrency } from "../types/currency";
import { ExtrinsicData } from "../types";
import { currencyIdToMonetaryCurrency, isLendToken } from "../utils/currency";
import { newCurrencyId } from "../utils/encoding";

/**
 * @category BTC Bridge
 */
export interface OracleAPI {
    /**
     * @param currency The collateral currency as a `Monetary.js` object
     * @param wrappedCurrency The wrapped currency to use in the returned exchange rate type, defaults to `Bitcoin`
     * @returns The exchange rate between Bitcoin and the provided collateral currency
     */
    getExchangeRate(
        collateralCurrency: CurrencyExt,
        wrappedCurrency?: Bitcoin
    ): Promise<ExchangeRate<Bitcoin, CurrencyExt>>;
    /**
     * Obtains the current fees for BTC transactions, in satoshi/byte.
     * @returns Big value for the current inclusion fees.
     */
    getBitcoinFees(): Promise<Big>;
    /**
     * @returns Last exchange rate time
     */
    getValidUntil(counterCurrency: CurrencyExt): Promise<Date>;
    /**
     * @returns A map from the oracle's account id to its name
     */
    getSourcesById(): Promise<Map<string, string>>;
    /**
     * @returns Boolean value indicating whether the oracle is online
     */
    isOnline(): Promise<boolean>;
    /**
     * Create a transaction to set the exchange rate between Bitcoin and a collateral currency
     * @param exchangeRate The rate to set
     * @returns {ExtrinsicData} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    setExchangeRate(exchangeRate: ExchangeRate<Bitcoin, CurrencyExt>): ExtrinsicData;
    /**
     * Create a transaction to set the current fee estimate for BTC transactions
     * @param fees Estimated Satoshis per bytes to get a transaction included
     * @returns {ExtrinsicData} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    setBitcoinFees(fees: Big): ExtrinsicData;
    /**
     * @param amount The amount of wrapped tokens to convert
     * @param currency A `Monetary.js` object
     * @returns Converted value
     */
    convertWrappedToCurrency(
        amount: MonetaryAmount<WrappedCurrency>,
        currency: CurrencyExt
    ): Promise<MonetaryAmount<CurrencyExt>>;
    /**
     * @param amount The amount of collateral tokens to convert
     * @returns Converted value
     */
    convertCollateralToWrapped(amount: MonetaryAmount<CollateralCurrencyExt>): Promise<MonetaryAmount<WrappedCurrency>>;
    /**
     * @returns The period of time (in milliseconds) after an oracle's last submission
     * during which it is considered online
     */
    getOnlineTimeout(): Promise<number>;
    /**
     * @param key A key defining an exchange rate or a BTC network fee estimate
     * @returns Whether the oracle entr for the given key has been updated
     */
    getRawValuesUpdated(key: InterbtcPrimitivesOracleKey): Promise<boolean>;
}

export class DefaultOracleAPI implements OracleAPI {
    constructor(private api: ApiPromise, private wrappedCurrency: WrappedCurrency) {}

    async getExchangeRate(currency: CurrencyExt): Promise<ExchangeRate<Bitcoin, CurrencyExt>> {
        // KBTC / IBTC have an exchange rate of one
        if (isCurrencyEqual(currency, this.wrappedCurrency)) {
            return new ExchangeRate<WrappedCurrency, CurrencyExt>(currency, currency, new Big(1));
        }

        if (isLendToken(currency)) {
            const lendTokenId = newCurrencyId(this.api, currency);
            const underlyingCurrencyIdRaw = await this.api.query.loans.underlyingAssetId(lendTokenId);
            if (underlyingCurrencyIdRaw.isNone) {
                throw new Error(
                    `No underlying asset found for lend token with id ${lendTokenId.asLendToken.toString()}`
                );
            }
            const underlyingCurrencyId = underlyingCurrencyIdRaw.unwrap();

            const rawLendToUnderlying = await this.api.query.loans.exchangeRate(underlyingCurrencyId);

            // multiply this rate with lendtoken to get underlying amount
            const lendToUnderRate = decodeFixedPointType(rawLendToUnderlying);

            const underlyingCurrency = await currencyIdToMonetaryCurrency(this.api, underlyingCurrencyIdRaw.unwrap());
            const btcToUnderRate = (
                await this.convertWrappedToCurrency(new MonetaryAmount(Bitcoin, 1), underlyingCurrency)
            ).toBig();
            const btcToLendRate = btcToUnderRate.div(lendToUnderRate);

            // final rate is normalized (base unit vs base unit), construct accordingly
            return new ExchangeRate(this.wrappedCurrency, currency, btcToLendRate);
        }

        const oracleKey = createExchangeRateOracleKey(this.api, currency);

        const encodedRawRate = unwrapRawExchangeRate(await this.api.query.oracle.aggregate(oracleKey));
        if (encodedRawRate === undefined) {
            return Promise.reject(new Error(`No exchange rate for given currency: ${currency.ticker}`));
        }
        const decodedRawRate = decodeFixedPointType(encodedRawRate);
        return new ExchangeRate<Bitcoin, CurrencyExt>(
            this.wrappedCurrency,
            currency,
            decodedRawRate,
            ATOMIC_UNIT,
            ATOMIC_UNIT
        );
    }

    async convertWrappedToCurrency(
        amount: MonetaryAmount<WrappedCurrency>,
        currency: CurrencyExt
    ): Promise<MonetaryAmount<CurrencyExt>> {
        const rate = await this.getExchangeRate(currency);
        return rate.toCounter(amount);
    }

    async convertCollateralToWrapped(
        amount: MonetaryAmount<CollateralCurrencyExt>
    ): Promise<MonetaryAmount<WrappedCurrency>> {
        const rate = await this.getExchangeRate(amount.currency);
        return rate.toBase(amount);
    }

    async getOnlineTimeout(): Promise<number> {
        const moment = await this.api.query.oracle.maxDelay();
        return moment.toNumber();
    }

    setExchangeRate(exchangeRate: ExchangeRate<Bitcoin, CurrencyExt>): ExtrinsicData {
        const encodedExchangeRate = encodeUnsignedFixedPoint(this.api, exchangeRate.toBig([ATOMIC_UNIT, ATOMIC_UNIT]));
        const oracleKey = createExchangeRateOracleKey(this.api, exchangeRate.counter);
        const tx = this.api.tx.oracle.feedValues([[oracleKey, encodedExchangeRate]]);
        return { extrinsic: tx, event: this.api.events.oracle.FeedValues };
    }

    async getBitcoinFees(): Promise<Big> {
        const oracleKey = createFeeEstimationOracleKey(this.api);
        const fees = await this.api.query.oracle.aggregate(oracleKey);

        const parseFees = (fee: Option<UnsignedFixedPoint>): Big => {
            const inner = unwrapRawExchangeRate(fee);
            if (inner !== undefined) {
                return decodeFixedPointType(inner);
            }
            throw new Error("Bitcoin fee estimate not set");
        };

        return parseFees(fees);
    }

    setBitcoinFees(fees: Big): ExtrinsicData {
        if (!fees.round().eq(fees)) {
            throw new Error("tx fees must be an integer amount of satoshi");
        } else if (fees.lt(0)) {
            throw new Error("tx fees must be a positive amount of satoshi");
        }

        const oracleKey = createFeeEstimationOracleKey(this.api);
        const encodedFee = encodeUnsignedFixedPoint(this.api, fees);
        const tx = this.api.tx.oracle.feedValues([[oracleKey, encodedFee]]);
        return { extrinsic: tx, event: this.api.events.oracle.FeedValues };
    }

    async getSourcesById(): Promise<Map<string, string>> {
        const oracles = await this.api.query.oracle.authorizedOracles.entries();
        const nameMap = new Map<string, string>();
        oracles.forEach((oracle) => nameMap.set(storageKeyToNthInner(oracle[0]).toString(), oracle[1].toUtf8()));
        return nameMap;
    }

    async getValidUntil(counterCurrency: CurrencyExt): Promise<Date> {
        const oracleKey = createExchangeRateOracleKey(this.api, counterCurrency);
        const validUntil = await this.api.query.oracle.validUntil(oracleKey);
        return validUntil.isSome ? convertMoment(validUntil.value as Moment) : Promise.reject("No such oracle key");
    }

    async isOnline(): Promise<boolean> {
        const errors = await this.api.query.security.errors();
        return !this.hasOracleError(Array.from(errors));
    }

    async getRawValuesUpdated(key: InterbtcPrimitivesOracleKey): Promise<boolean> {
        const isSet = await this.api.query.oracle.rawValuesUpdated<Option<Bool>>(key);
        return isSet.unwrap().isTrue;
    }

    private hasOracleError(errors: SecurityErrorCode[]): boolean {
        for (const error of errors.values()) {
            if (error.isOracleOffline) {
                return true;
            }
        }
        return false;
    }
}
