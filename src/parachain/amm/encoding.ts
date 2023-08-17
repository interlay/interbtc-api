import { InterbtcPrimitivesCurrencyId } from "@interlay/api-augment/interfaces";
import { MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { CurrencyExt } from "../../types";
import { newCurrencyId } from "../../utils";
import { Trade, isStableMultiPathElement, isStableMetaMultiPathElement } from "./trade";

function encodeSwapParamsForStandardPoolsOnly(
    api: ApiPromise,
    trade: Trade,
    minimumAmountOut: MonetaryAmount<CurrencyExt>
): {
    amountIn: string;
    amountOutMin: string;
    path: Array<InterbtcPrimitivesCurrencyId>;
} {
    const amountIn = trade.inputAmount.toString(true);
    const amountOutMin = minimumAmountOut.toString(true);
    const path = trade.path
        .reduce((result, currentPathElement) => [...result, currentPathElement.output], [trade.path[0].input])
        .map((currency) => newCurrencyId(api, currency));
    return { amountIn, amountOutMin, path };
}

function encodeSwapParamsForStandardAndStablePools(
    api: ApiPromise,
    trade: Trade,
    minimumAmountOut: MonetaryAmount<CurrencyExt>
): {
    amountIn: string;
    amountOutMin: string;
    path: (
        | {
              Stable: {
                  poolId: number;
                  basePoolId: number;
                  mode: string;
                  fromCurrency: InterbtcPrimitivesCurrencyId;
                  toCurrency: InterbtcPrimitivesCurrencyId;
              };
          }
        | {
              Normal: Array<InterbtcPrimitivesCurrencyId>;
          }
    )[];
} {
    const amountIn = trade.inputAmount.toString(true);
    const amountOutMin = minimumAmountOut.toString(true);
    const path = trade.path.map((pathElement) =>
        isStableMultiPathElement(pathElement)
            ? {
                  Stable: {
                      poolId: pathElement.pool.poolId,
                      // Pass 0 explicitly if swap is not going through base pool
                      basePoolId: isStableMetaMultiPathElement(pathElement) ? pathElement.basePool.poolId : 0,
                      mode: isStableMetaMultiPathElement(pathElement)
                          ? pathElement.fromBase
                              ? "FromBase"
                              : "ToBase"
                          : "Single",
                      fromCurrency: newCurrencyId(api, pathElement.input),
                      toCurrency: newCurrencyId(api, pathElement.output),
                  },
              }
            : {
                  Normal: [newCurrencyId(api, pathElement.input), newCurrencyId(api, pathElement.output)],
              }
    );

    return { amountIn, amountOutMin, path };
}

export { encodeSwapParamsForStandardAndStablePools, encodeSwapParamsForStandardPoolsOnly };
