# ZitBoard Cookie Implementation Plan

## Objective
Implement cookies in ZitBoard in a way that is secure, consent-aware, and minimally invasive to the current static site.

## Guiding Decisions
- Use server-set cookies for authentication only.
- Keep theme and similar UI state in localStorage unless the server must read it.
- Block analytics and any non-essential storage until explicit consent.
- Keep cookie scope narrow: host-only, Path=/, no Domain, Secure, SameSite=Lax, and HttpOnly for session cookies.

## Task Checklist

### 1. Secure Login Session Cookie
- [x] Define the auth/session contract for the ZitBoard callback flow.
- [x] Replace token-in-URL handoff in [assets/js/auth.js](../assets/js/auth.js) with a server-side callback that sets the session cookie.
- [x] Set the session cookie as HttpOnly, Secure, SameSite=Lax, Path=/, host-only, with short idle and absolute expiry.
- [x] Add logout handling that clears the cookie on the server and invalidates the session.
- [x] Remove any auth tokens from client-side storage and query strings.
- [ ] Regenerate the session on login and privilege changes.
- [ ] Add validation for expired or invalid sessions and redirect to login.

### 2. Cookie Consent Banner
- [x] Create a reusable consent banner component that loads on all public pages.
- [x] Ensure Accept and Reject are equally prominent.
- [x] Add a Customize option for analytics and other non-essential purposes.
- [x] Default all non-essential storage to off until consent is granted.
- [x] Persist the consent choice in a dedicated preference cookie or localStorage entry.
- [x] Add a visible control to reopen consent settings from the privacy page or footer.
- [x] Gate analytics scripts and events so they do not run before consent.
- [x] Add a copy block listing purposes and any third parties.

### 3. Preference Storage
- [x] Keep theme persistence in localStorage unless a backend requirement appears.
- [ ] If a server-visible preference is needed, use a small cookie with Max-Age, Secure, SameSite=Lax, Path=/, and no Domain.
- [x] Keep preference data separate from auth and consent data.
- [x] Verify the theme bootstrap still loads before paint.

### 4. Privacy and Policy Updates
- [ ] Add or update cookie wording in privacy and security pages.
- [ ] Document which cookies are strictly necessary, optional, or preference-only.
- [ ] Add an explanation of how to withdraw consent and delete non-essential cookies.
- [ ] Ensure the footer or privacy page links to the cookie notice or settings entry point.

### 5. Validation
- [ ] Verify first visit does not set non-essential cookies before consent.
- [ ] Verify login sets only the intended session cookie.
- [ ] Verify logout clears the session cookie and access state.
- [ ] Verify the reject-consent path keeps analytics disabled.
- [ ] Verify the accept-consent path enables only the approved categories.
- [ ] Check mobile behavior, keyboard support, and focus order for the banner.
- [ ] Confirm no sensitive value is readable by document.cookie or localStorage.
- [ ] Run an accessibility and performance pass after integration.

## Done When
- Session auth is cookie-based and server-managed.
- Consent is explicit, granular, and reversible.
- Preferences remain lightweight and non-invasive.
- No non-essential cookie or script loads before consent.
- The site still works cleanly across the existing public pages.