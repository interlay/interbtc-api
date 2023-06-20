/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { ApiPromise } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { BN } from "bn.js";
import fetch from "cross-fetch";

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const args = yargs(hideBin(process.argv))
    .option("parachain-endpoint", {
        description: "The wss url of the parachain",
        type: "string",
    })
    .option("parachain-runtime", {
        description: "Which network to setup",
        choices: ['kintsugi', 'interlay'],
        demandOption: true,
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

const treasuryAccount = Buffer.concat([
    Buffer.from("modl"), // 4 bytes
    Buffer.from("mod/trsy"), // 8 bytes
], 32);

const FAUCET_ACCOUNT = "5DqzGaydetDXGya818gyuHA7GAjEWRsQN6UWNKpvfgq2KyM7";

type Currency = { Token: any } | { ForeignAsset: any } | { LendToken: any };

type ParachainGenesis = {
    relayChainCurrency: [Currency, number],
    wrappedCurrency: [Currency, number],
    nativeCurrency: [Currency, number],
    foreignAssets: {
        decimals: number;
        name: string;
        symbol: string;
        existentialDeposit: number;
        location: any;
        additional: {
            feePerSecond: number;
            coingeckoId: string;
        };
    }[],
    markets: [
        Currency,
        {
            collateralFactor?: any;
            liquidationThreshold?: any;
            reserveFactor?: any;
            closeFactor?: any;
            liquidateIncentive?: any;
            liquidateIncentiveReservedFactor?: any;
            rateModel?: any;
            state?: any;
            supplyCap?: any;
            borrowCap?: any;
            lendTokenId?: any;
        }
    ][],
    prices: Map<string, number>,
    pools: {
        token0: Currency,
        token1: Currency,
        reward: number,
        liquidity: number,
    }[],
    vaultParams: {
        collateralCurrency: Currency,
        liquidationCollateral: string,
        premiumRedeem: string,
        secureCollateral: string,
        minimumCollateral: string,
        systemCollateralCeiling: string,
    }[],
}

function decimals(currency: Currency, genesis: ParachainGenesis) {
    const currStr = JSON.stringify(currency);
    switch (currStr) {
        case JSON.stringify(genesis.relayChainCurrency[0]):
            return genesis.relayChainCurrency[1];
        case JSON.stringify(genesis.wrappedCurrency[0]):
            return genesis.wrappedCurrency[1];
        case JSON.stringify(genesis.nativeCurrency[0]):
            return genesis.nativeCurrency[1];
        default:
            return genesis.foreignAssets.find((_, i) =>
                JSON.stringify({ ForeignAsset: i + 1 }) == currStr
            )?.decimals
    }
}

const KINTSUGI_GENESIS: ParachainGenesis = {
    relayChainCurrency: [{ Token: "KSM" }, 12],
    wrappedCurrency: [{ Token: "KBTC" }, 8],
    nativeCurrency: [{ Token: "KINT" }, 12],
    foreignAssets: [
        {
            decimals: 6,
            name: "Tether USD",
            symbol: "USDT",
            existentialDeposit: 0,
            location: null,
            additional: { feePerSecond: 8153838, coingeckoId: "tether" },
        },
        {
            decimals: 18,
            name: "Moonriver Token",
            symbol: "MOVR",
            existentialDeposit: 0,
            location: null,
            additional: { feePerSecond: 0, coingeckoId: "moonriver" }
        },
        {
            decimals: 12,
            name: "Liquid KSM",
            symbol: "LKSM",
            existentialDeposit: 0,
            location: {
                V3: {
                    parents: 1,
                    interior: {
                        X2: [
                            {
                                Parachain: 2000
                            },
                            {
                                GeneralKey: {
                                    length: 2,
                                    data: "0x0083000000000000000000000000000000000000000000000000000000000000"
                                }
                            }
                        ]
                    }
                }
            },
            additional: { feePerSecond: 233100000000, coingeckoId: "liquid-ksm" }
        },
        {
            decimals: 12,
            name: "Voucher KSM",
            symbol: "VKSM",
            existentialDeposit: 0,
            location: {
                V3: {
                    parents: 1,
                    interior: {
                        X2: [
                            {
                                Parachain: 2001
                            },
                            {
                                GeneralKey: {
                                    length: 2,
                                    data: "0x0104000000000000000000000000000000000000000000000000000000000000"
                                }
                            }
                        ]
                    }
                }
            },
            additional: { feePerSecond: 233100000000, coingeckoId: "voucher-ksm" }
        },
        {
            decimals: 12,
            name: "Staked KSM",
            symbol: "SKSM",
            existentialDeposit: 0,
            location: null,
            additional: { feePerSecond: 233100000000, coingeckoId: "" }
        },
        {
            decimals: 18,
            name: "Ethereum",
            symbol: "ETH",
            existentialDeposit: 0,
            location: null,
            additional: { feePerSecond: 0, coingeckoId: "ethereum" }
        },
        {
            decimals: 12,
            name: "Acala Dollar",
            symbol: "AUSD",
            existentialDeposit: 0,
            location: null,
            additional: { feePerSecond: 0, coingeckoId: "acala-dollar" }
        },
        {
            decimals: 12,
            name: "Karura",
            symbol: "KAR",
            existentialDeposit: 0,
            location: null,
            additional: { feePerSecond: 0, coingeckoId: "karura" }
        },
    ],
    markets: [
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
                // 100 KBTC. Mainnet will be only 20 KBTC.
                supplyCap: "10000000000",
                borrowCap: "10000000000",
                lendTokenId: { LendToken: 1 }
            }
        ],
        [
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
                // 30,000 KSM
                supplyCap: "30000000000000000",
                borrowCap: "30000000000000000",
                lendTokenId: { LendToken: 2 }
            }
        ],
        [
            {
                ForeignAsset: 1 // USDT
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
                        jumpRate: "150000000000000000",
                        fullRate: "400000000000000000",
                        jumpUtilization: 900000
                    }
                },
                state: "Pending",
                // 800,000 USDT
                supplyCap: "800000000000",
                borrowCap: "800000000000",
                lendTokenId: { LendToken: 3 }
            }
        ],
        [
            {
                ForeignAsset: 2 // MOVR
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
                        jumpRate: "100000000000000000",
                        fullRate: "400000000000000000",
                        jumpUtilization: 900000
                    }
                },
                state: "Pending",
                // 10,000 MOVR
                supplyCap: "10000000000000000000000",
                borrowCap: "10000000000000000000000",
                lendTokenId: { LendToken: 4 }
            }
        ],
    ],
    prices: new Map([
        [JSON.stringify({ Token: "KBTC" }), 22842.91],
        [JSON.stringify({ Token: "KSM" }), 36.05],
        [JSON.stringify({ Token: "KINT" }), 0.982574],
        [JSON.stringify({ ForeignAsset: 1 }), 1], // USDT
        [JSON.stringify({ ForeignAsset: 2 }), 8.94], // MOVR
        [JSON.stringify({ ForeignAsset: 6 }), 1536.51], // ETH
        [JSON.stringify({ ForeignAsset: 7 }), 0.768930], // AUSD
        [JSON.stringify({ ForeignAsset: 8 }), 0.208364], // KAR
    ]),
    pools: [
        {
            token0: { Token: "KSM" },
            token1: { Token: "KBTC" },
            reward: 45_000,
            liquidity: 500_000, // liquidity in usd
        },
        {
            token0: { Token: "KBTC" },
            token1: { ForeignAsset: 1 }, // USDT
            reward: 40_000,
            liquidity: 400_000, // liquidity in usd
        },
        {
            token0: { Token: "KBTC" },
            token1: { ForeignAsset: 2 }, // MOVR
            reward: 20_000,
            liquidity: 175_000, // liquidity in usd
        },
        {
            token0: { Token: "KINT" },
            token1: { ForeignAsset: 2 }, // MOVR
            reward: 35_000,
            liquidity: 150_000, // liquidity in usd
        },
        {
            token0: { Token: "KBTC" },
            token1: { ForeignAsset: 6 }, // ETH
            reward: 35_000,
            liquidity: 300_000, // liquidity in usd
        },
        {
            token0: { ForeignAsset: 1 }, // USDT
            token1: { ForeignAsset: 7 }, // AUSD
            reward: 5_000,
            liquidity: 70_000, // liquidity in usd
        },
        {
            token0: { ForeignAsset: 1 }, // MOVR
            token1: { ForeignAsset: 8 }, // KAR
            reward: 30_000,
            liquidity: 100_000, // liquidity in usd
        },
    ],
    vaultParams: [
        {
            collateralCurrency: { ForeignAsset: 3 }, // LKSM
            liquidationCollateral: "1450000000000000000",
            premiumRedeem: "1650000000000000000",
            secureCollateral: "1800000000000000000",
            minimumCollateral: "20000000000000",
            systemCollateralCeiling: "38000000000000000",
        }
    ],
};

