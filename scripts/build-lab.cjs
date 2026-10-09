// Build the public editorial policy, reproducible Lab, category guide hubs,
// and compact evidence cards from reviewed local sources and recorded results.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { categoryLabel, displayDate } = require('../backend/src/lib/articles');
const { canonicalFooter, canonicalHeader } = require('./public-chrome.cjs');

const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const origin = 'https://anviltools.vercel.app';
const library = require('../content/editorial/published-library.json');
const reviews = require('../backend/src/lib/article-reviews.json');
const recorded = require('../frontend/assets/examples/experiments/results.json');
const browsers = recorded.runs.map(run => `${run.browser} ${run.version}`).join(' and ');
const escape = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(frontend, file))).digest('hex');
const writeChanged = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) fs.writeFileSync(file, content);
};

const toolNames = {
  'background-remover': 'Background Remover', 'base64-tool': 'Base64 Encoder & Decoder',
  'color-palette-generator': 'Color Palette Generator', 'csv-to-json': 'CSV to JSON Converter',
  'hash-generator': 'Hash Generator', 'image-to-pdf': 'Image to PDF Converter',
  'json-formatter': 'JSON Formatter & Validator', 'jwt-decoder': 'JWT Decoder',
  'password-generator': 'Password Generator', 'pdf-merge': 'PDF Merge',
  'qr-code-generator': 'QR Code Generator', 'temp-mail': 'Temporary Email Generator',
  'text-case-converter': 'Text Case Converter', 'text-diff-checker': 'Text Difference Checker',
  'unit-converter': 'Unit Converter', 'unix-timestamp-converter': 'Unix Timestamp Converter',
  'url-encoder-decoder': 'URL Encoder & Decoder', 'user-agent-generator': 'User-Agent String Reference',
  'uuid-generator': 'UUID Generator', 'word-counter': 'Word & Character Counter',
};

function page({ title, description, pathname, body, prefix = '' }) {
  const canonical = origin + pathname;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} | Anvil Tools</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${canonical}"><link rel="icon" type="image/png" sizes="48x48" href="/assets/images/favicon-48.png"><link rel="shortcut icon" href="/favicon.ico"><link rel="apple-touch-icon" sizes="180x180" href="/assets/images/apple-touch-icon.png"><link rel="stylesheet" href="${prefix}assets/css/style.css"><link rel="stylesheet" href="${prefix}assets/css/refinements.css"><link rel="stylesheet" href="${prefix}assets/css/design.css"><link rel="stylesheet" href="${prefix}assets/css/content.css"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)} | Anvil Tools"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary"></head><body class="public-site"><a class="skip-link" href="#main-content">Skip to content</a>${canonicalHeader(pathname)}<main class="wrap" id="main-content">${body}</main>${canonicalFooter()}<script src="${prefix}assets/js/main.js" defer></script></body></html>`;
}

