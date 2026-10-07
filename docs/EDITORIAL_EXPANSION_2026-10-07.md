# Two new experiments and four relevant covers — October 7, 2026

Published two new journal articles and replaced the old developer-data and PDF SVG covers. Both domains serve the new articles and all four generated WebP covers. The two existing articles retain their bodies, publication dates, cover IDs, and journal URLs.

## Published articles

| Article | What readers can reproduce |
| --- | --- |
| [URL Encoding Mistakes: Spaces, Plus Signs, Unicode, and Double Encoding](https://nevco.online/journal/url-encoding-mistakes-spaces-plus-unicode) | Fifteen actual tool cases, form-query parsing, a whole-URL ampersand failure, literal plus preservation, Unicode, malformed escapes, and double encoding |
| [Why SHA-256 Hashes Differ for Identical-Looking Text](https://nevco.online/journal/why-sha256-hashes-differ-for-identical-looking-text) | Thirteen actual tool cases covering whitespace, textarea CRLF normalization, composed/decomposed accents, JSON formatting and property order, byte counts, and hex/Base64 representations |

The posts follow the site's existing practical structure: define a narrow problem, give a decision table, show observed results and failure cases, explain the tool's limits, link official references, and finish with a reproduction checklist. Each provides synthetic input definitions, recorded outputs, and an actual tool screenshot. They link back to the existing developer guide and to each other. The URL and hash tool pages now contain links to both their original broad guide and the new focused article.

The [ten-topic plan](EDITORIAL_TOPICS_2026-10-07.md) prioritizes reader problems and tool fit. Its keyword phrases describe search intent; no search-volume estimate, ranking promise, or advertising-approval claim is made.

## Covers and publication safeguards

The built-in image-generation tool produced four distinct editorial illustrations, with no embedded titles that can become stale. The final WebP assets are 1672 × 941 pixels and approximately 86–120 KiB each:

- [Developer API-data workflow](../backend/assets/editorial/developer-data-cover-20261007.webp)
- [PDF assembly and final inspection](../backend/assets/editorial/pdf-workflows-cover-20261007.webp)
- [URL encoding boundaries](../backend/assets/editorial/url-encoding-cover-20261007.webp)
- [Text-byte and digest differences](../backend/assets/editorial/sha256-cover-20261007.webp)

The full [prompt set and generation method](../content/editorial/cover-prompts-2026-10-07.json) are saved in the repository. Alt text describes each as an illustration. The linked screenshots come from actual browser runs and are separate from the generated artwork.

The two old cover rows now point to the new WebP objects while retaining their public image IDs. The original SVG objects remain in private storage, and the old media-row snapshots are saved in the ignored release directory. A guarded transaction saved revisions before changing the existing articles' cover descriptions, registered the two new covers, and published exactly two new posts with initial revisions and audit entries. The full pre-update article/media snapshots prevent publishing over a concurrent edit. Original bodies and publication dates were verified after publication.

A live check found cPanel's one-hour image cache still serving the old SVG bytes at the unversioned image paths. Articles and hub cards now include a content-checksum query in their cover URLs. Those actual rendered URLs were fetched and decoded on both hosts, and every image matched the selected WebP's SHA-256. Existing image IDs and route paths stay stable.

The cover upload used a temporary JWT-protected, expiring helper limited to four files at a pinned Git commit, with checksum verification before and after upload. It did not change database records. After upload, the helper was replaced with an inert HTTP 410 response and its retired state was verified. It cannot accept further uploads. The private storage bucket remained private.

## Verification and deployment

- **127 application tests passed**; syntax and script references passed for 115 files.
- Chrome and Edge each passed 15 URL-tool cases, 13 SHA-256 cases, and the additional query-parser checks locally, then repeated all 56 cases successfully on the actual `nevco.online` tools. Every hash result matched Node crypto independently. The production replay kept the published fixtures unchanged.
- Isolated Postgres validation passed the complete publication transaction, refusal to replay it, and rollback of all partial changes after a simulated concurrent article edit.
- Four relevant cover images, two new canonical articles, hub links, and sitemap entries passed on both `nevco.online` and `anviltools.vercel.app`.
- All six linked fixture/result/screenshot URLs returned HTTP 200 and matched the repository bytes. Only these shipped synthetic files are exposed by the download route; unknown groups and private/traversal filenames return 404.
- Eight browser views on `nevco.online` verified four article covers at desktop and mobile widths, the new titles, working outline links, and no page-wide overflow.
- The sitemap now contains **45 public HTML pages: 39 static pages and six journal articles**. Fixtures and image files are excluded. Original publication dates are preserved; modification dates reflect the real cover/content changes.
- Advertising remains disabled in the checked articles.

Evidence: [recorded tool experiments](audits/encoding-hash-experiments-2026-10-07.json), [production tool replay](audits/encoding-hash-experiments-live-2026-10-07.json), [publication verification](audits/editorial-expansion-publication-2026-10-07.json), [live HTTP and image checks](audits/editorial-expansion-live-2026-10-07.json), and [desktop/mobile browser checks](audits/editorial-expansion-browser-2026-10-07.json).

The cover assets were pushed in frontend-repository commit `1f8fa60d816ae6b1808b2d5241cd7eca99607da8`. Backend commits `3f51366751bb3a228b3bbe72d274fa0a5bbb7fd5` and `798ed5e` deploy the public fixtures, article metadata, and cover-cache correction. The final frontend/source release and verification records are pushed separately.

The articles, covers, hub cards, and journal sitemap already work on cPanel through its existing backend proxy. The new **static tool-page links** still require the normal cPanel upload. `deployment/editorial-expansion-2026-10-07/cpanel-editorial-final.zip` contains the latest static updates, including the earlier wording/sample/favicon fixes. Extract into the existing document root with paths and `.htaccess` preserved. It excludes private configuration and `ads.txt`. There is no cPanel upload connection in this session.
