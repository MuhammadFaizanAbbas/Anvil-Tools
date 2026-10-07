# Ten useful topics for Anvil Tools

Prioritized by a concrete reader problem, fit with the existing tools, and an experiment we can reproduce. Keyword phrases describe the intended question; they are not measured search-volume or ranking forecasts. Each proposed post should add a distinct workflow rather than duplicate the existing broad developer guide or JSON/CSV parser experiments.

| Priority | Topic | Primary keyword intent | Useful experiment and tools | Status |
| --- | --- | --- | --- | --- |
| 1 | URL Encoding Mistakes: Spaces, Plus Signs, Unicode, and Double Encoding | URL encoding plus sign; double URL encoding | Fifteen actual URL-tool cases, plus form-query parsing and exact round trips | Published in this release |
| 2 | Why SHA-256 Hashes Differ for Identical-Looking Text | SHA-256 hash mismatch; Unicode hash; newline checksum | Thirteen actual hash-tool cases; independent byte counts and digest comparisons | Published in this release |
| 3 | JWT Expiration Troubleshooting: Seconds, Milliseconds, and Clock Boundaries | JWT expired; JWT exp timestamp | Fictional tokens around expiration boundaries; JWT Decoder and Unix Timestamp Converter; keep decoding distinct from signature verification | Proposed |
| 4 | Merge PDFs in the Right Order: A Page-by-Page Verification Experiment | merge PDF page order; mixed PDF page sizes | Numbered synthetic PDFs, deliberate file reordering, independent inspection of every output page | Proposed |
| 5 | Background Removal on Hair, Glass, and White Products | background removal transparent edges; product photo cutout | Owned or licensed fixtures, contrast backgrounds, edge crops, and clearly described failures | Proposed |
| 6 | QR Codes with Long URLs: Payload Size, Unicode, and Real Scan Checks | QR code long URL; QR code not scanning | Short and long synthetic links, 180 × 180 output comparison, and documented device/print scan conditions | Proposed; physical scan checks required |
| 7 | Base64 vs Base64url: Unicode Text and URL-Safe Token Boundaries | Base64url vs Base64; Unicode Base64 | UTF-8 round trips, padding, malformed input, and URL-query effects using Base64 and URL tools | Proposed |
| 8 | Text Case Conversion for API Field Names: Acronyms, Digits, and Accents | camelCase to snake_case; acronym case conversion | Actual casing outputs for identifiers, acronyms, digits, Unicode, and collisions; Text Case Converter and Text Diff | Proposed |
| 9 | UUID Generation: Check Format, Uniqueness Samples, and What an ID Does Not Prove | UUID generator; UUID format validation | Recorded batches with format and duplicate checks; distinguish a sample without duplicates from a uniqueness guarantee | Proposed |
| 10 | Timestamp Debugging Across Time Zones and Daylight-Saving Changes | Unix timestamp seconds vs milliseconds; DST timestamp | Fixed UTC fixtures and independently checked zone displays; Unix Timestamp Converter with explicit environment and units | Proposed |

For every post, include the actual tool settings, synthetic input downloads, observed outputs, the date and environment, failure cases, interpretation, and a short reproduction checklist. Use sources for protocol rules and recorded results for claims about Anvil's current tools. Covers are editorial illustrations; screenshots must come from actual runs.
