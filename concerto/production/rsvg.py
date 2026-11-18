from ctypes import *
from ctypes.util import find_library as lib
C=CDLL(lib('cairo'));R=CDLL(lib('rsvg-2'));G=CDLL(lib('gobject-2.0'))
def fn(L,n,r,*a):
 f=getattr(L,n);f.argtypes=a;f.restype=r;return f
P=c_void_p;D=c_double
class Rect(Structure):_fields_=[(k,D) for k in ('x','y','width','height')]
new=fn(R,'rsvg_handle_new_from_data',P,c_char_p,c_size_t,POINTER(P))
draw=fn(R,'rsvg_handle_render_document',c_int,P,P,POINTER(Rect),POINTER(P))
pdf=fn(C,'cairo_pdf_surface_create',P,c_char_p,D,D);ctx=fn(C,'cairo_create',P,P);show=fn(C,'cairo_show_page',None,P);endctx=fn(C,'cairo_destroy',None,P);finish=fn(C,'cairo_surface_finish',None,P);close=fn(C,'cairo_surface_destroy',None,P);unref=fn(G,'g_object_unref',None,P)
def write(s,path,w,h):
 b=s.encode();err=P();handle=new(b,len(b),byref(err));assert handle
 surface=pdf(str(path).encode(),w,h);cr=ctx(surface);r=Rect(0,0,w,h);assert draw(handle,cr,byref(r),byref(err));show(cr);endctx(cr);finish(surface);close(surface);unref(handle)
if __name__=='__main__':
 import pathlib
 dir=pathlib.Path(__file__).parent/'engraving';write((dir/'test-True-1.svg').read_text(),dir/'test-r.pdf',595,813)