const policyLd = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Organization', '@id': `${origin}/editorial-policy.html#velloxtech-editorial-team`,
  name: 'VelloxTech Editorial Team', url: `${origin}/editorial-policy.html`, parentOrganization: { '@type': 'Organization', name: 'VelloxTech', url: `${origin}/about.html` },
});
const policyBody = `<script type="application/ld+json">${policyLd}</script><p class="breadcrumbs"><a href="/">Home</a> / <span>Editorial policy</span></p><section class="hero"><span class="eyebrow">Accountability and evidence</span><h1>Editorial and testing methodology</h1><p class="lede">How VelloxTech maintains Anvil Tools, tests browser utilities, selects sources, reviews assisted drafts, and corrects errors.</p></section><div class="content-guide"><section class="info-section" id="velloxtech-editorial-team"><h2>Who maintains Anvil Tools</h2><p>Anvil Tools is operated and maintained by VelloxTech. Guides are attributed to the VelloxTech Editorial Team because the work is maintained collectively; we do not invent individual biographies, credentials, or independent reviewers.</p><p><a href="/contact.html">Report an error or suggest a correction</a>. Include the page URL, the statement or behavior at issue, and a small synthetic example. Never send passwords, live tokens, private messages, or confidential documents.</p></section><section class="info-section"><h2>How tools are tested</h2><ol><li>Define a real question and a fixed expected result before the run.</li><li>Create harmless synthetic inputs without personal information.</li><li>Run the public interface, not a separate hidden implementation.</li><li>Save the observed result, environment, date, screenshot or output, and downloadable fixture.</li><li>Use an independent check when practical—for example, reopen a generated PDF with a parser or compare an exact hash.</li><li>Publish limitations and failed cases alongside successful results.</li></ol><p>The <a href="/lab/index.html">Anvil Tools Lab</a> contains the reproducible reports and fixture hashes.</p></section><section class="info-section"><h2>Browsers, devices, and coverage</h2><p>The current recorded browser suite includes ${escape(browsers)} on a 1100 × 850 desktop viewport. Responsive layout checks use additional automated viewport sizes. A report names physical-device or printer testing only when it actually occurred; automated Chromium checks do not establish compatibility with every browser, phone, assistive technology, printer, email client, or external service.</p></section><section class="info-section"><h2>Inputs, expected outputs, and privacy</h2><p>Tests use invented text, generated files, public-format examples, or attributed licensed media. Fixture pages label synthetic data and publish SHA-256 hashes so visitors can verify exact bytes. Sensitive production data is not required for a useful reproduction.</p><p>A passing fixture proves the recorded case in the stated environment. It does not prove unlimited file capacity, regulatory compliance, perfect accessibility, or correctness for every input.</p></section><section class="info-section"><h2>How sources are selected</h2><p>Technical claims prioritize primary sources: specifications, standards bodies, browser documentation, official product documentation, and direct measured results. Secondary sources may provide context but do not replace the controlling specification or an observed test. Links are reviewed for relevance and claims are phrased within the evidence available.</p></section><section class="info-section"><h2>AI assistance and fact-checking</h2><p>AI may assist with drafting, outlining, editing, test-case suggestions, or identifying statements that need verification. Assisted material is not published automatically. VelloxTech manually reviews the final text, checks factual claims against cited sources or recorded results, removes unsupported claims, and keeps safety-sensitive examples synthetic. AI assistance is not presented as an independent reviewer.</p></section><section class="info-section"><h2>Review dates, updates, and corrections</h2><p>A visible “Last reviewed” date is shown only while the guide title, excerpt, and body match the reviewed version recorded in the repository. Material changes invalidate that marker until the new version is reviewed. Corrections preserve the previous database version and are recorded in an audit log when the publishing workflow supports it.</p><p>Small typographic repairs may not change the conclusion. Factual, safety, privacy, or test-result corrections should be described in the relevant report’s change history.</p></section><section class="info-section"><h2>Advertising separation</h2><p>Advertising is not a substitute for useful publisher content. Private temporary-email controls, inboxes, message readers, generation controls, copy/download workflows, and pages without meaningful editorial content must remain free of advertising placements.</p></section></div>`;
writeChanged(path.join(frontend, 'editorial-policy.html'), page({ title: 'Editorial and testing methodology', description: 'How VelloxTech tests Anvil Tools, reviews sources and AI-assisted drafts, records evidence, and handles corrections.', pathname: '/editorial-policy.html', body: policyBody }));

const evidenceFiles = [
  ['examples/lab/duplicate-keys-unicode.json', 'JSON duplicate keys, Unicode, and escapes'],
  ['examples/lab/html-email-link-fixture.txt', 'Synthetic HTML email link source'],
  ['examples/lab/quoted-unicode.csv', 'CSV commas, quotes, newlines, and Unicode'],
  ['examples/lab/rtl-emoji-combining.txt', 'RTL, emoji, and combining text'],
  ['examples/lab/qr-strings.txt', 'Sample QR payloads'],
  ['examples/experiments/format-sample.jpg', 'JPEG comparison image'],
  ['examples/experiments/format-sample.png', 'PNG comparison image'],
  ['examples/experiments/format-sample.webp', 'WebP comparison image'],
  ['examples/pdf/cover.pdf', 'One-page cover PDF'],
  ['examples/pdf/application.pdf', 'Two-page application PDF'],
  ['examples/pdf/support.pdf', 'One-page support PDF'],
  ['examples/pdf/merged-example.pdf', 'Recorded four-page merged PDF'],
  ['examples/qr-check.png', 'Recorded QR PNG'],
].map(([relative, label]) => {
  const file = `assets/${relative}`;
  return { label, href: '/' + file.replaceAll('\\', '/'), bytes: fs.statSync(path.join(frontend, file)).size, sha256: sha256(file) };
});
writeChanged(path.join(frontend, 'assets/examples/lab/fixture-manifest.json'), JSON.stringify({
  created_by: 'Anvil Tools', data: 'Synthetic test data; no personal information; permitted for testing.', generated_at: '2026-10-09', files: evidenceFiles,
}, null, 2) + '\n');

