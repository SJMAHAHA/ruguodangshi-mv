import sys, numpy as np, librosa, soundfile as sf
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
y, sr = sf.read(sys.argv[1]); y=y.T
mid=(y[0]+y[1])/2; side=(y[0]-y[1])/2
hop=256; n_fft=2048
M=np.abs(librosa.stft(mid,n_fft=n_fft,hop_length=hop)); Sd=np.abs(librosa.stft(side,n_fft=n_fft,hop_length=hop))
f=librosa.fft_frequencies(sr=sr,n_fft=n_fft)
band=(f>250)&(f<3500)
em=(M[band]**2).sum(0); es=(Sd[band]**2).sum(0)
t=librosa.frames_to_time(np.arange(len(em)),sr=sr,hop_length=hop)
voc=10*np.log10(em+1e-9)-10*np.log10(es+1e-9)
# smooth
k=np.ones(9)/9; vs=np.convolve(voc,k,'same')
rms=librosa.feature.rms(y=mid,frame_length=2048,hop_length=hop)[0]
rdb=20*np.log10(rms+1e-6)
low=(f<150); el=10*np.log10((M[low]**2).sum(0)+1e-9)
np.savez(sys.argv[2], t=t, vs=vs, rdb=rdb, el=el)
lo,hi=float(sys.argv[3]),float(sys.argv[4])
m=(t>=lo)&(t<=hi)
fig,ax=plt.subplots(3,1,figsize=(26,10),sharex=True)
ax[0].plot(t[m],vs[m]); ax[0].set_ylabel('mid/side vocal-band dB')
ax[1].plot(t[m],rdb[m],color='g'); ax[1].set_ylabel('RMS dB')
ax[2].plot(t[m],el[m],color='r'); ax[2].set_ylabel('low <150Hz')
lrc=[(64.26,'天灰了'),(67.35,'视线'),(70.49,'此时'),(76.93,'爱走了'),(80.16,'你说'),(84.87,'我为你'),(91.15,'红雨'),(97.46,'你美目'),(103.70,'渡口边'),(109.77,'与你若')]
for a in ax:
    a.set_xticks(np.arange(lo,hi,1)); a.grid(True,alpha=.4)
    for x,_ in lrc:
        if lo<=x<=hi: a.axvline(x,color='k',ls='--')
plt.tight_layout(); plt.savefig(sys.argv[5],dpi=70)
