"""Apply the reviewed page-by-page editorial fixes without touching ads.txt or post records.

Run after the older generator/refinement passes and before build:editorial.
"""
import json
import re
import struct
from html import escape, unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'frontend'
SOURCE = ROOT / 'scripts/site-generator'
EXAMPLES = json.loads((SOURCE / 'tool-examples.json').read_text(encoding='utf-8'))
TROUBLE = json.loads((SOURCE / 'tool-troubleshooting.json').read_text(encoding='utf-8'))
IMAGE_SIZES = json.loads((ROOT / 'backend/src/lib/editorial-images.json').read_text(encoding='utf-8')) if (ROOT / 'backend/src/lib/editorial-images.json').exists() else {}

def plain(value):
    return ' '.join(unescape(re.sub(r'<[^>]+>', ' ', value)).split())

def section(title, body):
    return '<section class="info-section"><h2>' + escape(title) + '</h2>' + body + '</section>'

def table(headers, rows):
    return '<div class="table-scroll" role="region" aria-label="' + escape(' and '.join(headers)) + '" tabindex="0"><table><thead><tr>' + ''.join('<th scope="col">' + escape(h) + '</th>' for h in headers) + '</tr></thead><tbody>' + ''.join('<tr>' + ''.join('<td>' + cell + '</td>' for cell in row) + '</tr>' for row in rows) + '</tbody></table></div>'

def replace_surface(html, body):
    surface = '<!-- reading-surface --><div class="content-guide">' + body + '</div><!-- /reading-surface -->'
    pattern = r'<!-- reading-surface --><div class="content-guide">.*?</div><!-- /reading-surface -->'
    assert re.search(pattern, html, re.S), 'Expected reading surface is missing'
    return re.sub(pattern, lambda _: surface, html, count=1, flags=re.S)

def write(path, html):
    html = re.sub(r'^[ \t]+$', '', html, flags=re.M)
    html = html.replace('Turn one or more JPG or PNG images into a single downloadable PDF.', 'Turn JPG, PNG, or WebP images into ordered pages in one downloadable PDF.')
    html = html.replace('Grab realistic browser and bot user-agent strings for testing how your site responds.', 'Choose fixed browser and bot user-agent strings for parser and request-header tests.')
    html = re.sub(r'(<div class="tool-grid") aria-labelledby="(?:category|directory)-tools-title"', r'\1', html)
    if path.suffix == '.html' and 'public-site' in html:
        html = re.sub(r'<link\b[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>\s*', '', html)
        if '<!-- local-font-preload -->' not in html:
            fonts = '<!-- local-font-preload --><link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin><!-- /local-font-preload -->'
            html = html.replace('</head>', fonts + '</head>', 1)
        html = re.sub(r'(<div\b[^>]*class="dropzone"[^>]*)(>)', lambda m: re.sub(r' aria-label="[^"]*"', '', m[1]) + m[2], html)
    html = re.sub(r'(<footer\b.*?</footer>)', lambda m: m[0].replace('<h4>', '<h3>').replace('</h4>', '</h3>'), html, flags=re.S)
    def image_dimensions(match):
        tag = match[0]
        source = re.search(r'src="(/assets/images/[^"?#]+\.png)"', tag)
        if not source: return tag
        image = SITE / source[1].lstrip('/')
        if not image.exists(): return tag
        data = image.read_bytes()[:24]
        if not data.startswith(b'\x89PNG\r\n\x1a\n'): return tag
        width, height = struct.unpack('>II', data[16:24])
        if 'width=' not in tag: tag = tag[:-1] + f' width="{width}" height="{height}">'
        return tag
    html = re.sub(r'<picture><source type="image/webp"[^>]*>(<img\b[^>]*>)</picture>', r'\1', html)
    def responsive_image(match):
        tag = image_dimensions(match)
        source = re.search(r'src="([^"]+)"', tag)
        metadata = IMAGE_SIZES.get(source[1]) if source else None
        if not metadata: return tag
        srcset = ', '.join(item['src'] + ' ' + str(item['width']) + 'w' for item in metadata['candidates'])
        sizes = '(max-width: 800px) calc(100vw - 72px), 1000px'
        return '<picture><source type="image/webp" srcset="' + srcset + '" sizes="' + sizes + '">' + tag + '</picture>'
    html = re.sub(r'<img\b[^>]*>', responsive_image, html)
    previous = path.read_text(encoding='utf-8')
    if previous != html:
        path.write_text(html, encoding='utf-8')

