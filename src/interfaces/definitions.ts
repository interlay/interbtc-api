import { RpcFunctionDefinition } from "@interlay/interbtc-types";
import fs from "fs";

// hacky, but cannot import json "the old way" in esnext
const definitionsString = fs.readFileSync("./node_modules/@interlay/interbtc-types/definitions.json", "utf-8");
const definitions = JSON.parse(definitionsString);

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
