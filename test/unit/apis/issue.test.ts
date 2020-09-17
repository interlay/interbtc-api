import { ApiPromise } from "@polkadot/api";
import { assert } from "../../chai";

import Issue from "../../../src/apis/issue";
import { createAPI } from "../../../src/factory";

describe("issue", () => {
    // FIXME: hangs although test has succeeded
    // disconnect seems to be behaving awkwardly
    describe.skip("request", () => {
        let api: ApiPromise;
        let issue: Issue;

        beforeEach(async () => {
            api = await createAPI("mock", false);
            issue = new Issue(api);
        });

        afterEach(() => {
            return api.disconnect();
        });

        it("should fail if no account is set", () => {
            const amount = api.createType("PolkaBTC", 10);
            assert.isRejected(issue.request(amount));
        });
    });
});
