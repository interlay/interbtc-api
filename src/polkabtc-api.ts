import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { Signer } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { BTCCoreAPI, DefaultBTCCoreAPI } from "./apis/btc-core";
import { DefaultIssueAPI, IssueAPI } from "./apis/issue";
import { DefaultOracleAPI, OracleAPI } from "./apis/oracle";
import { DefaultRedeemAPI, RedeemAPI } from "./apis/redeem";
import { DefaultRefundAPI, RefundAPI } from "./apis/refund";
import { DefaultStakedRelayerAPI, StakedRelayerAPI } from "./apis/staked-relayer";
import { DefaultVaultsAPI, VaultsAPI } from "./apis/vaults";
import { DefaultSystemAPI, SystemAPI } from "./apis/system";
import { DefaultCollateralAPI, CollateralAPI } from "./apis/collateral";
import { DefaultTreasuryAPI, TreasuryAPI } from "./apis/treasury";
import { StakedRelayerClient } from "./http";
import { BTCRelayAPI, DefaultBTCRelayAPI } from "./apis/btc-relay";
import { DefaultReplaceAPI, ReplaceAPI } from "./apis/replace";
import { Network, networks } from "bitcoinjs-lib";

export * from "./factory";

function getBitcoinNetwork(network: string = "mainnet"): Network {
    switch (network) {
    case "mainnet":
        return networks.bitcoin;
    case "testnet":
        return networks.testnet;
    default:
        return networks.regtest;
    }
}

export interface PolkaBTCAPI {
    readonly api: ApiPromise;
    readonly vaults: VaultsAPI;
    readonly issue: IssueAPI;
    readonly redeem: RedeemAPI;
    readonly refund: RefundAPI;
    readonly stakedRelayer: StakedRelayerAPI;
    readonly relayer: StakedRelayerClient;
    readonly oracle: OracleAPI;
    readonly btcCore: BTCCoreAPI;
    readonly btcRelay: BTCRelayAPI;
    readonly collateral: CollateralAPI;
    readonly treasury: TreasuryAPI;
    readonly system: SystemAPI;
    readonly replace: ReplaceAPI;
    setAccount(account: AddressOrPair, signer?: Signer): void;
    readonly account: AddressOrPair | undefined;
}

export class DefaultPolkaBTCAPI implements PolkaBTCAPI {
    public readonly vaults: VaultsAPI;
    public readonly issue: IssueAPI;
    public readonly redeem: RedeemAPI;
    public readonly refund: RefundAPI;
    public readonly stakedRelayer: StakedRelayerAPI;
    public readonly relayer: StakedRelayerClient;
    public readonly oracle: OracleAPI;
    public readonly btcCore: BTCCoreAPI;
    public readonly btcRelay: BTCRelayAPI;
    public readonly collateral: CollateralAPI;
    public readonly treasury: TreasuryAPI;
    public readonly system: SystemAPI;
    public readonly replace: ReplaceAPI;

    constructor(readonly api: ApiPromise, network: string = "mainnet", private _account?: AddressOrPair) {
        const btcNetwork = getBitcoinNetwork(network);
        this.vaults = new DefaultVaultsAPI(api, btcNetwork);
        this.issue = new DefaultIssueAPI(api, btcNetwork, _account);
        this.redeem = new DefaultRedeemAPI(api, btcNetwork, _account);
        this.refund = new DefaultRefundAPI(api, btcNetwork, _account);
        this.stakedRelayer = new DefaultStakedRelayerAPI(api, btcNetwork);
        this.relayer = new StakedRelayerClient("");
        this.oracle = new DefaultOracleAPI(api);
        this.btcCore = new DefaultBTCCoreAPI(network);
        this.btcRelay = new DefaultBTCRelayAPI(api, this.btcCore);
        this.collateral = new DefaultCollateralAPI(api);
        this.treasury = new DefaultTreasuryAPI(api);
        this.system = new DefaultSystemAPI(api);
        this.replace = new DefaultReplaceAPI(api, btcNetwork);
    }

    setAccount(account: AddressOrPair, signer?: Signer): void {
        if (!(account as KeyringPair).sign && !signer) {
            throw new Error("signer must be passed if account is not a Keypair");
        }
        if (signer) {
            this.api.setSigner(signer);
        }
        this._account = account;
        this.issue.setAccount(account);
        this.redeem.setAccount(account);
        this.collateral.setAccount(account);
    }

    get account(): AddressOrPair | undefined {
        return this._account;
    }
}
