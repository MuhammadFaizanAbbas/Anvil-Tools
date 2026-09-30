# Anvil Tools: AdSense, SEO, accessibility, and operational audit

Current correction status: the focused review's concrete code and wording findings have been fixed locally; 70 regression tests and 111 responsive layout cases passed. Inactive consent choices and their script includes were removed while ads/Analytics remain disabled. Older descriptions of the banner below are historical. Post content/covers are owner-managed and excluded from this fix list. "Ownership verification" refers only to proving control of the website domain to AdSense; it does not require a post-editor field. No post records or domain verification tags were modified.

Latest focused review: [AdSense submission review](ADSENSE_SUBMISSION_REVIEW.md), excluding posts and ownership verification at the owner's request. It supersedes any implication below that CMP installation is required before requesting review: it is not. The checklist below combines application preparation with later ad activation and must not be read as a list of approval prerequisites. The focused review records outstanding tool defects and wording issues; the site is not certified violation-free.

Reviewed September 30, 2026. Scope: 37 static public pages, 20 tool implementations and their instructions, database-backed article delivery/recommendations, 511 publicly published article records, all nine admin panels, authentication screens, and deployment configuration. “ATS friendly” was clarified by the owner to mean search-engine friendly and accessible.

**Status: readiness improvements implemented; not an approval or compliance certification.** Google decides site/account eligibility. This audit does not establish legal compliance in every jurisdiction or WCAG conformance. Ads remain disabled. No publisher ID, Google account eligibility, consent platform configuration, content/image ownership, or Search Console access was supplied or verified.

## Owner-confirmed facts and proposed multi-domain setup

On September 30, 2026, the owner confirmed that Velloxtech is the operator and is a software house; existing Velloxtech contact emails remain in use. About, Privacy, and Terms now state the operator. No registration status or operating country is asserted. The owner prefers not to publish a country; whether further business disclosures are required remains outside this technical audit.

No AdSense account has been added. Google Analytics and a certified CMP are requested as the intended direction, but no domain list, GA4 measurement ID, or account-specific CMP configuration has been provided. Neither advertising nor analytics has been activated.

