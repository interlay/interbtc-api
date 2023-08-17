import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import { HttpProvider, WsProvider } from "@polkadot/rpc-provider";
import { ProviderInterface } from "@polkadot/rpc-provider/types";
import { TypeRegistry } from "@polkadot/types";
import { RegistryTypes } from "@polkadot/types/types";
import { DefinitionRpc, DefinitionRpcSub } from "@polkadot/types/types";
import * as definitions from "@interlay/api-augment/interfaces/definitions";
import { InterBtcApi, DefaultInterBtcApi } from "./interbtc-api";
import { BitcoinNetwork } from "./types";
import { objectSpread } from "@polkadot/util";
import { DefinitionCall, DefinitionsCall } from "@polkadot/types/types";

export function createProvider(endpoint: string, autoConnect?: number | false | undefined): ProviderInterface {
    if (/https?:\/\//.exec(endpoint)) {
        return new HttpProvider(endpoint);
    }
    if (/wss?:\/\//.exec(endpoint)) {
        return new WsProvider(endpoint, autoConnect);
    }
    throw new Error(`unknown scheme for ${endpoint}`);
}

export function createSubstrateAPI(
    endpoint: string,
    autoConnect?: number | false | undefined,
    noInitWarn?: boolean
): Promise<ApiPromise> {
    const provider = createProvider(endpoint, autoConnect);

    const types = getAPITypes();
    const rpc = getRPCTypes();
    return ApiPromise.create({
        provider,
        types,
        rpc,
        noInitWarn: noInitWarn || true,
        // manual definition for transactionPaymentApi.queryInfo until polkadot-js/api can be upgraded
        // TODO: revert when this work is merged: https://github.com/interlay/interbtc-api/pull/672
        runtime: getRuntimeDefs(),
    });
}

export async function createInterBtcApi(
    endpoint: string,
    network: BitcoinNetwork = "mainnet",
    account?: AddressOrPair,
    autoConnect?: number | false | undefined
): Promise<InterBtcApi> {
    const api = await createSubstrateAPI(endpoint, autoConnect);
    return new DefaultInterBtcApi(api, network, account);
}

export function getAPITypes(): RegistryTypes {
    return Object.values(definitions).reduce((res, { types }) => ({ ...res, ...types }), {});
}

export function getRPCTypes(): Record<string, Record<string, DefinitionRpc | DefinitionRpcSub>> {
    return Object.values(definitions).reduce((res, { providerRpc }) => ({ ...res, ...providerRpc }), {});
}

export function createAPIRegistry(): TypeRegistry {
    const registry = new TypeRegistry();
    registry.register(getAPITypes());
    return registry;
}

const V1_TO_V4_SHARED_PAY: Record<string, DefinitionCall> = {
    query_fee_details: {
        description: "The transaction fee details",
        params: [
            {
                name: "uxt",
                type: "Extrinsic"
            },
            {
                name: "len",
                type: "u32"
            }
        ],
        type: "FeeDetails"
    }
};

const V2_TO_V4_SHARED_PAY: Record<string, DefinitionCall> = {
    query_info: {
        description: "The transaction info",
        params: [
            {
                name: "uxt",
                type: "Extrinsic"
            },
            {
                name: "len",
                type: "u32"
            }
        ],
        type: "RuntimeDispatchInfo"
    }
};

const V3_SHARED_PAY_CALL: Record<string, DefinitionCall> = {
    query_length_to_fee: {
        description: "Query the output of the current LengthToFee given some input",
        params: [
            {
                name: "length",
                type: "u32"
            }
        ],
        type: "Balance"
    },
    query_weight_to_fee: {
        description: "Query the output of the current WeightToFee given some input",
        params: [
            {
                name: "weight",
                type: "Weight"
            }
        ],
        type: "Balance"
    }
};

export function getRuntimeDefs(): DefinitionsCall {
    return {
        TransactionPaymentApi: [
            {
                // V4 is equivalent to V3 (V4 just dropped all V1 references)
                methods: objectSpread(
                    {},
                    V3_SHARED_PAY_CALL,
                    V2_TO_V4_SHARED_PAY,
                    V1_TO_V4_SHARED_PAY
                ),
                version: 4
            },
            {
                methods: objectSpread(
                    {},
                    V3_SHARED_PAY_CALL,
                    V2_TO_V4_SHARED_PAY,
                    V1_TO_V4_SHARED_PAY
                ),
                version: 3
            },
        ]
    };
}
