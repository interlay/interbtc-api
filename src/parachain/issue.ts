import { ApiPromise } from "@polkadot/api";
import { AddressOrPair, SubmittableExtrinsic } from "@polkadot/api/submittable/types";
import { IssueRequest, PolkaBTC } from "../interfaces/default";
import { Bytes } from "@polkadot/types";
import { AccountId, H256, Hash, EventRecord } from "@polkadot/types/interfaces";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";

import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import {
    pagedIterator,
    decodeFixedPointType,
    roundUpBtcToNearestSatoshi,
    encodeParachainRequest,
} from "../utils";
import { DefaultFeeAPI, FeeAPI } from "./fee";
import BN from "bn.js";
import {allocateAmountsToVaults, getRequestIdsFromEvents, RequestOptions} from "../utils/issueRedeem";
import { ElectrsAPI } from "../external";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";

export type IssueRequestResult = { id: Hash; issueRequest: IssueRequestExt };
export type IssueLimits = { singleVaultMaxIssuable: BN; totalMaxIssuable: BN };

export interface IssueRequestExt extends Omit<IssueRequest, "btc_address"> {
    // network encoded btc address
    btc_address: string;
}

export function encodeIssueRequest(req: IssueRequest, network: Network): IssueRequestExt {
    return encodeParachainRequest<IssueRequest, IssueRequestExt>(req, network);
}

/**
 * @category PolkaBTC Bridge
 * The type Big represents DOT or PolkaBTC denominations,
 * while the type BN represents Planck or Satoshi denominations.
 */
export interface IssueAPI extends TransactionAPI {
    /**
     * Gets the threshold for issuing with a single vault, and the maximum total
     * issue request size. Additionally passes the list of vaults for caching.
     * @param vaults (optional) A list of the vaults available to issue from. If not provided, will fetch from the
     * parachain (incurring an extra request).
     * @returns An object of type {singleVault, maxTotal, vaultsCache}
     */
    getRequestLimits(vaults?: Map<AccountId, BN>): Promise<IssueLimits>;

    /**
     * Request issuing of PolkaBTC.
     * @param amountSat PolkaBTC amount (denoted in Satoshi) to issue.
     * @param options (optional): an object specifying
     * - atomic (optional) Whether the issue request should be handled atomically or not. Only makes a difference
     * if more than one vault is needed to fulfil it. Defaults to false.
     * - availableVaults (optional) A list of all vaults usable for issue. If not provided, will fetch from the parachain.
     * - retries (optional) Number of times to re-try issuing, if some of the requests fail. Defaults to 0.
     * @returns An array of type {issueId, issueRequest} if the requests succeeded. The function throws an error otherwise.
     */
    request(
        amountSat: BN,
        options?: RequestOptions
    ): Promise<IssueRequestResult[]>;

    /**
     * Send a batch of aggregated issue transactions (to one or more vaults)
     * @param amountsPerVault A mapping of vaults to issue from, and PolkaBTC amounts (in Satoshi) to issue using each vault
     * @param griefingCollateralRate The percentage of an issue request which must be locked as griefing collateral
     * (must correspond to the parachain property)
     * @param atomic Whether the issue request should be handled atomically or not. Only makes a difference if more than
     * one vault is needed to fulfil it.
     * @returns An array of type {issueId, vault} if the requests succeeded.
     * @throws Rejects the promise if none of the requests succeeded (or if at least one failed, when atomic=true).
     */
    requestAdvanced(
        amountsPerVault: Map<AccountId, BN>,
        griefingCollateralRate: Big,
        atomic: boolean
    ): Promise<IssueRequestResult[]>;

    /**
     * Send an issue execution transaction
     * @remarks Both `merkleProof` and `rawTx` must be passed for them to be used and not overwritten
     * by data from the Blockstream API.
     *
     * @param issueId The ID returned by the issue request transaction
     * @param txId The ID of the Bitcoin transaction that sends funds to the vault address
     * @param merkleProof (Optional) The merkle inclusion proof of the Bitcoin transaction.
     * @param rawTx (Optional) The raw bytes of the Bitcoin transaction
     */
    execute(issueId: string, txId: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void>;
    /**
     * Send an issue cancellation transaction. After the issue period has elapsed,
     * the issuance of PolkaBTC can be cancelled. As a result, the griefing collateral
     * of the requester will be slashed and sent to the vault that had prepared to issue.
     * @param issueId The ID returned by the issue request transaction
     */
    cancel(issueId: H256): Promise<void>;
    /**
     * @remarks Testnet utility function
     * @param blocks The time difference in number of blocks between an issue request is created
     * and required completion time by a user. The issue period has an upper limit
     * to prevent griefing of vault collateral.
     */
    setIssuePeriod(blocks: number): Promise<void>;
    /**
     *
     * @returns The time difference in number of blocks between an issue request is created
     * and required completion time by a user. The issue period has an upper limit
     * to prevent griefing of vault collateral.
     */
    getIssuePeriod(): Promise<number>;
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
     * @param issueId The IDs of the batch of issue request to fetch
     * @returns The issue request objects
     */
    getRequestsByIds(issueIds: H256[]): Promise<IssueRequestExt[]>;
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

    constructor(api: ApiPromise, private btcNetwork: Network, private electrsAPI: ElectrsAPI, account?: AddressOrPair) {
        super(api, account);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork);
        this.feeAPI = new DefaultFeeAPI(api);
    }

