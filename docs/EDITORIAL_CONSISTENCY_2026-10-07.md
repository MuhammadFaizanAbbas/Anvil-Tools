# Remaining editorial consistency fixes — October 7, 2026

The developer guide now links directly to `/journal/temporary-email-for-authorized-testing-and-permitted-messages`. Its source and reviewed-body checksum match the published version. The old URL retains its permanent redirect for existing external links.

The temporary-email cover description is now **Authorized email-receipt test form beside a temporary inbox** in the published post, media record, authored library, and fallback guide cards. The renderer uses that description for the hero and social-image alt text. A guarded transaction saved both previous post revisions before updating the published content.

All four static experiment records now have relevant topic tags, which populate their JSON-LD keywords and visible topic chips. The shared renderer omits `keywords` when no tags are available. Regenerated experiment pages include the new metadata.

The homepage source already uses **Latest guides & experiments**. A live check found `nevco.online` serving an older `recommendations.js` with **Latest from the blog**, while the Vercel frontend serves the corrected wording. The cPanel files must be uploaded to finish the static changes on that domain; pushing the frontend repository updates its Vercel deployment.

Validation: all **127 application tests passed**, including the regenerated keywords and omission of empty keywords. Syntax and script-reference verification passed for **115 files**. Published post bodies, article IDs, cover IDs, titles, excerpts, and original publication dates were checked after the guarded update; the developer body's only change is the requested link.

Upload `deployment/editorial-consistency-2026-10-07/cpanel-editorial-consistency.zip` into the existing cPanel document root, preserving paths and `.htaccess`. It includes the corrected homepage script, four experiment pages, and previous pending frontend fixes. It excludes private configuration and `ads.txt`. No cPanel upload connection is available in this session. The ZIP's integrity and required heading/keywords were checked before packaging.
