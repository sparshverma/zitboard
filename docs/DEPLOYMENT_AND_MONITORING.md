# Deployment and Monitoring Setup

## Deployment Plan

1. Deploy static site files to Vercel, Netlify, or Cloudflare Pages.
2. Configure environment variable `ZITBOARD_DEMO_ENDPOINT` in host platform.
3. Configure optional environment variable `ZITBOARD_ANALYTICS_ENDPOINT` for event ingestion.
4. Enable automatic deploys from the default branch.

## Included Security Configs

- `/_headers` for Netlify-compatible security header enforcement.
- `/vercel.json` for Vercel security header enforcement.

## Production Headers

- Enforce HTTPS and HSTS in host settings.
- Add `X-Content-Type-Options: nosniff`.
- Add `Referrer-Policy: strict-origin-when-cross-origin`.
- Add `X-Frame-Options: DENY`.

## Monitoring

- Client event telemetry stored in `window.dataLayer` and forwarded to analytics provider.
- Track events:
  - `cta_click`
  - `funnel_section_view`
  - `lead_form_submit`
  - `lead_form_error`
- Add uptime monitoring on homepage URL and form endpoint.

## Operations Checklist

- Validate form endpoint status before release.
- Validate `ZITBOARD_DEMO_ENDPOINT` is configured in production.
- Verify analytics ingestion in production.
- Confirm legal links and privacy policy availability.
- Review lighthouse scores and regressions after each deploy.
