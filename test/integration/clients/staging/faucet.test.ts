import { ApiPromise, Keyring } from "@polkadot/api";
import { FaucetClient } from "../../../../src/clients";
import { createPolkadotAPI } from "../../../../src/factory";
import { DEFAULT_PARACHAIN_ENDPOINT, DEFAULT_FAUCET_ENDPOINT } from "../../../config";
import { KeyringPair } from "@polkadot/keyring/types";
import { assert } from "../../../chai";
import { DefaultTokensAPI, TokensAPI } from "../../../../src";
import { Polkadot, PolkadotAmount } from "@interlay/monetary-js";

describe("Faucet", function () {
    this.timeout(100000);

    let api: ApiPromise;
    let faucet: FaucetClient;
    let tokensAPI: TokensAPI;

    let keyring: Keyring;
    let helen: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        faucet = new FaucetClient(DEFAULT_FAUCET_ENDPOINT);
        tokensAPI = new DefaultTokensAPI(api);
        keyring = new Keyring({ type: "sr25519" });
        helen = keyring.addFromUri("//Helen");
    });

    after(async () => {
        api.disconnect();
    });

    describe("Funding", () => {
        it("should get funds from faucet", async () => {
            const helenAccountId = api.createType("AccountId", helen.address);
            const expectedAllowance = PolkadotAmount.from.DOT(1);
            const balanceBeforeFunding = await tokensAPI.balance(Polkadot, helenAccountId);
            await faucet.fundAccount(helenAccountId);
            const balanceAfterFunding = await tokensAPI.balance(Polkadot, helenAccountId);
            assert.equal(
                balanceBeforeFunding.add(expectedAllowance).toString(),
                balanceAfterFunding.toString()
            );
        });

        it("should fail to get funds from faucet again", async () => {
            const helenAccountId = api.createType("AccountId", helen.address);
            assert.isRejected(faucet.fundAccount(helenAccountId));
        });
    });
});
