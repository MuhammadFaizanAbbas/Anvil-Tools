# AdSense review fixes

**October 7 attached audit follow-up:** [audit fixes and verification](ADSENSE_AUDIT_FIXES_2026-10-07.md) records the homepage redirect, authorized temporary-email/user-agent wording, shared Guides & experiments hub, article ownership/review dates, scoped CSP, and HSTS. All 120 tests, 129 browser layouts, and 81 live resource checks passed. The root `frontend.zip` and separate backend/archive/guide previews are prepared. **The code is pushed to `main` in both GitHub repositories; live deployment verification, the separate cPanel upload, and the guarded temporary-email article publication remain pending.** Advertising remains disabled; provider/CMP setup is a later launch step.

**Latest audit, updated October 7:** the [full website audit](FULL_SITE_AUDIT_2026-10-06.md) covers all 43 public pages, all 20 tools, administrator layouts, API latency/loading recovery, dependencies, database/storage privacy and Google policy requirements. The frontend and backend fixes are deployed and verified on Vercel. Four corrected guide bodies are published with preserved revisions, and the database/storage privacy fixes are verified. All 43 live pages passed mobile Lighthouse without load errors: performance median 98, accessibility/best practices/SEO 100. Publishing the separate nevco.online cPanel files still requires its deployment connection; the complete root `frontend.zip` is ready. Search Console, Supabase leaked-password protection, physical devices and controlled email delivery remain identified account/manual checks.

**Attached review:** the [October 6 readiness completion](ADSENSE_READINESS_COMPLETION_2026-10-06.md) records permanent hostname rules, brand metadata, conditional blog retry and ordinary pagination links, four browser-tested experiment articles, editorial disclosure, and explicit Google Ads privacy choices. The live temporary-email guide is already shortened.

**Earlier crawler release:** the [October 6 crawler recheck record](CRAWLER_RECHECK_FIXES_2026-10-06.md) addresses all 40 entries in the preceding report. Its four guarded guide-body corrections were subsequently published and verified during the full audit; do not rerun historical release SQL. Private account, external delivery, and physical-device checks remain listed. The cPanel upload still needs access, with `ads.txt` excluded.

**Previous verified release:** the [October 5 page-by-page release](PAGE_BY_PAGE_REVIEW_2026-10-05.md) records the preceding deployment. The correct Supabase project has four published, covered guides; the shortened background-removal and temporary-email bodies and revised PDF workflow were published and verified. Those public-page fixes were pushed to both repositories. The older counts and release instructions below are historical.

## Earlier release record (superseded by the cleanup)

The technical review fixes are implemented and tested. The expanded editorial library is a separate work in progress: this release has published two completed database articles, each over 10,000 words, with their existing matching covers. The other six planned consolidated guides are not complete. No overlapping articles are archived or redirected in this release.

Backend commit `e729148` has deployed successfully. Both revised article bodies were published on October 4, 2026 in the Anvil Tools Supabase project (`epxzxcqsonxscyvbopqt`). The guarded transaction saved the previous records in `post_revisions`; database verification confirms the exact prepared bodies, metadata, covers, and unchanged original publication dates. All 490 records remain published. See `docs/audits/editorial-publication.json` for the verified database result, `docs/audits/editorial-release.json` for the checked local content, and `content/editorial/release-2026-10-04.json` for the exact release scope.

Frontend commits `38f74f8` and `2949c37` have deployed successfully to https://anviltools.vercel.app. The second corrects Vercel's filesystem precedence. Live checks confirm 49 public HTML pages respond successfully, both existing article covers load as 1672 × 941 WebP images, and the three blog index routes return server-rendered article links. `docs/audits/live-release.json` records code and article publication checks separately. The revised bodies retain their original article URLs.

The review's suggestion that there are only one or two blog posts is out of date: the current live journal sitemap lists 490 article URLs. The main technical gap is exposing those articles in the initial blog HTML. A large count does not establish content quality; review the existing library for repetition, accuracy, and usefulness rather than treating another arbitrary post count as an approval target. The 12 added guides provide detailed, tool-specific workflows and examples.

## Changes

- The blog index renders published database articles as HTML on cPanel (`blog-index.php`) and Vercel (`/api/public/blog`). It includes linked titles, descriptions, covers, and ordinary previous/next links. Each paginated page has its own canonical URL. Drafts remain private, and database text is escaped.
- Twelve authored guides live at `/blog/*.html`. They include practical steps, examples, limitations, tool links, related guides, and appropriate primary references. Their cards are in the static blog HTML and survive an API outage. Existing database articles remain in the latest-articles section and retain their `/journal/slug` addresses.
- All 20 tools have specific troubleshooting advice. The 12 corresponding tools link to their detailed guides. The existing safe-use explanations on temporary mail, user-agent samples, and JWT decoding are preserved.
- Public footers and generated article footers say “Anvil Tools is a VelloxTech project.”
- The rebuilt static sitemap contains 47 public URLs, including the new guides. Its sitemap index includes the dynamic journal sitemap. cPanel metadata handlers retain the current domain; private workspace pages are excluded.
- Advertising and automatic analytics remain disabled. No inactive ad boxes, fabricated publisher ID, or consent controls are added. Current privacy and cookie disclosures already describe this state accurately.

