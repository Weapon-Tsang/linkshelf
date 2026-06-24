# LinkShelf MVP Design Specification

**Date:** 2026-06-24  
**Status:** Approved in visual review  
**Product source:** `shelf 页面逻辑.pages`  
**Visual source:** Stitch project `3930948600246186312`, with 15 exported screens catalogued in `design/stitch/screens/manifest.json`

## 1. Goal

Build a complete, locally runnable LinkShelf MVP that faithfully implements the supplied Stitch screens as one coherent application. The MVP includes public creator and shelf experiences, Creator Studio, Fan Hub, Super Admin, Google-only authentication, persistent local data, and a tested 80/20 affiliate redirect service.

The architecture must be shaped for production while remaining runnable without cloud credentials. External providers are accessed through replaceable adapters so a future deployment can add real Google OAuth credentials, PostgreSQL, Amazon affiliate integrations, object storage, and payouts without rebuilding the UI or domain rules.

## 2. Scope and explicit non-goals

### In scope

- All routes and screens described in this specification.
- Faithful responsive implementation of the 15 Stitch references.
- Google-only login UI and authentication boundary.
- A development Google-session adapter so the complete product can run without credentials.
- Persistent local relational data.
- Creator, fan, and admin authorization guards.
- Shelf creation, editing, publishing, filtering, comments, saves, shares, and analytics interactions.
- Simulated Amazon affiliate IDs and earnings.
- Real server-side 80/20 selection, Amazon tag rewriting, click-event persistence, and HTTP 302 redirects.
- Dynamic share-channel rendering based on creator configuration.
- Automated unit, integration, component, end-to-end, accessibility, and visual checks.

### Not in scope for this milestone

- Real money movement or payout processing.
- Real Amazon Product Advertising API calls or commission reconciliation.
- Production Google OAuth credentials supplied by the user.
- Email/password authentication.
- Administrator password or 2FA authentication; Google login plus the ADMIN role replaces it for this milestone.
- Production object storage, PostgreSQL hosting, monitoring, or deployment.
- Real AI inference for product metadata. The MVP uses a deterministic metadata simulator behind an adapter.

## 3. Technical shape

The application is a single Next.js App Router project written in TypeScript. Public pages, authenticated dashboards, server actions, and route handlers share typed domain services. Styling follows the exported Stitch code and screenshots, with reusable design tokens for teal, ink, neutral surfaces, typography, radii, shadows, and spacing.

The application is divided into five boundaries:

1. **Presentation:** route pages, layouts, responsive components, dialogs, charts, forms, tables, animation, and accessibility behavior.
2. **Application services:** use cases such as create shelf, publish shelf, save item, share shelf, approve withdrawal, and resolve affiliate redirect.
3. **Domain rules:** roles, shelf status, share attribution, 80/20 selection, simulated affiliate IDs, wallet state, and withdrawal transitions.
4. **Repositories:** typed persistence interfaces implemented by the local SQLite adapter.
5. **Provider adapters:** Google authentication, metadata extraction, media storage, Amazon link handling, and payouts.

No page reads the database directly. Pages call application services or server endpoints, allowing the local providers to be replaced later.

## 4. Routes and Stitch mapping

| Route or state | Stitch reference | Required behavior |
| --- | --- | --- |
| `/` | `landing-page` | Premium landing page, navigation, animated hero, feature rows, creator carousel, CTA routing to Google login, reduced-motion support. |
| `/login` | `creator-login` | Google-only creator login; returns authenticated users to their requested route or `/studio/dashboard`. |
| `/admin-secret` | `admin-login` | Google-only admin login using the secure visual treatment; successful sessions still require the ADMIN role. |
| `/[creatorHandle]` | `creator-profile` | Creator cover, profile, social links, shelves, featured gear, save action, and share entry point. |
| `/[creatorHandle]/[shelfId]` | `share-modal` as the mobile shelf reference | Responsive product story, hotspots, product cards, purchase actions, save/share controls, and creator attribution. |
| Share overlay | `share-modal` visual language | Copy short link, render configured channels, show 80/20 commission split, and trigger fan auth when share-to-earn needs identity. |
| Fan auth overlay | `fan-auth-overlay` | In-place Google-only dialog for save, share-to-earn, and withdrawal actions; focus trap and return-to-action behavior. |
| `/studio/dashboard` | `studio-dashboard` | Metric cards, recent activity, create-shelf CTA, and shared Studio navigation. |
| `/studio/shelves` | `studio-management-one-column` and `studio-management-expanded` | One route with responsive management states, search, status filter, edit, publish, and soft-delete actions. |
| `/studio/create` and `/studio/shelves/[shelfId]/edit` | `studio-create-shelf` | Shelf details, deterministic metadata extraction, upload/preview, detected-item editing and ordering, theme preview, draft and publish actions. |
| `/studio/analytics` | `studio-analytics` | Date-range controls, metric summaries, shelf performance, and traffic-source visualization. |
| `/studio/comments` | `studio-comments` | Shelf and sort filters, reply, locate, moderation, soft deletion, and pagination. |
| `/studio/settings` | `studio-settings` | Creator profile, simulated Amazon ID, Google account state, share-channel preferences, and destructive-action confirmation. |
| `/hub/dashboard` | `fan-dashboard` | Simulated affiliate ID, wallet, withdrawal simulation, rewards history, shares, saves, and CSV export. |
| `/admin/dashboard` | `super-admin` | Revenue ledger, 80/20 monitor, thresholds, withdrawal approval pool, creator directory, and report export. |

