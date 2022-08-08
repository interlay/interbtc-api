import { ApiPromise, WsProvider } from '@polkadot/api';

/**
 * This script allows to verify that Vaults are replicated on another networks.
 * This script was orginially used to verify the correctness of the Kintsugi Vault v6
 * migration bug.
 */
async function main() {
    // Select any two networks to verify against
    const wsProvider = new WsProvider('wss://api-kusama.interlay.io/parachain');
    const testWsProvider = new WsProvider('wss://api-kusama.interlay.io/parachain');
    const api = await ApiPromise.create({ provider: wsProvider });
    const testApi = await ApiPromise.create({ provider: testWsProvider });

    // Select the block hash at which to compare the vaults
    const preUpgradeApi = await api.at("0x3a4293ca2b4d24ea852b9510059cb8769e8321b3051bb690aef2703ebc74a65e");

    const allVaults = await preUpgradeApi.query.vaultRegistry.vaults.entries();
    const postStorageSetVaults = await testApi.query.vaultRegistry.vaults.entries();

    // Sanity check total issuance
    const expectedIssuedTokens = parseInt((await preUpgradeApi.query.tokens.totalIssuance({Token: "KBTC"})).toString());
    let actualIssuedTokens = 0;

    // Look up all Vaults from test chain and compare the vault objects
    allVaults.map(([key, vault]) => {
        let vaultJSON: any = vault.toJSON();
        delete vaultJSON.wallet;
        if (vaultJSON.status.committedTheft === null) {
            vaultJSON.status = { liquidated: null };
        }

        let [_, updatedVault] = postStorageSetVaults.find(([updatedKey, _]) => {
            return updatedKey.toHex() === key.toHex();
        })!;

        const updatedVaultJSON = updatedVault.toJSON();

        if (JSON.stringify(vaultJSON) !== JSON.stringify(updatedVaultJSON)) {
            throw new Error(`Error. Expected ${vaultJSON} got ${updatedVaultJSON}`);
        } else {
            console.log(`Vault ${JSON.stringify(vaultJSON.id)} updated correctly.`);
            actualIssuedTokens += parseInt(vaultJSON.issuedTokens);
        };
    });

    // Sanity check total issuance
    if (actualIssuedTokens !== expectedIssuedTokens) {
        throw new Error(`Expected ${expectedIssuedTokens} got ${actualIssuedTokens}`);
    };

    await api.disconnect();
    await testApi.disconnect();
}

main();
