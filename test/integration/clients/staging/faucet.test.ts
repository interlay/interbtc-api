import { ApiPromise, Keyring } from "@polkadot/api";
import { FaucetClient } from "../../../../src/clients";
import { createPolkadotAPI } from "../../../../src/factory";
import { PARACHAIN_ENDPOINT, FAUCET_ENDPOINT } from "../../../config";
import { KeyringPair } from "@polkadot/keyring/types";
import { assert } from "../../../chai";
import { CurrencyIdLiteral, DefaultTokensAPI, newAccountId, TokensAPI } from "../../../../src";
import { Polkadot, PolkadotAmount } from "@interlay/monetary-js";
import { makeRandomPolkadotKeyPair } from "../../../utils/helpers";

describe("Faucet", function () {
    this.timeout(100000);

    let api: ApiPromise;
    let faucet: FaucetClient;
    let tokensAPI: TokensAPI;

    let keyring: Keyring;
    let account: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        faucet = new FaucetClient(api, FAUCET_ENDPOINT);
        tokensAPI = new DefaultTokensAPI(api);
        keyring = new Keyring({ type: "sr25519" });
        account = makeRandomPolkadotKeyPair(keyring);
    });

    after(async () => {
        api.disconnect();
    });

    describe("Funding", () => {
        it("should get funds from faucet", async () => {
            const accountId = newAccountId(api, account.address);
            const expectedAllowance = PolkadotAmount.from.DOT(1);
            const balanceBeforeFunding = await tokensAPI.balance(Polkadot, accountId);
            await faucet.fundAccount(accountId, CurrencyIdLiteral.DOT);
            const balanceAfterFunding = await tokensAPI.balance(Polkadot, accountId);
            assert.equal(
                balanceBeforeFunding.add(expectedAllowance).toString(),
                balanceAfterFunding.toString()
            );
        });

        it("should fail to get funds from faucet again", async () => {
            const accountId = newAccountId(api, account.address);
            assert.isRejected(faucet.fundAccount(accountId, CurrencyIdLiteral.DOT));
        });
    });
});
