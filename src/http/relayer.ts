import { Client, HttpClientOptions, HttpClient } from "jayson";
import {
    GetAddressResponse,
    GetParachainStatusResponse,
    GetStatusUpdateRequest,
    GetStatusUpdateResponse,
    RegisterStakedRelayerRequest,
    SuggestStatusUpdateRequest,
    StatusCode,
    ErrorCode,
    StatusUpdate,
} from "@interlay/polkabtc/interfaces/default";
import { getAPITypes } from "../factory";
import { TypeRegistry } from "@polkadot/types";
import { Constructor } from "@polkadot/types/types";
import BN from "bn.js";

interface JsonResponse {
    jsonrpc: "2.0";
    id: string | number;
    result: string;
}

export class StakedRelayerClient {
    client: HttpClient;
    registry: TypeRegistry;

    constr: {
        GetAddressResponse: Constructor<GetAddressResponse>;
        GetParachainStatusResponse: Constructor<GetParachainStatusResponse>;
        GetStatusUpdateRequest: Constructor<GetStatusUpdateRequest>;
        GetStatusUpdateResponse: Constructor<GetStatusUpdateResponse>;
        RegisterStakedRelayerRequest: Constructor<RegisterStakedRelayerRequest>;
        SuggestStatusUpdateRequest: Constructor<SuggestStatusUpdateRequest>;
    };

    constructor(options?: HttpClientOptions) {
        this.client = Client.http({
            headers: {
                "Content-Type": "application/json",
            },
            ...options,
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
        };
    }

    async getAddress(): Promise<string> {
        return new Promise((resolve, reject) =>
            this.client.request("get_address", [], (err: any, response: JsonResponse) => {
                if (err) reject(err);
                console.log(response);
                const result = new this.constr["GetAddressResponse"](this.registry, response.result);
                resolve(result.address.toString());
            })
        );
    }

    async getParachainStatus(): Promise<StatusCode> {
        return new Promise((resolve, reject) =>
            this.client.request("get_parachain_status", [], (err: any, response: JsonResponse) => {
                if (err) reject(err);
                const result = new this.constr["GetParachainStatusResponse"](this.registry, response.result);
                resolve(result.status);
            })
        );
    }

    async getStatusUpdate(id: number): Promise<StatusUpdate> {
        const request = new this.constr["GetStatusUpdateRequest"](this.registry, { id });
        return new Promise((resolve, reject) =>
            this.client.request("get_status_update", [request.toHex()], (err: any, response: JsonResponse) => {
                if (err) reject(err);
                const result = new this.constr["GetStatusUpdateResponse"](this.registry, response.result);
                resolve(result.status);
            })
        );
    }

    async registerStakedRelayer(stake: number): Promise<void> {
        const request = new this.constr["RegisterStakedRelayerRequest"](this.registry, { stake: new BN(stake) });
        await new Promise((resolve, reject) =>
            this.client.request("register_staked_relayer", [request.toHex()], (err: any, response: JsonResponse) =>
                err ? reject(err) : resolve(response)
            )
        );
    }

    async deregisterStakedRelayer(): Promise<void> {
        await new Promise((resolve, reject) =>
            this.client.request("deregister_staked_relayer", [], (err: any, response: JsonResponse) =>
                err ? reject(err) : resolve(response)
            )
        );
    }

    async suggestStatusUpdate(
        deposit: number,
        statusCode: StatusCode,
        addError?: ErrorCode,
        removeError?: ErrorCode
    ): Promise<void> {
        const request = new this.constr["SuggestStatusUpdateRequest"](
            this.registry,
            new BN(deposit),
            statusCode,
            addError,
            removeError
        );
        await new Promise((resolve, reject) =>
            this.client.request("suggest_status_update", [request.toHex()], (err: any, response: JsonResponse) =>
                err ? reject(err) : resolve(response)
            )
        );
    }
}
