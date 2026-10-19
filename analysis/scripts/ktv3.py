import sys, numpy as np
d=np.load(sys.argv[1]); blue=d['blue']; white=d['white']; t=d['t']; Y0=int(d['Y0'])
bands={'top':(308,343),'bot':(359,393)}
events=[]
for name,(a,b) in bands.items():
    bb=blue[:,a-Y0:b-Y0,:].sum(1); ww=white[:,a-Y0:b-Y0,:].sum(1)
    txt=(bb+ww)>=3
    xb=np.array([ (np.nonzero(c>=3)[0].max() if (c>=3).any() else -1) for c in bb])
    left=np.array([ (np.nonzero(c)[0].min() if c.any() else -1) for c in txt])
    right=np.array([ (np.nonzero(c)[0].max() if c.any() else -1) for c in txt])
    # find wipe segments: contiguous frames with xb>=0 and monotone-ish
    i=0;n=len(t)
    while i<n:
        if xb[i]>=0:
            j=i
            while j+1<n and xb[j+1]>=0 and xb[j+1]>=xb[j]-5: j+=1
            L=int(np.median(left[i:j+1])); Rr=int(np.median(right[max(i,j-5):j+1]))
            xs=xb[i:j+1]; ts=t[i:j+1]
            events.append((ts[0],name,L,Rr,ts,xs))
            i=j+1
        else: i+=1
events.sort(key=lambda e:e[0])
for (t0,name,L,Rr,ts,xs) in events:
    if ts[-1]-ts[0]<0.3: continue
    w=Rr-L
    # time when wipe crosses each 10% of width
    marks=[]
    for k in range(0,21):
        thr=L+w*k/20
        idx=np.nonzero(xs>=thr)[0]
        marks.append(round(float(ts[idx[0]]),2) if len(idx) else None)
    print(f"{name} L={L} R={Rr} w={w} t0={ts[0]:.2f} tEnd={ts[-1]:.2f}")
    print("   5%-steps:", marks)
