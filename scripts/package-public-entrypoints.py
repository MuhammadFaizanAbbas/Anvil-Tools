"""Package the cPanel fixes without replacing unrelated site files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
frontend = ROOT / 'frontend'
output = ROOT / 'deployment' / 'legacy-links-css-fix.zip'
files = [
    '.htaccess', '404.html', 'public-assets.php', 'static-page.php',
    'blog-render.php', 'journal.php',
    'assets/css/style.css', 'assets/css/refinements.css',
    'assets/css/design.css', 'assets/css/content.css',
]
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(frontend / name, name)
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert archive.namelist() == files
print(f'{output.name}: {len(files)} files, {output.stat().st_size:,} bytes')
