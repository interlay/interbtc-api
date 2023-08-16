import { createProvider } from "../../src/factory";

import { WsProvider, HttpProvider } from "@polkadot/rpc-provider";

describe("createProvider", () => {
    it("should support HTTP endpoints", () => {
        for (const endpoint of ["http://example.com", "https://example.com"]) {
            const httpProvider = createProvider(endpoint);
            expect(httpProvider).toBeInstanceOf(HttpProvider);
        }
    });

    it("should support Websocket endpoints", () => {
        for (const endpoint of ["ws://example.com", "wss://example.com"]) {
            const wsProvider = createProvider(endpoint, false);
            expect(wsProvider).toBeInstanceOf(WsProvider);
        }
    });
});
