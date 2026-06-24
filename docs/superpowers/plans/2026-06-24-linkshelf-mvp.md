# LinkShelf MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete locally persistent LinkShelf MVP from the approved routing document and 15 Stitch screens, including Google-only development authentication and a tested 80/20 simulated Amazon affiliate redirect.

**Architecture:** Use one Next.js App Router application with typed feature services, repository interfaces, Node 24's built-in SQLite adapter, and provider boundaries for authentication, metadata, media, affiliate links, and payouts. Server components read through services; client components own only interactive UI state; route handlers own cookies and redirects.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Node `node:sqlite`, Zod, Vitest, Testing Library, Playwright, axe-core, Recharts, Material Symbols.

---

## Delivery phases

This plan keeps the broad product testable by delivering four working increments:

1. **Platform core:** project harness, database, authentication, and affiliate redirect.
2. **Public product:** landing, creator, shelf, sharing, and fan authentication.
3. **Authenticated product:** Creator Studio, Fan Hub, and Super Admin.
4. **Release gate:** responsive behavior, accessibility, end-to-end tests, visual comparison, and build verification.

## File structure

```text
src/
  app/
    (public)/page.tsx
    login/page.tsx
    admin-secret/page.tsx
    [creatorHandle]/page.tsx
    [creatorHandle]/[shelfId]/page.tsx
    studio/layout.tsx
    studio/dashboard/page.tsx
    studio/shelves/page.tsx
    studio/shelves/[shelfId]/edit/page.tsx
    studio/create/page.tsx
    studio/analytics/page.tsx
    studio/comments/page.tsx
    studio/settings/page.tsx
    hub/layout.tsx
    hub/dashboard/page.tsx
    admin/layout.tsx
    admin/dashboard/page.tsx
    api/auth/google/route.ts
    api/auth/logout/route.ts
    api/out/[productId]/route.ts
    globals.css
    layout.tsx
  components/brand/brand-mark.tsx
  components/brand/public-nav.tsx
  components/brand/site-footer.tsx
  components/ui/button.tsx
  components/ui/dialog.tsx
  components/ui/status-pill.tsx
  features/
    auth/{adapter,guards,session,types}.ts
    affiliate/{resolve-redirect,rewrite-amazon-tag,types}.ts
    shelves/{actions,metadata-adapter,repository,service,types}.ts
    engagement/{actions,repository,types}.ts
    wallet/{actions,repository,types}.ts
    public-profile/creator-profile-page.tsx
    public-profile/shelf-page.tsx
    public-profile/product-card.tsx
    public-profile/hotspot-hero.tsx
    studio/studio-shell.tsx
    studio/dashboard-view.tsx
    studio/shelf-management-view.tsx
    studio/shelf-editor.tsx
    studio/item-editor.tsx
    studio/shelf-preview.tsx
    studio/analytics-view.tsx
    studio/comments-view.tsx
    studio/settings-view.tsx
    hub/hub-shell.tsx
    hub/hub-dashboard.tsx
    admin/admin-shell.tsx
    admin/admin-dashboard.tsx
  lib/
    db/{client,migrate,schema,seed}.ts
    env.ts
    result.ts
    site-config.ts
tests/unit/site-config.test.ts
tests/unit/auth-guards.test.ts
tests/unit/rewrite-amazon-tag.test.ts
tests/unit/affiliate-selection.test.ts
tests/unit/metadata-adapter.test.ts
tests/integration/database.test.ts
tests/integration/affiliate-route.test.ts
tests/integration/public-shelves.test.ts
tests/integration/engagement.test.ts
tests/integration/shelf-management.test.ts
tests/integration/shelf-editor-actions.test.ts
tests/integration/comment-actions.test.ts
tests/integration/wallet.test.ts
tests/integration/admin-actions.test.ts
tests/component/design-system.test.tsx
tests/component/google-login.test.tsx
tests/component/landing-page.test.tsx
tests/component/public-shelf.test.tsx
tests/component/share-dialog.test.tsx
tests/component/studio-navigation.test.tsx
tests/component/studio-tools.test.tsx
tests/component/shelf-editor.test.tsx
tests/component/fan-hub.test.tsx
tests/component/admin-dashboard.test.tsx
tests/e2e/landing.spec.ts
tests/e2e/auth.spec.ts
tests/e2e/creator-flow.spec.ts
tests/e2e/fan-flow.spec.ts
tests/e2e/admin-flow.spec.ts
tests/e2e/accessibility.spec.ts
tests/e2e/responsive.spec.ts
public/stitch/asset-manifest.json
public/stitch/assets/
scripts/localize-stitch-assets.mjs
```

