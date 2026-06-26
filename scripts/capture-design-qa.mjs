import { chromium } from "@playwright/test";
import { mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const baseUrl = process.env.LINKSHELF_BASE_URL ?? "http://127.0.0.1:3000";
const outRoot = path.join(root, "test-results", "design-qa", "latest");
const implDir = path.join(outRoot, "impl");
const compareDir = path.join(outRoot, "compare");
const notesPath = path.join(outRoot, "capture-notes.json");

const desktop = { width: 1280, height: 1024, deviceScaleFactor: 2 };
const tallDesktop = { width: 1280, height: 1600, deviceScaleFactor: 2 };
const narrow = { width: 728, height: 1024, deviceScaleFactor: 2 };

const targets = [
  {
    id: "landing-page",
    reference: "landing-page.jpg",
    route: "/",
    viewport: tallDesktop,
    state: "anonymous landing page",
  },
  {
    id: "creator-profile",
    reference: "creator-profile.png",
    route: "/liamroberts.photo",
    viewport: tallDesktop,
    state: "anonymous creator profile",
  },
  {
    id: "creator-login",
    reference: "creator-login.png",
    route: "/login?returnTo=/studio/dashboard",
    viewport: desktop,
    state: "creator Google login page",
  },
  {
    id: "studio-dashboard",
    reference: "studio-dashboard.jpg",
    role: "creator",
    route: "/studio/dashboard",
    viewport: desktop,
    state: "authenticated creator dashboard",
  },
  {
    id: "studio-management-expanded",
    reference: "studio-management-expanded.jpg",
    role: "creator",
    route: "/studio/shelves",
    viewport: desktop,
    state: "authenticated creator shelf management",
  },
  {
    id: "studio-management-one-column",
    reference: "studio-management-one-column.jpg",
    role: "creator",
    route: "/studio/shelves",
    viewport: desktop,
    state: "authenticated creator one-column shelf management route",
  },
  {
    id: "studio-create-shelf",
    reference: "studio-create-shelf.jpg",
    role: "creator",
    route: "/studio/create",
    viewport: desktop,
    state: "authenticated creator create shelf form",
  },
  {
    id: "studio-settings",
    reference: "studio-settings.jpg",
    role: "creator",
    route: "/studio/settings",
    viewport: narrow,
    state: "authenticated creator settings",
  },
  {
    id: "studio-analytics",
    reference: "studio-analytics.jpg",
    role: "creator",
    route: "/studio/analytics",
    viewport: desktop,
    state: "authenticated creator analytics",
  },
  {
    id: "studio-comments",
    reference: "studio-comments.jpg",
    role: "creator",
    route: "/studio/comments",
    viewport: desktop,
    state: "authenticated creator comments management",
  },
  {
    id: "fan-dashboard",
    reference: "fan-dashboard.png",
    role: "fan",
    route: "/hub/dashboard",
    viewport: desktop,
    state: "authenticated fan hub dashboard",
  },
  {
    id: "fan-auth-overlay",
    reference: "fan-auth-overlay.png",
    route: "/liamroberts.photo/photography-kit",
    viewport: desktop,
    state: "anonymous public shelf with fan authentication overlay opened",
    fullPage: false,
    beforeCapture: async (page) => {
      await page.getByRole("button", { name: /share shelf/i }).click();
      await page.getByRole("dialog", { name: /fan authentication/i }).waitFor();
    },
  },
  {
    id: "admin-login",
    reference: "admin-login.png",
    viewport: desktop,
    state: "admin secret Google gate",
    setup: async (page) => {
      await page.goto(`${baseUrl}/api/auth/admin-entry?returnTo=%2Fadmin%2Fdashboard`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForURL(/\/admin-secret/);
      await page.waitForLoadState("domcontentloaded");
    },
  },
  {
    id: "super-admin",
    reference: "super-admin.png",
    viewport: desktop,
    state: "authenticated super admin dashboard",
    setup: async (page) => {
      await page.goto(`${baseUrl}/api/auth/admin-entry?returnTo=%2Fadmin%2Fdashboard`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForURL(/\/admin-secret/);
      await page.getByRole("button", { name: /continue with google/i }).click();
      await page.waitForURL(/\/admin\/dashboard/);
      await page.waitForLoadState("domcontentloaded");
    },
  },
];

const knownBlockers = [
  {
    id: "share-modal",
    reference: "share-modal.png",
    state: "public shelf share dialog",
    blocker:
      "The ShareDialog component exists and is covered by component tests, but no live app route or button currently opens it; the public share button opens FanAuthDialog instead.",
  },
];

function ensureCleanOutput() {
  rmSync(outRoot, { recursive: true, force: true });
  mkdirSync(implDir, { recursive: true });
  mkdirSync(compareDir, { recursive: true });
}

async function assertServerReachable() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(baseUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Expected ${baseUrl} to respond with 2xx/3xx, got ${response.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function loginAs(context, role, returnTo) {
  const response = await context.request.post(`${baseUrl}/api/auth/google`, {
    form: { role, returnTo },
    headers: { origin: baseUrl },
    maxRedirects: 0,
  });
  if (response.status() !== 303) {
    throw new Error(`Expected ${role} login to return 303, got ${response.status()}`);
  }
}

function htmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function relativeFileUrl(fromFile, targetFile) {
  return path.relative(path.dirname(fromFile), targetFile).split(path.sep).join("/");
}

function writeComparison(target, implPath, compareHtmlPath) {
  const referencePath = path.join(root, "design", "stitch", "screens", target.reference);
  const referenceSrc = relativeFileUrl(compareHtmlPath, referencePath);
  const implSrc = relativeFileUrl(compareHtmlPath, implPath);
  const viewportLabel = `${target.viewport.width}x${target.viewport.height}@${target.viewport.deviceScaleFactor ?? 1}`;
  writeFileSync(
    compareHtmlPath,
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${htmlEscape(target.id)} visual comparison</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #111827;
      color: #f9fafb;
      font: 14px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      gap: 24px;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(255,255,255,.14);
      background: rgba(17,24,39,.92);
      backdrop-filter: blur(18px);
    }
    h1 { margin: 0; font-size: 18px; }
    .meta { color: #cbd5e1; }
    .pair {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 20px;
      padding: 20px;
      align-items: start;
    }
    figure {
      margin: 0;
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 18px;
      overflow: hidden;
      background: #020617;
      box-shadow: 0 24px 80px rgba(0,0,0,.28);
    }
    figcaption {
      padding: 12px 14px;
      color: #cbd5e1;
      border-bottom: 1px solid rgba(255,255,255,.12);
      background: rgba(15,23,42,.96);
      font-weight: 700;
    }
    img {
      display: block;
      width: 100%;
      height: auto;
      background: white;
    }
  </style>
</head>
<body>
  <header>
    <h1>${htmlEscape(target.id)}</h1>
    <div class="meta">Viewport: ${htmlEscape(viewportLabel)} · State: ${htmlEscape(target.state)}</div>
  </header>
  <main class="pair">
    <figure>
      <figcaption>Stitch reference · ${htmlEscape(target.reference)}</figcaption>
      <img alt="Stitch reference" src="${referenceSrc}" />
    </figure>
    <figure>
      <figcaption>Current implementation · ${htmlEscape(path.basename(implPath))}</figcaption>
      <img alt="Implementation screenshot" src="${implSrc}" />
    </figure>
  </main>
</body>
</html>
`,
  );
}

async function captureTarget(browser, target) {
  const context = await browser.newContext({
    baseURL: baseUrl,
    colorScheme: "light",
    deviceScaleFactor: target.viewport.deviceScaleFactor ?? 1,
    isMobile: target.viewport.isMobile ?? false,
    viewport: {
      width: target.viewport.width,
      height: target.viewport.height,
    },
  });
  const page = await context.newPage();
  try {
    if (target.role) {
      await loginAs(context, target.role, target.route);
    }
    if (target.setup) {
      await target.setup(page);
    } else {
      await page.goto(target.route, { waitUntil: "domcontentloaded" });
    }
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(900);
    if (target.beforeCapture) {
      await target.beforeCapture(page);
      await page.waitForTimeout(400);
    }
    const implPath = path.join(implDir, `${target.id}.png`);
    await page.screenshot({ path: implPath, fullPage: target.fullPage ?? true });
    const size = statSync(implPath).size;
    if (size < 10_000) {
      throw new Error(`Screenshot for ${target.id} looks too small (${size} bytes)`);
    }
    const compareHtmlPath = path.join(compareDir, `${target.id}.html`);
    writeComparison(target, implPath, compareHtmlPath);
    return {
      id: target.id,
      status: "captured",
      route: target.route ?? "custom setup",
      state: target.state,
      viewport: `${target.viewport.width}x${target.viewport.height}@${target.viewport.deviceScaleFactor ?? 1}`,
      reference: path.relative(root, path.join(root, "design", "stitch", "screens", target.reference)),
      implementation: path.relative(root, implPath),
      comparisonHtml: path.relative(root, compareHtmlPath),
    };
  } finally {
    await context.close();
  }
}

async function renderComparison(browser, result) {
  const htmlPath = path.join(root, result.comparisonHtml);
  const pngPath = path.join(compareDir, `${result.id}.png`);
  const context = await browser.newContext({
    viewport: { width: 1800, height: 1400 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  try {
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
    await page.screenshot({ path: pngPath, fullPage: true });
    return path.relative(root, pngPath);
  } finally {
    await context.close();
  }
}

async function main() {
  ensureCleanOutput();
  await assertServerReachable();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const results = [];
  try {
    for (const target of targets) {
      const result = await captureTarget(browser, target);
      result.comparisonPng = await renderComparison(browser, result);
      results.push(result);
      console.log(`captured ${target.id}`);
    }
  } finally {
    await browser.close();
  }

  for (const blocker of knownBlockers) {
    results.push({
      id: blocker.id,
      status: "blocked",
      state: blocker.state,
      reference: path.relative(root, path.join(root, "design", "stitch", "screens", blocker.reference)),
      blocker: blocker.blocker,
    });
    console.log(`blocked ${blocker.id}: ${blocker.blocker}`);
  }

  writeFileSync(notesPath, `${JSON.stringify({ baseUrl, generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
  console.log(`wrote ${path.relative(root, notesPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
