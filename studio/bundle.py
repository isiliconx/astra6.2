"""Build a single-file offline exhibition. Pure Python 3; no external dependencies.
    python studio/bundle.py /path/to/astra-observatory.html
"""
import base64
import json
import re
import sys
from pathlib import Path

def build(read, names):
    def string(n):
        return read(n).decode('utf-8')
    assets = {}
    types = {'.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'}
    for name in sorted(names):
        extension = Path(name).suffix.lower()
        if name.startswith('assets/') and extension in types:
            assets[name] = 'data:'+types[extension]+';base64,'+base64.b64encode(read(name)).decode('ascii')
    html = string('index.html')
    html = html.replace('<link rel="stylesheet" href="style.css">','<style>'+string('style.css')+'</style>')
    html = html.replace('src="assets/corona.jpg"','src="'+assets.pop('assets/corona.jpg')+'"')
    html = html.replace('window.ASTRA=[];', 'window.ASTRA=[];window.ASTRA_ASSETS='+json.dumps(assets,separators=(',',':'))+';')
    def inline(m):
        return '<script>'+string(m[1]).replace('</script','<\\/script')+'</script>'
    return re.sub(r'<script src="([\w./-]+)"></script>',inline,html)

if __name__=='__main__':
    root=Path(__file__).resolve().parents[1]
    files=[p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()]
    out=Path(sys.argv[1]) if len(sys.argv)>1 else Path('astra-observatory.html')
    out.write_text(build(lambda n:(root/n).read_bytes(),files),encoding='utf-8')
    print(out, out.stat().st_size, 'bytes')