    async getRequestLimits(vaults?: Map<AccountId, BN>): Promise<IssueLimits> {
        if (!vaults) vaults = await this.vaultsAPI.getVaultsWithIssuableTokens();
        const [singleVaultMaxIssuable, totalMaxIssuable] = [...vaults.entries()].reduce(
            ([singleVault, maxTotal], [_, vaultAvailable]) => {
                maxTotal.iadd(vaultAvailable);
                singleVault = BN.max(singleVault, vaultAvailable);
                return [singleVault, maxTotal];
            },
            [new BN(0), new BN(0)]
        );
        return { singleVaultMaxIssuable, totalMaxIssuable };
    }

    /**
     * @param events The EventRecord array returned after sending an issue request transaction
     * @returns The issueId associated with the request. If the EventRecord array does not
     * contain issue request events, the function throws an error.
     */
    private getIssueIdsFromEvents(events: EventRecord[]): Hash[] {
        return getRequestIdsFromEvents(events, this.api.events.issue.RequestIssue, this.api);
    }

    async request(
        amountSat: BN,
        options?: {
            availableVaults?: Map<AccountId, BN>,
            atomic?: boolean,
            retries?: number,
        }
    ): Promise<IssueRequestResult[]> {
        try {
            const availableVaults = options?.availableVaults || await this.vaultsAPI.getVaultsWithIssuableTokens();
            const atomic = !!options?.atomic;
            const retries = options?.retries || 0;
            const griefingCollateralRate = await this.feeAPI.getIssueGriefingCollateralRate();
            const amountsPerVault = allocateAmountsToVaults(availableVaults, amountSat);
            const result = await this.requestAdvanced(amountsPerVault, griefingCollateralRate, atomic);
            const successfulSum = result.reduce((sum, req) => sum.add(req.issueRequest.amount), new BN(0));
            const remainder = amountSat.sub(successfulSum);
            if (remainder.eqn(0) || retries === 0) return result;
            else {
                return (await this.request(remainder, {availableVaults, atomic, retries: retries - 1})).concat(result);
            }
        } catch (e) {
            return Promise.reject(e.message);
        }
    }

    async requestAdvanced(
        amountsPerVault: Map<AccountId, BN>,
        griefingCollateralRate: Big,
        atomic: boolean
    ): Promise<IssueRequestResult[]> {
        const txes = new Array<SubmittableExtrinsic<"promise">>();
        for (const [vault, amount] of amountsPerVault) {
            const griefingCollateral = await this.feeAPI.getGriefingCollateralInPlanck(amount as PolkaBTC, griefingCollateralRate);
            txes.push(this.api.tx.issue.requestIssue(amount, vault, griefingCollateral.toString()));
        }
        const batch = (atomic ? this.api.tx.utility.batchAll : this.api.tx.utility.batch)(txes);
        try {
            const result = await this.sendLogged(batch, this.api.events.issue.RequestIssue);
            const ids = this.getIssueIdsFromEvents(result.events);
            const issueRequests = await this.getRequestsByIds(ids);
            return ids.map((issueId, idx) => ({ id: issueId, issueRequest: issueRequests[idx] }));
        } catch (e) {
            return Promise.reject(e.message);
        }
    }

    async execute(requestId: string, btcTxId: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void> {
        const parsedRequestId = this.api.createType("H256", "0x" + requestId);
        const parsedBtcTxId = this.api.createType(
            "H256",
            "0x" + Buffer.from(btcTxId, "hex").reverse().toString("hex")
        );
        if (!merkleProof || !rawTx) {
            [merkleProof, rawTx] = await this.electrsAPI.getParsedExecutionParameters(btcTxId);
        }
        const executeIssueTx = this.api.tx.issue.executeIssue(parsedRequestId, parsedBtcTxId, merkleProof, rawTx);
        await this.sendLogged(executeIssueTx, this.api.events.issue.ExecuteIssue);
    }

    async cancel(issueId: H256): Promise<void> {
        const cancelIssueTx = this.api.tx.issue.cancelIssue(issueId);
        await this.sendLogged(cancelIssueTx, this.api.events.issue.CancelIssue);
    }

    async setIssuePeriod(blocks: number): Promise<void> {
        const period = this.api.createType("BlockNumber", blocks);
        const tx = this.api.tx.sudo
            .sudo(
                this.api.tx.issue.setIssuePeriod(period)
            );
        await this.sendLogged(tx);
    }

    async getIssuePeriod(): Promise<number> {
        const blockNumber = await this.api.query.issue.issuePeriod();
        return blockNumber.toNumber();
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

    async getRequestById(issueId: H256): Promise<IssueRequestExt> {
        return (await this.getRequestsByIds([issueId]))[0];
    }

    async getRequestsByIds(issueIds: H256[]): Promise<IssueRequestExt[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return Promise.all(
            issueIds.map(async (issueId) =>
                encodeIssueRequest(await this.api.query.issue.issueRequests.at(head, issueId), this.btcNetwork)
            )
        );
    }
}
