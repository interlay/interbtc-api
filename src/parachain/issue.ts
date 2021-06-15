import { ApiPromise } from "@polkadot/api";
import { AddressOrPair, SubmittableExtrinsic } from "@polkadot/api/submittable/types";
import { Bytes } from "@polkadot/types";
import { AccountId, H256, Hash, EventRecord } from "@polkadot/types/interfaces";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";

import { IssueRequest } from "../interfaces/default";
import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import {
    decodeFixedPointType,
    roundUpBtcToNearestSatoshi,
    getTxProof,
    btcToSat,
    dotToPlanck,
    satToBTC,
    stripHexPrefix,
    planckToDOT,
    encodeBtcAddress,
    storageKeyToFirstInner,
    ensureHashEncoded,
} from "../utils";
import { DefaultFeeAPI, FeeAPI } from "./fee";
import { allocateAmountsToVaults, getRequestIdsFromEvents } from "../utils/issueRedeem";
import { ElectrsAPI } from "../external";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { Issue, IssueStatus } from "../types";
import BN from "bn.js";

export type IssueLimits = { singleVaultMaxIssuable: Big; totalMaxIssuable: Big };

export function encodeIssueRequest(
    req: IssueRequest,
    network: Network,
    id: H256 | string,
): Issue {
    const amountBTC = satToBTC(req.amount);
    const fee = satToBTC(req.fee);
    const status = req.status.isCompleted ? IssueStatus.Completed :
        req.status.isCancelled ? IssueStatus.Cancelled :
            IssueStatus.PendingWithBtcTxNotFound;
    return {
        id: stripHexPrefix(id.toString()),
        creationBlock: req.opentime.toNumber(),
        vaultBTCAddress: encodeBtcAddress(req.btc_address, network),
        vaultDOTAddress: req.vault.toString(),
        userDOTAddress: req.requester.toString(),
        vaultWalletPubkey: req.btc_public_key.toString(),
        bridgeFee: fee.toString(),
        amountInterBTC: amountBTC.toString(),
        griefingCollateral: planckToDOT(req.griefing_collateral).toString(),
        status,
    };
}

