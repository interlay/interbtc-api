import definitions, { RpcFunctionDefinition } from "@interlay/polkabtc-types";
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

interface DecoratedRpcFunctionDefinition extends RpcFunctionDefinition {
    aliasSection: string;
}
