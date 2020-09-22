import { IssueAPIInterface, RequestResult } from "../apis/issue";
import { DOT, Issue as IssueRequest, PolkaBTC, H256Le } from "@interlay/polkabtc/interfaces/default";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountId, H256, H160, BlockNumber } from "@polkadot/types/interfaces";
import { Bytes, u32, bool } from "@polkadot/types/primitive";
import BN from "bn.js";
import { GenericAccountId } from "@polkadot/types/generic";
import { TypeRegistry } from "@polkadot/types";
import { U8aFixed } from "@polkadot/types/codec";


class IssueAPIMock implements IssueAPIInterface {

    execute(_issueId: H256, _txId: H256Le, _txBlockHeight: u32, _merkleProof: Bytes, _rawTx: Bytes): Promise<void> {
        throw new Error("Method not implemented.");
    }
    cancel(_issueId: H256): Promise<void> {
        throw new Error("Method not implemented.");
    }
    request(_amount: PolkaBTC, _vaultId?: AccountId, _griefingCollateral?: DOT): Promise<RequestResult> {
        throw new Error("Method not implemented.");
    }

    setAccount(_account?: KeyringPair): void {
        return;
    }

    getGriefingCollateral(): Promise<DOT> {
        return Promise.resolve(new BN(100) as DOT);
    }

    list(): Promise<IssueRequest[]> {
        const registry = new TypeRegistry();
        return Promise.resolve([
            <IssueRequest>{
                vault: new GenericAccountId(
                    registry,
                    "23"
                ),
                amount: new BN(600) as PolkaBTC,
                opentime: new BN(10908) as BlockNumber,
                btc_address: new U8aFixed(registry, "343242ddsadsadsa") as H160,
                completed: new bool(registry, true),
                requester: new GenericAccountId(
                    registry,
                    "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d"
                ),
                griefing_collateral: new BN(10) as DOT,
            },
            <IssueRequest>{
                vault: new GenericAccountId(
                    registry,
                    "27"
                ),
                amount: new BN(4510) as PolkaBTC,
                opentime: new BN(11938) as BlockNumber,
                btc_address: new U8aFixed(registry, "321321321321321") as H160,
                completed: new bool(registry, true),
                requester: new GenericAccountId(
                    registry,
                    "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d"
                ),
                griefing_collateral: new BN(76) as DOT,
            },
        ]);
    }

}

export default IssueAPIMock;