import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import Issue from "./apis/issue";
import Vaults from "./apis/vaults";

export default class PolkaBTCApi {
    public readonly vaults: Vaults;
    public readonly issue: Issue;

    constructor(readonly api: ApiPromise, private account?: KeyringPair) {
        this.issue = new Issue(api, account);
        this.vaults = new Vaults(api);
    }

    setAccount(account: KeyringPair): void {
        this.account = account;
        this.issue.setAccount(account);
    }
}
