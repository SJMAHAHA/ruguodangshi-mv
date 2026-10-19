import numpy as np, soundfile as sf
y,sr=sf.read('full_stereo.wav'); m=y.mean(1)
hop=int(sr*0.005); win=int(sr*0.03)
def rms_at(t):
    a=int(t*sr)-win//2; return np.sqrt(np.mean(m[a:a+win]**2))
best=[]
for s in np.arange(67.05,67.56,0.005):
    e=20*np.log10(rms_at(s)+1e-6); f=20*np.log10(rms_at(s+30)+1e-6)
    best.append((max(e,f),e,f,s))
best.sort()
for b in best[:8]: print("start %.3f  end %.3f  rms_start %.1f dB  rms_end %.1f dB"%(b[3],b[3]+30,b[1],b[2]))
print('ref levels: overall rms dB', 20*np.log10(np.sqrt(np.mean(m[int(67*sr):int(98*sr)]**2))))
for t in np.arange(66.9,67.7,0.05): print(round(t,2), round(20*np.log10(rms_at(t)+1e-6),1), end=' | ')
print()
for t in np.arange(96.9,97.8,0.05): print(round(t,2), round(20*np.log10(rms_at(t)+1e-6),1), end=' | ')
