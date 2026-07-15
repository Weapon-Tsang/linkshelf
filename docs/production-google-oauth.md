# Production Google OAuth Runbook

Last updated: 2026-07-15 Asia/Shanghai

## Status

Sprint 25 hardens the production Google-only OAuth path. The code now resolves
production Auth.js JWT cookies on protected App Router surfaces through the same
server auth helper used by Studio, Fan Hub, Super Admin, and authenticated public
resume flows.

Live Google credentials and a deployed HTTPS callback URL were not available in
this workspace, so real Google account consent was not exercised. The remaining
live verification step is blocked on credentials plus a deployed origin.

## Required Environment

Production requires:

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | Must be `production` in production. |
| `AUTH_SECRET` | yes | At least 32 bytes of non-whitespace. Used for Auth.js JWTs and signed app challenges. |
| `NEXTAUTH_URL` | yes | HTTPS origin for the deployed app, such as `https://linkshelf.example.com`. |
| `AUTH_GOOGLE_ID` | yes | Google OAuth web client ID. |
| `AUTH_GOOGLE_SECRET` | yes | Google OAuth web client secret. |
| `LINKSHELF_DB_PATH` | temporary | Local SQLite path until Sprint 26 selects production persistence. |

If any Google credential or `AUTH_SECRET` is missing, the Google provider is
disabled and production `/api/auth/google` returns `503 Google authentication is
not configured`.

## Google Cloud Setup

1. Create or select a Google Cloud project.
2. Configure the OAuth consent screen for the production application.
3. Create an OAuth Client ID with application type `Web application`.
4. Add the deployed origin under Authorized JavaScript origins:
   - `<NEXTAUTH_URL>`
5. Add this Authorized redirect URI:
   - `<NEXTAUTH_URL>/api/auth/callback/google`
6. Store the client ID in `AUTH_GOOGLE_ID`.
7. Store the client secret in `AUTH_GOOGLE_SECRET`.
8. Store a strong shared secret in `AUTH_SECRET`.

For local HTTPS-style verification, use the same callback shape with the local
origin used by the test or tunnel.

## User Provisioning

Production login maps Google accounts by immutable Google subject, not by email.
The local user row must exist before the first production login.

Provisioning fields:

- `users.google_subject`: Google `sub` claim for the account.
- `users.email`: display/contact email.
- `users.role`: one of `CREATOR`, `FAN`, or `ADMIN`.
- `users.deleted_at`: must be `NULL`.

Example SQL shape:

```sql
UPDATE users
SET google_subject = 'google-subject-from-verified-account',
    email = 'person@example.com',
    role = 'CREATOR',
    deleted_at = NULL
WHERE id = 'user-creator';
```

Admin access requires `role = 'ADMIN'`. A verified Google email address alone
does not grant admin access.

## Access Policy

- `/studio/*` requires role `CREATOR`.
- `/hub/*` requires role `FAN`.
- `/admin/*` requires role `ADMIN`.
- `/admin-secret` is a public Google-only entry surface, not an authorization grant.
- Authenticated users with the wrong role are sent to `/forbidden`.
- Anonymous Studio/Fan users are sent to `/login` with a safe `returnTo`.
- Anonymous Admin users are sent to `/admin-secret?returnTo=/admin/dashboard`.

## Verification

Automated verification added in Sprint 25 covers:

- Complete production config enables the Google provider.
- Missing or partial Google config disables the provider.
- Weak `AUTH_SECRET` is rejected.
- Google sign-in accepts only verified exact subject matches.
- Auth.js JWT cookies resolve to the current local user and role.
- Server component headers resolve production Auth.js cookies for Studio, Fan
  Hub, and Super Admin surfaces.

Manual live verification, once credentials and a deployed origin exist:

1. Set the required production environment variables.
2. Confirm Google Cloud has `<NEXTAUTH_URL>/api/auth/callback/google`.
3. Visit `/login?returnTo=/studio/dashboard`.
4. Continue with a provisioned creator Google account.
5. Confirm redirect to `/studio/dashboard`.
6. Sign out and repeat for `/hub/dashboard` with a fan account.
7. Visit `/admin-secret?returnTo=/admin/dashboard`.
8. Continue with a provisioned admin Google account.
9. Confirm redirect to `/admin/dashboard`.
10. Repeat admin entry with a non-admin provisioned account and confirm
    `/forbidden`.

## Handoff Notes

Sprint 25 does not solve production persistence. Until Sprint 26, provisioning
and session rehydration still depend on the configured SQLite database path.
