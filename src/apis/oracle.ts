import { BtcTxFeesPerByte, ErrorCode } from "../interfaces/default";
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
    getBtcTxFeesPerByte(): Promise<[number, number, number]>;
    getFeed(): Promise<string>;
    getLastExchangeRateTime(): Promise<Date>;
    getOracleNames(): Promise<Array<string>>;
    isOnline(): Promise<boolean>;
    getInfo(): Promise<OracleInfo>;
    setExchangeRate(exchangeRate: string): Promise<void>;
    setBtcTxFeesPerByte(fast: string, half: string, hour: string): Promise<void>;
    setAccount(account: AddressOrPair): void;
    getRawExchangeRate(): Promise<Big>;
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
        const rawRate = await this.getRawExchangeRate();
        return new Big(this.convertFromRawExchangeRate(rawRate.toString()));
    }

    /**
     * @returns The Planck/Satoshi exchange rate
     */
    async getRawExchangeRate(): Promise<Big> {
        const encodedRawRate = await this.api.query.exchangeRateOracle.exchangeRate();
        return new Big(decodeFixedPointType(encodedRawRate));
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
        await sendLoggedTx(tx, this.account, this.api);
    }

    /**
     * Obtains the current fees for BTC transactions, in satoshi/byte.
     * @returns An array of three numbers whose first value is the estimated
     * fee for inclusion in the next block (about 10 minutes), the second value
     * is the fee for inclusion in the next 3 blocks (~30 minutes), and the
     * third is the fee for inclusion in the next 6 blocks, or ~60 minutes).
     */
    async getBtcTxFeesPerByte(): Promise<[number, number, number]> {
        const fees = await this.api.query.exchangeRateOracle.satoshiPerBytes();
        return [fees.fast.toNumber(), fees.half.toNumber(), fees.hour.toNumber()];
    }

    /**
     * Send a transaction to set the current fee rates for BTC transactions
     * @param fast Estimated Satoshis per bytes to get included in the next block (~10 min)
     * @param half Estimated Satoshis per bytes to get included in the next 3 blocks (~half hour)
     * @param hour Estimated Satoshis per bytes to get included in the next 6 blocks (~hour)
     */
    async setBtcTxFeesPerByte(fast: string, half: string, hour: string): Promise<void> {
        if (!this.account) {
            throw new Error("cannot set tx fees without setting account");
        }
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
        await sendLoggedTx(tx, this.account, this.api);
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
    private convertFromRawExchangeRate(rate: string): string {
        const rateBig = new Big(rate);
        const divisor = new Big(DOT_IN_PLANCK / BTC_IN_SAT);
        return rateBig.div(divisor).toString();
    }

    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void {
        this.account = account;
    }
}
