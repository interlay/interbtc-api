import { ApiPromise } from "@polkadot/api";
import BN from "bn.js";
import sinon from "sinon";
import { DefaultVaultsAPI } from "../../../src/apis/vaults";
import { createPolkadotAPI } from "../../../src/factory";
import { IssueRequest, PolkaBTC, RedeemRequest, Vault } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import { GenericAccountId } from "@polkadot/types/generic";
import { AccountId } from "@polkadot/types/interfaces";
import { TypeRegistry } from "@polkadot/types";
import { DefaultIssueAPI } from "../../../src/apis/issue";
import { DefaultRedeemAPI } from "../../../src/apis/redeem";

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
        api = await createPolkadotAPI("mock");
    });

    beforeEach(async () => {
        vaultsAPI = new DefaultVaultsAPI(api);
        issueAPI = new DefaultIssueAPI(api);
    });

    after(() => {
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

    it("should correctly construct IssueRequest map", async () => {
        const issueRequests = [<IssueRequest>(<unknown>{
            vault: new GenericAccountId(registry, decodedAccountId),
        }), <IssueRequest>(<unknown>{
            vault: new GenericAccountId(registry, decodedAccountId),
        })];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sinon.stub(DefaultIssueAPI.prototype, <any>"list").returns(Promise.resolve(issueRequests));
        const issueRequestsWithCurrentVault = await vaultsAPI.mapIssueRequests(
            new GenericAccountId(registry, decodedAccountId)
        );
        assert.equal(issueRequestsWithCurrentVault.size, 1);
    });

    it("should correctly construct RedeemRequest map", async () => {
        const redeemRequests = [<RedeemRequest>(<unknown>{
            vault: new GenericAccountId(registry, decodedAccountId),
        }), <RedeemRequest>(<unknown>{
            vault: new GenericAccountId(registry, decodedAccountId),
        })];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sinon.stub(DefaultRedeemAPI.prototype, <any>"list").returns(Promise.resolve(redeemRequests));
        const redeemRequestsWithCurrentVault = await vaultsAPI.mapRedeemRequests(
            new GenericAccountId(registry, decodedAccountId)
        );
        assert.equal(redeemRequestsWithCurrentVault.size, 1);
    });
});