### Task 1: Bootstrap the application and test harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `src/lib/site-config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `tests/unit/site-config.test.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Initialize package metadata and install the runtime/test dependencies**

Run:

```bash
pnpm init
pnpm add next react react-dom next-auth zod clsx tailwind-merge recharts material-symbols
pnpm add -D typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss eslint eslint-config-next vitest jsdom @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test @axe-core/playwright
pnpm exec playwright install chromium
```

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Expected: `pnpm install` finishes without peer-dependency errors and `pnpm exec next --version` prints a version.

- [ ] **Step 2: Configure TypeScript, Next.js, Tailwind, ESLint, Vitest, and Playwright**

Use `@/* -> ./src/*`, the `jsdom` Vitest environment, `vitest.setup.ts` for `@testing-library/jest-dom/vitest`, Chromium at `http://127.0.0.1:3000`, and `pnpm dev` as Playwright's `webServer.command`. Add `data/`, `public/uploads/`, and `.auth/` to `.gitignore`.

- [ ] **Step 3: Write the failing site-configuration test**

```ts
// tests/unit/site-config.test.ts
import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/site-config";

describe("siteConfig", () => {
  it("defines the LinkShelf product identity", () => {
    expect(siteConfig).toEqual({
      name: "LinkShelf",
      description: "Visual affiliate shelves for creators and fans.",
      defaultPlatformTag: "linkshelf-platform-20",
    });
  });
});
```

- [ ] **Step 4: Run the test and verify RED**

Run: `pnpm test tests/unit/site-config.test.ts`  
Expected: FAIL because `@/lib/site-config` does not exist.

- [ ] **Step 5: Implement the minimal configuration and root layout**

```ts
// src/lib/site-config.ts
export const siteConfig = {
  name: "LinkShelf",
  description: "Visual affiliate shelves for creators and fans.",
  defaultPlatformTag: "linkshelf-platform-20",
} as const;
```

`src/app/layout.tsx` must export metadata from `siteConfig`, load `globals.css`, set `lang="en"`, and render children without route-specific chrome.

- [ ] **Step 6: Run the platform checks and verify GREEN**

Run: `pnpm test tests/unit/site-config.test.ts && pnpm typecheck && pnpm lint`  
Expected: PASS with no warnings.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs vitest.config.ts vitest.setup.ts playwright.config.ts src/app src/lib/site-config.ts tests/unit/site-config.test.ts .gitignore
git commit -m "chore: bootstrap LinkShelf application"
```

### Task 2: Localize Stitch assets and establish the design system

**Files:**
- Create: `scripts/localize-stitch-assets.mjs`
- Create: `public/stitch/asset-manifest.json`
- Create: `src/components/brand/brand-mark.tsx`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/status-pill.tsx`
- Create: `src/lib/cn.ts`
- Test: `tests/component/design-system.test.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the failing design-system test**

```tsx
// tests/component/design-system.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";

