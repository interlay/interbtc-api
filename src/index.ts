import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import IssueAPI from "./apis/issue";
import RedeemAPI from "./apis/redeem";
import VaultsAPI from "./apis/vaults";

export default class PolkaBTCAPI {
    public readonly vaults: VaultsAPI;
    public readonly issue: IssueAPI;
    public readonly redeem: RedeemAPI;

    constructor(readonly api: ApiPromise, private account?: KeyringPair) {
        this.vaults = new VaultsAPI(api);
        this.issue = new IssueAPI(api, account);
        this.redeem = new RedeemAPI(api, account);
    }

    setAccount(account: KeyringPair): void {
        this.account = account;
        this.issue.setAccount(account);
        this.redeem.setAccount(account);
    }
}
