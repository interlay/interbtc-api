import { PoolType } from "../types";
import { StableLiquidityPool } from "./stable";
import { StandardLiquidityPool } from "./standard";
import { StableLiquidityMetaPool } from "./stable-meta";

type LiquidityPool = StandardLiquidityPool | StableLiquidityPool | StableLiquidityMetaPool;

const isStandardPool = (pool: LiquidityPool): pool is StandardLiquidityPool => pool.type === PoolType.STANDARD;
const isStablePool = (pool: LiquidityPool): pool is StableLiquidityPool | StableLiquidityMetaPool =>
    pool.type === PoolType.STABLE_PLAIN || pool.type === PoolType.STABLE_META;
const isStableMetaPool = (pool: LiquidityPool): pool is StableLiquidityMetaPool => pool.type === PoolType.STABLE_META;

export { isStablePool, isStandardPool, isStableMetaPool };
export type { LiquidityPool };
