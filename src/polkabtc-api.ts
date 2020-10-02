import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { Signer } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { BTCCoreAPI, DefaultBTCCoreAPI } from "./apis/btc-core";
import { DefaultIssueAPI, IssueAPI } from "./apis/issue";
import { DefaultOracleAPI, OracleAPI } from "./apis/oracle";
import { DefaultRedeemAPI, RedeemAPI } from "./apis/redeem";
import { DefaultStakedRelayerAPI, StakedRelayerAPI } from "./apis/staked-relayer";
import { DefaultVaultsAPI, VaultsAPI } from "./apis/vaults";
import { StakedRelayerClient } from "./http";


export * from "./factory";

export interface PolkaBTCAPI {
    readonly api: ApiPromise;
    readonly vaults: VaultsAPI;
    readonly issue: IssueAPI;
    readonly redeem: RedeemAPI;
    readonly stakedRelayer: StakedRelayerAPI;
    readonly relayer: StakedRelayerClient;
    readonly oracle: OracleAPI;
    readonly btcCore: BTCCoreAPI;
    setAccount(account: AddressOrPair, signer?: Signer): void;
    readonly account: AddressOrPair | undefined;
}

export class DefaultPolkaBTCAPI implements PolkaBTCAPI {
    public readonly vaults: VaultsAPI;
    public readonly issue: IssueAPI;
    public readonly redeem: RedeemAPI;
    public readonly stakedRelayer: StakedRelayerAPI;
    public readonly relayer: StakedRelayerClient;
    public readonly oracle: OracleAPI;
    public readonly btcCore: BTCCoreAPI;

    constructor(readonly api: ApiPromise, mainnet: boolean = true, private _account?: AddressOrPair) {
        this.vaults = new DefaultVaultsAPI(api);
        this.issue = new DefaultIssueAPI(api, _account);
        this.redeem = new DefaultRedeemAPI(api, _account);
        this.stakedRelayer = new DefaultStakedRelayerAPI(api);
        this.relayer = new StakedRelayerClient("");
        this.oracle = new DefaultOracleAPI(api);
        this.btcCore = new DefaultBTCCoreAPI(mainnet);
    }

    setAccount(account: AddressOrPair, signer?: Signer): void {
        if (!(account as KeyringPair).sign && !signer) {
            throw new Error("signer must be passed if account is not a Keypair");
        }
        if (signer) {
            this.api.setSigner(signer);
        }
        this._account = account;
        this.issue.setAccount(account);
        this.redeem.setAccount(account);
    }

    get account(): AddressOrPair | undefined {
        return this._account;
    }
}
