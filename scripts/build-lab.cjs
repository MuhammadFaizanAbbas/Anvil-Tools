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
const experiments = require('../content/editorial/experiments.json');
const toolReadiness = require('../content/tool-readiness.json');
const reviews = require('../backend/src/lib/article-reviews.json');
const recorded = require('../frontend/assets/examples/experiments/results.json');
const browsers = recorded.runs.map(run => `${run.browser} ${run.version}`).join(' and ');
const reviewedAt = '2026-10-11';
const oldTempMailDescription = 'Receive non-sensitive messages for authorized testing or where disposable addresses are permitted.';
const tempMailDescription = 'Receive non-sensitive test messages for services you own, manage, or are allowed to test.';
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

const jsonLd = data => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
const velloxTechOrganization = {
  '@type': 'Organization', '@id': `${origin}/about.html#velloxtech`, name: 'VelloxTech',
  url: `${origin}/about.html`,
};
const organization = {
  '@type': 'Organization', '@id': `${origin}/#organization`, name: 'Anvil Tools',
  url: `${origin}/`,
  logo: {
    '@type': 'ImageObject', url: `${origin}/assets/images/apple-touch-icon.png`, width: 180, height: 180,
  },
  parentOrganization: { '@id': `${origin}/about.html#velloxtech` },
};
const editorialTeam = {
  '@type': 'Organization', '@id': `${origin}/editorial-policy.html#velloxtech-editorial-team`,
  name: 'VelloxTech Editorial Team', url: `${origin}/editorial-policy.html`,
  parentOrganization: { '@id': `${origin}/#organization` },
};
const breadcrumbs = (pathname, names) => ({
  '@type': 'BreadcrumbList', '@id': `${origin}${pathname}#breadcrumb`,
  itemListElement: names.map((entry, index) => ({
    '@type': 'ListItem', position: index + 1, name: entry.name, item: `${origin}${entry.path}`,
  })),
});
function injectManagedSchema(html, data) {
  const block = `<!-- page-structured-data -->${jsonLd(data)}<!-- /page-structured-data -->`;
  const clean = html.replace(/<!-- page-structured-data -->[\s\S]*?<!-- \/page-structured-data -->/, '');
  return clean.replace('</head>', `${block}</head>`);
}

const reportImageDimensions = {
  '/assets/images/editorial/json-precision-experiment.png': [1052, 546],
  '/assets/examples/qr-check.png': [180, 180],
  '/assets/images/editorial/image-format-experiment.png': [1052, 488],
  '/assets/images/editorial/pdf-ordering-example.png': [976, 623],
  '/assets/images/editorial/unicode-count-experiment.png': [1052, 658],
};

function page({ title, description, seoTitle = title, seoDescription = description, pathname, body, prefix = '', structuredData = null }) {
  const canonical = origin + pathname;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(seoTitle)} | Anvil Tools</title><meta name="description" content="${escape(seoDescription)}"><link rel="canonical" href="${canonical}"><link rel="icon" type="image/png" sizes="48x48" href="/assets/images/favicon-48.png"><link rel="shortcut icon" href="/favicon.ico"><link rel="apple-touch-icon" sizes="180x180" href="/assets/images/apple-touch-icon.png"><link rel="stylesheet" href="${prefix}assets/css/style.css"><link rel="stylesheet" href="${prefix}assets/css/refinements.css"><link rel="stylesheet" href="${prefix}assets/css/design.css"><link rel="stylesheet" href="${prefix}assets/css/content.css"><meta property="og:type" content="website"><meta property="og:title" content="${escape(seoTitle)} | Anvil Tools"><meta property="og:description" content="${escape(seoDescription)}"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary">${structuredData ? jsonLd(structuredData) : ''}</head><body class="public-site"><a class="skip-link" href="#main-content">Skip to content</a>${canonicalHeader(pathname)}<main class="wrap" id="main-content">${body}</main>${canonicalFooter()}<script src="${prefix}assets/js/main.js" defer></script></body></html>`;
}

