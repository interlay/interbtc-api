import { AccountId } from "@polkadot/types/interfaces";
import { AddressOrPair } from "@polkadot/api/types";
import Big from "big.js";

import { NominationAPI } from "../../../src";
import { Nominator } from "../../../src/interfaces";
import { MockTransactionAPI } from "../transaction";

export class MockNominationAPI extends MockTransactionAPI implements NominationAPI {
    depositCollateral(vaultId: string, amount: Big): Promise<void> {
        throw new Error("Method not implemented.");
    }
    withdrawCollateral(vaultId: string, amount: Big): Promise<void> {
        throw new Error("Method not implemented.");
    }
    optIn(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    optOut(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    setNominationEnabled(enabled: boolean): Promise<void> {
        throw new Error("Method not implemented.");
    }
    isNominationEnabled(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    listNominators(): Promise<[[AccountId, AccountId], Nominator][]> {
        throw new Error("Method not implemented.");
    }
    listVaults(): Promise<AccountId[]> {
        throw new Error("Method not implemented.");
    }
    setAccount(_account?: AddressOrPair): void {
        return;
    }
}