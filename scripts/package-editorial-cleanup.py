"""Package the cPanel changes without replacing ads.txt or private workspace files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
frontend = root / 'frontend'
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
