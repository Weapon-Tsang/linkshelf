# Amazon Integration Runbook

Last updated: 2026-07-15 Asia/Shanghai

## Status

Sprint 29 makes the Amazon boundary production-safe. It does not add live Amazon
catalog calls because the official Product Advertising API documentation now says
PA-API was deprecated on 2026-05-15 and points developers to Creators API. The
Creators API documentation and credentials were not available from this
workspace, so live request implementation remains blocked.

## Runtime Modes

Configure Amazon metadata behavior with `AMAZON_INTEGRATION_MODE`:

| Mode | Environment | Behavior |
| --- | --- | --- |
| `fixtures` | local/test only | Uses deterministic fixture metadata for known ASINs. |
| `disabled` | production default | Refuses metadata extraction instead of using fake catalog data. |
| `creators-api` | future production | Requires Creators API base URL and key, but live fetch is not implemented until official docs and credentials are available. |

`pa-api`, `paapi`, and `product-advertising-api` modes are rejected because
PA-API is deprecated.

## Environment Variables

| Variable | Required | Notes |
| --- | --- | --- |
| `AMAZON_INTEGRATION_MODE` | optional | Defaults to `fixtures` outside production and `disabled` in production. |
| `AMAZON_CREATORS_API_BASE_URL` | future | Required only for `creators-api`; must be HTTPS. |
| `AMAZON_CREATORS_API_KEY` | future secret | Required only for `creators-api`; never commit it. |
| `AMAZON_PARTNER_TAG` | future | Optional production partner tag for future provider calls. Redirects still use per-user/platform tags. |

## Current Verified Behavior

- `/api/out/[productId]` rewrites Amazon affiliate tags and records click events.
- Amazon destinations are allowlisted and unsafe hosts are rejected.
- Duplicate `tag` query parameters are removed before writing the selected tag.
- Creator/fan/platform affiliate selection is tested locally.
- Studio metadata extraction uses fixtures only outside production.
- Production metadata extraction is disabled by default.

## Affiliate Disclosure

Release copy and public surfaces that include Amazon affiliate links must include
a clear Affiliate Disclosure. Recommended baseline:

> As an Amazon Associate, LinkShelf and participating creators may earn from
> qualifying purchases.

Do not claim Amazon endorsement. Do not display live price or availability unless
the future live provider supplies current values under its terms.

## Live Verification

When Creators API documentation and credentials are available:

1. Confirm the official request, authentication, rate-limit, and response shape.
2. Add a live provider behind the existing `creators-api` mode.
3. Store `AMAZON_CREATORS_API_KEY` as a deployment secret.
4. Set `AMAZON_CREATORS_API_BASE_URL` to the official HTTPS endpoint.
5. Set `AMAZON_INTEGRATION_MODE=creators-api` only in a non-production preview
   first.
6. Verify metadata extraction for known ASINs.
7. Verify affiliate tag behavior still goes through `/api/out/[productId]`.
8. Confirm monitoring events do not include API keys, raw response bodies, or
   customer-identifying data.
9. Promote to production only after legal/compliance approval.

## Known Limits

- No live Amazon metadata provider exists in this commit.
- No payout reconciliation or commission reporting is implemented.
- Existing product prices in local fixtures are demo data, not live Amazon
  prices.
- Compliance review is documented here but not externally approved in this
  workspace.
