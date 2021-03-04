import { createPolkabtcAPI } from "../../../src/factory";
import { PolkaBTCAPI } from "../../../src/polkabtc-api";
import { assert } from "../../chai";

describe.skip("PolkaBTCAPIMock", () => {
    let polkaBTC: PolkaBTCAPI;

    before(async () => {
        polkaBTC = await createPolkabtcAPI("mock");
    });

    after(() => {
        return polkaBTC.api.disconnect();
    });

    it("should retrieve mock data from unparameterized methods", async () => {
        const issueRequests = await polkaBTC.issue.list();
        assert.equal(issueRequests.length, 2);
        const totalStakedDOTAmount = await polkaBTC.stakedRelayer.getTotalStakedDOTAmount();
        // toNumber() trims BigNumber to an integer
        assert.equal(totalStakedDOTAmount.toNumber(), 16);
    });

});
