import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { IssueAPI, DefaultIssueAPI } from "./apis/issue";
import { RedeemAPI, DefaultRedeemAPI } from "./apis/redeem";
import { VaultsAPI, DefaultVaultsAPI } from "./apis/vaults";
import { StakedRelayerAPI, DefaultStakedRelayerAPI } from "./apis/staked-relayer";
export * from "./factory";

export interface PolkaBTCAPI {
    readonly vaults: VaultsAPI;
    readonly issue: IssueAPI;
    readonly redeem: RedeemAPI;
    readonly stakedRelayer: StakedRelayerAPI;
    setAccount(account: KeyringPair): void;
}

export class DefaultPolkaBTCAPI implements PolkaBTCAPI {
    public readonly vaults: VaultsAPI;
    public readonly issue: IssueAPI;
    public readonly redeem: RedeemAPI;
    public readonly stakedRelayer: StakedRelayerAPI;

    constructor(readonly api: ApiPromise, private account?: KeyringPair) {
        this.vaults = new DefaultVaultsAPI(api);
        this.issue = new DefaultIssueAPI(api, account);
        this.redeem = new DefaultRedeemAPI(api, account);
        this.stakedRelayer = new DefaultStakedRelayerAPI(api);
    }

    setAccount(account: KeyringPair): void {
        this.account = account;
        this.issue.setAccount(account);
        this.redeem.setAccount(account);
    }
}
