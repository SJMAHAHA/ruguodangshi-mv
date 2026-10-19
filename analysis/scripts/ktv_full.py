import sys, subprocess, numpy as np, json
V=sys.argv[1]
W=648; Y0=300; H=400-Y0
fps=30000/1001
bands={'top':(308,343),'bot':(359,393)}
events=[]
for lo in range(0, 315, 30):
    cmd=['ffmpeg','-v','error','-ss',str(lo),'-t','30.5','-i',V,'-vf',f'crop={W}:{H}:0:{Y0}','-f','rawvideo','-pix_fmt','rgb24','-']
    raw=subprocess.run(cmd,capture_output=True).stdout
    n=len(raw)//(W*H*3)
    fr=np.frombuffer(raw,np.uint8)[:n*W*H*3].reshape(n,H,W,3).astype(np.int16)
    R,G,B=fr[...,0],fr[...,1],fr[...,2]
    blue=(B>140)&(R<130)&(G<130)&(B-R>60)
    white=(R>200)&(G>200)&(B>200)
    t=lo+np.arange(n)/fps
    for name,(a,b) in bands.items():
        bb=blue[:,a-Y0:b-Y0,:].sum(1); ww=white[:,a-Y0:b-Y0,:].sum(1)
        txt=(bb+ww)>=3
        xb=np.array([ (np.nonzero(c>=3)[0].max() if (c>=3).any() else -1) for c in bb])
        left=np.array([ (np.nonzero(c)[0].min() if c.any() else -1) for c in txt])
        right=np.array([ (np.nonzero(c)[0].max() if c.any() else -1) for c in txt])
        i=0
        while i<n:
            if xb[i]>=0:
                j=i
                while j+1<n and xb[j+1]>=0 and xb[j+1]>=xb[j]-5: j+=1
                if t[j]-t[i]>=0.3:
                    L=int(np.median(left[i:j+1])); Rr=int(np.median(right[max(i,j-5):j+1]))
                    xs=xb[i:j+1]; ts=t[i:j+1]
                    # 95% point
                    w=Rr-L; idx=np.nonzero(xs>=L+0.95*w)[0]
                    events.append(dict(band=name,start=round(float(ts[0]),2),end=round(float(ts[-1]),2),p95=round(float(ts[idx[0]]),2) if len(idx) else None,L=L,R=Rr))
                i=j+1
            else: i+=1
events.sort(key=lambda e:e['start'])
# merge duplicates across chunk overlap
out=[]
for e in events:
    if out and e['band']==out[-1]['band'] and abs(e['start']-out[-1]['start'])<0.6: 
        out[-1]['end']=max(out[-1]['end'],e['end']); continue
    out.append(e)
json.dump(out,open(sys.argv[2],'w'),indent=0)
for e in out: print(e)
