"""Package public frontend and Express backend without private configuration."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'deployment'
OUTPUT.mkdir(exist_ok=True)

def allowed(path):
    return path.is_file() and not any(part in {'.git', '.vercel', 'node_modules', '__pycache__'} for part in path.parts) and not path.name.startswith('.env')

frontend = ROOT / 'frontend'
with ZipFile(OUTPUT / 'adsense-fixes-frontend.zip', 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for path in sorted(frontend.rglob('*')):
        if allowed(path):
            archive.write(path, path.relative_to(frontend).as_posix())

with ZipFile(OUTPUT / 'adsense-fixes-backend.zip', 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for name in ['server.js', 'package.json', 'package-lock.json', '.vercelignore', '.env.example']:
        archive.write(ROOT / name, name)
    for path in sorted((ROOT / 'backend').rglob('*')):
        if allowed(path):
            archive.write(path, path.relative_to(ROOT).as_posix())
    archive.writestr('vercel.json', json.dumps({
        '$schema': 'https://openapi.vercel.sh/vercel.json',
        'framework': 'express'
    }, indent=2) + '\n')

for name in ['adsense-fixes-frontend.zip', 'adsense-fixes-backend.zip']:
    with ZipFile(OUTPUT / name) as archive:
        names = archive.namelist()
        assert not any(name.startswith('frontend/') or '/node_modules/' in name for name in names)
        assert not any(Path(name).name.startswith('.env') and Path(name).name != '.env.example' for name in names)
        if 'frontend' in name:
            assert '.htaccess' in names and 'blog-index.php' in names
            assert 'blog/merge-pdfs-locally.html' in names
        else:
            assert 'backend/src/templates/blog.html' in names
            assert 'server.js' in names
        print(f'{name}: {len(names)} files, {(OUTPUT / name).stat().st_size:,} bytes')