for slug, example in EXAMPLES.items():
    path = SITE / 'tools' / (slug + '.html')
    html = path.read_text(encoding='utf-8')
    html = re.sub(r'<!-- checked-example -->.*?<!-- /checked-example -->', '', html, flags=re.S)
    html = re.sub(r'<script src="[^" ]*assets/js/tool-examples\.js(?:\?[^" ]*)?"></script>', '', html)
    html = html.replace('Choose a whole-number length from 8 to 64', 'Choose a whole-number length from 6 to 48')
    html = html.replace('Turn one or more JPG or PNG images into a single downloadable PDF.', 'Turn JPG, PNG, or WebP images into ordered pages in one downloadable PDF.')
    html = html.replace('Check the selected separator, quoted fields, header uniqueness, and column count in each row.', 'This parser uses commas; it has no separator selector. Check quoted fields, header uniqueness, and the column count in each row.')
    html = html.replace('JPG and PNG. Convert other formats to one of these first using your device\'s photo editor.', 'JPG, PNG, and WebP. If your browser cannot decode an image, export a working copy as PNG or JPEG and retry.')
    html = html.replace('Yes, pages are created in the order the images were added, so add them in the order you want them to appear.', 'Yes. Use Move up, Move down, or Remove in the selected-image list before converting. Each remaining image becomes one PDF page in that order.')
    html = html.replace('Estimating how long a blog post or script will take to read aloud.', 'Getting a rough silent-reading estimate for a draft; spoken delivery and technical reading can take longer.')
    if slug == 'base64-tool':
        intro = 'Encode UTF-8 text as standard Base64, or decode a standard Base64 value back to text. This tool does not accept binary files. URL-safe Base64 uses a different alphabet; use the JWT Decoder for JWT header and payload sections.'
        html = re.sub(r'(<p class="lede">).*?(</p>)', lambda m: m[1] + intro + m[2], html, count=1, flags=re.S)
    if slug == 'background-remover':
        html = re.sub(r'<script type="module">.*?window\.removeBackgroundLib.*?</script>', '<script type="module">\nwindow.removeBackgroundLib = async (...args) => {\n  const { removeBackground } = await import("https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm");\n  return removeBackground(...args);\n};\n</script>', html, count=1, flags=re.S)
    if slug == 'temp-mail' and 'id="tm-expiry"' not in html:
        html = re.sub(r'(<p\b[^>]*id="tm-status"[^>]*>.*?</p>)', lambda m: m[1] + '<p id="tm-expiry" class="small-note">Website inbox access time will appear when the address is ready.</p>', html, count=1, flags=re.S)
    if slug == 'text-diff-checker':
        html = re.sub(r'(<div\b[^>]*id="diff-output"[^>]*)(>)', lambda m: m[1] + (' role="region"' if 'role=' not in m[1] else '') + m[2], html, count=1)
    # A single FAQ keeps distinct answers; the two generic repeats added by the old
    # expansion pass are removed instead of preserving an arbitrary question count.
    faqs = []
    for match in re.finditer(r'<details class="faq-item"><summary>(.*?)</summary>(.*?)</details>', html, re.S):
        question = plain(match[1])
        if question in ['What should I check before using the result?', 'What are the main limitations?']:
            continue
        if question == 'What if the tool does not respond?' or question == TROUBLE[slug][0]:
            question, answer = TROUBLE[slug]
            item = '<details class="faq-item"><summary>' + escape(question) + '</summary><p>' + escape(answer) + '</p></details>'
        else:
            item = match[0]
        if question not in [entry[0] for entry in faqs]: faqs.append((question, item))
    html = re.sub(r'<details class="faq-item">.*?</details>', '', html, flags=re.S)
    html = re.sub(r'<h2>(?:Frequently asked questions|Questions and troubleshooting|Working with your results|More questions about [^<]+)</h2>', '', html)
    html = re.sub(r'<section class="info-section">\s*</section>', '', html)
    html = html.replace('<p>Continue your task with these suggested tools. Suggestions follow the workflow and tool category; your input is not transferred between tools.</p>', '<p>These tools open separately; inputs are not transferred.</p>')
    match = re.search(r'<!-- reading-surface --><div class="content-guide">(.*?)</div><!-- /reading-surface -->', html, re.S)
    assert match, slug
    body = match[1]
    seen = set()
    def unique_paragraph(match):
        value = plain(match[1]).lower()
        if len(value.split()) < 12: return match[0]
        if value in seen: return ''
        seen.add(value)
        return match[0]
    body = re.sub(r'<p>(.*?)</p>', unique_paragraph, body, flags=re.S)
    rows = [[escape(value) for value in row] for row in example['rows']]
    details = '<p>' + escape(example['note']) + '</p>' + table(['Input or check', 'Expected result or decision'], rows)
    if 'sample' in example:
        details += '<button class="btn secondary" type="button" data-example-fields="' + escape(json.dumps(example['sample'], ensure_ascii=False), quote=True) + '">Try this sample</button><p class="status-msg" id="example-status" role="status" aria-live="polite"></p>'
        html = html.replace('</body>', '<script src="../assets/js/tool-examples.js"></script></body>')
    if slug == 'background-remover':
        details += '<figure><img src="/assets/images/editorial/background-removal-example.png" loading="lazy" alt="Actual synthetic mug before and after automatic background removal; unwanted pale pixels remain near the handle."><figcaption>Actual tool output on a synthetic illustration, with imperfections retained.</figcaption></figure><p><a href="/assets/images/editorial/background-removal-input.png" download>Download the test input</a> · <a href="/assets/images/editorial/background-removal-output.png" download>Inspect the transparent PNG result</a></p>'
    if slug == 'pdf-merge':
        details += '<figure><img src="/assets/images/editorial/pdf-ordering-example.png" loading="lazy" alt="PDF queue with cover, application, and support files arranged using Move up and Move down controls."><figcaption>The file list defines whole-file order before merging.</figcaption></figure><p><a href="/assets/examples/pdf/cover.pdf" download>Cover PDF</a> · <a href="/assets/examples/pdf/application.pdf" download>Application PDF</a> · <a href="/assets/examples/pdf/support.pdf" download>Support PDF</a> · <a href="/assets/examples/pdf/merged-example.pdf" download>Inspect the four-page result</a></p>'
    if slug == 'image-to-pdf':
        details += '<p><a href="/assets/images/editorial/background-removal-input.png" download>Try the 480 × 360-pixel test PNG</a>. Open the downloaded PDF and check its one landscape page.</p>'
    if slug == 'temp-mail':
        details += '<p><a href="https://www.guerrillamail.com/" target="_blank" rel="noopener">Provider information from Guerrilla Mail</a>. The countdown estimates website access from the server expiry time; it does not measure provider message retention.</p>'
    body = '<!-- checked-example -->' + section(example['heading'], details) + '<!-- /checked-example -->' + body
    body += section('Questions and troubleshooting', ''.join(item for _, item in faqs))
    html = replace_surface(html, body)
    # Put the caveats next to the action as well as in the explanatory workflow.
    notes = {
        'word-counter': ('wc-input', 'Words: whitespace-delimited tokens. Characters: UTF-16 units. Reading estimate: silent reading at 200 words/minute; empty text is zero minutes.'),
        'json-formatter': ('jf-input', 'Keep a source copy: duplicate keys and large integers can change when JSON is parsed. Syntax validity does not validate your application data.'),
        'pdf-merge': ('pm-file-input', 'Use readable, unencrypted PDFs. Check forms, signatures, and bookmarks in the output; their interactive behavior is not guaranteed.'),
        'text-diff-checker': ('diff-before', 'Line-based comparison. The two line counts multiplied together must not exceed 2,000,000.'),
    }
    if slug in notes:
        target, note = notes[slug]
        html = re.sub(r'<!-- action-note -->.*?<!-- /action-note -->', '', html, flags=re.S)
        html = re.sub(r'(<div class="tool-app">)', lambda m: m[1] + '<!-- action-note --><p class="small-note" id="tool-action-note">' + escape(note) + '</p><!-- /action-note -->', html, count=1)
        html = re.sub(r'(<(?:textarea|input)\b[^>]*\bid="' + target + r'"[^>]*)(>)', lambda m: m[1] + (' aria-describedby="tool-action-note"' if 'aria-describedby=' not in m[1] else '') + m[2], html, count=1)
    write(path, html)