describe("design system", () => {
  it("renders the brand and an accessible primary action", () => {
    render(<><BrandMark /><Button>Start Your Shelf</Button></>);
    expect(screen.getByText("LinkShelf")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start Your Shelf" })).toHaveAttribute("data-variant", "primary");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm test tests/component/design-system.test.tsx`  
Expected: FAIL because the components do not exist.

- [ ] **Step 3: Localize all external images referenced by the 15 Stitch HTML files**

`scripts/localize-stitch-assets.mjs` must scan `design/stitch/screens/*.html`, collect unique `https://lh3.googleusercontent.com/aida-public/` URLs, download them to `public/stitch/assets/`, detect PNG/JPEG/WebP from the response content type, and write a stable URL-to-file map to `public/stitch/asset-manifest.json`. Use SHA-256 URL hashes for filenames so repeated assets deduplicate.

Run: `node scripts/localize-stitch-assets.mjs`  
Expected: the manifest has 46 unique entries and every referenced file exists.

- [ ] **Step 4: Implement the shared tokens and components**

Use these CSS custom properties in `globals.css`:

```css
:root {
  --ink: #0b132b;
  --teal-700: #007c72;
  --teal-500: #00bfae;
  --glow: #64f6e3;
  --surface: #fcf8fb;
  --surface-low: #f6f3f5;
  --line: #e5e2e7;
  --muted: #686873;
  --danger: #ba1a1a;
  --shadow-card: 0 12px 34px rgba(29, 29, 31, 0.06);
}
```

`Button` supports `primary`, `secondary`, `ghost`, and `danger`; `Dialog` implements `role="dialog"`, `aria-modal`, Escape handling, focus trapping, and focus restoration; `BrandMark` uses Material Symbols `dataset` and visible LinkShelf text.

- [ ] **Step 5: Run the component test and verify GREEN**

Run: `pnpm test tests/component/design-system.test.tsx`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts public/stitch src/app/globals.css src/components src/lib/cn.ts tests/component/design-system.test.tsx
git commit -m "feat: add LinkShelf design system and local assets"
```

### Task 3: Create the SQLite schema, migrations, and seed data

**Files:**
- Create: `src/lib/db/client.ts`
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/migrate.ts`
- Create: `src/lib/db/seed.ts`
- Create: `src/features/auth/types.ts`
- Create: `src/features/affiliate/types.ts`
- Create: `src/features/shelves/types.ts`
- Create: `src/features/engagement/types.ts`
- Create: `src/features/wallet/types.ts`
- Test: `tests/integration/database.test.ts`

- [ ] **Step 1: Write the failing database test**

```ts
// tests/integration/database.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";

describe("local database", () => {
  const databases: ReturnType<typeof createDatabase>[] = [];
  afterEach(() => databases.splice(0).forEach((db) => db.close()));

  it("migrates and seeds idempotently", () => {
    const db = createDatabase(":memory:");
    databases.push(db);
    migrate(db);
    seed(db);
    seed(db);
    const count = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
    expect(count.count).toBe(3);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm test tests/integration/database.test.ts`  
Expected: FAIL because the database modules do not exist.

- [ ] **Step 3: Implement the SQLite client and normalized schema**

`createDatabase(path)` returns `new DatabaseSync(path)` and enables `foreign_keys`, WAL for file databases, and a 5-second busy timeout. `migrate` runs versioned SQL in one transaction and creates the approved tables: `users`, `creator_profiles`, `shelves`, `products`, `social_channels`, `saves`, `comments`, `shares`, `click_events`, `wallet_entries`, and `withdrawals`. Use foreign keys, unique `(creator_id, slug)`, unique share short codes, status checks, created/updated timestamps, and nullable `deleted_at` fields for shelves/comments.

Define the shared enums exactly once:

```ts
// src/features/auth/types.ts
export type UserRole = "CREATOR" | "FAN" | "ADMIN";

// src/features/shelves/types.ts
export type ShelfStatus = "DRAFT" | "PUBLISHED";
export type SocialChannelType = "X" | "WHATSAPP" | "FACEBOOK" | "EMAIL" | "COPY";

// src/features/affiliate/types.ts
export type ClickBeneficiary = "FAN" | "CREATOR" | "PLATFORM";

// src/features/engagement/types.ts
export type CommentStatus = "VISIBLE" | "HIDDEN";

// src/features/wallet/types.ts
export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type WalletEntryStatus = "PENDING" | "CLEARED";
```

- [ ] **Step 4: Implement idempotent seed data**

Seed exactly three identities: creator `creator@linkshelf.local`, fan `fan@linkshelf.local`, and admin `admin@linkshelf.local`. Seed Liam Roberts, Alex Rivera, three shelves, the products visible in the Stitch screens, dynamic social channels, fan saves/shares, sample click events, wallet entries, comments, and pending withdrawals. Use `INSERT OR IGNORE` with stable IDs.

- [ ] **Step 5: Run the database test and verify GREEN**

Run: `pnpm test tests/integration/database.test.ts`  
Expected: PASS and report three users after the second seed call.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db src/features/*/types.ts tests/integration/database.test.ts
git commit -m "feat: add persistent LinkShelf data model"
```

### Task 4: Implement Google-only development authentication and role guards

**Files:**
- Create: `src/features/auth/adapter.ts`
- Create: `src/features/auth/session.ts`
- Create: `src/features/auth/guards.ts`
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/api/auth/google/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/features/auth/google-login-button.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/admin-secret/page.tsx`
- Create: `src/app/forbidden/page.tsx`
- Test: `tests/unit/auth-guards.test.ts`
- Test: `tests/component/google-login.test.tsx`

- [ ] **Step 1: Write failing guard tests**

```ts
// tests/unit/auth-guards.test.ts
import { describe, expect, it } from "vitest";
import { canAccess } from "@/features/auth/guards";

describe("role access", () => {
  it.each([
    ["CREATOR", "/studio/dashboard", true],
    ["FAN", "/studio/dashboard", false],
    ["ADMIN", "/admin/dashboard", true],
    ["CREATOR", "/admin/dashboard", false],
    ["FAN", "/hub/dashboard", true],
    ["CREATOR", "/hub/dashboard", true],
  ] as const)("checks %s for %s", (role, path, expected) => {
    expect(canAccess(role, path)).toBe(expected);
  });
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm test tests/unit/auth-guards.test.ts`  
Expected: FAIL because `canAccess` does not exist.

- [ ] **Step 3: Implement signed local sessions and the Google adapter boundary**

Use an HTTP-only, same-site `lax`, secure-in-production cookie containing a stable user ID and HMAC-SHA256 signature. `POST /api/auth/google` accepts only the internal role hint values `creator`, `fan`, or `admin`, maps them to seeded Google-shaped identities in development, sets the session, validates a same-origin relative `returnTo`, and responds with a 303. `src/auth.ts` configures Auth.js with the Google provider when `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `AUTH_SECRET` exist; the catch-all route exports its GET/POST handlers and the sign-in callback maps Google subject/email to a local user. Production mode disables role hints and routes the same Google button through Auth.js.

```ts
// src/features/auth/guards.ts
import type { UserRole } from "./types";

export function canAccess(role: UserRole, pathname: string) {
  if (pathname.startsWith("/admin")) return role === "ADMIN";
  if (pathname.startsWith("/studio")) return role === "CREATOR";
  if (pathname.startsWith("/hub")) return role === "FAN" || role === "CREATOR";
  return true;
}
```

- [ ] **Step 4: Implement the two Google-only login pages**

`/login` matches `creator-login.html` but renders only the Google button. `/admin-secret` keeps the secure admin visual treatment but replaces ID/password/2FA controls with Google login and an “Authorized administrators only” note. Neither DOM contains password, email, GitHub, X, or 2FA controls.

- [ ] **Step 5: Run unit and component tests and verify GREEN**

Run: `pnpm test tests/unit/auth-guards.test.ts tests/component/google-login.test.tsx`  
Expected: PASS; the component test finds one Google button and no password textbox.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth src/app/api/auth src/app/login src/app/admin-secret src/app/forbidden tests/unit/auth-guards.test.ts tests/component/google-login.test.tsx
git commit -m "feat: add Google-only development authentication"
```

### Task 5: Implement and expose the 80/20 affiliate redirect

**Files:**
- Modify: `src/features/affiliate/types.ts`
- Create: `src/features/affiliate/rewrite-amazon-tag.ts`
- Create: `src/features/affiliate/resolve-redirect.ts`
- Create: `src/features/affiliate/repository.ts`
- Create: `src/app/api/out/[productId]/route.ts`
- Test: `tests/unit/rewrite-amazon-tag.test.ts`
- Test: `tests/unit/affiliate-selection.test.ts`
- Test: `tests/integration/affiliate-route.test.ts`

- [ ] **Step 1: Write failing URL rewrite tests**

```ts
// tests/unit/rewrite-amazon-tag.test.ts
import { describe, expect, it } from "vitest";
import { rewriteAmazonTag } from "@/features/affiliate/rewrite-amazon-tag";

describe("rewriteAmazonTag", () => {
  it("replaces tag and preserves other query parameters", () => {
    expect(rewriteAmazonTag("https://www.amazon.com/dp/B0TEST?tag=old-20&th=1", "fan-demo-20"))
      .toBe("https://www.amazon.com/dp/B0TEST?tag=fan-demo-20&th=1");
  });

  it("rejects non-Amazon destinations", () => {
    expect(() => rewriteAmazonTag("https://example.com/item", "fan-demo-20"))
      .toThrow("Unsupported Amazon host");
  });
});
```

- [ ] **Step 2: Write failing selection tests**

```ts
// tests/unit/affiliate-selection.test.ts
import { describe, expect, it } from "vitest";
import { selectAffiliate } from "@/features/affiliate/resolve-redirect";

const input = { fanTag: "fan-demo-20", creatorTag: "liamcreator-20", platformTag: "linkshelf-platform-20" };

describe("selectAffiliate", () => {
  it("uses fan in the lower 80 percent", () => expect(selectAffiliate(input, () => 0.7999).beneficiary).toBe("FAN"));
  it("uses creator at the 80 percent boundary", () => expect(selectAffiliate(input, () => 0.8).beneficiary).toBe("CREATOR"));
  it("falls back to platform when fan tag is blank", () => expect(selectAffiliate({ ...input, fanTag: null }, () => 0.2)).toMatchObject({ beneficiary: "PLATFORM", fallbackReason: "MISSING_FAN_TAG" }));
});
```

- [ ] **Step 3: Run tests and verify RED**

Run: `pnpm test tests/unit/rewrite-amazon-tag.test.ts tests/unit/affiliate-selection.test.ts`  
Expected: FAIL because the affiliate modules do not exist.

- [ ] **Step 4: Implement selection, rewriting, transactional persistence, and 302 response**

`selectAffiliate(input, random)` uses `roll < 0.8`; `resolveRedirect` loads product/shelf/creator/share, validates Amazon host suffixes exactly, selects the tag, rewrites the URL, inserts `click_events` in a transaction, and returns the destination. The route returns 404 for missing products, 400 for invalid destinations, 503 when event persistence fails, and `Response.redirect(destination, 302)` on success.

- [ ] **Step 5: Run all affiliate tests and verify GREEN**

Run: `pnpm test tests/unit/rewrite-amazon-tag.test.ts tests/unit/affiliate-selection.test.ts tests/integration/affiliate-route.test.ts`  
Expected: PASS, including an assertion on the 302 `Location` header and click-event row.

- [ ] **Step 6: Commit**

```bash
git add src/features/affiliate src/app/api/out tests/unit/rewrite-amazon-tag.test.ts tests/unit/affiliate-selection.test.ts tests/integration/affiliate-route.test.ts
git commit -m "feat: add simulated affiliate redirect service"
```

### Task 6: Build the premium landing page

**Files:**
- Create: `src/app/(public)/page.tsx`
- Create: `src/features/landing/landing-page.tsx`
- Create: `src/features/landing/creator-carousel.tsx`
- Create: `src/features/landing/hero-visual.tsx`
- Create: `src/components/brand/public-nav.tsx`
- Create: `src/components/brand/site-footer.tsx`
- Test: `tests/component/landing-page.test.tsx`
- Test: `tests/e2e/landing.spec.ts`

- [ ] **Step 1: Write the failing landing-page test**

```tsx
// tests/component/landing-page.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingPage } from "@/features/landing/landing-page";

describe("LandingPage", () => {
  it("routes every primary CTA to creator Google login", () => {
    render(<LandingPage />);
    const links = screen.getAllByRole("link", { name: /start your shelf|get started|claim your visual shelf/i });
    expect(links.length).toBeGreaterThanOrEqual(3);
    expect(links.every((link) => link.getAttribute("href") === "/login?returnTo=%2Fstudio%2Fdashboard")).toBe(true);
  });
});
```

- [ ] **Step 2: Run and verify RED**

Run: `pnpm test tests/component/landing-page.test.tsx`  
Expected: FAIL because `LandingPage` does not exist.

- [ ] **Step 3: Implement all landing sections from the Stitch source**

Use `design/stitch/screens/landing-page.html` and `.jpg` as the fixed reference. Implement the glass navigation, animated hero, two CTAs, four value cards, four alternating feature rows, six-item seamless creator carousel duplicated for continuous motion, dark final CTA, and footer. Correct the supplied canvas shader and layer only localized Stitch imagery inside the hero; do not substitute improvised CSS illustration. Pause carousel animation on hover/focus and disable nonessential motion under reduced-motion.

- [ ] **Step 4: Run component test and a route screenshot**

Run: `pnpm test tests/component/landing-page.test.tsx && pnpm exec playwright test tests/e2e/landing.spec.ts`  
Expected: PASS and a full-page desktop screenshot artifact.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(public)' src/features/landing src/components/brand tests/component/landing-page.test.tsx tests/e2e/landing.spec.ts
git commit -m "feat: build premium LinkShelf landing page"
```

### Task 7: Build creator profile and public shelf pages

**Files:**
- Create: `src/features/shelves/repository.ts`
- Create: `src/features/shelves/service.ts`
- Create: `src/features/public-profile/creator-profile-page.tsx`
- Create: `src/features/public-profile/shelf-page.tsx`
- Create: `src/features/public-profile/product-card.tsx`
- Create: `src/features/public-profile/hotspot-hero.tsx`
- Create: `src/app/[creatorHandle]/page.tsx`
- Create: `src/app/[creatorHandle]/[shelfId]/page.tsx`
- Test: `tests/integration/public-shelves.test.ts`
- Test: `tests/component/public-shelf.test.tsx`

- [ ] **Step 1: Write failing public-shelf service tests**

Assert that `getCreatorProfile("liamroberts.photo")` returns three shelves, `getPublicShelf` rejects drafts and deleted shelves, and products preserve `sortPosition`.

- [ ] **Step 2: Run and verify RED**

Run: `pnpm test tests/integration/public-shelves.test.ts`  
Expected: FAIL because the repository/service do not exist.

- [ ] **Step 3: Implement repository queries and typed not-found results**

Use prepared SQLite statements only. Public profile queries return creator media, enabled social channels, published shelves, and featured products. Shelf queries return the ordered products and hotspot coordinates without exposing affiliate tags.

- [ ] **Step 4: Implement both routes from the Stitch references**

The profile matches `creator-profile`; the shelf matches the 780-pixel `share-modal` reference at mobile and expands to a two-column desktop reading layout. Every purchase button links to `/api/out/{productId}` and includes `share={shortCode}` only when attribution exists.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `pnpm test tests/integration/public-shelves.test.ts tests/component/public-shelf.test.tsx`  
Expected: PASS with accessible product action names and correct redirect URLs.

- [ ] **Step 6: Commit**

```bash
git add src/features/shelves src/features/public-profile src/app/'[creatorHandle]' tests/integration/public-shelves.test.ts tests/component/public-shelf.test.tsx
git commit -m "feat: add creator profiles and public shelves"
```

### Task 8: Implement sharing, dynamic channels, saves, and fan authentication

**Files:**
- Create: `src/features/engagement/repository.ts`
- Create: `src/features/engagement/actions.ts`
- Create: `src/features/engagement/share-dialog.tsx`
- Create: `src/features/engagement/fan-auth-dialog.tsx`
- Create: `src/features/engagement/save-button.tsx`
- Test: `tests/component/share-dialog.test.tsx`
- Test: `tests/integration/engagement.test.ts`

- [ ] **Step 1: Write the failing dynamic-channel test**

```tsx
// tests/component/share-dialog.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShareDialog } from "@/features/engagement/share-dialog";

describe("ShareDialog", () => {
  it("renders only enabled creator channels", () => {
    render(<ShareDialog open shelfId="shelf-photo" shortUrl="https://link.sh/s/demo" channels={[{ type: "X", enabled: true }, { type: "WHATSAPP", enabled: false }]} onClose={() => undefined} />);
    expect(screen.getByRole("button", { name: "Share on X" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Share on WhatsApp" })).toBeNull();
    expect(screen.getByText("80% fan / 20% creator")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run and verify RED**

Run: `pnpm test tests/component/share-dialog.test.tsx`  
Expected: FAIL because `ShareDialog` does not exist.

- [ ] **Step 3: Implement engagement persistence and resumable auth**

`createShare`, `toggleSave`, and `addComment` require typed sessions. Anonymous save/share-to-earn actions open `FanAuthDialog`; the Google development callback returns to the same URL with `resume=save` or `resume=share`. Closing the dialog removes only the pending action. Copy uses `navigator.clipboard` and displays a toast.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `pnpm test tests/component/share-dialog.test.tsx tests/integration/engagement.test.ts`  
Expected: PASS for enabled channels, share creation, save idempotency, and auth-resume behavior.

- [ ] **Step 5: Commit**

```bash
git add src/features/engagement tests/component/share-dialog.test.tsx tests/integration/engagement.test.ts
git commit -m "feat: add fan sharing and engagement flows"
```

### Task 9: Build Creator Studio shell, dashboard, and shelf management

**Files:**
- Create: `src/app/studio/layout.tsx`
- Create: `src/app/studio/dashboard/page.tsx`
- Create: `src/app/studio/shelves/page.tsx`
- Create: `src/features/studio/studio-shell.tsx`
- Create: `src/features/studio/dashboard-view.tsx`
- Create: `src/features/studio/shelf-management-view.tsx`
- Create: `src/features/shelves/actions.ts`
- Test: `tests/component/studio-navigation.test.tsx`
- Test: `tests/integration/shelf-management.test.ts`

- [ ] **Step 1: Write failing navigation and lifecycle tests**

The navigation test requires Dashboard, Shelves, Analytics, Comments, and Settings links and an active-state marker. The integration test requires draft filtering, case-insensitive search, publish transition, and soft deletion.

- [ ] **Step 2: Run and verify RED**

Run: `pnpm test tests/component/studio-navigation.test.tsx tests/integration/shelf-management.test.ts`  
Expected: FAIL because the shell and actions do not exist.

- [ ] **Step 3: Implement the protected shell and dashboard**

Guard the Studio layout with CREATOR role. Recreate `studio-dashboard` metrics and activity; connect Create New Shelf to `/studio/create`. Use the same seeded data as public pages so changes remain consistent.

- [ ] **Step 4: Implement the consolidated shelf manager**

Use the one-column design as the canonical list and the expanded design above 1440 CSS pixels. Search and All/Published/Drafts filters update query parameters. Edit, publish, and delete actions use server actions; deletion requires confirmation and sets `deleted_at`.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `pnpm test tests/component/studio-navigation.test.tsx tests/integration/shelf-management.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/studio src/features/studio src/features/shelves/actions.ts tests/component/studio-navigation.test.tsx tests/integration/shelf-management.test.ts
git commit -m "feat: add Creator Studio dashboard and shelves"
```

### Task 10: Implement Create/Edit Shelf and deterministic metadata extraction

**Files:**
- Create: `src/features/shelves/metadata-adapter.ts`
- Create: `src/features/studio/shelf-editor.tsx`
- Create: `src/features/studio/item-editor.tsx`
- Create: `src/features/studio/shelf-preview.tsx`
- Create: `src/app/studio/create/page.tsx`
- Create: `src/app/studio/shelves/[shelfId]/edit/page.tsx`
- Test: `tests/unit/metadata-adapter.test.ts`
- Test: `tests/component/shelf-editor.test.tsx`
- Test: `tests/integration/shelf-editor-actions.test.ts`

- [ ] **Step 1: Write failing metadata tests**

```ts
// tests/unit/metadata-adapter.test.ts
import { describe, expect, it } from "vitest";
import { extractMetadata } from "@/features/shelves/metadata-adapter";

describe("extractMetadata", () => {
  it("returns deterministic camera metadata for an Amazon camera URL", async () => {
    await expect(extractMetadata("https://www.amazon.com/dp/B0CAMERA"))
      .resolves.toMatchObject({ title: "Sony A7IV Mirrorless Camera", merchant: "Amazon", price: 2498 });
  });
});
```

- [ ] **Step 2: Run and verify RED**

Run: `pnpm test tests/unit/metadata-adapter.test.ts`  
Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the adapter and complete editor**

The adapter uses stable URL-pattern fixtures and rejects unsupported hosts. The editor implements every field shown in `studio-create-shelf`, product add/remove/reorder, editable metadata, hotspot coordinates, local media preview, theme selection, and mobile/tablet previews. Save Draft accepts incomplete product links; Publish requires title, slug, cover, and at least one valid product.

- [ ] **Step 4: Run all editor tests and verify GREEN**

Run: `pnpm test tests/unit/metadata-adapter.test.ts tests/component/shelf-editor.test.tsx tests/integration/shelf-editor-actions.test.ts`  
Expected: PASS for deterministic extraction, validation retention, ordering, draft save, and publish.

- [ ] **Step 5: Commit**

```bash
git add src/features/shelves src/features/studio src/app/studio/create src/app/studio/shelves/'[shelfId]' tests/unit/metadata-adapter.test.ts tests/component/shelf-editor.test.tsx tests/integration/shelf-editor-actions.test.ts
git commit -m "feat: add shelf creation and editing workflow"
```

### Task 11: Build Studio analytics, comments, and settings

**Files:**
- Create: `src/app/studio/analytics/page.tsx`
- Create: `src/app/studio/comments/page.tsx`
- Create: `src/app/studio/settings/page.tsx`
- Create: `src/features/studio/analytics-view.tsx`
- Create: `src/features/studio/comments-view.tsx`
- Create: `src/features/studio/settings-view.tsx`
- Create: `src/features/engagement/comment-actions.ts`
- Test: `tests/component/studio-tools.test.tsx`
- Test: `tests/integration/comment-actions.test.ts`

- [ ] **Step 1: Write failing interaction tests**

Require analytics 7D/30D/90D/Custom state, comment shelf/sort filters, reply persistence, comment soft deletion, profile saving, simulated tracking-ID saving, share-channel toggles, and a confirmed account-deletion action.

- [ ] **Step 2: Run and verify RED**

Run: `pnpm test tests/component/studio-tools.test.tsx tests/integration/comment-actions.test.ts`  
Expected: FAIL because these views/actions do not exist.

- [ ] **Step 3: Implement all three screens**

Match the supplied analytics, comments, and settings screenshots. Recharts renders the traffic donut with a text legend. Settings adds a Share Channels card using the same card style as Affiliate Configuration. Account deletion remains soft and logs the user out.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `pnpm test tests/component/studio-tools.test.tsx tests/integration/comment-actions.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/studio/analytics src/app/studio/comments src/app/studio/settings src/features/studio src/features/engagement/comment-actions.ts tests/component/studio-tools.test.tsx tests/integration/comment-actions.test.ts
git commit -m "feat: add Studio analytics comments and settings"
```

### Task 12: Build the Fan Hub and simulated wallet lifecycle

**Files:**
- Create: `src/app/hub/layout.tsx`
- Create: `src/app/hub/dashboard/page.tsx`
- Create: `src/features/hub/hub-shell.tsx`
- Create: `src/features/hub/hub-dashboard.tsx`
- Create: `src/features/wallet/repository.ts`
- Create: `src/features/wallet/actions.ts`
- Test: `tests/component/fan-hub.test.tsx`
- Test: `tests/integration/wallet.test.ts`

- [ ] **Step 1: Write failing wallet tests**

Test that blank fan tracking ID uses `linkshelf-platform-20`, a withdrawal cannot exceed cleared balance, a valid request creates `PENDING`, and CSV export contains date/source/type/amount headers.

- [ ] **Step 2: Run and verify RED**

Run: `pnpm test tests/integration/wallet.test.ts`  
Expected: FAIL because wallet actions do not exist.

- [ ] **Step 3: Implement the protected Hub and interactive dashboard**

Match `fan-dashboard`, keep Wallet/My Shares/Saved as client-side dashboard sections, persist simulated tracking ID, open a confirmed withdrawal dialog, render reward history, and generate CSV entirely from the user's ledger rows.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `pnpm test tests/component/fan-hub.test.tsx tests/integration/wallet.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/hub src/features/hub src/features/wallet tests/component/fan-hub.test.tsx tests/integration/wallet.test.ts
git commit -m "feat: add fan hub and simulated wallet"
```

### Task 13: Build Super Admin operations

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/dashboard/page.tsx`
- Create: `src/features/admin/admin-shell.tsx`
- Create: `src/features/admin/admin-dashboard.tsx`
- Create: `src/features/admin/actions.ts`
- Test: `tests/component/admin-dashboard.test.tsx`
- Test: `tests/integration/admin-actions.test.ts`

- [ ] **Step 1: Write failing admin tests**

Require ADMIN role, four ledger metrics, traffic split counts derived from click events, pending-withdrawal approval/rejection, creator filtering, threshold persistence, and report CSV export.

- [ ] **Step 2: Run and verify RED**

Run: `pnpm test tests/component/admin-dashboard.test.tsx tests/integration/admin-actions.test.ts`  
Expected: FAIL because admin views/actions do not exist.

- [ ] **Step 3: Implement the role-protected dashboard**

Match `super-admin`, calculate metrics from SQLite rather than hard-coded JSX, poll the newest click events every five seconds while visible, implement threshold controls, enforce legal withdrawal transitions, and export the displayed ledger as CSV.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `pnpm test tests/component/admin-dashboard.test.tsx tests/integration/admin-actions.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin src/features/admin tests/component/admin-dashboard.test.tsx tests/integration/admin-actions.test.ts
git commit -m "feat: add LinkShelf super admin operations"
```

### Task 14: Add end-to-end, accessibility, responsive, and design-QA gates

**Files:**
- Create: `tests/e2e/auth.spec.ts`
- Create: `tests/e2e/creator-flow.spec.ts`
- Create: `tests/e2e/fan-flow.spec.ts`
- Create: `tests/e2e/admin-flow.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/responsive.spec.ts`
- Create: `scripts/smoke-routes.mjs`
- Create: `design-qa.md`
- Modify: all route/components with P0/P1/P2 findings

- [ ] **Step 1: Write failing end-to-end journeys**

Cover development Google creator login; create/edit/publish/view shelf; fan auth/save/share/tracked click; admin auth/withdrawal approval; protected-route rejection; navigation at 390, 780, 1280, and 2560 widths; keyboard dialog behavior; and axe scans on every major route.

- [ ] **Step 2: Run and verify RED**

Run: `pnpm test:e2e`  
Expected: at least one failing journey or visual mismatch before the final fixes.

- [ ] **Step 3: Fix functional and accessibility failures**

Re-run individual specs after each fix. Do not relax assertions to hide product failures. Preserve focus order, labels, error messages, and mobile reachability.

- [ ] **Step 4: Capture and compare every Stitch-backed route**

Run the app, capture matching desktop/mobile viewports, and compare each implementation against its source screenshot. Record severity, evidence, and resolution in `design-qa.md`. Fix all P0/P1/P2 issues and repeat until the report ends with `final result: passed`; list any remaining P3 polish separately.

- [ ] **Step 5: Run the complete release gate**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
node scripts/smoke-routes.mjs
```

Expected: every command exits 0, every required route returns 200/expected redirect, and `design-qa.md` says `final result: passed`.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e scripts/smoke-routes.mjs design-qa.md src
git commit -m "test: verify complete LinkShelf MVP"
```

## Final acceptance checklist

- [ ] Every route in the approved specification is implemented and interactive.
- [ ] Login surfaces expose Google only.
- [ ] Creator, fan, and admin roles enforce access independently from login.
- [ ] SQLite data survives restart and seed is idempotent.
- [ ] Dynamic share channels and resumable fan auth work.
- [ ] The affiliate endpoint records the selection and returns a rewritten 302 destination.
- [ ] Simulated wallet and withdrawal states are visibly labeled and never move real money.
- [ ] All 15 Stitch references have a corresponding implementation state or documented responsive consolidation.
- [ ] Lint, typecheck, unit, integration, component, end-to-end, accessibility, production build, smoke, and design-QA gates pass.