const policyLd = JSON.stringify({
  '@context': 'https://schema.org', '@graph': [velloxTechOrganization, organization, editorialTeam],
});
const policyBody = `<script type="application/ld+json">${policyLd}</script><p class="breadcrumbs"><a href="/">Home</a> / <span>Editorial policy</span></p><section class="hero"><span class="eyebrow">Accountability and evidence</span><h1>Editorial and testing methodology</h1><p class="lede">How VelloxTech maintains Anvil Tools, tests browser utilities, selects sources, reviews assisted drafts, and corrects errors.</p></section><div class="content-guide"><section class="info-section" id="velloxtech-editorial-team"><h2>Who maintains Anvil Tools</h2><p>Anvil Tools is operated and maintained by VelloxTech. Guides are attributed to the VelloxTech Editorial Team because the work is maintained collectively; we do not invent individual biographies, credentials, or independent reviewers.</p><p><a href="/contact.html">Report an error or suggest a correction</a>. Include the page URL, the statement or behavior at issue, and a small synthetic example. Never send passwords, live tokens, private messages, or confidential documents.</p></section><section class="info-section"><h2>How tools are tested</h2><ol><li>Define a real question and a fixed expected result before the run.</li><li>Create harmless synthetic inputs without personal information.</li><li>Run the public interface, not a separate hidden implementation.</li><li>Save the observed result, environment, date, screenshot or output, and downloadable fixture.</li><li>Use an independent check when practical—for example, reopen a generated PDF with a parser or compare an exact hash.</li><li>Publish limitations and failed cases alongside successful results.</li></ol><p>The <a href="/lab/index.html">Anvil Tools Lab</a> contains the reproducible reports and fixture hashes.</p></section><section class="info-section"><h2>Browsers, devices, and coverage</h2><p>The current recorded browser suite includes ${escape(browsers)} on a 1100 × 850 desktop viewport. Responsive layout checks use additional automated viewport sizes. A report names physical-device or printer testing only when it actually occurred; automated Chromium checks do not establish compatibility with every browser, phone, assistive technology, printer, email client, or external service.</p></section><section class="info-section"><h2>Inputs, expected outputs, and privacy</h2><p>Tests use invented text, generated files, public-format examples, or attributed licensed media. Fixture pages label synthetic data and publish SHA-256 hashes so visitors can verify exact bytes. Sensitive production data is not required for a useful reproduction.</p><p>A passing fixture proves the recorded case in the stated environment. It does not prove unlimited file capacity, regulatory compliance, perfect accessibility, or correctness for every input.</p></section><section class="info-section"><h2>How sources are selected</h2><p>Technical claims prioritize primary sources: specifications, standards bodies, browser documentation, official product documentation, and direct measured results. Secondary sources may provide context but do not replace the controlling specification or an observed test. Links are reviewed for relevance and claims are phrased within the evidence available.</p></section><section class="info-section"><h2>AI assistance and fact-checking</h2><p>AI may assist with drafting, outlining, editing, test-case suggestions, or identifying statements that need verification. Assisted material is not published automatically. VelloxTech manually reviews the final text, checks factual claims against cited sources or recorded results, removes unsupported claims, and keeps safety-sensitive examples synthetic. AI assistance is not presented as an independent reviewer.</p></section><section class="info-section"><h2>Review dates, updates, and corrections</h2><p>A visible “Last reviewed” date is shown only while the guide title, excerpt, and body match the reviewed version recorded in the repository. Material changes invalidate that marker until the new version is reviewed. Corrections preserve the previous database version and are recorded in an audit log when the publishing workflow supports it.</p><p>Small typographic repairs may not change the conclusion. Factual, safety, privacy, or test-result corrections should be described in the relevant report’s change history.</p></section><section class="info-section"><h2>Advertising separation</h2><p>Advertising is not a substitute for useful publisher content. Private temporary-email controls, inboxes, message readers, generation controls, copy/download workflows, and pages without meaningful editorial content must remain free of advertising placements.</p></section></div>`;
writeChanged(path.join(frontend, 'editorial-policy.html'), page({ title: 'Editorial and testing methodology', description: 'How VelloxTech tests Anvil Tools, reviews sources and AI-assisted drafts, records evidence, and handles corrections.', pathname: '/editorial-policy.html', body: policyBody }));

