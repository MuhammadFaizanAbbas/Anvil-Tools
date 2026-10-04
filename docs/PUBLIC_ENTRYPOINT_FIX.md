# Old links and public stylesheet caching

The current [editorial cleanup](EDITORIAL_CLEANUP.md) includes these fixes. Use `deployment/editorial-cleanup-frontend.zip` for the combined cPanel update; it supersedes the earlier standalone patch described below.

The live `https://nevco.online/snowy-peaks-solitaire/` URL returns HTTP 404. The shared error page used relative CSS, images, JavaScript, and navigation paths, which resolved inside the missing directory. Clicking Home or All tools then opened more missing pages with the same broken styling. `/index.html/` reproduced the same failure.

A fresh browser loads 20px blog card titles and a padded, bordered article outline. The CSS responses have a seven-day cache lifetime, which can retain styling from an older release.

The prepared fix redirects the known retired Solitaire entry points to `/`, removes trailing slashes from HTML URLs, and uses root-relative error-page links. Shared stylesheet URLs carry `v=20261004-css`, and CSS responses revalidate. PHP article, listing, and static-page renderers add this version even when using older stored HTML templates. The static build and Node renderers use the same version.

## Apply to nevco.online

This fix is prepared and verified locally; it has **not been uploaded to cPanel**. Database publication of the two completed guides is already verified separately.

1. Back up the files being replaced in the domain's document root.
2. Extract `deployment/legacy-links-css-fix.zip` there. It contains ten frontend files with no containing `frontend/` directory. Preserve any host-specific directives or cPanel-generated PHP handler blocks when merging the supplied `.htaccess`.
3. Purge the site's LiteSpeed/CDN cache after uploading and reload the browser.
4. Open `/snowy-peaks-solitaire/` and `/snowy-peaks-solitaire/index.html`: both should redirect to `/`. Open `/index.html/`: it should redirect to `/index.html`.
5. Open an unknown nested path: it should retain HTTP 404, display the styled error page, and let Home and All tools open the real pages.
6. Open `/blog/index.html` and an existing journal article. CSS requests should succeed as `text/css` with the new version parameter.

Use `py -3.9 scripts/package-public-entrypoints.py` to rebuild the patch. Run `node scripts/build-editorial.js` when regenerating static articles and templates. Change the shared style version in both `backend/src/lib/public-assets.js` and `frontend/public-assets.php` when shipping another public CSS update.

## Verification

All 85 existing regression tests and two new checks passed. The new checks cover nested missing-page asset/navigation resolution and consistent PHP/Node stylesheet versioning. Syntax and script references passed for 114 files; all ten PHP files passed syntax checks. Ten local browser cases passed at 320 and 1440 pixels with JavaScript disabled, including recovery navigation and query-string preservation. Results are in `docs/audits/public-entrypoints.json` and describe the local preview.
