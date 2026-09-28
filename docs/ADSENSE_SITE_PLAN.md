# AdSense site, content, and launch plan

Research and repository review: 28 September 2026.

Status: implementation plan, not a certification or a report that the website has already been fixed. Companion document: [Supabase and Railway architecture](SUPABASE_RAILWAY_ARCHITECTURE.md).

## 1. Decisions to build around

Build a useful, trustworthy website around the existing 12 tools. Use a shared Railway application and Supabase for publishing, administration, analytics, and operations across approved domains. Keep suitable calculations and sensitive transformations in the browser. Publish substantial public HTML that both visitors and crawlers can read.

**No one can promise 100% or 101% AdSense approval.** Google reviews the actual site and account; approval also does not end the obligation to comply. This plan addresses the published requirements and the problems visible in this repository. It cannot replace Google's decision. [Eligibility][G4] and [site review][G13].

There is **no numerical minimum article count, word count, traffic level, or universal waiting period specified in the general eligibility/readiness pages reviewed**. Do not invent one. Our proposed editorial milestone is **12 substantial guides, one for each tool**, alongside 12 complete tool pages. This is a project coverage target, not Google's requirement or a promise that 12 articles are sufficient. The four existing articles can contribute after review and improvement. [Readiness guidance][G5].

“ATS friendly” normally refers to applicant tracking systems for résumés. Here, the relevant objective is **crawler-accessible, semantic, accessible HTML**. There is no ATS approval score for this site. Serve the same substantive content to people and search engines; do not create hidden text or a special approval-only version. [Search spam policies][G10].

Assumptions for planning: English public content, ordinary web display ads, one operator managing several sites, no public comments or public upload gallery at launch, and no children's service. These are proposed scope decisions. Confirm actual operator details, audience, geography, providers, and domains before launch.

The AdSense applicant must be at least 18. If the site operator is younger, Google's guidance allows a parent or guardian to apply using their own account and receive payments. The applicant must control the submitted site's HTML and use accurate account information. [Eligibility][G4].

## 2. What was reviewed and what remains conditional

The review covered the full substantive sections of the AdSense Program policies, Google Publisher Policies, Google Publisher Restrictions, and ad placement policies, plus the linked sources below for eligibility, quality, consent, crawling, site review, and inventory authorization. The Program policies page reviewed showed an update of 4 August 2026. Policies can change; retain a dated review record and check again before submission. [Program policies][G1] and [change log][G19].

The following is an applicability inventory, not a reproduction of Google's policy text:

| Policy family reviewed | Coverage and project applicability |
| --- | --- |
| Publisher content | Illegal activity; intellectual property; dangerous/derogatory material; animal cruelty; misrepresentation; dishonest behavior; sexual content/compensation; marriage brokerage; adult themes in family material; child exploitation. Review editorial material, images, links, and any future public submissions. |
| Publisher behavior | Accurate declarations, unobstructed interactions, useful original inventory, supported language. Applies to every monetized screen. |
| Publisher privacy | Personalization, disclosures, Google-domain cookies, identification, precise location, children's treatment. Scope depends on actual audience/data practices. |
| Other publisher standards | Search spam, abusive experiences, malware/unwanted software, Better Ads Standards, authorized sellers, sanctions. Applies throughout the deployment. |

Source: [Google Publisher Policies][G2]. Editorial scope will remain practical software utilities; a disclaimer cannot make prohibited content acceptable.

| Additional policy set | Applicability decision |
| --- | --- |
| AdSense Program policies | Real traffic; legitimate ad interaction; appropriate placement; working navigation; accurate account/site information. No purchased bot traffic or incentivized ad clicks. [G1] |
| Publisher Restrictions | Reviewed sexual/shocking content, explosives, firearms/other weapons, tobacco, recreational drugs, alcohol, gambling, prescription/unapproved pharmaceuticals, removed apps, obscuring content/ads, and video inventory. Restricted inventory can receive fewer or no ads; a restriction is not automatically a policy violation. Exclude these subjects from launch editorial scope. [G3] |
| Video/CTV, native mobile/WebView, rewarded inventory, AdSense for Search | Not launch features. Their additional implementation rules need a separate review if added. An ordinary site search box does not require monetized Search ads. [G1], [G3] |
| Country/account-specific terms | Operator must review the actual AdSense terms presented to their account, country availability, truthful payee/identity details, and applicable local law. Account access and operator jurisdiction were not supplied. This plan does not claim those checks are complete. [G4] |

## 3. Findings in this repository: fix before launch

These are source-code observations, not results from testing a deployed site. No live domain or production Supabase project was audited.