const reports = [
  {
    slug: 'json-duplicate-keys-unicode-escapes', category: 'Developer tools', title: 'JSON duplicate keys, Unicode, and escaped-character test',
    question: 'Does the JSON formatter reject malformed syntax while preserving ordinary Unicode—and what happens to duplicate keys and unsafe integers?',
    tested: '2026-10-06', environment: `${browsers}; 1100 × 850 viewport.`, tool: ['json-formatter', 'JSON Formatter & Validator'], guide: ['valid-json-api-errors-types-nulls-structure', 'Why Valid JSON Still Breaks APIs'],
    expected: 'Malformed JSON is rejected and stale output is cleared. Unicode strings remain readable. The duplicate-key and unsafe-integer controls expose parser limitations rather than being treated as safe transformations.',
    observed: 'All 14 recorded cases matched the fixed expectations in both browser runs. The repeated role key produced only the final value, and 9007199254740993 serialized as 9007199254740992; the string form remained exact.',
    steps: ['Download the JSON fixture.', 'Paste it into the formatter and choose Minify JSON.', 'Compare the displayed output with the published recorded result.', 'Repeat with the numeric identifier as both a number and a string.'],
    limitations: 'This is not a complete JSON conformance suite. Successful parsing does not validate an API schema, detect every duplicate before parsing, or preserve arbitrary-precision numbers.',
    image: '/assets/images/editorial/json-precision-experiment.png', fixtures: ['/assets/examples/lab/duplicate-keys-unicode.json', '/assets/examples/experiments/json-cases.json', '/assets/examples/experiments/results.json'],
  },
  {
    slug: 'html-email-link-encoding', category: 'Email tools', title: 'Synthetic HTML email link-encoding inspection',
    question: 'Does a harmless HTML email fixture preserve an encoded plus sign, slash, Unicode name, and escaped ampersand in its confirmation link?',
    tested: '2026-10-09', environment: 'Static UTF-8 fixture inspection and standards-based URL decoding; no live mailbox, tracking pixel, or production recipient.', tool: ['temp-mail', 'Temporary Email Generator'], guide: ['why-html-emails-look-different-plain-text-css-mime', 'Why HTML Emails Look Different Across Inboxes'],
    expected: 'The HTML source contains &amp;amp; between parameters. URL decoding yields token A+B/C and name Zoë without turning the encoded plus into a space.',
    observed: 'The downloadable fixture contains only explanatory text and one example.com link. Its query uses A%2BB%2FC and Zo%C3%AB, which decode to the expected synthetic values.',
    steps: ['Download and inspect the HTML source.', 'Confirm the link uses example.com and contains no real token.', 'Open the file in a browser and inspect the destination without submitting data.', 'Use a real email-client matrix separately when inbox rendering—not URL syntax—is the question.'],
    limitations: 'A browser preview is not an email-client compatibility test. This report does not claim Gmail, Outlook, Apple Mail, or remote-image behavior.',
    sample: '<a href="https://example.com/confirm?token=A%2BB%2FC&amp;name=Zo%C3%AB">Confirm synthetic address</a>', fixtures: ['/assets/examples/lab/html-email-link-fixture.txt'],
  },
  {
    slug: 'qr-capacity-error-correction', category: 'Generators', title: 'QR payload density and error-correction preflight',
    question: 'What does the current QR generator actually produce, and which capacity and recovery limits still require final-device testing?',
    tested: '2026-10-05', environment: 'Recorded browser-generated PNG; independent decode of the saved output. The public tool uses error-correction level H and a 180 × 180 canvas.', tool: ['qr-code-generator', 'QR Code Generator'], guide: ['qr-codes-scan-reliably-print-screen-guide', 'QR Codes That Scan Reliably'],
    expected: 'The saved QR decodes to the exact controlled destination and retains a clear surrounding margin. Longer payloads should be treated as denser symbols, not assumed to fit the same print size.',
    observed: 'The recorded PNG was independently decoded to https://nevco.online/. The report fixture supplies short, URL, and Unicode payloads for repeat checks; the current UI does not expose a correction-level selector.',
    steps: ['Download the recorded QR PNG and payload list.', 'Decode the PNG with an independent scanner.', 'Generate each supplied payload and compare visual density.', 'Scan the final downloaded or printed artifact at its intended size.'],
    limitations: 'One successful computer decode does not establish camera, printer, paper, lighting, distance, damage, or every payload capacity. The tool fixes correction level at H.',
    image: '/assets/examples/qr-check.png', fixtures: ['/assets/examples/qr-check.png', '/assets/examples/qr-print-check.pdf', '/assets/examples/lab/qr-strings.txt'],
  },
  {
    slug: 'jpeg-png-webp-image-to-pdf', category: 'Image tools', title: 'JPEG, PNG, and WebP conversion evidence',
    question: 'How do three encodings of the same 640 × 400 synthetic image differ before and after Image to PDF conversion?',
    tested: '2026-10-06', environment: `${browsers}; 1100 × 850 viewport; output independently reopened with pypdf 6.1.1.`, tool: ['image-to-pdf', 'Image to PDF Converter'], guide: ['image-to-pdf-page-size-pixels-points-a4', 'Why Image-to-PDF Files Have Giant Pages'],
    expected: 'Each conversion creates one 640 × 400-point page with one 640 × 400 embedded image. PNG and WebP retain an alpha soft mask; flattened JPEG does not.',
    observed: 'Six downloads—three formats in each browser—matched the expected page dimensions and image dimensions. The recorded source sizes are 16,987-byte JPEG, 18,067-byte PNG, and 8,250-byte lossless WebP.',
    steps: ['Download the three source images.', 'Convert each separately with Image to PDF.', 'Open the PDF and compare page dimensions and transparency behavior.', 'Compare your hash only with the recorded artifact from the same run; fresh PDF bytes may differ.'],
    limitations: 'This single illustration does not rank formats for every photograph, color profile, encoder, or printer. The PDF contains an image, not searchable text.',
    image: '/assets/images/editorial/image-format-experiment.png', fixtures: ['/assets/examples/experiments/format-sample.jpg', '/assets/examples/experiments/format-sample.png', '/assets/examples/experiments/format-sample.webp', '/assets/examples/experiments/pdf-inspection.json'],
  },
  {
    slug: 'pdf-merge-page-types-order', category: 'PDF tools', title: 'PDF merge order, page size, and text-layer check',
    question: 'Does merging a one-page cover, two-page application, and one support page preserve whole-file order and mixed page dimensions?',
    tested: '2026-10-05', environment: 'Browser PDF Merge run using synthetic PDFs; output reopened with an independent PDF parser.', tool: ['pdf-merge', 'PDF Merge'], guide: ['simple-pdf-workflow-without-software', 'PDF Workflows: Merge Files, Convert Images, and Check the Result'],
    expected: 'Four pages in cover, application page 1, application page 2, support order; dimensions 420 × 594, 400 × 600, 401 × 601, and 360 × 480 points.',
    observed: 'The recorded merged fixture contains four pages in the expected whole-file order and retains the intentionally different page sizes. The merge does not standardize layout or run OCR.',
    steps: ['Download the three source PDFs.', 'Add them to PDF Merge and arrange cover, application, support.', 'Merge and compare the download with the recorded four-page fixture.', 'Inspect forms, signatures, bookmarks, links, and accessibility separately when they matter.'],
    limitations: 'The fixture uses simple unencrypted PDFs. It does not prove preservation of digital signatures, interactive forms, attachments, bookmarks, tags, or encrypted files.',
    image: '/assets/images/editorial/pdf-ordering-example.png', fixtures: ['/assets/examples/pdf/cover.pdf', '/assets/examples/pdf/application.pdf', '/assets/examples/pdf/support.pdf', '/assets/examples/pdf/merged-example.pdf'],
  },
  {
    slug: 'unicode-emoji-rtl-word-count', category: 'Text tools', title: 'Unicode, emoji, RTL, and combining-character counting',
    question: 'How does the current word counter treat emoji sequences, composed and combining accents, non-breaking spaces, zero-width spaces, and text without ordinary spaces?',
    tested: '2026-10-06', environment: `${browsers}; 1100 × 850 viewport.`, tool: ['word-counter', 'Word & Character Counter'], guide: ['voiceover-script-length-words-per-minute-video-timing', 'How Long Should a Voiceover Script Be?'],
    expected: 'Counts follow the documented whitespace and JavaScript UTF-16 rules, even where those rules differ from grapheme clusters or linguistic words.',
    observed: 'Both browser runs matched all 12 fixed cases. A family emoji was one whitespace-delimited word and 11 UTF-16 code units; café used four units while the visually similar combining form used five.',
    steps: ['Download the text fixture and recorded cases.', 'Paste one line at a time into Word Counter.', 'Compare words, characters, characters without spaces, sentences, and paragraphs.', 'Use the receiving platform’s rule when a submission has a strict limit.'],
    limitations: 'This is not language-aware tokenization or grapheme-cluster counting. RTL display, screen-reader pronunciation, and platform-specific limits need separate testing.',
    image: '/assets/images/editorial/unicode-count-experiment.png', fixtures: ['/assets/examples/lab/rtl-emoji-combining.txt', '/assets/examples/experiments/word-counter-cases.json', '/assets/examples/experiments/results.json'],
  },
];

