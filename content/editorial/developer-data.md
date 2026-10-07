# Debug API Data with JSON, Base64, and Browser Tools

Small data problems can look like large application failures. An API rejects a payload, a query value splits into two parameters, or an encoded string decodes to something unexpected. The useful first step is to make the input understandable and reproduce the problem with a small sample.

This guide connects the Anvil Tools developer utilities into a practical debugging workflow. The examples use invented data. Keep real access tokens, private customer records, and production credentials out of shared examples, issue trackers, and screenshots.

## Preserve a sample before changing it

Start with the input that produced the failure, the expected behavior, and the actual response. Preserve an untouched copy in a suitable local workspace. Then create a minimal sample that keeps the relevant structure without carrying private values.

For example, an order submission might contain:

```json
{"order_id":"demo-001","quantity":"2","status":"pending","items":[{"sku":"BLUE-MUG","price":12.5}]}
```

The quantity is a string, the price is a number, and items is an array of objects. Those distinctions matter even when the values appear similar on screen. Replacing the whole payload with a flat list would remove evidence about nesting and types.

Change one relevant property at a time and record the result. If you change types, encoding, field names, and endpoint simultaneously, a successful response will not tell you which change resolved the problem. Keep the small reproducible example alongside the expected result so another developer can repeat the check.

## Use JSON formatting to see structure

Paste the invented sample into [JSON Formatter](/tools/json-formatter.html). Indentation makes it easier to see the items array and distinguish its fields from the outer order. It also helps reveal a misplaced closing bracket or an unexpectedly nested object.

Formatting establishes that an input can be parsed as JSON by this tool. It does not establish that the payload satisfies an API's schema or business rules. Our quantity value, "2", is valid JSON, but an API expecting an integer can reject it. Likewise, null, the string "null", an empty string, and an absent field have different meanings.

Use the API's own contract to decide whether a field should be required, nullable, numeric, or constrained to a particular set of values. A formatter cannot infer that contract from a pasted object. Compare status values exactly, including case, and check whether the receiver expects a single object or an array.

Ordinary JSON uses double-quoted property names and strings. Comments and trailing commas belong to other formats or extensions, rather than standard JSON. If a configuration file permits JSONC or JSON5, do not assume an endpoint accepting JSON permits those additions too.

When parsing fails, inspect the reported location and the preceding structure. A missing quote or comma can make the parser complain later than the original mistake. Reduce the sample until it parses, then add the relevant fields back while retaining a copy of the failing input.

## Check numbers and duplicate keys before reformatting

JavaScript parsing can lose precision for large numeric identifiers. If a system's contract defines an identifier as a string, preserve it as a string from the start. A formatter cannot recover digits already changed by parsing in an earlier application.

Duplicate property names create another risk. In a sample such as {"status":"pending","status":"approved"}, ordinary parsing does not preserve two independent status fields for review. Inspect the original input when duplicates are suspected, and check the receiver's behavior. Do not rely on a reformatted result to prove that the original had no repeated keys.

The [MDN documentation for JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) describes parsing and the precision issue. For debugging, the practical rule is to preserve the original text and validate the parsed value against the receiving system's requirements.

## Check a Base64 round trip with a known string

Use [Base64 Tool](/tools/base64-tool.html) with a small known example. Encoding Hello should produce SGVsbG8=. Decoding that value should return Hello. A successful round trip verifies a specific transformation with that sample; it does not prove that every possible file or application field uses the same representation.

Base64 is an encoding, so anyone who receives the encoded value can decode it. Treat an encoded secret as a secret. Do not post a live token publicly because its contents are difficult to read at first glance.

Check the field's specification before changing padding or characters. Standard Base64, Base64url, and a data URL containing a Base64 payload are related representations with different conventions. A data URL may include a prefix identifying the media type. Feeding the entire prefix to a decoder that expects only encoded data can fail.

ASCII examples are only the first check. If the application handles accented text or emoji, test a small Unicode sample through the complete sender and receiver workflow. Browser APIs operate on particular byte and string representations; a successful ASCII example does not establish correct handling of UTF-8 everywhere. This tool is a text utility, rather than a general binary-file inspector.

