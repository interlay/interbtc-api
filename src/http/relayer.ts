import ClientBrowser from "jayson/lib/client/browser";
import { JSONRPCErrorLike, JSONRPCResultLike } from "jayson";
import {
    GetAddressResponse,
    GetParachainStatusResponse,
    GetStatusUpdateRequest,
    GetStatusUpdateResponse,
    RegisterStakedRelayerRequest,
    SuggestStatusUpdateRequest,
    VoteOnStatusUpdateRequest,
    StatusCode,
    ErrorCode,
    StatusUpdate,
    H256Le,
} from "@interlay/polkabtc/interfaces/default";
import { u256 } from "@polkadot/types/primitive";
import { getAPITypes } from "../factory";
import { TypeRegistry } from "@polkadot/types";
import { Constructor } from "@polkadot/types/types";
import BN from "bn.js";

if (typeof window === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const _fetch = require("node-fetch");
} else {
    const _fetch = window.fetch;
}

type JsonRpcResult = JSONRPCResultLike;

type JsonRpcError = JSONRPCErrorLike | null | undefined;

export class StakedRelayerClient {
    client: ClientBrowser;
    registry: TypeRegistry;

    constr: {
        GetAddressResponse: Constructor<GetAddressResponse>;
        GetParachainStatusResponse: Constructor<GetParachainStatusResponse>;
        GetStatusUpdateRequest: Constructor<GetStatusUpdateRequest>;
        GetStatusUpdateResponse: Constructor<GetStatusUpdateResponse>;
        RegisterStakedRelayerRequest: Constructor<RegisterStakedRelayerRequest>;
        SuggestStatusUpdateRequest: Constructor<SuggestStatusUpdateRequest>;
        VoteOnStatusUpdateRequest: Constructor<VoteOnStatusUpdateRequest>;
        StatusCode: Constructor<StatusCode>;
        ErrorCode: Constructor<ErrorCode>;
    };

    constructor(url: RequestInfo) {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const callServer = function (request: string, callback: Function) {
            const options = {
                headers: {
                    "Content-Type": "application/json",
                }
            };

            fetch(url, options)
                .then(function (res) { return res.text(); })
                .then(function (text) { callback(null, text); })
                .catch(function (err) { callback(err); });
        };

        this.client = new ClientBrowser(callServer, {
        });

        this.registry = new TypeRegistry();
        this.registry.register(getAPITypes());

        this.constr = {
            GetAddressResponse: this.registry.createClass("GetAddressResponse"),
            GetParachainStatusResponse: this.registry.createClass("GetParachainStatusResponse"),
            GetStatusUpdateRequest: this.registry.createClass("GetStatusUpdateRequest"),
            GetStatusUpdateResponse: this.registry.createClass("GetStatusUpdateResponse"),
            RegisterStakedRelayerRequest: this.registry.createClass("RegisterStakedRelayerRequest"),
            SuggestStatusUpdateRequest: this.registry.createClass("SuggestStatusUpdateRequest"),
            VoteOnStatusUpdateRequest: this.registry.createClass("VoteOnStatusUpdateRequest"),
            StatusCode: this.registry.createClass("StatusCode"),
            ErrorCode: this.registry.createClass("ErrorCode"),
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
        return new Promise((resolve, reject) =>
            this.client.request("get_address", [], (err: JsonRpcError, response: JsonRpcResult) => {
                if (err) return reject(err);
                const result = new this.constr["GetAddressResponse"](this.registry, response.result);
                resolve(result.address.toString());
            })
        );
    }

    async getParachainStatus(): Promise<StatusCode> {
        return new Promise((resolve, reject) =>
            this.client.request("get_parachain_status", [], (err: JsonRpcError, response: JsonRpcResult) => {
                if (err) return reject(err);
                const result = new this.constr["GetParachainStatusResponse"](this.registry, response.result);
                resolve(result.status);
            })
        );
    }

    async getStatusUpdate(status_update_id: number): Promise<StatusUpdate> {
        const request = new this.constr["GetStatusUpdateRequest"](this.registry, { status_update_id });
        return new Promise((resolve, reject) =>
            this.client.request(
                "get_status_update",
                [request.toHex()],
                (err: JsonRpcError, response: JsonRpcResult) => {
                    if (err) return reject(err);
                    const result = new this.constr["GetStatusUpdateResponse"](this.registry, response.result);
                    resolve(result.status);
                }
            )
        );
    }

    async registerStakedRelayer(stake: number): Promise<void> {
        const request = new this.constr["RegisterStakedRelayerRequest"](this.registry, { stake: new BN(stake) });
        await new Promise((resolve, reject) =>
            this.client.request(
                "register_staked_relayer",
                [request.toHex()],
                (err: JsonRpcError, response: JsonRpcResult) => (err ? reject(err) : resolve(response))
            )
        );
    }

    async deregisterStakedRelayer(): Promise<void> {
        await new Promise((resolve, reject) =>
            this.client.request("deregister_staked_relayer", [], (err: JsonRpcError, response: JsonRpcResult) =>
                err ? reject(err) : resolve(response)
            )
        );
    }

    async suggestStatusUpdate(
        deposit: number,
        statusCode: StatusCode,
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
        });
        await new Promise((resolve, reject) =>
            this.client.request(
                "suggest_status_update",
                [request.toHex()],
                (err: JsonRpcError, response: JsonRpcResult) => (err ? reject(err) : resolve(response))
            )
        );
    }

    suggestInvalidBlock(deposit: number, block_hash: H256Le): Promise<void> {
        const statusCode = new this.constr["StatusCode"](this.registry, { error: true });
        const addError = new this.constr["ErrorCode"](this.registry, { invalidbtcrelay: true });
        return this.suggestStatusUpdate(deposit, statusCode, addError, undefined, block_hash);
    }

    async voteOnStatusUpdate(status_update_id: u256, approve: boolean): Promise<void> {
        const request = new this.constr["VoteOnStatusUpdateRequest"](this.registry, {
            status_update_id,
            approve,
        });
        await new Promise((resolve, reject) =>
            this.client.request(
                "vote_on_status_update",
                [request.toHex()],
                (err: JsonRpcError, response: JsonRpcResult) => (err ? reject(err) : resolve(response))
            )
        );
    }
}