function reportBody(report) {
  const visual = report.image ? `<figure class="article-example"><img src="${report.image}" alt="Recorded output for ${escape(report.title)}" loading="lazy"><figcaption>Recorded first-party output associated with this report.</figcaption></figure>` : `<div class="callout"><strong>Output sample</strong><pre><code>${escape(report.sample)}</code></pre></div>`;
  return `<p class="breadcrumbs"><a href="/">Home</a> / <a href="/lab/index.html">Lab</a> / <span>${escape(report.category)}</span></p><article class="published-article"><header class="article-header"><span class="eyebrow">${escape(report.category)}</span><h1>${escape(report.title)}</h1><p class="lede">${escape(report.question)}</p><p class="article-meta">Written by: <a href="/editorial-policy.html#velloxtech-editorial-team" rel="author">VelloxTech Editorial Team</a></p><p class="article-meta">Last tested: <time datetime="${report.tested}">${displayDate(report.tested)}</time></p><p class="article-meta"><a href="/contact.html">Report an error or suggest a correction</a></p></header>${visual}<div class="article-content"><h2>Test environment</h2><p>${escape(report.environment)}</p><h2>Fixture and expected result</h2><p>${escape(report.expected)}</p><h2>Reproduction steps</h2><ol>${report.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol><h2>Observed result</h2><p>${escape(report.observed)}</p><h2>Downloadable evidence</h2><ul>${report.fixtures.map(href => `<li><a href="${href}" download>${escape(path.basename(href))}</a></li>`).join('')}</ul><p>The <a href="/lab/fixtures.html">fixture library</a> publishes SHA-256 hashes for exact-byte verification.</p><h2>What this test does not establish</h2><p>${escape(report.limitations)}</p><h2>Related tool and guide</h2><p><a href="/tools/${report.tool[0]}.html">${escape(report.tool[1])}</a> · <a href="/journal/${report.guide[0]}">${escape(report.guide[1])}</a></p><h2>Change history</h2><ul><li><time datetime="2026-10-09">October 9, 2026</time>: Report organized under Anvil Tools Lab; evidence and limitations reviewed.</li></ul></div></article>`;
}
for (const report of reports) writeChanged(path.join(frontend, 'lab/reports', `${report.slug}.html`), page({ title: report.title, description: report.question, pathname: `/lab/reports/${report.slug}.html`, prefix: '../../', body: reportBody(report) }));

