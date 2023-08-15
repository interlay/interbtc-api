export const definitions = {
    "types": [
        {
            "minmax": [
                0,
                null
            ],
            "types": {
                "BalanceWrapper": {
                    "amount": "String"
                },
                "CurrencyId": {
                    "_enum": {
                        "Token": "TokenSymbol",
                        "ForeignAsset": "ForeignAssetId",
                        "LendToken": "LendTokenId",
                        "LpToken": "(LpToken, LpToken)",
                        "StableLpToken": "StablePoolId"
                    }
                },
                "LpToken": {
                    "_enum": {
                        "Token": "TokenSymbol",
                        "ForeignAsset": "ForeignAssetId",
                        "StableLpToken": "StablePoolId"
                    }
                },
                "InterbtcPrimitivesCurrencyId": {
                    "_enum": {
                        "Token": "InterbtcPrimitivesTokenSymbol",
                        "ForeignAsset": "InterbtcForeignAssetId",
                        "LendToken": "InterbtcLendTokenId",
                        "LpToken": "(InterbtcLpToken, InterbtcLpToken)",
                        "StableLpToken": "InterbtcStablePoolId"
                    }
                },
                "InterbtcLpToken": {
                    "_enum": {
                        "Token": "InterbtcPrimitivesTokenSymbol",
                        "ForeignAsset": "InterbtcForeignAssetId",
                        "StableLpToken": "InterbtcStablePoolId"
                    }
                },
                "InterbtcForeignAssetId": "u32",
                "ForeignAssetId": "u32",
                "InterbtcLendTokenId": "u32",
                "InterbtcStablePoolId": "u32",
                "LendTokenId": "u32",
                "StablePoolId": "u32",
                "NumberOrHex": {
                    "_enum": {
                        "Number": "u64",
                        "Hex": "U256"
                    }
                },
                "Rate": "FixedU128",
                "Ratio": "Permill",
                "Liquidity": "FixedU128",
                "Shortfall": "FixedU128",
                "FundAccountJsonRpcRequest": {
                    "account_id": "AccountId",
                    "currency_id": "InterbtcPrimitivesCurrencyId"
                },
                "H256Le": "H256",
                "SignedFixedPoint": "FixedU128",
                "TokenSymbol": {
                    "_enum": {
                        "DOT": 0,
                        "IBTC": 1,
                        "INTR": 2,
                        "KSM": 10,
                        "KBTC": 11,
                        "KINT": 12
                    }
                },
                "InterbtcPrimitivesTokenSymbol": {
                    "_enum": {
                        "DOT": 0,
                        "IBTC": 1,
                        "INTR": 2,
                        "KSM": 10,
                        "KBTC": 11,
                        "KINT": 12
                    }
                },
                "UnsignedFixedPoint": "FixedU128",
                "VaultCurrencyPair": {
                    "collateral": "CurrencyId",
                    "wrapped": "CurrencyId"
                },
                "VaultId": {
                    "account_id": "AccountId",
                    "currencies": "VaultCurrencyPair"
                }
            }
        }
    ],
    "rpc": {
        "btcRelay": {
            "verifyBlockHeaderInclusion": {
                "description": "Verify that the block with the given hash is included",
                "params": [
                    {
                        "name": "block_hash",
                        "type": "H256Le"
                    }
                ],
                "type": "void"
            }
        },
        "escrow": {
            "balanceAt": {
                "description": "Get a given user's escrowed balance",
                "params": [
                    {
                        "name": "account_id",
                        "type": "AccountId"
                    },
                    {
                        "name": "height",
                        "type": "Option<BlockNumber>"
                    }
                ],
                "type": "BalanceWrapper"
            },
            "totalSupply": {
                "description": "Get the total voting supply in the system",
                "params": [
                    {
                        "name": "height",
                        "type": "Option<BlockNumber>"
                    }
                ],
                "type": "BalanceWrapper"
            },
            "freeStakable": {
                "description": "Amount of kint/intr that account can lock, taking into consideration the Limits.",
                "params": [
                    {
                        "name":"account_id",
                        "type": "AccountId"
                    }
                ],
                "type": "BalanceWrapper"
            }
        },
        "loans": {
            "getCollateralLiquidity": {
                "description": "Retrieves collateral liquidity for the given user.",
                "params": [
                    {
                        "name": "account",
                        "type": "AccountId"
                    },
                    {
                        "name": "at",
                        "type": "BlockHash",
                        "isHistoric": true,
                        "isOptional": true
                    }
                ],
                "type": "(Liquidity, Shortfall)",
                "isSubscription": false,
                "jsonrpc": "loans_getCollateralLiquidity",
                "method": "getCollateralLiquidity",
                "section": "loans"
            },
            "getLiquidationThresholdLiquidity": {
                "description": "Retrieves liquidation threshold liquidity for the given user.",
                "params": [
                    {
                        "name": "account",
                        "type": "AccountId"
                    },
                    {
                        "name": "at",
                        "type": "BlockHash",
                        "isHistoric": true,
                        "isOptional": true
                    }
                ],
                "type": "(Liquidity, Shortfall)",
                "isSubscription": false,
                "jsonrpc": "loans_getLiquidationThresholdLiquidity",
                "method": "getLiquidationThresholdLiquidity",
                "section": "loans"
            },
            "getMarketStatus": {
                "description": "Retrieves market status data for a given asset id.",
                "params": [
                    {
                        "name": "asset_id",
                        "type": "CurrencyId"
                    },
                    {
                        "name": "at",
                        "type": "BlockHash",
                        "isHistoric": true,
                        "isOptional": true
                    }
                ],
                "type": "(Rate, Rate, Rate, Ratio, Balance, Balance, FixedU128)",
                "isSubscription": false,
                "jsonrpc": "loans_getMarketStatus",
                "method": "getMarketStatus",
                "section": "loans"
            }
        },
        "issue": {
            "getIssueRequests": {
                "description": "Get all issue request IDs for a particular account",
                "params": [
                    {
                        "name": "account_id",
                        "type": "AccountId"
                    }
                ],
                "type": "Vec<H256>"
            },
            "getVaultIssueRequests": {
                "description": "Get all issue request IDs for a particular vault",
                "params": [
                    {
                        "name": "vault_id",
                        "type": "AccountId"
                    }
                ],
                "type": "Vec<H256>"
            }
        },
        "oracle": {
            "collateralToWrapped": {
                "description": "Collateral to Wrapped exchange rate",
                "params": [
                    {
                        "name": "amount",
                        "type": "BalanceWrapper"
                    },
                    {
                        "name": "currency_id",
                        "type": "CurrencyId"
                    }
                ],
                "type": "BalanceWrapper"
            },
            "wrappedToCollateral": {
                "description": "Wrapped to Collateral exchange rate",
                "params": [
                    {
                        "name": "amount",
                        "type": "BalanceWrapper"
                    },
                    {
                        "name": "currency_id",
                        "type": "CurrencyId"
                    }
                ],
                "type": "BalanceWrapper"
            }
        },
        "redeem": {
            "getRedeemRequests": {
                "description": "Get all redeem request IDs for a particular account",
                "params": [
                    {
                        "name": "account_id",
                        "type": "AccountId"
                    }
                ],
                "type": "Vec<H256>"
            },
            "getVaultRedeemRequests": {
                "description": "Get all redeem request IDs for a particular vault",
                "params": [
                    {
                        "name": "vault_id",
                        "type": "AccountId"
                    }
                ],
                "type": "Vec<H256>"
            }
        },
        "refund": {
            "getRefundRequests": {
                "description": "Get all refund request IDs for a particular account",
                "params": [
                    {
                        "name": "account_id",
                        "type": "AccountId"
                    }
                ],
                "type": "Vec<H256>"
            },
            "getRefundRequestsByIssueId": {
                "description": "Get all refund request IDs for a particular issue ID",
                "params": [
                    {
                        "name": "issue_id",
                        "type": "H256"
                    }
                ],
                "type": "H256"
            },
            "getVaultRefundRequests": {
                "description": "Get all refund request IDs for a particular vault",
                "params": [
                    {
                        "name": "account_id",
                        "type": "AccountId"
                    }
                ],
                "type": "Vec<H256>"
            }
        },
        "replace": {
            "getNewVaultReplaceRequests": {
                "description": "Get all replace request IDs to a particular vault",
                "params": [
                    {
                        "name": "account_id",
                        "type": "AccountId"
                    }
                ],
                "type": "Vec<H256>"
            },
            "getOldVaultReplaceRequests": {
                "description": "Get all replace request IDs from a particular vault",
                "params": [
                    {
                        "name": "account_id",
                        "type": "AccountId"
                    }
                ],
                "type": "Vec<H256>"
            }
        },
        "reward": {
            "estimateEscrowRewardRate": {
                "description": "Estimate the escrow reward rate for a given account",
                "params": [
                    {
                        "name": "account_id",
                        "type": "AccountId"
                    },
                    {
                        "name": "amount",
                        "type": "Option<Balance>"
                    },
                    {
                        "name": "lock_time",
                        "type": "Option<BlockNumber>"
                    }
                ],
                "type": "UnsignedFixedPoint"
            },
            "estimateVaultRewardRate": {
                "description": "Estimate the vault reward rate a given vault id",
                "params": [
                    {
                        "name": "vault_id",
                        "type": "VaultId"
                    }
                ],
                "type": "UnsignedFixedPoint"
            },
            "computeEscrowReward": {
                "description": "Get a given user's rewards due",
                "params": [
                    {
                        "name": "account_id",
                        "type": "AccountId"
                    },
                    {
                        "name": "currency_id",
                        "type": "CurrencyId"
                    }
                ],
                "type": "BalanceWrapper"
            },
            "computeFarmingReward": {
                "description":"Get a given user's farming rewards due",
                "params": [
                    {
                        "name": "account_id",
                        "type": "AccountId"
                    },
                    {
                        "name": "pool_currency_id",
                        "type": "CurrencyId"
                    },
                    {
                        "name": "reward_currency_id",
                        "type": "CurrencyId"
                    }
                ],
                "type": "BalanceWrapper"
            },
            "computeVaultReward": {
                "description": "Get a given vault's rewards due",
                "params": [
                    {
                        "name": "vault_id",
                        "type": "VaultId"
                    },
                    {
                        "name": "currency_id",
                        "type": "CurrencyId"
                    }
                ],
                "type": "BalanceWrapper"
            }
        },
        "vaultRegistry": {
            "getCollateralizationFromVault": {
                "description": "Returns the collateralization of a specific vault",
                "params": [
                    {
                        "name": "vault",
                        "type": "VaultId"
                    },
                    {
                        "name": "only_issued",
                        "type": "bool"
                    }
                ],
                "type": "UnsignedFixedPoint"
            },
            "getCollateralizationFromVaultAndCollateral": {
                "description": "Returns the collateralization of a specific vault and collateral",
                "params": [
                    {
                        "name": "vault",
                        "type": "VaultId"
                    },
                    {
                        "name": "collateral",
                        "type": "BalanceWrapper"
                    },
                    {
                        "name": "only_issued",
                        "type": "bool"
                    }
                ],
                "type": "UnsignedFixedPoint"
            },
            "getIssueableTokensFromVault": {
                "description": "Get the amount of tokens a vault can issue",
                "params": [
                    {
                        "name": "vault",
                        "type": "VaultId"
                    }
                ],
                "type": "BalanceWrapper"
            },
            "getPremiumRedeemVaults": {
                "description": "Get all vaults below the premium redeem threshold.",
                "params": [],
                "type": "Vec<(VaultId, BalanceWrapper)>"
            },
            "getRequiredCollateralForVault": {
                "description": "Get the amount of collateral required for the given vault to be at the current SecureCollateralThreshold with the current exchange rate",
                "params": [
                    {
                        "name": "vault_id",
                        "type": "VaultId"
                    }
                ],
                "type": "BalanceWrapper"
            },
            "getRequiredCollateralForWrapped": {
                "description": "Get the amount of collateral required to issue an amount of InterBTC",
                "params": [
                    {
                        "name": "amount_btc",
                        "type": "BalanceWrapper"
                    },
                    {
                        "name": "currency_id",
                        "type": "CurrencyId"
                    }
                ],
                "type": "BalanceWrapper"
            },
            "getVaultCollateral": {
                "description": "Get the vault's collateral (excluding nomination)",
                "params": [
                    {
                        "name": "vault_id",
                        "type": "VaultId"
                    }
                ],
                "type": "BalanceWrapper"
            },
            "getVaultTotalCollateral": {
                "description": "Get the vault's collateral (including nomination)",
                "params": [
                    {
                        "name": "vault_id",
                        "type": "VaultId"
                    }
                ],
                "type": "BalanceWrapper"
            },
            "getVaultsByAccountId": {
                "description": "Get all vaults that are registered using the given account _id",
                "params": [
                    {
                        "name": "account_id",
                        "type": "AccountId"
                    }
                ],
                "type": "Vec<VaultId>"
            },
            "getVaultsWithIssuableTokens": {
                "description": "Get all vaults with non-zero issuable tokens, ordered in descending order of this amount",
                "params": [],
                "type": "Vec<(VaultId, BalanceWrapper)>"
            },
            "getVaultsWithRedeemableTokens": {
                "description": "Get all vaults with non-zero redeemable tokens, ordered in descending order of this amount",
                "params": [],
                "type": "Vec<(VaultId, BalanceWrapper)>"
            }
        },
        "dexStable": {
            "getA": {
                "description": "Get amplification coefficient of pool",
                "params": [
                    {
                        "name": "pool_id",
                        "type": "StablePoolId"
                    },
                    {
                        "name": "at",
                        "type": "BlockHash",
                        "isHistoric": true,
                        "isOptional": true
                    }
                ],
                "type": "NumberOrHex"
            }
        }
    },
    "alias": {
        "tokens": {
            "AccountData": "OrmlAccountData",
            "BalanceLock": "OrmlBalanceLock"
        }
    },
    "instances": {
        "balances": [
            "ksm",
            "kbtc",
            "kint",
            "dot",
            "ibtc",
            "intr"
        ]
    }
}