import { ApiPromise } from "@polkadot/api";
import { Option, Bool } from "@polkadot/types";
import { Moment } from "@polkadot/types/interfaces";
import Big from "big.js";
import { Bitcoin, BitcoinUnit, Currency, ExchangeRate, MonetaryAmount } from "@interlay/monetary-js";
import { SecurityErrorCode, InterbtcPrimitivesOracleKey } from "@polkadot/types/lookup";

import {
    convertMoment,
    createExchangeRateOracleKey,
    createInclusionOracleKey,
    decodeFixedPointType,
    encodeUnsignedFixedPoint,
    sleep,
    SLEEP_TIME_MS,
    storageKeyToNthInner,
    unwrapRawExchangeRate,
} from "../utils";
import { UnsignedFixedPoint } from "../interfaces/default";
import { TransactionAPI } from "./transaction";
import { CurrencyUnit, WrappedCurrency } from "../types/currency";
import { FeeEstimationType } from "../types/oracleTypes";

export const DEFAULT_FEED_NAME = "DOT/BTC";
export const DEFAULT_INCLUSION_TIME: FeeEstimationType = "Fast";

/**
 * @category BTC Bridge
 */
export interface OracleAPI {
    /**
     * @param currency The collateral currency as a `Monetary.js` object
     * @param wrappedCurrency The wrapped currency to use in the returned exchange rate type, defaults to `Bitcoin`
     * @returns The exchange rate between Bitcoin and the provided collateral currency
     */
    getExchangeRate<C extends CurrencyUnit>(
        collateralCurrency: Currency<C>,
        wrappedCurrency?: Currency<BitcoinUnit>
    ): Promise<ExchangeRate<Currency<BitcoinUnit>, BitcoinUnit, Currency<C>, C>>;
    /**
     * Obtains the current fees for BTC transactions, in satoshi/byte.
     * @returns Big value for the current inclusion fees.
     */
    getBitcoinFees(): Promise<Big>;
    /**
     * @returns Last exchange rate time
     */
    getValidUntil<U extends CurrencyUnit>(counterCurrency: Currency<U>): Promise<Date>;
    /**
     * @returns A map from the oracle's account id to its name
     */
    getSourcesById(): Promise<Map<string, string>>;
    /**
     * @returns Boolean value indicating whether the oracle is online
     */
    isOnline(): Promise<boolean>;
    /**
     * Send a transaction to set the exchange rate between Bitcoin and a collateral currency
     * @param exchangeRate The rate to set
     */
    setExchangeRate<C extends CurrencyUnit>(
        exchangeRate: ExchangeRate<Bitcoin, BitcoinUnit, Currency<C>, C>
    ): Promise<void>;
    /**
     * Send a transaction to set the current fee estimate for BTC transactions
     * @param fees Estimated Satoshis per bytes to get a transaction included
     */
    setBitcoinFees(fees: Big): Promise<void>;
    /**
     * @param amount The amount of wrapped tokens to convert
     * @param currency A `Monetary.js` object
     * @returns Converted value
     */
    convertWrappedToCurrency<C extends CurrencyUnit>(
        amount: MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param amount The amount of collateral tokens to convert
     * @param collateralCurrency A `Monetary.js` object
     * @returns Converted value
     */
    convertCollateralToWrapped<C extends CurrencyUnit>(
        amount: MonetaryAmount<Currency<C>, C>,
        wrappedCurrency: Currency<BitcoinUnit>
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>;
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
    /**
     * @param type The fee estimate type whose update is awaited
     * @remark Awaits an oracle update to the BTC inclusion fee
     */
    waitForFeeEstimateUpdate(type?: FeeEstimationType): Promise<void>;
    /**
     * @param exchangeRate The exchange rate whose counter currency to await an update for
     * (with respect to BTC)
     * @remark Awaits an oracle update to the exchange rate
     */
    waitForExchangeRateUpdate<C extends CurrencyUnit, U extends BitcoinUnit>(
        exchangeRate: ExchangeRate<Currency<U>, U, Currency<C>, C>
    ): Promise<void>;
}

export class DefaultOracleAPI implements OracleAPI {
    constructor(private api: ApiPromise, private wrappedCurrency: WrappedCurrency, private transactionAPI: TransactionAPI) {}

    async getExchangeRate<C extends CurrencyUnit>(
        collateralCurrency: Currency<C>
    ): Promise<ExchangeRate<Currency<BitcoinUnit>, BitcoinUnit, Currency<C>, C>> {
        const oracleKey = createExchangeRateOracleKey(this.api, collateralCurrency);

        const encodedRawRate = unwrapRawExchangeRate(await this.api.query.oracle.aggregate(oracleKey));
        if (encodedRawRate === undefined) {
            return Promise.reject(new Error(`No exchange rate for given currency: ${collateralCurrency.ticker}`));
        }
        const decodedRawRate = decodeFixedPointType(encodedRawRate);
        return new ExchangeRate<Currency<BitcoinUnit>, BitcoinUnit, Currency<C>, C>(
            this.wrappedCurrency,
            collateralCurrency,
            decodedRawRate,
            this.wrappedCurrency.rawBase,
            collateralCurrency.rawBase
        );
    }

    async convertWrappedToCurrency<C extends CurrencyUnit>(
        amount: MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const rate = await this.getExchangeRate(currency);
        return rate.toCounter(amount);
    }

    async convertCollateralToWrapped<C extends CurrencyUnit>(
        amount: MonetaryAmount<Currency<C>, C>
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        const rate = await this.getExchangeRate(amount.currency);
        return rate.toBase(amount);
    }

    async getOnlineTimeout(): Promise<number> {
        const moment = await this.api.query.oracle.maxDelay();
        return moment.toNumber();
    }

    async setExchangeRate<C extends CurrencyUnit>(
        exchangeRate: ExchangeRate<Bitcoin, BitcoinUnit, Currency<C>, C>
    ): Promise<void> {
        const encodedExchangeRate = encodeUnsignedFixedPoint(
            this.api,
            exchangeRate.toBig({
                baseUnit: exchangeRate.base.rawBase,
                counterUnit: exchangeRate.counter.rawBase,
            })
        );
        const oracleKey = createExchangeRateOracleKey(this.api, exchangeRate.counter);
        const tx = this.api.tx.oracle.feedValues([[oracleKey, encodedExchangeRate]]);
        await this.transactionAPI.sendLogged(tx, this.api.events.oracle.FeedValues, true);
    }

    async getBitcoinFees(): Promise<Big> {
        const fast = createInclusionOracleKey(this.api, DEFAULT_INCLUSION_TIME);
        const fees = await this.api.query.oracle.aggregate(fast);

        const parseFees = (fee: Option<UnsignedFixedPoint>): Big => {
            const inner = unwrapRawExchangeRate(fee);
            if (inner !== undefined) {
                return decodeFixedPointType(inner);
            }
            throw new Error("Bitcoin fee estimate not set");
        };

        return parseFees(fees);
    }

    async setBitcoinFees(fees: Big): Promise<void> {
        if (!fees.round().eq(fees)) {
            throw new Error("tx fees must be an integer amount of satoshi");
        } else if (fees.lt(0)) {
            throw new Error("tx fees must be a positive amount of satoshi");
        }

        const oracleKey = createInclusionOracleKey(this.api, DEFAULT_INCLUSION_TIME);
        const encodedFee = encodeUnsignedFixedPoint(this.api, fees);
        const tx = this.api.tx.oracle.feedValues([[oracleKey, encodedFee]]);
        await this.transactionAPI.sendLogged(tx, this.api.events.oracle.FeedValues, true);
    }

    async getSourcesById(): Promise<Map<string, string>> {
        const oracles = await this.api.query.oracle.authorizedOracles.entries();
        const nameMap = new Map<string, string>();
        oracles.forEach((oracle) => nameMap.set(storageKeyToNthInner(oracle[0]).toString(), oracle[1].toUtf8()));
        return nameMap;
    }

    async getValidUntil<U extends CurrencyUnit>(counterCurrency: Currency<U>): Promise<Date> {
        const oracleKey = createExchangeRateOracleKey(this.api, counterCurrency);
        const validUntil = await this.api.query.oracle.validUntil(oracleKey);
        return validUntil.isSome ? convertMoment(validUntil.value as Moment) : Promise.reject("No such oracle key");
    }

    async isOnline(): Promise<boolean> {
        const errors = await this.api.query.security.errors();
        return !this.hasOracleError(errors.toArray());
    }

    async getRawValuesUpdated(key: InterbtcPrimitivesOracleKey): Promise<boolean> {
        const isSet = await this.api.query.oracle.rawValuesUpdated<Option<Bool>>(key);
        return isSet.unwrap().isTrue;
    }

    async waitForFeeEstimateUpdate(type: FeeEstimationType = DEFAULT_INCLUSION_TIME): Promise<void> {
        const key = createInclusionOracleKey(this.api, type);
        while (await this.getRawValuesUpdated(key)) {
            sleep(SLEEP_TIME_MS);
        }
    }

    async waitForExchangeRateUpdate<C extends CurrencyUnit, U extends BitcoinUnit>(
        exchangeRate: ExchangeRate<Currency<U>, U, Currency<C>, C>
    ): Promise<void> {
        const key = createExchangeRateOracleKey(this.api, exchangeRate.counter);
        while (await this.getRawValuesUpdated(key)) {
            sleep(SLEEP_TIME_MS);
        }
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
