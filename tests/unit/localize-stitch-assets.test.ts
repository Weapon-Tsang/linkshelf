import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { localizeAssets } from "../../scripts/localize-stitch-assets.mjs";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

async function createFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "linkshelf-assets-"));
  temporaryDirectories.push(root);
  const sourceDir = path.join(root, "screens");
  const outputDir = path.join(root, "public", "stitch", "assets");
  const manifestPath = path.join(root, "public", "stitch", "asset-manifest.json");
  await mkdir(sourceDir, { recursive: true });
  return { manifestPath, outputDir, sourceDir };
}

describe("localizeAssets", () => {
  it("deduplicates image URLs, hashes filenames, and reuses localized files", async () => {
    const paths = await createFixture();
    const imageUrl = "https://lh3.googleusercontent.com/aida-public/example_asset";
    await writeFile(path.join(paths.sourceDir, "one.html"), `<img src="${imageUrl}"><img src="${imageUrl}">`);
    await writeFile(path.join(paths.sourceDir, "two.html"), `<div style="background-image: url('${imageUrl}')"></div>`);
    const fetchImpl = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
      headers: { "content-type": "image/png" },
      status: 200,
    }));

    await localizeAssets({ ...paths, fetchImpl });
    await localizeAssets({ ...paths, fetchImpl });

    const hash = createHash("sha256").update(imageUrl).digest("hex");
    const manifest = JSON.parse(await readFile(paths.manifestPath, "utf8")) as Record<string, string>;
    expect(manifest).toEqual({ [imageUrl]: `/stitch/assets/${hash}.png` });
    expect(await readFile(path.join(paths.outputDir, `${hash}.png`))).toEqual(Buffer.from([1, 2, 3]));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["a non-success response", new Response("no", { status: 503 })],
    ["a non-image response", new Response("no", { headers: { "content-type": "text/html" }, status: 200 })],
  ])("rejects %s", async (_label, response) => {
    const paths = await createFixture();
    await writeFile(
      path.join(paths.sourceDir, "screen.html"),
      '<img src="https://lh3.googleusercontent.com/aida-public/example_asset">',
    );

    await expect(localizeAssets({ ...paths, fetchImpl: async () => response })).rejects.toThrow();
  });
});
