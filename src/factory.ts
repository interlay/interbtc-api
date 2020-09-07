import { ApiPromise } from "@polkadot/api";
import { WsProvider, HttpProvider } from "@polkadot/rpc-provider";
import { ProviderInterface } from "@polkadot/rpc-provider/types";

export function createProvider(endpoint: string, autoConnect?: number | false | undefined): ProviderInterface {
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
    return ApiPromise.create({ provider });
}
