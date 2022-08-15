// Script used to generate the proposal for the manual Vault migration.
// https://kintsugi.subsquare.io/democracy/referendum/56

import { ApiPromise, WsProvider } from '@polkadot/api';

async function main() {
    const wsProvider = new WsProvider('wss://api-kusama.interlay.io/parachain');
    const api = await ApiPromise.create({ provider: wsProvider });

    // Block containing the runtime upgrade
    // https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fapi-kusama.interlay.io%2Fparachain#/explorer/query/0x3a4293ca2b4d24ea852b9510059cb8769e8321b3051bb690aef2703ebc74a65e
    const preUpgradeApi = await api.at("0x3a4293ca2b4d24ea852b9510059cb8769e8321b3051bb690aef2703ebc74a65e");

    const allVaults = await preUpgradeApi.query.vaultRegistry.vaults.entries();
    const toSet: [string, string][] = allVaults.map(([key, vault]) => {
        // In this upgrade we removed theft reporting
        let vaultJSON: any = vault.toJSON();
        delete vaultJSON.wallet;
        if (vaultJSON.status.committedTheft === null) {
            vaultJSON.status = { liquidated: null };
        }
        const codec = api.createType("VaultRegistryVault", vaultJSON);

        return [key.toHex(), codec.toHex()];
    });
    // Encoded data for the proposal
    console.log(api.tx.system.setStorage(toSet).method.toHex());

    await api.disconnect();
}

main();