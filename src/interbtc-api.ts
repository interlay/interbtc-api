import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { Signer } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { interBTC } from "@interlay/monetary-js";

import { ElectrsAPI, DefaultElectrsAPI } from "./external/electrs";
import { DefaultNominationAPI, NominationAPI } from "./parachain/nomination";
import { DefaultIssueAPI, IssueAPI } from "./parachain/issue";
import { DefaultOracleAPI, OracleAPI } from "./parachain/oracle";
import { DefaultRedeemAPI, RedeemAPI } from "./parachain/redeem";
import { DefaultRefundAPI, RefundAPI } from "./parachain/refund";
import { DefaultFeeAPI, FeeAPI } from "./parachain/fee";
import { DefaultVaultsAPI, VaultsAPI } from "./parachain/vaults";
import { DefaultSystemAPI, SystemAPI } from "./parachain/system";
import { DefaultTokensAPI, TokensAPI } from "./parachain/tokens";
import { FaucetClient } from "./clients";
import { BTCRelayAPI, DefaultBTCRelayAPI } from "./parachain/btc-relay";
import { DefaultReplaceAPI, ReplaceAPI } from "./parachain/replace";
import { Network, networks } from "bitcoinjs-lib";
import { BitcoinNetwork } from "./types/bitcoinTypes";
import { DefaultRewardsAPI, RewardsAPI } from "./parachain/rewards";
import { WrappedCurrency } from ".";

export * from "./factory";
export * from "./parachain/transaction";

export function getBitcoinNetwork(network: BitcoinNetwork = "mainnet"): Network {
    switch (network) {
        case "mainnet":
            return networks.bitcoin;
        case "testnet":
            return networks.testnet;
        default:
            return networks.regtest;
    }
}

export interface InterBTCAPI {
    readonly api: ApiPromise;
    readonly vaults: VaultsAPI;
    readonly issue: IssueAPI;
    readonly redeem: RedeemAPI;
    readonly refund: RefundAPI;
    readonly faucet: FaucetClient;
    readonly oracle: OracleAPI;
    readonly electrsAPI: ElectrsAPI;
    readonly btcRelay: BTCRelayAPI;
    readonly tokens: TokensAPI;
    readonly system: SystemAPI;
    readonly replace: ReplaceAPI;
    readonly fee: FeeAPI;
    readonly nomination: NominationAPI;
    readonly pools: RewardsAPI;
    setAccount(account: AddressOrPair, signer?: Signer): void;
    readonly account: AddressOrPair | undefined;
}

/**
 * @category InterBTC Bridge
 */
export class DefaultInterBTCAPI implements InterBTCAPI {
    public readonly vaults: VaultsAPI;
    public readonly issue: IssueAPI;
    public readonly redeem: RedeemAPI;
    public readonly refund: RefundAPI;
    public readonly faucet: FaucetClient;
    public readonly oracle: OracleAPI;
    public readonly electrsAPI: ElectrsAPI;
    public readonly btcRelay: BTCRelayAPI;
    public readonly tokens: TokensAPI;
    public readonly system: SystemAPI;
    public readonly replace: ReplaceAPI;
    public readonly fee: FeeAPI;
    public readonly nomination: NominationAPI;
    public readonly pools: RewardsAPI;

    constructor(
        readonly api: ApiPromise,
        network: BitcoinNetwork = "mainnet",
        wrappedCurrency: WrappedCurrency = interBTC,
        private _account?: AddressOrPair
    ) {
        const btcNetwork = getBitcoinNetwork(network);
        this.electrsAPI = new DefaultElectrsAPI(network);
        this.vaults = new DefaultVaultsAPI(api, btcNetwork, this.electrsAPI, wrappedCurrency, _account);
        this.faucet = new FaucetClient("");
        this.oracle = new DefaultOracleAPI(api, wrappedCurrency);
        this.refund = new DefaultRefundAPI(api, btcNetwork, this.electrsAPI, wrappedCurrency, _account);
        this.btcRelay = new DefaultBTCRelayAPI(api, this.electrsAPI);
        this.tokens = new DefaultTokensAPI(api, _account);
        this.system = new DefaultSystemAPI(api);
        this.replace = new DefaultReplaceAPI(api, btcNetwork, this.electrsAPI, wrappedCurrency, _account);
        this.fee = new DefaultFeeAPI(api, wrappedCurrency);
        this.issue = new DefaultIssueAPI(api, btcNetwork, this.electrsAPI, wrappedCurrency, _account);
        this.redeem = new DefaultRedeemAPI(api, btcNetwork, this.electrsAPI, wrappedCurrency, _account);
        this.nomination = new DefaultNominationAPI(api, btcNetwork, this.electrsAPI, wrappedCurrency, _account);
        this.pools = new DefaultRewardsAPI(api, btcNetwork, this.electrsAPI, wrappedCurrency);
    }

    setAccount(account: AddressOrPair, signer?: Signer): void {
        if (!(account as KeyringPair).sign && !signer) {
            throw new Error("signer must be passed if account is not a Keypair");
        }
        if (signer) {
            this.api.setSigner(signer);
        }
        this._account = account;
        this.vaults.setAccount(account);
        this.refund.setAccount(account);
        this.tokens.setAccount(account);
        this.replace.setAccount(account);
        this.issue.setAccount(account);
        this.redeem.setAccount(account);
        this.nomination.setAccount(account);
    }

    get account(): AddressOrPair | undefined {
        return this._account;
    }
}