const cards = reports.map(report => `<article class="tool-card"><span class="category-tag">${escape(report.category)}</span><h2><a href="/lab/reports/${report.slug}.html">${escape(report.title)}</a></h2><p>${escape(report.question)}</p><p class="small-note">Last tested ${displayDate(report.tested)}</p><a class="tool-link" href="/lab/reports/${report.slug}.html">Read reproducible report &#8594;</a></article>`).join('');
writeChanged(path.join(frontend, 'lab/index.html'), page({ title: 'Anvil Tools Lab', description: 'Reproducible edge-case reports with synthetic fixtures, recorded environments, observed results, limitations, and exact hashes.', pathname: '/lab/index.html', prefix: '../', body: `<p class="breadcrumbs"><a href="/">Home</a> / <span>Lab</span></p><section class="hero"><span class="eyebrow">First-party evidence</span><h1>Anvil Tools Lab</h1><p class="lede">Reproducible edge-case reports built from synthetic inputs, actual tool runs, recorded outputs, and limitations—not generic compatibility promises.</p><div class="hero-actions"><a class="btn primary" href="/lab/fixtures.html">Browse fixtures</a><a href="/lab/compatibility.html">Compatibility matrix &#8594;</a></div></section><section><h2>Six category reports</h2><div class="tool-grid">${cards}</div></section><section class="info-section"><h2>How to read a report</h2><p>A report answers one narrow question. It names its environment and date, publishes the exact fixture or result, separates expected from observed behavior, and states what the run cannot prove. Read the <a href="/editorial-policy.html">editorial and testing methodology</a> for the full review process.</p></section>` }));

