"""Keep reviewed disclosures, tool instructions and inactive tracking UI consistent."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'frontend'

def remove_preferences(html):
 html = re.sub(r'<li>\s*<button[^>]*id="privacy-settings"[^>]*>.*?</button>\s*</li>', '', html, flags=re.S)
 start = re.search(r'<div\b[^>]*id="consent-banner"[^>]*>', html)
 if start:
  depth = 0
  for tag in re.finditer(r'</?div\b[^>]*>', html[start.start():]):
   depth += -1 if tag[0].startswith('</') else 1
   if depth == 0:
    html = html[:start.start()] + html[start.start()+tag.end():]
    break
  else: raise ValueError('Unclosed consent container')
 return re.sub(r'<script\b[^>]*src="[^"]*/(?:cmp|ads)\.js"[^>]*>\s*</script>', '', html)

actions = {
 'temp-mail': 'Use Copy address to copy the inbox address. Select a received message to read it; this tool does not provide a message download or reply button.',
 'background-remover': 'Compare the original and result previews, then download the transparent PNG. Keep your original image.',
 'pdf-merge': 'Use Merge and download, then open the PDF and check its page order. Keep the source documents.',
 'image-to-pdf': 'Use the conversion button to download the PDF, then open it and inspect every image page.',
 'qr-code-generator': 'Download the generated PNG and scan it with a phone to confirm the encoded destination or message.',
 'password-generator': 'Use Copy to save the generated password in your password manager. The tool has no saved password history.',
 'word-counter': 'Read the totals above as you edit. Select and copy your source text manually if needed; there is no report download.',
 'json-formatter': 'Use Copy to copy the formatted or minified JSON. Keep the original if duplicate keys or large numeric identifiers matter.',
 'base64-tool': 'Use Copy to copy the output, and test the reverse operation to check that your text is preserved.',
 'user-agent-generator': 'Copy the selected sample string into your authorized test environment. It does not change this browser or prove a crawler identity.',
 'color-palette-generator': 'Copy individual swatch values or use Copy CSS variables. Check contrast for the exact text and background pair you intend to use.',
 'unit-converter': 'Read the converted value and its units above. Select and copy the result manually; this tool has no download button.',
 'url-encoder-decoder': 'Use Copy to copy the result after checking the selected URI or component mode.',
 'jwt-decoder': 'Inspect the header, payload and date notes. Use Clear when finished; decoding does not verify the signature.',
 'unix-timestamp-converter': 'Read the UTC, local, seconds and milliseconds values above. Select and copy the required value manually.',
 'hash-generator': 'Use Copy hexadecimal to copy the hexadecimal digest, or select the Base64 digest manually. Compare the exact input bytes when checking a known hash.',
 'csv-to-json': 'Copy the JSON or download converted-data.json. Check headers, row counts and string values against the source CSV.',
 'text-case-converter': 'Use Copy to copy the converted text. Review acronyms, names and punctuation before replacing the original.',
 'text-diff-checker': 'Read the added and removed lines and their line numbers. This tool displays a comparison and has no export button.',
 'uuid-generator': 'Copy the generated UUIDs or download the text file. Enforce uniqueness in your application when storing identifiers.'
}

for path in SITE.rglob('*.html'):
 if 'admin-panel' in path.parts or 'assets' in path.parts: continue
 html = remove_preferences(path.read_text(encoding='utf-8'))
 if path.parent.name == 'tools' and path.stem in actions:
  html = html.replace('Use Copy hex to copy', 'Use Copy hexadecimal to copy')
  html = html.replace('Copy or download the result using the controls above. Keep your original input until you have checked the output in its destination.', actions[path.stem])
  html = html.replace('<p>Start with a small example to confirm the settings, then repeat with your full input. If you change an option, run the tool again and review the new output before replacing an earlier result.</p>', '')
  html = html.replace('Read the status message near the controls. Check your input and try a smaller example. If you need to reload, save your source first because unsaved inputs may be lost. Contact us with the tool name, browser, and steps to reproduce the issue; use sample data instead of private content.', 'Check any feedback near the controls and confirm that JavaScript is enabled. If the problem continues, contact us with the tool name, browser and steps to reproduce it. Use sample data rather than private content.')
 if path.stem == 'temp-mail':
  html = html.replace('The address is random and not tied to your identity, but treat it as public: anyone who guesses or is given the address can read what lands in it.', 'No public account is required, but this is not an anonymous or private mailbox. The service processes connection information, and anyone with access to the inbox credentials may read its messages.')
  html = html.replace("Generating a new address abandons the old inbox permanently — there is no way to recover it later, so don't use this for anything you need long-term access to.", 'Generating a new address switches this page to a different inbox and requests invalidation of the previous access. It does not guarantee deletion of provider-held messages. Do not rely on temporary mail for lasting access.')
  html = html.replace('Most sites accept it, but some services specifically block known disposable-email domains. If a form rejects the address, that site is one of them.', 'Some services block disposable addresses or require a permanent email address. Acceptance and delivery are not guaranteed. Follow the receiving service\'s rules.')
  html = html.replace('anything sent to it shows up here automatically', 'received messages are checked automatically')
 if path.stem == 'privacy-policy':
  html = html.replace('closing the tab clears your browser access.', 'closing the tab normally ends that tab\'s access, although browser session-restore features may restore it until the inbox expires.')
  html = html.replace('We use browser storage for privacy preferences, temporary-inbox access, and workspace sessions.', 'We use browser session storage for temporary-inbox access and workspace sessions. Earlier versions may have left an anvil_consent_v1 preference in local storage; it does not enable tracking and can be removed by clearing site data.')
  html = html.replace('You can control cookies through your browser settings, and where required by law, we display a consent notice before non-essential cookies are set.', 'You can clear site data through your browser settings. Optional advertising and analytics are not enabled. If they are introduced, we will update this policy and implement the applicable consent controls before using them.')
  html = html.replace('Use Privacy settings in the footer to review optional preferences.', 'There are currently no optional advertising or analytics settings to manage.')
  html = html.replace('Preference storage lets the site remember your choice on subsequent visits.', 'The earlier optional preference interface has been removed while these services are disabled.')
  html = html.replace('Saving an analytics preference does not itself enable tracking in this version.', 'Any preference saved by an earlier version does not enable tracking.')
  html = html.replace('Does rejecting optional analytics disable the tools?', 'Do the tools require advertising or analytics?').replace('Optional analytics preferences are separate from the tool functions and necessary workspace sessions.', 'No. The tools work without optional advertising or analytics. Necessary session storage supports workspace access and the temporary inbox.')
 if path.stem == 'cookie-policy':
  a = html.index('<section class="legal-content">'); b = html.index('</main>', a)
  html = html[:a] + '''<section class="legal-content">
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
<h2>Contact</h2><p>Contact Velloxtech at <a href="mailto:info@velloxtech.com">info@velloxtech.com</a> with questions.</p>
</section>''' + html[b:]
 path.write_text(re.sub(r'^[ \t]+$', '', html, flags=re.M), encoding='utf-8')

# Shared article chrome only: leave every post body and publishing record alone.
for relative in ['backend/src/lib/articles.js', 'deployment/backend-repo/backend/src/lib/articles.js', 'scripts/site-generator/build_site.py']:
 path = ROOT / relative
 if path.exists(): path.write_text(re.sub(r'^[ \t]+$', '', remove_preferences(path.read_text(encoding='utf-8')), flags=re.M), encoding='utf-8')

# Give every currently unguarded clipboard action a usable failure message.
for path in (SITE/'assets/js/tools').glob('*.js'):
 if path.stem not in ['base64-tool','json-formatter','user-agent-generator','url-encoder-decoder','hash-generator','text-case-converter','csv-to-json','uuid-generator']: continue
 html = path.read_text(encoding='utf-8')
 html = re.sub(r'(?<!try \{ )await navigator\.clipboard\.writeText\(([^;]+)\);', r"try { await navigator.clipboard.writeText(\1); } catch (_) { status.textContent = 'Copy failed. Select and copy the result manually.'; return; }", html)
 path.write_text(html, encoding='utf-8')
print('Corrected public instructions, disclosures, unused consent UI, and clipboard feedback.')
