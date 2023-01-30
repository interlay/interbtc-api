/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { ApiPromise, Keyring } from "@polkadot/api";
import { DefaultTransactionAPI } from "../src/parachain";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { XcmVersionedMultiLocation } from "@polkadot/types/lookup";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { assert } from "console";
import { isForeignAsset } from "../src";
import { BN } from "bn.js";

const readline = require("readline");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const args = yargs(hideBin(process.argv))
    .option("parachain-endpoint", {
        description: "The wss url of the parachain",
        type: "string",
    })
    .option("with-defaults-of", {
        description: "Which default values to use",
        choices: ['testnet-kintsugi'],
    })
    .option("clients-url", {
        description: "Url of the clients, without the client-name. E.g. https://github.com/interlay/interbtc-clients/releases/download/1.17.6/",
        demandOption: true,
    })
    .argv;

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

function constructLendingSetup(api: ApiPromise) {
    const addMarkets = [
        api.tx.loans.addMarket(
            {
                Token: 'KBTC'
            },
            { 
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
                supplyCap: "2000000000",
                borrowCap: "2000000000",
                lendTokenId: {LendToken: 1} 
            }
        ), api.tx.loans.addMarket(
            {
                Token: 'KSM'
            },
            { 
                collateralFactor: 540000,
                liquidationThreshold: 610000,
                reserveFactor: 200000,
                closeFactor: 500000,
                liquidateIncentive: "1100000000000000000",
                liquidateIncentiveReservedFactor: 25000,
                rateModel: {
                    Jump: {
                        baseRate: 0,
                        jumpRate: "150000000000000000",
                        fullRate: "400000000000000000",
                        jumpUtilization: 900000
                    }
                },
                state: "Pending",
                supplyCap: "30000000000000000",
                borrowCap: "30000000000000000",
                lendTokenId: {LendToken: 2} 
            }
        ), api.tx.loans.addMarket(
            {
                ForeignAsset: 1 // usdt
            },
            { 
                collateralFactor: 650000,
                liquidationThreshold: 690000,
                reserveFactor: 200000,
                closeFactor: 500000,
                liquidateIncentive: "1100000000000000000",
                liquidateIncentiveReservedFactor: 25000,
                rateModel: {
                    Jump: {
                        baseRate: 0,
                        jumpRate: "100000000000000000",
                        fullRate: "400000000000000000",
                        jumpUtilization: 900000
                    }
                },
                state: "Pending",
                supplyCap: "80000000000",
                borrowCap: "80000000000",
                lendTokenId: {LendToken: 3} 
            }
        ), api.tx.loans.addMarket(
            {
                ForeignAsset: 2 // movr
            },
            { 
                collateralFactor: 470000,
                liquidationThreshold: 560000,
                reserveFactor: 200000,
                closeFactor: 500000,
                liquidateIncentive: "1100000000000000000",
                liquidateIncentiveReservedFactor: 25000,
                rateModel: {
                    Jump: {
                        baseRate: 0,
                        jumpRate: "150000000000000000",
                        fullRate: "400000000000000000",
                        jumpUtilization: 900000
                    }
                },
                state: "Pending",
                supplyCap: "20000000000000000000000",
                borrowCap: "20000000000000000000000",
                lendTokenId: {LendToken: 4} 
            }
        )
    ];

    const underlyingTokens = [
        {Token: "KBTC"},
        {Token: "KSM"},
        {ForeignAsset: 1}, // usdt
        {ForeignAsset: 2}, // movr
    ];

    let addRewards = [api.tx.loans.addReward("100000000000000000000")];
    let activateMarketWithRewards = underlyingTokens.map((token) => { return [
        api.tx.loans.activateMarket(token),
        api.tx.loans.updateMarketRewardSpeed(token, 10, 10),
    ]}).reduce((x, y) => { return x.concat(y);});

    return addMarkets.concat(addRewards).concat(activateMarketWithRewards);
}

