import { PolkaBTC, RedeemRequest, DOT, H256Le } from "../../interfaces/default";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, Hash, BlockNumber, H256 } from "@polkadot/types/interfaces";
import { GenericAccountId } from "@polkadot/types/generic";
import { Bytes, TypeRegistry, u32 } from "@polkadot/types";
import BN from "bn.js";
import { RedeemAPI, RedeemRequestExt, RequestResult } from "../../parachain/redeem";

export class MockRedeemAPI implements RedeemAPI {
    execute(_redeemId: H256, _txId: H256Le, _merkleProof: Bytes, _rawTx: Bytes): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    cancel(_redeemId: H256, _reimburse?: boolean): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async request(_amount: PolkaBTC, _btcAddressEnc: string, _vaultId?: AccountId): Promise<RequestResult> {
        return Promise.resolve({ id: <Hash>{}, redeemRequest: (await this.list())[0] });
    }

    async list(): Promise<RedeemRequestExt[]> {
        const registry = new TypeRegistry();
        const decodedAccountId = "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d";

        return Promise.resolve([
            <RedeemRequestExt>{
                vault: new GenericAccountId(registry, decodedAccountId),
                opentime: new BN(10908) as BlockNumber,
                amount_polka_btc: new BN(4141) as PolkaBTC,
                amount_btc: new BN(4141) as PolkaBTC,
                amount_dot: new BN(7090) as DOT,
                premium_dot: new BN(140) as DOT,
                redeemer: new GenericAccountId(registry, decodedAccountId),
                btc_address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
            },
            <RedeemRequestExt>{
                vault: new GenericAccountId(registry, decodedAccountId),
                opentime: new BN(11208) as BlockNumber,
                amount_polka_btc: new BN(400) as PolkaBTC,
                amount_btc: new BN(411) as PolkaBTC,
                amount_dot: new BN(709) as DOT,
                premium_dot: new BN(10) as DOT,
                redeemer: new GenericAccountId(registry, decodedAccountId),
                btc_address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
            },
        ]);
    }

    async mapForUser(_account: AccountId): Promise<Map<H256, RedeemRequestExt>> {
        return Promise.resolve(new Map<H256, RedeemRequestExt>());
    }

    getPagedIterator(_perPage: number): AsyncGenerator<RedeemRequest[]> {
        return {} as AsyncGenerator<RedeemRequest[]>;
    }

    async getRequestById(_redeemId: string | Uint8Array | H256): Promise<RedeemRequestExt> {
        const registry = new TypeRegistry();
        const decodedAccountId = "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d";

        return <RedeemRequestExt>{
            vault: new GenericAccountId(registry, decodedAccountId),
            opentime: new BN(11208) as BlockNumber,
            amount_polka_btc: new BN(400) as PolkaBTC,
            amount_btc: new BN(411) as PolkaBTC,
            amount_dot: new BN(709) as DOT,
            premium_dot: new BN(10) as DOT,
            redeemer: new GenericAccountId(registry, decodedAccountId),
            btc_address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
        };
    }

    async getDustValue(): Promise<PolkaBTC> {
        return Promise.resolve(new BN(1) as PolkaBTC);
    }

    setAccount(_account?: AddressOrPair): void {
        return;
    }

    subscribeToRedeemExpiry(_account: AccountId, _callback: (requestRedeemId: H256) => void): Promise<() => void> {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return Promise.resolve(() => {});
    }

    async getFeesToPay(_amount: string): Promise<string> {
        return "0.08";
    }

    async getFeePercentage(): Promise<string> {
        return "4.4";
    }

    async getPremiumRedeemFee(): Promise<string> {
        return "5";
    }

    async getRedeemPeriod(): Promise<BlockNumber> {
        const registry = new TypeRegistry();
        return new u32(registry, 20) as BlockNumber;
    }
}
