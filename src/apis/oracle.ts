import { ErrorCode } from "../interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { BTreeSet } from "@polkadot/types/codec";
import { Moment } from "@polkadot/types/interfaces/runtime";
import { u128 } from "@polkadot/types/primitive";
import { BTC_IN_SAT, DOT_IN_PLANCK, sendLoggedTx } from "../utils";
import Big from "big.js";
import { AddressOrPair } from "@polkadot/api/types";

const defaultFeedName = "DOT/BTC";
const granularity = 5;

export type OracleInfo = {
    exchangeRate: number;
    feed: string;
    names: Array<string>;
    online: boolean;
    lastUpdate: Date;
};

export interface OracleAPI {
    getExchangeRate(): Promise<number>;
    getFeed(): Promise<string>;
    getLastExchangeRateTime(): Promise<Date>;
    getOracleNames(): Promise<Array<string>>;
    isOnline(): Promise<boolean>;
    getInfo(): Promise<OracleInfo>;
    setExchangeRate(exchangeRate: string): Promise<void>;
    setAccount(account?: AddressOrPair): void;
}

export class DefaultOracleAPI implements OracleAPI {
    constructor(private api: ApiPromise, private account?: AddressOrPair) {}

    async getInfo(): Promise<OracleInfo> {
        const results = await this.api.queryMulti([
            this.api.query.exchangeRateOracle.exchangeRate,
            this.api.query.exchangeRateOracle.lastExchangeRateTime,
            this.api.query.security.errors,
        ]);
        const names = await this.api.query.exchangeRateOracle.authorizedOracles.entries();
        return {
            exchangeRate: this.convertFromRawExchangeRate(<u128>results[0]),
            feed: await this.getFeed(),
            names: names.map((v) => v[1].toUtf8()),
            online: !this.hasOracleError(<BTreeSet<ErrorCode>>results[2]),
            lastUpdate: this.convertMoment(<Moment>results[1]),
        };
    }

    // return the DOT/BTC exchange rate
    async getExchangeRate(): Promise<number> {
        const rawRate = await this.api.query.exchangeRateOracle.exchangeRate();
        return this.convertFromRawExchangeRate(rawRate);
    }

    async setExchangeRate(exchangeRate: string): Promise<void> {
        if (!this.account) {
            throw new Error("cannot set exchange rate without setting account");
        }
        const tx = this.api.tx.exchangeRateOracle.setExchangeRate(exchangeRate);
        const result = await sendLoggedTx(tx, this.account, this.api);
    }

    async getOracleNames(): Promise<Array<string>> {
        const oracles = await this.api.query.exchangeRateOracle.authorizedOracles.entries();
        return oracles.map((v) => v[1].toUtf8());
    }

    getFeed(): Promise<string> {
        return Promise.resolve(defaultFeedName);
    }

    async getLastExchangeRateTime(): Promise<Date> {
        const moment = await this.api.query.exchangeRateOracle.lastExchangeRateTime();
        return this.convertMoment(moment);
    }

    async isOnline(): Promise<boolean> {
        const errors = await this.api.query.security.errors();
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

    // Converts the raw exchange rate (planck to satoshi) into
    // DOT to BTC
    private convertFromRawExchangeRate(rate: u128): number {
        const rateBN = new Big(rate.toString());
        const divisor = new Big(Math.pow(10, granularity) * (DOT_IN_PLANCK / BTC_IN_SAT));
        return parseFloat(rateBN.div(divisor).toString());
    }

    setAccount(account?: AddressOrPair): void {
        this.account = account;
    }
}
