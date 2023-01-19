import { MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import {
    Trade,
    CurrencyExt,
    InterbtcPrimitivesCurrencyId,
    isStableMultiPathElement,
    isStableMetaMultiPathElement,
    newCurrencyId,
} from "../..";

function encodeSwapParamsForStandardPoolsOnly(
    api: ApiPromise,
    trade: Trade,
    minimumAmountOut: MonetaryAmount<CurrencyExt>
): {
    amountIn: string;
    amountOutMin: string;
    path: Array<InterbtcPrimitivesCurrencyId>;
} {
    const amountIn = trade.inputAmount._rawAmount.toString();
    const amountOutMin = minimumAmountOut._rawAmount.toString();
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
    const amountIn = trade.inputAmount._rawAmount.toString();
    const amountOutMin = minimumAmountOut._rawAmount.toString();
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
