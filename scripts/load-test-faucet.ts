
import { Kintsugi } from '@interlay/monetary-js';
import { Keyring } from '@polkadot/api';
import { createSubstrateAPI, FaucetClient } from '../src';

const PARACHAIN_ENDPOINT = "wss://api-kusama.interlay.io/parachain";
const FAUCET_URL = "http://localhost:3033";

// The script throws an error but does what it should
main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

/**
* Flood the faucet with `users` requests to see if it breaks
*/
async function main() {
    const keyring = new Keyring({ type: "sr25519" });
    const api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
    const faucet = new FaucetClient(api, FAUCET_URL);
    const salt = Math.random().toString();
    const users = 100;
    const promises = [];
    for (let i = 0; i < users; i++) {
        const account = keyring.addFromUri(`//${salt + i.toString()}`);
        console.log(account.address);
        const accountId = api.createType("AccountId", account.address);
        promises.push(
            faucet.fundAccount(accountId, Kintsugi)
        );
    }
    console.log(`Making ${users} simultaneous faucet requests...`);
    await Promise.all(promises);
    console.log("Finished");
}