| Priority | Existing evidence | Required implementation work and acceptance evidence |
| --- | --- | --- |
| P0 | `server.js` trusts a fixed `admin_session=authenticated` cookie and contains a fallback admin password. | Replace with verified authentication and server-side role checks. Forged/expired sessions must return 401; users without permission must get 403. |
| P0 | `PUT /api/tools/:slug` and `POST /api/posts` lack authentication/authorization checks. | Protect every mutation, validate input, enforce tenant membership, and test cross-site access. |
| P0 | `tools/password-generator.html` promises Web Crypto; `assets/js/tools/password-generator.js` uses `Math.random()`. Its character insertion/truncation can also lose a required character class. | Use a cryptographically secure browser generator with unbiased selection and correct constraint handling. Test length/classes, failure paths, and absence of password network/log capture. Remove unsupported security claims until fixed. |
| P0 | `assets/js/tools/temp-mail.js` puts untrusted message fields into `innerHTML`. The page promises scripts/tracking are removed. | Start with escaped plain-text messages; any later HTML rendering needs a sanitizer, isolated sandbox, blocked remote resources, and adversarial tests. Never render email directly into the application origin. |
| P0 | Temp-mail polling has no bearer token; account password is fixed; provider response parsing needs verification. | Rebuild against the provider's current documented authentication/data format; test actual creation, receive, expiry, deletion, and failure. Do not advertise a working inbox until verified. |
| P0 | `privacy-policy.html` suggests closing the tab/new address discards mailbox data; no provider deletion operation exists in the current script. | State actual retention and deletion behavior. Implement provider deletion and retries where supported; distinguish local state removal from provider erasure. |
| P0 | `server.js` serves the project directory through static middleware. | Publish only an explicit public output directory; deny source/config/generator/private admin routes. Verify sensitive files cannot be fetched. |
| P1 | Canonicals, `sitemap.xml`, `robots.txt`, contact address, dates, and `ads.txt` contain placeholders. | Generate values from verified site settings. No example domains, dummy publisher IDs, or invented operator details in production. |
| P1 | `assets/js/main.js` only dismisses a “Got it” banner using session storage. | Replace with the consent integration in section 9; demonstrate reject, accept, customize, and withdraw behavior. |
| P1 | Four short blog pages exist; six categories exist. Email category is particularly thin and has an ad placeholder. | Evaluate usefulness individually; add tested examples and specific guidance. Expand or merge thin categories, and keep ads off navigation-only pages. |
| P1 | Admin data/analytics are partly mock/in-memory; CMS changes do not constitute a complete public publishing pipeline. | Implement durable content, categories, review, rendering, publication, and measured analytics through the companion plan. Label demo data or remove it from production. |
| P1 | `README.md` refers to a missing compliance checklist and suggests waiting “a few weeks” plus adding “3–5” posts as approval advice. | Replace that advice during implementation with this dated plan and readiness gates. Those numbers are not an official approval formula. |
| P2 | `_generator_source/` uses a machine-specific output path; content appears in generated HTML and other data sources. | Establish one CMS source of truth and portable rendering/build scripts. Prevent regeneration from restoring old policy claims. |

Preserve the existing advantage: public descriptions and navigation already exist in static HTML. A CMS migration must not turn them into empty JavaScript shells.

## 4. Policy-to-product controls

“Requirement” below refers to the linked policy. “Project control” is our proposed way to meet it; it is not the only acceptable implementation.

| Topic | Requirement or guidance | Project control and verification |
| --- | --- | --- |
| Valuable content | Monetized screens cannot be empty, low-value, unfinished, or merely behavioral screens. [G6] | Page review records; no ads on loading, error, empty search, completion-only, or under-construction views. |
| Accurate claims | Do not misrepresent the publisher, content, or affiliations. [G7] | Verify privacy/security/function claims against code and network behavior; no fake testimonials, usage totals, credentials, awards, or Google endorsement badges. |
| Useful navigation | Clear navigation and original, useful content are central readiness guidance. [G5] | All 12 tool links resolve; breadcrumbs/category paths work; no placeholder menu items or dead buttons. |
| Dishonest use | Content enabling deception or unauthorized access is prohibited. [G8] | No marketing temp mail for evading bans, user-agent strings for bypassing protections, or PDF editing for document forgery. Review use cases and linked resources. |
| Ads vs controls | Avoid placements that cause mistaken or accidental clicks. [G9] | Keep ads outside tool/control containers; inspect narrow screens, keyboard focus, error banners, and layout shifts. |
| Ad density | Ads and paid promotions must not exceed publisher content; headers, whitespace, and link lists do not count as substantive content. [G11] | Review actual rendered pages. Do not assume a long footer or large tool directory makes ad-heavy pages acceptable. |
| Invalid traffic | No self-clicks, fabricated impressions, incentivized engagement, or prohibited traffic sources. [G1] | Use ad-free staging; monitor abnormal traffic; never run ad-click automation or buy “approval traffic.” |
| Email/private communication | Ads cannot accompany email/private messages when those are the page's focus. [G9] | Entire temporary-mail application and mailbox routes remain ad-free. A separate original public article can be reviewed independently. |
| Privacy disclosure | Disclose Google-related collection, use, sharing, and relevant technologies accurately. [G12] | Maintain a real data inventory and match policy copy to providers, consent behavior, retention, and deployments. |
| Language | Primary content must use a supported language. [G20] | English is supported. Any later language variant needs an editorial and current support check. |
| Approval per site | New sites need ownership verification and review before ad serving. [G13] | Track each site separately; internal admin “approved” switches cannot grant Google approval. |
| Inventory authorization | `ads.txt` is recommended, not a universal prerequisite. If used, authorization must be correct. [G14], [G2] | Publish only the real account-provided seller line on each relevant frontend domain. Never deploy the dummy line. |

