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

/**
 * @category PolkaBTC Bridge
 */
export interface RefundAPI {
    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void;
    /**
     * @returns An array containing the refund requests
     */
    list(): Promise<RefundRequestExt[]>;
    /**
     * @param account The ID of the account whose refund requests are to be retrieved
     * @returns A mapping from the refund ID to the refund request, corresponding to the given account
     */
    mapForUser(account: AccountId): Promise<Map<H256, RefundRequestExt>>;
    /**
     * @param issueId The ID of the refund to fetch
     * @returns A refund object
     */
    getRequestById(refundId: H256): Promise<RefundRequestExt>;
    /**
     * @param issueId The ID of the refund request to fetch
     * @returns A refund request object
     */
    getRequestByIssueId(issueId: H256): Promise<RefundRequestExt>;
}

export class DefaultRefundAPI {
    constructor(private api: ApiPromise, private btcNetwork: Network, private account?: AddressOrPair) { }

    setAccount(account: AddressOrPair): void {
        this.account = account;
    }

    async list(): Promise<RefundRequestExt[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const refundRequests = await this.api.query.refund.refundRequests.entriesAt(head);
        return refundRequests.map((v) => encodeRefundRequest(v[1], this.btcNetwork));
    }

    async mapForUser(account: AccountId): Promise<Map<H256, RefundRequestExt>> {
        const refundPairs: [H256, RefundRequest][] = await this.api.rpc.refund.getRefundRequests(account);
        const mapForUser: Map<H256, RefundRequestExt> = new Map<H256, RefundRequestExt>();
        refundPairs.forEach((refundPair) =>
            mapForUser.set(refundPair[0], encodeRefundRequest(refundPair[1], this.btcNetwork))
        );
        return mapForUser;
    }

    async getRequestById(refundId: H256): Promise<RefundRequestExt> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return encodeRefundRequest(await this.api.query.refund.refundRequests.at(head, refundId), this.btcNetwork);
    }

    async getRequestByIssueId(issueId: H256): Promise<RefundRequestExt> {
        try {
            const keyValuePair = await this.api.rpc.refund.getRefundRequestsByIssueId(issueId);
            return encodeRefundRequest(keyValuePair[1], this.btcNetwork);
        } catch (error) {
            return Promise.reject(`Error fetching refund request by issue id: ${error}`);
        }
    }
}
