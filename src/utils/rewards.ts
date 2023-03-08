import Big from "big.js";
import { MS_PER_YEAR } from "./constants";

export function calculateAnnualizedRewardAmount(amountPerBlock: Big, blockTimeMs: number): Big {
    const blocksPerYear = MS_PER_YEAR.div(blockTimeMs);
    return amountPerBlock.mul(blocksPerYear);
}