## Deploy this release

For **nevco.online on cPanel**, extract `deployment/adsense-fixes-frontend.zip` into the domain's document root. The archive contains the frontend's contents, including `.htaccess`, rather than a containing `frontend/` directory. Use PHP 8.1 or newer with cURL or HTTPS `allow_url_fopen`; Apache needs `mod_rewrite` and permission to apply `.htaccess`. Preserve the directory structure. The new cPanel listing uses the existing published-post API, so its no-JavaScript listing does not require the new backend route first.

For the **Vercel backend**, deploy `deployment/adsense-fixes-backend.zip` to the backend repository/project. It includes `backend/src/templates/blog.html`, which must be present at runtime. Retain the project's existing private environment variables. The rendering changes require no database migration. The two revised guides were published through a separate guarded content transaction that saved the previous records as revisions and checked for concurrent edits.

For a **Vercel frontend**, deploy the updated `frontend/` with `frontend/vercel.json`, or the full frontend repository with its root `vercel.json`. Deploy the updated backend first because the new blog rewrites target `/api/public/blog`. Do not put the frontend Vercel configuration into the Express backend repository.

The Vercel configuration uses ordered routes to proxy all three blog-index URLs before filesystem handling. A normal rewrite loses to the existing `blog/index.html` file, which is deliberately retained for cPanel's template and local previews. Live verification must check actual article cards in the response and the page-two canonical; a successful deployment status alone does not test routing.

After deployment, run:

```sh
npm run audit:crawl -- https://nevco.online
```

Open `/blog/` with JavaScript disabled and inspect page source: the published titles and guide links should already be present. Open an existing `/journal/slug` article and a new static guide. Check a second listing page if there are more than 30 published database articles. Confirm that `/robots.txt`, `/sitemap.xml`, `/sitemap-index.xml`, and `/journal-sitemap.xml` return the intended files on the same domain.

## Account steps that code cannot complete

1. In the site's verified Google Search Console property, submit `https://nevco.online/sitemap-index.xml`. Use URL Inspection for the homepage, `/blog/index.html`, an actual `/journal/slug`, and a new guide. Run the live test and inspect its rendered HTML. Request indexing where appropriate. A crawlable page is not proof that Google has indexed it.
2. When AdSense provides the real authorized seller line, put that exact declaration in `ads.txt`. Its current comment correctly reflects inactive advertising. Do not invent or copy a publisher ID.
3. Before serving advertising, configure the real advertising provider and applicable consent handling. For personalized advertising to users in the EEA, UK, or Switzerland, Google's current [CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en) require a Google-certified CMP integrated with the TCF. The removed custom preference banner is not that integration. Update Privacy and Cookies to describe the actual vendors, purposes, identifiers, options, and consent behavior at that time.
4. Keep the entire temporary-mail inbox/message screen, private workspace, login, error, and empty/result-only screens out of ad inventory. Prefer clearly labeled placements within substantial editorial content. Keep ads separate from Upload, Download, Copy, Generate, and navigation controls, and verify the rendered layout on mobile. [AdSense policies](https://support.google.com/adsense/answer/48182?hl=en) describe the relevant placement restrictions.
5. Review the guides for your editorial standards and factual fit after deployment. Continue publishing useful material at a sustainable pace and monitor real usage. An arbitrary post count, readiness score, waiting period, or approval percentage does not establish eligibility or guarantee approval.

## Maintaining the articles

The source manifest is `scripts/site-generator/editorial-guides.json`; authored bodies are in `scripts/site-generator/editorial/`. They are version-controlled static content, separate from database articles managed in the admin editor. Run `npm run build:editorial` after changing those sources. The command regenerates their pages, index cards, tool links, backend template, and sitemap. The existing refinement pipeline also invokes this build.

## Verification

All 85 regression tests passed, including server and PHP rendering, pagination, draft exclusion, escaped content, outage fallback, safe Markdown, and article/tool/sitemap links. Browser checks passed all 49 public HTML pages at 320, 768, and 1440 pixels (147 layout cases). Both completed articles also passed six separate viewport checks with JavaScript disabled, including navigation, complete text, working section anchors, and loaded covers. `npm run verify` checked syntax and script references in 113 files; all nine PHP handlers/helpers passed syntax checks.

The cPanel blog needs the updated frontend archive before its listing changes take effect. Its robots, static sitemap, sitemap index, and inactive-advertising `ads.txt` were reachable in the pre-release check. These checks do not certify actual Search Console indexing, AdSense approval, live SMTP delivery, or every device's file/model performance.
