"""Compare prepared tool content with the previous Git release; read-only."""
import hashlib
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = json.loads((ROOT / 'scripts/site-generator/tool-examples.json').read_text(encoding='utf-8'))
BASE = next((arg.split('=', 1)[1] for arg in sys.argv[1:] if arg.startswith('--base=')), 'da0f9ad3cd140bba5840469eeaf807de0a43bbe3')

def text(value):
    return ' '.join(unescape(re.sub(r'<[^>]+>', ' ', value)).split())

def stats(html):
    main = re.search(r'<main\b[^>]*>(.*?)</main>', html, re.S)[1]
    paragraphs = [text(p).casefold() for p in re.findall(r'<p\b[^>]*>(.*?)</p>', main, re.S)]
    paragraphs = [p for p in paragraphs if len(p.split()) >= 12]
    seen, duplicates = set(), []
    for paragraph in paragraphs:
        if paragraph in seen: duplicates.append(paragraph)
        seen.add(paragraph)
    return {'readableMainWords': len(text(main).split()), 'mainHeadings': len(re.findall(r'<h[1-6]\b', main)),
            'faqQuestions': len(re.findall(r'<summary\b', main)), 'repeatedMainParagraphs': duplicates}

report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'comparison': BASE,
          'scope': 'Exact normalized paragraphs of at least 12 words within each tool main element; not an internet originality check.', 'tools': []}
for slug in EXAMPLES:
    relative = 'frontend/tools/' + slug + '.html'
    previous = subprocess.check_output(['git', '-c', 'safe.directory=' + ROOT.as_posix(), 'show', BASE + ':' + relative], cwd=ROOT).decode('utf-8')
    current = (ROOT / relative).read_text(encoding='utf-8')
    report['tools'].append({'slug': slug, 'before': stats(previous), 'after': stats(current),
                            'checkedExample': '<!-- checked-example -->' in current})
report['adsTxtSha256'] = hashlib.sha256((ROOT / 'frontend/ads.txt').read_bytes()).hexdigest()
assert report['adsTxtSha256'] == '005e774214410091a356e270d2a86b112ccdedfc544c7b3ab9a69fec82204089'
assert all(not tool['after']['repeatedMainParagraphs'] and tool['checkedExample'] for tool in report['tools'])
(ROOT / 'docs/audits/submission-content.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'tools': len(report['tools']), 'beforeRepeatedParagraphs': sum(len(tool['before']['repeatedMainParagraphs']) for tool in report['tools']),
                  'afterRepeatedParagraphs': sum(len(tool['after']['repeatedMainParagraphs']) for tool in report['tools']), 'adsTxtUnchanged': True}))
