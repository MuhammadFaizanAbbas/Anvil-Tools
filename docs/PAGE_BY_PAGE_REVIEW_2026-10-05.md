# Page-by-page review release — October 5, 2026

This release addresses the verifiable findings in `Nevco_Page_by_Page_AdSense_Audit_2026-10-05.html`. The attachment was treated as review evidence. Its subjective scores and estimated approval probability are not Google's scores or acceptance criteria. There is no defensible promise of 100% AdSense approval or exhaustive correctness.

`ads.txt` is unchanged. Both release archives exclude it. Its local SHA-256 remains `005e774214410091a356e270d2a86b112ccdedfc544c7b3ab9a69fec82204089`. Advertising remains disabled; no publisher value, verification token, reviewer identity, or active consent integration has been invented.

The current runtime release is pushed to both `main` branches: frontend `e05c642`, backend `aeefe31`. Both Vercel deployments report success; exact commit and deployment records are in `audits/submission-deployments.json`. The three prepared guide updates were published to the correct Supabase project at `2026-10-05 12:21:15 UTC` and verified through SQL and the public API. They are live on `nevco.online` too. The user will upload the contents of `frontend` to cPanel, skipping `ads.txt`; the 35 static pages still need that upload.

## Prepared changes

| Pages | Changes |
| --- | --- |
| All 20 tools | Concrete input/output examples or checkable task decisions; one consolidated FAQ; repeated paragraphs removed; no minimum word or heading target |
| Password generator | FAQ agrees with the implemented 6–48 character range |
| Image to PDF | JPG, PNG, and WebP guidance agrees with processing support and ordering controls, including tool cards and the site catalog |
| CSV to JSON | Guidance explains comma-separated input and removes the nonexistent delimiter-selector instruction; example preserves leading zeros, a quoted comma, an empty field, and an escaped quote |
| Word counter | Empty and whitespace-only text produce zero reading minutes; the interface explains whitespace-delimited words, UTF-16 character units, and the rough 200-word/minute silent-reading estimate |
| Base64, JSON, JWT, URL, hash, timestamp, case, and diff tools | Harmless samples with checkable results; input-specific limitations; JSON type/precision and duplicate-key caveats beside the action; explicit timestamp units |
| QR generator | Generated image and canvas have accessible descriptions; the downloaded PNG is decoded independently |
| Background removal | Actual synthetic before/after example with visible imperfections; downloadable original and transparent result |
| PDF merge | Three downloadable source documents and an independently checked four-page merged example; forms/signature/bookmark limits beside the action |
| Temporary email | Website-access countdown from the API's expiry value, separate from provider retention; permitted delivery-check instructions and provider link |
| User-agent generator | Fixed fixtures are identified as parser/request-header samples; sample versions are not described as live browser versions or device emulation |
| Six categories | Distinct task-selection comparisons, workflows, and output checks; accessible headings before the tool cards |
| Directory | Search, category filtering, result count, and no-result recovery; all 20 cards remain available without JavaScript |
| Homepage, blog index, About, disclaimer | Concrete workflows, guide introduction, accurate correction process, and task-specific links |
| Public shared layout | Correct footer heading order, stronger small-text contrast, visible text-link styling, versioned shared loader/recommendation URLs, and versioned changed tool scripts |

The source generator preserves an existing `ads.txt` on future runs. The final refinement is repeatable: running it and the editorial builder a second time produced no HTML changes. The legacy expansion no longer adds the two generic repeat questions. Both PHP and Node apply the same public asset version, `20261005-review4`.

The performance follow-up hosts the existing Inter and Space Grotesk families locally, retains all supplied language subsets, and bundles both SIL Open Font Licenses. Static pages preload their Latin subsets; shared CSS supplies the font faces for articles too. Background removal imports its pinned library only after image selection. Three screenshot examples have responsive WebP copies, with the original PNG evidence and downloads retained. Known article screenshots also have explicit dimensions. Upload the fonts, responsive images, CSS, scripts, HTML, and PHP together when updating cPanel.