const evidenceFiles = [
  ['examples/lab/duplicate-keys-unicode.json', 'Sample JSON fixture', 'JSON Formatter', 'Valid JSON is formatted; the duplicate role key resolves to its final value and Unicode remains readable.', 'json'],
  ['examples/lab/quoted-unicode.csv', 'Sample CSV fixture', 'CSV to JSON', 'Quoted commas, escaped quotes, embedded newlines, and Unicode are parsed into the expected rows.', 'csv'],
  ['images/editorial/background-removal-output.png', 'Sample transparent PNG fixture', 'Background Remover / Image to PDF', 'The PNG retains its alpha channel; PDF conversion preserves the transparent image mask.', 'transparent-png'],
  ['examples/pdf/cover.pdf', 'Sample PDF fixture', 'PDF Merge', 'The one-page cover remains first when combined with the application and support fixtures.', 'pdf'],
  ['examples/lab/qr-strings.txt', 'Sample QR payload fixture', 'QR Code Generator', 'Each line can be generated separately; the decoded result should exactly match the chosen line.', 'qr-payload'],
  ['examples/lab/text-diff-sample.txt', 'Sample text-diff fixture', 'Text Difference Checker', 'Comparing the VERSION A and VERSION B blocks exposes the status, notes, and approval line changes.', 'text-diff'],
  ['examples/lab/rtl-emoji-combining.txt', 'Sample Unicode and emoji fixture', 'Word Counter / Text Case Converter', 'Counts follow the documented whitespace and UTF-16 rules; visually similar Unicode can have different code-unit counts.', 'unicode-text'],
  ['examples/lab/html-email-link-fixture.txt', 'Synthetic HTML email link source', 'URL Encoder / Temporary Email', 'Encoded plus, slash, and Unicode query values decode without using a live recipient or token.', 'email-link'],
  ['examples/experiments/format-sample.jpg', 'JPEG comparison image', 'Image to PDF', 'The generated PDF contains one image page with the recorded dimensions.', 'jpeg'],
  ['examples/experiments/format-sample.png', 'PNG comparison image', 'Image to PDF', 'The generated PDF contains one image page and retains the source alpha mask.', 'png'],
  ['examples/experiments/format-sample.webp', 'WebP comparison image', 'Image to PDF', 'The generated PDF contains one image page and retains the source alpha mask.', 'webp'],
  ['examples/pdf/application.pdf', 'Two-page application PDF', 'PDF Merge', 'Both application pages remain adjacent and in source order.', 'application-pdf'],
  ['examples/pdf/support.pdf', 'One-page support PDF', 'PDF Merge', 'The support page remains last in the recorded merge order.', 'support-pdf'],
  ['examples/pdf/merged-example.pdf', 'Recorded four-page merged PDF', 'PDF Merge', 'The output has four pages in cover, application page 1, application page 2, support order.', 'merged-pdf'],
  ['examples/qr-check.png', 'Recorded QR PNG', 'QR Code Generator', 'An independent scanner decodes the controlled destination recorded in the Lab report.', 'qr-image'],
].map(([relative, label, tool, expected, id]) => {
  const file = `assets/${relative}`;
  return { label, tool, expected, id, href: '/' + file.replaceAll('\\', '/'), bytes: fs.statSync(path.join(frontend, file)).size, sha256: sha256(file) };
});
writeChanged(path.join(frontend, 'assets/examples/lab/fixture-manifest.json'), JSON.stringify({
  created_by: 'Anvil Tools', data: 'Safe to use for testing; contains no personal data.', generated_at: reviewedAt, files: evidenceFiles,
}, null, 2) + '\n');

const reports = [
  {
    slug: 'json-duplicate-keys-unicode-escapes', category: 'Developer tools', title: 'JSON duplicate keys, Unicode, and escaped-character test',
    seoTitle: 'JSON Duplicate Keys and Unicode Test',
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
    seoTitle: 'Unicode and Emoji Word-Count Test',
    seoDescription: 'See how the Anvil word counter treats emoji, combining accents, non-breaking spaces, zero-width spaces, RTL text, and text without spaces.',
    question: 'How does the current word counter treat emoji sequences, composed and combining accents, non-breaking spaces, zero-width spaces, and text without ordinary spaces?',
    tested: '2026-10-06', environment: `${browsers}; 1100 × 850 viewport.`, tool: ['word-counter', 'Word & Character Counter'], guide: ['voiceover-script-length-words-per-minute-video-timing', 'How Long Should a Voiceover Script Be?'],
    expected: 'Counts follow the documented whitespace and JavaScript UTF-16 rules, even where those rules differ from grapheme clusters or linguistic words.',
    observed: 'Both browser runs matched all 12 fixed cases. A family emoji was one whitespace-delimited word and 11 UTF-16 code units; café used four units while the visually similar combining form used five.',
    steps: ['Download the text fixture and recorded cases.', 'Paste one line at a time into Word Counter.', 'Compare words, characters, characters without spaces, sentences, and paragraphs.', 'Use the receiving platform’s rule when a submission has a strict limit.'],
    limitations: 'This is not language-aware tokenization or grapheme-cluster counting. RTL display, screen-reader pronunciation, and platform-specific limits need separate testing.',
    image: '/assets/images/editorial/unicode-count-experiment.png', fixtures: ['/assets/examples/lab/rtl-emoji-combining.txt', '/assets/examples/experiments/word-counter-cases.json', '/assets/examples/experiments/results.json'],
  },
];

