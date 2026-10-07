# Risk matrix and page-by-page recheck — October 7, 2026

The supplied risk matrix and attached improvement matrix were checked against the maintained sources and all 43 public pages on both `nevco.online` and `anviltools.vercel.app`. All 86 page requests returned HTTP 200. The duplicate `/index.html` route redirects to `/` with 301 on nevco and 308 on Vercel. These HTTP observations describe the live release before the local improvements below are deployed.

The attachment's current/target numbers are subjective diagnostics, not Google scores. No new score or approval probability is assigned. The eight-article library already contains four distinct guides and four reproducible experiments; creating ten clusters or additional articles solely to meet an arbitrary count is unnecessary.

| Risk | Checked evidence and operating rule | Status |
| --- | --- | --- |
| Scaled or AI-first publishing | Four distinct guides and four experiments with inputs, results, screenshots, dates, and limitations. About discloses AI-assisted writing. Its disclosure now comes from a reusable template so refinement preserves it. Publish only reviewed useful changes, retain observed evidence, and obtain actual human review before describing a page as human-tested. | Evidence present; named human sign-off is not established by this check. |
| Temporary email | Tool, category, catalog, FAQ, and local guide restrict use to authorized, non-sensitive tests or permitted messages; provider retention and recovery limits are explained. The live guide still has the older signup-focused title/introduction. | Tool wording verified live; the prepared authorized-use guide update still needs database publication. |
| User-agent strings | Fixed older sample versions are dated; the tool distinguishes parser fixtures from responsive browser tests and verified crawler identity and links Google's verification instructions. Terms now explicitly require authorized testing and prohibit evasion. | Current tool safeguards verified live; stronger Terms prepared locally. |
| JWT, hashes, and passwords | JWT sample is fictional and expired, decoding does not verify signatures, hashes are separated from password storage, and generated passwords use browser randomness. Contact's notice now explicitly excludes live tokens, recovery codes, private mail, and confidential files. | Defensive examples verified; updated contact/Terms wording prepared locally. |
| Ad placement | No ad markup was found across the 86 live HTML responses. The generator emits no ad slots. At launch, allow units only after substantial explanatory content on reviewed editorial pages; exclude inboxes, messages, private/login, empty, result-only, and error screens. Keep controls clear. | Advertising disabled; actual placements must be tested before activation. |
| Invalid traffic | No current advertising is loaded. Never click your own ads, encourage clicks, use click exchanges, fabricate impressions, or buy approval traffic. Use ad-free staging and official preview tools; monitor real traffic once ads are active. | Future operating rule; traffic acquisition and the AdSense account were not inspected. |
| Deceptive navigation | Current buttons perform tool actions and links navigate; no ad boxes masquerade as controls. Future ads must have clear labels and spacing and must never occupy an expected action-button location. | Current inactive-ad state verified; future layout remains a launch check. |
| Copyright | Synthetic PDFs, fixtures, actual tool screenshots, CC0 mug attribution, vendor licenses, and font licenses have source records. The companion provenance inventory records hashes and origin evidence without inventing a reuse license. | Fixture origins recorded; original rights evidence for the four existing journal covers is still unconfirmed. |
| False authorship | Articles identify VelloxTech's editorial team, preserve publication dates, and show review dates only for the reviewed version. About explicitly distinguishes automated checks and AI-assisted inspection from a named human review. | No invented writer, credential, headshot, or human sign-off was added. |
| Privacy mismatch | Text/file tools process input locally; asset downloads, jsDelivr processing-code requests, provider-backed inboxes, and support/backend storage are disclosed separately. Cookie wording now gives each actual browser-storage entry's purpose and removal/expiry behavior. | Implementation/disclosure boundaries checked; duration clarification prepared locally. |
| Thin category pages | All six categories have different task comparisons, workflows, examples, and limitations. Developer and text categories now link directly to relevant recorded experiments. | Existing substantive copy verified; additional evidence links prepared locally. |
| Keyword stuffing | The exact phrase “free online tool” occurs zero times in the checked live main content. Main headings and examples describe actual tasks. Repeated navigation/footer text was excluded from this phrase check. | No finding in this limited check; the phrase count alone is not a complete Search spam assessment. |

Google's [scaled-content and keyword-stuffing policies](https://developers.google.com/search/docs/essentials/spam-policies) focus on manipulative or low-value practices; AI assistance alone does not establish a violation. Its [AdSense Program policies](https://support.google.com/adsense/answer/48182?hl=en), [invalid-traffic guidance](https://support.google.com/adsense/answer/16737?hl=en), and [privacy-disclosure policy](https://support.google.com/publisherpolicies/answer/10437794?hl=en) support the advertising operating rules above. These checks do not certify all content rights, traffic, privacy operations, or Google approval.