# Category sources contain task choices instead of copies of their tool cards.
for path in (SOURCE / 'templates/submission/categories').glob('*.html'):
    target = SITE / 'categories' / path.name
    html = target.read_text(encoding='utf-8')
    if 'id="category-tools-title"' not in html:
        html = html.replace('<div class="tool-grid">', '<h2 id="category-tools-title">Tools in this category</h2><div class="tool-grid">', 1)
    write(target, replace_surface(html, path.read_text(encoding='utf-8')))

for name in ['home', 'directory']:
    target = SITE / ('index.html' if name == 'home' else 'tools/index.html')
    html = target.read_text(encoding='utf-8')
    html = replace_surface(html, (SOURCE / 'templates/submission' / (name + '.html')).read_text(encoding='utf-8'))
    if name == 'directory':
        html = re.sub(r'<!-- directory-controls -->.*?<!-- /directory-controls -->', '', html, flags=re.S)
        html = re.sub(r'<script src="[^" ]*assets/js/tool-directory\.js(?:\?[^" ]*)?"></script>', '', html)
        options = ''.join('<option value="' + escape(value) + '">' + escape(value) + '</option>' for value in ['Email tools', 'Image tools', 'PDF tools', 'Generators', 'Text tools', 'Developer tools'])
        controls = '<!-- directory-controls --><div class="tool-directory-controls"><label>Search tools<input type="search" id="tool-search" placeholder="Try PDF, JSON, or text" autocomplete="off"></label><label>Category<select id="tool-category"><option value="">All categories</option>' + options + '</select></label></div><p id="tool-results" role="status" aria-live="polite">20 tools available.</p><!-- /directory-controls -->'
        html = html.replace('</section>', '</section>' + controls, 1)
        if 'id="directory-tools-title"' not in html:
            html = html.replace('<div class="tool-grid">', '<h2 id="directory-tools-title">Available tools</h2><div class="tool-grid">', 1)
        def annotate(match):
            card = match[0]
            category = re.search(r'<span class="category-tag">(.*?)</span>', card)[1]
            return re.sub(r'<div class="tool-card"[^>]*>', '<div class="tool-card" data-directory-tool data-category="' + escape(plain(category)) + '">', card, count=1)
        html = re.sub(r'<div class="tool-card"(?: data-directory-tool data-category="[^"]*")?>.*?<span class="category-tag">.*?</span>', annotate, html, flags=re.S)
        html = html.replace('</body>', '<script src="../assets/js/tool-directory.js"></script></body>')
        html = re.sub(r'(<p class="lede">).*?(</p>)', lambda m: m[1] + 'Find the tool that matches your input and desired result. Browse all 20 tools, filter by category, or search by task.' + m[2], html, count=1, flags=re.S)
    write(target, html)