const reportPublished = '2026-10-09';

function reportStructuredData(report) {
  const pageUrl = `${origin}/lab/reports/${report.slug}.html`;
  const image = origin + (report.image || '/assets/images/editorial/temporary-email-example.png');
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      velloxTechOrganization,
      organization,
      editorialTeam,
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: 'Anvil Tools Lab', item: `${origin}/lab/index.html` },
          { '@type': 'ListItem', position: 3, name: report.title, item: pageUrl },
        ],
      },
      {
        '@type': 'TechArticle',
        '@id': `${pageUrl}#article`,
        headline: report.title,
        description: report.question,
        author: { '@id': `${origin}/editorial-policy.html#velloxtech-editorial-team` },
        publisher: { '@id': `${origin}/#organization` },
        datePublished: reportPublished,
        dateModified: reviewedAt,
        image,
        articleSection: report.category,
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      },
    ],
  }).replace(/</g, '\\u003c');
}

function reportBody(report) {
  const dimensions = reportImageDimensions[report.image];
  const size = dimensions ? ` width="${dimensions[0]}" height="${dimensions[1]}"` : '';
  const visual = report.image ? `<figure class="article-example"><img src="${report.image}" alt="Recorded output for ${escape(report.title)}"${size} loading="lazy" decoding="async"><figcaption>Recorded first-party output associated with this report.</figcaption></figure>` : `<div class="callout"><strong>Output sample</strong><pre><code>${escape(report.sample)}</code></pre></div>`;
  return `<script type="application/ld+json">${reportStructuredData(report)}</script><p class="breadcrumbs"><a href="/">Home</a> / <a href="/lab/index.html">Lab</a> / <span>${escape(report.category)}</span></p><article class="published-article"><header class="article-header"><span class="eyebrow">${escape(report.category)}</span><h1>${escape(report.title)}</h1><p class="lede">${escape(report.question)}</p><p class="article-meta">Written by: <a href="/editorial-policy.html#velloxtech-editorial-team" rel="author">VelloxTech Editorial Team</a></p><p class="article-meta">Last tested: <time datetime="${report.tested}">${displayDate(report.tested)}</time></p><p class="article-meta">Last reviewed: <time datetime="${reviewedAt}">${displayDate(reviewedAt)}</time></p><p class="article-meta"><a href="/contact.html">Report an error or suggest a correction</a></p></header>${visual}<div class="article-content"><h2>Test environment</h2><p>${escape(report.environment)}</p><h2>Fixture and expected result</h2><p>${escape(report.expected)}</p><h2>Reproduction steps</h2><ol>${report.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol><h2>Observed result</h2><p>${escape(report.observed)}</p><h2>Downloadable evidence</h2><ul>${report.fixtures.map(href => `<li><a href="${href}" download>${escape(path.basename(href))}</a></li>`).join('')}</ul><p>The <a href="/lab/fixtures.html">fixture library</a> publishes SHA-256 hashes for exact-byte verification.</p><h2>What this test does not establish</h2><p>${escape(report.limitations)}</p><h2>Related tool and guide</h2><p><a href="/tools/${report.tool[0]}.html">${escape(report.tool[1])}</a> · <a href="/journal/${report.guide[0]}">${escape(report.guide[1])}</a></p><h2>Change history</h2><ul><li><time datetime="2026-10-11">October 11, 2026</time>: Structured data, image dimensions, and fixture links reviewed.</li><li><time datetime="2026-10-09">October 9, 2026</time>: Report organized under Anvil Tools Lab; evidence and limitations reviewed.</li></ul></div></article>`;
}
for (const report of reports) writeChanged(path.join(frontend, 'lab/reports', `${report.slug}.html`), page({ title: report.title, description: report.question, seoTitle: report.seoTitle, seoDescription: report.seoDescription, pathname: `/lab/reports/${report.slug}.html`, prefix: '../../', body: reportBody(report) }));

