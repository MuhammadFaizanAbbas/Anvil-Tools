# -*- coding: utf-8 -*-
import os
from build_site import (ROOT, SITE_NAME, SITE_TAGLINE, SITE_URL, CONTACT_EMAIL,
                         page, write, breadcrumbs, ad_slot)
from build_site_data import TOOLS, TOOLS_BY_SLUG, CATEGORIES

# ---------------------------------------------------------------- tool cards
def tool_card_html(t, depth_prefix):
    return f'''<div class="tool-card">
  <div class="tool-icon">{t["icon_svg"]}</div>
  <span class="category-tag">{CATEGORIES[t["category"]]["label"]}</span>
  <h3>{t["name"]}</h3>
  <p>{t["short_desc"]}</p>
  <a class="tool-link" href="{depth_prefix}tools/{t["slug"]}.html">Open tool →</a>
</div>'''

# ---------------------------------------------------------------- home page
def build_home():
    depth = ""
    cards = "\n".join(tool_card_html(t, depth) for t in TOOLS)
    chips = "\n".join(
        f'<a class="chip" href="categories/{c["slug"]}.html">{c["label"]}</a>'
        for c in CATEGORIES.values()
    )
    body = f'''
<section class="hero">
  <span class="eyebrow">{len(TOOLS)} free browser tools</span>
  <h1>{SITE_TAGLINE}</h1>
  <p class="lede">No installs, no accounts for most tools, and nothing you upload leaves your device unless a tool's own description says otherwise. Pick a tool below and get straight to work.</p>
  <div class="chip-row">{chips}</div>
</section>

<section>
  <h2 class="mt-0">All tools</h2>
  <div class="tool-grid">
  {cards}
  </div>
</section>

{ad_slot()}

<section>
  <h2>Why these tools work this way</h2>
  <div class="info-section">
  <p>Most of the tools on this site run entirely in your browser using JavaScript, which means your files and text are processed on your own device rather than uploaded to a server. The temporary email tool is the one exception: it needs a real inbox somewhere to receive mail, so it uses a public email service built for exactly this purpose. Each tool's page explains exactly how it works and what happens to your data.</p>
  </div>
</section>

<section>
  <h2>From the blog</h2>
  <p><a href="blog/index.html">Read guides on getting the most out of these tools →</a></p>
</section>
'''
    write("index.html", page(
        title=f"{SITE_NAME} — {SITE_TAGLINE}",
        description="Free browser-based tools: temporary email, background remover, PDF merge, QR codes, password generator, JSON formatter, and more.",
        active_path="/", depth_prefix=depth, body_html=body, canonical_path=""
    ))

# ---------------------------------------------------------------- tools index
def build_tools_index():
    depth = "../"
    cards = "\n".join(tool_card_html(t, depth) for t in TOOLS)
    body = f'''
{breadcrumbs(depth, [("Home","index.html"), ("All tools", None)])}
<section class="hero">
  <h1>All tools</h1>
  <p class="lede">Every tool on {SITE_NAME}, in one place. Browse by category on the home page, or scan the full list below.</p>
</section>
<section>
  <div class="tool-grid">
  {cards}
  </div>
</section>
{ad_slot()}
'''
    write("tools/index.html", page(
        title="All tools", description="Browse every free tool available on " + SITE_NAME + ".",
        active_path="/tools/", depth_prefix=depth, body_html=body, canonical_path="tools/index.html"
    ))

