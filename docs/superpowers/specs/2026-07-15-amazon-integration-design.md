# Sprint 29 Amazon Integration Design

Last updated: 2026-07-15 Asia/Shanghai

## Goal

Productionize LinkShelf's Amazon affiliate boundary without pretending to have a
live Amazon catalog integration that cannot be verified in this workspace.

## Current External API Reality

Amazon's Product Advertising API documentation now says PA-API was deprecated on
2026-05-15 and points developers to Creators API. The PA-API documentation also
states that Product Advertising API requests use JSON POST payloads, mandatory
Amazon headers, `x-amz-target`, and AWS Signature Version 4 signing. Because the
official PA-API page is marked outdated and Creators API documentation could not
be read from this workspace, Sprint 29 must not add a PA-API live client or claim
live Amazon verification.

## Existing Local State

The app already has:

- Amazon URL allowlisting and affiliate tag rewriting in
  `src/features/affiliate/rewrite-amazon-tag.ts`.
- Affiliate redirect click recording in `/api/out/[productId]`.
- Deterministic Amazon metadata fixtures in
  `src/features/shelves/metadata-adapter.ts`.
- Monitoring events for affiliate redirects from Sprint 28.

## Approaches Considered

1. **Implement live PA-API 5.0 client**
   - Rejected because PA-API is officially deprecated after 2026-05-15.

2. **Implement live Creators API client**
   - Rejected for this sprint because official Creators API docs and credentials
     are unavailable in this workspace.

3. **Harden Amazon provider boundary and production fallback**
   - Chosen. This gives LinkShelf a production-safe integration contract, blocks
     deprecated PA-API usage, documents the migration path, and keeps local
     metadata extraction deterministic until live Creators API access exists.

## Architecture

Create `src/features/amazon/config.ts` to resolve environment state:

- `AMAZON_INTEGRATION_MODE`: `fixtures`, `disabled`, or `creators-api`.
- `AMAZON_CREATORS_API_BASE_URL`.
- `AMAZON_CREATORS_API_KEY`.
- `AMAZON_PARTNER_TAG`.

Rules:

- `production` defaults to `disabled`.
- non-production defaults to `fixtures`.
- `fixtures` uses local deterministic metadata only.
- `disabled` refuses metadata lookup with a clear production-safe error.
- `creators-api` requires an HTTPS base URL and API key, but live fetch remains
  out of scope until official Creators API request/response docs and credentials
  are available.
- Any attempt to configure `pa-api` is rejected with a deprecation error.

Create `src/features/amazon/metadata-provider.ts` to own Amazon URL parsing and
fixture extraction. `src/features/shelves/metadata-adapter.ts` will delegate to
this provider.

## Compliance Boundary

Add `docs/amazon-integration.md` documenting:

- PA-API deprecation and why it is blocked.
- Creators API migration requirements.
- Required future environment variables.
- Affiliate tag rewriting and disclosure requirements.
- Allowed hosts and destination safety.
- Live verification checklist once credentials/docs are available.

## Tests

Automated coverage will assert:

- Config defaults to fixtures outside production and disabled in production.
- `pa-api` mode is rejected with a deprecation message.
- `creators-api` requires HTTPS base URL and API key.
- Metadata extraction uses fixtures in fixture mode.
- Metadata extraction is disabled in production by default.
- Existing Amazon URL/tag rewriting remains safe.
- Docs mention PA-API deprecation, Creators API migration, env vars,
  disclosures, and live verification limitations.

## Scope

In scope:

- Amazon integration configuration boundary.
- PA-API deprecation guard.
- Fixture metadata provider behind a clearer provider abstraction.
- Amazon integration/compliance runbook.
- Project status and handoff updates.

Out of scope:

- Live Creators API request implementation.
- PA-API implementation.
- Amazon account setup, API credentials, or live calls.
- Payout reconciliation.
- New product UX or visual polish.

## Self-Review

- No placeholders remain.
- The design follows current official PA-API deprecation information.
- The sprint remains useful without external credentials.
- The implementation preserves existing local metadata behavior while making
  production behavior explicit and safer.