Adding legal pages, articles, or schema markup cannot compensate for a broken or misleading tool.

## 5. Public page map

Use the current `.html` URLs initially, or implement deliberate permanent redirects during migration. Avoid changing URLs simply for appearance. “Ads off” in this table is our launch setting; some exclusions are conservative product decisions beyond minimum policy.

| Page | What it contains | Indexing / launch ads |
| --- | --- | --- |
| Home `/` | Purpose, task-based tool discovery, original help, real guide previews, processing/privacy explanation, operator links. | Indexable; ads off initially, then reviewed placement only. |
| `/tools/index.html` | All enabled tools grouped clearly; short original descriptions and choosing guidance. | Indexable; ads off if substantially just navigation. |
| 12 `/tools/{slug}.html` pages | Working tool, limitations, instructions, tested example, troubleshooting, processing disclosure, related guide. | Public explanatory page indexable; ad setting by tool/state below. |
| Six `/categories/{slug}.html` pages | Category-specific choosing advice, useful comparisons, active tools, relevant guides. | Index only substantive published categories; merge thin categories or keep ads off while improving. |
| `/blog/index.html` and useful category archives | Accurate titles/excerpts, authors/dates, real links, pagination when needed. | Indexable if useful; avoid thin tag archives and arbitrary filter URLs. |
| `/blog/posts/{slug}.html` | Complete original guide, worked example, real author, sources where useful, tested date, related tool. | Indexable; eligible for editorial review for ads. |
| `/about.html` | Actual operator/team, purpose, approach to testing, honest experience, contact. | Indexable; ads off. Recommended trust page, not a universal named AdSense requirement. |
| `/contact.html` | Monitored contact method; bug, privacy, abuse/copyright report instructions. | Indexable; ads off. A working email is acceptable; a form is optional. |
| `/privacy-policy.html` | Actual data flows, Google/other processors, cookies, purposes, sharing, retention, rights and contact. | Public and readable; ads off. Privacy disclosure is an explicit policy duty. |
| `/cookie-policy.html` and persistent privacy-settings control | Actual cookie/storage table and method to change choices. | Public; ads off. Separate cookie page is a project organization choice. |
| `/terms-of-service.html` | Operator, permitted use, tool limits, user rights/responsibility, abuse handling, service availability. | Public; ads off. Final terms must fit the operator and service. |
| `/disclaimer.html` | Specific accuracy/security/availability limits consistent with reality. | Public; ads off. Not an approval shortcut or substitute for safe functionality. |
| Editorial/testing policy and author pages | Real authors, corrections process, testing method, use of automation, actual relevant experience. | Recommended; can be sections of About initially, not empty standalone pages. |
| Admin/auth, previews, APIs, jobs, mailbox sessions, downloads | Authenticated operations or private capabilities; no advertising. | Excluded from sitemap; appropriate access controls, noindex headers where applicable, private caching rules. |
| 404/410, server errors, empty search, thank-you screens | Clear explanation and path back to useful content. | Correct status; no ads; no fake successful page response. |
| `robots.txt`, `sitemap.xml`, `ads.txt` | Generated per domain from correct published settings. | Public machine-readable endpoints; no HTML fallback or login. |

Privacy is the explicit policy requirement here. Google does not publish a universal checklist saying that a particular number of About, Terms, Disclaimer, and Contact pages guarantees approval. We include them because users need accurate information and ways to resolve problems. [Privacy disclosures][G12].

## 6. Homepage specification

The homepage should answer “What can I do here, how do I do it, and what happens to my data?” immediately. Proposed visible order:

