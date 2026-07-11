# LinkShelf Roadmap

Last updated: 2026-07-11 Asia/Shanghai

## Release Strategy

LinkShelf is in Feature Freeze. The release path now prioritizes production
engineering over new product functionality.

Sprint sequence:

1. Sprint 24: Production Readiness Baseline.
2. Sprint 25: Production Google OAuth.
3. Sprint 26: Persistent Database.
4. Sprint 27: Deployment.
5. Sprint 28: Monitoring.
6. Sprint 29: Amazon Integration.
7. Sprint 30: Release Candidate, Visual QA, and final performance/release pass.

Do not start a later sprint until the current sprint is complete and the user has
confirmed the next sprint goal.

## Sprint 24: Production Readiness Baseline

Goal:

- Establish the production readiness baseline and release roadmap without
  implementing production systems.

Definition of Done:

- `PROJECT_STATE.md` exists and reflects current project state.
- `docs/project-status.md` documents health, blockers, risks, audits, backlog,
  and Production Ready Definition of Done.
- `docs/roadmap.md` defines the ordered production sprints.
- `HANDOFF.md` and `NEXT_SESSION_PROMPT.md` are current.
- Visual QA remaining work is explicitly deferred to Release Candidate unless it
  blocks production confidence.
- No product features are added.

Status:

- Complete.

## Sprint 25: Production Google OAuth

Goal:

- Make Google-only production authentication real, documented, and verified.

Scope:

- Define required OAuth/environment variables.
- Document Google Cloud OAuth setup and callback URLs.
- Verify NextAuth production sign-in/sign-out behavior on HTTPS-like config.
- Define local user provisioning for Google subject mapping.
- Harden admin auth policy and production-denied states.

Out of scope:

- Non-Google providers.
- Database provider migration unless required for auth verification.
- Deployment rollout beyond local/preview proof needed for OAuth.

Definition of Done:

- Production OAuth env contract exists.
- Auth tests cover configured, missing, and invalid credential states.
- Admin/creator/fan access rules are documented and tested.
- Handoff clearly states whether a real deployed callback was verified or what
  remains blocked by credentials.

## Sprint 26: Persistent Database

Goal:

- Replace local-demo persistence assumptions with an explicit production database
  plan and implementation.

Scope:

- Select the production persistence strategy.
- Define migration and backup/restore flow.
- Prevent production seed overwrite.
- Document local/preview/prod data separation.
- Verify auth, affiliate redirects, Studio, Fan Hub, and Admin flows against the
  selected persistent store.

Out of scope:

- Deployment platform finalization unless needed to prove persistence.
- Monitoring.
- Amazon live API integration.

Definition of Done:

- Production DB provider/path is documented.
- Migrations are reproducible.
- Data survives deploy/restart assumptions for the selected platform.
- Seed behavior is safe for production.
- Tests cover the selected production DB boundaries.

## Sprint 27: Deployment

Goal:

- Make LinkShelf deployable and operable from Git.

Scope:

- Select deployment platform.
- Add deployment descriptor or documented platform setup.
- Define preview/staging/production environment model.
- Document build/start/runtime commands.
- Prove runtime compatibility with auth and DB decisions.
- Add rollback and release checklist.

Out of scope:

- Monitoring beyond minimal health proof.
- Amazon live API integration.
- Visual polish.

Definition of Done:

- A production-like deployment can be created from the branch.
- Required env vars are documented for the selected platform.
- Build/start behavior is verified.
- Rollback path is documented.
- Handoff includes preview/production URLs if available.

## Sprint 28: Monitoring

Goal:

- Establish the minimum observability baseline for release.

Scope:

- Error reporting.
- Key request/path logging or tracing.
- Health check or uptime monitor.
- Alerts or documented manual checks.
- Monitoring coverage for auth, affiliate redirects, and deployment health.

Out of scope:

- Product analytics redesign.
- Affiliate payout reporting.
- Visual QA polish.

Definition of Done:

- Production errors are visible.
- Critical flows have observable signals.
- Incident triage steps are documented.
- Privacy and telemetry boundaries are documented.

## Sprint 29: Amazon Integration

Goal:

- Productionize Amazon affiliate integration.

Scope:

- Define Amazon API credentials and environment contract.
- Replace local metadata fixtures where appropriate.
- Verify Amazon tag rewriting and destination safety with production config.
- Add compliance notes for disclosures, attribution, and affiliate tag usage.
- Define reporting/reconciliation boundaries for click and reward data.

Out of scope:

- New marketplace support beyond Amazon.
- Major product UX additions.
- Release Candidate visual polish.

Definition of Done:

- Real Amazon configuration is documented.
- Integration tests cover success and failure boundaries.
- Compliance notes are committed.
- Affiliate redirect and reporting assumptions are production-ready.

## Sprint 30: Release Candidate

Goal:

- Validate the whole app as a release candidate.

Scope:

- Full verification suite.
- Fresh 15-screen Visual QA capture.
- Focused visual fixes only for release-critical drift.
- Performance and accessibility pass.
- Release notes and final handoff.

Definition of Done:

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`
  pass or have documented release-blocking exceptions.
- Visual QA evidence is fresh and reviewed.
- Production Ready Definition of Done is satisfied.
- Release Manager recommendation is documented.