const cards = reports.map(report => `<article class="tool-card"><span class="category-tag">${escape(report.category)}</span><h2><a href="/lab/reports/${report.slug}.html">${escape(report.title)}</a></h2><p>${escape(report.question)}</p><p class="small-note">Last tested ${displayDate(report.tested)}</p><a class="tool-link" href="/lab/reports/${report.slug}.html">Read reproducible report &#8594;</a></article>`).join('');
function labPageStructuredData(pathname, title, description) {
  const pageUrl = `${origin}${pathname}`;
  const trail = pathname === '/lab/index.html'
    ? [{ name: 'Home', path: '/' }, { name: title, path: pathname }]
    : [{ name: 'Home', path: '/' }, { name: 'Anvil Tools Lab', path: '/lab/index.html' }, { name: title, path: pathname }];
  return {
    '@context': 'https://schema.org', '@graph': [
      velloxTechOrganization,
      organization,
      editorialTeam,
      breadcrumbs(pathname, trail),
      {
        '@type': 'TechArticle', '@id': `${pageUrl}#article`, headline: title, description,
        author: { '@id': `${origin}/editorial-policy.html#velloxtech-editorial-team` }, publisher: { '@id': `${origin}/#organization` },
        datePublished: '2026-10-09', dateModified: reviewedAt,
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl }, breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      },
    ],
  };
}

const labDescription = 'Reproducible edge-case reports with synthetic fixtures, recorded environments, observed results, limitations, and exact hashes.';
writeChanged(path.join(frontend, 'lab/index.html'), page({
  title: 'Anvil Tools Lab', description: labDescription, pathname: '/lab/index.html', prefix: '../',
  structuredData: labPageStructuredData('/lab/index.html', 'Anvil Tools Lab', labDescription),
  body: `<p class="breadcrumbs"><a href="/">Home</a> / <span>Lab</span></p><section class="hero"><span class="eyebrow">First-party evidence</span><h1>Anvil Tools Lab</h1><p class="lede">Reproducible edge-case reports built from synthetic inputs, actual tool runs, recorded outputs, and limitations—not generic compatibility promises.</p><div class="hero-actions"><a class="btn primary" href="/lab/fixtures.html">Browse fixtures</a><a href="/lab/privacy.html">Tool privacy matrix &#8594;</a><a href="/lab/compatibility.html">Browser compatibility &#8594;</a></div></section><section><h2>Six category reports</h2><div class="tool-grid">${cards}</div></section><section class="info-section"><h2>How to read a report</h2><p>A report answers one narrow question. It names its environment and date, publishes the exact fixture or result, separates expected from observed behavior, and states what the run cannot prove. Read the <a href="/editorial-policy.html">editorial and testing methodology</a> for the full review process.</p></section>`,
}));

