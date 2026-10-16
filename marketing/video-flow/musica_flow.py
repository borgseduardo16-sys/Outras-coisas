"""Trilha original (sem direitos de terceiros), clima "feel good" com palmas, para o vídeo do Flow.
128 BPM. Compassos 1-4: tenso/abafado (cena da dor). Drop no compasso 5 (t = 7,5 s) em tom maior,
com piano em contratempo, palmas, pandeirola e baixo. Uso: python musica_flow.py saida.wav duracao_s
"""
import sys, wave
import numpy as np

SR = 44100
BPM = 128
BEAT = 60 / BPM
BAR = BEAT * 4
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 16.6
N = int(DUR * SR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(31)
DROP = 4 * BAR


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(t0, x, pan=0.0, g=1.0):
    i0 = int(t0 * SR)
    if i0 >= N: return
    x = x[:N - i0] * g
    L[i0:i0 + len(x)] += x * (1 - max(0, pan))
    R[i0:i0 + len(x)] += x * (1 + min(0, pan))


def tt(d):
    return np.arange(int(d * SR)) / SR


def lowpass(x, a):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y


def piano(notas, d, brilho=1.0):
    t = tt(d); s = np.zeros_like(t)
    for m in notas:
        f = hz(m)
        for k, a in enumerate((1, 0.55, 0.3, 0.18, 0.1, 0.06)):
            s += a * brilho ** k * np.sin(2 * np.pi * f * (k + 1) * t * (1 + 0.0004 * k)) * np.exp(-t * (2.2 + 1.6 * k))
    env = (1 - np.exp(-t * 400)) * np.minimum(1, (d - t) / 0.04)
    return s * env / len(notas) * 0.5


def pad(notas, d):
    t = tt(d); s = np.zeros_like(t)
    for m in notas:
        for det in (-0.12, 0.0, 0.12):
            ph = 2 * np.pi * hz(m) * 2 ** (det / 12) * t
            s += np.sin(ph) + 0.3 * np.sin(2 * ph)
    env = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.5)
    return s * env / (len(notas) * 3) * 0.35


def kick(g=1.0):
    t = tt(0.4); f = 48 + 120 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(2 * np.sin(ph) * np.exp(-t * 8)) * 0.9 * g


def clap():
    t = tt(0.22); n = rng.uniform(-1, 1, len(t))
    n = n - lowpass(n, 0.3)
    env = np.exp(-t * 22) + sum(0.6 * np.exp(-np.maximum(0, t - o) * 40) * (t > o) for o in (0.008, 0.017))
    return n * env * 0.5


def tamb(g=0.2):
    t = tt(0.07); n = rng.uniform(-1, 1, len(t))
    n = n - lowpass(n, 0.7)
    return n * np.exp(-t * 55) * g


def baixo(m, d):
    t = tt(d); ph = 2 * np.pi * hz(m) * t
    s = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    return np.tanh(1.6 * s) * (1 - np.exp(-t * 300)) * np.minimum(1, (d - t) / 0.03) * 0.45


def riser(d):
    t = tt(d); x = t / d
    n = rng.uniform(-1, 1, len(t))
    return lowpass(n, 0.08) * x ** 2 * 1.4 + np.sin(2 * np.pi * (200 + 900 * x ** 2) * t) * x ** 3 * 0.06


# ---- Intro tensa (Lá menor): pad abafado + piano grave + "batimento" ----
INTRO = [[57, 60, 64], [53, 57, 60], [52, 55, 59], [52, 56, 59]]   # Am F Em E
for b, ac in enumerate(INTRO):
    t0 = b * BAR
    add(t0, pad([n - 12 for n in ac], BAR + 0.3), 0, 1.0)
    add(t0, piano([ac[0] - 12, ac[0]], BAR * 0.9, 0.35), 0, 0.9)
    for bt in (0, 1):                                   # batida de coração
        add(t0 + bt * 2 * BEAT, kick(0.55), 0, 1)
        add(t0 + bt * 2 * BEAT + 0.16, kick(0.35), 0, 1)
add(DROP - BAR, riser(BAR), 0, 0.9)
for k in range(8):                                      # caixa acelerando para o drop
    add(DROP - BEAT * 2 + k * BEAT / 4, clap(), 0, 0.15 + 0.05 * k)

# ---- Drop (Dó maior): C G Am F ----
PROG = [([60, 64, 67, 72], 36), ([59, 62, 67, 71], 43), ([60, 64, 69, 72], 45), ([60, 65, 69, 72], 41)]
b = 0
t0 = DROP
while t0 < DUR:
    ac, bx = PROG[b % 4]
    for q in range(4):
        tb = t0 + q * BEAT
        add(tb, kick(1.0 if q else 1.15), 0, 1)
        if q % 2: add(tb, clap(), 0, 0.85)
        add(tb + BEAT / 2, piano(ac, BEAT * 0.45, 1.0), 0.0, 1.1)   # piano em contratempo
        for s in range(4):
            add(tb + s * BEAT / 4, tamb(0.28 if s == 2 else 0.14), 0.35, 1)
    add(t0, pad(ac, BAR + 0.2), 0, 0.6)
    for (st, d) in ((0, 1.5), (1.5, 1.0), (2.5, 0.5), (3, 1.0)):
        add(t0 + st * BEAT, baixo(bx, d * BEAT * 0.95), 0, 1)
    add(t0 + 3.5 * BEAT, piano([ac[-1] + 12], BEAT * 0.4, 1.2), -0.3, 0.6)
    t0 += BAR; b += 1
add(DROP, kick(1.6), 0, 1)
add(DROP, riser(0.01), 0, 0)

# reverb simples (ecos amortecidos) + fade final
for d, g in ((0.031, 0.25), (0.047, 0.2), (0.071, 0.16), (0.113, 0.12), (0.167, 0.08)):
    k = int(d * SR)
    L[k:] += R[:-k] * g; R[k:] += L[:-k] * g * 0.9
fo = int(1.2 * SR)
env = np.ones(N); env[-fo:] = np.linspace(1, 0, fo)
L *= env; R *= env
pk = max(np.abs(L).max(), np.abs(R).max())
st = np.stack([np.tanh(L / pk * 1.1), np.tanh(R / pk * 1.1)], 1)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 30000).astype("<i2").tobytes())
print("ok", DUR)
