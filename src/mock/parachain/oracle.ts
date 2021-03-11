import { AddressOrPair } from "@polkadot/api/types";
import { OracleAPI } from "../../parachain";
import { BtcTxFees, OracleInfo } from "../../parachain/oracle";
import Big from "big.js";

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

    getBtcTxFeesPerByte(): Promise<BtcTxFees> {
        return Promise.resolve({ fast: 500, half: 300, hour: 200 });
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

    async setBtcTxFeesPerByte(_fees: BtcTxFees): Promise<void> {
        return;
    }

    async setAccount(_account: AddressOrPair): Promise<void> {
        return;
    }
}