function constructFundingSetup(api: ApiPromise) {
    const tokens = [{Token: "KSM"}, {Token: "KINT"}];
    const faucetSetup = tokens.map((token) => {
        return api.tx.tokens.setBalance(
            "5DqzGaydetDXGya818gyuHA7GAjEWRsQN6UWNKpvfgq2KyM7",
            token,
            20000000000000,
            0
        );
    });
    const calls = faucetSetup.concat([
        api.tx.tokens.setBalance(
            "a3cgeH7D28bBsHY4hGLzxkMFUcFQmjGgDa2kmxg3D9Z6AyhtL", // treasury
            {Token: "KINT"},
            "1000000000000000000000000", //1e12 KINT
            0
        )
    ]);
    return calls;
}

function constructVaultRegistrySetup(api: ApiPromise) {
    const currencyPair = {
        collateral: {ForeignAsset: 3}, // lksm 
        wrapped: {Token: "KBTC"}
    };
    return [
        api.tx.vaultRegistry.setLiquidationCollateralThreshold(currencyPair, "1450000000000000000"),
        api.tx.vaultRegistry.setPremiumRedeemThreshold(currencyPair, "1650000000000000000"), 
        api.tx.vaultRegistry.setSecureCollateralThreshold(currencyPair, "1800000000000000000"), 
        api.tx.vaultRegistry.setMinimumCollateral(currencyPair.collateral, "20000000000000"), 
        api.tx.vaultRegistry.setSystemCollateralCeiling(currencyPair, "38000000000000000"), 
    ];
}

function constructAnnuitySetup(api: ApiPromise) {
    const blocksPerYears = 365 * 24 * 60 * 5; // 5 per minute
    const vaultAnnuity = [
        api.tx.tokens.setBalance(
            "a3cgeH7D3w3wu37yHx4VZeae4EUqNTw5RobTp5KvcMsrPLWJg", // vaultAnnuity
            {Token: "KINT"},
            new BN(102803978514).muln(blocksPerYears),
            0
        ),
        api.tx.vaultAnnuity.updateRewards(),
    ];
    const escrowAnnuity = [
        api.tx.tokens.setBalance(
            "a3cgeH7CzXoGgXh453eaSJRCvbbBKZN4mejwUVkic8efQUi5R", // escrowAnnuity
            {Token: "KINT"},
            new BN(47564687975).muln(blocksPerYears),
            0
        ),
        api.tx.escrowAnnuity.updateRewards(),
    ];
    return vaultAnnuity.concat(escrowAnnuity);
}

async function constructAmmSetup(api: ApiPromise) {
    const pools = [
        [{ Token: "KBTC" }, { Token: "KSM" }, 45_000],
        [{ Token: "KBTC" }, { ForeignAsset: 1 }, 40_000], // usdt
        [{ Token: "KBTC" }, { ForeignAsset: 2 }, 20_000], // movr
        [{ Token: "KINT" }, { ForeignAsset: 2 }, 35_000], // movr
    ];
    const basicPoolSetup = pools.map(([token1, token2, reward]) => {
            return [
                api.tx.zenlinkProtocol.createPair(token1, token2),
                api.tx.farming.updateRewardSchedule(
                { LpToken: [token1, token2] },
                { Token: "KINT" },
                60 * 24 * 7 * 12, // three months, reward period is per minute
                new BN(10).pow(new BN(12)).muln(reward as any),
            ),
            ];
    }).reduce((x, y) => { return x.concat(y);});

    const basePoolId = (await api.query.zenlinkStableAmm.nextPoolId() as any).toNumber(); // note: this is before the batch is executed

    const basePoolSetup = [
        api.tx.zenlinkStableAmm.createBasePool(
            [
                { ForeignAsset: 3 }, // LKSM
                { ForeignAsset: 4 }, // VKSM
                { ForeignAsset: 5 }, // SKSM
            ],
            [12, 12, 12], // decimals
            200, // amplification coefficient
            100_000_000, // max fee 1%
            0, // no admin fee
            Buffer.concat([
                Buffer.from("modl"), // 4 bytes
                Buffer.from("mod/trsy"), // 8 bytes
            ], 32), // treasury
            "LKSM+VKSM+SKSM" // currency symbol
        ), api.tx.farming.updateRewardSchedule(
            { StableLpToken: basePoolId },
            { Token: "KINT" },
            60 * 24 * 7 * 12, // three months, reward period is per minute
            new BN(10).pow(new BN(12)).muln(15_000),
        )
    ];

    const metaPoolSetup = [
        api.tx.zenlinkStableAmm.createMetaPool(
            [
                { StableLpToken: basePoolId }, // LKSM+VKSM+SKSM
                { Token: "KSM" },
            ],
            [12, 12], // decimals
            200, // amplification coefficient
            100_000_000, // max fee 1%
            0, // no admin fee
            Buffer.concat([
                Buffer.from("modl"), // 4 bytes
                Buffer.from("mod/trsy"), // 8 bytes
            ], 32), // treasury
            "(LKSM+VKSM+SKSM)+KSM" // currency symbol
        ), api.tx.farming.updateRewardSchedule(
            { StableLpToken: basePoolId + 1 },
            { Token: "KINT" },
            60 * 24 * 7 * 12, // three months, reward period is per minute
            new BN(10).pow(new BN(12)).muln(33_000),
        )
    ];

    return basicPoolSetup.concat(basePoolSetup).concat(metaPoolSetup);
}

