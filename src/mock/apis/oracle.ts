import { AddressOrPair } from "@polkadot/api/types";
import { OracleAPI } from "../../apis";
import { OracleInfo } from "../../apis/oracle";
import Big from "big.js";
import { BtcTxFeesPerByte } from "@interlay/polkabtc/interfaces";

export class MockOracleAPI implements OracleAPI {
    async getInfo(): Promise<OracleInfo> {
        const oracle_info: OracleInfo = {
            exchangeRate: await this.getExchangeRate(),
            feed: await this.getFeed(),
            names: await this.getOracleNames(),
            online: await this.isOnline(),
            lastUpdate: await this.getLastExchangeRateTime(),
        };

        return Promise.resolve(oracle_info);
    }

    getExchangeRate(): Promise<Big> {
        return Promise.resolve(new Big(20));
    }

    getRawExchangeRate(): Promise<Big> {
        return Promise.resolve(new Big(200));
    }

    getBtcTxFeesPerByte(): Promise<[number, number, number]> {
        return Promise.resolve([500, 300, 200]);
    }

    getOracleNames(): Promise<Array<string>> {
        return Promise.resolve(["ChainLink"]);
    }

    getFeed(): Promise<string> {
        return Promise.resolve("BTC/DOT");
    }

    getLastExchangeRateTime(): Promise<Date> {
        return Promise.resolve(new Date());
    }

    isOnline(): Promise<boolean> {
        return Promise.resolve(true);
    }

    async setExchangeRate(_exchangeRate: string): Promise<void> {
        return;
    }

    async setBtcTxFeesPerByte(_fast: string, _half: string, _hour: string): Promise<void> {
        return;
    }

    async setAccount(_account: AddressOrPair): Promise<void> {
        return;
    }
}
