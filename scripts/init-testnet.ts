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
import fetch from "cross-fetch";

const readline = require("readline");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const treasuryAccount = Buffer.concat([
    Buffer.from("modl"), // 4 bytes
    Buffer.from("mod/trsy"), // 8 bytes
], 32);

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

type Currency = { Token: any } | { ForeignAsset: any } | { LendToken: any };
type LoansMarket = { collateralFactor?: any; liquidationThreshold?: any; reserveFactor?: any; closeFactor?: any; liquidateIncentive?: any; liquidateIncentiveReservedFactor?: any; rateModel?: any; state?: any; supplyCap?: any; borrowCap?: any; lendTokenId?: any };

function constructLendingSetup(api: ApiPromise) {
    const markets: [Currency, LoansMarket][] = [
        [
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
                lendTokenId: { LendToken: 1 }
            }
        ], [
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
                lendTokenId: { LendToken: 2 }
            }
        ], [
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
                lendTokenId: { LendToken: 3 }
            }
        ], [
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
                lendTokenId: { LendToken: 4 }
            }
        ],
    ];

    const addMarkets = markets.map(([token, market]) => {
        return api.tx.loans.addMarket(token, market);
    });

    const addRewards = [
        api.tx.utility.dispatchAs(
            { system: { Signed: treasuryAccount } },
            api.tx.loans.addReward("100000000000000000000")
        )
    ];

    const activateMarketWithRewards = markets.map(([token, _]) => {
        return [
            api.tx.loans.activateMarket(token),
            api.tx.loans.updateMarketRewardSpeed(token, 10, 10),
        ]
    }).flat();

    const addSupply = markets.map(([token, market]) => {
        return api.tx.utility.dispatchAs(
            { system: { Signed: treasuryAccount } },
            api.tx.loans.mint(token, new BN(market.supplyCap).divn(10))
        )
    }).flat();

    return [addMarkets, addRewards, activateMarketWithRewards, addSupply].flat()
}

function constructFundingSetup(api: ApiPromise) {
    const tokens = [
        { Token: "KSM" },
        { Token: "KINT" },
        { ForeignAsset: 1 }, // USDT
        { ForeignAsset: 2 }, // MOVR
        { ForeignAsset: 3 }, // LKSM
        { ForeignAsset: 4 }, // VKSM
        { ForeignAsset: 5 }, // SKSM
    ];
    const fundNormalTokens = tokens.map((token) => {
        return [
            api.tx.tokens.setBalance(
                // faucet account
                "5DqzGaydetDXGya818gyuHA7GAjEWRsQN6UWNKpvfgq2KyM7",
                token,
                new BN(2).pow(new BN(100)), // note: we can't set 2^128 - 1 because that would overflow total issuance
                0
            ),
            api.tx.tokens.setBalance(
                treasuryAccount,
                token,
                new BN(2).pow(new BN(100)),
                0
            )
        ]
    }).flat();

    // lower kbtc amounts so UI deals with it better
    const fundKbtc = [
        api.tx.tokens.setBalance(
            // faucet account
            "5DqzGaydetDXGya818gyuHA7GAjEWRsQN6UWNKpvfgq2KyM7",
            { Token: "KBTC" },
            new BN(4336).mul(new BN(10).pow(new BN(8))), // $100 million worth of KBTC 
            0
        ),
        api.tx.tokens.setBalance(
            treasuryAccount,
            { Token: "KBTC" },
            new BN(4336).mul(new BN(10).pow(new BN(8))), // $100 million worth of KBTC 
            0
        )
    ];

    return [fundNormalTokens, fundKbtc].flat();
}

function constructVaultRegistrySetup(api: ApiPromise) {
    const currencyPair = {
        collateral: { ForeignAsset: 3 }, // LKSM 
        wrapped: { Token: "KBTC" }
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
            Buffer.concat([
                Buffer.from("modl"), // 4 bytes
                Buffer.from("vlt/annu"), // 8 bytes
            ], 32),
            { Token: "KINT" },
            new BN(102803978514).muln(blocksPerYears),
            0
        ),
        api.tx.vaultAnnuity.updateRewards(),
    ];
    const escrowAnnuity = [
        api.tx.tokens.setBalance(
            Buffer.concat([
                Buffer.from("modl"), // 4 bytes
                Buffer.from("esc/annu"), // 8 bytes
            ], 32),
            { Token: "KINT" },
            new BN(47564687975).muln(blocksPerYears),
            0
        ),
        api.tx.escrowAnnuity.updateRewards(),
    ];
    return vaultAnnuity.concat(escrowAnnuity);
}

