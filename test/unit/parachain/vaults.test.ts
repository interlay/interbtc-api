import { ApiPromise } from "@polkadot/api";
import BN from "bn.js";
import sinon from "sinon";
import { DefaultVaultsAPI, VaultExt } from "../../../src/parachain/vaults";
import { createPolkadotAPI } from "../../mock/factory";
import { PolkaBTC } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import { AccountId } from "@polkadot/types/interfaces";
import { networks } from "bitcoinjs-lib";

describe("vaultsAPI", () => {
    let api: ApiPromise;
    let vaultsAPI: DefaultVaultsAPI;

    function numberToPolkaBTC(x: number): PolkaBTC {
        return new BN(x) as PolkaBTC;
    }

    before(async () => {
        api = await createPolkadotAPI();
    });

    beforeEach(async () => {
        vaultsAPI = new DefaultVaultsAPI(api, networks.regtest);
    });

    after(() => {
        return api.disconnect();
    });

    it("should getIssuedPolkaBTCAmount", async () => {
        sinon.stub(vaultsAPI, "get").returns(Promise.resolve(<VaultExt>{ issued_tokens: new BN(100000000) as PolkaBTC }));
        const vaultId = <AccountId>{};
        const issuedPolkaBTCAmount = await vaultsAPI.getIssuedAmount(vaultId);
        assert.equal(issuedPolkaBTCAmount.toString(), "1");
    });

    it("should compute totalIssuedAmount with nonzero sum", async () => {
        const mockIssuedPolkaBTCAmount: PolkaBTC[] = [1, 2, 3].map((x) => numberToPolkaBTC(x));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sinon.stub(vaultsAPI, <any>"getIssuedAmounts").returns(Promise.resolve(mockIssuedPolkaBTCAmount));
        const totalIssuedAmount = await vaultsAPI.getTotalIssuedAmount();
        assert.equal(totalIssuedAmount.toString(), "6");
    });

    it("should compute totalIssuedAmount with zero sum", async () => {
        const mockIssuedPolkaBTCAmount: PolkaBTC[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sinon.stub(vaultsAPI, <any>"getIssuedAmounts").returns(Promise.resolve(mockIssuedPolkaBTCAmount));
        const totalIssuedAmount = await vaultsAPI.getTotalIssuedAmount();
        assert.equal(totalIssuedAmount.toString(), "0");
    });
});
