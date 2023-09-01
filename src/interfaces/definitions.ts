import { RpcFunctionDefinition } from "@interlay/interbtc-types";
import { createRequire } from "module";

// need to use "require" to be able to import json file from @interlay/interbtc-types
const require = createRequire(import.meta.url);
const definitions = require("@interlay/interbtc-types/definitions.json");

interface DecoratedRpcFunctionDefinition extends RpcFunctionDefinition {
    aliasSection: string;
}

export default {
    types: definitions.types[0].types,
    rpc: parseProviderRpcDefinitions(definitions.rpc),
    providerRpc: definitions.rpc,
};

function parseProviderRpcDefinitions(
    rpcDefs: Record<string, Record<string, RpcFunctionDefinition>>
): Record<string, DecoratedRpcFunctionDefinition> {
    const parsedDefs: Record<string, DecoratedRpcFunctionDefinition> = {};
    for (const module in rpcDefs) {
        const definitions = rpcDefs[module];
        for (const definitionName in definitions) {
            const definitionBody = definitions[definitionName];
            const decoratedDefinitionBody: DecoratedRpcFunctionDefinition = {
                ...definitionBody,
                aliasSection: module,
            };
            parsedDefs[definitionName] = decoratedDefinitionBody;
        }
    }
    return parsedDefs;
}
