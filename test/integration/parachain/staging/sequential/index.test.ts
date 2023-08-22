import { ammTests } from "./amm.partial";
import { assetRegistryTests } from "./asset-registry.partial";
import { escrowTests } from "./escrow.partial";
import { issueTests } from "./issue.partial";
import { loansTests } from "./loans.partial";
import { nominationTests } from "./nomination.partial";
import { oracleTests } from "./oracle.partial";
import { redeemTests } from "./redeem.partial";
import { replaceTests } from "./replace.partial";
import { vaultsTests } from "./vaults.partial";

// this forces jest to run the sequential tests in a specific order
// replicated the previous behavior (alphabetic) instead of using
// jest's default order (pretty much files in random order)
ammTests();
assetRegistryTests();
escrowTests();
issueTests();
loansTests();
nominationTests();
oracleTests();
redeemTests();
replaceTests();
vaultsTests();