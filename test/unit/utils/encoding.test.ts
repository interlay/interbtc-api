import { TypeRegistry } from "@polkadot/types";
import { assert } from "../../chai";
import { getAPITypes } from "../../../src/factory";
import { RedeemStatus } from "../../../src/types";
import {
    reverseEndianness,
    uint8ArrayToString,
    stripHexPrefix,
    reverseEndiannessHex,
    parseRedeemRequestStatus,
} from "../../../src/utils";
import { H256Le } from "../../../src/interfaces/default";
import {
    InterbtcPrimitivesRedeemRedeemRequest,
    InterbtcPrimitivesRedeemRedeemRequestStatus,
} from "@polkadot/types/lookup";

describe("Encoding", () => {
    let registry: TypeRegistry;

    const createH256Le = (hash: string): H256Le => {
        return new (registry.createClass("H256Le"))(registry, hash) as H256Le;
    };

    before(() => {
        registry = new TypeRegistry();
        registry.register(getAPITypes());
    });

    it("should encode / decode same block hash as H256Le", () => {
        const blockHashHexLE = "0x9067166e896765258f6636a082abad6953f17a0e8dc21fc4f85648ceeedbda69";
        const blockHash = createH256Le(blockHashHexLE);
        return assert.equal(blockHash.toHex(), blockHashHexLE);
    });

    it("should strip prefix", () => {
        const blockHashHexBEWithPrefix = "0x5499ac3ca3ddf563ace6b6a56ec2e8bdc5f796bef249445c36d90a69d0757d4c";
        const blockHashHexBEWithoutPrefix = "5499ac3ca3ddf563ace6b6a56ec2e8bdc5f796bef249445c36d90a69d0757d4c";
        assert.equal(stripHexPrefix(blockHashHexBEWithPrefix), blockHashHexBEWithoutPrefix);
        assert.equal(stripHexPrefix(blockHashHexBEWithoutPrefix), blockHashHexBEWithoutPrefix);
    });

    it("should reverse endianness from le to be", () => {
        const blockHashHexLE = "0x9067166e896765258f6636a082abad6953f17a0e8dc21fc4f85648ceeedbda69";
        const blockHashHexBE = "0x69dadbeece4856f8c41fc28d0e7af15369adab82a036668f256567896e166790";
        const blockHash = createH256Le(blockHashHexLE);

        const result = uint8ArrayToString(reverseEndianness(blockHash));
        return assert.equal(result, stripHexPrefix(blockHashHexBE));
    });

    it("should reverse endianness hex", () => {
        const blockHashHexLE = "0x9067166e896765258f6636a082abad6953f17a0e8dc21fc4f85648ceeedbda69";
        const blockHashHexBE = "0x69dadbeece4856f8c41fc28d0e7af15369adab82a036668f256567896e166790";
        return assert.equal(reverseEndiannessHex(blockHashHexLE), stripHexPrefix(blockHashHexBE));
    });

    describe("parseRedeemRequestStatus", () => {
        const buildMockStatus = (status: "Pending" | "Completed" | "Reimbursed" | "Retried") =>
            <InterbtcPrimitivesRedeemRedeemRequestStatus>{
                isPending: status === "Pending",
                isCompleted: status === "Completed",
                isReimbursed: status === "Reimbursed",
                isRetried: status === "Retried",
                type: status,
            };

        const buildMockRedeemRequest = (
            status: InterbtcPrimitivesRedeemRedeemRequestStatus,
            opentime?: number,
            period?: number
        ) => {
            return <InterbtcPrimitivesRedeemRedeemRequest>{
                period: registry.createType("u32", period),
                opentime: registry.createType("u32", opentime),
                status: status,
            };
        };

        const assertEqualPretty = (expected: RedeemStatus, actual: RedeemStatus): void => {
            assert.equal(actual, expected, `Expected '${RedeemStatus[expected]}' but was '${RedeemStatus[actual]}'`);
        };

        it("should correctly parse completed status", () => {
            const mockRequest = buildMockRedeemRequest(buildMockStatus("Completed"));
            const expectedStatus = RedeemStatus.Completed;

            const actualStatus = parseRedeemRequestStatus(mockRequest, 42, 42);

            assertEqualPretty(actualStatus, expectedStatus);
        });

        it("should correctly parse reimbursed status", () => {
            const mockRequest = buildMockRedeemRequest(buildMockStatus("Reimbursed"));
            const expectedStatus = RedeemStatus.Reimbursed;

            const actualStatus = parseRedeemRequestStatus(mockRequest, 42, 42);

            assertEqualPretty(actualStatus, expectedStatus);
        });

        it("should correctly parse retried status", () => {
            const mockRequest = buildMockRedeemRequest(buildMockStatus("Retried"));
            const expectedStatus = RedeemStatus.Retried;

            const actualStatus = parseRedeemRequestStatus(mockRequest, 42, 42);

            assertEqualPretty(actualStatus, expectedStatus);
        });

        describe("should correctly parse expired status", () => {
            const currentBlock = 42;
            const opentimeBlock = 1;
            // pending status internally, but expect expired due to blocks elapsed
            const mockInternalPendingStatus = buildMockStatus("Pending");
            const expectedStatus = RedeemStatus.Expired;

            it("when global redeem period is greater than request period and less than opentime + period", () => {
                const globalRedeemPeriod = currentBlock - 5;
                const requestPeriod = globalRedeemPeriod - 3;
                // preconditions
                assert.isAbove(globalRedeemPeriod, requestPeriod, "Precondition failed: fix test setup");
                assert.isBelow(globalRedeemPeriod, currentBlock, "Precondition failed: fix test setup");

                const mockRequest = buildMockRedeemRequest(mockInternalPendingStatus, opentimeBlock, requestPeriod);

                const actualStatus = parseRedeemRequestStatus(mockRequest, globalRedeemPeriod, currentBlock);

                assertEqualPretty(actualStatus, expectedStatus);
            });

            it("when request period is greater than global redeem period and less than opentime + period", () => {
                const requestPeriod = currentBlock - 3;
                const globalRedeemPeriod = requestPeriod - 5;
                // preconditions
                assert.isAbove(requestPeriod, globalRedeemPeriod, "Precondition failed: fix test setup");
                assert.isBelow(requestPeriod, currentBlock, "Precondition failed: fix test setup");

                const mockRequest = buildMockRedeemRequest(mockInternalPendingStatus, opentimeBlock, requestPeriod);

                const actualStatus = parseRedeemRequestStatus(mockRequest, globalRedeemPeriod, currentBlock);

                assertEqualPretty(actualStatus, expectedStatus);
            });
        });

        describe("should correctly parse pending status", () => {
            const currentBlock = 42;
            const opentimeBlock = 1;
            const mockInternalPendingStatus = buildMockStatus("Pending");
            const expectedStatus = RedeemStatus.PendingWithBtcTxNotFound;

            it("when opentime + period is greater than current block cont", () => {
                const globalRedeemPeriod = 50;
                const requestPeriod = 25;
                // preconditions
                assert.isTrue(
                    opentimeBlock + Math.max(requestPeriod, globalRedeemPeriod) > currentBlock,
                    "Precondition failed: fix test setup"
                );

                const mockRequest = buildMockRedeemRequest(mockInternalPendingStatus, opentimeBlock, requestPeriod);

                const actualStatus = parseRedeemRequestStatus(mockRequest, globalRedeemPeriod, currentBlock);

                assertEqualPretty(actualStatus, expectedStatus);
            });

            it("when opentime + period is equal to current block count", () => {
                const globalRedeemPeriod = currentBlock - opentimeBlock;
                // anything less than above
                const requestPeriod = globalRedeemPeriod - 1;
                // preconditions
                assert.isTrue(
                    opentimeBlock + Math.max(requestPeriod, globalRedeemPeriod) == currentBlock,
                    "Precondition failed: fix test setup"
                );

                const mockRequest = buildMockRedeemRequest(mockInternalPendingStatus, opentimeBlock, requestPeriod);

                const actualStatus = parseRedeemRequestStatus(mockRequest, globalRedeemPeriod, currentBlock);

                assertEqualPretty(actualStatus, expectedStatus);
            });
        });
    });
});