- For Velloxtech-owned domains, use one publisher account with each site added for review. Google generally permits [one AdSense account per publisher](https://support.google.com/adsense/answer/9729?hl=en); different domain names alone do not justify more accounts.
- Google's CMP allows a message to be assigned to [multiple selected sites in the account](https://support.google.com/adsense/answer/10960768?hl=en). Separate legitimate client publishers should manage their own account/site consent configuration. Reusing frontend code does not transfer CMP configuration or a visitor's consent across unrelated domains.
- Proposed implementation: a deployment-specific or explicitly allowlisted hostname configuration for the canonical origin, GA4 ID, publisher ID, and CMP integration. Unknown domains default to no optional tracking or ads. The current site still has fixed canonical URLs and is not yet configured for this deployment model.
- Proposed analytics default: [basic consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode), loading GA4 only after analytics consent. Advertising consent and analytics consent must be connected and tested explicitly; installing an AdSense message alone is not proof that Analytics is controlled.
- For independent sites, separate GA4 properties are a practical reporting/access choice. For a single experience spanning domains, consider Google's [cross-domain measurement](https://support.google.com/analytics/answer/10071811?hl=en) with a shared web stream only when deliberately needed. Consent sharing is a separate question.

## What the policies mean for this site

| Official source | Requirement or guidance | Site decision / evidence |
| --- | --- | --- |
| [AdSense eligibility](https://support.google.com/adsense/answer/9724?hl=en) and [site readiness](https://support.google.com/adsense/answer/7299563?hl=en) | Useful original content, usable pages, eligible account and control of the site. A working utility is not automatic approval. | Public functions and instructions are the central content. Confirm the account owner and application status in AdSense. No invented minimum traffic, post count, or word count. |
| [AdSense Program policies](https://support.google.com/adsense/answer/48182?hl=en) | No incentivized clicks, deceptive navigation, invalid traffic, or prohibited placements. Publisher remains responsible for the site. | No ad loaders or requests are enabled. Tool buttons and article links remain functional navigation. Owner must review traffic acquisition and any future ad implementation. |
| [Ad placement](https://support.google.com/adsense/answer/1346295?hl=en) | Avoid accidental clicks; ads alongside email messages when those are the main focus are prohibited. | Temporary inbox is excluded from future ad inventory. All existing dormant ad boxes were removed. Never put ads in inbox readers, email messages, the admin workspace, or near copy/download/generate controls. |
| [Screens without publisher content](https://support.google.com/publisherpolicies/answer/11112688?hl=en) | No ads on low-value, unfinished, alert/navigation-only, or empty screens. | No ads on login, password setup, errors, loading states, support forms, empty results, or utility output-only views. Expanded useful guidance does not automatically make any page eligible. |
| [Replicated content](https://support.google.com/publisherpolicies/answer/11190248?hl=en) | Republished material needs meaningful added value; responsibility is not satisfied by changing wording. | Static example blogs were removed previously. Supabase publication status controls live articles. Exact-body uniqueness was checked, but originality and rights still need human review. |
| [Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies) | Scaled content created primarily for rankings, misleading functionality, and other spam are disallowed. | The 511-article library contains repeated topic/title patterns. Do not treat quantity or expanded FAQs as an approval strategy. Review overlapping articles and retain useful distinctions. |
| [Google privacy disclosures](https://support.google.com/publisherpolicies/answer/10437794?hl=en) | Explain data use associated with Google services and relevant cookies/identifiers. | Privacy copy now distinguishes disabled ads from future configuration, local input processing from asset requests, and provider records from browser storage. Update it again to match the actual ad vendors before activation. |
| [EEA/UK/Switzerland consent requirements](https://support.google.com/adsense/answer/13554116?hl=en) and [European regulations messages](https://support.google.com/adsense/answer/10961068?hl=en) | Relevant Google ad serving requires the applicable consent mechanism, disclosures, and certified CMP/TCF integration. | The custom preference banner is **not demonstrated to be a Google-certified CMP**. Do not use its `personalized` boolean as permission to load AdSense. Configure and test the real CMP, including revocation, before monetization. |
| [ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en) | ads.txt is strongly recommended, not an approval guarantee; use your real seller entry. | Current file is comments only. Removed legacy generator behavior that could recreate a fake publisher entry. Owner must supply the verified account line. |
| [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | WCAG provides accessibility criteria independent of AdSense. Normal text generally needs 4.5:1 contrast; target-size rules include exceptions. | Improved text sizing, visible focus, controls, semantic FAQs, and upload keyboard access. Complete contrast, screen-reader, zoom, and assistive-technology testing remains separate from the layout checks below. |

## Changes implemented in this pass

- About now uses Contact's two-column design, a single story card, a team/contact sidebar, clear expectations, and seven accessible FAQs, including keyboard use and network requirements. No invented history, credentials, staff biographies, address, or endorsements.
- Explanatory content uses one reading surface with section dividers, larger body text, constrained line lengths, and mobile padding. Tool widgets remain separate to make the action area easy to find.
- Forty additional tool-specific FAQ answers address result verification, limitations, data formats, account recovery, token trust, OCR, and other actual use cases. Older FAQ markup now uses native `details`/`summary`.
- Added missing file/text labels and keyboard support for all three upload zones. Form controls have readable mobile text; focus indicators (including custom upload controls) and reduced-motion behavior are explicit. Tool status-message elements announce concise feedback through polite, atomic live regions; result bodies are not turned into live regions.
- Removed dormant ad containers from all public HTML, including temporary email. Advertising still has no enabled loader. The legacy generator no longer creates fake ads.txt inventory.
- Added page sharing metadata without fake ratings, authors, FAQ eligibility claims, or unverifiable structured data. The query-based article shell and static 404 page are noindex; canonical published articles remain `/journal/:slug`.
- Updated policy dates, current advertising disclosure, and temporary-email use cases. Added an editorial review guide in Admin → Content.

## Policy coverage and outstanding evidence

Official sources were reopened September 30, 2026. The [AdSense Program policies](https://support.google.com/adsense/answer/48182?hl=en) display an August 4, 2026 update date. Requirements can change; check again before application and activation. Search visibility, accessibility, and ad eligibility are separate assessments.

The [Google Publisher Policies](https://support.google.com/publisherpolicies/answer/10502938?hl=en) also cover prohibited content, intellectual property, deceptive representation, dishonest behavior, privacy, and advertising standards. The review must include published guides and cover images as well as the utilities.

| Review area | Current decision | Evidence still needed |
| --- | --- | --- |
| Prohibited or restricted material | Review every article and media asset; utility categories alone establish no exemption. | Editor records a full-body and image review, including linked destinations. |
| Copyright and attribution | Do not infer permission from a stored image or a unique text hash. | Owner/editor records source, creator, license or permission, and any attribution obligations. |
| Honest functionality | JWT decoding is not signature verification; Base64 is not encryption; image-to-PDF is not OCR. | Functional output checks against each tool's documented examples. |
| Dishonest-use promotion | Keep examples about authorized testing; do not market inboxes or user-agent samples for fraud or unauthorized access. | Review the article library for conflicting instructions and claims. |
| Publisher identity | About describes VelloxTech without invented credentials or partnerships. | Owner confirms operating identity, contact details, and account declarations. |
| Data use | Keep private messages, tokens, files, and generated passwords out of advertising requests and analytics. | Actual vendor settings, retention practices, and network inspection before any tracking is enabled. |
| Audience and distribution | No audience, regional, or account eligibility determination has been made. | Owner checks applicable age/audience settings and territory/account requirements. |
| Traffic and placements | Ads remain disabled; inbox/private/error screens are excluded from planned inventory. | Traffic-source review and browser inspection of any future ad setup, including Auto ads. |

These are review tasks, not claims that the site contains prohibited content. Do not mark a task complete solely because metadata or automated tests pass.

## Public page and route inventory

| Surface | Purpose / review | Ad decision and follow-up |
| --- | --- | --- |
| `/`, `/index.html` | Tool discovery, category navigation, real published recommendations, task workflows. | Disabled. Review any future placement against content and interaction boundaries. |
| `/tools/index.html` | Searchable full tool catalog and starting workflows. | Disabled. Search results must remain useful without ads. |
| Six `/categories/*.html` pages | Email, image, PDF, developer, text, and generator collections. | Disabled. Avoid turning category pages into thin ad landing pages. |
| Twenty `/tools/*.html` pages | Working inputs/outputs plus examples, checks, limits, FAQs, next tools. See individual matrix below. | Disabled. Separate any future reviewed inventory from active controls and user-supplied output. |
| `/about.html` | What the site does, VelloxTech attribution, contact routes, limitations, FAQs. | Keep informational focus. Owner identity details must be accurate. |
| `/contact.html` | Support form, direct addresses, submission disclosure. | Exclude form/success/error areas. Check actual receipt and reply delivery with an owner-controlled mailbox. |
| Privacy, cookie, terms, disclaimer pages | Current processing, storage, support, limitations, choices. | No ads planned. Owner must establish real retention periods, entity/jurisdiction details, and vendors before legal sign-off. |
| `/blog/index.html` | API-driven 30-item pagination, cover images, retry and empty states. | No ads in empty/loading/error states. JavaScript-dependent listing has a dynamic article sitemap, but a server-rendered listing would improve no-JS discovery. |
| `/journal/:slug` | Server-rendered published content with canonical, metadata, safe headings, image alt text, recommendations. | Editorial approval and rights review are required before considering inventory. |
| `/blog/article.html?slug=…` | Compatibility shell fetching a published article. | Noindex; no ads. Share canonical `/journal/…` links. |
| `/blog/posts/*` | Retired hardcoded articles redirect to the live Blogs listing. | No ad inventory or article duplicates. Redirects must be mirrored on non-Vercel hosting. |
| `/journal-images/:id` | Covers are served only for published articles; MIME types and SVG sandbox headers are handled in backend. | Verify image rights and alt-text usefulness, not just presence. |
| `/sitemap.xml`, `/journal-sitemap.xml`, `/robots.txt` | Static/public and dynamic article discovery, private workspace excluded from crawling. | Submit the canonical domain to Search Console. Robots rules do not replace authentication. |
| `/ads.txt` | Comments only until a verified seller account is provided. | Do not substitute a sample ID or claim authorization. |
| Unknown URLs / unavailable articles | Not content destinations. | Keep ad-free and return appropriate error status. Custom helpful error UI can be added separately. |

## Tool-by-tool review and acceptance matrix

All tools have statically readable guidance, FAQs, and four next-tool links. Browser-local means input processing, not absence of asset/font/model network requests. These checks describe the implementation and required acceptance criteria; not every complex file/model/provider scenario was re-executed in this pass.

| Tool | Input / processing | Key acceptance and accuracy check | Remaining limitation / ad decision |
| --- | --- | --- | --- |
| Temporary Email | Server capability + Guerrilla Mail; session storage holds tab access | Create/restore/expiry/error paths are covered by existing tests; do not promise anonymity or provider deletion | **Never ads beside inbox/message content.** Live provider delivery/abuse limits require ongoing monitoring. |
| Background Remover | Local image/model runtime; JPG/PNG/WebP | Keyboard upload, runtime assets, clear loading/error state, inspect edge quality | First model load, memory, hair/glass errors; functional image-quality review remains manual. No ad boxes. |
| PDF Merge | Local pdf-lib | Preserve file order and originals; open output and inspect pages | Forms, signatures, encryption, bookmarks may not survive as expected; OCR is not provided. |
| Image to PDF | Local image decode + pdf-lib | Check orientation, source dimensions and readable output | Image-only pages; no OCR or promised uniform paper size. |
| QR Code Generator | Local QR library | Scan exported code at intended size and confirm exact destination | Static encoded content; not a dynamic destination service. Avoid ads resembling download links. |
| Password Generator | Browser cryptographic random values | Check destination length/character rules and save externally | No vault or recovery. Never capture outputs in analytics. |
| Word Counter | Local text counting | Counts depend on whitespace/Unicode conventions; compare destination | Reading time estimate, not an assessment of comprehension. |
| JSON Formatter | Local JSON parsing | Syntax errors, nested values, proper output | Duplicate keys / large numeric precision can change through parsing; schema validation is not provided. |
| Base64 | Local encoding/decoding | Test round-trip and invalid input; distinguish Base64URL | Encoding is not encryption. Do not expose live secrets. |
| User Agent Generator | Local sample strings | Sample copy and fallback behavior | Samples are not current browser inventory, emulation, or a way to change the browser identity. |
| Color Palette | Local palette generation | Lock/copy/export and preview; check exact foreground/background | Not every swatch combination passes contrast. |
| Unit Converter | Local length/weight/temperature math | 1 km = 1000 m; temperature offsets and rounding | Supported categories only; verify critical uses independently. |
| URL Encoder/Decoder | Local URI/component transforms | Mode selection, escaping, repeated encoding | A readable URL is not a trusted URL. |
| JWT Decoder | Local three-part token decoding | Header/payload and timestamps; malformed input | Does not verify signatures or decrypt JWE. |
| Unix Timestamp | Local seconds/milliseconds/date conversion | Unit selection and UTC/local display | Device clock/timezone affects interpretation. |
| Hash Generator | Local Web Crypto digest | Exact UTF-8 bytes and algorithm | Not password storage or reversible encryption. |
| CSV to JSON | Local quoted-field parser | Consistent columns, commas/quotes, header behavior | Inspect field types and preserve identifiers/leading zeros. |
| Text Case | Local transformation | Case modes and original preservation | Review brands/acronyms; no translation or grammar check. |
| Text Difference | Local line comparison | Added/removed lines, limits, safe text rendering | No rich document formatting; moves may show as add/remove. |
| UUID Generator | Browser random version 4 IDs | Format, requested count, copy | IDs are not authorization; enforce uniqueness in storage. |

## Admin and account panel inventory

All workspace/account screens must stay ad-free and noindex. Authentication and role checks, not crawler exclusions, protect data. Admin APIs are excluded from indexing.

| Panel | What it manages | Policy/accessibility responsibility |
| --- | --- | --- |
| Overview | Tool/article counts, connectivity and shortcuts | Do not present tracked tool events as verified unique visitors. Explain unavailable data. |
| Tool library | Database catalog, status/name edits, public links, missing registration labels | Database edits do not rewrite static tool copy. Keep descriptions accurate and repair registrations without overwriting counters. |
| Content | Drafts/publishing, body, excerpt, cover, alt, categories/tags, SEO, revisions | Use the new pre-publication guide. Verify originality, rights, claims and mobile reading. No arbitrary word-count gate can certify quality. |
| Media library dialog | Uploads, covers, reuse, pagination | Confirm image rights, useful alt text and crop; do not upload personal data or unrelated private assets. |
| Analytics | Recorded tool activity and category mix | Browser analytics remains disabled; counters are not proof of human/valid ad traffic. No input/output text in event payloads. |
| Contact inbox | Support messages, delivery history and replies | Personal communication; no ads. Verify recipients, avoid exposing messages outside authenticated UI, determine retention/deletion process. |
| Team & access | Create accounts and grant/revoke roles | Share temporary passwords securely; least privilege; server role enforcement. Not a public sign-up surface. |
| Categories | Article taxonomy | Use meaningful topics; avoid doorway categories generated only for search queries. |
| Audit log | Recorded access/editorial activity | Operational evidence, not legal certification. Keep private. |
| Settings | Read-only integration status | Does not configure certified consent or approve advertising. Use actual vendor consoles for those tasks. |
| Login / setup-password | Account/session access | Noindex, no ads, readable labels, errors that do not disclose credentials. Verify valid/expired sessions and owner-controlled recovery flows. |
| Mobile navigation | Hamburger, section selection, Escape and focus handling | Previous Edge checks cover nine panels at seven sizes; retain them after changes. |

## Published article audit: substantial remaining editorial work

The read-only production scan found **511 published articles**. None had an empty body, missing excerpt, missing cover alt text, or an exactly duplicated normalized body. None fell below the internal 150-word triage threshold. This is not an AdSense word-count requirement and does not prove quality.

The title inventory and sampled introductions contain many variations around the same tasks and repeated editorial patterns. That is a **risk requiring review**, not a finding that Google has classified the site as spam. Review whether each page adds a distinct useful example, tested workflow, or explanation. Consolidate genuinely redundant articles with an intentional canonical/redirect plan. Do not bulk rewrite them into more boilerplate or invent hands-on experience. No live article was modified or unpublished in this audit.

Every article is listed in [the published-content register](audits/PUBLISHED_CONTENT.md). [Machine-readable results](audits/published-content.json) contain limited public excerpts and flags. Before applying, an editor must assess full bodies, claims, relevance, source/image rights, and overlap. API metadata checks cannot perform that judgment.

## Evidence and verification boundaries

- `node scripts/check-public-layout.js`: 37 public pages × 320/768/1440px = 111 cases; no page-wide overflow, missing H1, unlabelled inputs, or images missing alt attributes in the checked static DOM. Tool scripts are intentionally omitted in this layout check; it does not certify functioning downloads, external mail, image processing, contrast, or screen-reader behavior.
- [Desktop About capture](audits/about-1440.png) and [mobile About capture](audits/about-320.png) are local previews, not a claim about deployment status.
- `node scripts/audit-published-content.js`: reads all published API pages and article bodies; no production mutations.
- `npm test`: 65/65 tests passed on September 30, 2026. Existing tests cover authentication, published/draft boundaries, recommendations, metadata escaping, supported new tool logic, mail-provider failures, and contact handling. After the follow-up markup changes, all three public-readiness tests passed again.
- `npm run verify`: JavaScript syntax and local script references passed for 97 files. The initial sandbox attempt could not spawn Node child processes (`EPERM`); the successful run used the approved execution path.
- These checks do not validate an AdSense account, privacy law applicability, certified CMP behavior, real-user metrics, traffic sources, editorial originality, or all assistive technologies.

## Before an AdSense application or ad activation

1. Owner: supply application status/rejection reason and confirm account eligibility and control of the canonical site. No account was created or application submitted here.
2. Editor: complete the 511-article review register, especially overlapping topic variants; verify image/source rights and all current tool claims. Improve or unpublish weak material deliberately.
3. Owner: identify the actual operating entity/contact details, supported regions, data vendors and retention/deletion practices. Align the policy with those facts; no addresses, retention promises or legal bases were invented.
4. Owner/implementer: configure an appropriate Google-certified CMP and required regional messages, with revocation and testing for consent/rejection. The current custom preference UI is not a substitute. Review other applicable regional privacy choices separately.
5. Implementer: use the verified publisher/account code and real ads.txt entry. Keep the inbox, private panels, login, support, errors and empty states excluded; inspect any future Auto ads exclusions and manual placements. Do not enable ads merely because a boolean preference exists.
6. Owner: check Search Console, crawlability, mobile experience, canonical domain, and index coverage. An accessible sitemap does not mean every page is indexed or approved.
7. QA/editor: test all file outputs and provider workflows with owner-controlled non-sensitive samples, then perform keyboard, screen-reader, contrast and zoom testing. Confirm support receipt/reply delivery.
8. Owner: request review in AdSense and track actual feedback. Continue monitoring policy center, invalid traffic, third-party changes, and content after approval.

## Maintenance and deployment

Sitemap entry point: `/sitemap-index.xml`, referenced by `robots.txt`. It links `/sitemap.xml` (35 canonical static public pages) and the existing `/journal-sitemap.xml` route (published articles). Run `npm run sitemap` after adding or removing public pages; it reads canonical links, excludes noindex/redirect/error/private pages, and rejects mixed canonical domains. XML parsing and all 35 local page destinations were checked, and the four relevant tool/public-readiness tests passed. These files are local until deployed. Submit the deployed index URL in Search Console. For other domains, align page canonicals and the backend site origin before generating and deploying their sitemaps.

`py -3.9 scripts/expand-content.py` now calls the public-content refinement pass. The About template and specific FAQ data live under `scripts/site-generator/`. Do not run the legacy full-site generator over a production-ready tree without reviewing its output: it still contains historical tool templates and is not the source of the live database article library.

Frontend: `MuhammadFaizanAbbas/Anvil-Tools`. Backend: separate `MuhammadFaizanAbbas/Anvil-Tools-Backend` checkout in `deployment/backend-repo`. A frontend push does not deploy backend changes. The article stylesheet change has been mirrored into that local backend checkout and its JavaScript syntax checked. Deploy the frontend assets before the backend starts referencing the new stylesheet. Keep secrets/configuration out of commits. No schema migration is required for this pass. This continuation did not commit, push, or deploy either repository.
