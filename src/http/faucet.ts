import { FundAccountJsonRpcRequest } from "../interfaces/default";
import { getAPITypes } from "../factory";
import { TypeRegistry } from "@polkadot/types";
import { Constructor } from "@polkadot/types/types";
import { AccountId } from "@polkadot/types/interfaces";
import { JsonRpcClient } from "./client";

export class FaucetClient extends JsonRpcClient {
    registry: TypeRegistry;

    constr: {
        FundAccountJsonRpcRequest: Constructor<FundAccountJsonRpcRequest>;
    };

    constructor(url: string) {
        super(url);
        this.registry = new TypeRegistry();
        this.registry.register(getAPITypes());

        this.constr = {
            FundAccountJsonRpcRequest: this.registry.createClass("FundAccountJsonRpcRequest"),
        };
    }

    async fundAccount(account: AccountId): Promise<void> {
        const request = new this.constr["FundAccountJsonRpcRequest"](this.registry, {
            account_id: account,
        });
        await this.post("fund_account", [request.toHex()]);
    }
}