1. **Header:** real brand; Home, Tools, Categories, Guides, About, Contact. All links are ordinary anchors.
2. **One descriptive heading:** for example, “Practical tools for files, text, and everyday work.” Follow with a brief explanation of the actual service. Avoid “100% secure,” “best,” and “millions of users” unless defensible.
3. **Task selection:** PDF, image, text, developer, generator, and email categories. A small search/filter enhances an already-rendered tool list.
4. **The complete active tool grid:** name, one useful description, actual processing label (“In your browser” or “Uses an external service”), and direct link. Hide disabled tools from promotional lists rather than sending visitors to unfinished pages.
5. **Original choosing guidance:** explain, for example, when to merge an existing PDF versus convert photos to a new PDF, with a small worked example. This should help someone decide, not repeat keywords.
6. **Processing and privacy:** explain local processing, library/model downloads, optional uploads, and the special case of temporary email. “Local processing” does not mean that CDN, host, analytics, or ad requests never happen.
7. **Latest useful guides:** three to six real articles with meaningful excerpts and truthful dates. There must be a complete article behind every card.
8. **Testing and ownership:** concise link to the actual operator and methodology, including how to report a broken tool.
9. **Footer:** contact, privacy, terms, cookie information, privacy settings, editorial/corrections information, copyright, and any required regional privacy choices.

Project acceptance: with JavaScript disabled, a visitor can still identify the service, read tool descriptions and choosing guidance, follow all important links, and find privacy/contact details. Interactive tools can explain that JavaScript is required. Do not conceal important content inside images or require a cookie acceptance to read instructions.

All content above must be useful to human visitors; it is not a block of text written only for an approval bot. This layout is our design recommendation, informed by Google's [site-readiness guidance][G5].

## 7. The 12 tools: functionality and content brief

All tools need mobile/desktop testing, empty-input behavior, meaningful errors, accessible labels, keyboard operation, and a clear reset. The table specifies our acceptance work, not an assertion that the current tools pass.

| Existing slug | Execution decision | Page and functionality work | Launch ad setting |
| --- | --- | --- | --- |
| `temp-mail` | Provider-backed through controlled Railway API after provider terms review. | Correct authenticated inbox lifecycle; safe plain-text display; expiry/deletion explanation; warn against recovery/banking/important accounts; no ban-evasion promises. | Off on the entire tool and mailbox. |
| `background-remover` | Browser model initially; server worker only as an explicit optional mode. | Owned/licensed before-and-after sample, difficult edges/hair, PNG transparency, size/browser limits, model downloads, failure handling. Do not promise perfect results. | Off during private image use; public guide can be reviewed. |
| `pdf-merge` | Browser initially; optional queued server processing for justified large jobs. | Page ordering/removal; merged document verification; corrupt/encrypted input handling; disclose treatment of signatures/forms/bookmarks. | Off in document workflow; public guide can be reviewed. |
| `image-to-pdf` | Browser initially. | Explain supported formats, ordering, page size, fit/orientation, quality/file size, and lack of OCR if no OCR exists. | Off in document workflow; public guide can be reviewed. |
| `qr-code-generator` | Browser. | Test scanning on real devices; explain contrast/margins, output formats, static content, and link safety. No “editable destination” claim without that feature. | Off when private URLs/text are entered; public guide can be reviewed. |
| `password-generator` | Browser only; never backend processing. | Replace randomness implementation; verify length/classes and copy; explain limits of a strength estimate. No password history, analytics capture, session replay, or third-party ad scripts on the tool. | Off by project security choice. |
| `word-counter` | Browser only. | Define words/characters/whitespace and language limitations; show edge cases; identify reading time as an estimate. | Off in user-text workflow; public guide can be reviewed. |
| `json-formatter` | Browser only. | Valid/invalid examples; clear parse location if available; pretty/minify; no execution of pasted content; document number precision and formatting limitations. | Off in user-data workflow; public guide can be reviewed. |
| `base64-tool` | Browser only. | UTF-8 round trips, malformed data, binary/text limits; clearly explain encoding is not encryption. Never autoexecute decoded HTML/scripts. | Off in user-data workflow; public guide can be reviewed. |
| `user-agent-generator` | Browser. | Label outputs as example strings for authorized compatibility tests; maintain examples; explain a string is not proof of device or permission to bypass access controls. | Reviewed public explanatory area only. |
| `color-palette-generator` | Browser. | Copyable colors, accurate values, readable previews, examples of palette selection; accessibility claims only if tested. | Reviewed public explanatory area only. |
| `unit-converter` | Browser. | Enumerate supported dimensions; show formulas/rounding, negative temperature examples, range errors; do not imply medical/engineering certification. | Reviewed public explanatory area only. |

For sensitive tools, the simplest reliable implementation is an ad-free tool route and a separate public guide. Avoid complex code that tries to remove already-loaded ads after private content appears. These broader privacy exclusions are our conservative design choice; Google does not categorically ban every PDF, calculator, or utility page. Tool sites must meet the same applicable policies as other sites. [Placement][G9] and [inventory quality][G6].

### Tool page template

