# store/ — Chrome Web Store launch kit

Everything needed to publish and market Inner Peace. Generated and written for the
1.2.0 launch.

## Files
- `LISTING.md` — all Store-listing + Privacy tab copy (name, descriptions,
  permission justifications, data disclosures). Paste into the dashboard.
- `PRIVACY.md` — privacy policy. Host it (GitHub Pages or a Gist) and use the URL
  in the listing.
- `MARKETING.md` — launch-day plan and ready-to-post copy (Product Hunt, Show HN,
  Reddit, X, LinkedIn, Substack).
- `package.ps1` — builds the upload ZIP from a runtime allowlist (no dev/test/store
  files). Output: `store/inner-peace-v<version>.zip` (git-ignored).
- `screenshots/` — five 1280×800 store screenshots, captured from the real UI.
- `promo/` — `promo-small-440x280.png` (required) and `promo-marquee-1400x560.png`
  (optional, needed for featuring).
- `_gen/generate.js` — regenerates the screenshots and promo art with Playwright.

## Quickstart
1. `powershell -ExecutionPolicy Bypass -File store\package.ps1`
2. Register + open the dashboard: https://chrome.google.com/webstore/devconsole
3. Add new item → upload the ZIP → fill the listing from `LISTING.md` → upload the
   images from `screenshots/` and `promo/` → submit for review.

## Regenerate images
`node store/_gen/generate.js` (needs the dev deps; Playwright Chromium is already
installed for the e2e tests).