function constructForeignAssetSetup(api: ApiPromise) {
    return [
        api.tx.assetRegistry.registerAsset(
            {
                decimals: 6,
                name: "Tether USD",
                symbol: "USDT", 
                existentialDeposit: 0,
                location: null,
                additional: { feePerSecond: 8153838, coingeckoId: "" }
            },
            1
        ), api.tx.assetRegistry.registerAsset(
            {
                decimals: 18,
                name: "Moonriver Token",
                symbol: "MOVR", 
                existentialDeposit: 0,
                location: null,
                additional: { feePerSecond: 0, coingeckoId: "" }
            },
            2
        ), api.tx.assetRegistry.registerAsset(
            {
                decimals: 12,
                name: "Liquid KSM",
                symbol: "LKSM", 
                existentialDeposit: 0,
                location: {
                    V1: {
                        parents: 1,
                        interior: {
                            X2: [
                                {
                                    Parachain: 2000
                                },
                                {
                                    GeneralKey: "0x0083"
                                }
                            ]
                        }
                    }
                    
                },
                additional: { feePerSecond: 233100000000, coingeckoId: "liquid-ksm" }
            },
           3
        ), api.tx.assetRegistry.registerAsset(
            {
                decimals: 12,
                name: "Voucher KSM",
                symbol: "VKSM", 
                existentialDeposit: 0,
                location: {
                    V1: {
                        parents: 1,
                        interior: {
                            X2: [
                                {
                                    Parachain: 2001
                                },
                                {
                                    GeneralKey: "0x0104"
                                }
                            ]
                        }
                    }
                    
                },
                additional: { feePerSecond: 233100000000, coingeckoId: "" }
            },
           4
        ), api.tx.assetRegistry.registerAsset(
            {
                decimals: 12,
                name: "Staked KSM",
                symbol: "SKSM", 
                existentialDeposit: 0,
                location: null,
                additional: { feePerSecond: 233100000000, coingeckoId: "" }
            },
           5
        )
    ];
}

// function constructClientsInfoSetup(api: ApiPromise) {
// }
function toUrl(extrinsic: SubmittableExtrinsic<"promise">, endpoint: string) {
    return "https://polkadot.js.org/apps/?rpc=" +
        encodeURIComponent(endpoint) +
        "#/extrinsics/decode/" +
        extrinsic.method.toHex();
}

async function setupParachain() {
    const paraApi = await createSubstrateAPI(args['parachain-endpoint']);

    let calls = [
        constructFundingSetup(paraApi),
        constructForeignAssetSetup(paraApi),
        constructLendingSetup(paraApi),
        constructVaultRegistrySetup(paraApi),
        constructAnnuitySetup(paraApi),
        await constructAmmSetup(paraApi),
    ].reduce((x, y) => { return x.concat(y);});

    const batched = paraApi.tx.utility.batchAll(calls);
    const sudo = paraApi.tx.sudo.sudo(batched.method.toHex());

    console.log(toUrl(sudo, args['parachain-endpoint']));

    await paraApi.disconnect();
}

async function main(): Promise<void> {
    await cryptoWaitReady();

    switch (args['with-defaults-of']) {
        case 'testnet-kintsugi':
            if (args['parachain-endpoint'] === undefined) {
                args['parachain-endpoint'] = "wss://api-dev-kintsugi.interlay.io/parachain";
            }
            break;
    }

    await setupParachain();
}

