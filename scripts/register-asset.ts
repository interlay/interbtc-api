/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { ApiPromise } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { printDiscordProposal } from "./util";

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

const NEW_ASSET = {
    // this is the metadata for the new asset to register
    metadata: {
        decimals: 6,
        name: "USD Coin",
        symbol: "USDC",
        existentialDeposit: 0,
        location: {
            V3: {
                parents: 1,
                interior: {
                    X3: [
                        {
                            Parachain: 1000
                        },
                        {
                            PalletInstance: 50
                        },
                        {
                            GeneralIndex: 1337
                        }
                    ]
                }
            }
        },
        additional: { feePerSecond: 11888560, coingeckoId: "usd-coin" }
    },
    // adds `DexGeneral` pools (uniswap v2) for the asset
    pools: [
        {
            token1: { Token: "INTR" },
            dexFees: 100,
        },
    ],
    // adds a market to the `Loans` pallet
    market: {
        collateralFactor: 650000, // 65%
        liquidationThreshold: 870000, // 87%
        reserveFactor: 100000,  // 10%
        closeFactor: 500000, // 50%
        liquidateIncentive: "1100000000000000000", // 110%
        liquidateIncentiveReservedFactor: 0,
        rateModel: {
            Jump: {
                baseRate: 0,
                jumpRate: "100000000000000000", // 10%
                fullRate: "500000000000000000", // 50%
                jumpUtilization: 800000 // 80%
            }
        },
        state: "Pending",
        supplyCap: "2000000000000", // 2,000,000
        borrowCap: "2000000000000", // 2,000,000
        lendTokenId: { LendToken: 5 }, // NOTE: make sure this is free
        supplyIncentivesPerBlock: 0
    },
    // adds vault thresholds for asset
    vaultParams: {
        wrappedCurrency: { Token: "IBTC" },
        liquidationCollateral: "1050000000000000000", // 105%
        premiumRedeem: "1150000000000000000", // 115%
        secureCollateral: "1550000000000000000", // 155%
        minimumCollateral: "1550000000", // 1550 USDC
        systemCollateralCeiling: "2000000000000", // 2,000,000 USDC
    },
    // adds vault thresholds for `Loans` asset
    lendVaultParams: {
        wrappedCurrency: { Token: "IBTC" },
        liquidationCollateral: "1050000000000000000", // 105%
        premiumRedeem: "1150000000000000000", // 115%
        secureCollateral: "1550000000000000000", // 155%
        minimumCollateral: "77500000000", // 1550 USDC = 77,500 qUSDC
        systemCollateralCeiling: "75000000000000", // 1,500,000 USDC = 75,000,000 qUSDC
    }
};

function vaultRegistryCalls(
    api: ApiPromise,
    collateralCurrency: { ForeignAsset: number } | { LendToken: number },
    vaultParams: any,
) {
    const {
        wrappedCurrency,
        liquidationCollateral,
        premiumRedeem,
        secureCollateral,
        minimumCollateral,
        systemCollateralCeiling
    } = vaultParams;
    const currencyPair = {
        collateral: collateralCurrency,
        wrapped: wrappedCurrency,
    };
    return [
        api.tx.vaultRegistry.setLiquidationCollateralThreshold(currencyPair, liquidationCollateral),
        api.tx.vaultRegistry.setPremiumRedeemThreshold(currencyPair, premiumRedeem),
        api.tx.vaultRegistry.setSecureCollateralThreshold(currencyPair, secureCollateral),
        api.tx.vaultRegistry.setMinimumCollateral(currencyPair.collateral, minimumCollateral),
        api.tx.vaultRegistry.setSystemCollateralCeiling(currencyPair, systemCollateralCeiling),
    ];
}

async function main(): Promise<void> {
    await cryptoWaitReady();

    const parachainEndpoint = "wss://api.interlay.io/parachain";
    const paraApi = await createSubstrateAPI(parachainEndpoint);

    const lastAssetId = await paraApi.query.assetRegistry.lastAssetId();
    const nextAssetId = lastAssetId.toNumber() + 1;
    const currencyId = { ForeignAsset: nextAssetId };

    const allCalls = [
        paraApi.tx.assetRegistry.registerAsset(NEW_ASSET.metadata, nextAssetId)
    ];

    allCalls.push(...NEW_ASSET.pools.map(pool =>
        paraApi.tx.dexGeneral.createPair(currencyId, pool.token1, pool.dexFees)
    ))

    allCalls.push(...[
        paraApi.tx.loans.addMarket(currencyId, NEW_ASSET.market),
        paraApi.tx.loans.activateMarket(currencyId)
    ]);

    allCalls.push(...vaultRegistryCalls(paraApi, currencyId, NEW_ASSET.vaultParams));

    const lendCurrencyId = NEW_ASSET.market.lendTokenId;
    allCalls.push(...vaultRegistryCalls(paraApi, lendCurrencyId, NEW_ASSET.lendVaultParams));

    const batched = paraApi.tx.utility.batchAll(allCalls);

    const title = `Register ${NEW_ASSET.metadata.symbol}`;
    printDiscordProposal(title, batched, parachainEndpoint, paraApi);

    await paraApi.disconnect();
}
