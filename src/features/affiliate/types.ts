export type ClickBeneficiary = "FAN" | "CREATOR" | "PLATFORM";

export type AffiliateFallbackReason =
  | "MISSING_FAN_TAG"
  | "MISSING_CREATOR_TAG"
  | "MISSING_SHARE";

export interface AffiliateSelectionInput {
  readonly fanTag: string | null;
  readonly creatorTag: string | null;
  readonly platformTag: string;
}

export interface AffiliateSelection {
  readonly beneficiary: ClickBeneficiary;
  readonly selectedTag: string;
  readonly roll: number;
  readonly fallbackReason: AffiliateFallbackReason | null;
}
