import {
    AccountIdJsonRpcResponse,
    RegisterStakedRelayerJsonRpcRequest,
    SuggestStatusUpdateJsonRpcRequest,
    VoteOnStatusUpdateJsonRpcRequest,
    StatusCode,
    ErrorCode,
    H256Le,
} from "../interfaces/default";
import { u256 } from "@polkadot/types/primitive";
import { getAPITypes } from "../factory";
import { TypeRegistry } from "@polkadot/types";
import { Constructor } from "@polkadot/types/types";
import BN from "bn.js";
import { JsonRpcClient } from "./client";

export class StakedRelayerClient extends JsonRpcClient {
    registry: TypeRegistry;

    constr: {
        AccountIdJsonRpcResponse: Constructor<AccountIdJsonRpcResponse>;
        RegisterStakedRelayerJsonRpcRequest: Constructor<RegisterStakedRelayerJsonRpcRequest>;
        SuggestStatusUpdateJsonRpcRequest: Constructor<SuggestStatusUpdateJsonRpcRequest>;
        VoteOnStatusUpdateJsonRpcRequest: Constructor<VoteOnStatusUpdateJsonRpcRequest>;
        StatusCode: Constructor<StatusCode>;
        ErrorCode: Constructor<ErrorCode>;
        H256Le: Constructor<H256Le>;
    };

    constructor(url: string) {
        super(url);
        this.registry = new TypeRegistry();
        this.registry.register(getAPITypes());

        this.constr = {
            AccountIdJsonRpcResponse: this.registry.createClass("AccountIdJsonRpcResponse"),
            RegisterStakedRelayerJsonRpcRequest: this.registry.createClass("RegisterStakedRelayerJsonRpcRequest"),
            SuggestStatusUpdateJsonRpcRequest: this.registry.createClass("SuggestStatusUpdateJsonRpcRequest"),
            VoteOnStatusUpdateJsonRpcRequest: this.registry.createClass("VoteOnStatusUpdateJsonRpcRequest"),
            StatusCode: this.registry.createClass("StatusCode"),
            ErrorCode: this.registry.createClass("ErrorCode"),
            H256Le: this.registry.createClass("H256Le"),
        };
    }

    async isConnected(): Promise<boolean> {
        try {
            await this.getAccountId();
            return true;
        } catch (error) {
            return false;
        }
    }

    async getAccountId(): Promise<string> {
        const response = await this.post("account_id");
        const result = new this.constr["AccountIdJsonRpcResponse"](this.registry, response.result);
        return result.account_id.toString();
    }

    async registerStakedRelayer(stake: number): Promise<void> {
        const request = new this.constr["RegisterStakedRelayerJsonRpcRequest"](this.registry, { stake: new BN(stake) });
        await this.post("register_staked_relayer", [request.toHex()]);
    }

    async deregisterStakedRelayer(): Promise<void> {
        await this.post("deregister_staked_relayer");
    }

    async suggestStatusUpdate(
        deposit: number,
        statusCode: StatusCode,
        message: string,
        addError?: ErrorCode,
        removeError?: ErrorCode,
        block_hash?: H256Le
    ): Promise<void> {
        const request = new this.constr["SuggestStatusUpdateJsonRpcRequest"](this.registry, {
            deposit: new BN(deposit),
            status_code: statusCode,
            add_error: addError,
            remove_error: removeError,
            block_hash,
            message,
        });
        await this.post("suggest_status_update", [request.toHex()]);
    }

    suggestInvalidBlock(deposit: number, hash: string, message: string): Promise<void> {
        const statusCode = new this.constr["StatusCode"](this.registry, { error: true });
        const addError = new this.constr["ErrorCode"](this.registry, { invalidbtcrelay: true });
        const block_hash = new this.constr["H256Le"](this.registry, hash);
        return this.suggestStatusUpdate(deposit, statusCode, message, addError, undefined, block_hash);
    }

    async voteOnStatusUpdate(status_update_id: u256, approve: boolean): Promise<void> {
        const request = new this.constr["VoteOnStatusUpdateJsonRpcRequest"](this.registry, {
            status_update_id,
            approve,
        });
        await this.post("vote_on_status_update", [request.toHex()]);
    }
}
