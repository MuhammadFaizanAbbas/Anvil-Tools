# Anvil favicon update — October 7, 2026

The homepage and all 43 static HTML pages now declare a primary 48×48 PNG favicon, `/favicon.ico`, and a 180×180 Apple touch icon. The Python page generator, server-rendered guide pages, and server-rendered guide index use the same declarations. The existing SVG remains the visible site logo.

| Stable public URL | Format and dimensions |
| --- | --- |
| `/assets/images/favicon-48.png` | PNG, 48×48 |
| `/favicon.ico` | ICO with square 16, 32, 48, 64, 128, and 256px PNG frames |
| `/assets/images/apple-touch-icon.png` | PNG, 180×180 |

`node scripts/build-favicons.cjs` regenerates these assets directly from `frontend/assets/images/anvil-mark.svg` using the existing Sharp dependency. Keep their URLs unchanged when refreshing the mark.

`node scripts/check-favicons.cjs` passed locally: each asset returned HTTP 200 without a redirect, had the expected image MIME type, decoded successfully, and matched pixels rendered from the source mark at its declared size. All ICO frames are square. `robots.txt` permits Googlebot to crawl the homepage and Googlebot-Image to crawl all three assets. Link checks passed for all static pages and both Node renderers using both frontend hostnames. All 18 existing checks in the article metadata, blog rendering, public entry point, public readiness, multisite, and review readiness test files passed.

After a deployment, verify the exact production files with:

```powershell
node scripts/check-favicons.cjs https://anviltools.vercel.app
node scripts/check-favicons.cjs https://nevco.online
```

Pushing `Anvil-Tools` updates the Vercel frontend. The guide renderer and index template also need their corresponding push to `Anvil-Tools-Backend`. The separate cPanel host requires extracting `deployment/favicon-2026-10-07/cpanel-favicon-update.zip` into its `public_html` document root; repository pushes do not deploy that host. The ZIP contains the changed HTML pages and three icon assets, with the favicon changes applied to committed page versions so unrelated working-copy edits are excluded.

After the intended homepage serves the updated declarations and files, use URL Inspection in its verified Google Search Console property to request indexing. No Search Console connection is available in this workspace, so an indexing request is a separate account action. Google's [favicon documentation](https://developers.google.com/search/docs/appearance/favicon-in-search) recommends a square favicon larger than 48×48 (provided by the ICO), a stable URL, and crawlable files. Processing may take days or weeks, and display is not guaranteed.
