import sys, numpy as np, librosa
y, sr = librosa.load(sys.argv[1], sr=22050)
y2, _ = librosa.load(sys.argv[2], sr=22050)
# alignment check m4a vs mp4 audio
n=min(len(y),len(y2)); seg=slice(sr*60, sr*90)
a=y[seg]; 
best=None
for lag in range(-2000,2001,1):
    b=y2[sr*60+lag: sr*90+lag]
    c=np.dot(a,b)
    if best is None or c>best[0]: best=(c,lag)
print("mp4-vs-m4a lag samples", best[1], "=", best[1]/sr*1000, "ms")
onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=512)
tempo, beats = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, hop_length=512)
bt = librosa.frames_to_time(beats, sr=sr, hop_length=512)
print("tempo", tempo)
sel = bt[(bt>55)&(bt<115)]
print("beats 55-115:", np.round(sel,2).tolist())
print("intervals:", np.round(np.diff(sel),3).tolist())
np.save(sys.argv[3], bt)
