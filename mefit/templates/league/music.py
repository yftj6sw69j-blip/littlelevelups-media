"""Original synthesised music bed for the MeFit League story (10 s, 120 bpm).
Usage: python3 music.py SEED OUT.wav
Timeline matches src/Story.tsx: beat every 0.5 s; title hit 0.5 s; build 1.5-6 s;
drumroll 6.0-7.0 s; drop on #1 at 7.0 s; outro 7-10 s. SEED (e.g. the week number)
changes key, chord progression, lead timbre and hat pattern so each week sounds different."""
import sys, wave
import numpy as np

SR = 44100
DUR = 10.0
BEAT = 0.5
DROP = 7.0
rng = np.random.default_rng(int(sys.argv[1]) if len(sys.argv) > 1 else 1)
out = sys.argv[2] if len(sys.argv) > 2 else "public/bed.wav"
N = int(SR * DUR)
t_all = np.arange(N) / SR
mix = np.zeros((N, 2))

def put(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    mix[i : i + len(sig), 0] += sig * l
    mix[i : i + len(sig), 1] += sig * r

def env(n, a=0.005, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)

def hz(m): return 440 * 2 ** ((m - 69) / 12)

def kick(big=False):
    n = int(SR * (0.9 if big else 0.35)); t = np.arange(n) / SR
    f = 42 + (160 if big else 120) * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * (3.5 if big else 9)) + 0.15 * np.tanh(6 * np.sin(ph)) * np.exp(-t * 30)

def noise(n): return rng.standard_normal(n)

def hp(x, a=0.85):  # crude one-pole high-pass
    y = np.zeros_like(x); prev = 0.0; px = 0.0
    for i, v in enumerate(x):
        prev = a * (prev + v - px); px = v; y[i] = prev
    return y

HAT = hp(noise(int(SR * 0.06))) * env(int(SR * 0.06), 0.001, 0.018)
def snare():
    n = int(SR * 0.22); t = np.arange(n) / SR
    return 0.7 * hp(noise(n), 0.7) * np.exp(-t * 22) + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)

def voice(m, dur, kind, bright=1.0):
    n = int(SR * dur); t = np.arange(n) / SR; f = hz(m)
    det = [1, 1.004, 0.996]
    if kind == "saw":
        s = sum(2 * ((t * f * d) % 1) - 1 for d in det) / 3
    elif kind == "square":
        s = sum(np.sign(np.sin(2 * np.pi * f * d * t)) for d in det) / 3 * 0.7
    else:  # bell-ish FM
        s = np.sin(2 * np.pi * f * t + 1.8 * bright * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 4))
    return s

def pad(chord, dur, kind):
    n = int(SR * dur)
    s = sum(voice(m, dur, kind) for m in chord) / len(chord)
    a = np.minimum(1, np.arange(n) / (SR * 0.4)) * np.minimum(1, (n - np.arange(n)) / (SR * 0.3))
    # simple low-pass by moving average for warmth
    k = 9; s = np.convolve(s, np.ones(k) / k, mode="same")
    return s * a

key = 40 + int(rng.integers(0, 7))  # low root between E2 and A#2
progs = [[0, -4, 3, -2], [0, 5, 3, 7], [0, -2, -4, -5], [0, 3, -4, -2]]
prog = progs[int(rng.integers(0, len(progs)))]
kind = ["saw", "square", "fm"][int(rng.integers(0, 3))]
hat_pat = [[0, 1, 0, 1], [1, 1, 0, 1], [0, 1, 1, 1]][int(rng.integers(0, 3))]
minor = lambda r: [r + 12, r + 15, r + 19, r + 22]

# Intro swell into the title hit at 0.5 s
sw = noise(int(SR * 0.5)) * np.linspace(0, 1, int(SR * 0.5)) ** 3
put(hp(sw, 0.92), 0, 0.25)
put(kick(True), 0.5, 0.8)
put(hp(noise(int(SR * 1.2)), 0.95) * env(int(SR * 1.2), 0.001, 0.35), 0.5, 0.18)

# Build section 1.5 s → 6.0 s: kick on beats, hats on 8ths, bass + pad following the progression
for b in range(3, 12):
    tb = b * BEAT
    put(kick(), tb, 0.55)
    for s8 in range(2):
        if hat_pat[(b * 2 + s8) % 4]: put(HAT, tb + s8 * BEAT / 2, 0.16, pan=0.3 if s8 else -0.3)
    root = key + prog[(b // 2) % 4]
    bass = voice(root, BEAT * 0.9, "saw") * env(int(SR * BEAT * 0.9), 0.004, 0.25)
    put(np.convolve(bass, np.ones(25) / 25, mode="same"), tb, 0.35)
for i, start in enumerate(np.arange(1.5, 6.0, 1.0)):
    put(pad(minor(key + prog[i % 4]), 1.05, kind), start, 0.10, pan=-0.2)
    # little lead arpeggio pluck, panned, rising as rows land
    for j, step in enumerate([12, 19, 24, 19]):
        nt = key + prog[i % 4] + 12 + step
        pl = voice(nt, 0.22, "fm", 0.8) * env(int(SR * 0.22), 0.002, 0.08)
        put(pl, start + j * 0.25, 0.07 + 0.01 * i, pan=0.35 * (1 if j % 2 else -1))

# Drumroll + riser 6.0 → 7.0 s
t = 6.0; gap = 0.125
while t < DROP - 0.02:
    put(snare(), t, 0.22 + 0.4 * (t - 6.0)); t += gap; gap = max(0.03, gap * 0.82)
rn = int(SR * 1.0)
riser = hp(noise(rn), 0.97) * np.linspace(0, 1, rn) ** 2
sweep = np.sin(2 * np.pi * np.cumsum(np.linspace(hz(key + 24), hz(key + 48), rn)) / SR) * np.linspace(0, 1, rn) ** 2
put(riser, 6.0, 0.22); put(sweep, 6.0, 0.06)

# Drop on #1 at 7.0 s: sub boom, crash, bright chord stab, then full groove
put(kick(True), DROP, 1.0)
cr = hp(noise(int(SR * 2.2)), 0.9) * env(int(SR * 2.2), 0.001, 0.7)
put(cr, DROP, 0.22, pan=-0.15); put(cr[::-1][::-1] * 0.9, DROP + 0.01, 0.2, pan=0.15)
stab = pad(minor(key + 12), 1.6, "saw") * env(int(SR * 1.6), 0.003, 0.6)
put(stab, DROP, 0.32)
for b in range(int(DROP / BEAT) + 1, int(DUR / BEAT)):
    tb = b * BEAT
    put(kick(), tb, 0.6)
    put(HAT, tb + BEAT / 2, 0.2)
    if b % 2: put(snare(), tb, 0.3)
put(pad(minor(key), DUR - DROP, kind), DROP, 0.14)
for j in range(12):
    nt = key + 24 + [0, 7, 12, 15, 19, 15, 12, 7][j % 8]
    put(voice(nt, 0.2, "fm", 1.0) * env(int(SR * 0.2), 0.002, 0.07), DROP + 0.25 * j, 0.08, pan=0.3 * (1 if j % 2 else -1))

# Master: gentle glue, fade the tail, normalise to -1 dBFS
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
fade = int(SR * 0.6); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix *= 0.89 / np.max(np.abs(mix))
pcm = (mix * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("wrote", out, "key", key, "prog", prog, "timbre", kind)
