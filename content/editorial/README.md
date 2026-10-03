# Editorial release state

The first release contains the revised `temporary-email.md` and `background-removal.md` articles. These preserve and edit the owner's existing content and add practical sections. They are AI-assisted edits, not a claim of human authorship or independently certified originality. Readable body counts are 11,015 and 10,576 words respectively.

`release-2026-10-04.json` identifies the exact database records, metadata, and matching existing cover images. `node scripts/prepare-editorial-release.js` validates the content and prepares an optimistic transaction in the ignored deployment directory. It does not execute that transaction. Publication saves the previous records in `post_revisions`; it does not delete or unpublish any other post.

`consolidation-plan.json` accounts for the 490 original published records across eight proposed guides. Only the first two guides are ready. The remaining proposed guides and the later redirects are not part of this publication. Preserve the full pre-edit export under `deployment/editorial-2026-10-04/` before performing future consolidation.

The four new raster covers under `backend/assets/editorial/` are prepared artwork for later guides and are not yet attached to database posts. The currently released guides retain their existing relevant covers. Cover prompts and generation method are documented in `cover-prompts.md`.
