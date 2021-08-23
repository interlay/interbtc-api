import { ApiPromise } from "@polkadot/api";
import { BTreeSet, Option } from "@polkadot/types/codec";
import { Moment } from "@polkadot/types/interfaces";
import { AddressOrPair } from "@polkadot/api/types";
import Big from "big.js";
import { Bitcoin, BTCAmount, BTCUnit, Currency, ExchangeRate, MonetaryAmount } from "@interlay/monetary-js";

import {
    convertMoment,
    createExchangeRateOracleKey,
    createInclusionOracleKey,
    decodeFixedPointType,
    encodeUnsignedFixedPoint,
    storageKeyToNthInner,
    unwrapRawExchangeRate,
} from "../utils";
import { ErrorCode, UnsignedFixedPoint } from "../interfaces/default";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { CollateralUnit, CurrencyUnit } from "../types/currency";
import { FeeEstimationType } from "../types/oracleTypes";

export const DEFAULT_FEED_NAME = "DOT/BTC";
export const DEFAULT_INCLUSION_TIME: FeeEstimationType = "Fast";

/**
 * @category InterBTC Bridge
 */
export interface OracleAPI extends TransactionAPI {
    /**
     * @param currency The collateral currency as a `Monetary.js` object
     * @returns The DOT/BTC exchange rate
     */
    getExchangeRate<C extends CollateralUnit>(
        currency: Currency<C>
    ): Promise<ExchangeRate<Bitcoin, BTCUnit, Currency<C>, C>>;
    /**
     * Obtains the current fees for BTC transactions, in satoshi/byte.
     * @returns Big value for the current inclusion fees.
     */
    getBitcoinFees(): Promise<Big>;
    /**
     * @returns Last exchange rate time
     */
    getValidUntil<C extends CurrencyUnit>(counterCurrency: Currency<C>): Promise<Date>;
    /**
     * @returns A map from the oracle's account id to its name
     */
    getSourcesById(): Promise<Map<string, string>>;
    /**
     * @returns Boolean value indicating whether the oracle is online
     */
    isOnline(): Promise<boolean>;
    /**
     * Send a transaction to set the DOT/BTC exchange rate
     * @param exchangeRate The rate to set
     */
    setExchangeRate<C extends CollateralUnit>(
        exchangeRate: ExchangeRate<Bitcoin, BTCUnit, Currency<C>, C>
    ): Promise<void>;
    /**
     * Send a transaction to set the current fee estimate for BTC transactions
     * @param fees Estimated Satoshis per bytes to get a transaction included
     */
    setBitcoinFees(fees: Big): Promise<void>;
    /**
     * @param amount The amount of wrapped tokens to convert
     * @param collateralCurrency A `Monetary.js` object
     * @returns Converted value
     */
    convertWrappedToCollateral<C extends CollateralUnit>(
        amount: BTCAmount,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param amount The amount of collateral tokens to convert
     * @param collateralCurrency A `Monetary.js` object
     * @returns Converted value
     */
    convertCollateralToWrapped<C extends CollateralUnit>(
        amount: MonetaryAmount<Currency<C>, C>,
        collateralCurrency: Currency<C>
    ): Promise<BTCAmount>;
    /**
     * @returns The period of time (in milliseconds) after an oracle's last submission
     * during which it is considered online
     */
    getOnlineTimeout(): Promise<number>;
}

export class DefaultOracleAPI extends DefaultTransactionAPI implements OracleAPI {
    constructor(api: ApiPromise, account?: AddressOrPair) {
        super(api, account);
    }

    async getExchangeRate<C extends CollateralUnit>(
        collateralCurrency: Currency<C>
    ): Promise<ExchangeRate<Bitcoin, BTCUnit, Currency<C>, C>> {
        const oracleKey = createExchangeRateOracleKey(this.api, collateralCurrency);
        const head = await this.api.rpc.chain.getFinalizedHead();
        const encodedRawRate = unwrapRawExchangeRate(
            await this.api.query.exchangeRateOracle.aggregate.at(head, oracleKey)
        );
        if (encodedRawRate === undefined) {
            return Promise.reject("No exchange rate for given currency");
        }
        const decodedRawRate = decodeFixedPointType(encodedRawRate);
        return new ExchangeRate<Bitcoin, BTCUnit, Currency<C>, C>(
            Bitcoin,
            collateralCurrency,
            decodedRawRate,
            Bitcoin.rawBase,
            collateralCurrency.rawBase
        );
    }

    async convertWrappedToCollateral<C extends CollateralUnit>(
        amount: BTCAmount,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const rate = await this.getExchangeRate(collateralCurrency);
        return rate.toCounter(amount);
    }

    async convertCollateralToWrapped<C extends CollateralUnit>(
        amount: MonetaryAmount<Currency<C>, C>,
        collateralCurrency: Currency<C>
    ): Promise<BTCAmount> {
        const rate = await this.getExchangeRate(collateralCurrency);
        return rate.toBase(amount);
    }

    async getOnlineTimeout(): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const moment = await this.api.query.exchangeRateOracle.maxDelay.at(head);
        return moment.toNumber();
    }

    async setExchangeRate<C extends CollateralUnit>(
        exchangeRate: ExchangeRate<Bitcoin, BTCUnit, Currency<C>, C>
    ): Promise<void> {
        const encodedExchangeRate = encodeUnsignedFixedPoint(
            this.api,
            exchangeRate.toBig({
                baseUnit: exchangeRate.base.rawBase,
                counterUnit: exchangeRate.counter.rawBase,
            })
        );
        const oracleKey = createExchangeRateOracleKey(this.api, exchangeRate.counter);
        const tx = this.api.tx.exchangeRateOracle.feedValues([[oracleKey, encodedExchangeRate]]);
        await this.sendLogged(tx, this.api.events.exchangeRateOracle.FeedValues);
    }

    async getBitcoinFees(): Promise<Big> {
        const fast = createInclusionOracleKey(this.api, DEFAULT_INCLUSION_TIME);
        const head = await this.api.rpc.chain.getFinalizedHead();
        const fees = await this.api.query.exchangeRateOracle.aggregate.at(head, fast);

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
        const tx = this.api.tx.exchangeRateOracle.feedValues([[oracleKey, encodedFee]]);
        await this.sendLogged(tx, this.api.events.exchangeRateOracle.FeedValues);
    }

    async getSourcesById(): Promise<Map<string, string>> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const oracles = await this.api.query.exchangeRateOracle.authorizedOracles.entriesAt(head);
        const nameMap = new Map<string, string>();
        oracles.forEach((oracle) => nameMap.set(storageKeyToNthInner(oracle[0]).toString(), oracle[1].toUtf8()));
        return nameMap;
    }

    async getValidUntil<C extends CurrencyUnit>(counterCurrency: Currency<C>): Promise<Date> {
        const oracleKey = createExchangeRateOracleKey(this.api, counterCurrency);
        const head = await this.api.rpc.chain.getFinalizedHead();
        const validUntil = await this.api.query.exchangeRateOracle.validUntil.at(head, oracleKey);
        return validUntil.isSome ? convertMoment(validUntil.value as Moment) : Promise.reject("No such oracle key");
    }

    async isOnline(): Promise<boolean> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const errors = await this.api.query.security.errors.at(head);
        return !this.hasOracleError(errors);
    }

    private hasOracleError(errors: BTreeSet<ErrorCode>): boolean {
        for (const error of errors.values()) {
            if (error.isOracleOffline) {
                return true;
            }
        }
        return false;
    }
}
