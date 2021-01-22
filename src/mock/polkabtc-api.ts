import { AddressOrPair } from "@polkadot/api/submittable/types";
import { ApiPromise } from "@polkadot/api";
import { Signer } from "@polkadot/api/types";

import {
    IssueAPI,
    RedeemAPI,
    VaultsAPI,
    StakedRelayerAPI,
    OracleAPI,
    BTCCoreAPI,
    BTCRelayAPI,
    CollateralAPI,
    TreasuryAPI,
    SystemAPI,
    ReplaceAPI,
    RefundAPI,
} from "../apis";
import { MockIssueAPI } from "./apis/issue";
import { MockRedeemAPI } from "./apis/redeem";
import { MockVaultsAPI } from "./apis/vaults";
import { MockStakedRelayerAPI } from "./apis/staked-relayer";
import { PolkaBTCAPI } from "../polkabtc-api";
import { StakedRelayerClient } from "../http";
import { MockOracleAPI } from "./apis/oracle";
import { MockBTCCoreAPI } from "./apis/btc-core";
import { MockBTCRelayAPI } from "./apis/btc-relay";
import { MockCollateralAPI } from "./apis/collateral";
import { MockTreasuryAPI } from "./apis/treasury";
import { MockSystemAPI } from "./apis/system";
import { MockReplaceAPI } from "./apis/replace";
import { MockRefundAPI } from "./apis/refund";

export default class MockPolkaBTCAPI implements PolkaBTCAPI {
    public readonly vaults: VaultsAPI;
    public readonly issue: IssueAPI;
    public readonly redeem: RedeemAPI;
    public readonly stakedRelayer: StakedRelayerAPI;
    public readonly relayer: StakedRelayerClient;
    public readonly oracle: OracleAPI;
    public readonly btcCore: BTCCoreAPI;
    public readonly btcRelay: BTCRelayAPI;
    public readonly collateral: CollateralAPI;
    public readonly treasury: TreasuryAPI;
    public readonly system: SystemAPI;
    public readonly replace: ReplaceAPI;
    public readonly refund: RefundAPI;

    constructor(readonly api: ApiPromise, private _account?: AddressOrPair) {
        this.vaults = new MockVaultsAPI();
        this.issue = new MockIssueAPI();
        this.redeem = new MockRedeemAPI();
        this.stakedRelayer = new MockStakedRelayerAPI();
        this.relayer = new StakedRelayerClient("");
        this.oracle = new MockOracleAPI();
        this.btcCore = new MockBTCCoreAPI();
        this.btcRelay = new MockBTCRelayAPI();
        this.collateral = new MockCollateralAPI();
        this.treasury = new MockTreasuryAPI();
        this.system = new MockSystemAPI();
        this.replace = new MockReplaceAPI();
        this.refund = new MockRefundAPI();
    }

    setAccount(account: AddressOrPair, _signer?: Signer): void {
        this._account = account;
    }

    get account(): AddressOrPair | undefined {
        return this._account;
    }
}
