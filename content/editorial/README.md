# Editorial release state

The current public library contains 26 database articles in `published-library.json` and four static experiments in `experiments.json`. On October 9, 2026, the 20 newer database-only articles were imported into `content/editorial/published/` so every live article now has a canonical local source. The published-only audit corrects long card excerpts, a mismatched UUID cover description, and unresolved citation placeholders in the QR guide. `release-2026-10-07.json` and the related cover records remain as historical evidence for the earlier six-article library.

`npm run build:editorial` renders the four static experiments, updates all 26 journal-card fallbacks and related tool links, and rebuilds the sitemap. It does not publish database bodies. The current audit and its reproducible checks are recorded under `docs/audits/`. Older deployment and publication descriptions below are historical. See the [ten-topic plan](../../docs/EDITORIAL_TOPICS_2026-10-07.md) for the earlier topic plan.

## October 5 audit follow-up, prepared locally

The local `background-removal.md` and `temporary-email.md` sources now contain focused workflows, decision tables, and actual tool screenshots. `pdf-workflows.md` describes the new accessible file-order controls and a verified sample download. The original covers and four journal URLs are preserved. These source edits require a separate database publication; running `build:editorial` only rebuilds frontend links and templates. Use `node scripts/prepare-adsense-followup.js` to fetch public baselines and create a guarded, body-only transaction that saves previous records as revisions. It does not execute SQL. See [the follow-up record](../../docs/ADSENSE_AUDIT_FOLLOWUP.md) for release files, checks, and remaining account steps. Earlier minimum-word targets and completed release scripts below are historical, not requirements for these new sources.

## Earlier release history (superseded)

The first release is published in the Anvil Tools Supabase project (`epxzxcqsonxscyvbopqt`). It contains the revised `temporary-email.md` and `background-removal.md` articles. These preserve and edit the owner's existing content and add practical sections. They are AI-assisted edits, not a claim of human authorship or independently certified originality. Readable body counts are 11,015 and 10,576 words respectively.

`release-2026-10-04.json` identifies the exact database records, metadata, and matching existing cover images. `node scripts/prepare-editorial-release.js` validates the content and prepares an optimistic transaction in the ignored deployment directory. It does not execute that transaction. The transaction was applied on October 4, 2026 and saved both previous records in `post_revisions`. All 490 posts remain published. The original expected timestamps and hashes intentionally prevent applying this release again. Database verification is recorded in `docs/audits/editorial-publication.json`.

`consolidation-plan.json` accounts for the 490 original published records across eight proposed guides. Only the first two guides are ready. The remaining proposed guides and the later redirects are not part of this publication. Preserve the full pre-edit export under `deployment/editorial-2026-10-04/` before performing future consolidation.

The four new raster covers under `backend/assets/editorial/` are prepared artwork for later guides and are not yet attached to database posts. The currently released guides retain their existing relevant covers. Cover prompts and generation method are documented in `cover-prompts.md`.
