import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, H256, Hash } from "@polkadot/types/interfaces";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { Bytes } from "@polkadot/types/primitive";
import { DOT, H256Le, IssueRequest, PolkaBTC, Vault } from "../interfaces/default";
import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import { dotToPlanck, encodeBtcAddress, pagedIterator, satToBTC, scaleFixedPointType, sendLoggedTx } from "../utils";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { DefaultOracleAPI, OracleAPI } from "./oracle";
import * as fs from "fs";
import util from "util";

export type RequestResult = { hash: Hash; vault: Vault };

export interface IssueRequestExt extends Omit<IssueRequest, "btc_address"> {
    // network encoded btc address
    btc_address: string;
}

export function encodeIssueRequest(req: IssueRequest, network: Network): IssueRequestExt {
    const { btc_address, ...obj } = req;
    return Object.assign(
        {
            btc_address: encodeBtcAddress(btc_address, network),
        },
        obj
    ) as IssueRequestExt;
}

export interface IssueAPI {
    request(amountSat: PolkaBTC, vaultId?: AccountId, griefingCollateral?: DOT): Promise<RequestResult>;
    execute(issueId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<boolean>;
    cancel(issueId: H256): Promise<void>;
    setAccount(account?: AddressOrPair): void;
    getGriefingCollateralInPlanck(amountBtc: string): Promise<string>;
    list(): Promise<IssueRequestExt[]>;
    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]>;
    mapForUser(account: AccountId): Promise<Map<H256, IssueRequestExt>>;
    getRequestById(issueId: string | Uint8Array | H256): Promise<IssueRequestExt>;
    getIssuePeriod(): Promise<BlockNumber>;
    isExecutionSuccessful(events: EventRecord[]): boolean;
    getFeesToPay(amountBtc: string): Promise<string>;
}

export class DefaultIssueAPI implements IssueAPI {
    private vaultsAPI: VaultsAPI;
    private btcNetwork: Network;
    private oracleAPI: OracleAPI;
    requestHash: Hash;

