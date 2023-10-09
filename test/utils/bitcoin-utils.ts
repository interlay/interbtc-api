import { BTCRelayAPI } from "../../src/parachain";
import {
    sleep,
    addHexPrefix,
    reverseEndiannessHex,
    SLEEP_TIME_MS,
} from "../../src/utils";
import { BitcoinCoreClient } from "./bitcoin-core-client";

export async function waitForBlockRelaying(
    btcRelayAPI: BTCRelayAPI,
    blockHash: string,
    sleepMs = SLEEP_TIME_MS
): Promise<void> {
    while (!(await btcRelayAPI.isBlockInRelay(blockHash))) {
        console.log(`Blockhash ${blockHash} not yet relayed...`);
        await sleep(sleepMs);
    }
}

export async function waitForBlockFinalization(
    bitcoinCoreClient: BitcoinCoreClient,
    btcRelayAPI: BTCRelayAPI
): Promise<void> {
    const bestBlockHash = addHexPrefix(reverseEndiannessHex(await bitcoinCoreClient.getBestBlockHash()));
    // wait for block to be relayed
    await waitForBlockRelaying(btcRelayAPI, bestBlockHash);
}
