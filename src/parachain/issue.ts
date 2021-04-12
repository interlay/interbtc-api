import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import { AccountId, H256, Hash } from "@polkadot/types/interfaces";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { DOT, IssueRequest, PolkaBTC } from "../interfaces/default";
import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import {
    pagedIterator,
    decodeFixedPointType,
    DefaultTransactionAPI,
    roundUpBtcToNearestSatoshi,
    encodeParachainRequest,
    TransactionAPI,
} from "../utils";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { DefaultFeeAPI, FeeAPI } from "./fee";
import { BTCCoreAPI } from "../external";

export type IssueRequestResult = { id: Hash; issueRequest: IssueRequestExt };

export interface IssueRequestExt extends Omit<IssueRequest, "btc_address"> {
    // network encoded btc address
    btc_address: string;
}

export function encodeIssueRequest(req: IssueRequest, network: Network): IssueRequestExt {
    return encodeParachainRequest<IssueRequest, IssueRequestExt>(req, network);
}

/**
 * @category PolkaBTC Bridge
 */
export interface IssueAPI extends TransactionAPI {
    /**
     * Send an issue request transaction
     * @param amountSat PolkaBTC amount (denoted in Satoshi) to issue
     * @param vaultId (optional) Request the issue from a specific vault. If this parameter is unspecified,
     * a random vault will be selected
     * @returns An object of type {issueId, vault} if the request succeeded. The function throws an error otherwise.
     */
    request(amountSat: PolkaBTC, vaultId?: AccountId, griefingCollateral?: DOT): Promise<IssueRequestResult>;
    /**
     * Send an issue execution transaction
     * @param issueId The ID returned by the issue request transaction
     * @param txId The ID of the Bitcoin transaction that sends funds to the vault address
     */
    execute(issueId: string, txId: string): Promise<void>;
    /**
     * Send an issue cancellation transaction. After the issue period has elapsed,
     * the issuance of PolkaBTC can be cancelled. As a result, the griefing collateral
     * of the requester will be slashed and sent to the vault that had prepared to issue.
     * @param issueId The ID returned by the issue request transaction
     */
    cancel(issueId: H256): Promise<void>;
    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void;
    /**
     * @returns An array containing the issue requests
     */
    list(): Promise<IssueRequestExt[]>;
    /**
     * @param perPage Number of issue requests to iterate through at a time
     * @returns An AsyncGenerator to be used as an iterator
     */
    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]>;
    /**
     * @param account The ID of the account whose issue requests are to be retrieved
     * @returns A mapping from the issue request ID to the issue request object, corresponding to the requests of
     * the given account
     */
    mapForUser(account: AccountId): Promise<Map<H256, IssueRequestExt>>;
    /**
     * @param issueId The ID of the issue request to fetch
     * @returns An issue request object
     */
    getRequestById(issueId: H256): Promise<IssueRequestExt>;
    /**
     * @returns The time difference in number of blocks between when an issue request is created
     * and required completion time by a user.
     */
    getIssuePeriod(): Promise<BlockNumber>;
    /**
     * @returns The fee charged for issuing. For instance, "0.005" stands for 0.5%
     */
    getFeeRate(): Promise<Big>;
    /**
     * @param amountBtc The amount, in BTC, for which to compute the issue fees
     * @returns The fees, in BTC
     */
    getFeesToPay(amountBtc: string): Promise<string>;
    /**
     * @param amountBtc The amount, in Satoshi, for which to compute the griefing collateral
     * @returns The griefing collateral, in Planck
     */
    getGriefingCollateralInPlanck(amountSat: PolkaBTC): Promise<Big>;
}

export class DefaultIssueAPI extends DefaultTransactionAPI implements IssueAPI  {
    private vaultsAPI: VaultsAPI;
    private feeAPI: FeeAPI;

