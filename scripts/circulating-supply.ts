/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { ApiPromise } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import BN from "bn.js";
import { assert } from "console";

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

type NativeCurrencyId = { Token: string };

type CirculationData = {
    totalIssuance: BN,
    totalFree: BN,
    totalReserved: BN,
    totalFrozen: BN,
    systemAccountSupply: BN,
    circulating: BN
};

async function fetchCirculationInfo(
    api: ApiPromise,
    blockhash: string | Uint8Array,
    nativeCurrencyId: NativeCurrencyId
): Promise<CirculationData> {
    const apiAtBlock = await api.at(blockhash);

    const [totalIssuance, allBalances] = await Promise.all([
        apiAtBlock.query.tokens.totalIssuance(nativeCurrencyId),
        apiAtBlock.query.tokens.accounts.entries()
    ]);

    const allNativeBalances = allBalances.filter(([{ args: [_account, currencyId] }, _value]) => {
        if (currencyId.isToken) {
            return currencyId.asToken.isIntr;
        }
        return false;
    });

    const totalFree = allNativeBalances
        .map(value => (value[1] as any).free.toBn())
        .reduce((acc: BN, r) => acc.add(r), new BN(0));
    const totalReserved = allNativeBalances
        .map(value => (value[1] as any).reserved.toBn())
        .reduce((acc: BN, r) => acc.add(r), new BN(0));
    const totalFrozen = allBalances
        .map(value => (value[1] as any).frozen.toBn())
        .reduce((acc: BN, r) => acc.add(r), new BN(0));


    assert(totalFree.add(totalReserved).eq(totalIssuance));

    const liquidityPairs = await apiAtBlock.query.dexGeneral.liquidityPairs.entries();
    const lpTokens = liquidityPairs.map(([_key, value]) => value.unwrap());

    const systemAccounts = [
        "5Fhn5mX4JGeDxikaxkJZYRYjxxbZ7DjxS5f9hsAVAzGXUNyG",
        "5GgS9vsF77Y7p2wZLEW1CW7vZpq8DSoXCf2sTdBoB51jpuan",
        "5GDzXqLxGiJV6A7mDp1SGRV6DB8xnnwauMEwR7PL4PW122FM",
        "5FgimgwW2s4V14NniQ6Nt145Sksb83xohW5LkMXYnMw3Racp",
        Buffer.concat([Buffer.from("modl"), Buffer.from("mod/fees")], 32),
        Buffer.concat([Buffer.from("modl"), Buffer.from("mod/supl")], 32),
        Buffer.concat([Buffer.from("modl"), Buffer.from("esc/annu")], 32),
        Buffer.concat([Buffer.from("modl"), Buffer.from("vlt/annu")], 32),
        Buffer.concat([Buffer.from("modl"), Buffer.from("mod/trsy")], 32),
        Buffer.concat([Buffer.from("modl"), Buffer.from("col/slct")], 32),
        Buffer.concat([Buffer.from("modl"), Buffer.from("mod/vreg")], 32),
        Buffer.concat([Buffer.from("modl"), Buffer.from("mod/loan")], 32),
        Buffer.concat([Buffer.from("modl"), Buffer.from("mod/farm")], 32),
        Buffer.concat([
            Buffer.from("modl"),
            Buffer.from("mod/loan"),
            Buffer.from("farming")
        ], 32),
        Buffer.concat([
            Buffer.from("modl"),
            Buffer.from("mod/loan"),
            Buffer.from("incentive")
        ], 32),
        ...lpTokens.map(currencyId => Buffer.concat([
            Buffer.from("modl"),
            Buffer.from("mod/farm"),
            currencyId.toU8a(),
        ], 32))
    ];

    const systemAccountBalances = await Promise.all(
        systemAccounts.map(account =>
            apiAtBlock.query.tokens.accounts(account, nativeCurrencyId)
        )
    );

    const systemAccountSupply = systemAccountBalances
        .reduce((acc: BN, accountData) => acc.add(accountData.free), new BN(0));

    // circulating = total_issuance - total_locked - total_reserved - system_account_supply
    const circulating = totalIssuance.sub(totalFrozen).sub(totalReserved).sub(systemAccountSupply);

    return {
        totalIssuance,
        totalFree,
        totalReserved,
        totalFrozen,
        systemAccountSupply,
        circulating
    };
}

function logData(data: CirculationData): void {
    console.log(`Total Issuance: ${data.totalIssuance.toString()}`);
    console.log(`Total Free: ${data.totalFree.toString()}`);
    console.log(`Total Reserved: ${data.totalReserved.toString()}`);
    console.log(`Total Frozen: ${data.totalFrozen.toString()}`);
    console.log(`System Account Supply: ${data.systemAccountSupply.toString()}`);
    console.log(`Circulating: ${data.circulating.toString()}`);
}

async function main(): Promise<void> {
    await cryptoWaitReady();

    const endpoint = "wss://api.interlay.io/parachain";
    const nativeCurrencyId = { Token: "INTR" };
    const startHash = "0xaa44632945aa72aba1cbd95465e76d1c2af17d4cedace096b4e1e735023a668b";
    const startHeight = 2959963;
    const endHash = "0xa360c4b8995819d97ee5ec82242261f092e662b7faf4a746fe978c032c35821f";
    const endHeight = 3131000;
    
    // const endpoint = "wss://api-kusama.interlay.io/parachain";
    // const nativeCurrencyId = { Token: "KINT" };
    // const startHeight = 123;
    // const startHash = "0x123";
    // const endHash = "0x456";
    // const endHeight = 456;
    
    const paraApi = await createSubstrateAPI(endpoint);
    const startData = await fetchCirculationInfo(paraApi, startHash, nativeCurrencyId);
    console.log(`Native Currency: ${nativeCurrencyId.Token} - wss: ${endpoint}`);
    console.log("===========================");
    console.log(`Start at height: ${startHeight}, hash: ${startHash}`);
    logData(startData);

    const endData = await fetchCirculationInfo(paraApi, endHash, nativeCurrencyId);
    console.log("===========================");
    console.log(`End at height: ${endHeight}, hash: ${endHash}`);
    logData(endData);

    const deltaData = {
        totalIssuance: endData.totalIssuance.sub(startData.totalIssuance),
        totalFree: endData.totalFree.sub(startData.totalFree),
        totalReserved: endData.totalReserved.sub(startData.totalReserved),
        totalFrozen: endData.totalFrozen.sub(startData.totalFrozen),
        systemAccountSupply: endData.systemAccountSupply.sub(startData.systemAccountSupply),
        circulating: endData.circulating.sub(startData.circulating),
    };
    console.log("===========================");
    console.log("Delta end - start");
    logData(deltaData);
    console.log("===========================");

    await paraApi.disconnect();
}
