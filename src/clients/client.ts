import fetch from "cross-fetch";

type RequestParams = Array<string> | undefined;
type JsonRpcId = number | string;

export interface JsonRpcRequest {
    jsonrpc: string;
    method: string;
    params: RequestParams;
    id?: JsonRpcId | null;
}

export interface JsonRpcError<T> {
    code: number;
    message: string;
    data?: T;
}

export interface JsonRpcResponse<T> {
    jsonrpc: string;
    result?: string;
    error?: JsonRpcError<T>;
    id?: JsonRpcId | null;
}

export class JsonRpcClient<T> {
    url: string;

    constructor(url: string) {
        this.url = url;
    }

    async post(method: string, params?: RequestParams): Promise<JsonRpcResponse<T>> {
        const id = Math.random().toString(16).substring(7);
        const body: JsonRpcRequest = {
            jsonrpc: "2.0",
            id,
            method,
            params,
        };
        const httpResponse = await fetch(this.url, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
            },
        });

        // 502 Bad Gateway
        if (httpResponse.status == 502) {
            throw new Error("Invalid response");
        }

        const jsonResponse: JsonRpcResponse<T> = await httpResponse.json();
        if (jsonResponse.id != id) {
            throw new Error("Invalid id in JsonRpcResponse");
        }

        if (jsonResponse.error || !httpResponse.ok) {
            throw new Error(jsonResponse.error?.message);
        }

        return jsonResponse;
    }
}
