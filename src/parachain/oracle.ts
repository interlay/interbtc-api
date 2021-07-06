import { ApiPromise } from "@polkadot/api";
import { BTreeSet } from "@polkadot/types/codec";
import { Moment } from "@polkadot/types/interfaces";
import { AddressOrPair } from "@polkadot/api/types";
import Big from "big.js";
import { Bitcoin, BTCAmount, BTCUnit, Currency, ExchangeRate, MonetaryAmount } from "@interlay/monetary-js";

import {
    decodeFixedPointType,
    encodeUnsignedFixedPoint,
    storageKeyToNthInner,
} from "../utils";
import { ErrorCode } from "../interfaces/default";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { CollateralUnits } from "../types/currency";

export const DEFAULT_FEED_NAME = "DOT/BTC";

export type BtcTxFees = {
    fast: number;
    half: number;
    hour: number;
};

/**
 * @category InterBTC Bridge
 */
export interface OracleAPI extends TransactionAPI {
    /**
     * @returns The DOT/BTC exchange rate
     */
    getExchangeRate<C extends CollateralUnits>(currency: Currency<C>): Promise<ExchangeRate<Currency<C>, C, Bitcoin, BTCUnit>>;
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
    getLastExchangeRateTime(): Promise<Date>;
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
    setExchangeRate(exchangeRate: Big): Promise<void>;
    /**
     * Send a transaction to set the current fee rates for BTC transactions
     * @param fees.fast Estimated Satoshis per bytes to get included in the next block (~10 min)
     * @param fees.half Estimated Satoshis per bytes to get included in the next 3 blocks (~half hour)
     * @param fees.hour Estimated Satoshis per bytes to get included in the next 6 blocks (~hour)
     */
    setBtcTxFeesPerByte(fees: BtcTxFees): Promise<void>;
    /**
     * @returns Converted value
     */
     convertWrappedToCollateral<C extends CollateralUnits>(amount: BTCAmount, collateralCurrency: Currency<C>): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @returns Converted value
     */
     convertCollateralToWrapped<C extends CollateralUnits>(amount: MonetaryAmount<Currency<C>, C>, collateralCurrency: Currency<C>): Promise<BTCAmount>;
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

    async getExchangeRate<C extends CollateralUnits>(collateralCurrency: Currency<C>): Promise<ExchangeRate<Currency<C>, C, Bitcoin, BTCUnit>> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const encodedRawRate = await this.api.query.exchangeRateOracle.exchangeRate.at(head);
        const decodedRawRate = decodeFixedPointType(encodedRawRate);
        return new ExchangeRate<Currency<C>, C, Bitcoin, BTCUnit>(
            collateralCurrency,
            Bitcoin,
            decodedRawRate
        );
    }

    async convertWrappedToCollateral<C extends CollateralUnits>(amount: BTCAmount, collateralCurrency: Currency<C>): Promise<MonetaryAmount<Currency<C>, C>> {
        const rate = await this.getExchangeRate(collateralCurrency);
        return rate.toBase(amount);
    }

    async convertCollateralToWrapped<C extends CollateralUnits>(amount: MonetaryAmount<Currency<C>, C>, collateralCurrency: Currency<C>): Promise<BTCAmount> {
        const rate = await this.getExchangeRate(collateralCurrency);
        return rate.toCounter(amount);
    }

    async getOnlineTimeout(): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const moment = await this.api.query.exchangeRateOracle.maxDelay.at(head);
        return moment.toNumber();
    }

    async setExchangeRate(dotPerBtc: Big): Promise<void> {
        const encodedExchangeRate = encodeUnsignedFixedPoint(this.api, dotPerBtc);
        const tx = this.api.tx.exchangeRateOracle.setExchangeRate(encodedExchangeRate);
        await this.sendLogged(tx, this.api.events.exchangeRateOracle.SetExchangeRate);
    }

    async getBtcTxFeesPerByte(): Promise<BtcTxFees> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const fees = await this.api.query.exchangeRateOracle.satoshiPerBytes.at(head);
        return { fast: fees.fast.toNumber(), half: fees.half.toNumber(), hour: fees.hour.toNumber() };
    }

    async setBtcTxFeesPerByte({ fast, half, hour }: BtcTxFees): Promise<void> {
        [fast, half, hour].forEach((param) => {
            const big = new Big(param);
            if (!big.round().eq(big)) {
                throw new Error("tx fees must be an integer amount of satoshi");
            }
            if (big.lt(0)) {
                throw new Error("tx fees must be a positive amount of satoshi");
            }
        });
        const tx = this.api.tx.exchangeRateOracle.setBtcTxFeesPerByte(fast, half, hour);
        await this.sendLogged(tx, this.api.events.exchangeRateOracle.SetBtcTxFeesPerByte);
    }

    async getSourcesById(): Promise<Map<string, string>> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const oracles = await this.api.query.exchangeRateOracle.authorizedOracles.entriesAt(head);
        const nameMap = new Map<string, string>();
        oracles.forEach((oracle) => nameMap.set(storageKeyToNthInner(oracle[0]).toString(), oracle[1].toUtf8()));
        return nameMap;
    }

    async getLastExchangeRateTime(): Promise<Date> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const moment = await this.api.query.exchangeRateOracle.lastExchangeRateTime.at(head);
        return this.convertMoment(moment);
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

    private convertMoment(moment: Moment): Date {
        return new Date(moment.toNumber());
    }
}