Each page should contain: a precise title/H1; purpose; working interface near the top; concise steps; supported inputs and limits; at least one tested example; accurate processing/deletion information; common errors and troubleshooting; specific questions users actually ask; related guide and tools; actual last-reviewed date where maintained.

No fixed word quota. Simple tools may need shorter explanations than complex ones. Repeating the same introduction or FAQ across 12 pages does not create 12 valuable explanations. Keep documentation tied to implemented behavior, and change documentation in the same release as functionality.

## 8. Article count and concrete editorial backlog

**Official required count: no fixed count stated in the reviewed general guidance. Recommended project milestone: 12 reviewed guides.** Do not publish filler to reach it. The real release gate is enough original, accurate material to serve the intended audience. Google's Search guidance also explicitly rejects a preferred word-count formula; Search quality advice is not a separate AdSense approval guarantee. [AdSense readiness][G5] and [helpful content][G15].

The current four articles are `removing-a-photo-background-guide`, `safe-temporary-email-signups`, `simple-pdf-workflow-without-software`, and `small-tools-that-save-developers-time`. Keep useful material, correct claims, and expand coverage after testing. Two broad articles do not automatically count as two specialized guides below. Redirect only where the replacement really serves the same intent.

| Guide to publish/rework | Original evidence to include |
| --- | --- |
| 1. Removing a background: clean edges, transparent output, and difficult photos | Your own test images, before/after crops, failure cases, actual browser/device observations. |
| 2. Merge PDFs in the right order without losing the document you need | Synthetic sample documents; ordering walkthrough; observed handling of rotated pages, forms, and protected files. |
| 3. Turn phone photos into a readable PDF | Example page sizes/orientation, legibility comparisons, measured output sizes, actual format support. |
| 4. Create a QR code people can scan | Your own scan tests, contrast/margin examples, long vs short input, static-link explanation. |
| 5. How this password generator creates random passwords | Explain the fixed implementation, local data handling, limitations, and safe usage. Publish only after the generator is corrected. |
| 6. Why word counters disagree | A small test corpus with punctuation, apostrophes, emoji, spaces, and non-Latin text; explain this tool's definition. |
| 7. Fix common JSON formatting errors | Original examples for trailing commas, quoting, nesting, valid scalars, and numeric precision limits. |
| 8. Base64, Unicode, and why encoding is not encryption | Tested round-trip examples, invalid input handling, size overhead, safe display of decoded text. |
| 9. User-agent strings for authorized compatibility testing | Realistic maintained examples, limits of identification, responsible testing scope; no anti-bot bypass instructions. |
| 10. Choose a useful color palette | Original palettes applied to sample interfaces; show legibility and distinguish a palette from a verified contrast checker. |
| 11. Unit conversion mistakes: temperature, scale, and rounding | Independently checked equations and examples matching the supported units. |
| 12. Temporary email: appropriate uses, privacy limits, and account recovery risks | Tested provider lifecycle, actual retention, situations where a permanent address is necessary; no promises of anonymity. |

For every guide, save an editorial record containing the intended question, author, technical reviewer, source/asset rights, test evidence, accuracy/privacy review, publication date, and next review trigger. Use screenshots only from owned or properly licensed material with sensitive data removed.

A practical workflow is draft -> technical test -> editorial/policy review -> preview -> publish -> verify public HTML. AI can help draft or edit, but an editor must validate facts and examples. Do not mass-produce interchangeable articles across domains. The relevant risks are low-value output, lack of curation, and scaled search manipulation, not a magic percentage of AI text. [Inventory guidance][G6] and [spam policies][G10].

Recommended maintenance: review provider-dependent/security-sensitive guides after relevant changes; review the rest periodically and when bugs are reported. Do not fabricate publication history or update dates without meaningful changes.

## 9. Privacy, cookies, analytics, and consent

Replace generic legal templates with facts about this exact deployment. Inventory hosting/CDNs/fonts, Supabase Auth/Storage, Railway processing/logging, email provider, support forms, analytics, advertising, and the CMP. Explain purposes, data categories, recipients, retention, deletion limits, and a real contact. Include Google's data-use information prominently where relevant. [Privacy disclosures][G12].

For EEA, UK, and Swiss users, Google's EU consent policy requires legally valid consent for storage where required and for personal data used to personalize ads; records, withdrawal information, and partner identification are also required. Do not assume the operator's own country removes obligations to these visitors. [EU consent policy][G16].

A Google-certified TCF CMP is required for **personalized** ads in those regions under the current publisher guidance. The page also says some non-certified CMP traffic may be eligible for non-personalized/limited ads where supported; that does not waive underlying privacy duties. Our project choice is a certified CMP using its current supported integration. Google's own Privacy & messaging option is one candidate. Certification is not a guarantee of legal compliance. [CMP requirements][G17].

Implementation requirements for this project:

