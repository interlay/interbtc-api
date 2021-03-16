import { ErrorCode, PolkaBTC } from "../interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { BTreeSet } from "@polkadot/types/codec";
import { Moment } from "@polkadot/types/interfaces/runtime";
import { BTC_IN_SAT, DOT_IN_PLANCK, decodeFixedPointType, Transaction, encodeUnsignedFixedPoint } from "../utils";
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

export type BtcTxFees = {
    fast: number;
    half: number;
    hour: number;
};

/**
 * @category PolkaBTC Bridge
 */
export interface OracleAPI {
    /**
     * @returns The DOT/BTC exchange rate
     */
    getExchangeRate(): Promise<Big>;
    /**
     * Obtains the current fees for BTC transactions, in satoshi/byte.
     * @returns An object with the values `fast` (estimated fee for inclusion
     * in the next block - about 10 minutes), `half` (fee for the next 3 blocks or ~30 minutes)
     * and `hour` (fee for inclusion in the next 6 blocks, or ~60 minutes).
     */
    getBtcTxFeesPerByte(): Promise<BtcTxFees>;
    /**
     * @returns The feed name (such as "DOT/BTC")
     */
    getFeed(): Promise<string>;
    /**
     * @returns Last exchange rate time
     */
    getLastExchangeRateTime(): Promise<Date>;
    /**
     * @returns An array with the oracle names
     */
    getOracleNames(): Promise<Array<string>>;
    /**
     * @returns Boolean value indicating whether the oracle is online
     */
    isOnline(): Promise<boolean>;
    /**
     * @returns An object of type OracleInfo
     */
    getInfo(): Promise<OracleInfo>;
    /**
     * Send a transaction to set the DOT/BTC exchange rate
     * @param exchangeRate The rate to set
     */
    setExchangeRate(exchangeRate: string): Promise<void>;
    /**
     * Send a transaction to set the current fee rates for BTC transactions
     * @param fees.fast Estimated Satoshis per bytes to get included in the next block (~10 min)
     * @param fees.half Estimated Satoshis per bytes to get included in the next 3 blocks (~half hour)
     * @param fees.hour Estimated Satoshis per bytes to get included in the next 6 blocks (~hour)
     */
    setBtcTxFeesPerByte(fees: BtcTxFees): Promise<void>;
    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void;
    /**
     * @returns The Planck/Satoshi exchange rate
     */
    getRawExchangeRate(): Promise<Big>;
    /**
     * @returns Convert a Satoshi amount to Planck
     */
    convertSatoshiToPlanck(satoshi: PolkaBTC): Promise<Big>;
}

export class DefaultOracleAPI implements OracleAPI {
    transaction: Transaction;

    constructor(private api: ApiPromise, private account?: AddressOrPair) {
        this.transaction = new Transaction(api);
    }

    async getInfo(): Promise<OracleInfo> {
        return {
            exchangeRate: await this.getExchangeRate(),
            feed: await this.getFeed(),
            names: await this.getOracleNames(),
            online: await this.isOnline(),
            lastUpdate: await this.getLastExchangeRateTime(),
        };
    }

    async convertSatoshiToPlanck(satoshi: PolkaBTC): Promise<Big> {
        const planckPerSatoshi = await this.getRawExchangeRate();
        const amountSatoshiBig = new Big(satoshi.toString());
        return planckPerSatoshi.mul(amountSatoshiBig);
    }

    async getExchangeRate(): Promise<Big> {
        const rawRate = await this.getRawExchangeRate();
        return new Big(this.convertFromRawExchangeRate(rawRate.toString()));
    }

    async getRawExchangeRate(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const encodedRawRate = await this.api.query.exchangeRateOracle.exchangeRate.at(head);
        return new Big(decodeFixedPointType(encodedRawRate));
    }

    async setExchangeRate(dotPerBtc: string): Promise<void> {
        if (!this.account) {
            throw new Error("cannot set exchange rate without setting account");
        }
        const encodedExchangeRate = encodeUnsignedFixedPoint(this.api, dotPerBtc);
        const tx = this.api.tx.exchangeRateOracle.setExchangeRate(encodedExchangeRate);
        await this.transaction.sendLogged(tx, this.account, this.api.events.exchangeRateOracle.SetExchangeRate);
    }

    async getBtcTxFeesPerByte(): Promise<BtcTxFees> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const fees = await this.api.query.exchangeRateOracle.satoshiPerBytes.at(head);
        return { fast: fees.fast.toNumber(), half: fees.half.toNumber(), hour: fees.hour.toNumber() };
    }

    async setBtcTxFeesPerByte({ fast, half, hour }: BtcTxFees): Promise<void> {
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
        await this.transaction.sendLogged(tx, this.account, this.api.events.exchangeRateOracle.SetBtcTxFeesPerByte);
    }

    async getOracleNames(): Promise<Array<string>> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const oracles = await this.api.query.exchangeRateOracle.authorizedOracles.entriesAt(head);
        return oracles.map((v) => v[1].toUtf8());
    }

    getFeed(): Promise<string> {
        return Promise.resolve(defaultFeedName);
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

    // Converts the raw exchange rate (Planck to Satoshi) into
    // DOT to BTC
    private convertFromRawExchangeRate(rate: string): string {
        const rateBig = new Big(rate);
        const divisor = new Big(DOT_IN_PLANCK / BTC_IN_SAT);
        return rateBig.div(divisor).toString();
    }

    setAccount(account: AddressOrPair): void {
        this.account = account;
    }
}
