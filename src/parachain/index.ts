export { VaultsAPI, DefaultVaultsAPI } from "./vaults";
export { IssueAPI, DefaultIssueAPI } from "./issue";
export { RedeemAPI, DefaultRedeemAPI } from "./redeem";
export { RefundAPI, DefaultRefundAPI } from "./refund";
export { OracleAPI, DefaultOracleAPI } from "./oracle";
export { BTCRelayAPI, DefaultBTCRelayAPI } from "./btc-relay";
export { TokensAPI, DefaultTokensAPI } from "./tokens";
export { SystemAPI, DefaultSystemAPI } from "./system";
export { ConstantsAPI, DefaultConstantsAPI } from "./constants";
export { ReplaceAPI, DefaultReplaceAPI } from "./replace";
export { FeeAPI, DefaultFeeAPI } from "./fee";
export { RewardsAPI, DefaultRewardsAPI } from "./rewards";
export { NominationAPI, DefaultNominationAPI } from "./nomination";
export * from "./transaction";

// Hacky way of forcing the resolution of these types in test files
export { InterbtcPrimitivesVaultId, VaultRegistryVault } from "@polkadot/types/lookup";
