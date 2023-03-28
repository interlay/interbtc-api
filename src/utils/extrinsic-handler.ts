import { SubmittableExtrinsic, ApiTypes, AugmentedEvent } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { TransactionAPI } from "../parachain";

class ExtrinsicHandler {
    constructor(
        private transactionAPI: TransactionAPI,
        public extrinsic: SubmittableExtrinsic<ApiTypes>,
        public event: AugmentedEvent<ApiTypes>
    ) {}

    public async submit(onlyInBlock: boolean = true): Promise<ISubmittableResult> {
        return this.transactionAPI.sendLogged(this.extrinsic, this.event, onlyInBlock);
    }

    public batchWith(extrinsicToBatchWith: ExtrinsicHandler, atomic: boolean = true): ExtrinsicHandler {
        return this.batchWithRawExtrinsic(extrinsicToBatchWith.extrinsic, atomic);
    }

    public batchWithRawExtrinsic(
        rawExtrinsicToBatchWith: SubmittableExtrinsic<ApiTypes>,
        atomic: boolean = true
    ): ExtrinsicHandler {
        const batchExtrinsic = this.transactionAPI.buildBatchExtrinsic(
            [this.extrinsic, rawExtrinsicToBatchWith],
            atomic
        );
        const batchEvent = this.transactionAPI.api.events.utility.BatchCompleted;

        return new ExtrinsicHandler(this.transactionAPI, batchExtrinsic, batchEvent);
    }
}

export { ExtrinsicHandler };
