# AdSense submission review: public tools and site pages

Reviewed September 30, 2026. This review excludes blog/posts and the ownership verification tag at the owner's request. No posts, verification tags, production records, or public site code were changed during this review.

## Verdict

### Follow-up correction status

The concrete code/content findings below have now been corrected locally: bounded password randomness and length validation, tool-specific result instructions, removal of generic input advice, consistent inactive-advertising disclosures, more precise temporary-mail privacy/access wording, removal of unused consent controls, QR error handling, clipboard-failure feedback, and finite-number validation for unit conversion. The original findings remain below as the historical record of what was found, not a list of still-open defects.

Ownership verification means **website/domain verification in AdSense**, not a verification field on each post. Post text, covers and editorial updates are managed by the owner and excluded from this correction checklist. No extra ownership field was added to the post editor. Shared footer/banner markup was updated on article pages without changing post records or bodies.

Validation: all 70 regression tests passed, including five new failure-path tests (password boundaries/classes, invalid password options, QR errors, numeric input, and eight clipboard handlers). The password boundary reproducer now returns the requested 16 characters. The correction pass was rerun without producing further changes. Public layout checks passed 37 pages at three widths (111 cases). These are local results; the earlier live snapshot still represents the previous deployment. Real-device file/model performance and email delivery are not certified by these checks.

**No obvious prohibited-content or active ad-placement violation was identified in the inspected non-post surfaces. However, the site is not issue-free: fix the specific quality and accuracy findings below before submitting if possible.** These findings are not a declaration that Google has found a violation, nor are they all mandatory application prerequisites. Google determines approval and content value. Excluding posts from this review does not exclude them from Google's review of the live site.

CMP installation is **not a prerequisite to requesting review**. Google's [site submission instructions](https://support.google.com/adsense/answer/12169212?hl=en) mark CMP selection optional after the review request. Analytics is not an approval prerequisite. Neither should be represented as a blocker for this submission review.

## Confirmed findings

| Priority | Finding and evidence | Recommended action / policy relationship |
| --- | --- | --- |
| Fix | Password generator has an out-of-range random index. `frontend/assets/js/tools/password-generator.js` divides a Uint32 by `0xffffffff`, so the maximum valid value produces index `max`, outside a string of length `max`. A deterministic reproduction using maximum random values produced length 0 for requested length 16. Normal occurrences are rare; the reproduction forces the boundary, not typical behavior. | Use a correctly bounded, preferably rejection-sampled random integer. Check requested length and selected character classes. This is a functional/security-quality defect, not evidence of an AdSense enforcement action. |
| Fix | All 20 tool pages repeat instructions to copy or download results using controls above. Word Counter and Unit Converter do not provide those buttons. Password Generator also repeats advice about trying smaller/full input despite not taking source text. | Replace generic filler with instructions matching the actual controls. Google asks for useful content and understandable navigation; repeated text is not automatically spam, but inaccurate boilerplate reduces usefulness. |
| Correct | Cookie policy says personalized advertising may happen unless the visitor opts out where required, while other copy promises consent before nonessential storage. It also generically claims cookies are used without identifying the actual cookie/storage behavior. | Describe the currently disabled state and actual necessary storage consistently. Before ads are enabled, align the wording with the selected vendors and consent behavior. Present consent requirements accurately rather than using generic opt-out language. |
| Correct | Temporary-mail FAQ says the address is not tied to identity, while the privacy policy acknowledges provider processing of IP/user-agent and server-side access records. The phrase about permanent abandonment and no recovery is stronger than what the browser code can guarantee; switching addresses sends a best-effort invalidation request and does not prove provider deletion. | Say no public account is required, avoid implying anonymity, distinguish losing access in this interface from provider retention, and remove unsupported universal claims. The existing newer FAQ already correctly says new addresses do not guarantee provider deletion. |
| Cleanup | All 35 inspected non-blog HTML pages expose inactive analytics/advertising preference controls. No active Google advertising/Analytics script loader was found in those page responses or first-party tracking code reviewed. | Remove unused choices or defer them until the relevant integration exists. Their presence is confusing, but is not established here as a standalone policy violation or an approval requirement. |
| QA | QR generation lacks an error handler for a missing QR library or an input too large for the library. Several copy buttons lack clipboard-failure feedback. File/model workflows have not been fully exercised on real mobile devices in this review. | Add clear failure states and test representative file outputs. These are usability findings, not a blanket statement that tools are broken. |

Password reproduction: `node scripts/reproduce-password-boundary.js`. It uses a mocked random source and no real passwords or network. Do not use the mocked generator in production.

## Live technical evidence

`node scripts/review-live-public.js` checked 35 non-blog HTML pages (including the error page), 32 distinct local JavaScript/CSS URLs, and same-origin link/file targets. [Raw results](audits/live-submission-review.json):

- No unexpected page response failures.
- No missing local link/file targets in the checked scope. Blog/article links and dynamic article/image routes were deliberately excluded.
- All 32 checked JavaScript/CSS URLs returned HTTP 200.
- An unknown live URL returned HTTP 404.
- Every inspected page links to the privacy policy.
- No directly embedded Google advertising/Analytics loader found in the inspected HTML. This is not a complete browser network trace or third-party supply-chain audit.
- Admin index/login are noindex in source and are absent from public sitemaps. The prior release's 65-test suite passed, including authentication and role boundaries; no authenticated panel session or support email delivery was exercised in this review.
- Prior responsive evidence covers 37 public pages at 320/768/1440px. That is layout evidence, not a claim of WCAG certification or functional coverage for every tool.

## Tool-by-tool assessment

