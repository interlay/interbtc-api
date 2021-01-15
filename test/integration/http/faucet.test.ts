import { ApiPromise, Keyring } from "@polkadot/api";
import { FaucetClient } from "../../../src/http";
import { createPolkadotAPI } from "../../../src/factory";
import { defaultEndpoint } from "../../config";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountData } from "@polkadot/types/interfaces/balances";
import { assert } from "../../chai";
import Big from "big.js";

describe.skip("Faucet", function () {
    this.timeout(100000);

    let api: ApiPromise;
    let faucet: FaucetClient;

    let keyring: Keyring;
    let bob: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(defaultEndpoint);
        // TODO: Replace url with the one exposed from docker-compose
        // after the faucet is released as a service
        const url = "http://localhost:3034";
        faucet = new FaucetClient(url);
        keyring = new Keyring({ type: "sr25519" });
        bob = keyring.addFromUri("//Bob");
    });

    after(async () => {
        api.disconnect();
    });

    describe("Funding", () => {
        it("should get funds from faucet", async () => {
            const bobAccountId = api.createType("AccountId", bob.address);
            const expectedAllowance = 10000000000;
            const balanceBeforeFunding = (await api.query.dot.account(bobAccountId)) as AccountData;
            await faucet.fundAccount(bobAccountId);
            const balanceAfterFunding = (await api.query.dot.account(bobAccountId)) as AccountData;
            const balanceBeforeFundingBig = new Big(balanceBeforeFunding.free.toString());
            const balanceAfterFundingBig = new Big(balanceAfterFunding.free.toString());
            assert.isTrue(balanceBeforeFundingBig.add(new Big(expectedAllowance)).eq(balanceAfterFundingBig));
        });

        it("should fail to get funds from faucet again", async () => {
            const bobAccountId = api.createType("AccountId", bob.address);
            assert.isRejected(faucet.fundAccount(bobAccountId));
        });
    });
});
