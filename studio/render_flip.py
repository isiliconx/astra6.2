"""Flip Atlas, Astra Observatory. Finite-time first-inversion map for an ideal
double pendulum. Run: python studio/render_flip.py assets/flip.webp
Units m=1, L=1, g=9.81, undamped equal point masses, rigid massless rods.
"""
import json, math, hashlib, time
from pathlib import Path
import torch
from PIL import Image

def render(path):
    if not torch.cuda.is_available(): raise RuntimeError("CUDA required")
    w,h,steps,dt=504,336,780,.016
    D='cuda'; T=torch; tiny=1e-12
    t0=time.perf_counter()
    # Pixel centres: horizontal first angle, vertical second angle (positive up).
    b,a=T.meshgrid(math.pi-(T.arange(h,device=D)+.5)*(2*math.pi/h),-math.pi+(T.arange(w,device=D)+.5)*(2*math.pi/w),indexing='ij')
    q=T.stack([a,b,T.zeros_like(a),T.zeros_like(b)]);first=T.zeros_like(a);which=T.zeros_like(a)
    def deriv(y):
        a,b,u,v=y;d=a-b;s=T.sin(d);c=T.cos(d);den=2-c*c
        du=(-2*9.81*T.sin(a)+9.81*T.sin(b)*c-s*(v*v+u*u*c))/den
        dv=(2*9.81*T.sin(a)*c-2*9.81*T.sin(b)+s*(2*u*u+v*v*c))/den
        return T.stack([u,v,du,dv])
    with T.no_grad():
        for step in range(steps):
            k=deriv(q);l=deriv(q+dt*.5*k);m=deriv(q+.5*dt*l);n=deriv(q+dt*m)
            q+=dt/6*(k+2*l+2*m+n)
            aa=q[0].abs()>=math.pi;bb=q[1].abs()>=math.pi
            new=(aa|bb)&(first==0)
            first=T.where(new,(step+1)*dt,first);which=T.where(new,T.where(aa,1.,2.),which)
        val=(1-first/(steps*dt)).clamp(0,1)**.45
        colors=T.tensor([[12.,22.,34.],[54.,210.,211.],[255.,118.,70.]],device=D)
        rgb=colors[0]+(colors[which.long()]-colors[0])*(.20+.80*val[...,None])
        # No-inversion basins show an energy contour; shade is not a chaos measure.
        energy=9.81*(3-2*T.cos(a)-T.cos(b))
        dark=T.stack([15+1*energy/8,28+energy/2.2,37+energy/1.9],dim=-1)
        rgb=T.where((which==0)[...,None],dark,rgb).clamp(0,255).byte().cpu().numpy()
    out=Path(path);out.parent.mkdir(exist_ok=True,parents=True);Image.fromarray(rgb).save(out,lossless=True,method=4)
    return dict(device=T.cuda.get_device_name(),dimensions=[w,h],trajectories=w*h,steps=steps,dt=dt,horizon_seconds=round(dt*steps,2),rk4_steps=w*h*steps,first_arm_inversions=int((which==1).sum()),second_arm_inversions=int((which==2).sum()),no_inversion=int((which==0).sum()),runtime_seconds=round(time.perf_counter()-t0,3),sha256=hashlib.sha256(out.read_bytes()).hexdigest())
if __name__=="__main__":
    import sys
    print(json.dumps(render(sys.argv[1] if len(sys.argv)>1 else 'assets/flip.webp'),indent=2))