    constructor(private api: ApiPromise, btcNetwork: Network, private account?: AddressOrPair) {
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork);
        this.oracleAPI = new DefaultOracleAPI(api);
        this.btcNetwork = btcNetwork;
        this.requestHash = this.api.createType("Hash");
    }

    private getIssueIdFromEvents(events: EventRecord[]): Hash {
        // A successful `request` produces four events:
        // - collateral.LockCollateral
        // - vaultRegistry.IncreaseToBeIssuedTokens
        // - issue.RequestIssue
        // - system.ExtrinsicSuccess

        for (const {
            event: { method, section, data },
        } of events) {
            if (section == "issue" && method == "RequestIssue") {
                const hash = this.api.createType("Hash", data[0]);
                return hash;
            }
        }

        throw new Error("Request transaction failed");
    }

    isRequestSuccessful(events: EventRecord[]): boolean {
        // A successful `execute` produces the following events:
        // - dot.Reserved
        // - collateral.LockCollateral
        // - vaultRegistry.IncreaseToBeIssuedTokens
        // - issue.ExecuteIssue
        // - system.ExtrinsicSuccess

        for (const {
            event: { method, section },
        } of events) {
            if (section == "issue" && method == "RequestIssue") {
                return true;
            }
        }

        return false;
    }

    isExecutionSuccessful(events: EventRecord[]): boolean {
        // A successful `execute` produces the following events:
        // - vaultRegistry.IssueTokens
        // - system.NewAccount
        // - polkaBtc.Endowed
        // - treasury.Mint
        // - issue.ExecuteIssue
        // - system.ExtrinsicSuccess

        for (const {
            event: { method, section },
        } of events) {
            if (section == "issue" && method == "ExecuteIssue") {
                return true;
            }
        }

        return false;
    }

    async request(amountSat: PolkaBTC, vaultId?: AccountId): Promise<RequestResult> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        let vault: Vault;
        if (vaultId) {
            vault = await this.vaultsAPI.get(vaultId);
        } else {
            vaultId = await this.vaultsAPI.selectRandomVaultIssue(amountSat);
            vault = await this.vaultsAPI.get(vaultId);
        }
        const griefingCollateralPlanck = await this.getGriefingCollateralInPlanck(amountSat.toString());
        const requestIssueTx = this.api.tx.issue.requestIssue(amountSat, vault.id, griefingCollateralPlanck);
        const result = await sendLoggedTx(requestIssueTx, this.account, this.api);
        if (!this.isRequestSuccessful(result.events)) {
            throw new Error("Request failed");
        }

        const hash = this.getIssueIdFromEvents(result.events);
        return { hash, vault };
    }

    async execute(issueId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<boolean> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        const executeIssueTx = this.api.tx.issue.executeIssue(issueId, txId, merkleProof, rawTx);
        const result = await sendLoggedTx(executeIssueTx, this.account, this.api);
        return this.isExecutionSuccessful(result.events);
    }

    async cancel(issueId: H256): Promise<void> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        const cancelIssueTx = this.api.tx.issue.cancelIssue(issueId);
        await sendLoggedTx(cancelIssueTx, this.account, this.api);
    }

    async list(): Promise<IssueRequestExt[]> {
        const issueRequests = await this.api.query.issue.issueRequests.entries();
        return issueRequests.map((v) => v[1]).map((req: IssueRequest) => encodeIssueRequest(req, this.btcNetwork));
    }

    async mapForUser(account: AccountId): Promise<Map<H256, IssueRequestExt>> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customAPIRPC = this.api.rpc as any;
        const issueRequestPairs: [H256, IssueRequest][] = await customAPIRPC.issue.getIssueRequests(account);
        const mapForUser: Map<H256, IssueRequestExt> = new Map<H256, IssueRequestExt>();
        issueRequestPairs.forEach((issueRequestPair) =>
            mapForUser.set(issueRequestPair[0], encodeIssueRequest(issueRequestPair[1], this.btcNetwork))
        );
        return mapForUser;
    }

    async getFeesToPay(amountBtc: string): Promise<string> {
        const feePercentage = await this.getFeePercentage();
        const feePercentageBN = new Big(feePercentage);
        const amountBig = new Big(amountBtc);
        return amountBig.mul(feePercentageBN).toString();
    }

    async getFeePercentage(): Promise<string> {
        const issueFee = await this.api.query.fee.issueFee();
        return scaleFixedPointType(issueFee);
    }

    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]> {
        return pagedIterator<IssueRequest>(this.api.query.issue.issueRequests, perPage);
    }

    async getIssuePeriod(): Promise<BlockNumber> {
        return (await this.api.query.issue.issuePeriod()) as BlockNumber;
    }

    async getGriefingCollateralInPlanck(amountSat: string): Promise<string> {
        const griefingCollateralRate = await this.api.query.fee.issueGriefingCollateral();
        const griefingCollateralRateBig = new Big(scaleFixedPointType(griefingCollateralRate));
        const exchangeRate = await this.oracleAPI.getExchangeRate();
        const exchangeRateBig = new Big(exchangeRate);
        const amountBtc = satToBTC(amountSat);
        const amountBig = new Big(amountBtc);
        const amountInDot = exchangeRateBig.mul(amountBig);
        const griefingCollateralDOT = amountInDot.mul(griefingCollateralRateBig).toString();
        const griefingCollateralPlanck = dotToPlanck(griefingCollateralDOT);
        if (griefingCollateralPlanck === undefined) {
            throw new Error("Griefing collateral conversion to planck failed. It should not be smaller than 1 Planck");
        }
        return griefingCollateralPlanck;
    }

    async getRequestById(issueId: string | Uint8Array | H256): Promise<IssueRequestExt> {
        return encodeIssueRequest(await this.api.query.issue.issueRequests(issueId), this.btcNetwork);
    }

    setAccount(account?: AddressOrPair): void {
        this.account = account;
    }
}
