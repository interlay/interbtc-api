import PolkaBTCAPIMock from "../../../src/mock/polkabtc-api";
import { AccountId } from "@polkadot/types/interfaces/runtime";
import { assert } from "../../chai";

describe("PolkaBTCAPIMock", () => {
    const polkaBTC = new PolkaBTCAPIMock();

    it("should retrieve mock data from unparameterized methods", async () => {
        const issueRequests = await polkaBTC.issue.list();
        assert.equal(issueRequests.length, 2);
        const totalStakedDOTAmount = await polkaBTC.stakedRelayer.getTotalStakedDOTAmount();
        // toNumber() trims BigNumber to an integer
        assert.equal(totalStakedDOTAmount.toNumber(), 16);
    });

    it("should retrieve mock data from parameterized methods", async () => {
        const activeStakedRelayerId = <AccountId>{};
        const feesEarnedByActiveStakedRelayer = await polkaBTC.stakedRelayer.getFeesEarned(activeStakedRelayerId);
        // toNumber() trims BigNumber to an integer
        assert.equal(feesEarnedByActiveStakedRelayer.toNumber(), 120);
    });
});
