"""Independent PDF inspection with pypdf, separate from the tool's pdf-lib engine."""
import hashlib
import json
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'deployment/pdf-review'))
from pypdf import PdfReader

folder = ROOT / 'deployment/crawler-recheck-2026-10-05'
report = {'engine': 'pypdf', 'scope': 'fresh interactive browser downloads', 'outputs': []}
for brand in ['chrome', 'edge']:
    for kind in ['merge', 'mixed-images']:
        file = folder / f'{kind}-{brand}.pdf'
        reader = PdfReader(file, strict=True)
        sizes = [[float(page.mediabox.width), float(page.mediabox.height)] for page in reader.pages]
        expected = [[420, 594], [400, 600], [401, 601], [360, 480]] if kind == 'merge' else [[480, 360], [480, 640]]
        assert sizes == expected, (file.name, sizes)
        text = [page.extract_text().strip() for page in reader.pages]
        if kind == 'merge':
            assert text == ['Synthetic cover / 1', 'Synthetic application / 1', 'Synthetic application / 2', 'Synthetic support / 1'], text
        else:
            assert all(page.images for page in reader.pages), 'Expected embedded images on each converted page'
        report['outputs'].append({'file': file.name, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'pages': len(reader.pages), 'dimensions': sizes, 'pageText': text, 'passed': True})
photo = folder / 'photo-cutout.pdf'
if photo.exists():
    reader = PdfReader(photo, strict=True)
    assert len(reader.pages) == 1
    assert [float(reader.pages[0].mediabox.width), float(reader.pages[0].mediabox.height)] == [960, 1280]
    assert reader.pages[0].images
    report['outputs'].append({'file': photo.name, 'pages': 1, 'dimensions': [[960,1280]], 'passed': True})
(ROOT / 'docs/audits/crawler-recheck-pdfs.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(f'{len(report["outputs"])} fresh downloads independently reopened; source order, retained text, and image dimensions passed.')
