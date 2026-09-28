# -*- coding: utf-8 -*-
from build_site import ICONS

CATEGORIES = {
    "email": {"label": "Email tools", "slug": "email-tools", "desc": "Tools for handling email addresses without exposing your real inbox."},
    "image": {"label": "Image tools", "slug": "image-tools", "desc": "Edit and convert images directly in your browser."},
    "pdf": {"label": "PDF tools", "slug": "pdf-tools", "desc": "Combine, build, and convert PDF files without installing software."},
    "developer": {"label": "Developer tools", "slug": "developer-tools", "desc": "Small utilities that save time during coding and testing."},
    "text": {"label": "Text tools", "slug": "text-tools", "desc": "Analyze and clean up written text."},
    "generators": {"label": "Generators", "slug": "generators", "desc": "Create passwords, QR codes, palettes, and other quick outputs."},
}

# Each tool: slug, name, category key, short_desc (card + meta), icon key,
# widget_html (the working tool), extra_head (cdn scripts loaded in head/before body),
# tool_js (path under assets/js/tools/), intro paragraph, how_it_works (list), use_cases (list), faqs (list of q,a)
TOOLS = []

def add_tool(**kw):
    TOOLS.append(kw)

add_tool(
    slug="temp-mail", name="Temporary Email Generator", category="email",
    short_desc="Get a disposable inbox in one click for signups you don't want landing in your real email.",
    icon="mail",
    widget_html='''
      <h2>Your temporary inbox</h2>
      <div class="inbox-box">
        <div class="inbox-address" id="tm-address">Creating inbox…</div>
        <button class="btn secondary" id="tm-copy">Copy address</button>
        <button class="btn amber" id="tm-new">New address</button>
      </div>
      <p class="status-msg" id="tm-status"></p>
      <ul class="message-list" id="tm-messages"></ul>
      <div id="tm-viewer"></div>
    ''',
    extra_head="",
    tool_js="temp-mail.js",
    intro="Use this when a site demands an email address before you can even look around, or when you're testing a signup flow and don't want ten confirmation emails cluttering your real inbox. The address below is live: anything sent to it shows up here automatically, and it disappears once you close the tab or generate a new one.",
    how_it_works=[
        "A random inbox address is created for you the moment the page loads, using the mail.tm public email service.",
        "The page checks for new mail every few seconds and lists messages as they arrive.",
        "Click any message in the list to read its contents right here, with scripts and tracking elements stripped out for safety.",
        "Generating a new address abandons the old inbox permanently — there is no way to recover it later, so don't use this for anything you need long-term access to."
    ],
    use_cases=[
        "Signing up for a newsletter, download, or free trial you only need once.",
        "Testing what a signup or password-reset email looks like while building a website.",
        "Keeping your real inbox free of promotional mail from a one-time purchase or forum account.",
    ],
    faqs=[
        ("Is this address private?", "The address is random and not tied to your identity, but treat it as public: anyone who guesses or is given the address can read what lands in it. Never use it for anything sensitive like banking, medical, or account-recovery email."),
        ("How long does the inbox last?", "The inbox stays active as long as this tab is open. Refreshing the page or clicking \"New address\" replaces it with a fresh one, and the old inbox and its messages become unreachable."),
        ("Can I reply to emails from this address?", "This tool is built for receiving mail only, matching how most disposable-email use cases work: verifying a signup, not carrying on a conversation."),
        ("Will this work for every website?", "Most sites accept it, but some services specifically block known disposable-email domains. If a form rejects the address, that site is one of them."),
    ],
)

