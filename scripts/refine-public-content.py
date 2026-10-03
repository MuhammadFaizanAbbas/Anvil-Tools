"""Apply reviewed public layout, FAQ, metadata, and ad-free defaults. Idempotent."""
from pathlib import Path
import re, json
from html import escape, unescape
ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT/'frontend'
FAQ = json.loads((ROOT/'scripts/site-generator/tool-faqs.json').read_text(encoding='utf-8'))
strip = lambda value: unescape(re.sub('<[^>]+>', '', value)).strip()
for path in SITE.rglob('*.html'):
 if 'admin-panel' in path.parts or 'assets' in path.parts: continue
 html=path.read_text(encoding='utf-8')
 html=html.replace('<!-- reading-surface --><div class="content-guide">','').replace('</div><!-- /reading-surface -->','')
 prefix='../' if path.parent != SITE else ''
 if path.name=='about.html':
  body=(ROOT/'scripts/site-generator/templates/about.html').read_text(encoding='utf-8')
  html=re.sub(r'(<main[^>]*>).*?(</main>)',lambda m:m[1]+body+m[2],html,flags=re.S)
 # Remove dormant ad boxes entirely, including the inbox. Ads remain disabled.
 html=re.sub(r'<div class="ad-slot"[^>]*>.*?</div>','',html,flags=re.S)
 html=html.replace('Last updated: replace this date when you publish the site.','Last updated: September 30, 2026.')
 if 'content.css' not in html:
  html=html.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/css/content.css">\n</head>')
 if path.stem in FAQ and path.parent.name=='tools':
  html=re.sub(r'<!-- reviewed-faq -->.*?<!-- /reviewed-faq -->','',html,flags=re.S)
  faqs=''.join('<details class="faq-item"><summary>'+escape(q)+'</summary><p>'+escape(a)+'</p></details>' for q,a in FAQ[path.stem])
  block='<!-- reviewed-faq --><section class="info-section"><h2>Working with your results</h2>'+faqs+'</section><!-- /reviewed-faq -->'
  html=html.replace('<!-- /expanded-content -->',block+'<!-- /expanded-content -->')
 # Group related explanatory sections in a single reading surface, preserving order.
 if 'class="content-guide"' not in html:
  sections=list(re.finditer(r'<section class="info-section">.*?</section>',html,re.S))
  if sections:
   first,last=sections[0].start(),sections[-1].end()
   html=html[:first]+'<!-- reading-surface --><div class="content-guide">'+html[first:last]+'</div><!-- /reading-surface -->'+html[last:]
 # Convert older static FAQs to semantic keyboard-operable disclosure controls.
 html=re.sub(r'<div class="faq-item"><h3>(.*?)</h3>(.*?)</div>',r'<details class="faq-item"><summary>\1</summary>\2</details>',html,flags=re.S)
 # Announce concise tool feedback without reading private result panels aloud.
 def announce_status(match):
  tag=match[0]
  if not re.search(r'\brole=',tag): tag=tag[:-1]+' role="status">'
  if not re.search(r'\baria-live=',tag): tag=tag[:-1]+' aria-live="polite">'
  if not re.search(r'\baria-atomic=',tag): tag=tag[:-1]+' aria-atomic="true">'
  return tag
 html=re.sub(r'<(?:p|div|span)\b[^>]*class="[^"]*\bstatus-msg\b[^"]*"[^>]*>',announce_status,html)
 if path.name=='404.html' and 'name="robots"' not in html:
  html=html.replace('</head>','<meta name="robots" content="noindex, follow">\n</head>')
 labels={'wc-input':'Text to count','bg-file-input':'Choose an image','pm-file-input':'Choose PDF files','ip-file-input':'Choose images'}
 for control,label in labels.items():
  if f'id="{control}"' in html and f'for="{control}"' not in html:
   html=re.sub(r'(<(?:input|textarea)\b[^>]*id="'+control+r'"[^>]*>)',lambda m:f'<label class="field-label" for="{control}">{label}</label>'+m[1],html)
 html=html.replace('<div class="dropzone" id="bg-dropzone">','<div class="dropzone" id="bg-dropzone" role="button" tabindex="0" aria-label="Choose an image to remove its background">')
 for name,label in [('pm','Choose PDF files to merge'),('ip','Choose images to convert to PDF')]:
  html=html.replace(f'<div class="dropzone" id="{name}-dropzone">',f'<div class="dropzone" id="{name}-dropzone" role="button" tabindex="0" aria-label="{label}">')
 if path.name=='privacy-policy.html':
  html=html.replace('Anvil Tools ("we", "us") provides free browser-based tools', 'Anvil Tools is operated by Velloxtech, a software house ("we", "us"), and provides free browser-based tools')
  html=html.replace('This site uses cookies for basic functionality and, once advertising is enabled, may use Google AdSense to display ads.', 'Advertising and automatic browser analytics are currently disabled. We use browser storage for privacy preferences, temporary-inbox access, and workspace sessions. If Google AdSense is enabled later, this policy and the consent controls must reflect the actual advertising configuration.')
  html=html.replace('Continued use of the site after changes are posted means you accept the updated policy.', 'The date above identifies the latest published revision. Where a change requires a new consent choice, continuing to browse does not replace that choice.')
 if path.name=='temp-mail.html':
  html=html.replace('Signing up for a newsletter, download, or free trial you only need once.', 'Testing receipt of a signup email for an application you own or have permission to test.')
  html=html.replace('Keeping your real inbox free of promotional mail from a one-time purchase or forum account.', 'Receiving a non-sensitive one-time message when the sender permits disposable addresses. Use a permanent address for purchases and accounts you may need to recover.')
 if path.name=='terms-of-service.html':
  html=html.replace('<h2>Using this site</h2>','<h2>Using this site</h2>\n<p>Anvil Tools is operated by Velloxtech, a software house. Contact us at <a href="mailto:info@velloxtech.com">info@velloxtech.com</a>.</p>',1) if 'Anvil Tools is operated by Velloxtech' not in html else html
 # Metadata describes visible content only; no ratings, fake authors, or FAQ rich-result claims.
 title=re.search(r'<title>(.*?)</title>',html,re.S)
 desc=re.search(r'<meta name="description" content="([^"]*)"',html)
 canonical=re.search(r'<link rel="canonical" href="([^"]*)"',html)
 if title and desc and canonical and 'property="og:title"' not in html:
  meta=f'<meta property="og:type" content="website"><meta property="og:title" content="{escape(strip(title[1]),quote=True)}"><meta property="og:description" content="{desc[1]}"><meta property="og:url" content="{canonical[1]}"><meta name="twitter:card" content="summary">'
  html=html.replace('</head>',meta+'\n</head>')
 if path.name=='article.html' and 'name="robots"' not in html:
  html=html.replace('</head>','<meta name="robots" content="noindex, follow">\n</head>')
 if path.name=='article.html':
  html=html.replace('About Anvil Tools and how our tools work.','Read a published article from Anvil Tools.').replace('Loading article?','Loading article&hellip;')
  html=html.replace('<a href="../about.html" aria-current="page">','<a href="../about.html">').replace('<a href="../blog/index.html">Blogs</a>','<a href="../blog/index.html" aria-current="page">Blogs</a>',1)
 path.write_text(html,encoding='utf-8')
print('Applied shared content surfaces, About design, 40 specific FAQs, labels, metadata, and ad-free defaults.')
import runpy
runpy.run_path(str(ROOT/'scripts/correct-review-findings.py'))
import subprocess
subprocess.run(['node', str(ROOT/'scripts/build-editorial.js')], check=True, cwd=ROOT)
subprocess.run(['node', str(ROOT/'scripts/build-sitemap.js')], check=True, cwd=ROOT)
