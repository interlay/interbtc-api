import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, H256, Hash } from "@polkadot/types/interfaces";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { Bytes } from "@polkadot/types/primitive";
import { DOT, H256Le, IssueRequest, PolkaBTC, Vault } from "../interfaces/default";
import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import { encodeBtcAddress, pagedIterator, sendLoggedTx } from "../utils";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import BN from "bn.js";
import { FIXEDI128_SCALING_FACTOR } from "../utils/";
import { DefaultOracleAPI, OracleAPI } from "./oracle";

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
    request(amount: PolkaBTC, vaultId?: AccountId, griefingCollateral?: DOT): Promise<RequestResult>;
    execute(issueId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<boolean>;
    cancel(issueId: H256): Promise<void>;
    setAccount(account?: AddressOrPair): void;
    getGriefingCollateral(): Promise<DOT>;
    list(): Promise<IssueRequestExt[]>;
    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]>;
    mapForUser(account: AccountId): Promise<Map<H256, IssueRequestExt>>;
    getRequestById(issueId: string | Uint8Array | H256): Promise<IssueRequestExt>;
    getIssuePeriod(): Promise<BlockNumber>;
    isExecutionSucessful(events: EventRecord[]): boolean;
    getFeesToPay(amount: string): Promise<string>;
    getFeePercentage(): Promise<string>;
}

export class DefaultIssueAPI implements IssueAPI {
    private vaults: VaultsAPI;
    private btcNetwork: Network;
    private oracleAPI: OracleAPI;
    requestHash: Hash;

    constructor(private api: ApiPromise, btcNetwork: Network, private account?: AddressOrPair) {
        this.vaults = new DefaultVaultsAPI(api, btcNetwork);
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

    isRequestSucessful(events: EventRecord[]): boolean {
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

    isExecutionSucessful(events: EventRecord[]): boolean {
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

    async request(amount: PolkaBTC, vaultId?: AccountId, griefingCollateral?: DOT): Promise<RequestResult> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        let vault: Vault;
        if (vaultId) {
            vault = await this.vaults.get(vaultId);
        } else {
            vaultId = await this.vaults.selectRandomVaultIssue(amount);
            vault = await this.vaults.get(vaultId);
        }

        if (!griefingCollateral) {
            const griefingCollateralRate = await this.getGriefingCollateral();
            const griefingCollateralRateBig = new Big(griefingCollateralRate.toString());
            const exchangeRate = await this.oracleAPI.getExchangeRate();
            const exchangeRateU128 = new Big(exchangeRate);
            const amountBig = new Big(amount.toString());
            const amountInDot = exchangeRateU128.mul(amountBig);
            griefingCollateral = new BN(amountInDot.mul(griefingCollateralRateBig).toString()) as DOT;
        }
        const requestIssueTx = this.api.tx.issue.requestIssue(amount, vault.id, griefingCollateral);
        const result = await sendLoggedTx(requestIssueTx, this.account, this.api);

        if (!this.isRequestSucessful(result.events)) {
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
        return this.isExecutionSucessful(result.events);
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

    async getFeesToPay(amount: string): Promise<string> {
        const feePercentage = await this.getFeePercentage();
        const feePercentageBN = new Big(feePercentage);
        const amountBig = new Big(amount);
        return amountBig.mul(feePercentageBN).toString();
    }

    async getFeePercentage(): Promise<string> {
        const issueFee = await this.api.query.fee.issueFee();
        const issueFeeBig = new Big(issueFee.toString());
        const divisor = new Big(Math.pow(10, FIXEDI128_SCALING_FACTOR));
        const scaledFee = issueFeeBig.div(divisor);
        return scaledFee.toString();
    }

    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]> {
        return pagedIterator<IssueRequest>(this.api.query.issue.issueRequests, perPage);
    }

    async getIssuePeriod(): Promise<BlockNumber> {
        return (await this.api.query.issue.issuePeriod()) as BlockNumber;
    }

    async getGriefingCollateral(): Promise<DOT> {
        return this.api.query.fee.issueGriefingCollateral();
    }

    async getRequestById(issueId: string | Uint8Array | H256): Promise<IssueRequestExt> {
        return encodeIssueRequest(await this.api.query.issue.issueRequests(issueId), this.btcNetwork);
    }

    setAccount(account?: AddressOrPair): void {
        this.account = account;
    }
}