All 20 tool page URLs and their local scripts were checked. The code review covers their top-level implementations, not a full audit of bundled libraries. Shared boilerplate/consent findings above apply across tools.

| Tool | Assessment / limits |
| --- | --- |
| Temporary email | Receive-only interface; provider and access limitations disclosed but anonymity/recovery wording needs correction. Keep inbox/message views excluded from future ads. No live mailbox created in this review. |
| Background remover | Local runtime/model paths, allowed file types, progress, timeout and errors present. Real model output quality and mobile memory use remain unverified here. |
| PDF merge | Local merge and download, dependency and invalid-file errors present. Review outputs for page order, forms and signatures; no guarantee of preservation. |
| Image to PDF | Local image decode and PDF output, format conversion and errors present. Produces image pages, not OCR text. Device/file testing remains necessary. |
| QR generator | Local static QR output; check actual scan results. Oversize-input/library-failure feedback needs improvement. |
| Password generator | Cryptographic source is used, but bounded integer conversion has the confirmed defect described above. |
| Word counter | Whitespace-based words, JavaScript string length, punctuation-based sentence approximation. Useful limitations present; remove references to nonexistent export controls. |
| JSON formatter | Syntax parsing and pretty/minified output; duplicate keys and large-number limitations disclosed. Does not validate business rules or schemas. |
| Base64 | Local UTF-8 text encoding/decoding and invalid-input feedback. Not encryption; clipboard rejection not caught. |
| User-agent generator | Static sample browser/bot strings; not browser emulation or authentication. No direct unauthorized-access mechanism identified. |
| Color palette | Local palette, locking, copying, CSS export, contrast preview. Preview contrast does not certify every pair of swatches. |
| Unit converter | Supported length/weight/temperature formulas present. Invalid/empty numeric input is coerced to zero; improve validation and remove export-control claims. |
| URL encoder/decoder | URI and component modes with malformed-input feedback. Decoding is not a trust/safety check. |
| JWT decoder | Local header/payload inspection, malformed-token handling and explicit signature-not-verified notice. Not a token validator or JWE decryptor. |
| Unix timestamp | Seconds/milliseconds and date conversions, UTC/local choices, invalid-range handling. Depends on device timezone for local output. |
| Hash generator | Local Web Crypto digest; not reversible encryption or password-storage infrastructure. |
| CSV to JSON | Quoted fields, consistent column counts, unique headers; values remain strings. No backend upload in tool code. |
| Text case | Local transformations; locale and acronym limitations need editorial judgment. |
| Text difference | Local line comparison and workload limit; output uses text nodes. No rich-document comparison claim established. |
| UUID generator | Random v4 generation/fallback, count validation and export. IDs do not grant authorization. |

## Other pages and panels

| Surface | Conclusion |
| --- | --- |
| Home, catalog, six category pages | Public navigation and local targets checked; no ad loader detected. Generic repeated copy should not substitute for useful task-specific content. |
| About and Contact | Operator and contact paths present. Actual mailbox receipt/replies not tested; no messages sent. |
| Privacy, Cookies, Terms, Disclaimer | Accessible and linked. Privacy/cookie wording corrections identified above. Their existence alone does not establish legal compliance or Google approval. |
| Sitemap and robots | Existing index links static and dynamic maps; public crawl directives and admin exclusion present. No Search Console access or indexing guarantee. |
| Admin overview, tools, content, analytics, contacts, team, categories, audit, settings | Operational/private surfaces, not intended ad inventory. No new authenticated session review; prior regression evidence applies. |
| Login and error pages | Noindex/ad-free intent; unknown URLs correctly return 404. |
| Posts and ownership verification | Intentionally excluded and left to owner. |

## Policy interpretation and boundaries

- [AdSense Program policies](https://support.google.com/adsense/answer/48182?hl=en): legitimate navigation, valid traffic, and appropriate placements matter. No ads inside email or where email/private communications are the primary focus. A temporary-mail utility is not automatically evidence that the entire site violates policy; its inbox must not be treated as ordinary ad inventory.
- [Google Publisher Policies](https://support.google.com/publisherpolicies/answer/10502938?hl=en): prohibited content, deceptive claims, unauthorized activity, and intellectual-property abuse remain relevant. No obvious such promotion identified in the inspected non-post utility interfaces. Source/image/library rights were not independently established.
- [Site readiness](https://support.google.com/adsense/answer/7299563?hl=en): useful original content and usable navigation matter. A tool site has no automatic exemption or guaranteed acceptance. Passing URL checks does not settle the value assessment.
- [Privacy disclosures](https://support.google.com/publisherpolicies/answer/10437794?hl=en): actual data use must match disclosures. This is why the conflicting wording is worth correcting; adding unrelated banner controls does not establish compliance.
- [Low-value inventory](https://support.google.com/publisherpolicies/answer/11112688?hl=en): ad eligibility requires publisher value; do not place ads on empty, alert-only or unfinished states. This review found no active ads to evaluate for placement.
- [Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies): repeated wording is not itself proof of spam. Avoid padding and functionality claims that do not match the product. Search policy compliance is not an AdSense approval certificate.

Account eligibility, traffic acquisition/invalid traffic, legal rights, actual retention operations, all device behavior, future ad placements, and Google account review status cannot be certified from these code/HTTP checks. No requirement for Google Analytics, an arbitrary post count, an arbitrary word count, or an unsolicited public country block is imposed by this report.

**Current decision:** the identified tool/content/disclosure fixes are implemented locally and regression-tested. Deploy them before relying on these corrections on the live site. A CMP is not the submission blocker. The owner handles posts and domain verification separately; approval remains Google's decision.
