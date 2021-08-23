import { ApiPromise } from "@polkadot/api";
import { H256, AccountId } from "@polkadot/types/interfaces";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { Hash } from "@polkadot/types/interfaces";
import { AddressOrPair } from "@polkadot/api/types";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { Network } from "bitcoinjs-lib";
import { Bytes } from "@polkadot/types";
import { BTCAmount, Currency, MonetaryAmount, Polkadot, PolkadotAmount } from "@interlay/monetary-js";

import { storageKeyToNthInner, getTxProof, parseReplaceRequest, ensureHashEncoded } from "../utils";
import { DefaultFeeAPI, FeeAPI } from "./fee";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { ElectrsAPI } from "../external";
import { CollateralUnit, ReplaceRequestExt } from "../types";

/**
 * @category InterBTC Bridge
 */
export interface ReplaceAPI extends TransactionAPI {
    /**
     * @returns The minimum amount of btc that is accepted for replace requests; any lower values would
     * risk the bitcoin client to reject the payment
     */
    getDustValue(): Promise<BTCAmount>;
    /**
     * @returns The time difference in number of blocks between when a replace request is created
     * and required completion time by a vault. The replace period has an upper limit
     * to prevent griefing of vault collateral.
     */
    getReplacePeriod(): Promise<BlockNumber>;
    /**
     * @returns An array containing the replace requests
     */
    list(): Promise<ReplaceRequestExt[]>;
    /**
     * @returns A mapping from the replace request ID to the replace request object
     */
    map(): Promise<Map<H256, ReplaceRequestExt>>;
    /**
     * @param replaceId The ID of the replace request to fetch
     * @returns A replace request object
     */
    getRequestById(replaceId: H256 | string): Promise<ReplaceRequestExt>;
    /**
     * @param amount Amount issued, denoted in Bitcoin, to have replaced by another vault
     * @returns The request id
     */
    request(amount: BTCAmount): Promise<string>;
    /**
     * Wihdraw a replace request
     * @param amount The amount of wrapped tokens to withdraw from the amount
     * requested to have replaced.
     */
    withdraw(amount: BTCAmount): Promise<void>;
    /**
     * Accept a replace request
     * @param oldVault ID of the old vault that to be (possibly partially) replaced
     * @param amount Amount of issued tokens to be replaced
     * @param collateral The collateral for replacement
     * @param btcAddress The address that old-vault should transfer the btc to
     */
    accept(oldVault: AccountId, amountSat: BTCAmount, collateral: PolkadotAmount, btcAddress: string): Promise<void>;
    /**
     * Execute a replace request
     * @remarks If `txId` is not set, the `merkleProof` and `rawTx` must both be set.
     *
     * @param replaceId The ID generated by the replace request transaction
     * @param txId (Optional) The ID of the Bitcoin transaction that sends funds from the old vault to the new vault
     * @param merkleProof (Optional) The merkle inclusion proof of the Bitcoin transaction.
     * @param rawTx (Optional) The raw bytes of the Bitcoin transaction
     */
    execute(replaceId: string, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void>;
    /**
     *
     * @param amount The amount of wrapped tokens to request replacement for.
     * @param collateralCurrency The collateral, as a currency object (using `Monetary.js`)
     * @returns The griefing collateral
     */
    getGriefingCollateral<C extends CollateralUnit>(
        amount: BTCAmount,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
}

export class DefaultReplaceAPI extends DefaultTransactionAPI implements ReplaceAPI {
    private btcNetwork: Network;
    private feeAPI: FeeAPI;

    constructor(api: ApiPromise, btcNetwork: Network, private electrsAPI: ElectrsAPI, account?: AddressOrPair) {
        super(api, account);
        this.btcNetwork = btcNetwork;
        this.feeAPI = new DefaultFeeAPI(api);
    }

    /**
     * @param events The EventRecord array returned after sending a replace request transaction
     * @returns The id associated with the replace request. If the EventRecord array does not
     * contain replace request events, the function throws an error.
     */
    private getRequestIdFromEvents(events: EventRecord[]): Hash {
        for (const { event } of events) {
            if (this.api.events.replace.RequestReplace.is(event)) {
                const hash = this.api.createType("Hash", event.data[0]);
                return hash;
            }
        }
        throw new Error("Request transaction failed");
    }

    async request(amount: BTCAmount): Promise<string> {
        const amountSat = this.api.createType("Balance", amount.str.Satoshi());
        // TODO: Support multiple collateral currencies
        const griefingCollateral = await this.getGriefingCollateral(amount, Polkadot);
        const griefingCollateralPlanck = this.api.createType("Balance", griefingCollateral.str.Planck());
        const requestTx = this.api.tx.replace.requestReplace(amountSat, griefingCollateralPlanck);
        const result = await this.sendLogged(requestTx, this.api.events.replace.RequestReplace);
        try {
            return this.getRequestIdFromEvents(result.events).toString();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async withdraw(amount: BTCAmount): Promise<void> {
        const amountSat = this.api.createType("Balance", amount.str.Satoshi());
        const requestTx = this.api.tx.replace.withdrawReplace(amountSat);
        await this.sendLogged(requestTx, this.api.events.replace.WithdrawReplace);
    }

    async accept(
        oldVault: AccountId,
        amount: BTCAmount,
        collateral: PolkadotAmount,
        btcAddress: string
    ): Promise<void> {
        const parsedBtcAddress = this.api.createType("BtcAddress", btcAddress);
        const amountSat = this.api.createType("Balance", amount.str.Satoshi());
        const collateralPlanck = this.api.createType("Balance", collateral.str.Planck());
        const requestTx = this.api.tx.replace.acceptReplace(oldVault, amountSat, collateralPlanck, parsedBtcAddress);
        await this.sendLogged(requestTx, this.api.events.replace.AcceptReplace);
    }

    async execute(requestId: string, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void> {
        const parsedRequestId = this.api.createType("H256", "0x" + requestId);
        [merkleProof, rawTx] = await getTxProof(this.electrsAPI, btcTxId, merkleProof, rawTx);
        const requestTx = this.api.tx.replace.executeReplace(parsedRequestId, merkleProof, rawTx);
        await this.sendLogged(requestTx, this.api.events.replace.ExecuteReplace);
    }

    async getDustValue(): Promise<BTCAmount> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const dustSatoshi = await this.api.query.replace.replaceBtcDustValue.at(head);
        return BTCAmount.from.Satoshi(dustSatoshi.toString());
    }

    async getGriefingCollateral<C extends CollateralUnit>(
        amount: BTCAmount,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const griefingCollateralRate = await this.feeAPI.getReplaceGriefingCollateralRate();
        return await this.feeAPI.getGriefingCollateral(amount, griefingCollateralRate, collateralCurrency);
    }

    async getReplacePeriod(): Promise<BlockNumber> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return await this.api.query.replace.replacePeriod.at(head);
    }

    async list(): Promise<ReplaceRequestExt[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const replaceRequests = await this.api.query.replace.replaceRequests.entriesAt(head);
        return replaceRequests.map((v) => parseReplaceRequest(v[1], this.btcNetwork));
    }

    async map(): Promise<Map<H256, ReplaceRequestExt>> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const redeemRequests = await this.api.query.replace.replaceRequests.entriesAt(head);
        const redeemRequestMap = new Map<H256, ReplaceRequestExt>();
        redeemRequests.forEach((v) => {
            redeemRequestMap.set(storageKeyToNthInner(v[0]), parseReplaceRequest(v[1], this.btcNetwork));
        });
        return redeemRequestMap;
    }

    async getRequestById(replaceId: H256 | string): Promise<ReplaceRequestExt> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return parseReplaceRequest(
            await this.api.query.replace.replaceRequests.at(head, ensureHashEncoded(this.api, replaceId)),
            this.btcNetwork,
        );
    }
}
