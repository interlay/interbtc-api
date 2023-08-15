import definitions, { RpcFunctionDefinition } from "@interlay/interbtc-types";
export default {
    types: definitions.types[0].types,
    rpc: parseProviderRpcDefinitions(definitions.rpc),
    providerRpc: definitions.rpc,
    // manual definition for transactionPaymentApi.queryInfo until polkadot-js/api can be upgraded
    // TODO: revert when this work is merged: https://github.com/interlay/interbtc-api/pull/672
    runtime: {
        TransactionPaymentApi: [
            {
                methods: {
                    queryInfo: {
                        description: 'Retrieves the fee information for an encoded extrinsic',
                        params: [
                            {
                                name: 'uxt',
                                type: 'Extrinsic'
                            },
                            {
                                name: 'len',
                                type: 'u32'
                            }
                        ],
                        type: 'RuntimeDispatchInfo'
                    }
                },
                version: 4
            }
        ]
    }
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
