import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("monitoring documentation", () => {
  it("documents events, manual checks, alerts, incidents, and privacy", () => {
    const docs = readProjectFile("docs/monitoring.md");

    expect(docs).toContain("linkshelf.operational_event");
    expect(docs).toContain("health.check");
    expect(docs).toContain("auth.google.request");
    expect(docs).toContain("auth.google.sign_in");
    expect(docs).toContain("affiliate.redirect");
    expect(docs).toContain("Manual Checks");
    expect(docs).toContain("Alert Thresholds");
    expect(docs).toContain("Incident Triage");
    expect(docs).toContain("Privacy Boundaries");
  });

  it("exposes stdout monitoring opt-in for non-production smoke tests", () => {
    expect(readProjectFile(".env.example")).toContain("LINKSHELF_MONITORING_STDOUT=");
  });
});