Static Next.js routes take precedence over the public dynamic creator route. Unknown handles and shelf IDs render typed not-found states.

## 5. Shared component system

### Public components

- `BrandMark` and `PublicNav`
- `LandingHero`, feature cards, creator carousel, and final CTA
- `CreatorHeader`, social pills, shelf cards, featured-product rows
- `ShelfHero`, product hotspots, product cards, and merchant actions
- `ShareDialog` and `FanAuthDialog`
- `SiteFooter`

### Authenticated shells

- `StudioShell` with shared sidebar, mobile navigation, active-route treatment, and user summary
- `FanHubShell`
- `AdminShell`
- `RoleGuard` and authenticated-route loading/error states

### Reusable application components

- Metric cards, data tables, status pills, date-range control, filters, pagination, chart wrappers, empty states, confirmations, toasts, form fields, file preview, and responsive dialogs
- Material-symbol-compatible icons matching the Stitch references; no emoji or improvised CSS icons
- Motion primitives that respect `prefers-reduced-motion`

The two supplied shelf-management designs are not separate pages. The one-column design is the standard content model; the expanded design is the wide-screen presentation state.

## 6. Data model

### Identity and profiles

- `User`: ID, Google subject, email, display name, avatar, role, created and updated timestamps.
- `CreatorProfile`: user ID, unique handle, bio, cover and avatar assets, simulated Amazon tracking ID, and profile settings.

### Content

- `Shelf`: ID, creator ID, slug, title, description, category, status, theme, source-content URL, cover asset, timestamps, and soft-delete timestamp.
- `Product`: ID, shelf ID, title, description, price, currency, merchant, destination URL, image asset, sort position, and optional hotspot coordinates.
- `SocialChannel`: creator ID, channel type, handle or URL, enabled flag, and sort position.

### Engagement and attribution

- `Save`: user ID, target type, target ID, and timestamp.
- `Comment`: shelf ID, user ID, optional parent ID, body, status, timestamps, and soft-delete timestamp.
- `Share`: ID, shelf ID, fan user ID, short code, selected channel, and timestamp.
- `ClickEvent`: product ID, shelf ID, optional share ID, selected beneficiary, selected affiliate tag, destination URL, fallback reason, and timestamp.

### Simulated finance

- `WalletEntry`: user ID, optional click-event ID, amount, type, status, and timestamp.
- `Withdrawal`: user ID, amount, destination label, status, reviewer ID, and timestamps.

Seed data mirrors the people, shelves, products, balances, and activity visible in the Stitch screens so the initial experience is visually complete.

## 7. Authentication and authorization

All visible authentication entry points use Google only. There are no email, password, GitHub, X, or 2FA form paths in the MVP.

The authentication adapter supports two modes:

- **Development mode:** the Google button creates a deterministic local Google-shaped session. The seed identity selected by the entry route determines creator, fan, or admin access.
- **Production-ready mode:** when Google client credentials and an authentication secret are present, the adapter uses real Google OAuth and maps the Google subject to a local user.

Authorization is independent of login. Studio requires CREATOR, Fan Hub requires FAN or CREATOR, and Super Admin requires ADMIN. Authenticated users without the required role receive a neutral 403 screen. Anonymous users are sent to Google login with a safe return URL.

## 8. Shelf creation and metadata simulation

The Create Shelf screen is a real multi-section form rather than a static reference:

1. The creator enters shelf identity, category, description, source URL, and cover media.
2. The metadata adapter accepts Amazon-style product URLs and returns deterministic fixture metadata based on URL characteristics.
3. The creator edits titles, descriptions, prices, merchant links, images, ordering, and optional hotspot positions.
4. The selected theme updates the mobile and tablet preview.
5. Save Draft persists without public visibility. Publish validates the required fields and makes the shelf public.

Media uses a local development adapter. The persisted record stores an application asset path, keeping future object-storage migration isolated.

## 9. Share and fan-auth flow

