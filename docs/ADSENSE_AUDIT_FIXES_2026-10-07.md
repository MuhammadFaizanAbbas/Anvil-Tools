# October 7 AdSense audit fixes

**Verification update:** The [four-point live recheck](ADSENSE_FOUR_POINT_RECHECK_2026-10-07.md) supersedes the pending-verification statements below for article labels, linked-file validity, HSTS, and inactive advertising. All 43 public pages and 81 linked resources were checked successfully on each host. The release preparation and push history below remain useful context; database article publication is still separate.

The findings in `nevco-adsense-audit (1).md` were checked against this repository and the public site. The attachment is an assessment, not authorization to enable advertising or execute its submission checklist. The fixes below are implemented and verified locally. The code is pushed to `main` in [Anvil-Tools](https://github.com/MuhammadFaizanAbbas/Anvil-Tools) and [Anvil-Tools-Backend](https://github.com/MuhammadFaizanAbbas/Anvil-Tools-Backend). Backend commit `95c115f` contains the reviewed article renderer, review manifest, security helper, and updated hub template. The push checks passed all **120 workspace tests**, all **59 standalone backend tests**, and syntax/script references in **114 files**. Live deployment verification, the separate cPanel upload, and the guarded database article publication remain pending; pushing code does not execute the prepared SQL.

| Audit issue | Resolution |
| --- | --- |
| Duplicate homepage | Apache permanently redirects the original `/index.html` request to `/`; Vercel redirects it before file handling. The original-request condition prevents an internal PHP rewrite loop. Public home, logo, recovery, and breadcrumb links use `/`. The sitemap already used `/` and still excludes the duplicate route. |
| Temporary-email positioning | Replaced the gated-site/signup introduction and marketing descriptions with authorized testing and permitted non-sensitive receipt. Updated the category, directory, homepage, search catalog, generator sources, walkthrough, and FAQ. A provider-retention warning is visible next to inbox controls before a request succeeds. The revised guide uses the same limits and explicitly rejects domain evasion. |
| User-agent positioning | Primary heading is “User-Agent String Reference for Authorized Testing.” Descriptions, examples, cards, and FAQs distinguish parser fixtures from browser behavior and verified crawler identity. Fixed versions are described as historical examples. Access-control evasion and deceptive traffic are prohibited. Selection and copying still work. |
| Ads around tool/results screens | Advertising remains disabled. Tool explanations and reading sections are preserved. No ads were added to inboxes, messages, output panels, download controls, errors, or workspace pages. Actual placement needs review when a real advertising integration is introduced. |
| Fixture/download validity | A fresh crawl checked all 43 public pages and **81 directly referenced resources**, including **43 fixtures, illustrations, and article covers**. Every resource returned 200 with an appropriate MIME type and passed its format/content check. All resources with local copies match their local bytes. The audit's 53-resource figure did not include a URL manifest; the new report records the actual URLs and referring pages. |
| Blog/Journal navigation | The single public hub is **Guides & experiments** at `/blog/index.html`, with consistent navigation, footer, title, description, and breadcrumbs. `/journal/` leads permanently to that hub. Existing guide and experiment permalinks remain stable. The sitemap index continues to combine static pages/experiments and database guide URLs. |
| Authorship and dates | All eight articles show VelloxTech editorial ownership, their original publication dates, a review date, and a link to the existing testing methodology. A checked-in body hash, title, and excerpt bind each review date to the reviewed version; subsequent edits hide an outdated review date. No individual reviewer was invented. |
| Future advertising disclosures/CMP | Current ads-disabled privacy/cookie statements remain accurate. Active vendor disclosures and a certified CMP depend on the actual advertising configuration and must be implemented before the applicable advertising is served. |
| Technical hardening | Explicit CSP source lists cover existing API, CDN, fonts, images, and private-media dependencies. Dynamic JavaScript and blob fetch permissions are confined to the background-remover page because its existing image-processing bundle requires them. Apache and Vercel add a seven-day HSTS policy scoped to each HTTPS host, without `includeSubDomains` or preload. Apache removes PHP's `X-Powered-By`; Express already suppresses its framework header. Server-wide `ServerTokens` settings require host administration if version exposure is observed. |

Verification evidence:

- [Regression results](audits/adsense-oct7-tests.txt): **120 passed, zero failed**.
- `npm run verify`: syntax and script references passed in **114 files**. The four modified Python sources also passed syntax parsing.
- [Browser report](audits/adsense-oct7-browser.json): **129 layouts** across 43 public pages at 320, 768, and 1440 pixels; no horizontal overflow. Tool checks passed for a synthetic temporary inbox, user-agent selection/copying, JSON, quoted-newline CSV, and a real background-removal run under the release CSP. All eight articles expose their metadata and content without JavaScript. Final tool checks recorded no CSP violations or page errors.
- [Live resource report](audits/linked-fixtures-nevco.online.json): **81 resources**, zero failures; PDF files reopened, images fully decoded, JSON parsed, CSV exercised through the actual tool, JavaScript syntax checked, and font headers checked.
- [Local resource report](audits/linked-fixtures-local.json): **77 resources**, zero failures; the four database cover URLs are checked separately on the live site.
- [Actual background-removal browser run](audits/oct7-background-csp.png).

The current seller file was left unchanged and excluded from the frontend upload archive.

Deployment artifacts are in `deployment/adsense-audit-2026-10-07/`:

- `frontend.zip` contains the frontend contents, including `.htaccess`, assets, PHP handlers, and hosting configuration, without a containing frontend directory. The root `frontend.zip` is refreshed from this release. Preserve the existing `ads.txt` on the host.
- `backend.zip` contains the API sources, the article-review manifest, shared article renderer, and updated hub template. Its Vercel configuration is for Express; it does not contain frontend proxy routes.
- `preview/` contains complete previews of the four database guides using their original publication dates and covers.
- `publish.sql` prepares **one** temporary-email guide update, including its title, excerpt, body, and SEO copy. It checks the old body and metadata, locks the row, saves a full revision, and rejects concurrent edits or repeat publication. It preserves the article slug, publication date, and cover. This transaction has not been executed.

The GitHub push makes both code releases available to their respective Vercel projects. Verify both deployments, upload the separate frontend archive to cPanel, then publish the prepared guide update after reviewing the preview and refreshing the snapshot if the article has changed. Rerun the live resource check and verify the actual `/index.html` redirect, hub labels, article metadata, and HTTPS headers after deployment. Local browser checks do not confirm the deployed Apache or Vercel behavior.

Maintenance commands:

```sh
npm run build:editorial
node scripts/check-linked-fixtures.cjs
node scripts/check-linked-fixtures.cjs --origin=https://nevco.online --report=docs/audits/linked-fixtures-nevco.online.json
```

Keep review hashes/dates tied to an actual content review. `prepare-adsense-audit-fixes.cjs` is a dated release-preparation script, not an instruction to assign October 7 review dates to future content. Regenerating public pages must use the maintained generator sources and editorial build.

Advertising integration should follow Google's [ad placement policies](https://support.google.com/adsense/answer/48182?hl=en) and [certified CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en). Header decisions follow [Apache's expression variables](https://httpd.apache.org/docs/2.4/expr.html), [CSP directive behavior](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy), and [HSTS host/subdomain scope](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security).
