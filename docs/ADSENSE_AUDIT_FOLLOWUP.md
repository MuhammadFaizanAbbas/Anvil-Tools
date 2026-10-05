# AdSense audit follow-up — October 5, 2026

This implements the actionable findings from `Nevco_AdSense_Audit_2026-10-04.html`. Its recommendations were treated as review evidence. The audit's subjective score and approval estimate are not release criteria or a promise of approval.

The first fixes were pushed to `main` in `MuhammadFaizanAbbas/Anvil-Tools` (`bac4313`) and `MuhammadFaizanAbbas/Anvil-Tools-Backend` (`b4223f7`); both Vercel deployments succeeded. Vercel deploys those repositories separately. Pushing the code does not publish the database article bodies or upload files to the separate `nevco.online` cPanel host. Database publication, AdSense account changes, contact submission, and external email delivery remain separate steps.

The October 5 public check found all five new example images available on both hosts, but the three old article bodies were still live. The Supabase CLI account in this session cannot access production project `epxzxcqsonxscyvbopqt`. Install or connect Supabase with access to that project to finish publication, or run the guarded `publish.sql` in that project's SQL Editor. There is no connected AdSense account in this session; public HTTP checks cannot confirm ownership, a review decision, or a published consent message.

The follow-up corrects the literal `Read article ?` to `Read article →`, updates both legal policies with conditional Google data-use and regional consent disclosures, and keeps advertising disabled. The cPanel JavaScript cache policy now revalidates scripts so the corrected character can reach returning readers. `ads.txt` remains untouched and excluded from deployment archives.

## Findings addressed

| Audit finding | Prepared change | Verification |
| --- | --- | --- |
| PDF Merge promises reordering but only removes files | Numbered list with keyboard-accessible Move up, Move down, and Remove controls | A downloaded four-page PDF was reopened and its page dimensions checked in the chosen source-file order |
| Image ordering is difficult to correct | The same controls for image pages, with PNG/JPEG/WebP selection | Actual JPEG and WebP output pages were checked after reordering and removing an image |
| Very long, fragmented guides | Rewritten background-removal and temporary-email workflows, each about 1,700 readable words | Seven and eight body headings respectively, decision tables, specific examples, working contents links |
| Original demonstrations and screenshots needed | Actual tool screenshots in both rewritten guides and the PDF workflow; downloadable synthetic input and output | The background result retains visible speckles; the guide explains the observed limitation instead of presenting it as a perfected cutout |
| PDF download integrity unverified | Connected download anchors, delayed object-URL cleanup, page-count feedback, and independent PDF parsing | Page count, page dimensions, and whole-file ordering checked on synthetic samples |
| Mobile interaction and no-JavaScript rendering not checked | Browser checks at phone, tablet, and desktop viewport widths | See `audits/adsense-followup-browser.json` for the final cases and limitations |

Both PDF queues block additions, removals, and reordering during processing. Error feedback restores editable controls. Removing an image releases its preview URL. The guide and current pages describe whole-file ordering separately from individual PDF page editing, which these tools do not offer.

The safe Markdown renderer accepts standalone images only from repository-owned raster paths under `/assets/images/`. Remote images, traversal paths, SVG examples, and raw image attributes remain disallowed. Captions and alt text are escaped. Existing covers, journal slugs, original publication dates, and the four-guide catalog are preserved.

## Editorial review

| Guide | Previous readable words | Prepared readable words | Previous body headings | Prepared body headings |
| --- | ---: | ---: | ---: | ---: |
| Background removal | 10,575 | 1,713 | 237 | 7 |
| Temporary email | 11,019 | 1,726 | 159 | 8 |
| PDF workflows | 1,575 | 1,695 | 9 | 9 |

Counts use the repository renderer and include headings, table text, and screenshot captions. They therefore differ slightly from the supplied audit's methodology. There is no minimum-word or article-count target. The developer guide remains unchanged. The local internal-duplication check compares normalized body paragraphs of at least 12 words across all four guides; it is not an internet originality or authorship check.

The new sources are AI-assisted edits with recorded tool results. The background example is a deliberately simple synthetic illustration, not evidence of quality on difficult photographs. The temporary-mail screenshot shows real address creation and inbox retrieval; no independently sent message or contact-form delivery was tested. Phone widths are emulated, not physical-device testing. Core Web Vitals and a future live advertising layout remain unmeasured.

## Release files and publication

The release folder is `deployment/adsense-followup-2026-10-05/`:

- `frontend.zip`: fourteen changed public files, including the two tool pages, scripts, styles, five example assets, both policies, and `.htaccess`. Paths are relative to the cPanel document root. It excludes `ads.txt` and the private workspace.
- `backend.zip`: the Express backend, manifests, and backend Vercel configuration. It includes the safe image renderer and no credentials.
- `article-release.zip`: three Markdown bodies, the review report, these instructions, and the guarded transaction.
- `publish.sql`: prepared body-only update for the three existing records in Supabase project `epxzxcqsonxscyvbopqt`. It has not been executed.
- `database-before.json` and `sources-before/`: original public database bodies and local source backups, excluded from all deployment archives.
- `merged-document.pdf`, `images-to-pdf.pdf`, and `synthetic-mug-cutout.png`: actual browser-download evidence.

