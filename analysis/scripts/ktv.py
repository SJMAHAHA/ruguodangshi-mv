import sys, subprocess, numpy as np
V=sys.argv[1]; lo=float(sys.argv[2]); dur=float(sys.argv[3])
W=648; Y0=290; H=432-Y0
cmd=['ffmpeg','-v','error','-ss',str(lo),'-t',str(dur),'-i',V,'-vf',f'crop={W}:{H}:0:{Y0}','-f','rawvideo','-pix_fmt','rgb24','-']
raw=subprocess.run(cmd,capture_output=True).stdout
n=len(raw)//(W*H*3); fr=np.frombuffer(raw,np.uint8)[:n*W*H*3].reshape(n,H,W,3).astype(np.int16)
fps=30000/1001
R,G,B=fr[...,0],fr[...,1],fr[...,2]
blue=(B>140)&(R<130)&(G<130)&(B-R>60)
white=(R>200)&(G>200)&(B>200)
rows=blue.sum((0,2))
print('blue rows:', [(Y0+i,int(v)) for i,v in enumerate(rows) if v>n*0.3])
np.savez(sys.argv[4], blue=blue.astype(np.uint8), white=white.astype(np.uint8), t=lo+np.arange(n)/fps, Y0=Y0)
