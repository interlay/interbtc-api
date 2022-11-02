import {
    CollateralCurrencyExt,
    createSubstrateAPI,
    DefaultInterBtcApi,
    GovernanceCurrency,
    InterBtcApi,
    WrappedCurrency,
} from "@interlay/interbtc/index";
import {
    AssetRegistryAPI,
    DefaultAssetRegistryAPI,
    DefaultLoansAPI,
    InterbtcPrimitivesVaultId,
    LoansAPI,
} from "@interlay/interbtc/parachain";
import { getSS58Prefix, newVaultId } from "@interlay/interbtc/utils";
import { ApiPromise, Keyring } from "@polkadot/api";
import sinon from "sinon";
import { KeyringPair } from "@polkadot/keyring/types";
import {
    PARACHAIN_ENDPOINT,
    ESPLORA_BASE_PATH,
    VAULT_1_URI,
    VAULT_2_URI,
    VAULT_3_URI,
    VAULT_TO_BAN_URI,
    VAULT_TO_LIQUIDATE_URI,
} from "test/config";
import { getCorrespondingCollateralCurrenciesForTests, getAUSDForeignAsset } from "test/utils/helpers";

describe("Loans", () => {
    let vault_to_liquidate: KeyringPair;
    let vault_to_ban: KeyringPair;
    let vault_1: KeyringPair;
    let vault_1_ids: Array<InterbtcPrimitivesVaultId>;
    let vault_2: KeyringPair;
    let vault_3: KeyringPair;
    let api: ApiPromise;

    let wrappedCurrency: WrappedCurrency;
    let collateralCurrencies: Array<CollateralCurrencyExt>;
    let governanceCurrency: GovernanceCurrency;

    let interBtcAPI: InterBtcApi;
    let assetRegistry: AssetRegistryAPI;
    let loansAPI: LoansAPI;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        const ss58Prefix = getSS58Prefix(api);
        const keyring = new Keyring({ type: "sr25519", ss58Format: ss58Prefix });
        assetRegistry = new DefaultAssetRegistryAPI(api);
        loansAPI = new DefaultLoansAPI(api, assetRegistry);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", undefined, ESPLORA_BASE_PATH);

        wrappedCurrency = interBtcAPI.getWrappedCurrency();
        governanceCurrency = interBtcAPI.getGovernanceCurrency();

        collateralCurrencies = getCorrespondingCollateralCurrenciesForTests(governanceCurrency);
        const aUSD = await getAUSDForeignAsset(assetRegistry);
        if (aUSD !== undefined) {
            // also add aUSD collateral vaults if they exist (ie. the foreign asset exists)
            collateralCurrencies.push(aUSD);
        }

        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_1_ids = collateralCurrencies.map((collateralCurrency) =>
            newVaultId(api, vault_1.address, collateralCurrency, wrappedCurrency)
        );

        vault_2 = keyring.addFromUri(VAULT_2_URI);

        vault_3 = keyring.addFromUri(VAULT_3_URI);

        vault_to_ban = keyring.addFromUri(VAULT_TO_BAN_URI);
        vault_to_liquidate = keyring.addFromUri(VAULT_TO_LIQUIDATE_URI);
    });

    after(() => {
        return api.disconnect();
    });

    afterEach(() => {
        // discard any stubbed methods after each test
        sinon.restore();
    });
});