Deploy the backend renderer and public example assets before publishing the new bodies. Upload the frontend ZIP into the existing cPanel document root while preserving its paths; it is an incremental update. A Vercel frontend needs the corresponding source changes deployed through its existing project. Existing routing and hosting settings remain prerequisites.

Review `publish.sql` and run it in the correct project's SQL Editor when releasing the articles. It uses UTC for timestamp guards, locks each target, checks the previous body's MD5 and public metadata, requires the four-guide catalog, saves previous complete records in `post_revisions`, and updates only the three bodies and modification dates. Any conflicting edit aborts the transaction. It does not alter covers, titles, publication dates, other posts, or database schema. Do not run the old October 4 release or cleanup transactions again.

`node scripts/validate-editorial-release.cjs` validates the prepared transaction in an isolated PGlite PostgreSQL database. All six cases passed: three-body replacement with metadata and complete revisions preserved; a connection starting outside UTC; rejected repeated publication; whole-transaction rollback after concurrent body or metadata edits; and a changed-catalog rejection. This checks the transaction against the relevant schema without executing anything against Supabase. PGlite is available in the existing local `deployment/browser-check/node_modules` tools installation.

Regenerate the review and ZIPs with:

```sh
node scripts/prepare-adsense-followup.js
python scripts/package-adsense-followup.py
```

The preparer only fetches public baselines and writes local review files. It refuses to replace an existing baseline whose body changed. A concurrent-edit rejection needs a fresh reviewed baseline, not removal of the guards. Running `npm run build:editorial` rebuilds links and templates; it does not publish these database bodies.

After deployment and content publication, compare the three live article bodies with the MD5s in `audits/adsense-followup-editorial.json`, check the five new assets return 200, and repeat the PDF download checks on the published site. Run `npm run audit:crawl -- https://nevco.online`. Inspect the actual site on a phone and complete the authorized delivery checks below.

## Account and launch work still required

1. In AdSense → Sites, select `nevco.online`, confirm ownership, and read the actual review status. If Google detects verified ownership in Search Console, that can provide the alternative to certain on-page methods described in [Google's site-readiness help](https://support.google.com/adsense/answer/12176698?hl=en). Otherwise use the exact account-owned verification value supplied by AdSense, including its meta-tag option where offered. No publisher ID or verification token has been invented. Once the corrected live site is ready, use the account's Verify/Request review controls and confirm the resulting status. [Connect and review a site](https://support.google.com/adsense/answer/7584263?hl=en).
2. Copy the exact account-owned seller declaration into `ads.txt` when configuring advertising, then check its recognized status in AdSense. Google describes ads.txt as highly recommended, rather than universally mandatory. [Official ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en-GB).
3. Configure and test a Google-certified TCF CMP before personalized ads reach the EEA, UK, or Switzerland. Google's Privacy & messaging European regulations message is one certified option: select the actual site, set its published privacy-policy URL, choose and review the available consent controls, and publish the message through the account. Verify the message on the actual domain from applicable regions, including refusal and later changes. The old custom preference script does not establish that integration. Non-personalized and limited ads have separate requirements. Assess other applicable regional messages before launch. [Google's CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en).
4. Both policies now explain potential Google advertising data, third-party cookies/web beacons/IP addresses/identifiers, and regional consent conditionally, with Google's partner-data link. When introducing advertising, update them together to identify the actual enabled providers, purposes, consent interface, and choices, and remove the disabled-state claims at the same time. This preparation does not establish that advertising or a certified consent message is already active. [Google's privacy-disclosure policy](https://support.google.com/publisherpolicies/answer/10437794?hl=en).
5. Keep the temporary-mail reader, admin pages, error pages, and empty/output-only screens outside ad inventory. Review every live placement around Copy, Refresh, Generate, Upload, and Download controls, including on a phone. An ad layout cannot be tested while advertising is disabled.
6. Send a non-sensitive test message from an authorized mailbox or application you operate to confirm temporary-inbox delivery. Test contact delivery and the admin receipt/reply path from your own account. Neither check was replaced by a simulated success or an unsolicited message.

## Local verification

`npm test` passed all 104 tests with no failures or skips. New checks exercise ordering, boundary controls, focus, rejected inputs, mutation during processing, recovery after errors, image URL cleanup, and safe article examples. `npm run verify` passed syntax and local script-reference checks for 104 files; the verifier now recognizes query strings used to refresh cached PDF scripts. All 29 browser cases passed, including four tool widths and three no-JavaScript article widths. Browser evidence is in `audits/adsense-followup-browser.json`, editorial metrics and prepared hashes are in `audits/adsense-followup-editorial.json`, and the regression log is `audits/adsense-followup-tests.txt`.

These results describe the local release and selected public read-only checks. They do not establish AdSense approval, full provider retention behavior, worldwide consent compliance, or exhaustive tool compatibility.

The October 5 presentation follow-up passed both existing recommendation tests and all four consent tests, syntax/reference verification for 104 files, Python syntax checks, and six browser cases across 320- and 1440-pixel widths. The browser checked the actual `Read article →` text, both revised policies, no horizontal overflow, and no observed automatic Google advertising requests. This follows the earlier 104-test regression run; the full suite was not repeated for the text and disclosure edits. The separate six-case SQL validation is recorded in `audits/adsense-publication-validation.json` and the local presentation checks in `audits/adsense-presentation-local.json`.