const fixtureRows = evidenceFiles.map(file => `<tr><td><a href="${file.href}" download>${escape(file.label)}</a></td><td>${file.bytes.toLocaleString('en-US')}</td><td><code>${file.sha256}</code></td></tr>`).join('');
writeChanged(path.join(frontend, 'lab/fixtures.html'), page({ title: 'Synthetic fixture library', description: 'Harmless Anvil Tools test fixtures with provenance, byte sizes, and SHA-256 hashes for reproducible checks.', pathname: '/lab/fixtures.html', prefix: '../', body: `<p class="breadcrumbs"><a href="/">Home</a> / <a href="/lab/index.html">Lab</a> / <span>Fixtures</span></p><section class="hero"><span class="eyebrow">Download and verify</span><h1>Synthetic fixture library</h1><p class="lede">Created by Anvil Tools. Synthetic test data. No personal information. Permitted for testing.</p></section><section class="info-section"><h2>Fixture manifest</h2><p>Download the <a href="/assets/examples/lab/fixture-manifest.json">machine-readable manifest</a>. Hashes identify exact bytes; they do not certify that a file is safe for an unrelated workflow.</p><div class="table-scroll" role="region" aria-label="Fixture hashes" tabindex="0"><table><thead><tr><th>Fixture</th><th>Bytes</th><th>SHA-256</th></tr></thead><tbody>${fixtureRows}</tbody></table></div></section><section class="info-section"><h2>Handling rules</h2><ul><li>Keep fixtures separate from production records.</li><li>Never replace sample tokens with live credentials.</li><li>Review downloaded PDFs and images before forwarding them.</li><li>Use only systems you own or are authorized to test.</li></ul></section>` }));

const compatibilityRows = reports.map(report => `<tr><td><a href="/lab/reports/${report.slug}.html">${escape(report.category)}</a></td><td>${escape(report.environment)}</td><td>${displayDate(report.tested)}</td><td>${escape(report.limitations)}</td></tr>`).join('');
writeChanged(path.join(frontend, 'lab/compatibility.html'), page({ title: 'Lab compatibility matrix', description: 'Recorded environments and explicit coverage limits for Anvil Tools Lab reports.', pathname: '/lab/compatibility.html', prefix: '../', body: `<p class="breadcrumbs"><a href="/">Home</a> / <a href="/lab/index.html">Lab</a> / <span>Compatibility</span></p><section class="hero"><span class="eyebrow">Measured, not assumed</span><h1>Compatibility matrix</h1><p class="lede">A compact record of what was tested, when it was tested, and what still requires a separate check.</p></section><section class="info-section"><div class="table-scroll" role="region" aria-label="Lab compatibility" tabindex="0"><table><thead><tr><th>Report</th><th>Recorded environment</th><th>Last tested</th><th>Coverage limit</th></tr></thead><tbody>${compatibilityRows}</tbody></table></div><p>Browser versions are frozen evidence from the recorded run, not a promise about future releases. See the <a href="/editorial-policy.html">testing methodology</a>.</p></section>` }));

