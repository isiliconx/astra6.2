"""Build the complete offline exhibition, including its 3D game.
Pure Python 3; no external dependencies: python studio/bundle.py observatory.html
"""
import base64,json,re,sys
from pathlib import Path
def build(read,names):
    def text(n):return read(n).decode('utf-8')
    def uri(n):
        fmt={'.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png'}[Path(n).suffix.lower()]
        return 'data:'+fmt+';base64,'+base64.b64encode(read(n)).decode()
    def code(s):
        return s.replace('</script','<\\/script')
    def embed(h,prefix):
        return re.sub(r'<script src="([\w./-]+)"></script>',lambda m:'<script>'+code(text(prefix+m[1]))+'</script>',h)
    game=text('sable/index.html')
    css=text('sable/game.css').replace("url('assets/vault.jpg')","url('"+uri('sable/assets/vault.jpg')+"')")
    game=game.replace('<link rel="stylesheet" href="game.css">','<style>'+css+'</style>')
    game=game.replace('href="../index.html"','href="https://isiliconx.github.io/astra6.2/"').replace('<script src="renderer.js">','<script>window.SABLE_SEAL='+json.dumps(uri('sable/assets/seal.png'))+';</script><script src="renderer.js">')
    game=embed(game,'sable/')
    assets={n:uri(n) for n in names if n.startswith('assets/') and Path(n).suffix in {'.jpg','.png','.webp'}}
    h=text('index.html').replace('<link rel="stylesheet" href="style.css">','<style>'+text('style.css')+'</style>')
    h=h.replace('src="assets/sable-cover.jpg"','src="'+assets.pop('assets/sable-cover.jpg')+'"')
    h=h.replace('window.ASTRA=[];', 'window.ASTRA=[];window.ASTRA_ASSETS='+json.dumps(assets,separators=(',',':'))+';window.SABLE_OFFLINE_HTML='+code(json.dumps(game))+';')
    return embed(h,'')
if __name__=='__main__':
    root=Path(__file__).resolve().parents[1]
    files=[p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()]
    target=Path(sys.argv[1]) if len(sys.argv)>1 else Path('astra-observatory.html')
    target.write_text(build(lambda n:(root/n).read_bytes(),files),encoding='utf-8')
    print(target,target.stat().st_size,'bytes')
