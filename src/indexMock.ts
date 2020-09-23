import IssueAPIMock from "./mockApis/issueMock";
import RedeemAPIMock from "./mockApis/redeemMock";
import VaultsAPIMock from "./mockApis/vaultsMock";
import StakedRelayerAPIMock from "./mockApis/stakedRelayerMock";

export class PolkaBTCAPIMock {
    public readonly vaults: VaultsAPIMock;
    public readonly issue: IssueAPIMock;
    public readonly redeem: RedeemAPIMock;
    public readonly stakedRelayer: StakedRelayerAPIMock;

    constructor() {
        this.vaults = new VaultsAPIMock();
        this.issue = new IssueAPIMock();
        this.redeem = new RedeemAPIMock();
        this.stakedRelayer = new StakedRelayerAPIMock();
    }
}