# ---------------------------------------------------------------- tool pages
def build_tool_pages():
    depth = "../"
    for t in TOOLS:
        cat = CATEGORIES[t["category"]]
        how = "\n".join(f"<li>{step}</li>" for step in t["how_it_works"])
        uses = "\n".join(f"<li>{u}</li>" for u in t["use_cases"])
        faqs = "\n".join(
            f'<div class="faq-item"><h3>{q}</h3><p>{a}</p></div>' for q, a in t["faqs"]
        )
        related = [x for x in TOOLS if x["category"] == t["category"] and x["slug"] != t["slug"]][:3]
        if len(related) < 3:
            related += [x for x in TOOLS if x["slug"] != t["slug"] and x not in related][: 3 - len(related)]
        related_cards = "\n".join(tool_card_html(r, depth) for r in related)

        body = f'''
{breadcrumbs(depth, [("Home","index.html"), (cat["label"], "categories/"+cat["slug"]+".html"), (t["name"], None)])}
<section class="hero" style="padding-bottom:8px;">
  <span class="eyebrow">{cat["label"]}</span>
  <h1>{t["name"]}</h1>
  <p class="lede">{t["intro"]}</p>
</section>

<div class="tool-app">
  {t["widget_html"]}
</div>

{ad_slot()}

<section class="info-section">
  <h2>How it works</h2>
  <ul>{how}</ul>

  <h2>Common uses</h2>
  <ul>{uses}</ul>

  <div class="callout">Your privacy matters here: check the FAQ below for exactly what happens to anything you enter into this tool.</div>

  <h2>Frequently asked questions</h2>
  {faqs}
</section>

<section>
  <h2>Related tools</h2>
  <div class="tool-grid">
  {related_cards}
  </div>
</section>
'''
        write(f"tools/{t['slug']}.html", page(
            title=t["name"], description=t["short_desc"],
            active_path="/tools/", depth_prefix=depth, body_html=body,
            extra_head=t["extra_head"],
            extra_scripts=f'<script src="{depth}assets/js/tools/{t["tool_js"]}"></script>',
            canonical_path=f"tools/{t['slug']}.html"
        ))

# ---------------------------------------------------------------- category pages
def build_category_pages():
    depth = "../"
    for key, cat in CATEGORIES.items():
        members = [t for t in TOOLS if t["category"] == key]
        cards = "\n".join(tool_card_html(t, depth) for t in members)
        body = f'''
{breadcrumbs(depth, [("Home","index.html"), ("All tools","tools/index.html"), (cat["label"], None)])}
<section class="hero">
  <h1>{cat["label"]}</h1>
  <p class="lede">{cat["desc"]}</p>
</section>
<section>
  <div class="tool-grid">
  {cards}
  </div>
</section>
{ad_slot()}
'''
        write(f"categories/{cat['slug']}.html", page(
            title=cat["label"], description=cat["desc"],
            active_path="/tools/", depth_prefix=depth, body_html=body, canonical_path=f"categories/{cat['slug']}.html"
        ))

# ---------------------------------------------------------------- blog
def build_blog():
    # Preserve the database-driven listing and article shell maintained in frontend/blog.
    pass