add_tool(
    slug="background-remover", name="Background Remover", category="image",
    short_desc="Remove the background from a photo automatically, processed locally in your browser.",
    icon="image",
    widget_html='''
      <h2>Remove a photo's background</h2>
      <div class="dropzone" id="bg-dropzone">
        <strong>Click to choose an image</strong> or drag and drop it here<br>
        <span class="small-note">JPG, PNG, or WebP</span>
      </div>
      <input type="file" id="bg-file-input" accept="image/*" style="display:none;">
      <p class="status-msg" id="bg-status"></p>
      <div class="preview-images" id="bg-preview"></div>
      <div class="btn-row">
        <button class="btn amber" id="bg-download" style="display:none;">Download PNG</button>
      </div>
    ''',
    extra_head='<script type="module">\n'
               'import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/dist/browser.mjs";\n'
               'window.removeBackgroundLib = removeBackground;\n'
               '</script>',
    tool_js="background-remover.js",
    intro="Drop in a photo and this tool cuts the subject out from its background automatically, using a small machine-learning model that runs entirely on your device. The image is never uploaded anywhere, which makes this suitable for photos you'd rather not send to a third-party server.",
    how_it_works=[
        "When you choose a file, a compact background-segmentation model loads in your browser (only once per visit).",
        "The model identifies the main subject and produces a version of the image with a transparent background.",
        "Both the original and the result are shown side by side so you can compare before downloading.",
        "The output downloads as a PNG, which supports transparency, so you can drop it straight onto a new background."
    ],
    use_cases=[
        "Cutting out a product photo for a listing or catalog.",
        "Preparing a headshot for a resume or profile without a distracting background.",
        "Making a transparent sticker-style image from a photo for a presentation or design.",
    ],
    faqs=[
        ("Does my photo get uploaded anywhere?", "No. Processing happens locally using your device's own processing power, so the image never leaves your browser."),
        ("Why does the first image take longer than the second?", "The first run downloads and initializes the small ML model used for segmentation. After that, it stays cached for the rest of your visit."),
        ("What image formats are supported?", "JPG, PNG, and WebP work well. Very large images may take longer to process on slower devices."),
        ("Why does the edge of my subject look slightly rough?", "Automatic segmentation works best with a clear subject and reasonable contrast against the background. Busy backgrounds or fine detail like loose hair can produce a less clean edge."),
    ],
)

add_tool(
    slug="pdf-merge", name="PDF Merge", category="pdf",
    short_desc="Combine multiple PDF files into a single document in the order you choose.",
    icon="pdf-merge",
    widget_html='''
      <h2>Combine PDF files</h2>
      <div class="dropzone" id="pm-dropzone">
        <strong>Click to choose PDF files</strong> or drag and drop them here<br>
        <span class="small-note">Add two or more files, in any order</span>
      </div>
      <input type="file" id="pm-file-input" accept="application/pdf" multiple style="display:none;">
      <ul class="file-list" id="pm-file-list"></ul>
      <div class="btn-row">
        <button class="btn amber" id="pm-merge" disabled>Merge and download</button>
      </div>
      <p class="status-msg" id="pm-status"></p>
    ''',
    extra_head='<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>',
    tool_js="pdf-merge.js",
    intro="Add two or more PDF files and they'll be stitched together into one document, in the order shown in the list. Everything happens in your browser, so your files are never uploaded to a server.",
    how_it_works=[
        "Choose or drag in the PDF files you want to combine.",
        "Reorder or remove files from the list before merging, if needed.",
        "Click merge, and the combined file downloads straight to your device.",
    ],
    use_cases=[
        "Combining several scanned pages into one document to send or print.",
        "Putting together a multi-part report or application from separate PDF sections.",
        "Merging an invoice and its attachments into a single file for record-keeping.",
    ],
    faqs=[
        ("Is there a limit to how many files I can merge?", "There's no fixed limit, but very large combined files take longer to process since everything happens on your own device."),
        ("Can I merge password-protected PDFs?", "No. Remove the password from a PDF first using your PDF reader, then merge it here."),
        ("Does merging reduce file quality?", "No. Pages are copied as-is, so the content and quality of each original file is preserved."),
    ],
)

