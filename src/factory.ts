import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import { HttpProvider, WsProvider } from "@polkadot/rpc-provider";
import { ProviderInterface } from "@polkadot/rpc-provider/types";
import { TypeRegistry } from "@polkadot/types";
import { RegistryTypes } from "@polkadot/types/types";
import { DefinitionRpc, DefinitionRpcSub } from "@polkadot/types/types";
import * as definitions from "./interfaces/definitions";
import { InterBTCAPI, DefaultInterBTCAPI } from "./interbtc-api";
import { BitcoinNetwork } from "./types";

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

export async function createInterbtcAPI(
    endpoint: string,
    network: BitcoinNetwork = "mainnet",
    account?: AddressOrPair,
    autoConnect?: number | false | undefined
): Promise<InterBTCAPI> {
    const api = await createPolkadotAPI(endpoint, autoConnect);
    return new DefaultInterBTCAPI(api, network, account);
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
