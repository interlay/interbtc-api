import { ApiPromise } from "@polkadot/api";
import BN from "bn.js";
import sinon from "sinon";
import { DefaultVaultsAPI, VaultExt } from "../../../src/parachain/vaults";
import { createPolkadotAPI } from "../../mock/factory";
import { Wrapped } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import { AccountId } from "@polkadot/types/interfaces";
import { networks } from "bitcoinjs-lib";

describe("vaultsAPI", () => {
    let api: ApiPromise;
    let vaultsAPI: DefaultVaultsAPI;

    function numberToInterBTC(x: number): Wrapped {
        return new BN(x) as Wrapped;
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

    it("should getIssuedInterBTCAmount", async () => {
        sinon.stub(vaultsAPI, "get").returns(Promise.resolve(<VaultExt>{ issued_tokens: new BN(100000000) as Wrapped }));
        const vaultId = <AccountId>{};
        const issuedInterBTCAmount = await vaultsAPI.getIssuedAmount(vaultId);
        assert.equal(issuedInterBTCAmount.toString(), "1");
    });

    it("should compute totalIssuedAmount with nonzero sum", async () => {
        const mockIssuedInterBTCAmount: Wrapped[] = [1, 2, 3].map((x) => numberToInterBTC(x));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sinon.stub(vaultsAPI, <any>"getIssuedAmounts").returns(Promise.resolve(mockIssuedInterBTCAmount));
        const totalIssuedAmount = await vaultsAPI.getTotalIssuedAmount();
        assert.equal(totalIssuedAmount.toString(), "6");
    });

    it("should compute totalIssuedAmount with zero sum", async () => {
        const mockIssuedInterBTCAmount: Wrapped[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sinon.stub(vaultsAPI, <any>"getIssuedAmounts").returns(Promise.resolve(mockIssuedInterBTCAmount));
        const totalIssuedAmount = await vaultsAPI.getTotalIssuedAmount();
        assert.equal(totalIssuedAmount.toString(), "0");
    });
});