The share dialog receives the current shelf and creator settings. Only enabled social channels are rendered. Copy Link creates or reuses a short `Share` record. Share to Earn requires a fan session; if absent, `FanAuthDialog` appears without leaving the shelf. After successful development Google login, the original share action resumes.

Save and withdrawal actions use the same return-to-action behavior. Closing the auth dialog cancels only the pending action and does not navigate away.

## 10. Affiliate redirect algorithm

Product purchase actions point to a server route containing the product ID and optional share code. The route performs the following steps:

1. Load the product, shelf, creator, and optional share record.
2. Validate the destination against the allowed Amazon host set.
3. Ask an injectable random source for a value in `[0, 1)`.
4. If the value is below `0.8`, select the fan tracking ID from the valid share record. If the fan ID is blank or no valid share exists, select the simulated platform ID.
5. Otherwise select the creator tracking ID. If it is blank, select the simulated platform ID.
6. Replace any existing `tag` query parameter while preserving the rest of the destination URL.
7. Persist the click event and selection details.
8. Return HTTP 302 with the rewritten URL.

Initial simulated tags are `linkshelf-platform-20`, `liamcreator-20`, and `fan-demo-20`. They are fixtures, not real affiliate identities.

The route targets local p95 processing below 100 ms. Randomness is injected so boundary behavior and the statistical selection can be tested deterministically.

## 11. Error handling and graceful degradation

- Invalid creator, shelf, product, or share identifiers return typed 404 states.
- Invalid or disallowed redirect destinations do not redirect and return a safe error response.
- A missing fan or creator tracking ID falls back to the platform fixture ID and records the reason.
- A failed click-event transaction prevents an untracked redirect and returns a retryable service response.
- Auth failures preserve the intended safe return URL and show a branded retry state.
- Form validation is inline; failed submissions retain entered values and also show a concise toast.
- Shelf and comment deletion is soft and requires confirmation.
- Simulated withdrawals use explicit pending, approved, and rejected transitions; they never move real money.
- Empty, loading, error, and unauthorized states match the shared visual system.

## 12. Accessibility and responsive behavior

- Semantic headings, landmarks, labels, tables, and buttons.
- Keyboard-complete navigation and visible focus states.
- Dialog focus trapping, Escape handling, and focus restoration.
- Minimum touch-target sizing and responsive navigation below the desktop breakpoint.
- Meaningful alternative text for content imagery; decorative imagery is ignored by assistive technology.
- Charts include text summaries or tabular equivalents.
- Motion and continuously scrolling content pause on hover/focus and respect reduced-motion preferences.

Desktop screens use the supplied Stitch geometry as the primary reference. Mobile layouts stack content, convert sidebars to drawers or compact navigation, keep tables horizontally safe, and use the supplied 780-pixel share screen as the detailed mobile shelf reference.

## 13. Verification strategy

### Unit tests

- 80/20 selection boundaries and statistical sanity using injected randomness.
- Amazon tag replacement, query preservation, allowlisted hosts, and invalid URLs.
- Role guards, return-URL safety, validation, wallet transitions, and soft deletion.

### Integration tests

- SQLite repository behavior and seed idempotency.
- Shelf draft/publish lifecycle.
- Comment, save, share, click-event, wallet, and withdrawal persistence.
- Redirect response status, `Location` header, fallback selection, and transaction failure.

### Component tests

- Google-only auth screens and Fan Auth dialog.
- Share-channel rendering and copy behavior.
- Create Shelf validation, item editing, ordering, preview, save, and publish.
- Filters, date ranges, tables, pagination, confirmations, and navigation.

### End-to-end tests

- Development Google login into Creator Studio.
- Create, edit, publish, and view a shelf.
- Fan login, save, share, tracked product click, and wallet display.
- Admin login, protected-route enforcement, withdrawal approval, and report export.

### Visual and delivery gates

- Capture desktop and mobile screenshots for every implemented route.
- Compare the matching state against the exported Stitch references.
- Fix all P0, P1, and P2 design-QA findings before handoff.
- Completion requires clean formatting, lint, type checking, automated tests, production build, route smoke tests, and a `design-qa.md` report whose final result is `passed`.

## 14. Acceptance criteria

The milestone is accepted when:

1. Every route in Section 4 renders and its visible controls perform the described interaction.
2. Login surfaces contain Google only and development login enables all role-specific flows.
3. All application data survives a local server restart.
4. The 80/20 endpoint rewrites simulated tags, records the selection, and returns a valid 302 response.
5. Creator-configured share channels determine the share dialog contents.
6. The application works at desktop and mobile widths without clipped primary content or inaccessible controls.
7. The automated and visual verification gates in Section 13 pass.
8. No page depends directly on a cloud service or hard-coded production credential.

