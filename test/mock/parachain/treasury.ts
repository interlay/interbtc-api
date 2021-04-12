import { AccountId } from "@polkadot/types/interfaces/runtime";
import { TreasuryAPI } from "../../../src/parachain/treasury";
import { AddressOrPair } from "@polkadot/api/types";
import Big from "big.js";
import { MockTransactionAPI } from "../transaction";

export class MockTreasuryAPI extends MockTransactionAPI implements TreasuryAPI {
    subscribeToBalance(_account: string, _callback: (account: string, balance: Big) => void): Promise<() => void> {
        throw new Error("Method not implemented.");
    }
    
    async total(): Promise<Big> {
        return new Big(199);
    }

    async balance(_id: AccountId): Promise<Big> {
        return new Big(100);
    }

    async transfer(_destination: string, _amount: Big): Promise<void> {
        return;
    }

    setAccount(_account: AddressOrPair): void {
        return;
    }
}
