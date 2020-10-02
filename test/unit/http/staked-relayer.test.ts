import { expect } from "../../chai";
import { StakedRelayerClient } from "../../../src/http";
import { JsonRpcRequest, JsonRpcResponse } from "../../../src/http/relayer";

import nock from "nock";

describe("stakedRelayerClient", async () => {
    const defaultEndpoint = "http://127.0.0.1:2342";
    let stakedRelayerClient: StakedRelayerClient;

    beforeEach(async () => {
        stakedRelayerClient = new StakedRelayerClient(defaultEndpoint);
    });

    it("should reject response without json response body", async () => {
        const scope = nock(defaultEndpoint).post("/").reply(200, {});

        const result = stakedRelayerClient.getAddress();
        await expect(result).to.be.rejected;

        scope.isDone();
    });

    it("should reject response with incorrect json rpc id", async () => {
        const scope = nock(defaultEndpoint).post("/").reply(200, {
            jsonrpc: "2.0",
            id: "invalid",
        });

        const result = stakedRelayerClient.getAddress();
        await expect(result).to.be.rejectedWith("Invalid id in JsonRpcResponse");

        scope.isDone();
    });

    it("should reject response with custom error message", async () => {
        const scope = nock(defaultEndpoint)
            .post("/")
            .reply(
                500,
                (_, body: JsonRpcRequest): JsonRpcResponse => {
                    return {
                        jsonrpc: "2.0",
                        id: body.id,
                        error: {
                            code: -32603,
                            message: "Something went wrong",
                        },
                    };
                }
            );

        const result = stakedRelayerClient.getAddress();
        await expect(result).to.be.rejectedWith("Something went wrong");

        scope.isDone();
    });

    it("should successfully decode getAddress response", async () => {
        const scope = nock(defaultEndpoint)
            .post("/")
            .reply(
                200,
                (_, body: JsonRpcRequest): JsonRpcResponse => {
                    return {
                        jsonrpc: "2.0",
                        id: body.id,
                        result:
                            "0xc03547727776614546357a58623236467a397263517044575335374374455248704e6568584350634e6f48474b75745159",
                    };
                }
            );

        const result = await stakedRelayerClient.getAddress();
        expect(result).to.eq("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");

        scope.isDone();
    });
});
