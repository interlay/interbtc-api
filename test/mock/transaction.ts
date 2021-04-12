import { AugmentedEvent, SubmittableExtrinsic, ApiTypes } from "@polkadot/api/types";
import { ISubmittableResult, AddressOrPair, AnyTuple } from "@polkadot/types/types";
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
