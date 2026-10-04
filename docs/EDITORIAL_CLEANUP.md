# Editorial cleanup — October 4, 2026

The Anvil Tools Supabase project is `epxzxcqsonxscyvbopqt`. The cleanup transaction committed at `2026-10-04T13:00:51.606309Z` and verification confirmed:

| Change | Count |
| --- | ---: |
| Previously published database articles | 490 |
| Articles without covers removed from publication | 424 |
| Covered overlapping articles removed from publication | 62 |
| Remaining distinct covered guides | 4 |
| Previous database records saved as revisions | 490 |
| Old journal URLs with a consolidated replacement | 315 |
| Old journal URLs without an equivalent replacement | 171 |
| Unillustrated static guides retired | 12 |

Removed database posts have `draft` status, so they are excluded from public listings, article APIs, recommendations, and the journal sitemap. They remain recoverable in the private workspace. No media assets were deleted.

## Retained articles

- `/journal/best-practices-for-temporary-email-when-working-with-signups`: the completed temporary-email handbook, with obsolete related links corrected.
- `/journal/best-practices-for-background-removal-when-working-with-design`: the completed background-removal handbook, with obsolete related links corrected.
- `/journal/simple-pdf-workflow-without-software`: rewritten around the actual image-to-PDF and PDF-merge tools, preparation, file ordering, output checks, and limitations.
- `/journal/small-tools-that-save-developers-time`: rewritten around JSON types, Base64, URL components, JWT inspection, hashes, CSV data, and timestamp debugging.

All four have verified image assets and descriptive alt text. The retained bodies have no repeated normalized paragraphs of at least 35 words across different articles and no headings matching the audit's keyword-tail pattern. This check has a defined scope; it is not a guarantee of editorial quality or AdSense approval.

The misleading temporary-email claim that an inbox “leaves nothing behind” belonged to a retired article. Its old URL redirects to the retained guide, which explains provider records, connection information, recovery limits, and the difference between disappearing access and deletion. Existing privacy and cookie disclosures describe disabled advertising and analytics accurately.

## Code behavior

`backend/src/lib/article-redirects.json` records the retirement decisions. A string value produces a same-site 301 redirect to the retained guide; a null value produces a styled HTTP 410 response with `noindex, follow`. Redirect destinations are the four retained articles, so there are no redirect chains between retired posts.

The 12 static guides are removed from `frontend/blog/`, their catalog, and the static sitemap. Their authored sources remain in `scripts/site-generator/editorial/`. Nine old paths redirect to a consolidated guide; three without an equivalent guide return HTTP 410. Apache rules take precedence even if old HTML files are still present on the host. Both frontend Vercel configurations carry equivalent retirement rules.

Tool pages link directly to their related retained guide. The listing renders a single set of cards; a covered fallback catalog is used when the article API is unavailable. The admin publishing endpoint now requires an uploaded cover, descriptive alt text, and body content. Uncovered drafts remain editable.

The legacy-link and CSS corrections are included: root-relative assets on error pages, a redirect from `/snowy-peaks-solitaire/` to the homepage, normalization of HTML trailing-slash links, stylesheet versioning, and CSS revalidation. This resolves the nested-path asset failure and bypasses previously cached shared styles after deployment.

## Deploy and audit

The configured GitHub destinations are `MuhammadFaizanAbbas/Anvil-Tools` for the frontend and `MuhammadFaizanAbbas/Anvil-Tools-Backend` for the backend. Both use their existing `main` branches. Vercel deploys from those repositories. The separate `nevco.online` cPanel host requires the frontend files to be uploaded unless hosting access is provided.

Extract `deployment/editorial-cleanup-frontend.zip` into the cPanel domain's document root, preserving paths and replacing the included files. This archive contains only the changed public files and required PHP helpers/styles. It excludes `ads.txt`, private credentials, database backups, and the admin workspace. It includes `.htaccess`, which must be applied by Apache, and PHP 8.1+ is required. Old static guide files can be deleted after upload; the supplied rules already prevent them from being served.

Run `node scripts/check-editorial-cleanup.js --live` and `npm run audit:crawl -- https://nevco.online` after both code deployments. Confirm four articles in the blog and journal sitemap; test an overlapping old URL, a retired topic without a replacement, and `/snowy-peaks-solitaire/`. Open the PDF and developer guides with JavaScript disabled and check their covers, contents links, and mobile layout. The static sitemap should contain 35 URLs after the cPanel upload.

The local regression suite passed all 89 tests, including PHP/Node rendering, safe redirects, HTTP 410 handling, draft exclusion, pagination, and cover publishing requirements. Fifteen browser cases passed at 320, 768, and 1440 pixels with JavaScript disabled, including four covers, working contents anchors, no horizontal overflow, and a single four-card catalog. Syntax and script-reference checks passed for 103 files, and all ten PHP files passed syntax checks. Audit evidence is in `docs/audits/editorial-cleanup-before.json`, `editorial-cleanup-after.json`, `editorial-cleanup-database.json`, `editorial-cleanup-browser.json`, and `editorial-cleanup-tests.txt`.

## Advertising setup

`ads.txt` is untouched. Advertising and automatic analytics remain disabled. AdSense account ownership, the real publisher configuration, and applicable consent integration must be completed with the actual account settings before serving ads. In particular, Google's [CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en) apply to personalized ads for visitors in the EEA, UK, and Switzerland. Update the policies to match the vendors and data practices actually enabled at that time. A placeholder consent banner or fabricated publisher ID would not complete those account steps.

## Recovery

`deployment/editorial-cleanup-2026-10-04/published-before.json` contains the full pre-cleanup public bodies and metadata; `database-before.json` contains the database baseline and media inventory. `static-pages/` contains copies of the retired generated guides. Every changed database record also has a full pre-change snapshot in `post_revisions` at the cleanup timestamp above.

Keep these backups private. Do not rerun `cleanup.sql` against production: its baseline guards intentionally reject the already changed library. Restoring an article requires editorial review and a deliberate status change, plus removal of its retirement rule if it becomes public again.
