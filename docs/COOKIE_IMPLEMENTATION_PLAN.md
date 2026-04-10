# ZitBoard Signup, Onboarding, and Cookie Recovery Plan

## Objective

Restore the public signup flow so a new user can create a session, reach onboarding, and keep the cookie implementation aligned with the live deployment.

## Current Findings

- The public signup page in [assets/js/auth.js](../assets/js/auth.js) hardcodes the target tenant to `app`.
- Live signup reaches [app.zitboard.dev/auth/callback](https://app.zitboard.dev/auth/callback), but the Supabase bridge currently fails in production.
- Direct calls to `/api/auth/dev-login` return JWTs, but the live response does not expose `Set-Cookie` headers, so the browser never persists the session.
- The onboarding gate in [Dashboard/apps/web/src/components/OnboardingGate.tsx](../../Dashboard/apps/web/src/components/OnboardingGate.tsx) sends missing or incomplete sessions back to `/onboarding`.
- A fresh tenant returns `not_started`, while the current `app` tenant is already `completed`, so a new signup into `app` does not naturally land in onboarding.

## Implementation Plan

### 1. Restore Session Issuance

- Verify the deployed auth service emits `dashboard_access_token` and `dashboard_refresh_token` cookies for login and signup responses.
- Confirm the rewrite from [ZitBoard/vercel.json](../vercel.json) preserves `Set-Cookie` headers end to end.
- Keep the session cookie contract explicit: `HttpOnly`, `Secure`, `Path=/`, and the correct cross-subdomain scope for the app/public site setup.
- Add a smoke test for the auth endpoints that checks both the JSON payload and the browser-visible cookie state.

Acceptance criteria:

- A successful login or dev-login creates a session visible to the browser.
- `/api/auth/me` succeeds without manually injecting a bearer token.
- Logout clears the session and forces the auth gate again.

### 2. Repair the Signup Bridge

- Reconfigure `supabase-login` so the production signup path can complete the backend bridge instead of aborting.
- If Supabase is not the long-term signup source, replace that bridge with a single direct auth/session issuance path.
- Keep [assets/js/auth.js](../assets/js/auth.js) from silently falling back to `/` when the bridge fails; surface a clear user-facing error instead.

Acceptance criteria:

- A new signup returns a usable session or a specific, actionable error.
- The callback page no longer hides bridge failures behind a generic redirect.

### 3. Fix the Onboarding Destination

- Stop routing public signups into the already-completed `app` tenant unless that is intentional.
- Either create a fresh tenant for first-time signups or reset onboarding state for the new-user path.
- Keep the current routing rule intact: completed tenants land on the dashboard, incomplete tenants land on onboarding.

Acceptance criteria:

- A fresh user reaches onboarding on the first successful signup.
- The existing `app` tenant still lands on the dashboard once onboarding is complete.

### 4. Complete the Cookie Implementation Plan

#### Already complete in source

- Consent banner loads on the public site and separates consent from the auth flow.
- Theme persistence stays in localStorage.
- Non-essential storage is gated behind consent.
- The backend defines session cookies and logout clearing logic.

#### Still incomplete in production or documentation

- Session cookie emission must be verified live.
- The public privacy and security copy still needs to describe the cookie classes clearly.
- The validation pass still needs to cover first visit, accept, reject, login, logout, and keyboard accessibility.

Acceptance criteria:

- No non-essential cookie or analytics script runs before consent.
- Session cookies are only present after a successful auth flow.
- The privacy/security pages match the actual cookie behavior.

## Cookie Plan Completion Status

### Verified complete

- Consent banner and preference storage are implemented.
- Theme preference remains in localStorage.
- Cookie/state separation between consent, preference, and auth is in place.

### Verified incomplete

- Live auth responses still do not persist a session cookie in the browser.
- The signup bridge still fails in production.
- Public signup still targets the already-completed `app` tenant.
- Privacy/security documentation still needs a final cookie audit pass.

## Done When

- A brand-new signup lands on onboarding instead of dropping back to auth.
- The browser carries the session cookie after login without manual intervention.
- The completed cookie plan is reflected in both the code path and the docs.
- Consent, preferences, and auth remain separated and reversible.
