import { AddressOrPair } from "@polkadot/api/types";
import { AccountId, H256 } from "@polkadot/types/interfaces";
import { EventRecord } from "@polkadot/types/interfaces/system";
import BN from "bn.js";
import Big from "big.js";

import { IssueAPI, IssueLimits } from "../../../src/parachain/issue";
import { MockTransactionAPI } from "../transaction";
import { Issue, IssueStatus } from "../../../src/types";

export class MockIssueAPI extends MockTransactionAPI implements IssueAPI {
    getGriefingCollateral(_amount: Big): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    setIssuePeriod(_blocks: number): Promise<void> {
        throw new Error("Method not implemented.");
    }

    execute(_issueId: string, _btcTxId: string): Promise<void> {
        return Promise.resolve();
    }

    cancel(_issueId: H256): Promise<void> {
        throw new Error("Method not implemented.");
    }

    getRequestLimits(_vaults?: Map<AccountId, Big>): Promise<IssueLimits> {
        return Promise.resolve({
            singleVaultMaxIssuable: new Big(10000000),
            totalMaxIssuable: new Big(15000000),
        });
    }

    async request(
        _amountSat: Big,
        _atomic?: boolean,
        _retries?: number,
        _availableVaults?: Map<AccountId, Big>
    ): Promise<Issue[]> {
        return Promise.resolve([(await this.list())[0]]);
    }

    async requestAdvanced(
        _amountsPerVault: Map<AccountId, Big>,
        _atomic: boolean
    ): Promise<Issue[]> {
        return this.request(new Big(0));
    }

    setAccount(_account?: AddressOrPair): void {
        return;
    }

    list(): Promise<Issue[]> {
        const decodedAccountId1 = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";
        const decodedAccountId2 = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D6";

        return Promise.resolve([
            <Issue>{
                id: "0x41fd1760b07dc5bc3b1548b6ffdd057444fb3a426460a199a6e2d42a7960e83c",
                amountInterBTC: new BN(600).toString(),
                userDOTAddress: decodedAccountId1,
                bridgeFee: new BN(6).toString(),
                griefingCollateral: new BN(10).toString(),
                creationBlock: 10908,
                vaultBTCAddress: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
                vaultDOTAddress: decodedAccountId1,
                status: IssueStatus.PendingWithBtcTxNotFound,
            },
            <Issue>{
                id: "0x41fd1760b07dc5bc3b1548b6ffdd057444fb3a426460a199a6e2d42a7960e83c",
                amountInterBTC: new BN(4510).toString(),
                userDOTAddress: decodedAccountId2,
                bridgeFee: new BN(6).toString(),
                griefingCollateral: new BN(76).toString(),
                creationBlock: 11938,
                vaultBTCAddress: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
                vaultDOTAddress: decodedAccountId2,
                status: IssueStatus.PendingWithBtcTxNotFound,
            },
        ]);
    }

    getIssuePeriod(): Promise<number> {
        return Promise.resolve(200);
    }

    mapForUser(_account: AccountId): Promise<Map<H256, Issue>> {
        return Promise.resolve(new Map<H256, Issue>());
    }

    async getRequestById(_issueId: string | Uint8Array | H256): Promise<Issue> {
        const decodedAccountId1 = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";

        return <Issue>{
            id: "0x41fd1760b07dc5bc3b1548b6ffdd057444fb3a426460a199a6e2d42a7960e83c",
            amountInterBTC: new BN(4510).toString(),
            userDOTAddress: decodedAccountId1,
            bridgeFee: new BN(6).toString(),
            griefingCollateral: new BN(76).toString(),
            creationBlock: 11938,
            vaultBTCAddress: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
            vaultDOTAddress: decodedAccountId1,
            status: IssueStatus.PendingWithBtcTxNotFound,
        };
    }

    async getRequestsByIds(_issueIds: H256[]): Promise<Issue[]> {
        const request = await this.getRequestById("");
        return [request];
    }

    isRequestSuccessful(_events: EventRecord[]): boolean {
        return true;
    }

    isExecutionSuccessful(_events: EventRecord[]): boolean {
        return false;
    }

    async getFeesToPay(_amountBtc: Big): Promise<Big> {
        return Big("0.01");
    }

    async getFeeRate(): Promise<Big> {
        return new Big("0.005");
    }
}
