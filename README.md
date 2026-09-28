# Anvil Tools — static site package

A complete, working static website: 12 browser-based tools, 6 category pages, a 4-post blog,
and every legal/trust page AdSense reviewers look for. No build step, no server required —
plain HTML, CSS, and JavaScript.

## What's inside

- `index.html` — home page with the full tool grid
- `tools/` — one page per tool, each with a working widget plus a genuine explanation, use cases, and FAQ
- `categories/` — six category landing pages
- `blog/` — a blog index and four original articles
- `about.html`, `contact.html`, `privacy-policy.html`, `terms-of-service.html`, `cookie-policy.html`, `disclaimer.html`
- `sitemap.xml`, `robots.txt`, `ads.txt` (placeholder — see below)
- `assets/` — shared CSS, shared JS, and each tool's own script

## Before you deploy — replace these placeholders

1. **Domain**: search every file for `https://www.example.com` (the `SITE_URL` value in `build_site.py`
   if you regenerate) and replace it with your real domain, then re-run the generator or find-and-replace
   across the built files.
2. **Contact email**: search for `hello@example.com` and replace with a real inbox you monitor.
3. **`ads.txt`**: replace `pub-0000000000000000` with your actual AdSense publisher ID once you have one.
   This file must live at the root of your domain exactly as `ads.txt`.
4. **Dates**: the privacy policy, terms, and cookie policy say "replace this date when you publish" —
   put the actual publish date in each.
5. **Company name in legal pages**: currently uses the site name "Anvil Tools" throughout. Update if you
   want a different legal entity name, and update the logo text in `build_site.py` (`SITE_NAME`) if you
   rename the brand.

## Deploying

This is a static site — any static host works with zero configuration:

- **Netlify / Vercel / Cloudflare Pages**: drag-and-drop the folder, or connect a Git repo. No build command needed.
- **GitHub Pages**: push this folder to a repo and enable Pages on the `main` branch.
- **Any regular web hosting (cPanel, etc.)**: upload the contents of this folder to your `public_html` (or equivalent) root via FTP/SFTP.

Because every internal link is relative, the site works whether it's served from a domain root or a subfolder — just make sure the whole folder structure stays intact.

## What's genuinely functional right now, and what depends on external services

- **Fully client-side, no dependencies beyond the page itself**: password generator, word counter, JSON formatter, Base64 tool, user agent generator, color palette generator, unit converter.
- **Client-side, using a CDN-hosted library (loaded live from the internet, so it needs the visitor to be online)**: background remover (`@imgly/background-removal` via jsDelivr), PDF merge and image-to-PDF (`pdf-lib` via cdnjs), QR code generator (`qrcodejs` via cdnjs).
- **Depends on a third-party API**: the temp mail tool calls the free public `mail.tm` service to create and poll a real inbox. This is a genuine working integration, but it means that tool's uptime depends on mail.tm's availability, and it's the one tool where visitor data (the inbox contents) passes through a service you don't control. If you outgrow the free tier or want your own infrastructure, this is the piece to eventually replace with your own mail-receiving backend.

## Before you apply to AdSense

See the separate `adsense-compliance-checklist.md` you already received for the full policy rundown. In short, before applying:

1. Deploy the site to a real domain and let it sit live for at least a few weeks with the placeholder content replaced by real content.
2. Write 3–5 more blog posts beyond the four included here — AdSense reviewers want to see an established publishing pattern, not four posts and nothing since.
3. Replace every placeholder value listed above.
4. Actually test every tool on the live domain (CDN scripts behave differently once served over your real HTTPS domain than they might locally).
5. Add your real AdSense publisher ID to `ads.txt` and paste your real AdSense ad unit code into the `.ad-slot` `<div>` elements scattered through the pages (search for `ad-slot` in the HTML) once you're approved — they're currently placeholders so the layout is ready but no ad requests fire before you're actually approved.
6. Consider adding a proper cookie-consent tool (an IAB TCF-compliant CMP) if you expect EU/UK visitors and plan to run personalized ads; the included consent banner is a basic acknowledgment notice, not a full consent-management platform.

## Regenerating the site

If you want to tweak copy, add a tool, or change the design system, the source is a small Python
generator (`build_site.py`, `build_site_data.py`, `generate.py`) rather than hand-edited HTML, so
changes to the shared header, footer, or CSS apply everywhere at once. Ask whoever is maintaining this
for you to run `python3 generate.py` after edits, or hand these three files back to Claude to extend.
