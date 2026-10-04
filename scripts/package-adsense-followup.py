"""Package the reviewed audit changes without account settings or database backups."""
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
output = root / 'deployment/adsense-followup-2026-10-05'
output.mkdir(parents=True, exist_ok=True)
frontend = root / 'frontend'
public_files = [
    'tools/pdf-merge.html', 'tools/image-to-pdf.html',
    'assets/js/tools/pdf-merge.js', 'assets/js/tools/image-to-pdf.js',
    'assets/css/tool-ux.css',
    'assets/images/editorial/background-removal-input.png',
    'assets/images/editorial/background-removal-output.png',
    'assets/images/editorial/background-removal-example.png',
    'assets/images/editorial/temporary-email-example.png',
    'assets/images/editorial/pdf-ordering-example.png',
]

def write_archive(name, entries):
    target = output / name
    with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
        for source, destination in entries:
            archive.write(source, destination)
        if name == 'backend.zip':
            archive.writestr('vercel.json', json.dumps({
                '$schema': 'https://openapi.vercel.sh/vercel.json', 'framework': 'express'
            }, indent=2) + '\n')
    with ZipFile(target) as archive:
        assert archive.testzip() is None
        assert not any(Path(file).name.startswith('.env') and Path(file).name != '.env.example'
                       for file in archive.namelist())
        assert not any('database-before' in file or 'sources-before' in file for file in archive.namelist())
        if name == 'frontend.zip':
            assert 'ads.txt' not in archive.namelist()
            assert len(archive.namelist()) == len(public_files)
    print(f'{target.relative_to(root)}: {target.stat().st_size:,} bytes; ZIP integrity passed')

write_archive('frontend.zip', [(frontend / name, name) for name in public_files])
backend_files = [(root / name, name) for name in ['server.js', 'package.json', 'package-lock.json', '.vercelignore', '.env.example']]
backend_files.extend((file, file.relative_to(root).as_posix()) for file in sorted((root / 'backend').rglob('*'))
                     if file.is_file() and not {'node_modules', '__pycache__', '.vercel'}.intersection(file.parts)
                     and not file.name.startswith('.env'))
write_archive('backend.zip', backend_files)
release_files = [(output / 'publish.sql', 'publish.sql'),
                 (root / 'docs/ADSENSE_AUDIT_FOLLOWUP.md', 'README.md'),
                 (root / 'docs/audits/adsense-followup-editorial.json', 'editorial-review.json')]
release_files.extend((root / 'content/editorial' / name, name)
                     for name in ['background-removal.md', 'temporary-email.md', 'pdf-workflows.md'])
write_archive('article-release.zip', release_files)
