# Guide wording and sample-action release — October 7, 2026

The frontend and backend changes are pushed, and the Vercel deployments succeeded. The revised temporary-email guide is published in the production database. Its old URL permanently redirects to the new URL on both frontend domains.

## Reader-facing changes

- Homepage links say “Read guides & experiments.” Recommendations say “More guides & experiments” or “Latest guides & experiments”; guide cards and pagination use “guide.”
- The guide title is **Temporary Email for Authorized Testing and Permitted Messages**, with canonical path `/journal/temporary-email-for-authorized-testing-and-permitted-messages`. The previous `/journal/best-practices-for-temporary-email-when-working-with-signups` path returns HTTP 301 directly to it.
- The guide now describes authorized test forms, applications the reader owns, permitted delivery tests, receiving-service rules, and non-sensitive messages. It expressly prohibits account recovery, identity bypass, fake accounts, trial abuse, ban evasion, repeated registrations, spam, and sensitive information.
- Temporary-mail pages remain ad-free. The existing cover image and its descriptive alt text are preserved.
- The shared sample loader sets every field first, dispatches synchronous bubbling `input` and `change` events for every field, then shows its success message. Invalid sample definitions do not announce success.

The database update locked and checked the complete existing row before saving a revision and changing one guide. Its ID, cover, and September 29 publication date are preserved. Its modification and review dates truthfully reflect this content change. The SQL was validated in isolated Postgres, including safe refusal to replay a stale snapshot. The original published row remains in the revision history.

## Verification

- **123 tests passed**, covering the existing application and the renamed guide's redirect, canonical rendering, and deployment fallback.
- **90 local and 90 deployed browser checks passed**: ten immediate sample/action sequences each for Base64, JSON, CSV, JWT, timestamp, URL encoding, text case, text diff, and QR. Both events were observed for every sample field, including selects and checkboxes. QR output remained 180 × 180.
- The baseline also completed its 90 output checks after page load, so the reported two-second delay was not reproduced locally. The baseline lacked both events on each field; the corrected loader now meets the requested event contract.
- Both domains return HTTP 301 at the old guide URL and HTTP 200 at the new URL, with the correct host-specific canonical, revised content, and restrictions.
- Both sitemap sets contain **39 static pages plus four published guides**, with the new URL and no old guide URL or asset URLs.
- The three Vercel favicon files return HTTP 200, decode to square images matching the Anvil mark, and are crawlable. The ICO includes sizes up to 256 × 256.
- The single requested production contact submission returned HTTP 202 and reference `7bd03f62-88ae-45d4-8c6b-590ffc93b369`. The message persisted; alert and receipt jobs each sent on their first attempt. **The user confirmed receiving the receipt.** No repeat submission was made.

Evidence: [local browser checks](audits/guide-sample-actions-2026-10-07.json), [deployed browser checks](audits/guide-sample-actions-live-2026-10-07.json), [publication and contact verification](audits/guide-publication-2026-10-07.json), and [live guide/sitemap/frontend checks](audits/guide-live-release-2026-10-07.json).

## Deployment status and remaining account actions

Frontend code commit: `7765bd2386367b506173573e55dba469c0d36890` in [Anvil-Tools](https://github.com/MuhammadFaizanAbbas/Anvil-Tools/commit/7765bd2386367b506173573e55dba469c0d36890). Backend commit: `72c59df5c2151c598c67696de2b2b32286e8aee1` in [Anvil-Tools-Backend](https://github.com/MuhammadFaizanAbbas/Anvil-Tools-Backend/commit/72c59df5c2151c598c67696de2b2b32286e8aee1). The final evidence/documentation is committed separately.

Vercel serves the new homepage labels and JavaScript. The production database and backend already serve the renamed guide and its redirect on `nevco.online`, but that cPanel host still serves the old static homepage, sample loader, and recommendation labels. No cPanel upload connection is available in this session.

Upload/extract `deployment/guide-samples-2026-10-07/cpanel-guide-sample-update.zip` into the site's current document root, preserving paths and the hidden `.htaccess` file. The ZIP contains 52 files at document-root paths, including the changed HTML/PHP/JavaScript and all three favicons; it excludes private configuration and `ads.txt`. Its archive integrity passed. Recheck the homepage, immediate sample actions, and favicon HTTP responses after upload.

Search Console indexing requests remain an account action: inspect the homepage and representative updated pages after the production upload. No Search Console connection is available, and no indexing request or Google inclusion is claimed.
