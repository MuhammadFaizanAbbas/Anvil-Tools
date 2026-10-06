"""Reopen recorded PDFs using a parser independent of the tool's pdf-lib engine."""
import hashlib
import json
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'deployment/pdf-review'))
from pypdf import PdfReader
import pypdf

report = {'engine': 'pypdf', 'version': pypdf.__version__, 'outputs': []}
recorded = json.loads((ROOT / 'frontend/assets/examples/experiments/results.json').read_text(encoding='utf-8'))
for run in recorded['runs']:
    for result in run['pdf']:
        file = ROOT / result['outputFile']
        reader = PdfReader(file, strict=True)
        assert len(reader.pages) == 1
        page = reader.pages[0]
        size = [float(page.mediabox.width), float(page.mediabox.height)]
        assert size == [640, 400], size
        text = page.extract_text().strip()
        assert text == '', 'Image conversion unexpectedly supplies a text layer'
        objects = [obj.get_object() for obj in page['/Resources']['/XObject'].values()]
        images = [obj for obj in objects if obj.get('/Subtype') == '/Image']
        assert len(images) == 1
        image = images[0]
        assert [image['/Width'], image['/Height']] == [640, 400]
        alpha = '/SMask' in image
        assert alpha == (result['format'] != 'jpg'), (file.name, alpha)
        assert hashlib.sha256(file.read_bytes()).hexdigest() == result['sha256']
        report['outputs'].append({'browser': run['browser'], 'format': result['format'], 'file': file.name, 'pages': 1, 'dimensionsPoints': size, 'embeddedImageDimensions': [640,400], 'softMask': alpha, 'selectableText': text, 'passed': True})
for target in ['frontend/assets/examples/experiments/pdf-inspection.json', 'docs/audits/readiness-pdfs.json']:
    (ROOT / target).write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(f'{len(report["outputs"])} PDF downloads reopened; dimensions, image presence, alpha masks, and absent text layers verified.')
