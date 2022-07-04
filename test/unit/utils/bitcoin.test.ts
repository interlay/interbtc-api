import { decodeBtcAddress } from "../../../src/utils";
import { assert } from "../../chai";
import * as bitcoinjs from "bitcoinjs-lib";

describe("Bitcoin", () => {
    it("should get correct hash for address", () => {
        // compare hex because type lib has trouble with this enum
        assert.deepEqual(decodeBtcAddress("bcrt1qjvmc5dtm4qxgtug8faa5jdedlyq4v76ngpqgrl", bitcoinjs.networks.regtest), {
            p2wpkhv0: "0x93378a357ba80c85f1074f7b49372df901567b53",
        });
        assert.deepEqual(decodeBtcAddress("tb1q45uq0q4v22fspeg3xjnkgf8a0v7pqgjks4k6sz", bitcoinjs.networks.testnet), {
            p2wpkhv0: "0xad380782ac529300e51134a76424fd7b3c102256",
        });
        assert.deepEqual(decodeBtcAddress("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", bitcoinjs.networks.bitcoin), {
            p2wpkhv0: "0xe8df018c7e326cc253faac7e46cdc51e68542c42",
        });
    });
});
