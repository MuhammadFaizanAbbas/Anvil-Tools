#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generates the Anvil Tools static site: home, tool pages, category pages, blog, legal pages."""
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend"))
SITE_NAME = "Anvil Tools"
SITE_TAGLINE = "Free browser tools that just work"
SITE_URL = "https://anviltools.vercel.app"  # placeholder — replace with your real domain before launch
CONTACT_EMAIL = "info@velloxtech.com"    # placeholder — replace with your real inbox

def icon(path_d, viewbox="0 0 24 24"):
    return (f'<svg viewBox="{viewbox}" width="20" height="20" fill="none" '
            f'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{path_d}</svg>')

ICONS = {
    "mail": icon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    "image": icon('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-4 4-3-3-6 6"/>'),
    "pdf-merge": icon('<path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 16h6"/>'),
    "pdf-image": icon('<path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/><circle cx="10" cy="12" r="1"/><path d="M9 17l2-2 2 2 3-3"/>'),
    "qr": icon('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14h2v2M14 19h2v2M19 19h2v2"/>'),
    "key": icon('<circle cx="8" cy="15" r="4"/><path d="M10.5 12.5 20 3M17 6l2 2M14 9l2 2"/>'),
    "text": icon('<path d="M4 6h16M4 12h10M4 18h16"/>'),
    "code": icon('<path d="M9 18l-6-6 6-6M15 6l6 6-6 6"/>'),
    "base64": icon('<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 11v2M11 10v4M15 10.5v3M19 11v2"/>'),
    "agent": icon('<rect x="4" y="7" width="16" height="12" rx="2"/><circle cx="9" cy="13" r="1.2"/><circle cx="15" cy="13" r="1.2"/><path d="M12 3v4M8 3h8"/>'),
    "palette": icon('<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10.5" r="1.3"/><circle cx="12" cy="8" r="1.3"/><circle cx="15.5" cy="10.5" r="1.3"/><path d="M12 21a3 3 0 0 1 0-6h5a3 3 0 0 0 0-6"/>'),
    "convert": icon('<path d="M7 7h11l-3-3M17 17H6l3 3"/>'),
}

NAV_LINKS = [
    ("/", "Home"),
    ("/tools/", "All tools"),
    ("/blog/", "Guides &amp; experiments"),
    ("/about.html", "About"),
]

def rel(path_from_root):
    """Return the href for a root-relative site path, unchanged (site is served from domain root)."""
    return path_from_root

def header_html(active_path, depth_prefix):
    links = ""
    for href, label in NAV_LINKS:
        target = "/tools/index.html" if href == "/tools/" else ("/blog/index.html" if href == "/blog/" else href)
        full = "/" if target == "/" else depth_prefix + target.lstrip("/")
        cur = ' aria-current="page"' if href == active_path else ""
        links += f'<a href="{full}"{cur}>{label}</a>'
    logo_href = "/"
    return f'''<header class="site-header">
  <div class="header-row">
    <a class="logo" href="{logo_href}">
      <img class="brand-mark" src="{depth_prefix}assets/images/anvil-mark.svg" width="36" height="36" alt="">
      {SITE_NAME}
    </a>
    <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">☰</button>
    <nav class="main-nav">{links}</nav>
  </div>
</header>'''

def footer_html(depth_prefix):
    p = depth_prefix
    return f'''<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <div class="logo" style="margin-bottom:10px;"><img class="brand-mark" src="{p}assets/images/anvil-mark.svg" width="36" height="36" alt="">{SITE_NAME}</div>
        <p class="small-note">Free, browser-based tools for email, images, PDFs, and everyday developer tasks. No installs, no accounts required for most tools.</p>
      </div>
      <div>
        <h3>Tools</h3>
        <ul>
          <li><a href="{p}tools/temp-mail.html">Temp mail</a></li>
          <li><a href="{p}tools/background-remover.html">Background remover</a></li>
          <li><a href="{p}tools/pdf-merge.html">PDF merge</a></li>
          <li><a href="{p}tools/index.html">View all tools</a></li>
        </ul>
      </div>
      <div>
        <h3>Company</h3>
        <ul>
          <li><a href="{p}about.html">About</a></li>
          <li><a href="{p}blog/index.html">Guides &amp; experiments</a></li>
          <li><a href="{p}contact.html">Contact</a></li>
        </ul>
      </div>
      <div>
        <h3>Legal</h3>
        <ul>
          <li><a href="{p}privacy-policy.html">Privacy policy</a></li>
          <li><a href="{p}terms-of-service.html">Terms of service</a></li>
          <li><a href="{p}cookie-policy.html">Cookie policy</a></li>
          <li><a href="{p}disclaimer.html">Disclaimer</a></li>

        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span class="current-year"></span> {SITE_NAME}. All rights reserved.</span>
      <span>Anvil Tools is a VelloxTech project.</span>
    </div>
  </div>
</footer>
'''

def page(title, description, active_path, depth_prefix, body_html, extra_head="", extra_scripts="", canonical_path=""):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} | {SITE_NAME}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{SITE_URL}/{canonical_path}">
<link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{depth_prefix}assets/css/style.css">
<link rel="stylesheet" href="{depth_prefix}assets/css/refinements.css">
<link rel="icon" type="image/svg+xml" href="{depth_prefix}assets/images/anvil-mark.svg">
<link rel="stylesheet" href="{depth_prefix}assets/css/design.css">
{extra_head}
</head>
<body class="public-site">
<a class="skip-link" href="#main-content">Skip to content</a>
{header_html(active_path, depth_prefix)}
<main class="wrap" id="main-content">
{body_html}
</main>
{footer_html(depth_prefix)}
<script src="{depth_prefix}assets/js/config.js"></script>
<script src="{depth_prefix}assets/js/api.js"></script>

<script src="{depth_prefix}assets/js/main.js"></script>

{extra_scripts}
</body>
</html>'''

def write(path, content):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)

def breadcrumbs(depth_prefix, trail):
    # trail: list of (label, href or None for current)
    parts = []
    for label, href in trail:
        if href:
            target = "/" if href == "index.html" and label == "Home" else depth_prefix + href
            parts.append(f'<a href="{target}">{label}</a>')
        else:
            parts.append(f'<span>{label}</span>')
    return '<p class="breadcrumbs">' + ' / '.join(parts) + '</p>'

def ad_slot(label="Advertisement"):
    # Advertising is disabled. Future placements require an explicit content-page
    # review and must exclude inboxes, tool controls, downloads, and result panels.
    return ""
