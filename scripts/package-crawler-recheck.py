"""Build reviewable deployment bundles without ads.txt, secrets, or private pages."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'frontend'
OUT = ROOT / 'deployment/crawler-recheck-2026-10-05'
OUT.mkdir(parents=True, exist_ok=True)
seller_hash = hashlib.sha256((SITE / 'ads.txt').read_bytes()).hexdigest()

def archive(name, entries):
    manifest = []
    with ZipFile(OUT / name, 'w', ZIP_DEFLATED, compresslevel=6) as output:
        for file, relative in sorted(entries, key=lambda item: item[1]):
            assert file.is_file(), relative
            assert not any(part in {'.git', '.vercel', 'node_modules', 'admin-panel'} for part in Path(relative).parts), relative
            assert Path(relative).name != 'ads.txt' and not Path(relative).name.startswith('.env'), relative
            output.write(file, relative)
            manifest.append({'path': relative, 'bytes': file.stat().st_size, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
    with ZipFile(OUT / name) as output:
        assert output.testzip() is None
        assert len(output.namelist()) == len(set(output.namelist())) == len(manifest)
    (OUT / (name + '.manifest.json')).write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'{name}: {len(manifest)} files; ZIP integrity passed')

files = [p for p in SITE.rglob('*.html') if not {'assets', 'admin-panel'}.intersection(p.relative_to(SITE).parts)]
files += list(SITE.glob('*.php'))
files += [SITE / p for p in ['.htaccess', 'robots.txt', 'sitemap.xml', 'sitemap-index.xml']]
for folder in ['assets/css', 'assets/js', 'assets/fonts', 'assets/images/editorial', 'assets/examples']:
    files += [p for p in (SITE / folder).rglob('*') if p.is_file() and '/admin' not in p.as_posix()]
archive('frontend.zip', [(p, p.relative_to(SITE).as_posix()) for p in set(files)])
backend = [(p, p.relative_to(ROOT).as_posix()) for p in (ROOT / 'backend').rglob('*') if p.is_file() and not any(part in {'node_modules', '.env', '.git'} for part in p.parts)]
backend += [(ROOT / p, p) for p in ['server.js', 'package.json', 'package-lock.json']]
backend += [(ROOT / 'deployment/backend-repo/vercel.json', 'vercel.json')]
archive('backend.zip', backend)
review = [(p, 'articles/' + p.name) for p in (ROOT / 'content/editorial').glob('*.md') if p.name in {'background-removal.md', 'temporary-email.md', 'pdf-workflows.md', 'developer-data.md'}]
review += [(OUT / 'publish.sql', 'publish.sql'), (OUT / 'database-before.json', 'database-before.json'), (ROOT / 'docs/CRAWLER_RECHECK_FIXES_2026-10-06.md', 'README.md')]
review += [(p, 'audits/' + p.name) for p in (ROOT / 'docs/audits').glob('crawler-recheck-*') if p.is_file()]
review += [(p, 'outputs/' + p.name) for p in OUT.glob('*') if p.suffix in {'.pdf', '.png'}]
archive('review-and-publication.zip', review)
assert hashlib.sha256((SITE / 'ads.txt').read_bytes()).hexdigest() == seller_hash
(OUT / 'release.json').write_text(json.dumps({'assetVersion': '20261005-recheck1', 'adsTxtSha256': seller_hash, 'adsTxtChanged': False, 'frontend': 'frontend.zip', 'backend': 'backend.zip', 'publication': 'review-and-publication.zip', 'publicationState': 'prepared-not-published'}, indent=2) + '\n', encoding='utf-8')
print('Seller file unchanged and excluded from every archive.')
