"""Package only distributable project files; omit caches, binaries and the archive itself."""
from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
dst=root/'SableRelay-UE5-Source.zip'
entries=[root/f for f in ('SableRelay.uproject','README.md','VALIDATION.md')]
for folder in ('Config','Content','Source','Tests','Tools'):
    entries.extend(p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
with zipfile.ZipFile(dst,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for f in sorted(entries):
        z.write(f,Path('SableRelay')/f.relative_to(root))
    pinned=root/'Tests/WebReference/game.js'
    if not pinned.exists(): z.write(root.parent/'game.js','SableRelay/Tests/WebReference/game.js')
print(dst.name,dst.stat().st_size,'bytes')