const INTERLAY_GENESIS: ParachainGenesis = {
    relayChainCurrency: [{ Token: "DOT" }, 10],
    wrappedCurrency: [{ Token: "IBTC" }, 8],
    nativeCurrency: [{ Token: "INTR" }, 8],
    foreignAssets: [
        {
            decimals: 10,
            name: "Liquid DOT",
            symbol: "LDOT",
            existentialDeposit: 0,
            location: null,
            additional: { feePerSecond: 20427078323, coingeckoId: "liquid-staking-dot" },
        },
        {
            decimals: 6,
            name: "Tether USD",
            symbol: "USDT",
            existentialDeposit: 0,
            location: null,
            additional: { feePerSecond: 11888560, coingeckoId: "tether" },
        },
    ],
    markets: [
        [
            {
                Token: 'IBTC'
            },
            {
                collateralFactor: 630000,
                liquidationThreshold: 670000,
                reserveFactor: 100000,
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
                // 100 IBTC. Mainnet will be only 30 IBTC.
                supplyCap: "10000000000",
                borrowCap: "10000000000",
                lendTokenId: { LendToken: 1 }
            }
        ],
        [
            {
                Token: 'DOT'
            },
            {
                collateralFactor: 670000,
                liquidationThreshold: 770000,
                reserveFactor: 100000,
                closeFactor: 500000,
                liquidateIncentive: "1100000000000000000",
                liquidateIncentiveReservedFactor: 25000,
                rateModel: {
                    Jump: {
                        baseRate: "50000000000000000",
                        jumpRate: "200000000000000000",
                        fullRate: "500000000000000000",
                        jumpUtilization: 800000
                    }
                },
                state: "Pending",
                // 1,000,000 DOT
                supplyCap: "10000000000000000",
                borrowCap: "10000000000000000",
                lendTokenId: { LendToken: 2 }
            }
        ],
        [
            {
                ForeignAsset: 2 // USDT
            },
            {
                collateralFactor: 670000,
                liquidationThreshold: 740000,
                reserveFactor: 100000,
                closeFactor: 500000,
                liquidateIncentive: "1100000000000000000",
                liquidateIncentiveReservedFactor: 25000,
                rateModel: {
                    Jump: {
                        baseRate: 0,
                        jumpRate: "100000000000000000",
                        fullRate: "500000000000000000",
                        jumpUtilization: 900000
                    }
                },
                state: "Pending",
                // 600,000 USDT
                supplyCap: "600000000000",
                borrowCap: "600000000000",
                lendTokenId: { LendToken: 3 }
            }
        ],
    ],
    prices: new Map([
        [JSON.stringify({ Token: "IBTC" }), 26_486.57],
        [JSON.stringify({ Token: "DOT" }), 5.02],
        [JSON.stringify({ Token: "INTR" }), 0.017907],
        [JSON.stringify({ ForeignAsset: 2 }), 1], // USDT
    ]),
    pools: [
        {
            token0: { Token: "IBTC" },
            token1: { Token: "DOT" },
            reward: 4_000_000,
            liquidity: 1_200_000,
        },
        {
            token0: { Token: "IBTC" },
            token1: { ForeignAsset: 2 }, // USDT
            reward: 3_800_000,
            liquidity: 2_000_000,
        },
        {
            token0: { Token: "DOT" },
            token1: { Token: "INTR" },
            reward: 3_500_000,
            liquidity: 500_000,
        },
    ],
    vaultParams: [
        {
            collateralCurrency: { ForeignAsset: 2 }, // USDT
            liquidationCollateral: "1350000000000000000",
            premiumRedeem: "1450000000000000000",
            secureCollateral: "1550000000000000000",
            minimumCollateral: "150000000",
            systemCollateralCeiling: "200000000000",
        }
    ],
}

