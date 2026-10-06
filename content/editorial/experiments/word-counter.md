## One visible symbol can have several character units

We tested the Anvil Tools [Word Counter](/tools/word-counter.html) with twelve short inputs covering emoji, accented text, Chinese, invisible separators, punctuation, and paragraphs. A family emoji appeared as one visible symbol but counted as eleven character units. Two visually similar spellings of café counted as four and five units.

These results explain what the tool measures. They do not establish a universal definition of a word or character. The counter splits words at whitespace and counts characters using JavaScript UTF-16 string length. Those rules are useful for quick estimates, but can differ from an application's submission limit or a language-aware editor.

The recorded runs are dated October 6, 2026. Download the [exact input fixture](/assets/examples/experiments/word-counter-cases.json) and [observed browser output](/assets/examples/experiments/results.json). The fixture includes the Unicode separators that are hard to distinguish by looking at text.

## Twelve measured examples

| Input | Words | Characters | Without whitespace | Sentences | Paragraphs |
| --- | --- | --- | --- | --- | --- |
| Empty input | 0 | 0 | 0 | 0 | 0 |
| Hello world. | 2 | 12 | 11 | 1 | 1 |
| Two smiling emoji separated by a space | 2 | 5 | 4 | 1 | 1 |
| Family emoji | 1 | 11 | 11 | 1 | 1 |
| café with a composed é | 1 | 4 | 4 | 1 | 1 |
| café with e plus a combining accent | 1 | 5 | 5 | 1 | 1 |
| 你好世界 | 1 | 4 | 4 | 1 | 1 |
| one, zero-width space, two | 1 | 7 | 7 | 1 | 1 |
| one, nonbreaking space, two | 2 | 7 | 6 | 1 | 1 |
| well-known fact | 2 | 15 | 14 | 1 | 1 |
| Hi...there? | 1 | 11 | 11 | 2 | 1 |
| One. then a blank line then Two! | 2 | 10 | 8 | 2 | 2 |

All nonempty examples display a one-minute reading estimate. Empty input displays zero minutes. That estimate rounds up at 200 whitespace-delimited words per minute, so it is intentionally coarse for these tiny inputs.

## Emoji and character limits

The smiling emoji uses two UTF-16 units. A pair separated by one ordinary space therefore counts as five units in total. Removing whitespace leaves four. The family emoji combines multiple emoji with zero-width joiners, giving eleven units while still rendering as a single family symbol.

![Actual word-counter run for a family emoji: one word, eleven character units.](/assets/images/editorial/unicode-count-experiment.png)

A platform might limit Unicode code points, visible grapheme clusters, bytes, or UTF-16 units. Each would produce a different answer for this example. Before submitting a biography, an SMS message, or a database field, check the receiving system's own rule. Our character number is not an assurance that the destination will accept the text.

## Accents and invisible spaces

The composed spelling `café` uses one unit for é. The visually similar decomposed spelling uses e followed by a combining acute accent, so the full word uses five units. The tool does not normalize Unicode before counting. Copying from two editors can therefore yield different counts even when the rendered word looks the same.

The zero-width-space example counts as one word because U+200B is not matched as whitespace by this tool's splitting rule. The nonbreaking-space example counts as two words, and that separator is removed from the “without spaces” count. That label covers whitespace such as line breaks and tabs as well as ordinary spaces.

Do not delete invisible characters merely to obtain a smaller count. Some carry layout or language meaning. Inspect a small example and decide whether the destination requires normalization or a different separator.

## Languages and punctuation

The Chinese input contains four characters and no spaces. This counter reports one word. That is a consequence of the whitespace rule, not a linguistic analysis of the sentence. For Chinese, Thai, or other text where words are not reliably separated by spaces, use a language-aware word-counting rule when accurate word segmentation is required.

`well-known fact` reports two words; the hyphen does not split the first token. `Hi...there?` reports one whitespace word but two sentence fragments because periods and question marks delimit the sentence estimate. Abbreviations, decimals, ellipses, and punctuation in data can produce surprising sentence counts. A blank line separates the two tested paragraphs; a single wrapped display line does not create another paragraph.

## Choosing the right check

For a rough draft length, the whitespace count is fast and predictable. For a publication's official word limit, follow its specified counting method. For speech timing, read the text aloud; the fixed silent-reading estimate cannot account for pauses or difficult terminology.

These twelve cases document the current implementation in the recorded browsers. They are not a benchmark of all languages or an accessibility study of emoji rendering. Keep your source text and use the [Text Difference Checker](/tools/text-diff-checker.html) when an edit changes punctuation or separators. The [CSV experiment](/blog/csv-quotes-unicode-and-blank-fields.html) demonstrates a related case where a visible line break belongs inside one data value.
