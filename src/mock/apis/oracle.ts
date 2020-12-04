import { OracleAPI } from "../../apis";
import { OracleInfo } from "../../apis/oracle";

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

    getExchangeRate(): Promise<number> {
        return Promise.resolve(20);
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
}
