import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import { AccountId, H256 } from "@polkadot/types/interfaces";
import { Network } from "bitcoinjs-lib";
import { RefundRequest } from "../interfaces";
import { encodeParachainRequest } from "../utils";

export interface RefundRequestExt extends Omit<RefundRequest, "btc_address"> {
    // network encoded btc address
    btc_address: string;
}

export function encodeRefundRequest(req: RefundRequest, network: Network): RefundRequestExt {
    return encodeParachainRequest<RefundRequest, RefundRequestExt>(req, network);
}

export interface RefundAPI {
    setAccount(account: AddressOrPair): void;
    list(): Promise<RefundRequestExt[]>;
    mapForUser(account: AccountId): Promise<Map<H256, RefundRequestExt>>;
    getRequestById(refundId: string): Promise<RefundRequestExt>;
    getRequestByIssueId(issueId: string): Promise<RefundRequestExt>;
}

export class DefaultRefundAPI {

    constructor(private api: ApiPromise, private btcNetwork: Network, private account?: AddressOrPair) {
    }

    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void {
        this.account = account;
    }

    /**
     * @returns An array containing the refund requests
     */
    async list(): Promise<RefundRequestExt[]> {
        const refundRequests = await this.api.query.refund.refundRequests.entries();
        return refundRequests.map((v) => encodeRefundRequest(v[1], this.btcNetwork));
    }

    /**
     * @param account The ID of the account whose refunds are to be retrieved
     * @returns A mapping from the replace ID to the replace object, corresponding to the given account
     */
    async mapForUser(account: AccountId): Promise<Map<H256, RefundRequestExt>> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customAPIRPC = this.api.rpc as any;
        const refundPairs: [H256, RefundRequest][] = await customAPIRPC.refund.getRefundRequests(account);
        const mapForUser: Map<H256, RefundRequestExt> = new Map<H256, RefundRequestExt>();
        refundPairs.forEach((refundPair) =>
            mapForUser.set(refundPair[0], encodeRefundRequest(refundPair[1], this.btcNetwork))
        );
        return mapForUser;
    }

    /**
     * @param issueId The ID of the refund to fetch
     * @returns A refund object
     */
    async getRequestById(refundId: string): Promise<RefundRequestExt> {
        return encodeRefundRequest(await this.api.query.refund.refundRequests(refundId), this.btcNetwork);
    }

    /**
     * @param issueId The ID of the refund to fetch
     * @returns A refund object
     */
    async getRequestByIssueId(issueId: string): Promise<RefundRequestExt> {
        const customAPIRPC = this.api.rpc as any;
        const keyValuePair = await customAPIRPC.refund.getRefundRequestsByIssueId(issueId);
        return encodeRefundRequest(keyValuePair[1], this.btcNetwork);
    }

} 
