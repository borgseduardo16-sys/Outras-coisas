"""Trilha calma original (sem direitos de terceiros): piano suave em arpejos + pad quente, 72 BPM.
Progressão Fmaj7 - Am7 - Dm9 - Bbmaj7. Uso: python musica_calma.py saida.wav duracao_s
"""
import sys, wave
import numpy as np

SR = 44100
BPM = 72
BEAT = 60 / BPM
BAR = BEAT * 4
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 50.0
N = int(DUR * SR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)


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


def piano(m, d, vel=1.0):
    """Nota de piano suave: parciais levemente inarmônicos, ataque macio e decaimento longo."""
    t = tt(d); f = hz(m); s = np.zeros_like(t)
    for k, a in enumerate((1.0, 0.42, 0.2, 0.09, 0.05)):
        fk = f * (k + 1) * (1 + 0.00035 * (k + 1) ** 2)
        s += a * np.sin(2 * np.pi * fk * t + k) * np.exp(-t * (0.9 + 1.3 * k))
    env = (1 - np.exp(-t * 160)) * np.minimum(1, (d - t) / 0.3)
    return s * env * 0.22 * vel


def pad(notas, d):
    t = tt(d); s = np.zeros_like(t)
    for m in notas:
        for det in (-0.07, 0.0, 0.07):
            ph = 2 * np.pi * hz(m) * 2 ** (det / 12) * t
            s += np.sin(ph) + 0.18 * np.sin(2 * ph)
    lfo = 0.85 + 0.15 * np.sin(2 * np.pi * 0.18 * t)
    env = np.minimum(1, t / 1.6) * np.minimum(1, (d - t) / 1.6)
    return s * env * lfo / (len(notas) * 3) * 0.16


def grave(m, d):
    t = tt(d)
    s = np.sin(2 * np.pi * hz(m) * t) * np.minimum(1, t / 0.08) * np.exp(-t * 0.5) * np.minimum(1, (d - t) / 0.4)
    return s * 0.2


# acordes (MIDI): baixo + vozes
PROG = [
    (41, [57, 60, 64, 65], [65, 69, 72, 76, 77, 76, 72, 69]),   # Fmaj7
    (45, [55, 57, 60, 64], [64, 67, 69, 72, 76, 72, 69, 67]),   # Am7
    (38, [57, 60, 62, 65], [62, 65, 69, 72, 74, 72, 69, 65]),   # Dm9
    (46, [57, 58, 62, 65], [62, 65, 69, 70, 74, 70, 69, 65]),   # Bbmaj7
]
MELODIA = [  # frase simples por cima, uma nota longa a cada 2 tempos (None = pausa)
    [None, None, 81, 79], [76, None, 77, 76], [74, None, 72, 74], [77, None, None, None],
    [None, None, 81, 84], [83, None, 81, 79], [77, None, 76, 74], [72, None, None, None],
]

b, t0 = 0, 0.0
while t0 < DUR:
    baixo, vozes, arp = PROG[b % 4]
    add(t0, pad(vozes, BAR + 1.8), 0, 1)
    add(t0, grave(baixo, BAR * 0.98), 0, 1)
    intro = b < 1
    for i, m in enumerate(arp):               # colcheias
        tn = t0 + i * BEAT / 2 + rng.uniform(-0.008, 0.008)
        vel = (0.75 if i % 2 else 1.0) * (0.6 if intro else 1.0) * rng.uniform(0.85, 1.0)
        add(tn, piano(m, 2.6, vel), -0.25 + 0.5 * (i % 4) / 3, 1)
    if b >= 2:
        for i, m in enumerate(MELODIA[(b - 2) % len(MELODIA)]):
            if m is not None:
                add(t0 + i * BEAT + 0.01, piano(m, 3.2, 0.8), 0.15, 0.9)
    t0 += BAR; b += 1

# reverb de sala (ecos amortecidos cruzados) para um som aberto e tranquilo
for d, g in ((0.043, 0.32), (0.071, 0.27), (0.113, 0.22), (0.167, 0.18), (0.229, 0.14), (0.311, 0.1), (0.42, 0.07)):
    k = int(d * SR)
    L2, R2 = L.copy(), R.copy()
    L[k:] += R2[:-k] * g; R[k:] += L2[:-k] * g
fi, fo = int(1.5 * SR), int(3.0 * SR)
env = np.ones(N); env[:fi] = np.linspace(0, 1, fi); env[-fo:] = np.linspace(1, 0, fo)
L *= env; R *= env
pk = max(np.abs(L).max(), np.abs(R).max())
st = np.stack([np.tanh(L / pk * 0.9), np.tanh(R / pk * 0.9)], 1)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 30000).astype("<i2").tobytes())
print("ok", DUR)
