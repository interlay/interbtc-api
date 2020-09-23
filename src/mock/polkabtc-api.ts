import { KeyringPair } from "@polkadot/keyring/types";
import { ApiPromise } from "@polkadot/api";

import { IssueAPI, RedeemAPI, VaultsAPI, StakedRelayerAPI } from "../apis";
import { MockIssueAPI } from "./apis/issue";
import { MockRedeemAPI } from "./apis/redeem";
import { MockVaultsAPI } from "./apis/vaults";
import { MockStakedRelayerAPI } from "./apis/staked-relayer";
import { PolkaBTCAPI } from "../polkabtc-api";

export default class MockPolkaBTCAPI implements PolkaBTCAPI {
    public readonly vaults: VaultsAPI;
    public readonly issue: IssueAPI;
    public readonly redeem: RedeemAPI;
    public readonly stakedRelayer: StakedRelayerAPI;

    private account?: KeyringPair;

    constructor(readonly api: ApiPromise) {
        this.vaults = new MockVaultsAPI();
        this.issue = new MockIssueAPI();
        this.redeem = new MockRedeemAPI();
        this.stakedRelayer = new MockStakedRelayerAPI();
    }

    setAccount(account: KeyringPair): void {
        this.account = account;
    }
}