# ---------------------------------------------------------------- static/legal pages
def build_static_pages():
    depth = ""

    about_body = f'''
{breadcrumbs(depth, [("Home","index.html"), ("About", None)])}
<section class="hero"><h1>About {SITE_NAME}</h1>
<p class="lede">{SITE_NAME} builds small, focused tools for tasks people run into every day: cleaning up an image, combining a few PDFs, generating a password, or getting a disposable inbox for a form that shouldn't have asked for an email in the first place.</p></section>
<section class="info-section">
<h2>Our approach</h2>
<p>Every tool here is built to do one job well, run quickly, and avoid asking for more than it needs. Where a task can be done entirely in your browser, it is, so your files and text stay on your own device rather than passing through a server. The one exception is the temporary email tool, which by its nature needs a real inbox somewhere to receive mail; its own page explains exactly how that works.</p>
<h2>Who's behind this</h2>
<p>This site is independently run and not affiliated with any of the browsers, operating systems, or services its tools are compatible with. If a tool isn't working the way you expect, the <a href="contact.html">contact page</a> is the fastest way to reach us.</p>
</section>
'''
    write("about.html", page("About", f"About {SITE_NAME} and how our tools work.", "/about.html", depth, about_body, canonical_path="about.html"))

    with open(os.path.join(os.path.dirname(__file__), "templates/contact.html"), encoding="utf-8") as contact_template:
        contact_body = contact_template.read()
    write("contact.html", page("Contact", f"Get in touch with {SITE_NAME}.", "/contact.html", depth, contact_body, extra_scripts='<script src="assets/js/contact.js"></script>', canonical_path="contact.html"))

    privacy_body = f'''
{breadcrumbs(depth, [("Home","index.html"), ("Privacy policy", None)])}
<section class="hero"><h1>Privacy policy</h1><p class="lede">Last updated: October 5, 2026.</p></section>
<section class="legal-content">
<h2>What this site is</h2>
<p>{SITE_NAME} ("we", "us") provides free browser-based tools at {SITE_URL}. This policy explains what information is collected when you use the site and the tools on it.</p>

<h2>Information processed by the tools themselves</h2>
<p>Most tools on this site (background remover, PDF merge, image to PDF, QR code generator, password generator, word counter, JSON formatter, Base64 tool, user agent generator, color palette generator, and unit converter) run entirely in your browser. Files and text you enter into these tools are processed on your own device and are not uploaded to our servers.</p>
<p>The temporary email tool works differently: it creates a real, active email inbox using a third-party email service (Guerrilla Mail) so that it can actually receive mail. Messages sent to that inbox pass through that service's infrastructure. Do not send anything sensitive to a temporary inbox, and review that provider's own terms if you want details of how they handle message data.</p>

<h2>Information collected automatically</h2>
<p>Our hosting and API services receive ordinary connection information, including your IP address, browser user agent, requested URL, referring page when provided, and timestamps. Operational logs and rate limits help deliver the site, investigate failures, and prevent abuse. Automatic browser analytics and advertising are currently disabled.</p>

<h2>Cookies and advertising</h2>
<p>Advertising and automatic browser analytics are currently disabled. We use browser session storage for temporary-inbox access and workspace sessions. Earlier versions may have left an anvil_consent_v1 preference in local storage; it does not enable tracking and can be removed by clearing site data. Our <a href="cookie-policy.html">cookie policy</a> describes these entries and their purposes.</p>
<p>You can clear site data through your browser settings. Optional advertising and analytics are not enabled. If they are introduced, we will update this policy and implement the applicable consent controls before using them.</p>

<h2>If Google advertising is introduced</h2>
<p>Before enabling Google AdSense, we will identify the active advertising services and their purposes here. Ad serving may send Google and participating advertising providers your IP address, browser and device information, page or ad activity, and advertising identifiers. Those third parties may place or read cookies, use web beacons, and process this information to deliver, personalize where permitted, and measure ads, and to detect fraud. Personalized advertising may use activity on this and other sites. Read <a href="https://www.google.com/policies/privacy/partners/" target="_blank" rel="noopener">how Google uses information from partner sites and apps</a>, including the choices Google provides.</p>
<p>For personalized advertising to visitors in the European Economic Area, United Kingdom, or Switzerland, we will use a Google-certified consent management platform that supports the IAB Transparency and Consent Framework. The applicable consent message will identify providers and purposes and explain how to manage or withdraw choices. Other regional requirements will be assessed before launch. There is currently no advertising consent message because advertising is disabled; continued browsing or an old stored preference does not grant future advertising consent.</p>

<h2>Children's privacy</h2>
<p>This site is not directed at children under 13, and we do not knowingly collect personal information from children under 13 or serve personalized ads based on activity by users known to be under that age.</p>

<h2>Your choices</h2>
<p>You can clear your browser's cookies and local storage at any time. For the temporary email tool specifically, closing the tab or generating a new address discards the inbox and any messages in it.</p>

<h2>Changes to this policy</h2>
<p>We may update this policy from time to time. Continued use of the site after changes are posted means you accept the updated policy.</p>

<h2>Contact</h2>
<p>Questions about this policy can be sent to <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a>.</p>
</section>
'''
    write("privacy-policy.html", page("Privacy policy", f"How {SITE_NAME} handles your data.", "/privacy-policy.html", depth, privacy_body, canonical_path="privacy-policy.html"))

    terms_body = f'''
{breadcrumbs(depth, [("Home","index.html"), ("Terms of service", None)])}
<section class="hero"><h1>Terms of service</h1><p class="lede">Last updated: September 30, 2026.</p></section>
<section class="legal-content">
<h2>Using this site</h2>
<p>By using {SITE_NAME}, you agree to these terms. If you don't agree, please don't use the site.</p>

<h2>The tools are provided as-is</h2>
<p>Tools on this site are provided free of charge, without warranty of any kind, express or implied. We do our best to keep every tool working correctly, but we don't guarantee uninterrupted availability, error-free operation, or that a tool's output is fit for any particular purpose. Always verify important results (such as a converted document or generated password) before relying on them.</p>

<h2>Acceptable use</h2>
<p>You agree not to use this site to violate any law, infringe anyone's rights, distribute malware, or attempt to disrupt or gain unauthorized access to the site or its infrastructure. The temporary email tool may not be used to impersonate another person, commit fraud, or evade a service's legitimate identity verification requirements.</p>

<h2>Intellectual property</h2>
<p>The site's design, code, and written content are owned by {SITE_NAME} or its licensors. Files, text, and images you process using the tools remain yours; we claim no ownership over content you create or upload.</p>

<h2>Third-party services</h2>
<p>Some tools rely on third-party services or libraries (for example, the temporary email tool's email provider). We aren't responsible for the availability or behavior of third-party services outside our control.</p>

<h2>Limitation of liability</h2>
<p>To the fullest extent permitted by law, {SITE_NAME} is not liable for any indirect, incidental, or consequential damages arising from your use of the site or its tools.</p>

<h2>Changes</h2>
<p>We may update these terms from time to time. Continued use of the site after changes are posted means you accept the updated terms.</p>

<h2>Contact</h2>
<p>Questions about these terms can be sent to <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a>.</p>
</section>
'''
    write("terms-of-service.html", page("Terms of service", f"Terms for using {SITE_NAME}.", "/terms-of-service.html", depth, terms_body, canonical_path="terms-of-service.html"))

    cookie_body = f'''
{breadcrumbs(depth, [("Home","index.html"), ("Cookie policy", None)])}
<section class="hero"><h1>Cookie policy</h1><p class="lede">Last updated: October 5, 2026.</p></section>
<section class="legal-content">
<h2>Current cookies and browser storage</h2>
<p>Advertising and automatic browser analytics are disabled. The first-party application uses browser storage for the functions described below; it does not currently set optional advertising or analytics cookies.</p>
<h2>Necessary session storage</h2>
<p>The temporary inbox uses the tm_cap entry in session storage to restore access while the inbox remains active. The private workspace uses anvil_admin_session for its access token and expiry. These values support the service you request and are not advertising preferences.</p>
<h2>Preferences from earlier versions</h2>
<p>An earlier version stored optional preferences under anvil_consent_v1 in local storage. The current pages do not use that entry to load advertising or analytics. You can remove it by clearing site data.</p>
<h2>Managing stored data</h2>
<p>Your browser settings let you inspect and clear cookies and site storage. Clearing session storage can end inbox or workspace access. Clearing browser data does not delete provider-held messages, support records or hosting logs. Browser session-restore features may restore tab storage.</p>
<h2>External services and future changes</h2>
<p>Page assets, fonts and libraries can make requests to their hosting services. See our <a href="privacy-policy.html">privacy policy</a> for processing details. If advertising or analytics is introduced, we will describe the actual providers, storage and purposes and implement applicable consent controls before enabling those services.</p>
<h2>If Google advertising is introduced</h2>
<p>Google and participating advertising providers may place or read cookies and use web beacons, IP addresses, and device or advertising identifiers to deliver, personalize where permitted, measure, and protect advertising. We will publish the active configuration and available choices before launch. See <a href="https://www.google.com/policies/privacy/partners/" target="_blank" rel="noopener">how Google uses information from partner sites and apps</a>.</p>
<p>Before serving personalized ads in the European Economic Area, United Kingdom, or Switzerland, we will use a Google-certified consent management platform supporting the IAB Transparency and Consent Framework. Its message will explain the applicable providers, purposes, and controls for managing or withdrawing consent. Other regional requirements will be assessed before launch. Non-personalized ads can still involve cookies or identifiers and do not remove applicable consent requirements. Old anvil_consent_v1 preferences and continued browsing do not authorize future advertising.</p>
<h2>Contact</h2><p>Contact Velloxtech at <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a> with questions.</p>
</section>
'''
    write("cookie-policy.html", page("Cookie policy", f"How {SITE_NAME} uses cookies.", "/cookie-policy.html", depth, cookie_body, canonical_path="cookie-policy.html"))

    disclaimer_body = f'''
{breadcrumbs(depth, [("Home","index.html"), ("Disclaimer", None)])}
<section class="hero"><h1>Disclaimer</h1></section>
<section class="legal-content">
<p>The tools and information on {SITE_NAME} are provided for general, everyday use. While we aim for accuracy and reliability, we make no guarantees about the fitness of any tool's output for a specific purpose, whether legal, medical, financial, or otherwise. Use professional advice for anything with real consequences riding on it.</p>
<p>The temporary email tool relies on a third-party email service and is intended for short-term, low-stakes use such as testing signups or avoiding promotional mail. It is not suitable for anything requiring a permanent, secure, or verifiable email address.</p>
<p>Automated tools such as the background remover produce results using machine learning models that are not perfect in every case. Review output before relying on it for professional or commercial use.</p>
</section>
'''
    write("disclaimer.html", page("Disclaimer", f"Usage disclaimer for {SITE_NAME}.", "/disclaimer.html", depth, disclaimer_body, canonical_path="disclaimer.html"))

    notfound_body = f'''
<section class="hero text-center"><h1>Page not found</h1>
<p class="lede">The page you're looking for doesn't exist or may have moved. Try one of the links below.</p>
<div class="btn-row" style="justify-content:center;"><a class="btn amber" href="/">Go home</a><a class="btn secondary" href="/tools/index.html">Browse all tools</a></div>
</section>
'''
    write("404.html", page("Page not found", "This page could not be found.", "", "/", notfound_body))

