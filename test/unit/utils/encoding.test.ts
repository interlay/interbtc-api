import { TypeRegistry } from "@polkadot/types";
import { assert } from "../../chai";
import { getAPITypes } from "../../../src/factory";
import { reverseEndianness, uint8ArrayToString, stripHexPrefix, reverseEndiannessHex } from "../../../src/utils";
import { H256Le } from "../../../src/interfaces/default";

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
});
