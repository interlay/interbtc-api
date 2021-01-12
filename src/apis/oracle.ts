import { ErrorCode } from "../interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { BTreeSet } from "@polkadot/types/codec";
import { Moment } from "@polkadot/types/interfaces/runtime";
import { BTC_IN_SAT, DOT_IN_PLANCK, decodeFixedPointType, sendLoggedTx, encodeUnsignedFixedPoint } from "../utils";
import Big from "big.js";
import { AddressOrPair } from "@polkadot/api/types";

const defaultFeedName = "DOT/BTC";

export type OracleInfo = {
    exchangeRate: Big;
    feed: string;
    names: Array<string>;
    online: boolean;
    lastUpdate: Date;
};

export interface OracleAPI {
    getExchangeRate(): Promise<Big>;
    getFeed(): Promise<string>;
    getLastExchangeRateTime(): Promise<Date>;
    getOracleNames(): Promise<Array<string>>;
    isOnline(): Promise<boolean>;
    getInfo(): Promise<OracleInfo>;
    setExchangeRate(exchangeRate: string): Promise<void>;
    setAccount(account: AddressOrPair): void;
}

export class DefaultOracleAPI implements OracleAPI {
    constructor(private api: ApiPromise, private account?: AddressOrPair) {}

    /**
     * @returns An object of type OracleInfo 
     */
    async getInfo(): Promise<OracleInfo> {
        return {
            exchangeRate: await this.getExchangeRate(),
            feed: await this.getFeed(),
            names: await this.getOracleNames(),
            online: await this.isOnline(),
            lastUpdate: await this.getLastExchangeRateTime(),
        };
    }

    /**
     * @returns The DOT/BTC exchange rate
     */
    async getExchangeRate(): Promise<Big> {
        const encodedRawRate = await this.api.query.exchangeRateOracle.exchangeRate();
        const decodedRawRate = decodeFixedPointType(encodedRawRate);
        return this.convertFromRawExchangeRate(decodedRawRate);
    }

    /**
     * Send a transaction to set the DOT/BTC exchange rate
     * @param exchangeRate The rate to set
     */
    async setExchangeRate(exchangeRate: string): Promise<void> {
        if (!this.account) {
            throw new Error("cannot set exchange rate without setting account");
        }
        const encodedExchangeRate = encodeUnsignedFixedPoint(this.api, exchangeRate);
        const tx = this.api.tx.exchangeRateOracle.setExchangeRate(encodedExchangeRate);
        const result = await sendLoggedTx(tx, this.account, this.api);
    }

    /**
     * @returns An array with the oracle names
     */
    async getOracleNames(): Promise<Array<string>> {
        const oracles = await this.api.query.exchangeRateOracle.authorizedOracles.entries();
        return oracles.map((v) => v[1].toUtf8());
    }

    /**
     * @returns The feed name (such as "DOT/BTC")
     */
    getFeed(): Promise<string> {
        return Promise.resolve(defaultFeedName);
    }

    /**
     * @returns Last exchange rate time
     */
    async getLastExchangeRateTime(): Promise<Date> {
        const moment = await this.api.query.exchangeRateOracle.lastExchangeRateTime();
        return this.convertMoment(moment);
    }

    /**
     * @returns Boolean value indicating whether the oracle is online
     */
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

    // Converts the raw exchange rate (Planck to Satoshi) into
    // DOT to BTC
    private convertFromRawExchangeRate(rate: string): Big {
        const rateBN = new Big(rate);
        const divisor = new Big(DOT_IN_PLANCK / BTC_IN_SAT);
        return rateBN.div(divisor);
    }

    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void {
        this.account = account;
    }
}