The fonts use `font-display: optional` to avoid a late change in typography and a second layout on slow first visits. If a font is not ready for initial rendering, the existing system fallback remains for that page view; later visits can use the cached font. Navigation relationships are present in the initial HTML, and the loader avoids rewriting the current year and already-correct navigation attributes. [Chrome's explanation of optional fonts and preloading](https://web.dev/articles/preload-optional-fonts).

Homepage search and its initial count are now in the HTML, so the loader reuses the controls without inserting them into an already-rendered catalog. Filtering and no-result recovery are unchanged. The search is hidden when JavaScript is disabled, and all 20 tool cards remain visible.

## Verification

- `npm test`: 107 passed, no failures or skips.
- `npm run verify`: syntax and script-reference checks passed for 106 files.
- `scripts/check-submission-pages.cjs`: the complete prepared and live runs on runtime `00819c9` passed 78 viewport checks across 39 canonical public pages at 320 and 1440 pixels, with all tool FAQ answers expanded. All 21 tool/directory functionality cases and 21 populated-result states passed on both releases. Neither run requested Google Fonts. After the final font-display and navigation refinement, all 78 prepared layout checks passed again. There was no observed horizontal overflow, broken loaded image, page exception, or detected axe violation.
- All 20 tools plus the directory have browser functionality checks. QR output is independently decoded; downloaded PDFs are independently reopened for page count and order; background removal uses the actual local model and verifies both transparent and opaque pixels in its downloaded PNG.
- `scripts/audit-submission-content.py`: 20 exact repeated main paragraphs before this release, zero after; all 20 pages include a concrete example. This compares normalized paragraphs of at least 12 words within each tool, not internet originality or authorship.
- The guarded article transaction passed six isolated PostgreSQL validation cases in the earlier follow-up and was then executed once against production. All three old bodies were preserved as complete revisions; metadata and the fourth developer article remained unchanged.

Evidence is in `audits/submission-pages-local.json`, `audits/submission-pages-live.json`, `audits/submission-font-layouts.json`, `audits/submission-content.json`, `audits/submission-database-publication.json`, and both regression logs. After the catalog change, the homepage and developer category passed four viewport checks locally and on the deployed version in `audits/submission-targeted-pages-local.json` and `audits/submission-targeted-pages-live.json`. Filtering, no-result recovery, mobile navigation/Escape, and the homepage without JavaScript passed in `audits/submission-catalog.json`. The separate backend repository passed all 58 tests; its final renderer/integration changes passed all ten targeted tests. The newly published guide pages also passed six viewport checks on `nevco.online` in `audits/submission-guides-nevco-layouts.json`. The browser checks use Edge and emulated viewports. Axe incomplete results need manual judgment; automated results do not establish full WCAG conformance. Temporary-mail layout and expiry use clearly synthetic responses, with no message sent. Physical-device, screen-reader, contact receipt/reply, real incoming-mail delivery, field Core Web Vitals, and future ad-placement checks are not represented as completed.

## Publication and remaining access

Git deployment and the review domain are separate. `nevco.online` uses cPanel, and journal bodies are served from Supabase project `epxzxcqsonxscyvbopqt`. A Git push does not upload that cPanel document root or publish database bodies.

After database publication, the read-only check of `nevco.online` found all 39 canonical pages returning 200, correct canonical URLs, no failed checked HTTP destinations or assets, and no missing checked fragment targets. The 35 static pages still need the cPanel release. Vercel has the complete public code release and the new guide bodies; its crawl reports zero pending pages or guides. See `audits/submission-crawl-nevco.online.json` and `audits/submission-crawl-anviltools.vercel.app.json` for bounded HTTP checks and release differences.

The shortened background and temporary-email guides are published, at approximately 1,713 words/seven body headings and 1,726 words/eight body headings respectively. The PDF guide adds actual workflow evidence. Original titles, journal slugs, covers, publication dates, and the four-guide catalog are preserved. All four production bodies match their prepared source bodies.

Build the comprehensive release files with:

```sh
python scripts/package-submission-release.py
```

`deployment/page-review-2026-10-05/frontend.zip` is an incremental cPanel update with public pages, PHP helpers, shared CSS/scripts, licensed local fonts, PDF examples, and the original and responsive example images. Paths are relative to the document root. It excludes `ads.txt`, the private workspace, secrets, and the large existing background-removal model. Upload it over the existing public site; do not delete unrelated files or change `ads.txt`. Uploading directly from `frontend` is also supported: copy its contents into the existing document root, including `.htaccess`, and skip `ads.txt`.

`deployment/page-review-2026-10-05/article-release.zip` contains the published bodies, preparation metrics, publication/API verification records, these instructions, and the executed `publish.sql` for release records. Do not execute that transaction again: it intentionally rejects repeated publication. It required the reviewed old bodies and metadata, locked each record, saved complete revisions, and updated only body and modification date. Do not run historical schema migrations, seeds, cleanup SQL, or remove the transaction guards. See [the earlier publication instructions](ADSENSE_AUDIT_FOLLOWUP.md).

After publishing, run:

```sh
node scripts/check-submission-crawl.cjs https://nevco.online
node scripts/check-submission-pages.cjs --live https://nevco.online
```

The browser helper uses the existing isolated QA tools under `deployment/browser-check`. On a fresh checkout, install them separately from production dependencies:

```sh
npm install --prefix deployment/browser-check --no-save playwright axe-core jsqr
```

It caches the pinned PDF/QR vendors and publicly served guide covers locally. `--tools-only` checks populated tool states without repeating the 39-page layout pass.

## Representative Lighthouse measurements

The initial default mobile measurements on Vercel gave 100 for accessibility, best practices, and SEO on the homepage, Word Counter, Background Remover, and published background guide. Performance was 98, 98, 96, and 100 respectively. The actual findings prompted local font hosting, deferred background-library loading, responsive screenshots, image dimensions, and upload controls whose accessible names include the visible text. Both the standard axe tags and the label/name rule are checked by the browser helper.

The final runtime `e05c642` was measured once across the same four routes with the unchanged default mobile audit settings:

| Page | Performance | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Homepage | 89 | 100 | 100 | 100 |
| Word Counter | 92 | 100 | 100 | 100 |
| Background Remover | 96 | 100 | 100 | 100 |
| Background-removal guide | 93 | 100 | 100 | 100 |

These measurements do not establish a performance-score improvement over the baseline. Earlier runs reached 100 performance on the two tool pages, but the final run is recorded without selecting the highest scores. Initial layout work remains measurable on the homepage and Word Counter; article delivery, render-blocking CSS, and oversized cover delivery remain diagnostic findings. The changed static pages had zero measured layout shift in this run. No claim of 100 across every category or every page is made.

`audits/submission-lighthouse-before.json` records the original baseline, `audits/submission-lighthouse-font-swap.json` and `audits/submission-lighthouse-before-catalog.json` preserve the intermediate runs, and `audits/submission-lighthouse-anviltools.vercel.app.json` records the final measured release. These are representative lab navigation scores with Lighthouse 12.8.2 and Edge, not an all-page audit, field Core Web Vitals, complete accessibility certification, or an AdSense score. Scores can vary with network, host, machine load, and tool version. The complete cPanel release must be uploaded before measuring the updated review domain.

Reproduce the measurement separately from production dependencies:

```sh
npm install --prefix deployment/lighthouse-review --no-save --ignore-scripts lighthouse@12.8.2
node scripts/check-submission-lighthouse.mjs https://anviltools.vercel.app
```

The detailed HTML/JSON reports are saved under `deployment/page-review-2026-10-05/lighthouse/`. No audit rule or throttle was changed to manufacture a perfect score.

## AdSense submission and advertising

Owner account access is still required to confirm ownership and request/read the actual review status. Google documents Search Console ownership as an alternative in certain cases, and offers the account's verification methods, including a meta tag where applicable. No public response proves successful account verification. [Site readiness](https://support.google.com/adsense/answer/12176698?hl=en), [connecting and requesting review](https://support.google.com/adsense/answer/7584263?hl=en).

Google states that creating a European regulations message is optional when requesting site review and should be completed before showing ads in those regions. Keep the present disabled-state disclosures accurate. Before advertising begins, publish the applicable certified consent messages, update both policies to identify actual enabled advertising/data uses and controls, verify refusal and later changes, and add the account-owned seller line yourself. The existing future-use disclosures are preparation; they do not claim an active CMP. [Google's connection and review instructions](https://support.google.com/adsense/answer/7584263?hl=en), [CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en), [privacy disclosures](https://support.google.com/publisherpolicies/answer/10437794?hl=en).

Do not enable ads on the temporary-mail message reader, private admin pages, empty/error pages, or output-only screens. Review real placements around upload/download, copy, refresh, and generate controls when introducing advertising. The present ad-free site cannot establish future ad-layout compliance.

## Database security notices

Supabase's advisor identified one mutable search path in the existing `legacy_archive.set_updated_at()` timestamp trigger. Migration `20261005122250` pins it to `pg_catalog`, and a follow-up advisor check confirms that warning is gone. The function remains an invoker and retains its existing timestamp behavior. The exact applied statement is recorded in `supabase/releases/harden-legacy-timestamp-search-path.sql`.

Thirteen informational RLS notices describe tables whose rows are deliberately unavailable to direct browser clients; the server's protected routes use its server-only database client. No public policies were added merely to remove those notices. [RLS advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

The remaining warning is disabled leaked-password protection. This project is on the free plan; Supabase makes that setting available on Pro and above. Enabling it requires the owner's plan/settings choice, and no paid upgrade was made. It is separate from the public tool-page and AdSense review checks. [Password security and plan availability](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
