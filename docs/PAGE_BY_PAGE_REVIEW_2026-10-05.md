# Page-by-page review release — October 5, 2026

This release addresses the verifiable findings in `Nevco_Page_by_Page_AdSense_Audit_2026-10-05.html`. The attachment was treated as review evidence. Its subjective scores and estimated approval probability are not Google's scores or acceptance criteria. There is no defensible promise of 100% AdSense approval or exhaustive correctness.

`ads.txt` is unchanged. Both release archives exclude it. Its local SHA-256 remains `005e774214410091a356e270d2a86b112ccdedfc544c7b3ab9a69fec82204089`. Advertising remains disabled; no publisher value, verification token, reviewer identity, or active consent integration has been invented.

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

The source generator preserves an existing `ads.txt` on future runs. The final refinement is repeatable: running it and the editorial builder a second time produced no HTML changes. The legacy expansion no longer adds the two generic repeat questions. Both PHP and Node apply the same public asset version, `20261005-review`.

## Verification

- `npm test`: 107 passed, no failures or skips.
- `npm run verify`: syntax and script-reference checks passed for 106 files.
- `scripts/check-submission-pages.cjs`: 39 canonical public pages at 320 and 1440 pixels, with all tool FAQ answers expanded; no observed horizontal overflow, broken loaded images, page exceptions, or detected axe violations in the prepared release. Generated output states are checked separately by the same script.
- All 20 tools plus the directory have browser functionality checks. QR output is independently decoded; downloaded PDFs are independently reopened for page count and order; background removal uses the actual local model and verifies both transparent and opaque pixels in its downloaded PNG.
- `scripts/audit-submission-content.py`: 20 exact repeated main paragraphs before this release, zero after; all 20 pages include a concrete example. This compares normalized paragraphs of at least 12 words within each tool, not internet originality or authorship.
- The existing guarded article transaction passed six isolated PostgreSQL validation cases in the earlier follow-up. It has not been executed against production.

Evidence is in `audits/submission-pages-local.json`, `audits/submission-content.json`, and the release's regression log. The browser checks use Edge and emulated viewports. Axe incomplete results need manual judgment; automated results do not establish full WCAG conformance. Temporary-mail layout and expiry use clearly synthetic responses, with no message sent. Physical-device, screen-reader, contact receipt/reply, real incoming-mail delivery, field Core Web Vitals, and future ad-placement checks are not represented as completed.

## Publication and remaining access

Git deployment and the review domain are separate. `nevco.online` uses cPanel, and journal bodies are served from Supabase project `epxzxcqsonxscyvbopqt`. A Git push does not upload that cPanel document root or publish database bodies.

The read-only check of `nevco.online` found all 39 canonical pages returning 200, correct canonical URLs, and no missing checked fragment targets. It still showed the previous public page release and the old three article bodies. Two external destinations in the old bodies could not be verified by this client: Etsy returned 403 and an eBay request failed. Those results do not establish that the destination pages are missing. The prepared replacement guide does not retain those links. See `audits/submission-crawl-nevco.online.json` for bounded HTTP checks and release differences.

The shortened background and temporary-email guides are ready in source, at approximately 1,713 words/seven body headings and 1,726 words/eight body headings respectively. The PDF guide adds actual workflow evidence. Original titles, journal slugs, covers, publication dates, and the four-guide catalog are preserved. The production bodies remain unpublished until access to the correct Supabase project is provided or its owner executes the prepared guarded transaction.

Build the comprehensive release files with:

```sh
python scripts/package-submission-release.py
```

`deployment/page-review-2026-10-05/frontend.zip` is an incremental cPanel update with public pages, PHP helpers, shared CSS/scripts, PDF examples, and the five existing example images. Paths are relative to the document root. It excludes `ads.txt`, the private workspace, secrets, and the large existing background-removal model. Upload it over the existing public site; do not delete unrelated files or change `ads.txt`.

`deployment/page-review-2026-10-05/article-release.zip` contains the three prepared bodies, review metrics, these instructions, and `publish.sql`. Deploy the backend renderer and public assets first, then run only that transaction in project `epxzxcqsonxscyvbopqt`. It requires the reviewed old bodies and metadata, locks each record, saves complete revisions, and updates only body and modification date. Any conflicting edit aborts the entire transaction. Do not run historical schema migrations, seeds, cleanup SQL, or remove the transaction guards. See [the earlier publication instructions](ADSENSE_AUDIT_FOLLOWUP.md).

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

## AdSense submission and advertising

Owner account access is still required to confirm ownership and request/read the actual review status. Google documents Search Console ownership as an alternative in certain cases, and offers the account's verification methods, including a meta tag where applicable. No public response proves successful account verification. [Site readiness](https://support.google.com/adsense/answer/12176698?hl=en), [connecting and requesting review](https://support.google.com/adsense/answer/7584263?hl=en).

Google states that creating a European regulations message is optional when requesting site review and should be completed before showing ads in those regions. Keep the present disabled-state disclosures accurate. Before advertising begins, publish the applicable certified consent messages, update both policies to identify actual enabled advertising/data uses and controls, verify refusal and later changes, and add the account-owned seller line yourself. The existing future-use disclosures are preparation; they do not claim an active CMP. [Google's connection and review instructions](https://support.google.com/adsense/answer/7584263?hl=en), [CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en), [privacy disclosures](https://support.google.com/publisherpolicies/answer/10437794?hl=en).

Do not enable ads on the temporary-mail message reader, private admin pages, empty/error pages, or output-only screens. Review real placements around upload/download, copy, refresh, and generate controls when introducing advertising. The present ad-free site cannot establish future ad-layout compliance.
