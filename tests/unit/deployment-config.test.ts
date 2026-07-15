import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("deployment configuration", () => {
  it("builds Next.js as a standalone Node server", () => {
    expect(readProjectFile("next.config.ts")).toContain('output: "standalone"');
  });

  it("defines a production Docker image for the standalone server", () => {
    const dockerfile = readProjectFile("Dockerfile");

    expect(dockerfile).toContain("FROM node:24-bookworm-slim AS deps");
    expect(dockerfile).toContain("pnpm install --frozen-lockfile");
    expect(dockerfile).toContain("RUN pnpm build");
    expect(dockerfile).toContain("/app/.next/standalone");
    expect(dockerfile).toContain("USER linkshelf");
    expect(dockerfile).toContain('CMD ["node", "server.js"]');
  });

  it("runs Compose with production env and persistent SQLite storage", () => {
    const compose = readProjectFile("compose.yml");

    expect(compose).toContain("build: .");
    expect(compose).toContain('"3000:3000"');
    expect(compose).toContain("NODE_ENV: production");
    expect(compose).toContain("NEXTAUTH_URL: ${NEXTAUTH_URL:?set NEXTAUTH_URL}");
    expect(compose).toContain("AUTH_SECRET: ${AUTH_SECRET:?set AUTH_SECRET}");
    expect(compose).toContain("AUTH_GOOGLE_ID: ${AUTH_GOOGLE_ID:?set AUTH_GOOGLE_ID}");
    expect(compose).toContain(
      "AUTH_GOOGLE_SECRET: ${AUTH_GOOGLE_SECRET:?set AUTH_GOOGLE_SECRET}",
    );
    expect(compose).toContain("LINKSHELF_DB_PATH: /data/linkshelf/linkshelf.db");
    expect(compose).toContain("linkshelf-data:/data/linkshelf");
    expect(compose).toContain("/api/health");
  });

  it("keeps local secrets, caches, and nested worktrees out of Docker context", () => {
    const dockerignore = readProjectFile(".dockerignore");

    expect(dockerignore).toContain(".env*");
    expect(dockerignore).toContain("node_modules");
    expect(dockerignore).toContain(".next");
    expect(dockerignore).toContain("data");
    expect(dockerignore).toContain(".worktrees");
  });

  it("documents deployment, smoke tests, environments, and rollback", () => {
    const docs = readProjectFile("docs/deployment.md");

    expect(docs).toContain("docker compose build");
    expect(docs).toContain("docker compose up -d");
    expect(docs).toContain("/api/health");
    expect(docs).toContain("Preview");
    expect(docs).toContain("Staging");
    expect(docs).toContain("Production");
    expect(docs).toContain("Rollback");
  });

  it("shows production-oriented env examples", () => {
    const env = readProjectFile(".env.example");

    expect(env).toContain("PORT=3000");
    expect(env).toContain("HOSTNAME=0.0.0.0");
    expect(env).toContain("LINKSHELF_DB_PATH=/data/linkshelf/linkshelf.db");
  });
});
