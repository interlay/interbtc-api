import { ApiPromise } from "@polkadot/api";
import BN from "bn.js";
import sinon from "sinon";
import { DefaultVaultsAPI, VaultExt } from "../../../src/parachain/vaults";
import { createPolkadotAPI } from "../../mock/factory";
import { PolkaBTC } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import { AccountId } from "@polkadot/types/interfaces";
import { TypeRegistry } from "@polkadot/types";
import { DefaultIssueAPI } from "../../../src/parachain/issue";
import { networks } from "bitcoinjs-lib";

describe("vaultsAPI", () => {
    let api: ApiPromise;
    let vaultsAPI: DefaultVaultsAPI;
    let issueAPI: DefaultIssueAPI;
    const registry = new TypeRegistry();

    // random value
    const decodedAccountId = "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d";

    function numberToPolkaBTC(x: number): PolkaBTC {
        return new BN(x) as PolkaBTC;
    }

    before(async () => {
        api = await createPolkadotAPI();
    });

    beforeEach(async () => {
        vaultsAPI = new DefaultVaultsAPI(api, networks.regtest);
        issueAPI = new DefaultIssueAPI(api, networks.regtest);
    });

    after(() => {
        return api.disconnect();
    });

    it("should getIssuedPolkaBTCAmount", async () => {
        sinon.stub(vaultsAPI, "get").returns(Promise.resolve(<VaultExt>{ issued_tokens: new BN(100) as PolkaBTC }));
        const vaultId = <AccountId>{};
        const issuedPolkaBTCAmount: PolkaBTC = await vaultsAPI.getIssuedPolkaBTCAmount(vaultId);
        assert.equal(issuedPolkaBTCAmount.toNumber(), 100);
    });

    it("should compute totalIssuedPolkaBTCAmount with nonzero sum", async () => {
        const mockIssuedPolkaBTCAmount: PolkaBTC[] = [1, 2, 3].map((x) => numberToPolkaBTC(x));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sinon.stub(vaultsAPI, <any>"getIssuedPolkaBTCAmounts").returns(Promise.resolve(mockIssuedPolkaBTCAmount));
        const totalIssuedPolkaBTCAmount: BN = await vaultsAPI.getTotalIssuedPolkaBTCAmount();
        assert.equal(totalIssuedPolkaBTCAmount.toNumber(), 6);
    });

    it("should compute totalIssuedPolkaBTCAmount with zero sum", async () => {
        const mockIssuedPolkaBTCAmount: PolkaBTC[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sinon.stub(vaultsAPI, <any>"getIssuedPolkaBTCAmounts").returns(Promise.resolve(mockIssuedPolkaBTCAmount));
        const totalIssuedPolkaBTCAmount = await vaultsAPI.getTotalIssuedPolkaBTCAmount();
        assert.equal(totalIssuedPolkaBTCAmount.toNumber(), 0);
    });
});
