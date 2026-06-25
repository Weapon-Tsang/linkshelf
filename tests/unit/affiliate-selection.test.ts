import { describe, expect, it } from "vitest";
import { selectAffiliate } from "@/features/affiliate/resolve-redirect";

const input = {
  fanTag: "fan-demo-20",
  creatorTag: "liamcreator-20",
  platformTag: "linkshelf-platform-20",
};

describe("selectAffiliate", () => {
  it("uses fan in the lower 80 percent", () =>
    expect(selectAffiliate(input, () => 0.7999).beneficiary).toBe("FAN"));

  it("uses creator at the 80 percent boundary", () =>
    expect(selectAffiliate(input, () => 0.8).beneficiary).toBe("CREATOR"));

  it("falls back to platform when fan tag is blank", () =>
    expect(selectAffiliate({ ...input, fanTag: null }, () => 0.2)).toMatchObject({
      beneficiary: "PLATFORM",
      fallbackReason: "MISSING_FAN_TAG",
    }));

  it("falls back to platform at the creator boundary when the creator tag is blank", () =>
    expect(selectAffiliate({ ...input, creatorTag: null }, () => 0.8)).toMatchObject({
      beneficiary: "PLATFORM",
      fallbackReason: "MISSING_CREATOR_TAG",
    }));

  it("rejects random rolls outside the expected range", () =>
    expect(() => selectAffiliate(input, () => 1)).toThrow(
      "Affiliate random roll must be finite and inside [0, 1)",
    ));
});