const fixtureRows = evidenceFiles.map(file => `<tr id="${escape(file.id)}"><td><a href="${file.href}" download>${escape(file.label)}</a></td><td>${escape(file.tool)}</td><td>${escape(file.expected)}</td><td>${file.bytes.toLocaleString('en-US')}</td><td><code>${file.sha256}</code></td></tr>`).join('');
const fixtureDescription = 'Safe synthetic CSV, JSON, PNG, PDF, QR, text-diff, and Unicode fixtures with expected results and SHA-256 hashes.';
writeChanged(path.join(frontend, 'lab/fixtures.html'), page({
  title: 'Safe Test Data for Browser Tool Testing', description: fixtureDescription, pathname: '/lab/fixtures.html', prefix: '../',
  structuredData: labPageStructuredData('/lab/fixtures.html', 'Safe Test Data for Browser Tool Testing', fixtureDescription),
  body: `<p class="breadcrumbs"><a href="/">Home</a> / <a href="/lab/index.html">Lab</a> / <span>Safe test data</span></p><section class="hero"><span class="eyebrow">Download, reproduce, verify</span><h1>Safe Test Data for Browser Tool Testing</h1><p class="lede"><strong>Safe to use for testing; contains no personal data.</strong> Every file was created or generated for Anvil Tools and has a stated expected result.</p></section><section class="info-section"><h2>Fixture manifest and downloads</h2><p>Use the download link in each fixture name or download the <a href="/assets/examples/lab/fixture-manifest.json">machine-readable manifest</a>. SHA-256 hashes identify exact bytes; they do not certify that a file is safe for an unrelated workflow.</p><div class="table-scroll" role="region" aria-label="Safe fixture downloads, expected results, and hashes" tabindex="0"><table><thead><tr><th>Fixture / download</th><th>Tool</th><th>Expected result</th><th>Bytes</th><th>SHA-256</th></tr></thead><tbody>${fixtureRows}</tbody></table></div></section><section class="info-section"><h2>How to use the library</h2><ol><li>Download the fixture without changing it.</li><li>Confirm its SHA-256 hash when exact-byte reproduction matters.</li><li>Run it through the named tool and compare the observed output with the expected result.</li><li>Record the browser, date, and any difference instead of replacing the fixture with production data.</li></ol><h2>Handling rules</h2><ul><li>Keep fixtures separate from production records.</li><li>Never replace sample tokens with live credentials.</li><li>Review downloaded PDFs and images before forwarding them.</li><li>Use only systems you own or are authorized to test.</li></ul></section>`,
}));

const compatibilityRows = reports.map(report => `<tr><td><a href="/lab/reports/${report.slug}.html">${escape(report.title)}</a></td><td>Passed (${escape(recorded.runs[0].version)})</td><td>Passed (${escape(recorded.runs[1].version)})</td><td>Not recorded</td><td>Physical device not recorded</td><td>${escape(report.limitations)}</td><td>${displayDate(report.tested)}</td></tr>`).join('');
const compatibilityDescription = 'A user-facing Chrome, Edge, Firefox, and mobile browser test matrix with dates and explicit coverage limits.';
writeChanged(path.join(frontend, 'lab/compatibility.html'), page({
  title: 'Browser Compatibility Matrix', description: compatibilityDescription, pathname: '/lab/compatibility.html', prefix: '../',
  structuredData: labPageStructuredData('/lab/compatibility.html', 'Browser Compatibility Matrix', compatibilityDescription),
  body: `<p class="breadcrumbs"><a href="/">Home</a> / <a href="/lab/index.html">Lab</a> / <span>Compatibility</span></p><section class="hero"><span class="eyebrow">Measured, not assumed</span><h1>Browser Compatibility Matrix</h1><p class="lede">Recorded browser results, untested environments, known limitations, and the date of each run.</p></section><section class="info-section"><div class="table-scroll" role="region" aria-label="Browser compatibility by Lab report" tabindex="0"><table><thead><tr><th>Test</th><th>Chrome</th><th>Edge</th><th>Firefox</th><th>Mobile browser</th><th>Known limitations</th><th>Last tested</th></tr></thead><tbody>${compatibilityRows}</tbody></table></div><p><strong>Coverage note:</strong> Firefox and physical mobile browsers have not been recorded for these fixtures. Responsive layout checks are not a substitute for a real-device functional run. Browser versions are frozen evidence, not a promise about future releases. See the <a href="/editorial-policy.html">testing methodology</a>.</p></section>`,
}));