- Make nonessential analytics/ad behavior depend on the actual required choices and signals. Default to no ads/optional tracking if consent configuration fails.
- Provide meaningful reject/customize options and a persistent way to withdraw or change choices. Do not treat scrolling, tool use, or the existing “Got it” click as comprehensive consent.
- Test a fresh visit, accept, reject, partial consent, withdrawal, subsequent visit, missing CMP, and every production domain. Inspect requests/cookies rather than relying on banner appearance.
- Keep consent evidence proportionate and access-controlled, with version, site, timestamp, choices, and defined retention. Prefer the CMP's supported record mechanism; do not invent a replacement TCF implementation.
- Assess US state opt-out duties and other applicable regions for the actual operator and audience. Where relevant, implement supported privacy signals/restricted processing and GPC handling. GPP is a supported integration option, not proof that every site is legally covered or exempt. [GPP guidance][G18].
- Do not send tool inputs/outputs, passwords, email addresses/bodies, filenames, private QR text, full query strings, or precise location into advertising or analytics.
- Track allowlisted events such as tool open, success/failure code, and coarse duration only when permitted. Never record keystrokes or session replay on sensitive tools.
- Publish measured analytics only. No invented users, sessions, article views, or revenue. Distinguish operational counters from audience analytics and Google-reported revenue.
- Confirm whether children are an intended/known audience before ad activation. Use current Google age-treatment requirements when applicable; do not hardcode obsolete parameter advice from old tutorials. [Publisher privacy policies][G2].

For a proposed server upload mode, show the processing location and deletion schedule before upload. The backend must enforce that schedule and audit failures; a policy promise alone is insufficient. Local tools should not silently switch to server upload when a browser operation fails.

## 10. Crawlability and accessibility specification

These are implementation recommendations for discovery and usability, not a certification called “ATS.” Google's Search documentation supports crawlable anchors, correct status codes, stable canonical URLs, and understandable rendered content. [JavaScript SEO][G21].

- Render homepage text, tool explanations, category descriptions, article bodies, and legal information in initial HTML through static generation or server rendering.
- Provide a unique descriptive title, useful meta description, logical headings, `lang`, readable text, descriptive link labels, and relevant image alt text. Keep pages functional on mobile and usable with keyboard/focus states.
- Generate canonicals, sitemap URLs, social metadata, and robots sitemap location from the verified domain. Avoid public staging URLs and `example.com` metadata.
- A sitemap contains canonical published public URLs, with honest modification times. Exclude drafts, private results, inbox sessions, APIs, search permutations, and unpublished categories.
- Keep public content accessible without login, geography-based review cloaking, or blanket CAPTCHA challenges. Verify AdSense crawler access separately from Google Search indexing. Search Console helps inspect public rendering; indexing does not itself mean AdSense approval. [Review troubleshooting][G22].
- Do not block necessary CSS/JS/assets. If specific crawler groups are configured, check effective rules for each crawler rather than assuming rules are merged.
- Use authentication and private storage for secrets/files. `robots.txt` is not access control. A blocked URL can still be known to a search engine; use appropriate noindex responses where public deindexing is intended and allow those responses to be read.
- Unknown pages return 404/410, not a homepage with 200. Temporary outages use appropriate error responses. Do not let the API hostname or a catch-all frontend publish duplicate page copies unintentionally.
- Consider truthful Organization/WebSite, Article, and breadcrumb structured data where applicable. Structured data is optional and cannot guarantee rich results or approval; do not invent ratings, reviews, or authors.
- Optimize image sizes, fonts, script loading, and layout stability. Keep tool/model loading from blocking public text. Performance is a user-experience target, not a guaranteed approval score.

Never add a user-agent branch that gives reviewers different claims or content. Do not hide keywords off-screen. A server-rendered page and its browser-enhanced version should represent the same product. [Spam policies][G10].

## 11. Advertising rollout

Start with ads disabled. Install only the ownership-verification mechanism offered in the actual account when applying; site verification and monetizing every route are different decisions. A correct account-provided `ads.txt` entry may be used before final approval when available. [Site management][G13].

After the site's actual AdSense status permits ad serving, launch with a small allowlist of reviewed public articles. Our initial recommendation is one clearly separated manual unit on a sufficiently substantive article; this is a design starting point, not an official numeric limit. Label any custom heading “Advertisements.” Keep the unit away from copy, download, upload, submit, pagination, and navigation actions. [Placement policy][G9].

Add homepage or other eligible placements only after reviewing their actual content and mobile layout. Reserve space to avoid movement. Do not refresh ads on a timer or every tool operation. No countdown before download, forced ad view, fake download button, or instructions to support the site by clicking ads. [Program policies][G1].

Do not enable Auto ads site-wide until exclusions are verified. Keep the mailbox, password tool, private workspaces, errors, admin, previews, and low-content routes excluded. Maintain a global emergency switch plus site/page controls; the restrictive state wins. Inspect third-party widgets and paid promotions too.

