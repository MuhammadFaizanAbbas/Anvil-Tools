# Editorial release state

The current public library is defined in `published-library.json`: four distinct covered guides. `developer-data.md` and `pdf-workflows.md` contain the expanded replacements for those topics. The older eight-guide consolidation plan is historical planning input; its six unfinished destinations are not the publication target for this cleanup. See [the cleanup record](../../docs/EDITORIAL_CLEANUP.md) for the verified database changes, backups, and deployment instructions.

## Earlier release history (superseded)

The first release is published in the Anvil Tools Supabase project (`epxzxcqsonxscyvbopqt`). It contains the revised `temporary-email.md` and `background-removal.md` articles. These preserve and edit the owner's existing content and add practical sections. They are AI-assisted edits, not a claim of human authorship or independently certified originality. Readable body counts are 11,015 and 10,576 words respectively.

`release-2026-10-04.json` identifies the exact database records, metadata, and matching existing cover images. `node scripts/prepare-editorial-release.js` validates the content and prepares an optimistic transaction in the ignored deployment directory. It does not execute that transaction. The transaction was applied on October 4, 2026 and saved both previous records in `post_revisions`. All 490 posts remain published. The original expected timestamps and hashes intentionally prevent applying this release again. Database verification is recorded in `docs/audits/editorial-publication.json`.

`consolidation-plan.json` accounts for the 490 original published records across eight proposed guides. Only the first two guides are ready. The remaining proposed guides and the later redirects are not part of this publication. Preserve the full pre-edit export under `deployment/editorial-2026-10-04/` before performing future consolidation.

The four new raster covers under `backend/assets/editorial/` are prepared artwork for later guides and are not yet attached to database posts. The currently released guides retain their existing relevant covers. Cover prompts and generation method are documented in `cover-prompts.md`.
