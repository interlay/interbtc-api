import { PolkaBTC, Vault } from "../../../src/interfaces/default";
import { AccountId } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { assert } from "../../chai";
import VaultsAPI from "../../../src/apis/vaults";
import { createAPI } from "../../../src/factory";
import BN from "bn.js";
const sinon = require("sinon");

describe("vaultsAPI", () => {
    
    function numberToPolkaBTC(x: number): PolkaBTC {
        return new BN(x) as PolkaBTC;
    }

    describe.skip("request", () => {
        let api: ApiPromise;
        let vaultsAPI: VaultsAPI;
        
        beforeEach(async () => {
            const defaultEndpoint = "ws://127.0.0.1:9944";
            api = await createAPI(defaultEndpoint);
            vaultsAPI = new VaultsAPI(api);
        });

        afterEach(() => {
            return api.disconnect();
        });

        it("should getIssuedPolkaBTCAmount", async () => {
            sinon.stub(vaultsAPI, "get").returns(
                <Vault> { issued_tokens: new BN(100) as PolkaBTC }
            );
            const vaultId = <AccountId> {}
            const issuedPolkaBTCAmount: PolkaBTC = await vaultsAPI.getIssuedPolkaBTCAmount(vaultId);
            assert.equal(issuedPolkaBTCAmount.toNumber(), 100);
        });

        it("should compute totalIssuedPolkaBTCAmount with nonzero sum", async () => {
            const mockIssuedPolkaBTCAmount: PolkaBTC[] = [1 , 2, 3].map(x => numberToPolkaBTC(x));
            sinon.stub(vaultsAPI, "getIssuedPolkaBTCAmounts").returns(mockIssuedPolkaBTCAmount);
            const totalIssuedPolkaBTCAmount: BN = await vaultsAPI.getTotalIssuedPolkaBTCAmount();
            assert.equal(totalIssuedPolkaBTCAmount.toNumber(), 6);
        });

        it("should compute totalIssuedPolkaBTCAmount with zero sum", async () => {
            const mockIssuedPolkaBTCAmount: PolkaBTC[] = [];
            sinon.stub(vaultsAPI, "getIssuedPolkaBTCAmounts").returns(mockIssuedPolkaBTCAmount);
            const totalIssuedPolkaBTCAmount = await vaultsAPI.getTotalIssuedPolkaBTCAmount();
            assert.equal(totalIssuedPolkaBTCAmount.toNumber(), 0);
        });

    });
});
