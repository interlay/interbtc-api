import { assert } from "../../chai";
import { TypeRegistry } from "@polkadot/types";
import { createAPIRegistry } from "../../../src/factory";
import { VaultStatusExt } from "../../../src/types";

describe("Vault", () => {
    let reg: TypeRegistry;

    before(() => {
        reg = createAPIRegistry();
        reg.register({
            "VaultRegistryVaultStatus": {
                "_enum": {
                    "Active": "bool",
                    "Liquidated": "",
                    "CommittedTheft": ""
                }
            }
        });
    });

    function parseVaultStatus(...params: unknown[]): VaultStatusExt {
        return VaultStatusExt.parseVaultStatus(reg.createType("VaultRegistryVaultStatus", ...params));
    }

    it("should parse vault status", () => {
        assert.equal(parseVaultStatus({ active: true }), VaultStatusExt.Active);
        assert.equal(parseVaultStatus({ active: false }), VaultStatusExt.Inactive);
        assert.equal(parseVaultStatus({ liquidated: true }), VaultStatusExt.Liquidated);
        assert.equal(parseVaultStatus({ committedTheft: true }), VaultStatusExt.CommittedTheft);
    });
});
