import { PolkaBTC, Vault } from "../../../src/interfaces/default";
import { AccountId } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { assert } from "../../chai";
import { VaultsAPI, DefaultVaultsAPI } from "../../../src/apis/vaults";
import { createPolkadotAPI } from "../../../src/factory";
import BN from "bn.js";
import sinon from "sinon";

describe("vaultsAPI", () => {

    function numberToPolkaBTC(x: number): PolkaBTC {
        return new BN(x) as PolkaBTC;
    }

    describe.skip("request", () => {
        let api: ApiPromise;
        let vaultsAPI: DefaultVaultsAPI;

        beforeEach(async () => {
            const defaultEndpoint = "ws://127.0.0.1:9944";
            api = await createPolkadotAPI(defaultEndpoint);
            vaultsAPI = new DefaultVaultsAPI(api);
        });

        afterEach(() => {
            return api.disconnect();
        });

        it("should getIssuedPolkaBTCAmount", async () => {
            sinon.stub(vaultsAPI, "get").returns(Promise.resolve(<Vault>{ issued_tokens: new BN(100) as PolkaBTC }));
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
});