# ---------------------------------------------------------------- sitemap / robots / ads.txt
def build_seo_files():
    urls = ["", "about.html", "contact.html", "privacy-policy.html", "terms-of-service.html",
            "cookie-policy.html", "disclaimer.html", "tools/index.html", "blog/index.html"]
    urls += [f"tools/{t['slug']}.html" for t in TOOLS]
    urls += [f"categories/{c['slug']}.html" for c in CATEGORIES.values()]

    entries = "\n".join(f"  <url><loc>{SITE_URL}/{u}</loc></url>" for u in urls)
    sitemap = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{entries}
</urlset>
'''
    write("sitemap.xml", sitemap)
    write("sitemap-index.xml", f'''<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>{SITE_URL}/sitemap.xml</loc></sitemap>
  <sitemap><loc>{SITE_URL}/journal-sitemap.xml</loc></sitemap>
</sitemapindex>
''')

    robots = f'''User-agent: *
Allow: /
Disallow: /admin-panel/

Sitemap: {SITE_URL}/sitemap-index.xml
'''
    write("robots.txt", robots)

    # Preserve an owner's existing seller declarations when rebuilding the site.
    if not os.path.exists(os.path.join(ROOT, "ads.txt")):
        write("ads.txt", "# Advertising is disabled. Add only your verified seller line before serving ads.\n")

if __name__ == "__main__":
    build_home()
    build_tools_index()
    build_tool_pages()
    build_category_pages()
    build_blog()
    build_static_pages()
    build_seo_files()
    print("Site generated at", ROOT)
