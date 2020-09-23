import { VaultsAPIInterface } from "../apis/vaults";
import { PolkaBTC, Vault } from "@interlay/polkabtc/interfaces/default";
import { AccountId, H160 } from "@polkadot/types/interfaces";
import { GenericAccountId } from "@polkadot/types/generic";
import { TypeRegistry } from "@polkadot/types";
import { U8aFixed, Option } from "@polkadot/types/codec";
import BN from "bn.js";

class VaultsAPIMock implements VaultsAPIInterface {

    async list(): Promise<Vault[]> {
        const registry = new TypeRegistry();
        const decodedAccountId = "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d";
        return Promise.resolve([
            <Vault> {
                id: new GenericAccountId(
                    registry, 
                    decodedAccountId
                ),
                to_be_issued_tokens: new BN(120) as PolkaBTC,
                issued_tokens: new BN(330) as PolkaBTC,
                to_be_redeemed_tokens: new BN(5) as PolkaBTC,
                btc_address: new U8aFixed(registry, "343242ddsadsadsa") as H160,
                banned_until: new Option(registry, "BlockNumber", new BN(10908))
            },
            <Vault> {
                id: new GenericAccountId(
                    registry, 
                    decodedAccountId
                ),
                to_be_issued_tokens: new BN(220) as PolkaBTC,
                issued_tokens: new BN(430) as PolkaBTC,
                to_be_redeemed_tokens: new BN(12) as PolkaBTC,
                btc_address: new U8aFixed(registry, "78443543fdsf") as H160,
                banned_until: new Option(registry, "BlockNumber", new BN(11938))
            },
        ]);
    }

    get(_vaultId: AccountId): Promise<Vault> {
        return Promise.resolve(<Vault>{});
    }

    // TODO: get vault with enough collateral from the registry
    async selectRandomVault(_btc: PolkaBTC): Promise<Vault> {
        const vaults = await this.list();
        return vaults[0];
    }
}

export default VaultsAPIMock;