add_tool(
    slug="image-to-pdf", name="Image to PDF Converter", category="pdf",
    short_desc="Turn one or more JPG or PNG images into a single downloadable PDF.",
    icon="pdf-image",
    widget_html='''
      <h2>Convert images to a PDF</h2>
      <div class="dropzone" id="ip-dropzone">
        <strong>Click to choose images</strong> or drag and drop them here<br>
        <span class="small-note">JPG or PNG, one page per image</span>
      </div>
      <input type="file" id="ip-file-input" accept="image/jpeg,image/png" multiple style="display:none;">
      <div class="preview-images" id="ip-preview"></div>
      <div class="btn-row">
        <button class="btn amber" id="ip-convert" disabled>Convert to PDF</button>
      </div>
      <p class="status-msg" id="ip-status"></p>
    ''',
    extra_head='<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>',
    tool_js="image-to-pdf.js",
    intro="Select one or more photos or scans and this tool lays each one out on its own page of a new PDF, in the order you add them. Nothing is uploaded; the conversion happens on your device.",
    how_it_works=[
        "Choose or drag in your JPG or PNG images.",
        "Each image becomes one page in the resulting PDF, sized to match the image.",
        "Click convert to build and download the finished PDF.",
    ],
    use_cases=[
        "Turning phone photos of a signed document into a single PDF to email.",
        "Bundling receipt photos into one file for an expense report.",
        "Creating a simple PDF portfolio from a set of images.",
    ],
    faqs=[
        ("What image formats are supported?", "JPG and PNG. Convert other formats to one of these first using your device's photo editor."),
        ("Can I control the page order?", "Yes, pages are created in the order the images were added, so add them in the order you want them to appear."),
        ("Will the images be resized?", "Each page is sized to match its image, so nothing is cropped or stretched."),
    ],
)

add_tool(
    slug="qr-code-generator", name="QR Code Generator", category="generators",
    short_desc="Turn any link or short message into a scannable QR code you can download as an image.",
    icon="qr",
    widget_html='''
      <h2>Create a QR code</h2>
      <div class="field-row">
        <label for="qr-input">Link or text</label>
        <input type="text" id="qr-input" placeholder="https://example.com">
      </div>
      <div class="btn-row">
        <button class="btn amber" id="qr-generate">Generate QR code</button>
        <button class="btn secondary" id="qr-download" style="display:none;">Download PNG</button>
      </div>
      <p class="status-msg" id="qr-status"></p>
      <div class="qr-preview" id="qr-canvas-wrap"></div>
    ''',
    extra_head='<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>',
    tool_js="qr-code-generator.js",
    intro="Paste in a web address, a piece of text, or contact details, and get back a QR code that any phone camera can scan. The code is generated entirely in your browser and can be downloaded straight away as a PNG image.",
    how_it_works=[
        "Type or paste your link or text into the box.",
        "Click generate, and a QR code appears immediately.",
        "Download the code as a PNG to print or share.",
    ],
    use_cases=[
        "Adding a scannable link to a flyer, menu, or business card.",
        "Sharing a Wi-Fi password or contact card without typing it out.",
        "Linking a printed document to an online form or page.",
    ],
    faqs=[
        ("Is there a limit on how much text I can encode?", "QR codes can hold a few thousand characters, but shorter input produces a simpler, easier-to-scan code. Stick to short links or messages where possible."),
        ("Does the QR code expire?", "No. Once generated and downloaded, it's a static image that works for as long as the content it points to (like a web page) stays available."),
        ("Can I change the color or add a logo?", "This tool generates a standard black-and-white code for maximum scan reliability. Color and logo customization is not currently supported."),
    ],
)

add_tool(
    slug="password-generator", name="Password Generator", category="generators",
    short_desc="Create a strong, random password with adjustable length and character types.",
    icon="key",
    widget_html='''
      <h2>Generate a password</h2>
      <div class="field-row">
        <label for="pw-length">Length: <span id="pw-length-value">16</span></label>
        <input type="range" id="pw-length" min="6" max="48" value="16">
      </div>
      <div class="field-row">
        <label><input type="checkbox" id="pw-upper" checked> Uppercase letters (A–Z)</label><br>
        <label><input type="checkbox" id="pw-lower" checked> Lowercase letters (a–z)</label><br>
        <label><input type="checkbox" id="pw-numbers" checked> Numbers (0–9)</label><br>
        <label><input type="checkbox" id="pw-symbols" checked> Symbols (!@#$…)</label>
      </div>
      <div class="btn-row">
        <button class="btn amber" id="pw-generate">Generate</button>
        <button class="btn secondary" id="pw-copy">Copy</button>
      </div>
      <div class="output-box" id="pw-output"></div>
      <p class="status-msg" id="pw-strength"></p>
    ''',
    extra_head="",
    tool_js="password-generator.js",
    intro="Set the length and which character types to include, and get a random password generated using your browser's cryptographically secure random number source, the same kind used for security-sensitive code, not a predictable pseudo-random function.",
    how_it_works=[
        "Choose a length and which character types to include.",
        "A password is generated using the Web Crypto API's secure random values.",
        "Copy it straight to your clipboard, or generate a new one if you'd like different options.",
    ],
    use_cases=[
        "Creating a new account password that isn't reused from another site.",
        "Generating a one-off passphrase for a shared document or Wi-Fi network.",
        "Producing a random string for use as an API key or test credential.",
    ],
    faqs=[
        ("Are these passwords stored anywhere?", "No. Each password is generated locally in your browser and is never sent anywhere or logged."),
        ("How long should my password be?", "Longer is generally stronger. Sixteen characters with a mix of character types is a reasonable baseline for most accounts; use more for anything sensitive."),
        ("Should I reuse a generated password across sites?", "No. Use a unique password for each account, ideally stored in a password manager, so that one leaked password doesn't put other accounts at risk."),
    ],
)