function constructLendingSetup(api: ApiPromise, genesis: ParachainGenesis) {
    const addMarkets = genesis.markets.map(([token, market]) => {
        return api.tx.loans.addMarket(token, market);
    });

    // disabled: we test without incentives
    // const addRewards = [
    //     api.tx.utility.dispatchAs(
    //         { system: { Signed: treasuryAccount } },
    //         api.tx.loans.addReward("100000000000000000000")
    //     )
    // ];

    const activateMarketWithRewards = genesis.markets.map(([token, _]) => {
        return [
            api.tx.loans.activateMarket(token),
            // api.tx.loans.updateMarketRewardSpeed(token, 10, 10), // no incentives
        ]
    }).flat();

    const addSupply = genesis.markets.map(([token, market]) => {
        return api.tx.utility.dispatchAs(
            { system: { Signed: treasuryAccount } },
            api.tx.loans.mint(token, new BN(market.supplyCap).divn(10))
        )
    }).flat();

    return [addMarkets, activateMarketWithRewards, addSupply].flat()
}

function constructFundingSetup(api: ApiPromise, genesis: ParachainGenesis) {
    const tokens = [
        genesis.relayChainCurrency[0],
        genesis.nativeCurrency[0],
        ...genesis.foreignAssets.map((_, i) => {
            return { ForeignAsset: i + 1 }
        }),
    ];
    const fundNormalTokens = tokens.map((token) => {
        return [
            api.tx.tokens.setBalance(
                FAUCET_ACCOUNT,
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

    // lower btc amounts so UI deals with it better
    const fundBtc = [
        api.tx.tokens.setBalance(
            FAUCET_ACCOUNT,
            genesis.wrappedCurrency[0],
            new BN(4336).mul(new BN(10).pow(new BN(genesis.wrappedCurrency[1]))), // $100 million worth of BTC 
            0
        ),
        api.tx.tokens.setBalance(
            treasuryAccount,
            genesis.wrappedCurrency[0],
            new BN(4336).mul(new BN(10).pow(new BN(genesis.wrappedCurrency[1]))), // $100 million worth of BTC 
            0
        )
    ];

    return [fundNormalTokens, fundBtc].flat();
}

function constructVaultRegistrySetup(api: ApiPromise, genesis: ParachainGenesis) {
    return genesis.vaultParams.map(({
        collateralCurrency,
        liquidationCollateral,
        premiumRedeem,
        secureCollateral,
        minimumCollateral,
        systemCollateralCeiling
    }) => {
        const currencyPair = {
            collateral: collateralCurrency,
            wrapped: genesis.wrappedCurrency[0],
        };
        return [
            api.tx.vaultRegistry.setLiquidationCollateralThreshold(currencyPair, liquidationCollateral),
            api.tx.vaultRegistry.setPremiumRedeemThreshold(currencyPair, premiumRedeem),
            api.tx.vaultRegistry.setSecureCollateralThreshold(currencyPair, secureCollateral),
            api.tx.vaultRegistry.setMinimumCollateral(currencyPair.collateral, minimumCollateral),
            api.tx.vaultRegistry.setSystemCollateralCeiling(currencyPair, systemCollateralCeiling),
        ];
    }).flat();
}

function constructAnnuitySetup(api: ApiPromise, genesis: ParachainGenesis) {
    const blocksPerYears = 365 * 24 * 60 * 5; // 5 per minute
    const vaultAnnuity = [
        api.tx.tokens.setBalance(
            Buffer.concat([
                Buffer.from("modl"), // 4 bytes
                Buffer.from("vlt/annu"), // 8 bytes
            ], 32),
            genesis.nativeCurrency[0],
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
            genesis.nativeCurrency[0],
            new BN(47564687975).muln(blocksPerYears),
            0
        ),
        api.tx.escrowAnnuity.updateRewards(),
    ];
    return vaultAnnuity.concat(escrowAnnuity);
}

async function constructAmmSetup(api: ApiPromise, genesis: ParachainGenesis) {
    // NOTE: ordering of tokens must comply with PartialOrd (for now)
    const basicPoolSetup = genesis.pools.map(({ token0, token1, reward, liquidity }) => {
        // calculate liquidity amounts
        let decimals0 = new BN(decimals(token0, genesis) as number);
        let price0 = genesis.prices.get(JSON.stringify(token0)) as number;
        let liquidity0 = new BN(liquidity / 2).mul(new BN(10).pow(decimals0)).divn(price0);

        let decimals1 = new BN(decimals(token1, genesis) as number);
        let price1 = genesis.prices.get(JSON.stringify(token1)) as number;
        let liquidity1 = new BN(liquidity / 2).mul(new BN(10).pow(decimals1)).divn(price1);

        return [
            // @ts-ignore
            api.tx.dexGeneral.createPair(token0, token1, 30),
            api.tx.farming.updateRewardSchedule(
                { LpToken: [token0, token1] },
                genesis.nativeCurrency[0],
                60 * 24 * 7 * 12, // three months, reward period is per minute
                new BN(10).pow(new BN(genesis.nativeCurrency[1])).muln(reward as any),
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

    return basicPoolSetup;
}

function constructForeignAssetSetup(api: ApiPromise, genesis: ParachainGenesis) {
    return genesis.foreignAssets.map((metadata, i) => api.tx.assetRegistry.registerAsset(metadata, i + 1));
}

async function constructClientsInfoSetup(api: ApiPromise, baseUrl: String) {
    const checksumFile = await fetch(baseUrl + 'sha256sums.txt')
        .then(res => {
            if (res.status >= 400) {
                throw new Error("Bad response from server");
            }
            return res.text();
        });

    const re = new RegExp("([a-f0-9]+)\\s*[.]\/(([a-z]+)-parachain-metadata-" + args['parachain-runtime'] + ")\\n", "g");
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

async function setupParachain(genesis: ParachainGenesis) {
    const paraApi = await createSubstrateAPI(args['parachain-endpoint']);

    let calls = [
        await constructClientsInfoSetup(paraApi, args["clients-url"]),
        constructForeignAssetSetup(paraApi, genesis),
        constructFundingSetup(paraApi, genesis),
        constructLendingSetup(paraApi, genesis),
        constructVaultRegistrySetup(paraApi, genesis),
        constructAnnuitySetup(paraApi, genesis),
        await constructAmmSetup(paraApi, genesis),
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

    switch (args['parachain-runtime']) {
        case 'kintsugi':
            if (args['parachain-endpoint'] === undefined) {
                args['parachain-endpoint'] = "wss://api-dev-kintsugi.interlay.io/parachain";
            }
            return setupParachain(KINTSUGI_GENESIS);
        case 'interlay':
            if (args['parachain-endpoint'] === undefined) {
                args['parachain-endpoint'] = "wss://api-testnet.interlay.io/parachain";
            }
            return setupParachain(INTERLAY_GENESIS);
    }
}


