import { ApiPromise } from "@polkadot/api";
import { HttpProvider, WsProvider } from "@polkadot/rpc-provider";
import { ProviderInterface } from "@polkadot/rpc-provider/types";
import { TypeRegistry } from "@polkadot/types";
import { RegistryTypes } from "@polkadot/types/types";
import * as definitions from "./interfaces/definitions";
import { MockPolkaBTCAPI, MockProvider } from "./mock";
import { PolkaBTCAPI, DefaultPolkaBTCAPI } from "./polkabtc-api";

export function createProvider(endpoint: string, autoConnect?: number | false | undefined): ProviderInterface {
    if (endpoint === "mock") {
        const registry = new TypeRegistry();
        return new MockProvider(registry);
    }
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
    return ApiPromise.create({ provider, types });
}

export async function createPolkabtcAPI(
    endpoint: string,
    autoConnect?: number | false | undefined
): Promise<PolkaBTCAPI> {
    const api = await createPolkadotAPI(endpoint, autoConnect);
    if (endpoint == "mock") {
        return new MockPolkaBTCAPI(api);
    }
    return new DefaultPolkaBTCAPI(api);
}

export function getAPITypes(): RegistryTypes {
    return Object.values(definitions).reduce((res, { types }) => ({ ...res, ...types }), {});
}