# An introduction remains visible when the backend supplies the four guide cards.
path = SITE / 'blog/index.html'
html = path.read_text(encoding='utf-8')
html = re.sub(r'<!-- journal-introduction -->.*?<!-- /journal-introduction -->', '', html, flags=re.S)
introduction = '<!-- journal-introduction --><section class="info-section"><h2>Choose a workflow</h2><p>Start with the task you need to finish. The guides explain concrete examples, tool limits, and output checks; they do not promise that every source file or external service will behave the same way.</p><ul><li><a href="/journal/best-practices-for-background-removal-when-working-with-design">Prepare a product image</a>: inspect transparency and difficult edges before publishing.</li><li><a href="/journal/simple-pdf-workflow-without-software">Assemble documents</a>: arrange files, convert images, and check the finished PDF.</li><li><a href="/journal/best-practices-for-temporary-email-when-working-with-signups">Choose an inbox for a permitted signup</a>: separate short-term receipt from lasting recovery.</li><li><a href="/journal/small-tools-that-save-developers-time">Debug sample API data</a>: compare types, encoding, claims, and timestamps.</li></ul></section><!-- /journal-introduction -->'
html = html.replace('<section id="publishedBlogs"', introduction + '<section id="publishedBlogs"', 1)
write(path, html)

path = SITE / 'disclaimer.html'
html = path.read_text(encoding='utf-8')
html = html.replace('<section class="hero"><h1>Disclaimer</h1></section>', '<section class="hero"><h1>Disclaimer</h1><p class="lede">Last updated: October 5, 2026.</p></section>')
html = html.replace('short-term, low-stakes use such as testing signups or avoiding promotional mail', 'short-term, low-stakes use such as testing an application you control or receiving a permitted non-sensitive message')
html = html.replace('Read the limitations beside each tool and validate outputs in the context where you will use them.', 'Review the <a href="/journal/small-tools-that-save-developers-time">developer workflow</a> for examples of type, encoding, and token checks.')
html = html.replace('Inspect downloaded files before replacing an earlier version.', 'Use the <a href="/journal/simple-pdf-workflow-without-software">PDF workflow</a> to check page order and dimensions before replacing an earlier version.')
write(path, html)

# Keep source and published About content aligned; do not invent human reviewers.
for path in [SITE / 'about.html', SOURCE / 'templates/about.html']:
    html = path.read_text(encoding='utf-8')
    html = re.sub(r'<!-- review-process -->.*?<!-- /review-process -->', '', html, flags=re.S)
    process = '<!-- review-process --><section><h3>How examples and corrections are checked</h3><p>Our examples use non-sensitive text and synthetic files so the output can be checked without sharing private material. Automated checks exercise parsing errors, file ordering, downloads, and browser layouts. We inspect the result as well as the ready message; these checks do not cover every device, source file, or external-service condition.</p><p>VelloxTech maintains the site and receives correction reports through the <a href="contact.html">contact page</a>. A published example records the behavior observed in that workflow; it is not a claim of independent certification or a named human review.</p></section><!-- /review-process -->'
    html = html.replace('<div class="hero-actions">', process + '<div class="hero-actions">', 1)
    write(path, html)

# Apply shared footer semantics to the remaining legal and error pages too.
for path in SITE.glob('*.html'):
    write(path, path.read_text(encoding='utf-8'))

catalog = SITE / 'assets/js/site-catalog.js'
write(catalog, catalog.read_text(encoding='utf-8'))

print('Refined 20 tool pages, six categories, homepage, directory, blog introduction, About, and disclaimer; ads.txt and database articles untouched.')