Apply the current Better Ads Standards as well: our launch layout avoids pop-ups, intrusive countdown interstitials, flashing promotions, autoplay sound, full-screen scrollovers, and large sticky units. Check the actual desktop/mobile density definitions and sticky-video combinations before adding formats; “fewer ads than content” is not the only layout test. [Better Ads Standards][G23].

Testing must use ad-free staging, layout placeholders, or supported preview methods. Never test production ad links by clicking them. Operational monitoring must not generate monetized impressions deliberately.

## 12. Several domains using one server

Shared code and infrastructure are reasonable. A shared backend does not transfer approval from one website to another. Add each distinct site using AdSense's current site-management flow, verify ownership, and wait for that site's own review result before serving ads. [Site management][G13].

Choose the domain's purpose before publishing:

| Domain purpose | Recommended handling |
| --- | --- |
| Alias/alternate spelling of the same site | Redirect permanently to its canonical domain; do not publish identical independent sites. |
| Distinct audience or genuinely different utility offering | Separate site configuration, substantive editorial content, navigation, disclosures, analytics, review status, and content approval. Shared tools can remain shared code. |
| Real language version | Human-reviewed localization, accurate language metadata and appropriate language relationships. Translation alone does not establish approval. |
| Staging/preview/API/admin hostname | Restrict or noindex as appropriate; no ad serving; never mix it into public sitemaps. |

Do not create a network of near-identical sites with only titles/domains changed to multiply rankings or bypass a rejection. Such behavior can overlap Google's doorway/scaled-content spam rules; duplicate content by itself is not a universal automatic penalty. Canonical tags are not an approval workaround. [Spam policies][G10].

Each site's configuration needs a verified canonical domain, aliases, name, operator/contact, language, enabled tools, published content, consent configuration, seller information, ad allowlist, and approval evidence. Tenant isolation, CORS, authentication, and cache separation are specified in the companion architecture document.

## 13. Admin panel scope

The admin panel must manage real records and operational states:

| Area | Required capabilities |
| --- | --- |
| Sites/domains | Ownership verification, canonical/alias management, TLS status, domain-specific public settings, launch state. |
| Tools | Enable/disable, category assignment, ordering, descriptions/help, limits, processing mode, privacy disclosures, version/test evidence. No arbitrary executable code editor. |
| Blog/pages | Drafts, revisions, authors, categories, SEO fields, licensed media, preview, review, schedule, publish/unpublish, redirects. |
| Categories | Name/slug/description/order, membership, useful landing-page text, archive handling, move content before deletion. |
| Analytics | Real allowed page/tool events, aggregate trends, errors, uptime/job performance, filters by site/date/tool; no sensitive input capture. |
| Advertising | Per-site review status/evidence, publisher ID validation, page exclusions, consent readiness, ads.txt health, kill switch, policy issue register. |
| Privacy/support | Consent configuration, retention jobs, deletion requests, contact/abuse reports, provider incidents. |
| Security/audit | Roles and MFA, explicit site membership, immutable action log, invitations/revocation, secrets outside browser/editor data. |
| Operations | Queue status, retry/dead-letter handling, storage cleanup, publication/build status, backups/restore checks, dependency review. |

A CMS checklist is internal evidence, not an automated AdSense approval score. Only the operator can record a decision actually received from Google; analytics cannot infer it.

## 14. Implementation order and release gates

| Phase | Work | Exit evidence |
| --- | --- | --- |
| 1. Correctness/security | Repair authentication, protected writes, password randomness, mailbox provider integration/rendering, static exposure. | Relevant positive/negative tests and tool demonstrations; no unresolved P0 items. |
| 2. Shared platform | Supabase schema/RLS/storage, Railway API, site isolation, real CMS and publication flow. | One site's publish works; second tenant cannot read private records or mutate the first. |
| 3. Public information | Domain/operator settings, page templates, actual disclosures, category content, tools and guides. | Public pages have no placeholders; claims match tests; editorial target assessed by usefulness. |
| 4. Privacy/crawlability | CMP, minimal analytics, retention, sitemaps/robots/canonicals, public HTML, accessibility. | Request/cookie audit, private-data checks, crawler access, and mobile/keyboarding checks. |
| 5. First-domain release | Stable HTTPS deployment, error monitoring, contact/support, backups, real user feedback. | Evidence of reliability; no invented site-age or traffic waiting rule. |
| 6. AdSense review | Account-specific prerequisites, ownership verification, complete site submission. | Submitted through Google's actual account flow; ads remain governed by review state. |
| 7. Controlled ads | Only approved site and reviewed allowlisted content; monitor Policy center/traffic/consent. | Correct ads.txt when used, placement review, exclusions, rollback switch. |
| 8. Additional domains | Establish real purpose and content; repeat privacy, crawlability, and site review gates. | Independent domain readiness and approval evidence. |

