# Sprint 28 Monitoring Design

Last updated: 2026-07-15 Asia/Shanghai

## Goal

Establish the minimum observability baseline needed before release: production
errors and critical flows must leave structured, privacy-safe signals that an
operator can collect from container stdout and act on with a documented manual
incident process.

## Context

Sprint 27 added `/api/health`, Docker, Compose, and a deployment runbook. The
project does not have Sentry, OpenTelemetry, an external log drain, or hosting
credentials in this workspace. Adding a third-party monitoring product now would
create account and secret requirements that cannot be verified locally.

## Approaches Considered

1. **Add Sentry or another hosted error tracker**
   - Benefit: real error grouping and alerts.
   - Cost: requires account setup, DSN secrets, network verification, and privacy
     review outside this workspace.

2. **Add OpenTelemetry instrumentation**
   - Benefit: standard traces and metrics.
   - Cost: needs collector/exporter decisions and deployment plumbing not yet
     present.

3. **Add structured stdout events and runbook**
   - Benefit: deployable immediately on any container host, testable in this
     repo, and compatible with future log drains or hosted monitoring.
   - Cost: manual alerting until a later host-specific integration is selected.

Chosen approach: structured stdout events plus runbook. It gives release
operators observable signals without introducing unverifiable external systems.

## Architecture

Create a small monitoring module that records operational events as one-line JSON
objects. Each event includes:

- `type: "linkshelf.operational_event"`
- ISO `timestamp`
- `level`: `info`, `warn`, or `error`
- `name`: stable event name
- `outcome`: stable outcome string
- optional `requestId`
- optional shallow `metadata`

The default sink is `console.info`, `console.warn`, or `console.error`. Events
emit in production by default and can be enabled in non-production with
`LINKSHELF_MONITORING_STDOUT=1` for smoke tests.

## Critical Flow Coverage

Instrument these paths:

- `/api/health`: emit `health.check` with `ok` or `error`.
- `/api/auth/google`: emit auth events for cross-origin rejection, invalid form,
  missing production Google config, production Google redirect, invalid
  development role, failed admin entry, missing development identity, and
  successful development login.
- Auth.js production callbacks: emit `auth.google.sign_in` accepted/rejected
  events when Google sign-in maps or fails to map a local user.
- `/api/out/[productId]`: emit `affiliate.redirect` events for redirect success,
  product not found, invalid destination, and click-record failure.

These events are enough for release operators to see deployment health, auth
denials/config failures, and affiliate redirect failures.

## Privacy And Safety

Events must not include:

- OAuth tokens, cookies, secrets, authorization headers, raw Google subjects, or
  email addresses.
- Raw query strings that may include share codes or resume parameters.
- Full exception messages from configuration or filesystem errors.

The monitoring module will redact metadata keys that look secret-bearing and
drop `undefined` metadata values. Route instrumentation will pass stable reasons,
HTTP statuses, product IDs, roles, and coarse environment labels only.

## Documentation

Add `docs/monitoring.md` with:

- Event schema and example log lines.
- Critical event names and expected outcomes.
- Container stdout collection guidance.
- Manual checks for health, auth, affiliate redirects, and deployment.
- Suggested alert thresholds for release operations.
- Incident triage steps.
- Privacy boundaries and future integration notes.

Update `.env.example` with `LINKSHELF_MONITORING_STDOUT=`.

## Tests

Automated coverage will assert:

- The monitoring module emits JSON only when production or explicitly enabled.
- Secret-like metadata keys are redacted.
- Health route emits success and failure events.
- Affiliate redirect route emits success and failure events.
- Google auth route emits failure/configuration/success events.
- Production Auth.js sign-in emits accepted and rejected mapping events.
- `docs/monitoring.md` documents event names, alert/manual-check behavior, and
  privacy boundaries.

## Scope

In scope:

- Structured stdout operational events.
- Instrumenting health, auth, and affiliate redirect paths.
- Monitoring runbook and environment examples.
- Automated tests for event shape and critical flow coverage.

Out of scope:

- Hosted monitoring provider setup.
- Alert delivery integrations such as email, Slack, PagerDuty, or webhooks.
- Product analytics redesign.
- Affiliate payout reporting.
- Visual polish.

## Self-Review

- No placeholders remain.
- The design satisfies Sprint 28 without requiring external credentials.
- The approach is compatible with Docker/Compose from Sprint 27.
- Privacy boundaries are explicit and testable.
