import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Release Candidate documentation", () => {
  it("records the Sprint 30 release candidate evidence and recommendation", () => {
    expect(existsSync(join(process.cwd(), "docs/release-candidate.md"))).toBe(true);

    const docs = readProjectFile("docs/release-candidate.md");

    expect(docs).toContain("Sprint 30");
    expect(docs).toContain("Verification Matrix");
    expect(docs).toContain("Visual QA Evidence");
    expect(docs).toContain("Performance And Accessibility");
    expect(docs).toContain("Known External Launch Gates");
    expect(docs).toContain("Release Manager Recommendation");
    expect(docs).toContain("test-results/design-qa/latest/");
  });

  it("moves the project handoff state from Sprint 29 to Sprint 30", () => {
    const projectState = readProjectFile("PROJECT_STATE.md");
    const projectStatus = readProjectFile("docs/project-status.md");
    const handoff = readProjectFile("HANDOFF.md");
    const nextSessionPrompt = readProjectFile("NEXT_SESSION_PROMPT.md");

    expect(projectState).toContain("Active sprint:");
    expect(projectState).toContain("Sprint 30: Release Candidate");
    expect(projectStatus).toContain("Current sprint:");
    expect(projectStatus).toContain("Sprint 30: Release Candidate");
    expect(handoff).toContain("Sprint 30: Release Candidate");
    expect(handoff).toContain("Release Manager Recommendation");
    expect(nextSessionPrompt).toContain("Sprint 30 should be complete");
  });
});
