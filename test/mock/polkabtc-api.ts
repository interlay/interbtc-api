import { AddressOrPair } from "@polkadot/api/submittable/types";
import { ApiPromise } from "@polkadot/api";
import { Signer } from "@polkadot/api/types";

import {
    IssueAPI,
    RedeemAPI,
    VaultsAPI,
    StakedRelayerAPI,
    OracleAPI,
    BTCRelayAPI,
    CollateralAPI,
    TreasuryAPI,
    SystemAPI,
    ReplaceAPI,
    RefundAPI,
    FeeAPI,
} from "../../src/parachain";
import { BTCCoreAPI } from "../../src/external";
import { MockIssueAPI } from "./parachain/issue";
import { MockRedeemAPI } from "./parachain/redeem";
import { MockVaultsAPI } from "./parachain/vaults";
import { MockStakedRelayerAPI } from "./parachain/staked-relayer";
import { PolkaBTCAPI } from "../../src";
import { FaucetClient } from "../../src/clients";
import { MockOracleAPI } from "./parachain/oracle";
import { MockBTCCoreAPI } from "./external/btc-core";
import { MockBTCRelayAPI } from "./parachain/btc-relay";
import { MockCollateralAPI } from "./parachain/collateral";
import { MockTreasuryAPI } from "./parachain/treasury";
import { MockSystemAPI } from "./parachain/system";
import { MockReplaceAPI } from "./parachain/replace";
import { MockRefundAPI } from "./parachain/refund";
import { MockFeeAPI } from "./parachain/fee";

export default class MockPolkaBTCAPI implements PolkaBTCAPI {
    public readonly vaults: VaultsAPI;
    public readonly issue: IssueAPI;
    public readonly redeem: RedeemAPI;
    public readonly stakedRelayer: StakedRelayerAPI;
    public readonly faucet: FaucetClient;
    public readonly oracle: OracleAPI;
    public readonly btcCore: BTCCoreAPI;
    public readonly btcRelay: BTCRelayAPI;
    public readonly collateral: CollateralAPI;
    public readonly treasury: TreasuryAPI;
    public readonly system: SystemAPI;
    public readonly replace: ReplaceAPI;
    public readonly refund: RefundAPI;
    public readonly fee: FeeAPI;

    constructor(readonly api: ApiPromise, private _account?: AddressOrPair) {
        this.vaults = new MockVaultsAPI();
        this.issue = new MockIssueAPI();
        this.redeem = new MockRedeemAPI();
        this.stakedRelayer = new MockStakedRelayerAPI();
        this.faucet = new FaucetClient("");
        this.oracle = new MockOracleAPI();
        this.btcCore = new MockBTCCoreAPI();
        this.btcRelay = new MockBTCRelayAPI();
        this.collateral = new MockCollateralAPI();
        this.treasury = new MockTreasuryAPI();
        this.system = new MockSystemAPI();
        this.replace = new MockReplaceAPI();
        this.refund = new MockRefundAPI();
        this.fee = new MockFeeAPI();
    }

    setAccount(account: AddressOrPair, _signer?: Signer): void {
        this._account = account;
    }

    get account(): AddressOrPair | undefined {
        return this._account;
    }
}
