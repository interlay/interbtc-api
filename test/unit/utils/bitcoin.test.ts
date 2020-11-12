import { getP2WPKHFromH160, getH160FromP2WPKH } from "../../../src/utils";
import { assert } from "../../chai";
import { H160 } from "@polkadot/types/interfaces/runtime";
import { TypeRegistry } from "@polkadot/types";
import { getAPITypes } from "../../../src/factory";
import * as bitcoin from "bitcoinjs-lib";

describe("Bitcoin", () => {
    let registry: TypeRegistry;

    beforeEach(() => {
        registry = new TypeRegistry();
        registry.register(getAPITypes());
    });

    const createH160 = (hash: string): H160 => {
        return new (registry.createClass("H160"))(registry, hash) as H160;
    };

    it("should get correct hash for address", () => {
        assert.equal(
            getH160FromP2WPKH("bcrt1qjvmc5dtm4qxgtug8faa5jdedlyq4v76ngpqgrl", bitcoin.networks.regtest)!,
            "0x93378a357ba80c85f1074f7b49372df901567b53"
        );
        assert.equal(
            getH160FromP2WPKH("tb1q45uq0q4v22fspeg3xjnkgf8a0v7pqgjks4k6sz", bitcoin.networks.testnet)!,
            "0xad380782ac529300e51134a76424fd7b3c102256"
        );
        assert.equal(
            getH160FromP2WPKH("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", bitcoin.networks.bitcoin)!,
            "0xe8df018c7e326cc253faac7e46cdc51e68542c42"
        );
    });

    it("should correctly decode & encode address", () => {
        const p2wpkh = "bcrt1qcweth0ufkhqqq2xv8z6vlrd0md4pcygqq5g6h7";
        const hash = createH160(getH160FromP2WPKH(p2wpkh, bitcoin.networks.regtest)!);
        const address = getP2WPKHFromH160(hash, bitcoin.networks.regtest);
        assert.equal(address, p2wpkh, "addresses should be the same");
    });
});
