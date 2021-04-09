import { IKeyringPair } from "@polkadot/types/types";
import { OracleAPI } from "../../../src/parachain";
import { BtcTxFees } from "../../../src/parachain/oracle";
import Big from "big.js";
import { PolkaBTC } from "@interlay/polkabtc/interfaces";

export class MockOracleAPI implements OracleAPI {
    getOnlineTimeout(): Promise<number> {
        return Promise.resolve(100);
    }
    
    convertSatoshiToPlanck(_satoshi: PolkaBTC): Promise<Big> {
        throw new Error("Method not implemented.");
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

    getSourcesById(): Promise<Map<string, string>> {
        return Promise.resolve(new Map());
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

    async setAccount(_account: IKeyringPair): Promise<void> {
        return;
    }
}