[MDN's atob documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/atob) explains the browser's decoding primitive. When debugging an integration, identify both the byte encoding and the Base64 variant expected by the field.

## Encode URL values without changing URL structure

Consider a search value of tea & biscuits. The ampersand is part of the intended value, but an unescaped ampersand in a query string separates parameters. Encoding the value protects that character's role in the request.

Use [URL Encoder/Decoder](/tools/url-encoder-decoder.html) to inspect a component, then build the actual request with your application's URL APIs. Keep the scheme, hostname, path structure, and parameter delimiters separate from the value being encoded. Encoding an entire URL as though it were one component can turn its structural characters into data.

A plus sign also needs context. Some query-string conventions use plus for a space, while a literal plus belongs to the value. Compare what your client sends with what the server receives. Avoid decoding twice: after one decoding pass, a percent sequence that was originally data can become a different character if decoded again.

Encoding does not validate the destination or authorize a request. For a redirect, webhook, or user-supplied URL, apply the application's destination and access rules separately. A nicely encoded URL can still point to the wrong place.

## Read JWT claims as unverified data

[JWT Decoder](/tools/jwt-decoder.html) makes a token's encoded header and payload readable. That can help identify a claimed issuer, audience, or expiration time in a test environment. The decoded display does not establish that the token is authentic or that its claims should be trusted.

Verification belongs to the receiving application. It must use the appropriate keys and permitted algorithms, validate the signature where applicable, enforce its expected issuer and audience, and apply time and authorization checks required by its protocol. A token that decodes successfully can still be expired, forged, issued for a different service, or unauthorized for an operation.

Use a disposable test token rather than a live bearer credential in a debugging screenshot. Anyone obtaining a live bearer token may be able to use its granted access. If a credential is exposed, handle it through your application's revocation or rotation process; deleting the screenshot is not the same as invalidating the token.

JWT NumericDate values use seconds since the Unix epoch. A JavaScript date constructor expects milliseconds, so blindly passing a token's timestamp to it can produce a date near 1970. Check the unit before converting. [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) defines JWT claims and their meaning; your application's profile determines which checks are required in its workflow.

## Compare text and hashes with the input bytes in mind

Use [Text Diff Checker](/tools/text-diff-checker.html) to compare small expected and actual text samples. It is helpful for spotting a changed field, missing line, or extra character before investigating deeper system behavior. Keep sensitive values out of a shared comparison.

For a digest check, [Hash Generator](/tools/hash-generator.html) operates on text input. A trailing newline, different capitalization, or another Unicode representation can change the bytes and therefore the digest. Record exactly what input you used and whether you expect a newline at the end.

A matching digest is useful when comparing with a trusted expected value. A hash displayed beside an untrusted download does not, by itself, establish who created it: someone able to replace both values can replace both. This text utility also does not provide a password-storage system. An application storing passwords needs an appropriate password-hashing design and parameters rather than a pasted fast digest.

When two hashes differ, first compare the text and encoding assumptions. Do not repeatedly hash an unchanged input hoping for a different result. Preserve the evidence that explains the difference, such as an extra line ending or a value converted from a number to a string.

## Inspect CSV conversion as a data transformation

[CSV to JSON](/tools/csv-to-json.html) helps inspect tabular data in an object structure. Check the headings, row count, and values after conversion instead of accepting an attractive JSON display as proof that the import is correct.

Use a small sample with a quoted comma, such as a description containing blue, medium. The comma belongs inside the quoted field, not between two columns. Also test a blank value and a value containing quotes if those cases occur in the source data.

Identifiers with leading zeros, postal codes, and date-like values deserve special attention. They often need to remain strings. Check the receiving application's schema before allowing a conversion or import stage to interpret them as numbers or dates. Compare the transformed sample with the original rows so a shifted column is caught before a larger import.

## Keep units and test identifiers explicit

For timestamps, use [Unix Timestamp Converter](/tools/unix-timestamp-converter.html) after determining whether the source supplies seconds or milliseconds. A factor of 1,000 can explain an apparently impossible date. Include the source unit and timezone convention in a bug report rather than providing only an ambiguous number.

[Unit Converter](/tools/unit-converter.html) can help inspect a supported physical-unit conversion, but verify that the application's field uses that dimension and definition. A numeric result in the wrong unit remains the wrong input.

[UUID Generator](/tools/uuid-generator.html) supplies test identifiers. An identifier is not permission to access the associated object; authorization belongs in the application. Likewise, [User-Agent Generator](/tools/user-agent-generator.html) supplies sample browser strings for controlled tests. A user-agent string alone does not establish a visitor's identity or prove actual device capabilities.

For signup testing that needs an inbox, use a suitable test account and plan for recovery. A temporary inbox is a poor recovery channel for an account that must remain accessible. The separate [temporary-email guide](/journal/temporary-email-for-authorized-testing-and-permitted-messages) covers that decision and the provider's privacy limits.

## Finish with a reproducible result

A useful debugging note contains the smallest failing sample, the expected result, the observed result, and the single change that corrected it. Keep versions and relevant environment details where they affect reproduction. That record is more actionable than a screenshot of a large formatted payload with no explanation.

The text utilities described here perform their transformations in the browser. Loading the page and its supporting assets still involves network requests. Browser processing does not promise anonymity or erase copies from the clipboard, downloaded files, screenshots, or your device. The [Privacy Policy](/privacy-policy.html) describes the site's data practices.

Repeat the corrected sample in the real integration's test environment. A local utility can clarify a value, but only the receiving system can establish that the complete request satisfies its protocol, schema, and authorization requirements.

## Download and reproduce one connected workflow

Use the fictional records in [this CSV input](/assets/examples/developer/quoted-newline.csv). Enable headers in [CSV to JSON](/tools/csv-to-json.html) and compare [the expected JSON](/assets/examples/developer/expected.json). The quoted comma remains in the name, the quoted newline remains inside note, and 001 remains a string. A repeated header such as id,id is rejected.

Minify with [JSON Formatter](/tools/json-formatter.html) and compare [the exact minified text](/assets/examples/developer/expected.min.json). Encode that text with [Base64](/tools/base64-tool.html), compare [the expected Base64](/assets/examples/developer/expected.base64.txt), then decode it back. Compare the escaped newline and all other characters.

The [workflow manifest](/assets/examples/developer/workflow.json) records SHA-256 of the minified UTF-8 text. The fixtures use LF, and the minified and Base64 files have no trailing newline. Pretty-printing or adding a newline changes the digest even when parsed values remain equivalent. These samples contain no live user data or usable token.
