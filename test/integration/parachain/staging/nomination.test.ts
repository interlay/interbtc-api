import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import Big from "big.js";
import * as bitcoinjs from "bitcoinjs-lib";

import { DefaultNominationAPI, DefaultVaultsAPI, NominationAPI, VaultsAPI } from "../../../../src";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { defaultParachainEndpoint } from "../../../config";

describe("NominationAPI", () => {
    let api: ApiPromise;
    let bob: KeyringPair;
    let nominationAPI: NominationAPI;
    let vaultsAPI: VaultsAPI;
    let charlie_stash: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        const keyring = new Keyring({ type: "sr25519" });
        bob = keyring.addFromUri("//Bob");
        nominationAPI = new DefaultNominationAPI(api, bitcoinjs.networks.regtest, bob);
        vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest);
        // The account of a vault from docker-compose
        charlie_stash = keyring.addFromUri("//Charlie//stash");
    });

    after(() => {
        return api.disconnect();
    });

    it("Should opt a vault in and out of nomination", async () => {
        await optInAndPreserveAPIAccount(charlie_stash);
        const nominationVaults = await nominationAPI.listVaults();
        assert.equal(1, nominationVaults.length);
        assert.equal(charlie_stash.address, nominationVaults.map(v => v.toString())[0]);
        await optOutAndPreserveAPIAccount(charlie_stash);
        assert.equal(0, (await nominationAPI.listVaults()).length);
    });

    it("Should nominate to and withdraw from a vault", async () => {
        await optInAndPreserveAPIAccount(charlie_stash);

        // Deposit
        await nominationAPI.depositCollateral(charlie_stash.address, new Big(1));
        const nominators = await nominationAPI.listNominators();
        assert.equal(1, nominators.length);
        const nominator = nominators[0];
        // `nominator` is of type `[nominatorId, vaultId]`.
        const nominatorId = nominator[0].toString();
        const vaultId = nominator[1].toString();
        assert.equal(bob.address, nominatorId);
        assert.equal(charlie_stash.address, vaultId);
        
        // Withdraw
        await nominationAPI.withdrawCollateral(charlie_stash.address, new Big(1));
        const nominatorsAfterWithdrawal = await nominationAPI.listNominators();
        assert.equal(1, nominatorsAfterWithdrawal.length);
        const nominatorCollateral = await nominationAPI.getTotalNomination(bob.address);
        assert.equal("0", nominatorCollateral.toString());

        await optOutAndPreserveAPIAccount(charlie_stash);
    });

    async function optInAndPreserveAPIAccount(vaultAccount: KeyringPair) {
        const initialNominationAPIAccount = nominationAPI.getAccount();
        nominationAPI.setAccount(vaultAccount);
        await nominationAPI.optIn();
        if(initialNominationAPIAccount) {
            nominationAPI.setAccount(initialNominationAPIAccount);
        }
    }

    async function optOutAndPreserveAPIAccount(vaultAccount: KeyringPair) {
        const initialNominationAPIAccount = nominationAPI.getAccount();
        nominationAPI.setAccount(vaultAccount);
        await nominationAPI.optOut();
        if(initialNominationAPIAccount) {
            nominationAPI.setAccount(initialNominationAPIAccount);
        }
    }

});
