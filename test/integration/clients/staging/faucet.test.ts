import { ApiPromise, Keyring } from "@polkadot/api";
import { FaucetClient } from "../../../../src/clients";
import { createPolkadotAPI } from "../../../../src/factory";
import { defaultParachainEndpoint, defaultFaucetEndpoint } from "../../../config";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountData } from "@polkadot/types/interfaces/balances";
import { assert } from "../../../chai";
import Big from "big.js";

describe("Faucet", function () {
    this.timeout(100000);

    let api: ApiPromise;
    let faucet: FaucetClient;

    let keyring: Keyring;
    let helen: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        faucet = new FaucetClient(defaultFaucetEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        helen = keyring.addFromUri("//Helen");
    });

    after(async () => {
        api.disconnect();
    });

    describe("Funding", () => {
        it("should get funds from faucet", async () => {
            const helenAccountId = api.createType("AccountId", helen.address);
            const expectedAllowance = 10000000000;
            const balanceBeforeFunding = (await api.query.backing.account(helenAccountId)) as AccountData;
            await faucet.fundAccount(helenAccountId);
            const balanceAfterFunding = (await api.query.backing.account(helenAccountId)) as AccountData;
            const balanceBeforeFundingBig = new Big(balanceBeforeFunding.free.toString());
            const balanceAfterFundingBig = new Big(balanceAfterFunding.free.toString());
            assert.isTrue(balanceBeforeFundingBig.add(new Big(expectedAllowance)).eq(balanceAfterFundingBig));
        });

        it("should fail to get funds from faucet again", async () => {
            const helenAccountId = api.createType("AccountId", helen.address);
            assert.isRejected(faucet.fundAccount(helenAccountId));
        });
    });
});