const privacyRows = toolReadiness.map(item => `<tr><td><a href="/tools/${item.slug}.html">${escape(toolNames[item.slug])}</a></td><td>${item.runsLocally ? 'Yes' : 'No'}</td><td>${item.uploadsFiles ? 'Yes' : 'No'}</td><td>${escape(item.externalService)}</td><td>${escape(item.sensitiveData)}</td><td>${escape(item.notes)}</td></tr>`).join('');
const privacyDescription = 'Compare which Anvil Tools run locally, upload files, use an external service, and are appropriate for sensitive data.';
writeChanged(path.join(frontend, 'lab/privacy.html'), page({
  title: 'Which Anvil Tools Run Locally and Which Use a Service?', seoTitle: 'Anvil Tools Privacy and Processing Matrix', description: privacyDescription, pathname: '/lab/privacy.html', prefix: '../',
  structuredData: labPageStructuredData('/lab/privacy.html', 'Which Anvil Tools Run Locally and Which Use a Service?', privacyDescription),
  body: `<p class="breadcrumbs"><a href="/">Home</a> / <a href="/lab/index.html">Lab</a> / <span>Tool privacy</span></p><section class="hero"><span class="eyebrow">Tool Privacy Matrix</span><h1>Which Anvil Tools Run Locally and Which Use a Service?</h1><p class="lede">A tool-by-tool account of local processing, file uploads, external services, and suitability for sensitive data.</p></section><section class="info-section"><div class="table-scroll" role="region" aria-label="Tool privacy matrix" tabindex="0"><table><thead><tr><th>Tool</th><th>Runs locally?</th><th>Uploads files?</th><th>Uses external service?</th><th>Best for sensitive data?</th><th>Notes</th></tr></thead><tbody>${privacyRows}</tbody></table></div><p>“Runs locally” describes the tool calculation, not the ordinary network requests used to load the website. Device security, browser extensions, shared computers, backups, and the final destination still matter. Temporary Email is the exception because receiving mail requires the Anvil backend and an external mailbox provider.</p><p>Last reviewed: <time datetime="${reviewedAt}">${displayDate(reviewedAt)}</time>.</p></section>`,
}));

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

// Add page-specific structured data to public indexes.
const websiteItems = toolReadiness.map((item, index) => ({
  '@type': 'ListItem', position: index + 1, name: toolNames[item.slug], url: `${origin}/tools/${item.slug}.html`,
}));
const homeFile = path.join(frontend, 'index.html');
let homeHtml = fs.readFileSync(homeFile, 'utf8')
  .replace('Small tools.<br><span>More possibility.</span>', 'Private browser tools for everyday files, text, and testing.')
  .replace('Simple to start. Useful from the first click.', 'Open a tool, complete the task, and check the result before you share it.')
  .replaceAll(oldTempMailDescription, tempMailDescription);
homeHtml = injectManagedSchema(homeHtml, {
  '@context': 'https://schema.org', '@graph': [
    velloxTechOrganization,
    organization,
    { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'Anvil Tools', url: `${origin}/`, publisher: { '@id': `${origin}/#organization` } },
    { '@type': 'ItemList', '@id': `${origin}/#tools`, name: 'Anvil Tools directory', numberOfItems: websiteItems.length, itemListElement: websiteItems },
  ],
});
writeChanged(homeFile, homeHtml);

const toolsIndexFile = path.join(frontend, 'tools/index.html');
let toolsIndexHtml = fs.readFileSync(toolsIndexFile, 'utf8').replaceAll(oldTempMailDescription, tempMailDescription);
toolsIndexHtml = injectManagedSchema(toolsIndexHtml, {
  '@context': 'https://schema.org', '@graph': [
    velloxTechOrganization,
    organization,
    { '@type': 'CollectionPage', '@id': `${origin}/tools/index.html#page`, name: 'All Anvil Tools', url: `${origin}/tools/index.html`, isPartOf: { '@id': `${origin}/#website` }, mainEntity: { '@id': `${origin}/tools/index.html#list` } },
    { '@type': 'ItemList', '@id': `${origin}/tools/index.html#list`, numberOfItems: websiteItems.length, itemListElement: websiteItems },
  ],
});
writeChanged(toolsIndexFile, toolsIndexHtml);

const blogItems = [
  ...experiments.map(item => ({ name: item.title, url: `${origin}/blog/${item.slug}.html` })),
  ...library.map(item => ({ name: item.title, url: `${origin}/journal/${item.slug}` })),
].map((item, index) => ({ '@type': 'ListItem', position: index + 1, ...item }));
const blogSchema = {
  '@context': 'https://schema.org', '@graph': [
    velloxTechOrganization,
    organization,
    { '@type': 'Blog', '@id': `${origin}/blog/index.html#blog`, name: 'Anvil Tools guides and experiments', url: `${origin}/blog/index.html`, publisher: { '@id': `${origin}/#organization` }, mainEntity: { '@id': `${origin}/blog/index.html#list` } },
    { '@type': 'ItemList', '@id': `${origin}/blog/index.html#list`, numberOfItems: blogItems.length, itemListElement: blogItems },
  ],
};
for (const blogIndexFile of [path.join(frontend, 'blog/index.html'), path.join(root, 'backend/src/templates/blog.html')]) {
  if (fs.existsSync(blogIndexFile)) writeChanged(blogIndexFile, injectManagedSchema(fs.readFileSync(blogIndexFile, 'utf8'), blogSchema));
}