The page matrix below distinguishes observed content from remaining enhancements. Rows marked **local improvement** require deployment; database body updates require publication separately. An optional enhancement is not represented as an AdSense prerequisite or as completed work.

| Page | Current evidence, local change, or remaining enhancement |
| --- | --- |
| `/` | **Local improvement:** three task-based guide groups and a visible testing/process link supplement the existing image/PDF workflow and privacy boundary. |
| `/index.html` | Permanent redirect verified on both hosts; excluded after sitemap rebuild. Do not add content or ads to this route. |
| `/tools/index.html` | Search, category filter, count, comparisons, and no-JavaScript cards already exist. **Local improvement:** direct workflow links and a dated directory-copy update. |
| `/categories/developer-tools.html` | Distinct transformation comparison and synthetic record. **Local improvement:** JSON/CSV experiment links and UUID authorization/uniqueness boundaries. |
| `/categories/email-tools.html` | Inbox/alias/permanent-mail comparison, permitted workflow, provider terms, access/retention separation, and responsible-use guide already exist. |
| `/categories/generators.html` | Output choices, randomness/credential boundaries, QR scan evidence, print fixture, and limits already exist. |
| `/categories/image-tools.html` | Format/model-download limits, synthetic example, licensed photograph, actual imperfect output, and guide link already exist. |
| `/categories/pdf-tools.html` | Merge versus image conversion, mixed sizes, protected files, page checks, and guide link already exist. |
| `/categories/text-tools.html` | Unicode/acronym, count-rule, whitespace, and moved-line examples exist. **Local improvement:** direct Unicode experiment link. |
| `/about.html` | Real operator, AI assistance, reproducible automated checks, and correction route. **Local improvement:** persistent disclosure and factual October 7 correction note; no invented human reviewer. |
| `/contact.html` | Form persistence/privacy notice and sample-data guidance exist. **Local improvement:** bug/abuse/correction subjects, explicit secret exclusions, and honest response/delivery expectations. |
| `/privacy-policy.html` | Local processing versus asset/network/provider requests, Guerrilla Mail, Supabase, support records, and future advertising disclosures exist. No fixed provider/log retention promise was invented. |
| `/terms-of-service.html` | As-is limits, provider boundaries, and IP wording exist. **Local improvement:** explicit permitted-use rules for sensitive tools and permission-to-process/rights-reporting guidance. |
| `/cookie-policy.html` | Actual storage names and inactive advertising are disclosed. **Local improvement:** purpose/duration/removal table for `tm_cap`, `anvil_admin_session`, and unused legacy `anvil_consent_v1`. |
| `/disclaimer.html` | Output checks, source preservation, service limits, and useful guide links already exist. |
| `/blog/index.html` | Eight distinct articles, workflow choices, featured experiments, and static fallback cards exist; successful server rendering supplies article bylines/dates. Ten thin groups are not added to an eight-article library. |
| `/tools/background-remover.html` | Synthetic before/after, licensed photo/source, model output, format/privacy limits, and known edge failures exist. A newly measured numeric quality rubric remains optional. |
| `/tools/base64-tool.html` | Standard/Base64url boundary, Unicode round-trip, text-only limitation, and encoding-not-encryption guidance exist. A general file-size guarantee is not established. |
| `/tools/color-palette-generator.html` | Contrast preview, contrast limitations, swatch roles, locking/copy/export guidance exist. The UI does not certify every palette; a recorded color-vision example remains optional. |
| `/tools/csv-to-json.html` | Comma-only parser, quotes/newlines, duplicate headers, leading-zero strings, malformed rows, and experiment link exist. Spreadsheet formula-safety testing remains an additional enhancement. |
| `/tools/hash-generator.html` | SHA-256/384/512, known digest and line-ending examples, representations, and password-storage distinction exist. Do not position this tool for cracking or recovery. |
| `/tools/image-to-pdf.html` | Supported formats, ordering, pixel/page-size relation, transparency/OCR limits, downloadable output, and independent reopening evidence exist. Full metadata/tagged-PDF behavior is not certified. |
| `/tools/json-formatter.html` | Malformed input, duplicate-key and large-integer changes, schema/business-rule limits, source-copy warning, and experiment exist. More large-payload/redaction cases remain optional. |
| `/tools/jwt-decoder.html` | Fictional expired sample, decode-versus-verify warning, malformed-token error, timestamps, and authorized debugging guidance exist. No live credential is requested for a test. |
| `/tools/password-generator.html` | Browser randomness, supported length/classes, no-input-upload behavior, rough strength-label limit, and password-manager guidance exist. A rigorous entropy study is not claimed. |
| `/tools/pdf-merge.html` | Whole-file order, source PDFs, reopened output, protected-file constraints, and bookmark/form/signature limits exist. Do not claim universal preservation or password bypass. |
| `/tools/qr-code-generator.html` | Destination/scan/contrast/border guidance, independently decoded PNG and print fixture exist. Physical print scans and all device/error-correction combinations remain unverified. |
| `/tools/temp-mail.html` | Authorized-use warning precedes inbox controls; provider retention, expiry, durable recovery, and anti-evasion boundaries are visible. Keep the entire inbox/message screen out of ad inventory. |
| `/tools/text-case-converter.html` | Before/after style examples and acronym/locale limitations exist. More recorded script and whitespace fixtures remain optional. |
| `/tools/text-diff-checker.html` | Line-based changes, moved-line/whitespace limits, accessible text output, workload cap, and privacy boundaries exist. More normalization/assistive-technology examples remain optional. |
| `/tools/unit-converter.html` | Scale/offset examples, finite-input rejection, units/rounding/range caveats exist. Outputs do not establish professional fitness. |
| `/tools/unix-timestamp-converter.html` | Explicit seconds/milliseconds, UTC/local time, invalid input, range/device-time caveats, and guide link exist. Additional recorded DST/leap-second cases remain optional. |
| `/tools/url-encoder-decoder.html` | Component/full-URL distinction, Unicode/reserved characters, plus/space guidance, malformed-input handling, and destination caution exist. Decoding does not validate a redirect's safety. |
| `/tools/user-agent-generator.html` | Authorized parser fixtures, dated fixed versions, real-browser distinction, and official crawler-verification link exist. No evasion technique is supplied. |
| `/tools/uuid-generator.html` | Version 4 marker example, randomness, collisions/unique constraints, and identifier-not-authorization guidance exist. Additional storage-index comparisons remain optional. |
| `/tools/word-counter.html` | Whitespace words, UTF-16 character units, approximate reading time, emoji/language limits, and recorded experiment exist. No universal linguistic accuracy claim is made. |
| `/blog/json-formatter-edge-cases.html` | Fixed inputs, browser/version/date record, expected/observed values, precision/duplicate-key scope, results download, and tool link exist. |
| `/blog/csv-quotes-unicode-and-blank-fields.html` | Thirteen recorded cases cover BOM, headers, quotes, newlines, malformed rows, and delimiter mismatch. A spreadsheet formula-injection experiment has not been recorded. |
| `/blog/word-counter-unicode-experiment.html` | Twelve measured cases state the counting rule and cover emoji, accents, Chinese, separators, punctuation, and paragraphs. |
| `/blog/jpeg-png-webp-to-pdf-test.html` | Synthetic shared illustration, format/output matrix, size/transparency limits, actual PDFs, and independent page inspection exist. |
| `/journal/best-practices-for-background-removal-when-working-with-design` | Live guide includes synthetic and CC0 examples and actual edge failures. A measured numeric rubric is optional; rights evidence for its existing cover is still needed. |
| `/journal/simple-pdf-workflow-without-software` | Live guide includes ordering, page-size, OCR/accessibility, source preservation, and output checks. Existing cover rights evidence is still needed. |
| `/journal/small-tools-that-save-developers-time` | Live guide includes fictional connected CSV/JSON/Base64/hash workflow and downloadable expected values; no live credentials in the examples. Existing cover rights evidence is still needed. |
| `/journal/best-practices-for-temporary-email-when-working-with-signups` | **Remaining publication:** replace the old signup-focused title/introduction with the prepared authorized-use source and metadata, preserving slug/cover/publication date and saving a revision. Existing cover rights evidence is still needed. |

