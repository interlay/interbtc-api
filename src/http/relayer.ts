import {
    GetAddressResponse,
    RegisterStakedRelayerRequest,
    SuggestStatusUpdateRequest,
    VoteOnStatusUpdateRequest,
    StatusCode,
    ErrorCode,
    H256Le,
} from "../interfaces/default";
import { u256 } from "@polkadot/types/primitive";
import { getAPITypes } from "../factory";
import { TypeRegistry } from "@polkadot/types";
import { Constructor } from "@polkadot/types/types";
import BN from "bn.js";
import fetch, { RequestInfo } from "node-fetch";

type RequestParams = Array<string> | undefined;
type JsonRpcId = number | string;

export interface JsonRpcRequest {
    jsonrpc: string;
    method: string;
    params: RequestParams;
    id?: JsonRpcId | null;
}

export interface JsonRpcError {
    code: number;
    message: string;
    data?: any;
}

export interface JsonRpcResponse {
    jsonrpc: string;
    result?: string;
    error?: JsonRpcError;
    id?: JsonRpcId | null;
}

async function post(request: RequestInfo, method: string, params?: RequestParams): Promise<JsonRpcResponse> {
    const id = Math.random().toString(16).substring(7);
    const body: JsonRpcRequest = {
        jsonrpc: "2.0",
        id,
        method,
        params,
    };
    const httpResponse = await fetch(request, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
    });

    const jsonResponse: JsonRpcResponse = await httpResponse.json();
    if (jsonResponse.id != id) {
        throw new Error("Invalid id in JsonRpcResponse");
    }

    if (!httpResponse.ok) {
        throw new Error(jsonResponse.error?.message);
    }

    return jsonResponse;
}

export class StakedRelayerClient {
    url: string;
    registry: TypeRegistry;

    constr: {
        GetAddressResponse: Constructor<GetAddressResponse>;
        RegisterStakedRelayerRequest: Constructor<RegisterStakedRelayerRequest>;
        SuggestStatusUpdateRequest: Constructor<SuggestStatusUpdateRequest>;
        VoteOnStatusUpdateRequest: Constructor<VoteOnStatusUpdateRequest>;
        StatusCode: Constructor<StatusCode>;
        ErrorCode: Constructor<ErrorCode>;
        H256Le: Constructor<H256Le>;
    };

    constructor(url: string) {
        this.url = url;
        this.registry = new TypeRegistry();
        this.registry.register(getAPITypes());

        this.constr = {
            GetAddressResponse: this.registry.createClass("GetAddressResponse"),
            RegisterStakedRelayerRequest: this.registry.createClass("RegisterStakedRelayerRequest"),
            SuggestStatusUpdateRequest: this.registry.createClass("SuggestStatusUpdateRequest"),
            VoteOnStatusUpdateRequest: this.registry.createClass("VoteOnStatusUpdateRequest"),
            StatusCode: this.registry.createClass("StatusCode"),
            ErrorCode: this.registry.createClass("ErrorCode"),
            H256Le: this.registry.createClass("H256Le"),
        };
    }

    async connected(): Promise<boolean> {
        try {
            await this.getAddress();
            return true;
        } catch (error) {
            return false;
        }
    }

    async getAddress(): Promise<string> {
        const response = await post(this.url, "get_address");
        const result = new this.constr["GetAddressResponse"](this.registry, response.result);
        return result.address.toString();
    }

    async registerStakedRelayer(stake: number): Promise<void> {
        const request = new this.constr["RegisterStakedRelayerRequest"](this.registry, { stake: new BN(stake) });
        await post(this.url, "register_staked_relayer", [request.toHex()]);
    }

    async deregisterStakedRelayer(): Promise<void> {
        await post(this.url, "deregister_staked_relayer");
    }

    async suggestStatusUpdate(
        deposit: number,
        statusCode: StatusCode,
        message: string,
        addError?: ErrorCode,
        removeError?: ErrorCode,
        block_hash?: H256Le
    ): Promise<void> {
        const request = new this.constr["SuggestStatusUpdateRequest"](this.registry, {
            deposit: new BN(deposit),
            status_code: statusCode,
            add_error: addError,
            remove_error: removeError,
            block_hash,
            message,
        });
        await post(this.url, "suggest_status_update", [request.toHex()]);
    }

    suggestInvalidBlock(deposit: number, hash: string, message: string): Promise<void> {
        const statusCode = new this.constr["StatusCode"](this.registry, { error: true });
        const addError = new this.constr["ErrorCode"](this.registry, { invalidbtcrelay: true });
        const block_hash = new this.constr["H256Le"](this.registry, hash);
        return this.suggestStatusUpdate(deposit, statusCode, message, addError, undefined, block_hash);
    }

    async voteOnStatusUpdate(status_update_id: u256, approve: boolean): Promise<void> {
        const request = new this.constr["VoteOnStatusUpdateRequest"](this.registry, {
            status_update_id,
            approve,
        });
        await post(this.url, "vote_on_status_update", [request.toHex()]);
    }
}
