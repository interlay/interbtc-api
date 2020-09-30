export default {
    types: {
        H256Le: "H256",
        DOT: "u128",
        PolkaBTC: "Balance",
        BTCBalance: "u128",
        StatusCode: { _enum: ["Running", "Error", "Shutdown"] },
        Address: "AccountId",
        LookupSource: "AccountId",

        // Silence the warnings:
        Status: "StatusCode",
        ErrorCode: { _enum: ["None", "NoDataBTCRelay", "InvalidBTCRelay", "OracleOffline", "Liquidation"] },
        RawBlockHeader: { 0: "[u8; 80]" },
        RichBlockHeader: {
            block_hash: "H256Le",
            block_header: "BlockHeader",
            block_height: "u32",
            chain_ref: "u32",
        },
        BlockHeader: {
            merkle_root: "H256Le",
            target: "U256",
            timestamp: "u32",
            version: "i32",
            hash_prev_block: "H256Le",
            nonce: "u32",
        },
        BlockChain: {
            chain_id: "u32",
            start_height: "u32",
            max_height: "u32",
            no_data: "BTreeSet<u32>",
            invalid: "BTreeSet<u32>",
        },
        Issue: {
            vault: "AccountId",
            opentime: "BlockNumber",
            griefing_collateral: "DOT",
            amount: "PolkaBTC",
            requester: "AccountId",
            btc_address: "H160",
            completed: "bool",
        },
        Vault: {
            id: "AccountId",
            to_be_issued_tokens: "PolkaBTC",
            issued_tokens: "PolkaBTC",
            to_be_redeemed_tokens: "PolkaBTC",
            btc_address: "H160",
            banned_until: "Option<BlockNumber>",
        },
        Redeem: {
            vault: "AccountId",
            opentime: "BlockNumber",
            amount_polka_btc: "PolkaBTC",
            amount_btc: "PolkaBTC",
            amount_dot: "DOT",
            premium_dot: "DOT",
            redeemer: "AccountId",
            btc_address: "H160",
        },
        Replace: {
            old_vault: "AccountId",
            open_time: "BlockNumber",
            amount: "PolkaBTC",
            griefing_collateral: "DOT",
            new_vault: "Option<AccountId>",
            collateral: "DOT",
            accept_time: "Option<BlockNumber>",
            btc_address: "H160",
        },
        ActiveStakedRelayer: {
            stake: "DOT",
        },
        StatusUpdate: {
            new_status_code: "StatusCode",
            old_status_code: "StatusCode",
            add_error: "Option<ErrorCode>",
            remove_error: "Option<ErrorCode>",
            time: "BlockNumber",
            proposal_status: "ProposalStatus",
            btc_block_hash: "Option<H256Le>",
            proposer: "AccountId",
            deposit: "DOT",
            tally: "Tally<AccountId>",
        },
        ProposalStatus: { _enum: ["Pending", "Accepted", "Rejected"] },
        InactiveStakedRelayer: {
            stake: "DOT",
            status: "StakedRelayerStatus<BlockNumber>",
        },
        StakedRelayerStatus: { _enum: ["Unknown", "Idle", "Bonding(BlockNumber)"] },

        // Staked relayer client:
        GetAddressResponse: {
            address: "String",
        },
        GetParachainStatusResponse: {
            status: "StatusCode",
        },
        GetStatusUpdateRequest: {
            status_update_id: "u64",
        },
        GetStatusUpdateResponse: {
            status: "StatusUpdate",
        },
        RegisterStakedRelayerRequest: {
            stake: "u128",
        },
        SuggestStatusUpdateRequest: {
            deposit: "u128",
            status_code: "StatusCode",
            add_error: "Option<ErrorCode>",
            remove_error: "Option<ErrorCode>",
            block_hash: "Option<H256Le>",
        },
        VoteOnStatusUpdateRequest: {
            status_update_id: "U256",
            approve: "bool",
        },
    },
    rpc: {
        vaultRegistry: {
            getFirstVaultWithSufficientCollateral: {
                description:
                    "Get the first available vault with sufficient collateral " +
                    "to fulfil an issue request with the specified amount of PolkaBTC.",
                params: [
                    {
                        name: "amount",
                        type: "PolkaBTC"
                    },
                ],
                type: "AccountId"
            },
            getIssueableTokensFromVault: {
                description: "Get the amount of tokens a vault can issue",
                params: [
                    {
                        name: "vault",
                        type: "AccountId"
                    },
                ],
                type: "PolkaBTC"
            },
            getCollateralizationFromVault: {
                description: "Returns the collateralization of a specific vault",
                params: [
                    {
                        name: "vault_id",
                        type: "AccountId"
                    },
                ],
                type: "u64"
            }
        },
        exchangeRateOracle: {
            btcToDots: {
                description:
                    "BTC to DOT conversion rate",
                params: [
                    {
                        name: "amount",
                        type: "PolkaBTC"
                    },
                ],
                type: "DOT"
            },
        },
        stakedRelayers: {
            isTransactionInvalid: {
                description:
                    "BTC to DOT conversion rate",
                params: [
                    {
                        name: "vault_id",
                        type: "AccountId"
                    },
                    {
                        name: "raw_tx",
                        type: "Vec<u8>"
                    },
                ],
                type: ""
            },
        },
    },
};
