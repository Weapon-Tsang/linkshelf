import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
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
    expect((await readdir(path.dirname(paths.manifestPath))).filter((entry) => entry.endsWith(".tmp"))).toEqual([]);
  });

  it("limits concurrent downloads to four", async () => {
    const paths = await createFixture();
    const imageUrls = Array.from(
      { length: 8 },
      (_, index) => `https://lh3.googleusercontent.com/aida-public/example_asset_${index}`,
    );
    await writeFile(path.join(paths.sourceDir, "screen.html"), imageUrls.map((url) => `<img src="${url}">`).join(""));
    let activeDownloads = 0;
    let maximumActiveDownloads = 0;

    const fetchImpl = vi.fn(async () => {
      activeDownloads += 1;
      maximumActiveDownloads = Math.max(maximumActiveDownloads, activeDownloads);
      await new Promise((resolve) => setTimeout(resolve, 5));
      activeDownloads -= 1;
      return new Response(new Uint8Array([1]), {
        headers: { "content-type": "image/png" },
        status: 200,
      });
    });

    await localizeAssets({ ...paths, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(8);
    expect(maximumActiveDownloads).toBe(4);
  });

  it("rejects oversized images from Content-Length before reading the body", async () => {
    const paths = await createFixture();
    await writeFile(
      path.join(paths.sourceDir, "screen.html"),
      '<img src="https://lh3.googleusercontent.com/aida-public/example_asset">',
    );
    const response = new Response(new Uint8Array([1]), {
      headers: {
        "content-length": String(10 * 1024 * 1024 + 1),
        "content-type": "image/png",
      },
      status: 200,
    });
    const readBody = vi.spyOn(response, "arrayBuffer");

    await expect(localizeAssets({ ...paths, fetchImpl: async () => response })).rejects.toThrow("exceeds 10 MiB");
    expect(readBody).not.toHaveBeenCalled();
  });

  it("rejects oversized images after reading a body without Content-Length", async () => {
    const paths = await createFixture();
    await writeFile(
      path.join(paths.sourceDir, "screen.html"),
      '<img src="https://lh3.googleusercontent.com/aida-public/example_asset">',
    );
    const response = new Response(new Uint8Array(10 * 1024 * 1024 + 1), {
      headers: { "content-type": "image/webp" },
      status: 200,
    });

    await expect(localizeAssets({ ...paths, fetchImpl: async () => response })).rejects.toThrow("exceeds 10 MiB");
  });

  it("removes its temporary manifest if the atomic rename fails", async () => {
    const paths = await createFixture();
    await mkdir(path.dirname(paths.manifestPath), { recursive: true });
    await writeFile(paths.manifestPath, "{}\n");
    await writeFile(
      path.join(paths.sourceDir, "screen.html"),
      '<img src="https://lh3.googleusercontent.com/aida-public/example_asset">',
    );

    const fetchImpl = vi.fn(async () => {
      await rm(paths.manifestPath);
      await mkdir(paths.manifestPath);
      return new Response(new Uint8Array([1]), {
        headers: { "content-type": "image/png" },
        status: 200,
      });
    });

    await expect(localizeAssets({ ...paths, fetchImpl })).rejects.toThrow();
    expect((await readdir(path.dirname(paths.manifestPath))).filter((entry) => entry.endsWith(".tmp"))).toEqual([]);
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
