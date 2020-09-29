import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { IssueAPI, DefaultIssueAPI } from "./apis/issue";
import { RedeemAPI, DefaultRedeemAPI } from "./apis/redeem";
import { VaultsAPI, DefaultVaultsAPI } from "./apis/vaults";
import { StakedRelayerAPI, DefaultStakedRelayerAPI } from "./apis/staked-relayer";
import { OracleAPI } from "./apis";
import { DefaultOracleAPI } from "./apis/oracle";
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
    setAccount(account: KeyringPair): void;
}

export class DefaultPolkaBTCAPI implements PolkaBTCAPI {
    public readonly vaults: VaultsAPI;
    public readonly issue: IssueAPI;
    public readonly redeem: RedeemAPI;
    public readonly stakedRelayer: StakedRelayerAPI;
    public readonly relayer: StakedRelayerClient;
    public readonly oracle: OracleAPI;

    constructor(readonly api: ApiPromise, private account?: KeyringPair) {
        this.vaults = new DefaultVaultsAPI(api);
        this.issue = new DefaultIssueAPI(api, account);
        this.redeem = new DefaultRedeemAPI(api, account);
        this.stakedRelayer = new DefaultStakedRelayerAPI(api);
        this.relayer = new StakedRelayerClient("");
        this.oracle = new DefaultOracleAPI(api);
    }

    setAccount(account: KeyringPair): void {
        this.account = account;
        this.issue.setAccount(account);
        this.redeem.setAccount(account);
    }
}
