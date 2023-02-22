import { ApiPromise, WsProvider } from '@polkadot/api';
import { isNull } from '@polkadot/util';
import { BN } from "bn.js";

async function main() {
    const wsProvider = new WsProvider('wss://api-kusama.interlay.io/parachain');
    const api = await ApiPromise.create({ provider: wsProvider });

    // Select the block hash at which to compare the vaults
    const apiAt = await api.at("0x228ddb99b4a5f2944f3c0ad13d81c0e68310fb2e254b3e73e2ce93c2b54df9e7");

    const allVaults = await apiAt.query.vaultRegistry.vaults.entries();

    let ksmSecureThresholds = await apiAt.query.vaultRegistry.secureCollateralThreshold({"collateral":{"token":"KSM"},"wrapped":{"token":"KBTC"}});
    let kintSecureThresholds = await apiAt.query.vaultRegistry.secureCollateralThreshold({"collateral":{"token":"KINT"},"wrapped":{"token":"KBTC"}});
    let lksmSecureThresholds = await apiAt.query.vaultRegistry.secureCollateralThreshold({"collateral":{"foreignAsset":2},"wrapped":{"token":"KBTC"}});

    let thresholds = new Map();
    thresholds.set('{"collateral":{"token":"KSM"},"wrapped":{"token":"KBTC"}}',new BN(ksmSecureThresholds.toString()));
    thresholds.set('{"collateral":{"token":"KINT"},"wrapped":{"token":"KBTC"}}',new BN(kintSecureThresholds.toString()));
    thresholds.set('{"collateral":{"foreignAsset":2},"wrapped":{"token":"KBTC"}}',new BN(lksmSecureThresholds.toString()));

    let totalCollateralAvailable = new Map();
    totalCollateralAvailable.set('{"collateral":{"token":"KSM"},"wrapped":{"token":"KBTC"}}',new BN(0));
    totalCollateralAvailable.set('{"collateral":{"token":"KINT"},"wrapped":{"token":"KBTC"}}',new BN(0));
    totalCollateralAvailable.set('{"collateral":{"foreignAsset":2},"wrapped":{"token":"KBTC"}}',new BN(0));


    // Look up all Vaults from test chain and compare the vault objects
    for (const [key, vault] of allVaults) {
        let vaultJSON: any = vault.toJSON();
        let isActive = JSON.stringify(vaultJSON.status).includes('true');
        
        // inactive vaults don't contribute capacity
        if (!isActive) {
            continue;
        }
        let n = JSON.stringify(vaultJSON.secureCollateralThreshold).includes("null");

        let vaultId = vaultJSON.id;
        let collateral = new BN((await apiAt.query.vaultStaking.totalCurrentStake(0, vaultId)).toString());
        
        if (collateral.isZero()) {
            // skip usdt vaults since there aren't any
            continue;
        }

        let customThreshold = new BN(0);
        if (!n) {
            customThreshold = new BN(vaultJSON.secureCollateralThreshold.toString().replace(/0x/, ''), 16);
        }
        let globalThreshold = thresholds.get(JSON.stringify(vaultJSON.id.currencies));

        let threshold = customThreshold.gt(globalThreshold) ? customThreshold : globalThreshold;

        let availableCollateral = collateral.div(threshold);
        let key = JSON.stringify(vaultId.currencies);
        totalCollateralAvailable.set(key, availableCollateral.add(totalCollateralAvailable.get(key)));
    }

    for (const [a,availableCollateral] of totalCollateralAvailable.entries()) {
        let key = JSON.parse(a).collateral;
        let exchangeRate = await apiAt.query.oracle.aggregate({exchangerate: JSON.parse(a).collateral});
        let mintingCapacity = availableCollateral.mul(new BN("1000000000000000000")).div(new BN(exchangeRate.toString()));
        console.log("Expected capacity for", key, "=", mintingCapacity.toString(), "* 1e18");
    }

    await api.disconnect();
}

main();
