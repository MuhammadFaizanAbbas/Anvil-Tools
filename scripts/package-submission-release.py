"""Build an incremental cPanel update and reviewed publication bundle; excludes ads.txt."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'frontend'
OUT = ROOT / 'deployment/page-review-2026-10-05'
OUT.mkdir(parents=True, exist_ok=True)
ads_before = (SITE / 'ads.txt').read_bytes()

# Includes the previous reviewed PDF fixes and image examples so these files can
# be uploaded together. The large model, admin workspace, and ads.txt stay outside
# this incremental public-page update.
files = [path for path in SITE.rglob('*.html') if not {'assets', 'admin-panel'}.intersection(path.relative_to(SITE).parts)]
files.extend(SITE.glob('*.php'))
files.extend(SITE / name for name in ['.htaccess', 'robots.txt', 'sitemap.xml', 'sitemap-index.xml'])
files.extend(SITE / ('assets/css/' + name) for name in ['style.css', 'refinements.css', 'design.css', 'content.css', 'tool-ux.css'])
files.extend(SITE / ('assets/js/' + name) for name in ['main.js', 'recommendations.js', 'site-catalog.js', 'tool-directory.js', 'tool-examples.js', 'tools/word-counter.js', 'tools/temp-mail.js', 'tools/qr-code-generator.js', 'tools/pdf-merge.js', 'tools/image-to-pdf.js'])
files.extend((SITE / 'assets/images/editorial').glob('*.png'))
files.extend((SITE / 'assets/examples/pdf').glob('*.pdf'))
files = sorted(set(files))

def archive(name, entries):
    target = OUT / name
    manifest = []
    with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as output:
        for path, relative in entries:
            assert path.is_file(), relative
            assert Path(relative).name != 'ads.txt', 'Seller file must never be included'
            assert not any(part in {'.git', '.vercel', 'node_modules', 'admin-panel'} for part in Path(relative).parts)
            assert not Path(relative).name.startswith('.env'), 'No environment files in this release'
            output.write(path, relative)
            manifest.append({'path': relative, 'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    with ZipFile(target) as output:
        assert output.testzip() is None
        assert len(output.namelist()) == len(manifest)
    (OUT / (name + '.manifest.json')).write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'{target.relative_to(ROOT)}: {len(manifest)} files, {target.stat().st_size:,} bytes; ZIP integrity passed')

archive('frontend.zip', [(path, path.relative_to(SITE).as_posix()) for path in files])
article_entries = [(ROOT / 'content/editorial' / name, name) for name in ['background-removal.md', 'temporary-email.md', 'pdf-workflows.md']]
article_entries.extend([(ROOT / 'deployment/adsense-followup-2026-10-05/publish.sql', 'publish.sql'),
                        (ROOT / 'docs/PAGE_BY_PAGE_REVIEW_2026-10-05.md', 'README.md'),
                        (ROOT / 'docs/audits/adsense-followup-editorial.json', 'editorial-review.json')])
archive('article-release.zip', article_entries)
assert (SITE / 'ads.txt').read_bytes() == ads_before
print('ads.txt unchanged and absent from both archives.')
