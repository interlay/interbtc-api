import { CurrencyExt } from "../../../types";
import { StableLiquidityPool } from "../liquidity-pool/stable";
import { TradingPair } from "../liquidity-pool/types";

interface MultiPathElementBase {
    type: MultiPathElementType;
    input: CurrencyExt;
    output: CurrencyExt;
}

enum MultiPathElementType {
    STANDARD = "STANDARD",
    STABLE_PLAIN = "STABLE_PLAIN",
    STABLE_META = "STABLE_META",
}

interface MultiPathElementStandard extends MultiPathElementBase {
    type: MultiPathElementType.STANDARD;
    pair: TradingPair;
}

interface MultiPathElementStablePlain extends MultiPathElementBase {
    type: MultiPathElementType.STABLE_PLAIN;
    pool: StableLiquidityPool;
}

interface MultiPathElementStableMeta extends MultiPathElementBase {
    type: MultiPathElementType.STABLE_META;
    pool: StableLiquidityPool;
    basePool: StableLiquidityPool;
    fromBase: boolean;
}

type MultiPathElementStable = MultiPathElementStablePlain | MultiPathElementStableMeta;
type MultiPathElement = MultiPathElementStandard | MultiPathElementStable;

const isStandardMultiPathElement = (pathElement: MultiPathElement): pathElement is MultiPathElementStandard =>
    pathElement.type === MultiPathElementType.STANDARD;
const isStableMultiPathElement = (pathElement: MultiPathElement): pathElement is MultiPathElementStable =>
    pathElement.type === MultiPathElementType.STABLE_META || pathElement.type === MultiPathElementType.STABLE_PLAIN;
const isStableMetaMultiPathElement = (pathElement: MultiPathElement): pathElement is MultiPathElementStableMeta =>
    pathElement.type === MultiPathElementType.STABLE_META;
const isStablePlainMultiPathElement = (pathElement: MultiPathElement): pathElement is MultiPathElementStablePlain =>
    pathElement.type === MultiPathElementType.STABLE_PLAIN;

type MultiPath = Array<MultiPathElement>;

export {
    isStableMetaMultiPathElement,
    isStableMultiPathElement,
    isStablePlainMultiPathElement,
    isStandardMultiPathElement,
    MultiPathElementType,
};
export type {
    MultiPath,
    MultiPathElement,
    MultiPathElementStable,
    MultiPathElementStableMeta,
    MultiPathElementStablePlain,
    MultiPathElementStandard,
};
