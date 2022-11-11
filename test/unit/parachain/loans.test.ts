import sinon from "sinon";
import { ApiPromise } from "@polkadot/api";
import { DefaultAssetRegistryAPI, DefaultLoansAPI, DefaultTransactionAPI } from "../../../src/";
import { getAPITypes } from "../../../src/factory";

describe("DefaultLoansAPI", () => {
    let api: ApiPromise;
    let stubbedAssetRegistry: sinon.SinonStubbedInstance<DefaultAssetRegistryAPI>;
    let loansApi: DefaultLoansAPI;

    before(() => {
        api = new ApiPromise();
        // disconnect immediately to avoid printing errors
        // we only need the instance to create variables
        api.disconnect();
        api.registerTypes(getAPITypes());
    });

    beforeEach(() => {
        stubbedAssetRegistry = sinon.createStubInstance(DefaultAssetRegistryAPI);
        const transactionAPI = new DefaultTransactionAPI(api);
        loansApi = new DefaultLoansAPI(api, stubbedAssetRegistry, transactionAPI);
    });

    describe("getLendPositionsOfAccount", () => {
        // TODO: add tests
    });

    describe("getBorrowPositionsOfAccount", () => {
        // TODO: add tests
    });

    describe("getLoanAssets", () => {
        // TODO: add tests
    });
});
