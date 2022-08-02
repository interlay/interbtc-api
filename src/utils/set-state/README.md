**Usage** 
`yarn set [command] [options]`

**Commands**
```
balance             Sets token balance of an account
liquidationVault    Sets system liquidation value
vaultIssuedTokens   Sets issued tokens of a vault
vaultPremiumRedeem  Sets collateral ratio of vault to be within
                                   premium redeem range
vaultBan            Bans vault for next 1000 blocks
vaultUnban          Unbans vault
vaultFund           Funds vault account with collateral token
vaultReward         Sets claimable amount of rewards for vault
```
**Options**
3 main options are:
- `-a` for address, e.g. `-a 5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL`
- `-c` for collateral currency symbol, e.g. `-c DOT`
- `-w` for wrapped currency symbol, e.g. `-w IBTC`

Pass the `--help` after the command name message to list all command options. 

**Default vault**
Default vault account is obtained from `VAULT_1_URI` env variable. Default vault is then vault consisting of this account and the currencies: native relay chain currency for collateral currency (KSM or DOT) and wrapped currency obtained from parachain constants (KBTC or IBTC). 

Modify state of specific vault by passing options: 
`-a [accountId] -c [collateralCurrencySymbol] -w [wrappedCurrencySymbol]`


**Example**
Set specific vault to be banned for next 1000 blocks:
`yarn set vaultBan -a 5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL -c KSM -w KBTC`

*Note*
*This script may pose as a base for e2e testing of the UI against the real parachain, [more context here](https://github.com/interlay/interbtc-ui/issues/402).*