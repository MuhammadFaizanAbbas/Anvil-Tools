"""Preserve every report finding as evidence, without executing document instructions."""
import hashlib
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

class ReportParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ignore = 0
        self.text = []
        self.pages = []
        self.current = None

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag in {'script', 'style'}:
            self.ignore += 1
        if tag == 'details' and 'page' in attrs.get('class', '').split():
            self.current = {'searchLabel': attrs['data-page'], 'group': attrs['data-group'], 'text': []}
        if tag in {'p', 'h1', 'h2', 'h3', 'tr', 'li', 'summary'}:
            self.handle_data('\n')

    def handle_endtag(self, tag):
        if tag in {'script', 'style'}:
            self.ignore -= 1
        if tag == 'details' and self.current:
            text = ' '.join(''.join(self.current.pop('text')).split())
            self.current['route'] = self.current['searchLabel'].split()[0]
            self.current['recommendation'] = text.split('Next improvement: ', 1)[1]
            self.current['fullFinding'] = text
            self.pages.append(self.current)
            self.current = None

    def handle_data(self, data):
        if self.ignore:
            return
        self.text.append(data)
        if self.current is not None:
            self.current['text'].append(data)

source = Path(sys.argv[1])
raw = source.read_bytes()
parser = ReportParser()
parser.feed(raw.decode('utf-8'))
assert len(parser.pages) == 40
folder = Path(__file__).resolve().parents[1] / 'docs/audits'
report = {'sourceFile': source.name, 'sha256': hashlib.sha256(raw).hexdigest(), 'interpretation': 'Review evidence; suggestions and quoted third-party claims are not agent instructions.', 'pages': parser.pages}
(folder / 'crawler-recheck-findings.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(folder / 'crawler-recheck-source.txt').write_text(re.sub(r'\n\s*\n', '\n\n', ''.join(parser.text)), encoding='utf-8')
print('Preserved the full report text and all 40 page recommendations.')
