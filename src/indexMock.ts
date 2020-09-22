import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import IssueAPIMock from "./mockApis/issueMock";
import RedeemAPIMock from "./mockApis/redeemMock";
import VaultsAPIMock from "./mockApis/vaultsMock";
import StakeRelayerAPIMock from "./mockApis/stakedRelayerMock";

export class PolkaBTCAPIMock {
    public readonly vaults: VaultsAPIMock;
    public readonly issue: IssueAPIMock;
    public readonly redeem: RedeemAPIMock;
    public readonly stakeRelayer: StakeRelayerAPIMock;

    constructor(readonly api: ApiPromise, private account?: KeyringPair) {
        this.vaults = new VaultsAPIMock();
        this.issue = new IssueAPIMock();
        this.redeem = new RedeemAPIMock();
        this.stakeRelayer = new StakeRelayerAPIMock();
    }

    setAccount(account: KeyringPair): void {
        this.account = account;
        this.issue.setAccount(account);
        this.redeem.setAccount(account);
    }
}