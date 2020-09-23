import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import IssueAPI from "./apis/issue";
import RedeemAPI from "./apis/redeem";
import VaultsAPI from "./apis/vaults";
import StakedRelayerAPI from "./apis/stakedRelayer";
export * from "./factory";

export class PolkaBTCAPI {
    public readonly vaults: VaultsAPI;
    public readonly issue: IssueAPI;
    public readonly redeem: RedeemAPI;
    public readonly stakedRelayer: StakedRelayerAPI;

    constructor(readonly api: ApiPromise, private account?: KeyringPair) {
        this.vaults = new VaultsAPI(api);
        this.issue = new IssueAPI(api, account);
        this.redeem = new RedeemAPI(api, account);
        this.stakedRelayer = new StakedRelayerAPI(api);
    }

    setAccount(account: KeyringPair): void {
        this.account = account;
        this.issue.setAccount(account);
        this.redeem.setAccount(account);
    }
}
