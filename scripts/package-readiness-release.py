"""Package the complete public update, keeping seller records and installed models."""
import hashlib
import json
import shutil
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'frontend'
OUT = ROOT / 'deployment/readiness-2026-10-06'
OUT.mkdir(parents=True, exist_ok=True)
seller_hash = hashlib.sha256((SITE / 'ads.txt').read_bytes()).hexdigest()

# Preserve the actual recorded downloads while giving both browsers public URLs.
results_path = SITE / 'assets/examples/experiments/results.json'
results = json.loads(results_path.read_text(encoding='utf-8'))
for run in results['runs']:
    for pdf in run['pdf']:
        filename = f'format-{"edge-" if run["browser"] == "Edge" else ""}{pdf["format"]}.pdf'
        destination = SITE / 'assets/examples/experiments' / filename
        source = ROOT / pdf['outputFile']
        assert source.is_file() and hashlib.sha256(source.read_bytes()).hexdigest() == pdf['sha256']
        if source != destination:
            shutil.copyfile(source, destination)
        pdf['outputFile'] = destination.relative_to(ROOT).as_posix()
        pdf['download'] = '/' + destination.relative_to(SITE).as_posix()
for target in [results_path, ROOT / 'docs/audits/readiness-experiments.json']:
    target.write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def archive(name, entries):
    manifest = []
    with ZipFile(OUT / name, 'w', ZIP_DEFLATED, compresslevel=6) as output:
        for file, relative in sorted(entries, key=lambda item: item[1]):
            assert file.is_file(), relative
            assert not any(part in {'.git', '.vercel', 'node_modules'} for part in Path(relative).parts)
            assert Path(relative).name != 'ads.txt' and not Path(relative).name.startswith('.env')
            output.write(file, relative)
            manifest.append({'path': relative, 'bytes': file.stat().st_size, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
    with ZipFile(OUT / name) as output:
        assert output.testzip() is None
        assert len(output.namelist()) == len(set(output.namelist())) == len(manifest)
    (OUT / (name + '.manifest.json')).write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'{name}: {len(manifest)} files; ZIP integrity passed')

public = [file for file in SITE.rglob('*') if file.is_file() and 'assets' not in file.relative_to(SITE).parts and file.suffix in {'.html', '.php', '.xml'}]
public += [SITE / '.htaccess', SITE / 'robots.txt']
for folder in ['assets/css', 'assets/js', 'assets/fonts', 'assets/images', 'assets/examples', 'assets/vendor/tool-libraries']:
    public += [file for file in (SITE / folder).rglob('*') if file.is_file()]
archive('frontend.zip', [(file, file.relative_to(SITE).as_posix()) for file in set(public)])
backend = [(file, file.relative_to(ROOT).as_posix()) for file in (ROOT / 'backend').rglob('*') if file.is_file() and not {'node_modules', '.git'}.intersection(file.parts) and not file.name.startswith('.env')]
backend += [(ROOT / name, name) for name in ['server.js', 'package.json', 'package-lock.json']]
config = OUT / 'backend-vercel.json'
config.write_text(json.dumps({'$schema':'https://openapi.vercel.sh/vercel.json', 'framework':'express'}, indent=2) + '\n', encoding='utf-8')
backend += [(config, 'vercel.json')]
archive('backend.zip', backend)
review = [(file, file.relative_to(ROOT).as_posix()) for file in (ROOT / 'content/editorial/experiments').glob('*.md')]
review += [(ROOT / 'content/editorial/experiments.json', 'content/editorial/experiments.json'), (ROOT / 'docs/ADSENSE_READINESS_COMPLETION_2026-10-06.md', 'README.md')]
review += [(file, 'audits/' + file.name) for file in (ROOT / 'docs/audits').glob('readiness-*') if file.is_file()]
review += [(file, 'audits/' + file.name) for file in (ROOT / 'docs/audits').glob('full-audit-*') if file.is_file()]
review += [(ROOT / 'docs/FULL_SITE_AUDIT_2026-10-06.md', 'FULL_SITE_AUDIT.md')]
archive('review.zip', review)
shutil.copyfile(OUT / 'frontend.zip', ROOT / 'frontend.zip')
assert hashlib.sha256((SITE / 'ads.txt').read_bytes()).hexdigest() == seller_hash
manifest = {'state':'prepared-cpanel-upload', 'adsTxtChanged':False, 'adsTxtSha256':seller_hash, 'newArticles':4, 'databaseChanges':'Incremental privacy migration applied and verified; no article-body publication needed', 'frontend':'frontend.zip', 'backend':'backend.zip', 'review':'review.zip', 'installedModelFiles':'preserve existing assets/vendor/background-removal files', 'adminFilesIncluded':True}
(OUT / 'release.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print('Updated root frontend.zip; ads.txt unchanged and excluded. No database publication is required for the new static experiments.')