async function constructAmmSetup(api: ApiPromise) {
    // workaround for broken is_exists check - TODO: remove once fixed.
    // see https://github.com/interlay/interbtc/blob/1a1afa90228f37c9ade4acbda8275c2f5cfe85ce/parachain/runtime/testnet-kintsugi/src/zenlink.rs#L43
    const isExistsWorkaround = [
        { Token: "KBTC" }, // foreign assets also need issuance, but faucet already has those
    ].map((token) => {
        return api.tx.tokens.setBalance(
            "a3ckVDnZwjdBhkq1KJodZj3iCgYMseWfLA5fpqExuEpMy8Y5q", // root
            token,
            0,
            1
        )
    });

    const prices:Map<string, number> = new Map();
    prices.set(JSON.stringify({ Token: "KBTC" }), 22842.91);
    prices.set(JSON.stringify({ Token: "KSM" }), 36.05);
    prices.set(JSON.stringify({ Token: "KINT" }), 0.982574);
    prices.set(JSON.stringify({ ForeignAsset: 1 }), 1); // usdt
    prices.set(JSON.stringify({ ForeignAsset: 2 }), 8.94); // movr
    const decimals:Map<string, number> = new Map();
    decimals.set(JSON.stringify({ Token: "KBTC" }), 8);
    decimals.set(JSON.stringify({ Token: "KSM" }), 12);
    decimals.set(JSON.stringify({ Token: "KINT" }), 12);
    decimals.set(JSON.stringify({ ForeignAsset: 1 }), 6); // usdt
    decimals.set(JSON.stringify({ ForeignAsset: 2 }), 18); // movr
    
    const pools: [{ Token: any; }, { Token: any; } | { ForeignAsset: any; }, number, number][] = [
        [
            { Token: "KBTC" },
            { Token: "KSM" },
            45_000,
            500_000, // liquidity in usd
        ],
        [
            { Token: "KBTC" },
            { ForeignAsset: 1 }, // USDT
            40_000,
            400_000, // liquidity in usd
        ],
        [
            { Token: "KBTC" },
            { ForeignAsset: 2 }, // MOVR
            20_000,
            175_000,  // liquidity in usd
        ],
        [
            { Token: "KINT" },
            { ForeignAsset: 2 }, // MOVR
            35_000,
            150_000,  // liquidity in usd
        ],
    ];


    const basicPoolSetup = pools.map(([token0, token1, reward, liquidity]) => {
        // calculate liquidity amounts
        let decimals0 = new BN(decimals.get(JSON.stringify(token0)) as number);
        let price0 = prices.get(JSON.stringify(token0)) as number;
        let liquidity0 = new BN(liquidity/2).mul(new BN(10).pow(decimals0)).divn(price0); 

        let decimals1 = new BN(decimals.get(JSON.stringify(token1)) as number);
        let price1 = prices.get(JSON.stringify(token1)) as number;
        let liquidity1 = new BN(liquidity/2).mul(new BN(10).pow(decimals1)).divn(price1); 
        
        return [
            api.tx.dexGeneral.createPair(token0, token1),
            api.tx.farming.updateRewardSchedule(
                { LpToken: [token0, token1] },
                { Token: "KINT" },
                60 * 24 * 7 * 12, // three months, reward period is per minute
                new BN(10).pow(new BN(12)).muln(reward as any),
            ),
            api.tx.utility.dispatchAs(
                { system: { Signed: treasuryAccount } },
                api.tx.dexGeneral.addLiquidity(
                    token0,
                    token1,
                    liquidity0, // amount0Desired
                    liquidity1, // amount1Desired
                    0, // amount0Min
                    0, // amount0Min
                    new BN(4294967295), // deadline
                ),
            )
        ];
    }).flat();

    // note: this is before the batch is executed
    const basePoolId = (await api.query.dexStable.nextPoolId() as any).toNumber();
    const basePoolSetup = [
        api.tx.dexStable.createBasePool(
            [
                { ForeignAsset: 3 }, // LKSM
                { ForeignAsset: 4 }, // VKSM
                { ForeignAsset: 5 }, // SKSM
            ],
            [12, 12, 12], // decimals
            200, // amplification coefficient
            100_000_000, // max fee 1%
            0, // no admin fee
            treasuryAccount,
            "LKSM+VKSM+SKSM" // currency symbol
        ),
        api.tx.farming.updateRewardSchedule(
            { StableLpToken: basePoolId },
            { Token: "KINT" },
            60 * 24 * 7 * 12, // three months, reward period is per minute
            new BN(10).pow(new BN(12)).muln(15_000),
        ),
        api.tx.utility.dispatchAs(
            { system: { Signed: treasuryAccount } },
            api.tx.dexStable.addLiquidity(
                basePoolId,
                [
                    "20000000000000", // 20 LKSM
                    "20000000000000", // 20 VKSM
                    "20000000000000", // 20 SKSM
                ],
                0, // min mint amount
                treasuryAccount, // recipient
                new BN(4294967295), // deadline
            ),
        )
    ];

    const metaPoolId = basePoolId + 1;
    const metaPoolSetup = [
        api.tx.dexStable.createMetaPool(
            [
                { Token: "KSM" },
                { StableLpToken: basePoolId }, // LKSM+VKSM+SKSM
            ],
            [12, 18], // decimals
            200, // amplification coefficient
            100_000_000, // max fee 1%
            0, // no admin fee
            treasuryAccount,
            "KSM+(LKSM+VKSM+SKSM)" // currency symbol
        ),
        api.tx.farming.updateRewardSchedule(
            { StableLpToken: metaPoolId },
            { Token: "KINT" },
            60 * 24 * 7 * 12, // three months, reward period is per minute
            new BN(10).pow(new BN(12)).muln(33_000),
        ),
        api.tx.utility.dispatchAs(
            { system: { Signed: treasuryAccount } },
            api.tx.dexStable.addLiquidity(
                metaPoolId,
                [
                    "10000000000000", // 10 KSM
                    "80000000000000000000", // 80 LKSM
                ],
                0, // min mint amount
                treasuryAccount, // recipient
                new BN(4294967295), // deadline
            ),
        )
    ];

    return isExistsWorkaround.concat(basicPoolSetup).concat(basePoolSetup).concat(metaPoolSetup);
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
                additional: { feePerSecond: 8153838, coingeckoId: "tether" }
            },
            1
        ), api.tx.assetRegistry.registerAsset(
            {
                decimals: 18,
                name: "Moonriver Token",
                symbol: "MOVR",
                existentialDeposit: 0,
                location: null,
                additional: { feePerSecond: 0, coingeckoId: "moonriver" }
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
                additional: { feePerSecond: 233100000000, coingeckoId: "voucher-ksm" }
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

async function constructClientsInfoSetup(api: ApiPromise, baseUrl: String) {
    const checksumFile = await fetch(baseUrl + 'sha256sums.txt')
        .then(res => {
            if (res.status >= 400) {
                throw new Error("Bad response from server");
            }
            return res.text();
        });

    const re = /([a-f0-9]+)\s*[.]\/(([a-z]+)-parachain-metadata-kintsugi-testnet)/g;
    let matches = []
    let match;
    while ((match = re.exec(checksumFile)) !== null) {
        matches.push([match[1], match[2], match[3]]);
    }

    return matches.map(([checksum, fullFileName, clientName]) => {
        return api.tx.clientsInfo.setCurrentClientRelease(
            clientName,
            {
                uri: baseUrl + fullFileName,
                checksum: "0x" + checksum,
            }
        )
    });
}

function toUrl(extrinsic: SubmittableExtrinsic<"promise">, endpoint: string) {
    return "https://polkadot.js.org/apps/?rpc=" +
        encodeURIComponent(endpoint) +
        "#/extrinsics/decode/" +
        extrinsic.method.toHex();
}

async function setupParachain() {
    const paraApi = await createSubstrateAPI(args['parachain-endpoint']);

    let calls = [
        await constructClientsInfoSetup(paraApi, args["clients-url"]),
        constructForeignAssetSetup(paraApi),
        constructFundingSetup(paraApi),
        constructLendingSetup(paraApi),
        constructVaultRegistrySetup(paraApi),
        constructAnnuitySetup(paraApi),
        await constructAmmSetup(paraApi),
    ].flat();

    const batched = paraApi.tx.utility.batchAll(calls);
    const sudo = paraApi.tx.sudo.sudo(batched.method.toHex());

    console.log(toUrl(sudo, args['parachain-endpoint']));

    await paraApi.disconnect();
}

async function main(): Promise<void> {
    if (!args["clients-url"].endsWith("/")) {
        throw new Error("clients-url needs to end with `/`, e.g. https://github.com/interlay/interbtc-clients/releases/download/1.19.2/");
    }

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


