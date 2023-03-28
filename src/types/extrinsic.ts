import { SubmittableExtrinsic, ApiTypes, AugmentedEvent } from "@polkadot/api/types";

type ExtrinsicData = [SubmittableExtrinsic<ApiTypes>, AugmentedEvent<ApiTypes>];

export type { ExtrinsicData };
