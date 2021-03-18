import { BTCRelayAPI, DEFAULT_STABLE_CONFIRMATIONS } from "../../../src/parachain/btc-relay";
import { u32 } from "@polkadot/types/primitive";
import { H256Le } from "../../../src/interfaces/default";
import { U8aFixed, UInt } from "@polkadot/types/codec";
import { TypeRegistry } from "@polkadot/types";

export class MockBTCRelayAPI implements BTCRelayAPI {
    async getStableBitcoinConfirmations(): Promise<number> {
        return DEFAULT_STABLE_CONFIRMATIONS;
    }

    async getLatestBlock(): Promise<H256Le> {
        const registry = new TypeRegistry();
        return new U8aFixed(registry, "00000000000f6499c8547227") as H256Le;
    }

    async getLatestBlockHeight(): Promise<u32> {
        const registry = new TypeRegistry();
        return new UInt(registry, 1835342) as u32;
    }

    async verifyTransactionInclusion(
        _txid: string,
        _confirmations: number = DEFAULT_STABLE_CONFIRMATIONS,
        _insecure: boolean = false
    ): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    }
}
