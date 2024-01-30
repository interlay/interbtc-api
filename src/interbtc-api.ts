import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { Signer } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";

import { ElectrsAPI, DefaultElectrsAPI } from "./external/electrs";
import { DefaultNominationAPI, NominationAPI } from "./parachain/nomination";
import { DefaultIssueAPI, IssueAPI } from "./parachain/issue";
import { DefaultOracleAPI, OracleAPI } from "./parachain/oracle";
import { DefaultRedeemAPI, RedeemAPI } from "./parachain/redeem";
import { DefaultFeeAPI, FeeAPI } from "./parachain/fee";
import { DefaultVaultsAPI, VaultsAPI } from "./parachain/vaults";
import { DefaultSystemAPI, SystemAPI } from "./parachain/system";
import { DefaultTokensAPI, TokensAPI } from "./parachain/tokens";
import { FaucetClient } from "./clients";
import { BTCRelayAPI, DefaultBTCRelayAPI } from "./parachain/btc-relay";
import { DefaultReplaceAPI, ReplaceAPI } from "./parachain/replace";
import { Network, networks } from "bitcoinjs-lib";
import { BitcoinNetwork } from "./types/bitcoin";
import { DefaultRewardsAPI, RewardsAPI } from "./parachain/rewards";
import { DefaultTransactionAPI, TransactionAPI } from "./parachain/transaction";
import { GovernanceCurrency, WrappedCurrency } from "./types";
import { DefaultAssetRegistryAPI, DefaultEscrowAPI, DefaultLoansAPI, EscrowAPI, LoansAPI } from ".";
import { tokenSymbolToCurrency } from "./utils";
import { AssetRegistryAPI } from "./parachain/asset-registry";
import { Currency } from "@interlay/monetary-js";
import { AMMAPI, DefaultAMMAPI } from "./parachain/amm1";

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
    readonly assetRegistry: AssetRegistryAPI;
    readonly loans: LoansAPI;
    readonly amm: AMMAPI;
    readonly transaction: TransactionAPI;
    setAccount(account: AddressOrPair, signer?: Signer): void;
    removeAccount(): void;
    readonly account: AddressOrPair | undefined;
    getGovernanceCurrency(): GovernanceCurrency;
    getWrappedCurrency(): WrappedCurrency;
    getRelayChainCurrency(): Currency;
    disconnect(): Promise<void>;
}

/**
 * @category BTC Bridge
 */
export class DefaultInterBtcApi implements InterBtcApi {
    public readonly vaults: VaultsAPI;
    public readonly issue: IssueAPI;
    public readonly redeem: RedeemAPI;
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
    public readonly assetRegistry: AssetRegistryAPI;
    public readonly loans: LoansAPI;
    public readonly amm: AMMAPI;
    public readonly transaction: TransactionAPI;

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
        this.transaction = new DefaultTransactionAPI(api, _account);

        this.assetRegistry = new DefaultAssetRegistryAPI(api);
        this.oracle = new DefaultOracleAPI(api, wrappedCurrency);
        this.loans = new DefaultLoansAPI(api, wrappedCurrency, this.oracle);
        this.tokens = new DefaultTokensAPI(api);
        this.system = new DefaultSystemAPI(api);
        this.fee = new DefaultFeeAPI(api, this.oracle);
        this.rewards = new DefaultRewardsAPI(api, wrappedCurrency);
        this.escrow = new DefaultEscrowAPI(api, governanceCurrency, this.system);

        this.vaults = new DefaultVaultsAPI(
            api,
            this.electrsAPI,
            wrappedCurrency,
            governanceCurrency,
            this.tokens,
            this.oracle,
            this.fee,
            this.rewards,
            this.system,
            this.transaction,
        );
        this.faucet = new FaucetClient(api, "");
        this.btcRelay = new DefaultBTCRelayAPI(api);

        this.replace = new DefaultReplaceAPI(api, btcNetwork, this.electrsAPI, wrappedCurrency);
        this.issue = new DefaultIssueAPI(
            api,
            btcNetwork,
            this.electrsAPI,
            wrappedCurrency,
            this.vaults,
            this.transaction,
        );
        this.redeem = new DefaultRedeemAPI(
            api,
            btcNetwork,
            this.electrsAPI,
            wrappedCurrency,
            this.vaults,
            this.oracle,
            this.transaction,
            this.system,
        );
        this.nomination = new DefaultNominationAPI(api, wrappedCurrency, this.vaults, this.rewards);
        this.amm = new DefaultAMMAPI(api, this.tokens);
    }

    setAccount(account: AddressOrPair, signer?: Signer): void {
        if (!(account as KeyringPair).sign && !signer) {
            throw new Error("signer must be passed if account is not a Keypair");
        }
        if (signer) {
            this.api.setSigner(signer);
        }
        this.transaction.setAccount(account);
    }

    removeAccount(): void {
        this.transaction.removeAccount();
    }

    get account(): AddressOrPair | undefined {
        return this.transaction.getAccount();
    }

    public getGovernanceCurrency(): GovernanceCurrency {
        const currencyId = this.api.consts.currency.getNativeCurrencyId;
        // beware: this call will throw if the native currency is not a token!
        return tokenSymbolToCurrency(currencyId.asToken);
    }

    public getWrappedCurrency(): WrappedCurrency {
        const currencyId = this.api.consts.currency.getWrappedCurrencyId;
        // beware: this call will throw if the wrapped currency is not a token!
        return tokenSymbolToCurrency(currencyId.asToken);
    }

    public getRelayChainCurrency(): Currency {
        const currencyId = this.api.consts.currency.getRelayChainCurrencyId;
        // beware: this call will throw if the currency is not a token!
        return tokenSymbolToCurrency(currencyId.asToken);
    }

    public disconnect(): Promise<void> {
        return this.api.disconnect();
    }
}