/**
 * @category InterBTC Bridge
 * The type Big represents DOT or InterBTC denominations,
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
    getRequestLimits(vaults?: Map<AccountId, Big>): Promise<IssueLimits>;

    /**
     * Request issuing of InterBTC.
     * @param amount InterBTC amount (denoted in BTC) to issue.
     * @param atomic (optional) Whether the issue request should be handled atomically or not. Only makes a difference
     * if more than one vault is needed to fulfil it. Defaults to false.
     * @param retries (optional) Number of times to re-try issuing, if some of the requests fail. Defaults to 0.
     * @param availableVaults (optional) A list of all vaults usable for issue. If not provided, will fetch from the parachain.
     * @returns An array of type {issueId, issueRequest} if the requests succeeded. The function throws an error otherwise.
     */
    request(
        amount: Big,
        atomic?: boolean,
        retries?: number,
        availableVaults?: Map<AccountId, Big>
    ): Promise<Issue[]>;

    /**
     * Send a batch of aggregated issue transactions (to one or more vaults)
     * @param amountsPerVault A mapping of vaults to issue from, and InterBTC amounts (in Satoshi) to issue using each vault
     * @param griefingCollateralRate The percentage of an issue request which must be locked as griefing collateral
     * (must correspond to the parachain property)
     * @param atomic Whether the issue request should be handled atomically or not. Only makes a difference if more than
     * one vault is needed to fulfil it.
     * @returns An array of type {issueId, vault} if the requests succeeded.
     * @throws Rejects the promise if none of the requests succeeded (or if at least one failed, when atomic=true).
     */
    requestAdvanced(amountsPerVault: Map<AccountId, Big>, atomic: boolean): Promise<Issue[]>;

    /**
     * Send an issue execution transaction
     * @remarks If `txId` is not set, the `merkleProof` and `rawTx` must both be set.
     *
     * @param issueId The ID returned by the issue request transaction
     * @param txId (Optional) The ID of the Bitcoin transaction that sends funds to the vault address.
     * @param merkleProof (Optional) The merkle inclusion proof of the Bitcoin transaction.
     * @param rawTx (Optional) The raw bytes of the Bitcoin transaction
     */
    execute(issueId: string, txId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void>;
    /**
     * Send an issue cancellation transaction. After the issue period has elapsed,
     * the issuance of InterBTC can be cancelled. As a result, the griefing collateral
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
     * @returns An array containing the issue requests
     */
    list(): Promise<Issue[]>;
    /**
     * @param account The ID of the account whose issue requests are to be retrieved
     * @returns A mapping from the issue request ID to the issue request object, corresponding to the requests of
     * the given account
     */
    mapForUser(account: AccountId): Promise<Map<H256, Issue>>;
    /**
     * @param issueId The ID of the issue request to fetch
     * @returns An issue request object
     */
    getRequestById(issueId: H256 | string): Promise<Issue>;
    /**
     * @param issueId The IDs of the batch of issue request to fetch
     * @returns The issue request objects
     */
    getRequestsByIds(issueIds: (H256 | string)[]): Promise<Issue[]>;
    /**
     * @returns The fee charged for issuing. For instance, "0.005" stands for 0.5%
     */
    getFeeRate(): Promise<Big>;
    /**
     * @param amountBtc The amount, in BTC, for which to compute the issue fees
     * @returns The fees, in BTC
     */
    getFeesToPay(amountBtc: Big): Promise<Big>;
    /**
     * @param amountBtc The amount, in BTC, for which to compute the griefing collateral
     * @returns The griefing collateral, in BTC
     */
    getGriefingCollateral(amount: Big): Promise<Big>;
}

export class DefaultIssueAPI extends DefaultTransactionAPI implements IssueAPI {
    private vaultsAPI: VaultsAPI;
    private feeAPI: FeeAPI;