    constructor(api: ApiPromise, private btcNetwork: Network, private btcCoreAPI: BTCCoreAPI, account?: AddressOrPair) {
        super(api, account);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork);
        this.feeAPI = new DefaultFeeAPI(api);
    }

    /**
     * @param events The EventRecord array returned after sending an issue request transaction
     * @returns The issueId associated with the request. If the EventRecord array does not
     * contain issue request events, the function throws an error.
     */
    private getRequestIdFromEvents(events: EventRecord[]): Hash {
        for (const { event } of events) {
            if (this.api.events.issue.RequestIssue.is(event)) {
                const hash = this.api.createType("Hash", event.data[0]);
                return hash;
            }
        }
        throw new Error("Request transaction failed");
    }

    async request(amountSat: PolkaBTC, vaultId?: AccountId): Promise<IssueRequestResult> {
        if (!vaultId) {
            vaultId = await this.vaultsAPI.selectRandomVaultIssue(amountSat);
        }
        const griefingCollateralPlanck = await this.getGriefingCollateralInPlanck(amountSat);
        const requestIssueTx = this.api.tx.issue.requestIssue(amountSat, vaultId, griefingCollateralPlanck.toString());
        const result = await this.sendLogged(requestIssueTx, this.api.events.issue.RequestIssue);
        try {
            const id = this.getRequestIdFromEvents(result.events);
            const issueRequest = await this.getRequestById(id);
            return { id, issueRequest };
        } catch (e) {
            return Promise.reject(e.message);
        }

    }

    async execute(requestId: string, btcTxId: string): Promise<void> {
        const [merkleProof, rawTx] = await Promise.all([
            this.btcCoreAPI.getMerkleProof(btcTxId),
            this.btcCoreAPI.getRawTransaction(btcTxId)
        ]);
        const parsedRequestId = this.api.createType("H256", "0x" + requestId);
        const parsedBtcTxId = this.api.createType(
            "H256",
            "0x" + Buffer.from(btcTxId, "hex").reverse().toString("hex")
        );
        const parsedMerkleProof = this.api.createType("Bytes", "0x" + merkleProof);
        const parsedRawTx = this.api.createType("Bytes", "0x" + rawTx.toString("hex"));

        const executeIssueTx = this.api.tx.issue.executeIssue(parsedRequestId, parsedBtcTxId, parsedMerkleProof, parsedRawTx);
        await this.sendLogged(executeIssueTx, this.api.events.issue.ExecuteIssue);
    }

    async cancel(issueId: H256): Promise<void> {
        const cancelIssueTx = this.api.tx.issue.cancelIssue(issueId);
        await this.sendLogged(cancelIssueTx, this.api.events.issue.CancelIssue);
    }

    async list(): Promise<IssueRequestExt[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const issueRequests = await this.api.query.issue.issueRequests.entriesAt(head);
        return issueRequests.map((v) => v[1]).map((req: IssueRequest) => encodeIssueRequest(req, this.btcNetwork));
    }

    async mapForUser(account: AccountId): Promise<Map<H256, IssueRequestExt>> {
        const issueRequestPairs: [H256, IssueRequest][] = await this.api.rpc.issue.getIssueRequests(account);
        const mapForUser: Map<H256, IssueRequestExt> = new Map<H256, IssueRequestExt>();
        issueRequestPairs.forEach((issueRequestPair) =>
            mapForUser.set(issueRequestPair[0], encodeIssueRequest(issueRequestPair[1], this.btcNetwork))
        );
        return mapForUser;
    }

    async getGriefingCollateralInPlanck(amountSat: PolkaBTC): Promise<Big> {
        const griefingCollateralRate = await this.feeAPI.getIssueGriefingCollateralRate();
        return await this.feeAPI.getGriefingCollateralInPlanck(amountSat, griefingCollateralRate);
    }

    async getFeesToPay(amountBtc: string): Promise<string> {
        const feePercentage = await this.getFeeRate();
        const amountBig = new Big(amountBtc);
        const feeBtc = amountBig.mul(feePercentage);
        return roundUpBtcToNearestSatoshi(feeBtc.toString());
    }

    /**
     * @returns The fee charged for issuing. For instance, "0.005" stands for 0.5%
     */
    async getFeeRate(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const issueFee = await this.api.query.fee.issueFee.at(head);
        // TODO: return Big from decodeFixedPointType
        return new Big(decodeFixedPointType(issueFee));
    }

    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]> {
        return pagedIterator<IssueRequest>(this.api.query.issue.issueRequests, perPage);
    }

    async getIssuePeriod(): Promise<BlockNumber> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return (await this.api.query.issue.issuePeriod.at(head)) as BlockNumber;
    }

    async getRequestById(issueId: H256): Promise<IssueRequestExt> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return encodeIssueRequest(await this.api.query.issue.issueRequests.at(head, issueId), this.btcNetwork);
    }
}