Before requesting review, record pass/fail and evidence for:

- All 12 advertised tools work on the production domain, or unavailable tools are honestly disabled and removed from promotion.
- No dummy domain/contact/publisher data, fabricated statistics, deceptive claims, thin monetized navigation, or unfinished public routes.
- Public pages communicate real value without requiring interaction to reveal all content; all important links work.
- Homepage, tools, guides, categories, privacy/contact, and operator details have been reviewed by a person.
- Sensitive input never enters analytics/ad parameters, support logs, public URLs, or public Storage buckets.
- Consent and retention match the actual region/provider/deployment behavior.
- HTTPS, canonical redirects, robots, sitemap, errors, and ownership verification work on this specific domain.
- Ad exclusions include email/private workflows, admin, errors, previews, and disallowed/low-value content.
- Account information, eligibility, applicable terms, supported country/language, and any prior policy issues are checked by the operator.

If rejected, preserve the exact notice, identify affected pages and site-wide patterns, fix the substantive issue, verify the deployed result, and request review using Google's flow. Adding arbitrary article volume or moving the same site to another domain is not a diagnosis. [Review troubleshooting][G22].

After approval, monitor the Policy center and the policy change log; re-review when tools, providers, ads, audience, or domains change. Approval is a continuing responsibility. [Change log][G19].

## 15. Inputs needed before implementation goes live

Planning can proceed now. Production configuration still needs: real domains and whether each is an alias/distinct site; operator legal/contact details; intended audiences and regions; actual AdSense account/site state; chosen mailbox provider and permissions; processing limits and budget; hosting/data regions; analytics/CMP choice; and approved retention periods. Never fill these with invented facts.

The two planning files do not change the application, deploy anything, create a database, publish articles, or submit an AdSense application.

## Official source register

These are primary sources reviewed for this plan. Read the live version again before implementing policy-sensitive behavior; the links, not this summary, contain Google's authoritative wording. Product-specific additions and account-local terms require review when applicable.

- [G1 — AdSense Program policies][G1]
- [G2 — Google Publisher Policies][G2]
- [G3 — Google Publisher Restrictions][G3]
- [G4 — AdSense eligibility][G4]
- [G5 — Site readiness][G5]
- [G6 — Screens without publisher content][G6]
- [G7 — Misleading representation][G7]
- [G8 — Enabling dishonest behavior][G8]
- [G9 — Ad placement policies][G9]
- [G10 — Google Search spam policies][G10]
- [G11 — Advertising versus publisher content][G11]
- [G12 — Privacy disclosures][G12]
- [G13 — AdSense site management][G13]
- [G14 — Ads.txt guide][G14]
- [G15 — Helpful, reliable content][G15]
- [G16 — EU user consent policy][G16]
- [G17 — Certified CMP requirements][G17]
- [G18 — Global Privacy Platform support][G18]
- [G19 — AdSense policy change log][G19]
- [G20 — Supported languages][G20]
- [G21 — JavaScript SEO fundamentals][G21]
- [G22 — Site review troubleshooting][G22]
- [G23 — Better Ads Standards (Coalition for Better Ads)][G23]

[G1]: https://support.google.com/adsense/answer/48182?hl=en-GB
[G2]: https://support.google.com/adsense/answer/10502938?hl=en
[G3]: https://support.google.com/adsense/answer/10437795?hl=en
[G4]: https://support.google.com/adsense/answer/9724?hl=en
[G5]: https://support.google.com/adsense/answer/7299563?hl=en
[G6]: https://support.google.com/publisherpolicies/answer/11112688
[G7]: https://support.google.com/publisherpolicies/answer/11185754
[G8]: https://support.google.com/publisherpolicies/answer/10436828
[G9]: https://support.google.com/adsense/answer/1346295
[G10]: https://developers.google.com/search/docs/essentials/spam-policies
[G11]: https://support.google.com/publisherpolicies/answer/11169917
[G12]: https://support.google.com/publisherpolicies/answer/10437794
[G13]: https://support.google.com/adsense/answer/12131223?hl=en
[G14]: https://support.google.com/adsense/answer/12171612?hl=en
[G15]: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
[G16]: https://www.google.com/about/company/user-consent-policy/
[G17]: https://support.google.com/adsense/answer/13554116?hl=en-GB
[G18]: https://support.google.com/adsense/answer/14126816?hl=en
[G19]: https://support.google.com/adsense/answer/9336650?hl=en-GB
[G20]: https://support.google.com/publisherpolicies/answer/10436912
[G21]: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
[G22]: https://support.google.com/adsense/answer/12176698?hl=en
[G23]: https://www.betterads.org/standards/
