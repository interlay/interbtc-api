import { AugmentedEvent, SubmittableExtrinsic, ApiTypes, AddressOrPair } from "@polkadot/api/types";
import { ISubmittableResult, AnyTuple } from "@polkadot/types/types";
import { TransactionAPI } from "../../src";

export class MockTransactionAPI implements TransactionAPI {
    setAccount(_account: AddressOrPair): void {
        return;
    }

    async sendLogged<T extends AnyTuple>(
        _transaction: SubmittableExtrinsic<"promise">,
        _successEventType?: AugmentedEvent<ApiTypes, T>
    ): Promise<ISubmittableResult> {
        throw new Error("Method not implemented.");
    }

}