add_tool(
    slug="word-counter", name="Word & Character Counter", category="text",
    short_desc="Count words, characters, sentences, and estimated reading time as you type.",
    icon="text",
    widget_html='''
      <h2>Count your text</h2>
      <textarea id="wc-input" placeholder="Paste or type your text here…"></textarea>
      <div class="tool-grid" style="margin-top:16px;">
        <div class="tool-card"><span class="category-tag">Words</span><h3 id="wc-words">0</h3></div>
        <div class="tool-card"><span class="category-tag">Characters</span><h3 id="wc-chars">0</h3></div>
        <div class="tool-card"><span class="category-tag">Characters (no spaces)</span><h3 id="wc-chars-nospace">0</h3></div>
        <div class="tool-card"><span class="category-tag">Sentences</span><h3 id="wc-sentences">0</h3></div>
        <div class="tool-card"><span class="category-tag">Paragraphs</span><h3 id="wc-paragraphs">0</h3></div>
        <div class="tool-card"><span class="category-tag">Reading time</span><h3 id="wc-readtime">0 min</h3></div>
      </div>
    ''',
    extra_head="",
    tool_js="word-counter.js",
    intro="Paste in any text and see live counts update as you type or edit: words, characters, sentences, paragraphs, and an estimated reading time based on an average adult reading speed.",
    how_it_works=[
        "Type or paste text into the box.",
        "Counts update instantly with every keystroke.",
        "Reading time is estimated at 200 words per minute, a common average for adult silent reading.",
    ],
    use_cases=[
        "Checking whether a social media post or bio fits a character limit.",
        "Estimating how long a blog post or script will take to read aloud.",
        "Tracking word count progress while drafting an essay or article.",
    ],
    faqs=[
        ("Is my text saved or sent anywhere?", "No. All counting happens locally in your browser as you type; nothing is transmitted or stored."),
        ("How is reading time calculated?", "Word count divided by 200 words per minute, rounded up to the nearest minute."),
        ("Does it count numbers and punctuation as words?", "Numbers are counted as words if they're separated by spaces. Punctuation attached to a word doesn't count separately."),
    ],
)

add_tool(
    slug="json-formatter", name="JSON Formatter & Validator", category="developer",
    short_desc="Pretty-print, minify, and validate JSON directly in your browser.",
    icon="code",
    widget_html='''
      <h2>Format or validate JSON</h2>
      <div class="field-row">
        <label for="jf-input">Paste your JSON</label>
        <textarea id="jf-input" placeholder='{"example": true, "count": 3}'></textarea>
      </div>
      <div class="btn-row">
        <button class="btn amber" id="jf-format">Format</button>
        <button class="btn secondary" id="jf-minify">Minify</button>
        <button class="btn secondary" id="jf-copy">Copy result</button>
      </div>
      <p class="status-msg" id="jf-status"></p>
      <div class="output-box" id="jf-output"></div>
    ''',
    extra_head="",
    tool_js="json-formatter.js",
    intro="Paste in raw or minified JSON to check whether it's valid and get a cleanly indented version, or paste in formatted JSON to compress it down to a single line for use in configuration files or API calls.",
    how_it_works=[
        "Paste your JSON into the input box.",
        "Click format for readable, indented output, or minify for a compact single-line version.",
        "Invalid JSON is flagged immediately with a description of what went wrong.",
    ],
    use_cases=[
        "Cleaning up a minified API response to read it more easily.",
        "Checking a hand-written config file for a missing comma or bracket.",
        "Compressing a JSON payload before pasting it into a size-limited field.",
    ],
    faqs=[
        ("Is my JSON data sent to a server?", "No. Formatting and validation both run entirely in your browser using the JavaScript engine's built-in JSON parser."),
        ("What does an 'invalid JSON' error mean?", "It means the parser hit something that isn't valid JSON syntax, commonly a trailing comma, an unquoted key, or a missing bracket. The error message names the position where parsing failed."),
        ("Does this support JSON5 or JSONC (with comments)?", "No, only standard JSON. Comments and trailing commas need to be removed first."),
    ],
)

