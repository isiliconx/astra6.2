"""Astra Observatory / Corona Loom. Run with Python, PyTorch CUDA and Pillow:
python studio/render_corona.py assets/corona.jpg
A projected, twisted toroidal ribbon; this is mathematical art, not astrophysics.
"""
import json, hashlib, math, time
from pathlib import Path
import torch
from PIL import Image, ImageFilter
def render(path, seed=620614):
    if not torch.cuda.is_available():
        raise RuntimeError("This plate needs a CUDA device.")
    t0=time.perf_counter()
    W,H=1152,728
    device='cuda'
    rng=torch.Generator(device=device).manual_seed(seed)
    zeros=lambda *shape: torch.zeros(shape,device=device)
    paint=zeros(3,H*W)
    n,threads=4096,2304
    angle=(torch.arange(n,device=device)+0.5)[None,:]*(2*math.pi/n)
    S,C=torch.sin,torch.cos
    for j in range(0,threads,48):
        idx=torch.arange(j,j+48,device=device)[:,None]
        lane=torch.rand((48,1),generator=rng,device=device)
        # A ribbon follows a warped toroidal centre line. Bundles twist around it.
        v=2*lane-1; fam=(idx%6); phi=fam*.085; a=angle+phi
        ripple=.015*S(27*a+3*v)+.008*C(49*a-2*v)
        core=.74+.12*C(3*a+.4)+.085*S(2*a+.6)
        twist=2.5*a+.54*S(3*a)+.44+v*.36
        offset=v*.235+.028*S(10*a+3*v)+ripple
        rad=core+offset*C(twist)
        x=rad*C(a); y=rad*S(a)
        z=.21*S(2*a+.52)+.19*C(3*a-.25)+offset*S(twist)
        # Oblique view; the limb of the folded sheet self-overlaps.
        X=x*.98+.12*y; Y=-x*.18+y*.53-z*.87
        depth=y*.84+z*.54
        px=torch.round(W*(.5+.42*X)).long(); py=torch.round(H*(.49+.61*Y)).long()
        valid=(px>=0)&(px<W)&(py>=0)&(py<H)
        pos=(py*W+px)[valid]
        rim=.38+.9*(.5+.5*C(2*a+.5-v))**2+.26*depth
        density=(.40+1.5*lane**2)*rim*(.54+.46*(C(v*83.+a*2)**2))
        cold=(.5+.5*S(a-1.2+.5*v))**3
        cols=[1-.78*cold,.18+.44*cold+.14*(v+1),.055+.99*cold]
        for k in range(3):
            paint[k].scatter_add_(0,pos,(density*cols[k])[valid])
    pix=paint.reshape(3,H,W)
    rgb=(1-torch.exp(-pix*.080))**.79
    rgb=(rgb.permute(1,2,0)*235).clamp(0,255).byte().cpu().numpy()
    im=Image.fromarray(rgb)
    from PIL import ImageChops
    glow=im.filter(ImageFilter.GaussianBlur(6))
    im=ImageChops.screen(im,glow.point(lambda x:int(x*.7)))
    bg=Image.new('RGB',im.size,(11,14,19))
    im=ImageChops.screen(im,bg)
    out=Path(path);out.parent.mkdir(exist_ok=True,parents=True)
    im.save(out,quality=91,subsampling=0,optimize=True)
    return dict(title="Corona Loom",device=torch.cuda.get_device_name(0),width=W,height=H,samples=n*threads,filaments=threads,samples_per_filament=n,seed=seed,seconds=round(time.perf_counter()-t0,3),sha256=hashlib.sha256(out.read_bytes()).hexdigest())
if __name__=="__main__":
    import sys
    print(json.dumps(render(sys.argv[1] if len(sys.argv)>1 else "assets/corona.jpg"),indent=2))