// Add review, privacy, limitations, evidence links, and WebApplication data to every tool page.
for (const item of toolReadiness) {
  const file = path.join(frontend, 'tools', `${item.slug}.html`);
  if (!fs.existsSync(file)) throw new Error(`Missing tool page for ${item.slug}`);
  let html = fs.readFileSync(file, 'utf8')
    .replaceAll(oldTempMailDescription, tempMailDescription)
    .replace(/<!-- tool-review-date -->[\s\S]*?<!-- \/tool-review-date -->/, '')
    .replace(/<!-- tool-readiness-sections -->[\s\S]*?<!-- \/tool-readiness-sections -->/, '');
  const meta = html.match(/<meta name="description" content="([^"]+)">/i);
  const description = (meta?.[1] || item.dataHandling).replace(/^Anvil Tools:\s*/, '');
  const guide = library.find(entry => entry.tools.includes(item.slug)) || experiments.find(entry => entry.tools.includes(item.slug));
  const guideHref = guide ? (library.includes(guide) ? `/journal/${guide.slug}` : `/blog/${guide.slug}.html`) : '/blog/index.html';
  const guideTitle = guide?.title || 'Guides and experiments';
  const reviewLine = `<!-- tool-review-date --><p class="article-meta">Last reviewed: <time datetime="${reviewedAt}">${displayDate(reviewedAt)}</time></p><!-- /tool-review-date -->`;
  html = html.replace(/(<section class="hero"[\s\S]*?<p class="lede">[\s\S]*?<\/p>)/, `$1${reviewLine}`);
  const readinessSections = `<!-- tool-readiness-sections --><section class="info-section"><h2>How this tool handles your data</h2><p>${escape(item.dataHandling)}</p><p><a href="/lab/privacy.html">Compare privacy behavior across all tools</a>.</p></section><section class="info-section"><h2>Known limitations</h2><p>${escape(item.limitations)}</p></section><section class="info-section"><h2>Related guide and Lab test</h2><ul><li><a href="${guideHref}">${escape(guideTitle)}</a></li><li><a href="${item.lab.href}">${escape(item.lab.title)}</a></li></ul></section><!-- /tool-readiness-sections -->`;
  html = html.includes('<!-- reviewed-faq -->') ? html.replace('<!-- reviewed-faq -->', `${readinessSections}<!-- reviewed-faq -->`) : html.replace('</main>', `${readinessSections}</main>`);
  html = injectManagedSchema(html, {
    '@context': 'https://schema.org', '@graph': [
      velloxTechOrganization,
      organization,
      {
        '@type': 'WebApplication', '@id': `${origin}/tools/${item.slug}.html#application`, name: toolNames[item.slug], description,
        url: `${origin}/tools/${item.slug}.html`, applicationCategory: item.category, operatingSystem: 'Any operating system with a supported web browser',
        browserRequirements: 'JavaScript enabled', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: { '@id': `${origin}/#organization` }, dateModified: reviewedAt,
      },
    ],
  });
  if (item.slug === 'temp-mail') {
    html = html
      .replace(/<[^>]+class="[^"]*\bad-slot\b[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, '')
      .replace(/<script\b[^>]*(?:adsbygoogle|googlesyndication|doubleclick)[^>]*>[\s\S]*?<\/script>/gi, '');
  }
  writeChanged(file, html);
}

const emailCategoryFile = path.join(frontend, 'categories/email-tools.html');
if (fs.existsSync(emailCategoryFile)) writeChanged(emailCategoryFile, fs.readFileSync(emailCategoryFile, 'utf8').replaceAll(oldTempMailDescription, tempMailDescription));

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

console.log(`Built editorial policy, ${reports.length} Lab reports, fixture, privacy and compatibility pages, index schemas, ${toolReadiness.length} tool readiness sections, six category hubs, and ${Object.keys(testCards).length} tool test cards.`);
