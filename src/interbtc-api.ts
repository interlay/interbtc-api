import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { Signer } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { BitcoinUnit, Currency } from "@interlay/monetary-js";

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
import { DefaultTransactionAPI, TransactionAPI } from "./parachain/transaction";
import { currencyIdToMonetaryCurrency, GovernanceCurrency, GovernanceUnit, WrappedCurrency } from "./types";
import { DefaultEscrowAPI, EscrowAPI } from ".";

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

export interface InterBtcApi {
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
    readonly rewards: RewardsAPI;
    readonly escrow: EscrowAPI;
    setAccount(account: AddressOrPair, signer?: Signer): void;
    readonly account: AddressOrPair | undefined;
    getGovernanceCurrency(): Currency<GovernanceUnit>;
    getWrappedCurrency(): Currency<BitcoinUnit>;
}

/**
 * @category BTC Bridge
 */
export class DefaultInterBtcApi implements InterBtcApi {
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
    public readonly rewards: RewardsAPI;
    public readonly escrow: EscrowAPI;
    private transactionAPI: TransactionAPI;

    constructor(
        readonly api: ApiPromise,
        bitcoinNetwork: BitcoinNetwork = "mainnet",
        _account?: AddressOrPair,
        esploraNetwork?: string,
    ) {
        const wrappedCurrency = this.getWrappedCurrency() as WrappedCurrency;
        const governanceCurrency = this.getGovernanceCurrency() as GovernanceCurrency;

        const btcNetwork = getBitcoinNetwork(bitcoinNetwork);
        this.electrsAPI = new DefaultElectrsAPI(esploraNetwork || bitcoinNetwork);
        this.transactionAPI = new DefaultTransactionAPI(api, _account);

        this.tokens = new DefaultTokensAPI(api, this.transactionAPI);
        this.system = new DefaultSystemAPI(api, this.transactionAPI);
        this.oracle = new DefaultOracleAPI(api, wrappedCurrency, this.transactionAPI);
        this.fee = new DefaultFeeAPI(api, this.oracle);
        this.rewards = new DefaultRewardsAPI(api, wrappedCurrency, this.transactionAPI);
        this.escrow = new DefaultEscrowAPI(api, governanceCurrency, this.system, this.transactionAPI);

        this.vaults = new DefaultVaultsAPI(
            api,
            btcNetwork,
            this.electrsAPI,
            wrappedCurrency,
            governanceCurrency,
            this.tokens,
            this.oracle,
            this.fee,
            this.rewards,
            this.system,
            this.transactionAPI
        );
        this.faucet = new FaucetClient(api, "");
        this.refund = new DefaultRefundAPI(api, btcNetwork, this.electrsAPI, wrappedCurrency, this.transactionAPI);
        this.btcRelay = new DefaultBTCRelayAPI(api, this.electrsAPI);

        this.replace = new DefaultReplaceAPI(
            api,
            btcNetwork,
            this.electrsAPI,
            wrappedCurrency,
            this.fee,
            this.vaults,
            this.transactionAPI
        );
        this.issue = new DefaultIssueAPI(api, btcNetwork, this.electrsAPI, wrappedCurrency, this.fee, this.vaults, this.transactionAPI);
        this.redeem = new DefaultRedeemAPI(
            api,
            btcNetwork,
            this.electrsAPI,
            wrappedCurrency,
            this.vaults,
            this.oracle,
            this.transactionAPI
        );
        this.nomination = new DefaultNominationAPI(
            api,
            wrappedCurrency,
            this.vaults,
            this.rewards,
            this.transactionAPI
        );
    }

    setAccount(account: AddressOrPair, signer?: Signer): void {
        if (!(account as KeyringPair).sign && !signer) {
            throw new Error("signer must be passed if account is not a Keypair");
        }
        if (signer) {
            this.api.setSigner(signer);
        }
        this.transactionAPI.setAccount(account);
    }

    get account(): AddressOrPair | undefined {
        return this.transactionAPI.getAccount();
    }

    public getGovernanceCurrency(): Currency<GovernanceUnit> {
        const currencyId = this.api.consts.escrowRewards.getNativeCurrencyId;
        return currencyIdToMonetaryCurrency(currencyId);
    }

    public getWrappedCurrency(): Currency<BitcoinUnit> {
        const currencyId = this.api.consts.escrowRewards.getWrappedCurrencyId;
        return currencyIdToMonetaryCurrency(currencyId);
    }
}
