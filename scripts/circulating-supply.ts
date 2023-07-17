/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { ApiPromise } from "@polkadot/api";
import { cryptoWaitReady, blake2AsHex } from "@polkadot/util-crypto";
import fetch from "cross-fetch";
import BN from "bn.js";
import { assert } from "console";

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

async function main(): Promise<void> {
    await cryptoWaitReady();

    const paraApi = await createSubstrateAPI("wss://api.interlay.io/parachain");
    // const paraApi = await createSubstrateAPI("wss://api-kusama.interlay.io/parachain");

    const nativeCurrencyId = { Token: "INTR" };
    const totalIssuance = await paraApi.query.tokens.totalIssuance(nativeCurrencyId);

    const allBalances = await paraApi.query.tokens.accounts.entries();
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

    console.log(`Total Issuance: ${totalIssuance.toString()}`);
    console.log(`Total Free: ${totalFree.toString()}`);
    console.log(`Total Reserved: ${totalReserved.toString()}`);
    console.log(`Total Frozen: ${totalFrozen.toString()}`);

    assert(totalFree.add(totalReserved).eq(totalIssuance));

    const liquidityPairs = await paraApi.query.dexGeneral.liquidityPairs.entries();
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
            paraApi.query.tokens.accounts(account, nativeCurrencyId)
        )
    );

    const systemAccountSupply = systemAccountBalances
        .reduce((acc: BN, accountData) => acc.add(accountData.free), new BN(0));
    console.log(`System Account Supply: ${systemAccountSupply.toString()}`);

    // circulating = total_issuance - total_locked - total_reserved - system_account_supply
    const circulating = totalIssuance.sub(totalFrozen).sub(totalReserved).sub(systemAccountSupply);
    console.log(`Circulating: ${circulating.toString()}`);

    await paraApi.disconnect();
}
