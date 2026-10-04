"""Package the cPanel changes and backend, with an optional full frontend bundle."""
import argparse
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--full-frontend', action='store_true',
                    help='Also refresh frontend.zip with its existing frontend/ folder layout.')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
frontend = root / 'frontend'
deployment = root / 'deployment'
deployment.mkdir(exist_ok=True)
files = {file.relative_to(frontend).as_posix() for file in frontend.rglob('*.html')
         if not {'admin-panel', 'assets'}.intersection(file.relative_to(frontend).parts)}
files.update(file.name for file in frontend.glob('*.php'))
files.update({'.htaccess', 'vercel.json', 'sitemap.xml', 'sitemap-index.xml', 'robots.txt',
              'assets/js/published-posts.js', 'public-assets.php', 'assets/css/style.css', 'assets/css/refinements.css',
              'assets/css/design.css', 'assets/css/content.css', 'backend-proxy.php',
              'site-origin.php', 'blog-index.php', 'site-metadata.php', 'journal-sitemap.php',
              'journal-image.php'})
files.discard('ads.txt')
output = root / 'deployment/editorial-cleanup-frontend.zip'
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in sorted(files):
        archive.write(frontend / name, name)
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert 'ads.txt' not in archive.namelist()
    assert '.htaccess' in archive.namelist()
    assert not any(name.startswith('admin-panel/') for name in archive.namelist())
print(f'{output.name}: {len(files)} files, {output.stat().st_size:,} bytes')

def allowed(path):
    return (path.is_file() and not path.name.startswith('.env')
            and not {'.git', '.vercel', 'node_modules', '__pycache__'}.intersection(path.parts))

backend_files = ['server.js', 'package.json', 'package-lock.json', '.vercelignore', '.env.example']
backend_files.extend(path.relative_to(root).as_posix()
                     for path in sorted((root / 'backend').rglob('*')) if allowed(path))
output = deployment / 'editorial-cleanup-backend.zip'
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in backend_files:
        archive.write(root / name, name)
    archive.writestr('vercel.json', json.dumps({
        '$schema': 'https://openapi.vercel.sh/vercel.json', 'framework': 'express'
    }, indent=2) + '\n')
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert 'backend/src/lib/pagination.js' in archive.namelist()
    assert 'backend/src/lib/article-redirects.json' in archive.namelist()
    assert 'backend/src/templates/blog.html' in archive.namelist()
    assert not any(Path(name).name.startswith('.env') and Path(name).name != '.env.example'
                   for name in archive.namelist())
print(f'{output.name}: {len(backend_files) + 1} files, {output.stat().st_size:,} bytes')

if args.full_frontend:
    output = root / 'frontend.zip'
    frontend_files = [path for path in sorted(frontend.rglob('*')) if allowed(path)]
    with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
        for path in frontend_files:
            archive.write(path, path.relative_to(root).as_posix())
    with ZipFile(output) as archive:
        assert archive.testzip() is None
        assert all(name.startswith('frontend/') for name in archive.namelist())
        assert 'frontend/.htaccess' in archive.namelist()
    print(f'{output.name}: {len(frontend_files)} files, {output.stat().st_size:,} bytes')
