# Four-point live recheck — October 7, 2026

The four follow-up findings were checked directly on both `https://nevco.online` and `https://anviltools.vercel.app`. Each host returned all 43 public pages successfully, including four database guides and four static experiments. These observations supersede the earlier pending-verification status for the four items below; they do not record a database article publication.

| Item | Observed result |
| --- | --- |
| Article navigation | No remaining “Blogs” navigation or “Back to all blogs” return labels in the checked pages. The shared article renderer, static articles, homepage, and index use “Guides & experiments.” Both `/journal/` entry points permanently redirect to the shared hub. |
| Linked downloads and assets | Direct GET requests checked 81 referenced resources on each host. All returned HTTP 200 with the expected MIME type and passed content validation. The inventory includes 11 PDFs, 9 JSON files, 1 CSV, 22 images, 1 text file, 5 stylesheets, 30 scripts, and 2 fonts. The 43 fixtures, editorial illustrations, and article covers are a subset of that inventory. The earlier figure of 53 has no supplied URL manifest, so the reports retain the exact discovered URLs and their referring pages. |
| HSTS | All 43 HTTPS page responses on each host returned `Strict-Transport-Security: max-age=604800`, without `includeSubDomains` or `preload`. `http://nevco.online/` redirected permanently to HTTPS and did not send HSTS over HTTP. The HTTPS `www` hostname redirected to the canonical hostname with the seven-day policy. Vercel's early `/index.html` and `/journal/` redirect responses still expose its platform policy, `max-age=63072000; includeSubDomains; preload`; the seven-day statement applies to the checked content responses. |
| Ads near interactions | None of the 43 checked pages on either host contained ad loaders or ad containers. Advertising remains disabled. The legacy generator's `ad_slot()` helper now emits nothing, preventing a basic regeneration from restoring placeholders before the later cleanup stage. |

The resource check reopens PDFs, fully decodes raster images, parses JSON, converts the CSV using the site's parser, checks JavaScript syntax, and validates font headers. Source-byte comparisons are recorded separately: a successful status/MIME/content check does not imply every remote asset is byte-identical to the local working copy.

Evidence:

- [Page labels, ad markup, headers, and redirects](audits/four-point-live-recheck-2026-10-07.json)
- [nevco.online resource inventory](audits/linked-fixtures-nevco-recheck-2026-10-07.json)
- [Vercel resource inventory](audits/linked-fixtures-vercel-recheck-2026-10-07.json)

For a future advertising launch, use explicitly reviewed editorial placements, with clear labels and separation from controls. Exclude temporary inbox/message pages, private workspace screens, download/control areas, and result-only, empty, or error screens. Google's [AdSense placement requirements](https://support.google.com/adsense/answer/48182?hl=en) prohibit ads on pages focused on email/private communication and deceptive navigation/download placements; its [inventory-value policy](https://support.google.com/publisherpolicies/answer/11112688?hl=en) prohibits ads on screens without publisher content or with low-value content. Applicable provider and consent setup remains a separate launch task.

The HSTS rollout uses a short initial duration and avoids asserting HTTPS support for unverified subdomains. [HSTS behavior and scope](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security) explain why HTTPS responses, expiration, and subdomain coverage must be checked separately.
