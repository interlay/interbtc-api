import { SubmittableExtrinsic, ApiTypes, AugmentedEvent } from "@polkadot/api/types";

interface ExtrinsicData {
    extrinsic: SubmittableExtrinsic<ApiTypes>;
    event?: AugmentedEvent<ApiTypes>;
}

interface DryRunResult {
    success: boolean;
    error?: unknown;
}

export type { ExtrinsicData, DryRunResult };
