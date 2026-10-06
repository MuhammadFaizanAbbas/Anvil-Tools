"""Package verified local fixes; deployment and publication are separate actions."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'deployment/adsense-audit-2026-10-07'
OUT.mkdir(parents=True, exist_ok=True)
FRONTEND = ROOT / 'frontend'
ads_before = (FRONTEND / 'ads.txt').read_bytes()

def allowed(path):
    return path.is_file() and not any(part in {'.git', '.vercel', 'node_modules', '__pycache__'} for part in path.parts) and not path.name.startswith('.env')

def archive(name, files, extra=None):
    manifest = []
    target = OUT / name
    with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as output:
        for path, relative in files:
            assert allowed(path), relative
            output.write(path, relative)
            manifest.append({'path': relative, 'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
        for relative, data in (extra or {}).items():
            output.writestr(relative, data)
            manifest.append({'path': relative, 'bytes': len(data.encode()), 'sha256': hashlib.sha256(data.encode()).hexdigest()})
    with ZipFile(target) as output:
        assert output.testzip() is None
        assert len(output.namelist()) == len(manifest)
    (OUT / (name + '.manifest.json')).write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'{target.relative_to(ROOT)}: {len(manifest)} files; ZIP integrity passed')

frontend_files = [(path, path.relative_to(FRONTEND).as_posix()) for path in sorted(FRONTEND.rglob('*')) if allowed(path) and path.name != 'ads.txt']
archive('frontend.zip', frontend_files)
backend_files = [(path, path.relative_to(ROOT).as_posix()) for path in sorted((ROOT / 'backend').rglob('*')) if allowed(path)]
backend_files.extend((ROOT / name, name) for name in ['server.js', 'package.json', 'package-lock.json'])
archive('backend.zip', backend_files, {'vercel.json': json.dumps({'$schema': 'https://openapi.vercel.sh/vercel.json', 'framework': 'express'}, indent=2) + '\n'})
with ZipFile(OUT / 'frontend.zip') as output:
    assert '.htaccess' in output.namelist() and 'ads.txt' not in output.namelist()
assert (FRONTEND / 'ads.txt').read_bytes() == ads_before
shutil.copyfile(OUT / 'frontend.zip', ROOT / 'frontend.zip')
print('Refreshed root frontend.zip; existing seller declaration preserved and excluded from upload archive.')
