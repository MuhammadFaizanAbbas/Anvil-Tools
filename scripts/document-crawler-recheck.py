"""Account for every supplied page recommendation, including external verification gaps."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
findings = json.loads((ROOT / 'docs/audits/crawler-recheck-findings.json').read_text(encoding='utf-8'))
photo = json.loads((ROOT / 'docs/audits/crawler-recheck-browser.json').read_text(encoding='utf-8'))
measurement = next(item for item in photo['cases'] if 'coldMs' in item)
actions = {
'/': 'Original workflow retained; real model photo output and its image-to-PDF conversion checked at an emulated phone width. Real phone check remains.',
'/about.html': 'Existing correction and AI-assisted example disclosures retained. No human reviewer identity invented.',
'/blog/index.html': 'Four distinct guide cards remain in initial HTML. Existing workflows extended with tested fixtures; no article-count padding.',
'/categories/developer-tools.html': 'Duplicate-header rejection plus downloadable quoted-newline CSV and expected JSON added.',
'/categories/email-tools.html': 'Acceptance/arrival/reading stages and provider practices linked. External delivery remains unverified.',
'/categories/generators.html': 'Recorded QR PNG independently decoded; downloadable print sheet added. Physical camera and printed scan remain.',
'/categories/image-tools.html': 'Licensed cup photograph processed by the real model; measured first-use cost and retained fabric documented with source/output downloads.',
'/categories/pdf-tools.html': 'Mixed sizes and preserved selectable page text verified independently; four-page fixture retained.',
'/categories/text-tools.html': 'Chinese whitespace-count limitation and moved-line example added with expected outputs.',
'/contact.html': 'Persistence/receipt wording and failure recovery tested with synthetic responses; external receipt and support reply remain.',
'/cookie-policy.html': 'Ads-disabled state retained; verified direct Google partner-data link used. Future regional consent/withdrawal checks remain conditional on ad launch.',
'/disclaimer.html': 'Specific limits and guide/correction links retained; background wording corrected to describe incomplete cutouts.',
'/journal/best-practices-for-background-removal-when-working-with-design': 'Principal H2 sections, precise synthetic-result limits, licensed photograph input/output, measured cost, and actual retained-fabric limitation prepared.',
'/journal/best-practices-for-temporary-email-when-working-with-signups': 'Principal H2 sections and direct provider FAQ/privacy/terms references prepared. Authorized external delivery remains.',
'/journal/simple-pdf-workflow-without-software': 'Principal H2 sections and direct four-page input/output links prepared; six-page scenario stays explicitly separate.',
'/journal/small-tools-that-save-developers-time': 'Principal H2 sections and downloadable CSV → JSON → Base64 → SHA-256 workflow prepared and browser-checked.',
'/privacy-policy.html': 'Verified direct Google partner-data URL used; inactive advertising disclosures retained. Actual providers/consent must be updated when ads launch.',
'/terms-of-service.html': 'Current restrictions, contact details, and free-use description retained; future fees/limits require a future disclosure update.',
'/tools/background-remover.html': 'Precise failed synthetic-cutout description, licensed photo/result links, lazy model loading, and inspect-before-use completion message.',
'/tools/base64-tool.html': 'Complete café/emoji UTF-8 round trip and connected workflow fixture checked.',
'/tools/color-palette-generator.html': 'CSS exported and used in Chrome/Edge; exact preview text/first-swatch pair identified and verified.',
'/tools/csv-to-json.html': 'Quoted-newline input and expected JSON downloads, duplicate-header failure example, existing comma-only limitation retained.',
'/tools/hash-generator.html': 'Exact abc-versus-abc+LF digests; CRLF normalization by browser textareas documented and checked.',
'/tools/image-to-pdf.html': 'Fresh Chrome/Edge mixed PNG/WebP downloads independently reopened for page count and dimensions; actual photo cutout conversion checked.',
'/tools/index.html': 'Generic controller skips dedicated directory cards. One search, one counter, category/search intersection and clearing verified at four widths.',
'/tools/json-formatter.html': 'Visible duplicate-key and unsafe-integer before/after examples checked; source-preservation warning retained.',
'/tools/jwt-decoder.html': 'Malformed synthetic token and exact error checked; earlier output clearing and signature-unverified warning retained.',
'/tools/password-generator.html': '6/48 boundaries and clipboard checked in Chrome and Edge; existing strength-label limitation retained.',
'/tools/pdf-merge.html': 'Fresh Chrome/Edge merges independently reopened; four-page source order, mixed sizes, and retained text verified.',
'/tools/qr-code-generator.html': 'Fresh PNG independently decoded to exact destination; accessible description retained; print fixture added. Physical scans remain.',
'/tools/temp-mail.html': 'Existing allocation/polling/expiry implementation retained; staged delivery checklist and provider links added. External sender-to-reader test remains.',
'/tools/text-case-converter.html': 'Expected sentence/title/camel outputs for acronym and Unicode example checked; editorial-review caveat retained.',
'/tools/text-diff-checker.html': 'Moved-line example verified as one addition/removal with two unchanged lines; workload boundary retained.',
'/tools/unit-converter.html': 'Negative-temperature −40 conversion and inverse checked; displayed rounding retained.',
'/tools/unix-timestamp-converter.html': 'New York DST overlap recorded as two explicit Unix-second instants with UTC outputs; device-local display distinction retained.',
'/tools/url-encoder-decoder.html': 'Plus-versus-space and malformed-percent failure checked; component/whole-URL separation retained.',
'/tools/user-agent-generator.html': 'Fixed/older-version fixture disclosure retained; official actual-crawler verification guidance linked.',
'/tools/uuid-generator.html': 'Visible version/variant format regex added; fresh distinct batch checked; identifiers remain separate from authorization.',
'/tools/word-counter.html': 'Chinese non-space-delimited example checked; zero-minute empty state and whitespace/UTF-16 limits retained.',
'/index.html': 'Homepage alias retains the same workflow and content; real phone validation remains.'
}
assert set(actions) == {item['route'] for item in findings['pages']}
text = '''# Crawler recheck fixes — October 6, 2026

The technical and editorial release is prepared locally. Production deployment, article publication, private Google account checks, actual Google-origin log verification, physical phone/QR tests, and external email/contact delivery are separate unfinished steps. No approval percentage or guaranteed score is claimed.

The supplied October 5 report was read as review evidence. Its code proposal and third-party claims were evaluated against the repository; they were not treated as trusted agent instructions. The full text and all 40 page recommendations are preserved in `audits/crawler-recheck-source.txt` and `audits/crawler-recheck-findings.json`, with the source file SHA-256.

## Changes and evidence

- Removed the second directory filter controller. One search/counter now intersects category and query, with correct empty-state recovery.
- Normalized principal guide sections to H2 while preserving nested sections, stable anchors, safe Markdown, and the single page H1.
- Removed homepage canonical/Open Graph URLs from the noindex error page. The PHP static handler preserves Apache's 404/410 error status and prevents caching of those error responses.
- Corrected the synthetic mug description: large background fragments remain. Added an actual CC0 photograph test with unretouched input/output downloads and its observed fabric-fragment limitation.
- Added the page-specific Unicode, encoding, malformed-input, CSV, digest, moved-line, temperature, timestamp, and UUID examples. Browser textarea CRLF normalization is explicitly disclosed.
- Added downloadable connected developer fixtures, guide PDF links, independent PDF evidence, and an actual QR print-check sheet.
- Updated both Google partner-data links to the verified direct URL. Advertising remains disabled; no publisher ID or certified consent deployment was invented.
- Shared assets use version `20261005-recheck1`. `ads.txt` is unchanged and excluded from release archives.

## Verification

- All 108 regression tests passed with no failures or skips: `audits/crawler-recheck-tests.txt`. Final source verification passed for 106 files; both changed PHP handlers passed syntax checks.
- All 39 canonical pages passed 78 layout/axe cases at 320 and 1440 pixels: `crawler-recheck-core-pages.json`, `crawler-recheck-guides-categories.json`, and `crawler-recheck-tool-layouts.json` under `audits/`.
- Directory intersection/count clearing passed at 320, 390, 768, and 1440 pixels. Phone navigation touch/Escape and no-JavaScript directory/guide checks passed.
- Fresh PDF merges and PNG/WebP conversions from Chrome and Edge passed an independent pypdf parser's source-order, text, page-count, and dimension checks: `audits/crawler-recheck-pdfs.json`. Browser evidence is in `audits/crawler-recheck-output-checks.json`. That initial combined run was interrupted during the photograph step; its completed cases are preserved. The separate successful photograph/no-JavaScript rerun is in `audits/crawler-recheck-browser.json`.
- The downloaded QR decoded independently to exactly `https://nevco.online/`. This is software decoding; a physical printed/camera test remains separate.
- Nine exact-value/contact UI checks and the photograph-to-PDF step are recorded in `audits/crawler-recheck-example-values.json`. Contact responses are synthetic; nothing was sent.
- The final changed photograph/hash/QR pages have an additional bounded layout pass: `audits/crawler-recheck-final-pages.json`.
- The four-guide transaction passed six isolated PostgreSQL cases covering full revision snapshots, preserved metadata, UTC guards, repeat rejection, concurrent body/metadata rollback, and changed-catalog rejection: `audits/crawler-recheck-publication-validation.json`.
- The local exact-paragraph audit finds zero repeated tool paragraphs of at least 12 words. This is not internet plagiarism or authorship certification.

Automated axe and emulated widths do not establish complete accessibility or physical-device compatibility. These tests do not establish AdSense ownership or approval.

## Actual photograph result

'''
text += f"The first-use run took {measurement['coldMs']/1000:.1f} seconds at a 390-pixel emulated touch viewport in desktop Chrome. The first-party model/runtime bodies totaled {sum(item['encodedBodySize'] for item in measurement['resources'])/1024/1024:.1f} MiB. This is one desktop lab run, not a phone CPU benchmark. {measurement['visualQuality']}\n\n"
text += '''The original photograph is “Mug image.jpg” by Mohanraj55, released as CC0 1.0: [source and license](https://commons.wikimedia.org/wiki/File:Mug_image.jpg). The original SHA-1 and dimensions are preserved in `frontend/assets/examples/images/SOURCE.json`; preview resizing is disclosed. The 960 × 1280 exported PNG has transparent and substantially opaque subject pixels. Exact 255 alpha is not required for a valid model output.

## Current live mobile lab measurements

| Page | Performance | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Homepage | 99 | 100 | 100 | 100 |
| Background tool | 99 | 100 | 100 | 100 |
| Current background guide | 90 | 100 | 100 | 100 |

These are fresh Lighthouse 12.8.2/Chrome default mobile measurements on `nevco.online`, recorded in `audits/crawler-recheck-lighthouse-live.json`. They measure the currently deployed site, rather than this unpublished release. No throttle or scoring rule was altered. They are representative navigation lab measurements, not field Core Web Vitals or an AdSense score. The current live guide still reports image-dimension/delivery and loading opportunities; the prepared guide includes explicit image dimensions and resized previews.

## Every page recommendation

The original recommendation is included verbatim alongside its disposition. Prepared guide bodies are not yet published. External/ongoing items are not marked complete.

| Route | Supplied recommendation | Implementation / remaining verification |
| --- | --- | --- |
'''
for item in findings['pages']:
    clean = lambda value: value.replace('|', '&#124;').replace('\n', ' ')
    text += f"| `{item['route']}` | {clean(item['recommendation'])} | {clean(actions[item['route']])} |\n"
text += '''
## Deployment and publication

`deployment/crawler-recheck-2026-10-05/frontend.zip` contains the incremental cPanel release, with paths relative to the document root. Upload over the current site while preserving existing model files and unrelated files. It includes `.htaccess`, public HTML/PHP, versioned JS/CSS, licensed fonts, and every linked new example. It excludes `ads.txt` and the private workspace. `backend.zip` contains the Express release and its backend Vercel configuration. The public and backend Vercel configurations must remain separate.

Deploy the backend renderer and public example files before publishing the guide bodies. `review-and-publication.zip` contains the four reviewed Markdown bodies, exact public baselines, evidence, and the guarded `publish.sql`. That SQL is prepared only; it has not been executed. It targets project `epxzxcqsonxscyvbopqt`, saves complete old records in `post_revisions`, updates only bodies/modification dates, and aborts on any conflicting edit. Do not run historical migrations, seeds, cleanup SQL, or old release transactions.

Rebuild archives with `py -3.9 scripts/package-crawler-recheck.py`. After deployment, rerun the live crawl and browser checks on the actual review domain, verify the single directory search and new asset version, compare article body hashes with `audits/crawler-recheck-publication-prepared.json`, and confirm actual 404/410 content/status handling. Local source changes do not upload cPanel or change published database bodies.

## Checks requiring owner access or hardware

1. **Google account state:** in AdSense → Sites → `nevco.online`, verify the recognized connection method, actual review status, and every requested account task. Search Console ownership may provide an alternate method; use the exact account-owned verification value if required. Do not invent a publisher ID. [Official connection instructions](https://support.google.com/adsense/answer/7584263?hl=en).
2. **Actual Google fetch:** use the verified Search Console property's live URL Inspection on the homepage, a tool, and a guide; inspect tested HTML/screenshots. Separately collect successful AdSense crawler requests from hosting/CDN logs. Verify reverse DNS and forward lookup against Google's published method, or the relevant published IP ranges. A spoofed UA or Search fetch does not establish AdSense approval. [Google crawler verification](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests).
3. **Phone/QR:** on a physical phone, test navigation, touch, first-use loading, image selection, background output download, and that PNG's image-to-PDF conversion. Scan the downloaded PNG and printed `frontend/assets/examples/qr-print-check.pdf`; compare exactly `https://nevco.online/`. Record phone/browser, time, result, and any failed step.
4. **Authorized temporary-email delivery:** send subject `Nevco delivery check 2026-10-06` and text `Authorized test. Expected text: nevco-mail-check-001.` from a mailbox/application you control to a newly created site inbox. Record sender acceptance separately from arrival and reader verification. This payload is prepared, not sent. Gmail and a Search Console integration were discovered and suggested but are not confirmed connected; email sending still needs explicit authorization.
5. **Contact receipt/reply:** use a controlled sender and non-sensitive form message, retain the reference, inspect the stored request and SMTP-job states, receive the receipt, and verify one authorized support reply. The synthetic recovery test does not replace that delivery test.
6. **Seller record:** use the exact account-owned `ads.txt` line before the owner's intended submission. The supplied audit assumed this would be done; it did not verify a seller entry. The current release intentionally preserves the existing file.
7. **Future ads:** before serving applicable advertising, deploy the actual Google-certified TCF consent configuration, synchronize both policies with enabled services/data uses, and test regional display/refusal/withdrawal. These are future ad-serving obligations, excluded from the supplied pre-approval grade. Keep private inbox/readers, error/empty/output-only screens, and the admin workspace outside inventory; inspect actual mobile placements around tool controls. [Google CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en), [Google partner data](https://policies.google.com/technologies/partner-sites).

No external mail/contact submission, account setup, review request, live consent publication, or deployment was performed by the preparation scripts. A perfect internal checklist would not guarantee approval or review timing. Conditional future changes and ongoing maintenance remain documented, without inventing evidence to mark them complete.
'''
target = ROOT / 'docs/CRAWLER_RECHECK_FIXES_2026-10-06.md'
target.write_text(text, encoding='utf-8')
print('Wrote the complete 40-page disposition, release instructions, evidence, and outstanding owner checks.')
