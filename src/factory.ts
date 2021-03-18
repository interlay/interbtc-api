import { ApiPromise } from "@polkadot/api";
import { HttpProvider, WsProvider } from "@polkadot/rpc-provider";
import { ProviderInterface } from "@polkadot/rpc-provider/types";
import { TypeRegistry } from "@polkadot/types";
import { RegistryTypes } from "@polkadot/types/types";
import { DefinitionRpc, DefinitionRpcSub } from "@polkadot/types/types";
import * as definitions from "./interfaces/definitions";
import { PolkaBTCAPI, DefaultPolkaBTCAPI } from "./polkabtc-api";

export function createProvider(endpoint: string, autoConnect?: number | false | undefined): ProviderInterface {
    if (/https?:\/\//.exec(endpoint)) {
        return new HttpProvider(endpoint);
    }
    if (/wss?:\/\//.exec(endpoint)) {
        return new WsProvider(endpoint, autoConnect);
    }
    throw new Error(`unknown scheme for ${endpoint}`);
}

export function createPolkadotAPI(endpoint: string, autoConnect?: number | false | undefined): Promise<ApiPromise> {
    const provider = createProvider(endpoint, autoConnect);
    const types = getAPITypes();
    const rpc = getRPCTypes();
    return ApiPromise.create({ provider, types, rpc });
}

export async function createPolkabtcAPI(
    endpoint: string,
    network: string = "mainnet",
    autoConnect?: number | false | undefined
): Promise<PolkaBTCAPI> {
    const api = await createPolkadotAPI(endpoint, autoConnect);
    return new DefaultPolkaBTCAPI(api, network);
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