Advertising setup follows the [agreed launch timing](ADSENSE_FOUR_POINT_RECHECK_2026-10-07.md#requested-follow-up-and-advertising-timing): add the real ad code after approval, update Privacy/Cookies and install/test the certified CMP after approval and before turning on ads. This follow-up does not add an ad loader, seller declaration, verification value, or consent deployment.

Evidence:

- [Live page content and duplicate-home redirects](audits/risk-matrix-live-2026-10-07.json).
- [Local content inventory after the improvements](audits/risk-matrix-local-content-2026-10-07.json).
- [Fixture, illustration, and existing-cover provenance inventory](audits/risk-matrix-asset-provenance-2026-10-07.json).
- [Local layout, links, disclosure preservation, and regression verification](audits/risk-matrix-verification-2026-10-07.json).

Verification passed all 14 relevant regression tests, 24 layouts across the eight changed pages at 320/768/1440 pixels, three JavaScript-disabled guidance checks, and 255 local link references. The browser checks found no horizontal overflow, automated axe violations, or ad requests. All four modified Python sources passed syntax parsing, and an isolated refinement run preserved the reusable editorial disclosure and new guide sections. Axe incomplete checks remain in the report for manual review. The existing responsive homepage illustration and its dimensions were retained.

These local improvements have not been pushed or deployed in this follow-up. The October 7 temporary-email article transaction remains a separate prepared database release; historical SQL must not be rerun or described as applied.