// Expand each public category page into a complete guide hub.
for (const category of ['developer-tools', 'email-tools', 'generators', 'image-tools', 'pdf-tools', 'text-tools']) {
  const file = path.join(frontend, 'categories', `${category}.html`);
  if (!fs.existsSync(file)) continue;
  const guides = library.filter(item => item.category_slug === category);
  const hub = `<!-- category-guide-hub --><section class="info-section" aria-labelledby="category-guides-title"><h2 id="category-guides-title">All ${escape(categoryLabel(category).toLowerCase())} guides</h2><p>Reviewed guides, related tools, and the latest recorded review date.</p><div class="tool-grid">${guides.map(item => { const review = reviews[item.slug]; const tool = item.tools[0]; return `<article class="tool-card"><span class="category-tag">${escape(categoryLabel(category))}</span><h3><a href="/journal/${item.slug}">${escape(item.title)}</a></h3><p>${escape(item.excerpt)}</p><p class="small-note">Last updated ${displayDate(review?.reviewed_at || item.published_at)} · Related tool: <a href="/tools/${tool}.html">${escape(toolNames[tool] || tool)}</a></p><a class="tool-link" href="/journal/${item.slug}">Read guide &#8594;</a></article>`; }).join('')}</div></section><!-- /category-guide-hub -->`;
  let html = fs.readFileSync(file, 'utf8').replace(/<!-- category-guide-hub -->[\s\S]*?<!-- \/category-guide-hub -->/, '');
  html = html.replace('</main>', `${hub}</main>`);
  writeChanged(file, html);
}

const testCards = {
  'json-formatter': ['October 6, 2026', 'JSON text', 'Runs in this browser', '14 fixed cases; no general maximum claimed', 'Duplicate keys collapse during parsing; unsafe integers can change.', 'Input stays in the browser.', 'json-duplicate-keys-unicode-escapes'],
  'temp-mail': ['October 5, 2026', 'Non-sensitive synthetic messages', 'Anvil backend and Guerrilla Mail provider', 'Website inbox access up to one hour', 'Delivery, acceptance, retention, and deletion are not guaranteed.', 'Do not use sensitive, recovery, medical, financial, or private messages.', 'html-email-link-encoding'],
  'qr-code-generator': ['October 5, 2026', 'Short text and URLs', 'Runs in this browser', 'Recorded controlled URL; no universal capacity claim', 'Final scanability depends on payload, size, contrast, print, camera, and environment.', 'Input stays in the browser.', 'qr-capacity-error-correction'],
  'image-to-pdf': ['October 6, 2026', 'JPEG, PNG, and WebP images', 'Runs in this browser', '640 × 400 fixtures up to 18,067 bytes', 'Creates image pages; it does not add OCR or a standard paper size.', 'Selected images are not sent to an Anvil conversion server.', 'jpeg-png-webp-image-to-pdf'],
  'pdf-merge': ['October 5, 2026', 'Unencrypted PDF files', 'Runs in this browser', 'Four-page synthetic fixture', 'Signatures, forms, bookmarks, attachments, tags, and encrypted files need separate checks.', 'Selected PDFs are not sent to an Anvil merge server.', 'pdf-merge-page-types-order'],
  'word-counter': ['October 6, 2026', 'Plain text and Unicode', 'Runs in this browser', '12 fixed edge cases; no general maximum claimed', 'Whitespace words and UTF-16 units are not linguistic words or grapheme clusters.', 'Input stays in the browser.', 'unicode-emoji-rtl-word-count'],
};
for (const [slug, values] of Object.entries(testCards)) {
  const file = path.join(frontend, 'tools', `${slug}.html`);
  let html = fs.readFileSync(file, 'utf8').replace(/<!-- lab-test-card -->[\s\S]*?<!-- \/lab-test-card -->/, '');
  const labels = ['Tested', 'Input types', 'Processing', 'Maximum tested size', 'Observed limitation', 'Privacy note'];
  const card = `<!-- lab-test-card --><section class="info-section lab-test-card"><h2>Tool test card</h2><dl>${labels.map((label, index) => `<dt>${label}</dt><dd>${escape(values[index])}</dd>`).join('')}</dl><p><a href="/lab/reports/${values[6]}.html">Read the related reproducible Lab report</a></p></section><!-- /lab-test-card -->`;
  html = html.replace('<!-- reviewed-faq -->', `${card}<!-- reviewed-faq -->`);
  writeChanged(file, html);
}

console.log(`Built editorial policy, ${reports.length} Lab reports, fixture and compatibility pages, six category hubs, and ${Object.keys(testCards).length} tool test cards.`);
