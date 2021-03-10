import { ApiPromise } from "@polkadot/api";
import { DOT, PolkaBTC, ReplaceRequest } from "../interfaces/default";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { StorageKey } from "@polkadot/types/primitive/StorageKey";
import { Network } from "bitcoinjs-lib";
import { encodeBtcAddress, Transaction } from "../utils";
import { H256 } from "@polkadot/types/interfaces";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { DefaultFeeAPI, FeeAPI } from "./fee";

export interface ReplaceRequestExt extends Omit<ReplaceRequest, "btc_address" | "new_vault"> {
    // network encoded btc address
    btc_address: string;
    new_vault: string;
}

export function encodeReplaceRequest(req: ReplaceRequest, network: Network): ReplaceRequestExt {
    let displayedBtcAddress = "Pending...";
    let displayedNewVaultAddress = "Pending...";
    if (req.btc_address.isSome) {
        displayedBtcAddress = encodeBtcAddress(req.btc_address.unwrap(), network);
    }
    if (req.new_vault.isSome) {
        displayedNewVaultAddress = req.new_vault.unwrap().toHuman();
    }
    return ({
        ...req,
        btc_address: displayedBtcAddress,
        new_vault: displayedNewVaultAddress,
    } as unknown) as ReplaceRequestExt;
}

/**
 * @category PolkaBTC Bridge
 */
export interface ReplaceAPI {
    /**
     * @returns The minimum amount of btc that is accepted for replace requests; any lower values would
     * risk the bitcoin client to reject the payment
     */
    getBtcDustValue(): Promise<PolkaBTC>;
    /**
     * @returns Default griefing collateral (in DOT) as a percentage of the to-be-locked DOT collateral
     * of the new Vault. This collateral will be slashed and allocated to the replacing Vault
     * if the to-be-replaced Vault does not transfer BTC on time.
     */
    getGriefingCollateralRate(): Promise<DOT>;
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
     * @param amountSat Amount issued, in Satoshi, to have replaced by another vault
     */
    request(amountSat: PolkaBTC): Promise<void>;
    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void;
}

export class DefaultReplaceAPI implements ReplaceAPI {
    private btcNetwork: Network;
    private feeAPI: FeeAPI;
    transaction: Transaction;

    constructor(private api: ApiPromise, btcNetwork: Network, private account?: AddressOrPair) {
        this.btcNetwork = btcNetwork;
        this.feeAPI = new DefaultFeeAPI(api);
        this.transaction = new Transaction(api);
    }

    async request(amountSat: PolkaBTC): Promise<void> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        const griefingCollateralRate = await this.api.query.fee.replaceGriefingCollateral();
        const griefingCollateralPlanck = await this.feeAPI.getGriefingCollateralInPlanck(amountSat, griefingCollateralRate);
        const requestTx = this.api.tx.replace.requestReplace(amountSat, griefingCollateralPlanck.toString());
        await this.transaction.sendLogged(requestTx, this.account, this.api.events.replace.RequestReplace);
    }

    async getBtcDustValue(): Promise<PolkaBTC> {
        return await this.api.query.replace.replaceBtcDustValue();
    }

    async getGriefingCollateralRate(): Promise<DOT> {
        return await this.api.query.fee.replaceGriefingCollateral();
    }

    async getReplacePeriod(): Promise<BlockNumber> {
        return await this.api.query.replace.replacePeriod();
    }

    async list(): Promise<ReplaceRequestExt[]> {
        const replaceRequests = await this.api.query.replace.replaceRequests.entries();
        return replaceRequests
            .filter((v) => v[1].isSome)
            .map((v) => v[1].unwrap())
            .map((req: ReplaceRequest) => encodeReplaceRequest(req, this.btcNetwork));
    }

    private storageKeyToIdString(s: StorageKey<[H256]>): H256 {
        return s.args[0];
    }

    async map(): Promise<Map<H256, ReplaceRequestExt>> {
        const redeemRequests = await this.api.query.replace.replaceRequests.entries();
        const redeemRequestMap = new Map<H256, ReplaceRequestExt>();
        redeemRequests
            .filter((v) => v[1].isSome)
            .map((v) => {
                return { id: v[0], req: v[1].unwrap() };
            })
            .forEach(({ id, req }) => {
                redeemRequestMap.set(this.storageKeyToIdString(id), encodeReplaceRequest(req, this.btcNetwork));
            });
        return redeemRequestMap;
    }

    setAccount(account: AddressOrPair): void {
        this.account = account;
    }
}
