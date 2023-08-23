import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import {
    DefaultInterBtcApi,
    InterBtcApi,
    InterbtcPrimitivesVaultId,
    SLEEP_TIME_MS,
    newMonetaryAmount,
    sleep,
} from "../../../../../src/index";

import { MonetaryAmount } from "@interlay/monetary-js";
import { ApiTypes, AugmentedEvent } from "@polkadot/api/types";
import { BlockHash } from "@polkadot/types/interfaces";
import { FrameSystemEventRecord } from "@polkadot/types/lookup";
import { WrappedCurrency, currencyIdToMonetaryCurrency, newAccountId, newVaultId } from "../../../../../src";
import { createSubstrateAPI } from "../../../../../src/factory";
import { BitcoinCoreClient } from "../../../../../src/utils/bitcoin-core-client";
import { issueSingle } from "../../../../../src/utils/issueRedeem";
import {
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_PORT,
    BITCOIN_CORE_USERNAME,
    BITCOIN_CORE_WALLET,
    ESPLORA_BASE_PATH,
    PARACHAIN_ENDPOINT,
    USER_1_URI,
    VAULT_2_URI,
    VAULT_3_URI,
} from "../../../../config";
import { getCorrespondingCollateralCurrenciesForTests, submitExtrinsic } from "../../../../utils/helpers";