add_tool(
    slug="base64-tool", name="Base64 Encoder & Decoder", category="developer",
    short_desc="Convert text to Base64 and back, entirely in your browser.",
    icon="base64",
    widget_html='''
      <h2>Encode or decode Base64</h2>
      <div class="field-row">
        <label for="b64-input">Input</label>
        <textarea id="b64-input" placeholder="Type text to encode, or Base64 to decode…"></textarea>
      </div>
      <div class="btn-row">
        <button class="btn amber" id="b64-encode">Encode</button>
        <button class="btn secondary" id="b64-decode">Decode</button>
        <button class="btn secondary" id="b64-copy">Copy result</button>
      </div>
      <p class="status-msg" id="b64-status"></p>
      <div class="output-box" id="b64-output"></div>
    ''',
    extra_head="",
    tool_js="base64-tool.js",
    intro="Base64 turns arbitrary text or binary data into a plain-text string safe for things like URLs, config files, or embedding in HTML. Paste text in either direction and convert it instantly.",
    how_it_works=[
        "Paste plain text and click encode to get its Base64 representation.",
        "Paste a Base64 string and click decode to recover the original text.",
        "Unicode text, including accented characters and emoji, is handled correctly in both directions.",
    ],
    use_cases=[
        "Embedding a small piece of data inside a URL or config value.",
        "Decoding a Base64-encoded token or payload while debugging an API.",
        "Preparing text for systems that only accept plain ASCII characters.",
    ],
    faqs=[
        ("Is Base64 encryption?", "No. Base64 is an encoding, not encryption — anyone can decode it back to the original text. Don't use it to protect sensitive information."),
        ("Why did decoding fail?", "The input wasn't valid Base64, often because of extra whitespace, line breaks, or characters outside the Base64 alphabet."),
        ("Does this work with files, not just text?", "This tool handles text input and output. For encoding files, a dedicated file-to-Base64 tool is a better fit."),
    ],
)

add_tool(
    slug="user-agent-generator", name="User Agent Generator", category="developer",
    short_desc="Grab realistic browser and bot user-agent strings for testing how your site responds.",
    icon="agent",
    widget_html='''
      <h2>Get a user-agent string</h2>
      <div class="field-row">
        <label for="ua-select">Choose a browser or device</label>
        <select id="ua-select"></select>
      </div>
      <div class="btn-row">
        <button class="btn secondary" id="ua-random">Random pick</button>
        <button class="btn amber" id="ua-copy">Copy</button>
      </div>
      <p class="status-msg" id="ua-status"></p>
      <div class="output-box" id="ua-output"></div>
    ''',
    extra_head="",
    tool_js="user-agent-generator.js",
    intro="A quick reference list of real-world user-agent strings for common browsers, devices, and crawlers, useful when testing how a site or script behaves under different clients. This is a reference and testing utility, not a way to disguise real traffic; most browsers' developer tools let you actually apply one of these strings to a test request.",
    how_it_works=[
        "Pick a browser or device from the list, or click random pick.",
        "The matching user-agent string appears in the box below.",
        "Copy it and paste it into your browser's device toolbar override, an API testing tool, or your own test scripts.",
    ],
    use_cases=[
        "Testing that a responsive site correctly detects mobile versus desktop.",
        "Checking how a page renders for a search engine crawler like Googlebot.",
        "Reproducing a bug report that only happens on a specific browser or device.",
    ],
    faqs=[
        ("Does picking a string change my real browser?", "No. This tool only displays reference text for you to copy. To actually change what your browser sends, use your browser's built-in developer tools or a testing proxy."),
        ("Are these real, current user-agent strings?", "They're realistic examples of the current format used by each browser or crawler, meant for testing rather than as a live, constantly updated database."),
        ("Can I use this to scrape sites while hiding my identity?", "This tool is meant for legitimate testing of your own sites and code. Using a fake user agent to evade a site's terms of service or access controls is a separate matter between you and that site's policies."),
    ],
)

