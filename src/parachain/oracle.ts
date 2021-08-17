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

export type BtcTxFees = {
    fast?: Big;
    half?: Big;
    hour?: Big;
};

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
     * @returns An object with the values `fast` (estimated fee for inclusion
     * in the next block - about 10 minutes), `half` (fee for the next 3 blocks or ~30 minutes)
     * and `hour` (fee for inclusion in the next 6 blocks, or ~60 minutes).
     */
    getBtcTxFeesPerByte(): Promise<BtcTxFees>;
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
     * Send a transaction to set the current fee rates for BTC transactions
     * @param fees.fast Estimated Satoshis per bytes to get included in the next block (~10 min)
     * @param fees.half Estimated Satoshis per bytes to get included in the next 3 blocks (~half hour)
     * @param fees.hour Estimated Satoshis per bytes to get included in the next 6 blocks (~hour)
     */
    setBtcTxFeesPerByte(fees: BtcTxFees): Promise<void>;
    /**
     * Send a transaction to set a single type of btx tx fee ("Fast", "Half", or "Hour")
     * @param fee The inclusion fee
     * @param type The speed of tx inclusion
     */
    setBtcTxFeePerByte(fee: Big, type: FeeEstimationType): Promise<void>;
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
    /**
     * @returns The highest available fees for BTC transactions, in satoshi/byte.
     * If no fees available, rejects the Promise.
     */
    getFeesPerByteForFastestInclusion(): Promise<Big>;
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
        await this.sendLogged(tx, this.api.events.exchangeRateOracle.SetExchangeRate);
    }

    async getBtcTxFeesPerByte(): Promise<BtcTxFees> {
        const fast = createInclusionOracleKey(this.api, "Fast");
        const half = createInclusionOracleKey(this.api, "Half");
        const hour = createInclusionOracleKey(this.api, "Hour");
        const head = await this.api.rpc.chain.getFinalizedHead();
        const fees = await Promise.all([
            this.api.query.exchangeRateOracle.aggregate.at(head, fast),
            this.api.query.exchangeRateOracle.aggregate.at(head, half),
            this.api.query.exchangeRateOracle.aggregate.at(head, hour),
        ]);
        const parsedFees = fees.map((fee) => {
            const inner = unwrapRawExchangeRate(fee as Option<UnsignedFixedPoint>);
            if (inner !== undefined) {
                return decodeFixedPointType(inner);
            }
            return inner;
        });
        return {
            fast: parsedFees[0],
            half: parsedFees[1],
            hour: parsedFees[2],
        };
    }

    async getFeesPerByteForFastestInclusion(): Promise<Big> {
        const fees = await this.getBtcTxFeesPerByte();
        if (fees.fast) {
            return fees.fast;
        } else if (fees.half) {
            return fees.half;
        } else if (fees.hour) {
            return fees.hour;
        }
        return Promise.reject("No fees per byte available");
    }

    async setBtcTxFeesPerByte({ fast, half, hour }: BtcTxFees): Promise<void> {
        [fast, half, hour].forEach((param) => {
            if (!param) {
                return;
            }
            if (!param.round().eq(param)) {
                throw new Error("tx fees must be an integer amount of satoshi");
            }
            if (param.lt(0)) {
                throw new Error("tx fees must be a positive amount of satoshi");
            }
        });
        if (fast) {
            await this.setBtcTxFeePerByte(fast, "Fast");
        }
        if (half) {
            await this.setBtcTxFeePerByte(half, "Half");
        }
        if (hour) {
            await this.setBtcTxFeePerByte(hour, "Hour");
        }
    }

    async setBtcTxFeePerByte(fee: Big, type: FeeEstimationType): Promise<void> {
        const oracleKey = createInclusionOracleKey(this.api, type);
        const encodedFee = encodeUnsignedFixedPoint(this.api, fee);
        const tx = this.api.tx.exchangeRateOracle.feedValues([[oracleKey, encodedFee]]);
        await this.sendLogged(tx, this.api.events.exchangeRateOracle.SetBtcTxFeesPerByte);
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