export const replaceTests = () => {
    describe("replace", () => {
        let api: ApiPromise;
        let bitcoinCoreClient: BitcoinCoreClient;
        let keyring: Keyring;
        let userAccount: KeyringPair;
        let vault_3: KeyringPair;
        let vault_3_ids: Array<InterbtcPrimitivesVaultId>;
        let vault_2: KeyringPair;
        let vault_2_ids: Array<InterbtcPrimitivesVaultId>;
        let interBtcAPI: InterBtcApi;
    
        let wrappedCurrency: WrappedCurrency;
    
        beforeAll(async () => {
            api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
            keyring = new Keyring({ type: "sr25519" });
            bitcoinCoreClient = new BitcoinCoreClient(
                BITCOIN_CORE_NETWORK,
                BITCOIN_CORE_HOST,
                BITCOIN_CORE_USERNAME,
                BITCOIN_CORE_PASSWORD,
                BITCOIN_CORE_PORT,
                BITCOIN_CORE_WALLET
            );
    
            userAccount = keyring.addFromUri(USER_1_URI);
            interBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);
            wrappedCurrency = interBtcAPI.getWrappedCurrency();
            const collateralCurrencies = getCorrespondingCollateralCurrenciesForTests(interBtcAPI.getGovernanceCurrency());
            vault_3 = keyring.addFromUri(VAULT_3_URI);
            vault_3_ids = collateralCurrencies.map((collateralCurrency) =>
                newVaultId(api, vault_3.address, collateralCurrency, wrappedCurrency)
            );
            vault_2 = keyring.addFromUri(VAULT_2_URI);
            vault_2_ids = collateralCurrencies.map((collateralCurrency) =>
                newVaultId(api, vault_2.address, collateralCurrency, wrappedCurrency)
            );
        });
    
        afterAll(async () => {
            await api.disconnect();
        });
    
        describe("request", () => {
            let dustValue: MonetaryAmount<WrappedCurrency>;
            let feesEstimate: MonetaryAmount<WrappedCurrency>;

            beforeAll(async () => {
                dustValue = await interBtcAPI.replace.getDustValue();
                feesEstimate = newMonetaryAmount(await interBtcAPI.oracle.getBitcoinFees(), wrappedCurrency, false);
            });

            // TODO: update test once replace protocol changes
            // https://github.com/interlay/interbtc/issues/823
            it("should request vault replacement", async () => {
                const interBtcAPI = new DefaultInterBtcApi(api, "regtest", vault_3, ESPLORA_BASE_PATH);
                for (const vault_3_id of vault_3_ids) {
                    // try to set value above dust + estimated fees
                    const issueAmount = dustValue.add(feesEstimate).mul(1.2);
                    const replaceAmount = dustValue;
                    await issueSingle(interBtcAPI, bitcoinCoreClient, userAccount, issueAmount, vault_3_id);
    
                    const collateralCurrency = await currencyIdToMonetaryCurrency(api, vault_3_id.currencies.collateral);
    
                    console.log(`Requesting vault replacement for ${replaceAmount.toString()}`);
                    const result = await submitExtrinsic(
                        interBtcAPI,
                        interBtcAPI.replace.request(replaceAmount, collateralCurrency),
                        false
                    );
                    const blockHash = result.status.asFinalized;
    
                    // query at included block since it may be accepted after
                    const apiAt = await api.at(blockHash);
                    const vault = await apiAt.query.vaultRegistry.vaults(vault_3_id);
                    const toBeReplaced = vault.unwrap().toBeReplacedTokens.toBn();
    
                    expect(toBeReplaced.toString()).toEqual(replaceAmount.toString(true));
    
                    // hacky way to subscribe to events from a previous height
                    // we can remove this once the request / accept flow is removed
                    // eslint-disable-next-line no-inner-declarations
                    async function waitForEvent(
                        blockHash: BlockHash,
                        expectedEvent: AugmentedEvent<ApiTypes>
                    ): Promise<[FrameSystemEventRecord, BlockHash]> {
                        let hash = blockHash;
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            const header = await api.rpc.chain.getHeader(hash);
                            const nextHash = await api.rpc.chain.getBlockHash(header.number.toNumber() + 1);
    
                            if (nextHash.isEmpty) {
                                await sleep(SLEEP_TIME_MS);
                                continue;
                            } else {
                                hash = nextHash;
                            }
    
                            const apiAt = await api.at(hash);
                            const events = await apiAt.query.system.events();
                            const foundEvent = events.find(({ event }) => expectedEvent.is(event));
                            if (foundEvent) {
                                return [foundEvent, hash];
                            }
                        }
                    }
    
                    const [acceptReplaceEvent, foundBlockHash] = await waitForEvent(
                        blockHash,
                        api.events.replace.AcceptReplace
                    );
                    const requestId = api.createType("Hash", acceptReplaceEvent.event.data[0]);
    
                    const replaceRequest = await interBtcAPI.replace.getRequestById(requestId, foundBlockHash);
                    expect(replaceRequest.oldVault.accountId.toString()).toEqual(vault_3_id.accountId.toString());
                }
            }, 1000 * 30);
    
            it(
                "should fail vault replace request if not having enough tokens",
                async () => {
                    const interBtcAPI = new DefaultInterBtcApi(api, "regtest", vault_2, ESPLORA_BASE_PATH);
                    const vault_2_id = vault_2_ids[0];
                    const collateralCurrency = await currencyIdToMonetaryCurrency(api, vault_2_id.currencies.collateral);
                    const currencyTicker = collateralCurrency.ticker;

                    // fetch tokens held by vault
                    const tokensInVault = await interBtcAPI.vaults.getIssuedAmount(
                        newAccountId(api, vault_2.address),
                        collateralCurrency
                    );

                    // make sure vault does not hold enough issued tokens to request a replace
                    const replaceAmount = tokensInVault.mul(2);

                    const replacePromise = submitExtrinsic(
                        interBtcAPI,
                        interBtcAPI.replace.request(replaceAmount, collateralCurrency),
                        false
                    );

                    try {
                        await expect(replacePromise).rejects.toThrow();
                    } catch(_) {
                        throw Error(`Expected replace request to fail with Error (${currencyTicker} vault)`);
                    }
                }
            );
        });

        describe("check values, and request statuses", () => {
            it("should getDustValue", async () => {
                const dustValue = await interBtcAPI.replace.getDustValue();
                expect(dustValue.toString()).toEqual("0.00001");
            }, 500);
        
            it("should getReplacePeriod", async () => {
                const replacePeriod = await interBtcAPI.replace.getReplacePeriod();
                expect(replacePeriod).toBeDefined();
            }, 500);
        
            it("should list replace request by a vault", async () => {
                const vault3Id = newAccountId(api, vault_3.address);
                const replaceRequests = await interBtcAPI.replace.mapReplaceRequests(vault3Id);
                replaceRequests.forEach((request) => {
                    expect(request.oldVault.accountId.toString()).toEqual(vault3Id.toString());
                });
            });
        });
    });
};