add_tool(
    slug="color-palette-generator", name="Color Palette Generator", category="generators",
    short_desc="Generate a five-color palette for design work, with the option to lock colors you like.",
    icon="palette",
    widget_html='''
      <h2>Generate a palette</h2>
      <div class="btn-row">
        <button class="btn amber" id="cp-generate">Generate palette</button>
      </div>
      <p class="status-msg" id="cp-status"></p>
      <div class="swatch-row" id="cp-row"></div>
    ''',
    extra_head="",
    tool_js="color-palette-generator.js",
    intro="Click generate for a set of five colors that work well together, built from a rotating hue with varied lightness. Lock any swatch you want to keep and generate again to fill in the rest around it.",
    how_it_works=[
        "A base hue is picked at random, then four related hues are generated around it at increasing lightness.",
        "Each swatch shows its hex code, ready to copy into a design tool or CSS file.",
        "Lock a swatch to keep it fixed while regenerating the others.",
    ],
    use_cases=[
        "Finding a starting color scheme for a website or slide deck.",
        "Generating quick color ideas for a logo or brand exploration.",
        "Building a palette of chart colors for a data visualization.",
    ],
    faqs=[
        ("Are these palettes accessible for text and backgrounds?", "Not automatically. Always check contrast between text and background colors separately using a contrast checker before finalizing a design."),
        ("Can I export the palette?", "Each swatch shows its hex code, which you can copy directly into your design software or CSS."),
        ("Why do locked colors stay the same?", "Locking a swatch excludes it from the next randomization, so you can build a palette around a color you've already decided on."),
    ],
)

add_tool(
    slug="unit-converter", name="Unit Converter", category="generators",
    short_desc="Convert between common length, weight, and temperature units instantly.",
    icon="convert",
    widget_html='''
      <h2>Convert a unit</h2>
      <div class="field-row">
        <label for="uc-group">Category</label>
        <select id="uc-group">
          <option value="length">Length</option>
          <option value="weight">Weight</option>
          <option value="temperature">Temperature</option>
        </select>
      </div>
      <div class="field-row">
        <label for="uc-value">Value</label>
        <input type="number" id="uc-value" value="1">
      </div>
      <div class="field-row" style="display:flex; gap:12px;">
        <div style="flex:1;"><label for="uc-from">From</label><select id="uc-from"></select></div>
        <div style="flex:1;"><label for="uc-to">To</label><select id="uc-to"></select></div>
      </div>
      <div class="output-box" id="uc-result">0</div>
    ''',
    extra_head="",
    tool_js="unit-converter.js",
    intro="Pick a category, enter a value, and choose the units to convert between. Results update instantly as you type, covering the length, weight, and temperature conversions people look up most often.",
    how_it_works=[
        "Choose a category: length, weight, or temperature.",
        "Enter a value and pick the units to convert from and to.",
        "The result updates immediately as you change any field.",
    ],
    use_cases=[
        "Converting a recipe's weights between metric and imperial units.",
        "Checking a package's dimensions in the units your shipping carrier requires.",
        "Converting a weather forecast's temperature to a scale you're more used to.",
    ],
    faqs=[
        ("Which units are supported?", "Length covers meters, kilometers, centimeters, millimeters, miles, yards, feet, and inches. Weight covers kilograms, grams, milligrams, pounds, ounces, and tonnes. Temperature covers Celsius, Fahrenheit, and Kelvin."),
        ("How precise are the conversions?", "Results are rounded to a sensible number of decimal places for readability, using standard conversion factors."),
        ("Can more unit categories be added?", "This tool covers the most commonly requested categories; additional ones like volume or area can be added over time."),
    ],
)

TOOLS_BY_SLUG = {t["slug"]: t for t in TOOLS}
for t in TOOLS:
    t["icon_svg"] = ICONS[t["icon"]]
