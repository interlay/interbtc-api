import { ProviderInterface } from "@polkadot/rpc-provider/types";
import { ApiPromise } from "@polkadot/api";
import { TypeRegistry } from "@polkadot/types";
import MockProvider from "./provider";
import { getAPITypes, getRPCTypes, PolkaBTCAPI } from "../../src";
import MockPolkaBTCAPI from "./polkabtc-api";

export function createProvider(): ProviderInterface {
    const registry = new TypeRegistry();
    return new MockProvider(registry);
}

export function createPolkadotAPI(): Promise<ApiPromise> {
    const provider = createProvider();
    const types = getAPITypes();
    const rpc = getRPCTypes();
    return ApiPromise.create({ provider, types, rpc });
}

export async function createPolkabtcAPI(): Promise<PolkaBTCAPI> {
    const api = await createPolkadotAPI();
    return new MockPolkaBTCAPI(api);
}