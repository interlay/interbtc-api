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
    pools: [
        {
            token1: { Token: "INTR" },
            dexFees: 15,
        },
    ],
    market: {
        collateralFactor: 630000,
        liquidationThreshold: 670000,
        reserveFactor: 200000,
        closeFactor: 500000,
        liquidateIncentive: "1100000000000000000",
        liquidateIncentiveReservedFactor: 25000,
        rateModel: {
            Jump: {
                baseRate: 0,
                jumpRate: "50000000000000000",
                fullRate: "500000000000000000",
                jumpUtilization: 900000
            }
        },
        state: "Pending",
        supplyCap: "10000000000",
        borrowCap: "10000000000",
        lendTokenId: { LendToken: 5 }, // NOTE: make sure this is free
        supplyIncentivesPerBlock: 0
    },
    vaultParams: {
        wrappedCurrency: { Token: "IBTC" },
        liquidationCollateral: "1450000000000000000",
        premiumRedeem: "1650000000000000000",
        secureCollateral: "1800000000000000000",
        minimumCollateral: "20000000000000",
        systemCollateralCeiling: "38000000000000000",
    }
};

function vaultRegistryCalls(
    api: ApiPromise,
    collateralCurrency: { ForeignAsset: number },
) {
    const {
        wrappedCurrency,
        liquidationCollateral,
        premiumRedeem,
        secureCollateral,
        minimumCollateral,
        systemCollateralCeiling
    } = NEW_ASSET.vaultParams;
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

    allCalls.push(
        ...[
            paraApi.tx.loans.addMarket(currencyId, NEW_ASSET.market),
            paraApi.tx.loans.activateMarket(currencyId)
        ]
    );

    allCalls.push(...vaultRegistryCalls(paraApi, currencyId));

    const batched = paraApi.tx.utility.batchAll(allCalls);

    const title = `Register ${NEW_ASSET.metadata.symbol}`;
    printDiscordProposal(title, batched, parachainEndpoint, paraApi);

    await paraApi.disconnect();
}
