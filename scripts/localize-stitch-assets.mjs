import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ASSET_URL_PATTERN = /https:\/\/lh3\.googleusercontent\.com\/aida-public\/[A-Za-z0-9_-]+/g;
const EXTENSIONS = new Set(["png", "jpg", "webp"]);

function extensionForContentType(contentType) {
  const normalized = contentType.split(";", 1)[0].trim().toLowerCase();
  const extensions = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensions[normalized];

  if (!extension) {
    throw new Error(`Unsupported image content type: ${contentType || "missing"}`);
  }

  return extension;
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readExistingManifest(manifestPath) {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

export async function collectAssetUrls(sourceDir) {
  const htmlFiles = (await readdir(sourceDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => entry.name)
    .sort();
  const urls = new Set();

  for (const fileName of htmlFiles) {
    const html = await readFile(path.join(sourceDir, fileName), "utf8");
    for (const match of html.matchAll(ASSET_URL_PATTERN)) {
      urls.add(match[0]);
    }
  }

  return [...urls].sort();
}

export async function localizeAssets({
  fetchImpl = fetch,
  manifestPath,
  outputDir,
  sourceDir,
}) {
  const urls = await collectAssetUrls(sourceDir);
  const existingManifest = await readExistingManifest(manifestPath);
  const manifest = {};

  await mkdir(outputDir, { recursive: true });

  await Promise.all(urls.map(async (url) => {
    const hash = createHash("sha256").update(url).digest("hex");
    const existingPublicPath = existingManifest[url];
    const existingFileName = typeof existingPublicPath === "string" ? path.posix.basename(existingPublicPath) : "";
    const existingExtension = path.extname(existingFileName).slice(1);
    const isReusable = existingFileName.startsWith(`${hash}.`)
      && EXTENSIONS.has(existingExtension)
      && await pathExists(path.join(outputDir, existingFileName));

    if (isReusable) {
      manifest[url] = `/stitch/assets/${existingFileName}`;
      return;
    }

    const response = await fetchImpl(url, { signal: AbortSignal.timeout(20_000) });
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
    }

    const extension = extensionForContentType(response.headers.get("content-type") ?? "");
    const fileName = `${hash}.${extension}`;
    await writeFile(path.join(outputDir, fileName), new Uint8Array(await response.arrayBuffer()));
    manifest[url] = `/stitch/assets/${fileName}`;
  }));

  const sortedManifest = Object.fromEntries(Object.entries(manifest).sort(([left], [right]) => left.localeCompare(right)));
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(sortedManifest, null, 2)}\n`);
  return sortedManifest;
}

async function main() {
  const projectRoot = process.cwd();
  const manifest = await localizeAssets({
    manifestPath: path.join(projectRoot, "public", "stitch", "asset-manifest.json"),
    outputDir: path.join(projectRoot, "public", "stitch", "assets"),
    sourceDir: path.join(projectRoot, "design", "stitch", "screens"),
  });
  console.log(`Localized ${Object.keys(manifest).length} Stitch assets.`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
