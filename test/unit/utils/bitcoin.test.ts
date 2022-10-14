import { TypeRegistry } from "@polkadot/types";
import { decodeBtcAddress, encodeBtcAddress } from "../../../src/utils";
import { assert } from "../../chai";
import * as bitcoinjs from "bitcoinjs-lib";
import { BitcoinAddress } from "@polkadot/types/lookup";
import { getAPITypes } from "../../../src/factory";
import { H160, H256 } from "@polkadot/types/interfaces/runtime";

describe("Bitcoin", () => {
    let registry: TypeRegistry;

    const createH256 = (hash: string): H256 => {
        return registry.createType("H256", hash);
    };

    const createH160 = (hash: string): H160 => {
        return registry.createType("H160", hash);
    };

    before(() => {
        registry = new TypeRegistry();
        registry.register(getAPITypes());
    });

    describe("decodeBtcAddress", () => {
        it("should get correct hash for p2pkh address", () => {
            assert.deepEqual(decodeBtcAddress("1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH", bitcoinjs.networks.bitcoin), {
                p2pkh: "0x751e76e8199196d454941c45d1b3a323f1433bd6",
            });
        });

        it("should get correct hash for p2sh address", () => {
            assert.deepEqual(decodeBtcAddress("3JvL6Ymt8MVWiCNHC7oWU6nLeHNJKLZGLN", bitcoinjs.networks.bitcoin), {
                p2sh: "0xbcfeb728b584253d5f3f70bcb780e9ef218a68f4",
            });
        });

        it("should get correct hash for p2wpkh address", () => {
            // compare hex because type lib has trouble with this enum
            assert.deepEqual(
                decodeBtcAddress("bcrt1qjvmc5dtm4qxgtug8faa5jdedlyq4v76ngpqgrl", bitcoinjs.networks.regtest),
                {
                    p2wpkhv0: "0x93378a357ba80c85f1074f7b49372df901567b53",
                }
            );
            assert.deepEqual(
                decodeBtcAddress("tb1q45uq0q4v22fspeg3xjnkgf8a0v7pqgjks4k6sz", bitcoinjs.networks.testnet),
                {
                    p2wpkhv0: "0xad380782ac529300e51134a76424fd7b3c102256",
                }
            );
            assert.deepEqual(
                decodeBtcAddress("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", bitcoinjs.networks.bitcoin),
                {
                    p2wpkhv0: "0xe8df018c7e326cc253faac7e46cdc51e68542c42",
                }
            );
        });

        it("should get correct hash for p2wsh address", () => {
            assert.deepEqual(
                decodeBtcAddress(
                    "bc1q75f6dv4q8ug7zhujrsp5t0hzf33lllnr3fe7e2pra3v24mzl8rrqtp3qul",
                    bitcoinjs.networks.bitcoin
                ),
                {
                    p2wshv0: "0xf513a6b2a03f11e15f921c0345bee24c63fffe638a73eca823ec58aaec5f38c6",
                }
            );
        });
    });

    describe("encodeBtcAddress", () => {
        it("should encode correct p2pkh address from hash", () => {
            const mockAddress = <BitcoinAddress>{
                isP2pkh: true,
                asP2pkh: createH160("0x751e76e8199196d454941c45d1b3a323f1433bd6"),
                type: "P2pkh",
            };

            const encodedAddress = encodeBtcAddress(mockAddress, bitcoinjs.networks.bitcoin);
            assert.equal(encodedAddress, "1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH");
        });

        it("should encode correct p2sh address from hash", () => {
            const mockAddress = <BitcoinAddress>{
                isP2sh: true,
                asP2sh: createH160("0xbcfeb728b584253d5f3f70bcb780e9ef218a68f4"),
                type: "P2sh",
            };

            const encodedAddress = encodeBtcAddress(mockAddress, bitcoinjs.networks.bitcoin);
            assert.equal(encodedAddress, "3JvL6Ymt8MVWiCNHC7oWU6nLeHNJKLZGLN");
        });

        it("should encode correct p2wpkh address from hash", () => {
            const mockAddress = <BitcoinAddress>{
                isP2wpkHv0: true,
                asP2wpkHv0: createH160("0x93378a357ba80c85f1074f7b49372df901567b53"),
                type: "P2wpkHv0",
            };

            const encodedAddress = encodeBtcAddress(mockAddress, bitcoinjs.networks.regtest);
            assert.equal(encodedAddress, "bcrt1qjvmc5dtm4qxgtug8faa5jdedlyq4v76ngpqgrl");
        });

        it("should encode correct p2wsh address from hash", () => {
            const mockAddress = <BitcoinAddress>{
                isP2wsHv0: true,
                asP2wsHv0: createH256("0xf513a6b2a03f11e15f921c0345bee24c63fffe638a73eca823ec58aaec5f38c6"),
                type: "P2wsHv0",
            };

            const encodedAddress = encodeBtcAddress(mockAddress, bitcoinjs.networks.bitcoin);
            assert.equal(encodedAddress, "bc1q75f6dv4q8ug7zhujrsp5t0hzf33lllnr3fe7e2pra3v24mzl8rrqtp3qul");
        });
    });
});
