import { ApiPromise } from "@polkadot/api";
import { HttpProvider, WsProvider } from "@polkadot/rpc-provider";
import { ProviderInterface } from "@polkadot/rpc-provider/types";
import { TypeRegistry } from "@polkadot/types";
import { RegistryTypes } from "@polkadot/types/types";
import * as definitions from "./interfaces/definitions";
import Mock from "./mock";



export function createProvider(endpoint: string, autoConnect?: number | false | undefined): ProviderInterface {
    if (endpoint === "mock") {
        const registry = new TypeRegistry();
        return new Mock(registry);
    }
    if (/https?:\/\//.exec(endpoint)) {
        return new HttpProvider(endpoint);
    }
    if (/wss?:\/\//.exec(endpoint)) {
        return new WsProvider(endpoint, autoConnect);
    }
    throw new Error(`unknown scheme for ${endpoint}`);
}

export function createAPI(endpoint: string, autoConnect?: number | false | undefined): Promise<ApiPromise> {
    const provider = createProvider(endpoint, autoConnect);
    const types = getAPITypes();
    return ApiPromise.create({ provider, types });
}

export function getAPITypes(): RegistryTypes {
    return Object.values(definitions).reduce((res, { types }) => ({ ...res, ...types }), {});
}
