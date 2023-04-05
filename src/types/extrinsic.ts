import { SubmittableExtrinsic, ApiTypes, AugmentedEvent } from "@polkadot/api/types";

interface ExtrinsicData {
    extrinsic: SubmittableExtrinsic<ApiTypes>;
    event?: AugmentedEvent<ApiTypes>;
}

export type { ExtrinsicData };
