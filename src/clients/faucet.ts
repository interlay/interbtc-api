import { FundAccountJsonRpcRequest } from "../interfaces/default";
import { getAPITypes } from "../factory";
import { TypeRegistry } from "@polkadot/types";
import { Constructor } from "@polkadot/types/types";
import { AccountId } from "@polkadot/types/interfaces";
import { JsonRpcClient } from "./client";
import { CollateralIdLiteral } from "../types";
import { newCurrencyId } from "../utils";
import { ApiPromise } from "@polkadot/api";

/**
 * @category Clients
 */
export class FaucetClient extends JsonRpcClient<void> {
    registry: TypeRegistry;

    constr: {
        FundAccountJsonRpcRequest: Constructor<FundAccountJsonRpcRequest>;
    };

    constructor(private api: ApiPromise, url: string) {
        super(url);
        this.registry = new TypeRegistry();
        this.registry.register(getAPITypes());

        this.constr = {
            FundAccountJsonRpcRequest: this.registry.createClass("FundAccountJsonRpcRequest"),
        };
    }

    async fundAccount(account: AccountId, currencyIdLiteral: CollateralIdLiteral): Promise<void> {
        const currencyId = newCurrencyId(this.api, currencyIdLiteral);
        const request = new this.constr["FundAccountJsonRpcRequest"](this.registry, {
            account_id: account,
            currency_id: currencyId,
        });
        await this.post("fund_account", [request.toHex()]);
    }
}
