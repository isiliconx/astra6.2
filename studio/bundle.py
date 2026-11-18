"""Build the complete offline exhibition, including all standalone works, the printable pop-up and the generative orchestra.
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
    concert=text('orchestra/index.html').replace('<link rel="stylesheet" href="style.css">','<style>'+text('orchestra/style.css')+'</style>')
    concert=embed(concert.replace('href="../index.html"','href="https://isiliconx.github.io/astra6.2/"'),'orchestra/')
    # New standalone works are HTML documents; use blob links, not top-level data navigation.
    def standalone(folder, page='index.html'):
        h=text(folder+'/'+page).replace('href="../index.html"','href="https://isiliconx.github.io/astra6.2/"')
        href='<link rel="stylesheet" href="style.css">'
        if href in h: h=h.replace(href,'<style>'+text(folder+'/style.css')+'</style>')
        # Inline deferred head scripts at the bottom, preserving source order and real DOM readiness.
        deferred=re.findall(r'<script defer src="([\w./-]+)"></script>',h)
        h=re.sub(r'<script defer src="[\w./-]+"></script>','',h)
        if deferred:h=h.replace('</body>',''.join('<script src="'+n+'"></script>' for n in deferred)+'</body>')
        return embed(h,folder+'/')
    standalone_ids={'the-city-that-fits-in-a-book':'paper-city','the-kiln-that-sings':'kiln','the-impossible-alphabet':'alphabet','the-night-we-found-a-planet':'planet','the-wrong-camera':'wrong-camera'}
    extra={i:standalone(d) for i,d in standalone_ids.items()}
    pattern=standalone('paper-city','pattern.html').replace('href="index.html"','href="https://isiliconx.github.io/astra6.2/paper-city/"')
    pattern=pattern.replace('href="field-pattern.pdf" download','href="data:application/pdf;base64,'+base64.b64encode(read('paper-city/field-pattern.pdf')).decode()+'" download="field-pattern.pdf"')
    # Base64 here deliberately avoids nested script terminators in the pattern-within-market-within-gallery.
    pp=base64.b64encode(pattern.encode('utf-8')).decode('ascii')
    art="""<script>document.querySelector('a[href=\"pattern.html\"]').href=URL.createObjectURL(new Blob([Uint8Array.from(atob(\""""+pp+"""\"),c=>c.charCodeAt(0))],{type:'text/html'}));</script>"""
    extra['the-city-that-fits-in-a-book']=extra['the-city-that-fits-in-a-book'].replace('</body>',art+'</body>')
    # An embedded listening room retains every recording, edition and engraved score image.
    # The visual theatre shares its parent's audio and clock, including in the offline build.
    cabinet=text('concerto/cabinet/index.html')
    cabinet_css=text('concerto/cabinet/cabinet.css')
    plate='data:image/svg+xml;base64,'+base64.b64encode(read('concerto/cabinet/plate.svg')).decode()
    cabinet_css=re.sub(r"(?<=url\()[\"']?(?:\./)?plate\.svg[\"']?(?=\))",lambda _:plate,cabinet_css)
    cabinet=cabinet.replace('href="../../index.html"','href="https://isiliconx.github.io/astra6.2/"').replace('<link rel="stylesheet" href="cabinet.css">','<style>'+cabinet_css+'</style>')
    cabinet=cabinet.replace('src="plate.svg"','src="'+plate+'"')
    for name in ['score.js','theatre.js','cabinet.js']:
        cabinet=cabinet.replace('<script defer src="'+name+'"></script>','')
    cabinet=cabinet.replace('</body>',''.join('<script>'+code(text('concerto/cabinet/'+n))+'</script>' for n in ['score.js','theatre.js','cabinet.js'])+'</body>')
    sh=text('concerto/index.html')
    sh=sh.replace('href="../index.html"','href="https://isiliconx.github.io/astra6.2/"')
    sh=sh.replace('<link rel="stylesheet" href="room.css?stage=1">','<style>'+text('concerto/room.css')+'</style>')
    files={}
    mt={'.mp3':'audio/mpeg','.pdf':'application/pdf','.zip':'application/zip','.webp':'image/webp','.json':'application/json','.md':'text/plain'}
    for n in names:
        if n.startswith('concerto/') and (n.startswith('concerto/edition/') or n.startswith('concerto/audio/') or n in ('concerto/shore.webp','concerto/program.json','concerto/expressive.json','concerto/production/learned/README.md')):
            ext=Path(n).suffix
            if ext in mt:files[n[len('concerto/'):]]=[mt[ext],base64.b64encode(read(n)).decode()]
    js="window.SHORE_FILES={};for(const [p,[m,b]] of Object.entries("+json.dumps(files,separators=(',',':'))+")){window.SHORE_FILES[p]=URL.createObjectURL(new Blob([Uint8Array.from(atob(b),c=>c.charCodeAt(0))],{type:m}))}"
    # Rebind static URLs before attaching media. The player also resolves dynamic URLs against SHORE_FILES.
    sh=sh.replace('<script src="room.js?stage=1" defer></script>','<script>'+js+';window.SHORE_CABINET_DOC='+code(json.dumps(cabinet))+';</script>').replace('<script src="cabinet-host.js" defer></script>','')
    for f in files:
        for att in ['src','href']:
            sh=sh.replace(att+'="'+f+'"','data-shore-'+att+'="'+f+'"')
    sh=sh.replace('</body>',"""<script>for(const e of document.querySelectorAll('[data-shore-src],[data-shore-href]'))for(const a of ['src','href']){const p=e.getAttribute('data-shore-'+a);if(p)e.setAttribute(a,window.SHORE_FILES[p])}</script>"""+'<script>'+code(text('concerto/room.js'))+'</script><script>'+code(text('concerto/cabinet-host.js'))+'</script></body>')
    extra['the-other-shore']=sh
    assets={n:uri(n) for n in names if n.startswith('assets/') and Path(n).suffix in {'.jpg','.png','.webp'}}
    h=text('index.html').replace('<link rel="stylesheet" href="style.css">','<style>'+text('style.css')+'</style>')
    for name in ['assets/sable-cover.jpg','assets/orchestra-cover.jpg']:
        h=h.replace('src="'+name+'"','src="'+assets[name]+'"')
    for n in ['assets/plates/the-city-that-fits-in-a-book.webp','assets/plates/the-other-shore.webp']:
        h=h.replace('src="'+n+'"','src="'+assets[n]+'"')
    h=h.replace('window.ASTRA=[];', 'window.ASTRA=[];window.ASTRA_ASSETS='+json.dumps(assets,separators=(',',':'))+';window.SABLE_OFFLINE_HTML='+code(json.dumps(game))+';window.ORCHESTRA_OFFLINE_HTML='+code(json.dumps(concert))+';window.ASTRA_STANDALONE='+code(json.dumps(extra,separators=(',',':')))+';')
    return embed(h,'')
if __name__=='__main__':
    root=Path(__file__).resolve().parents[1]
    files=[p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()]
    target=Path(sys.argv[1]) if len(sys.argv)>1 else Path('astra-observatory.html')
    target.write_text(build(lambda n:(root/n).read_bytes(),files),encoding='utf-8')
    print(target,target.stat().st_size,'bytes')