    constructor(api: ApiPromise, private btcNetwork: Network, private electrsAPI: ElectrsAPI, account?: AddressOrPair) {
        super(api, account);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork);
        this.feeAPI = new DefaultFeeAPI(api);
    }

    async getRequestLimits(vaults?: Map<AccountId, Big>): Promise<IssueLimits> {
        if (!vaults) vaults = await this.vaultsAPI.getVaultsWithIssuableTokens();
        const vaultsArr = [...vaults.entries()];
        if (vaultsArr.length === 0) {
            return { singleVaultMaxIssuable: Big(0), totalMaxIssuable: Big(0) };
        }
        const singleVaultMaxIssuable = vaultsArr[0][1];
        const totalMaxIssuable = vaultsArr.reduce((total, [_, vaultAvailable]) => {
            return total.plus(vaultAvailable);
        }, new Big(0));
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
        amount: Big,
        atomic: boolean = true,
        retries: number = 0,
        cachedVaults?: Map<AccountId, Big>
    ): Promise<Issue[]> {
        try {
            const availableVaults = cachedVaults || (await this.vaultsAPI.getVaultsWithIssuableTokens());
            const amountsPerVault = allocateAmountsToVaults(availableVaults, amount);
            const result = await this.requestAdvanced(amountsPerVault, atomic);
            const successfulSum = result.reduce((sum, req) => sum.plus(req.amountInterBTC), new Big(0));
            const remainder = amount.sub(successfulSum);
            if (remainder.eq(0) || retries === 0) return result;
            else {
                return (await this.request(remainder, atomic, retries - 1, availableVaults)).concat(result);
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async requestAdvanced(amountsPerVault: Map<AccountId, Big>, atomic: boolean): Promise<Issue[]> {
        const txs = new Array<SubmittableExtrinsic<"promise">>();
        for (const [vault, amount] of amountsPerVault) {
            const griefingCollateralBig = await this.getGriefingCollateral(amount);
            // add() here is a hacky workaround for rounding errors
            const griefingCollateralPlanck = dotToPlanck(griefingCollateralBig).add(new BN(100));
            const griefingCollateral = this.api.createType("Collateral", griefingCollateralPlanck);
            const amountWrapped = this.api.createType("Wrapped", btcToSat(amount));
            txs.push(this.api.tx.issue.requestIssue(amountWrapped, vault, griefingCollateral));
        }
        // batchAll fails atomically, batch allows partial successes
        const batch = (atomic ? this.api.tx.utility.batchAll : this.api.tx.utility.batch)(txs);
        try {
            const result = await this.sendLogged(batch, this.api.events.issue.RequestIssue);
            const ids = this.getIssueIdsFromEvents(result.events);
            const issueRequests = await this.getRequestsByIds(ids);
            return issueRequests;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async execute(requestId: string, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void> {
        const parsedRequestId = ensureHashEncoded(this.api, requestId);
        [merkleProof, rawTx] = await getTxProof(this.electrsAPI, btcTxId, merkleProof, rawTx);
        const executeIssueTx = this.api.tx.issue.executeIssue(parsedRequestId, merkleProof, rawTx);
        await this.sendLogged(executeIssueTx, this.api.events.issue.ExecuteIssue);
    }

    async cancel(issueId: H256 | string): Promise<void> {
        const cancelIssueTx = this.api.tx.issue.cancelIssue(issueId);
        await this.sendLogged(cancelIssueTx, this.api.events.issue.CancelIssue);
    }

    async setIssuePeriod(blocks: number): Promise<void> {
        const period = this.api.createType("BlockNumber", blocks);
        const tx = this.api.tx.sudo.sudo(this.api.tx.issue.setIssuePeriod(period));
        await this.sendLogged(tx);
    }

    async getIssuePeriod(): Promise<number> {
        const blockNumber = await this.api.query.issue.issuePeriod();
        return blockNumber.toNumber();
    }

    async list(): Promise<Issue[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const issueRequests = await this.api.query.issue.issueRequests.entriesAt(head);
        return issueRequests.map(([id, req]) => encodeIssueRequest(req, this.btcNetwork, storageKeyToFirstInner(id)));
    }

    async mapForUser(account: AccountId): Promise<Map<H256, Issue>> {
        const issueRequestPairs: [H256, IssueRequest][] = await this.api.rpc.issue.getIssueRequests(account);
        const mapForUser: Map<H256, Issue> = new Map<H256, Issue>();
        issueRequestPairs.forEach((issueRequestPair) =>
            mapForUser.set(issueRequestPair[0], encodeIssueRequest(issueRequestPair[1], this.btcNetwork, issueRequestPair[0]))
        );
        return mapForUser;
    }

    async getGriefingCollateral(amount: Big): Promise<Big> {
        const griefingCollateralRate = await this.feeAPI.getIssueGriefingCollateralRate();
        return await this.feeAPI.getGriefingCollateral(amount, griefingCollateralRate);
    }

    async getFeesToPay(amount: Big): Promise<Big> {
        const feePercentage = await this.getFeeRate();
        const feeBtc = amount.mul(feePercentage);
        return new Big(roundUpBtcToNearestSatoshi(feeBtc));
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

    async getRequestById(issueId: H256 | string): Promise<Issue> {
        return (await this.getRequestsByIds([issueId]))[0];
    }

    async getRequestsByIds(issueIds: (H256 | string)[]): Promise<Issue[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return Promise.all(
            issueIds.map(async (issueId) =>
                encodeIssueRequest(
                    await this.api.query.issue.issueRequests.at(
                        head,
                        ensureHashEncoded(this.api, issueId)
                    ),
                    this.btcNetwork,
                    issueId,
                )
            )
        );
    }
}
