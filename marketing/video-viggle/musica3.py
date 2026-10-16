"""Batida phonk "escura" e encorpada (v3), original (instrumental), sintetizada do zero — sem direitos de terceiros.
130 BPM, mais agressiva (tamborzão + cowbell distorcido + 808 com slide); intro de 2 compassos, "drop" no compasso 3 (sincronizado com a virada do vídeo).
Uso: python3 musica.py saida.wav [duracao_s]
"""
import math, random, struct, sys, wave

SR = 44100
BPM = 130
BEAT = 60 / BPM
STEP = BEAT / 4                    # semicolcheia
BAR = BEAT * 4
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else BAR * 8
N = int(DUR * SR)
L = [0.0] * N
R = [0.0] * N
random.seed(5)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def add(start, samples, pan=0.0, gain=1.0):
    i0 = int(start * SR)
    gl, gr = gain * (1 - max(0, pan)), gain * (1 + min(0, pan))
    for k, v in enumerate(samples):
        i = i0 + k
        if 0 <= i < N:
            L[i] += v * gl
            R[i] += v * gr


def kick(boom=1.0):
    out, ph = [], 0.0
    for k in range(int(0.45 * SR)):
        t = k / SR
        f = 45 + 110 * math.exp(-t * 28)
        ph += 2 * math.pi * f / SR
        env = math.exp(-t * 7.5) * boom
        click = math.exp(-t * 400) * 0.6
        out.append(math.tanh(2.2 * math.sin(ph) * env) * 0.9 + click * (random.random() * 2 - 1) * 0.3)
    return out


def clap():
    out, lp = [], 0.0
    for k in range(int(0.28 * SR)):
        t = k / SR
        n = random.random() * 2 - 1
        lp += 0.35 * (n - lp)
        hp = n - lp
        env = (math.exp(-t * 18) + 0.5 * math.exp(-max(0, t - 0.012) * 30) * (t > 0.012)) * 0.8
        out.append(hp * env + 0.25 * math.sin(2 * math.pi * 190 * t) * math.exp(-t * 35))
    return out


def hat(dur=0.05, g=0.35):
    out, lp = [], 0.0
    for k in range(int(dur * SR)):
        t = k / SR
        n = random.random() * 2 - 1
        lp += 0.6 * (n - lp)
        out.append((n - lp) * math.exp(-t * 70) * g)
    return out


def cowbell(note, dur=0.22, bright=1.0):
    f1 = midi(note)
    f2 = f1 * 1.4825
    out, lp, p1, p2 = [], 0.0, 0.0, 0.0
    a = 0.25 + 0.6 * bright          # filtro passa-baixa (intro abafada)
    for k in range(int(dur * SR)):
        t = k / SR
        p1 = (p1 + f1 / SR) % 1.0
        p2 = (p2 + f2 / SR) % 1.0
        s = (1 if p1 < 0.5 else -1) * 0.5 + (1 if p2 < 0.5 else -1) * 0.5
        env = math.exp(-t * 11) * (1 - math.exp(-t * 900))
        lp += a * (s - lp)
        out.append(math.tanh(lp * 2.6) * env * 0.2)
    return out


def bass808(note, dur, glide_from=None):
    out, ph = [], 0.0
    f = midi(note)
    f0 = midi(glide_from) if glide_from else f
    for k in range(int(dur * SR)):
        t = k / SR
        fr = f + (f0 - f) * math.exp(-t * 18)
        ph += 2 * math.pi * fr / SR
        env = (1 - math.exp(-t * 300)) * math.exp(-t * 1.6)
        rel = min(1.0, (dur - t) / 0.03)
        out.append(math.tanh(4.2 * math.sin(ph) * env) * 0.72 * rel)
    return out


def tom(f0=170, f1=95, dur=0.18):
    out, ph = [], 0.0
    for k in range(int(dur * SR)):
        t = k / SR
        f = f1 + (f0 - f1) * math.exp(-t * 25)
        ph += 2 * math.pi * f / SR
        out.append(math.tanh(1.8 * math.sin(ph)) * math.exp(-t * 16) * 0.6)
    return out


def noise_riser(dur):
    out, lp = [], 0.0
    for k in range(int(dur * SR)):
        t = k / SR
        x = t / dur
        n = random.random() * 2 - 1
        lp += (0.05 + 0.6 * x) * (n - lp)
        out.append(lp * (x ** 2) * 0.9)
    return out


# Melodia de cowbell (Fá# menor), 16 passos por compasso; None = pausa
MEL = [
    [66, 66, None, 69, None, 66, 64, None, 66, None, 61, None, 64, 66, None, 61],
    [66, 66, None, 69, None, 71, 69, None, 66, None, 64, None, 61, None, 59, 61],
]
# 808: (passo, nota, duração em passos, glide_de)
BAIXO = [(0, 30, 3, 37), (3, 30, 3, None), (6, 33, 4, 30), (10, 28, 3, None), (13, 30, 3, 25)]
KICKS = [0, 3, 6, 10]
TOMS = [(7, 180, 110), (9, 150, 95), (14, 200, 120), (15, 170, 100)]
n_bars = int(math.ceil(DUR / BAR))
drop_bar = 2
for b in range(n_bars):
    t0 = b * BAR
    pos_drop = b >= drop_bar
    mel = MEL[b % 2]
    for s, nt in enumerate(mel):
        if nt is None:
            continue
        pan = -0.25 if s % 4 == 0 else 0.25
        add(t0 + s * STEP, cowbell(nt, 0.24, 1.0 if pos_drop else 0.4), pan, 1.0 if pos_drop else 4.0)
    if pos_drop:
        for s in KICKS:
            add(t0 + s * STEP, kick(1.15 if s == 0 else 1.0), 0, 0.95)
        for (s, f0, f1) in TOMS:
            add(t0 + s * STEP, tom(f0, f1), -0.15 if s % 2 else 0.15, 0.7)
        for s in (4, 12):
            add(t0 + s * STEP, clap(), 0, 0.55)
        for s in range(0, 16, 2):
            if s % 4 == 2: add(t0 + s * STEP, hat(0.045, 0.16), 0.25, 1)
        if False:  # (sem rolagens de chimbal nesta versão)
            for s in (13, 14, 15):
                add(t0 + s * STEP, hat(0.03, 0.22), 0.3, 1)
                add(t0 + s * STEP + STEP / 2, hat(0.03, 0.18), 0.3, 1)
        for (s, nt, d, g) in BAIXO:
            add(t0 + s * STEP, bass808(nt, d * STEP, g), 0, 0.9)
    elif b == drop_bar - 1:
        # intro: chimbal leve e "riser" levando ao drop
        for s in range(8, 16, 2):
            add(t0 + s * STEP, hat(0.04, 0.18), 0.3, 1)
        add(t0 + BAR * 0.5, noise_riser(BAR * 0.5), 0, 1)

# impacto no drop (sub grave)
add(drop_bar * BAR, kick(1.6), 0, 1.0)

# Pad escuro (acordes de serra desafinados, filtrados) — dá "corpo" à faixa
ACORDES = [(54, 57, 61), (52, 56, 59)]          # F#m, E (graves)
for b in range(n_bars):
    notas = ACORDES[b % 2]; t0 = b * BAR
    g = 0.07 if b < drop_bar else 0.11
    for nt in notas:
        for det in (-0.08, 0.08):
            f = midi(nt + det); ph = random.random(); lp = 0.0
            seg = []
            for k in range(int(BAR * SR)):
                ph = (ph + f / SR) % 1.0
                x = 2 * ph - 1
                lp += 0.035 * (x - lp)
                tt = k / SR
                env = min(1, tt / 0.25) * min(1, (BAR - tt) / 0.3)
                seg.append(lp * env * g)
            add(t0, seg, -0.3 if det < 0 else 0.3, 1)

# Reverb simples (Schroeder) sobre a mistura, para dar ambiência
def reverb(sig, mix=0.22):
    combs = [(1557, 0.80), (1617, 0.79), (1491, 0.78), (1422, 0.77)]
    out = [0.0] * len(sig)
    for d, fb in combs:
        buf = [0.0] * d; i = 0
        for n in range(len(sig)):
            y = buf[i]; buf[i] = sig[n] + y * fb; i = (i + 1) % d
            out[n] += y * 0.25
    for d in (225, 556):
        buf = [0.0] * d; i = 0
        for n in range(len(out)):
            bo = buf[i]; x = out[n]; y = -x + bo; buf[i] = x + bo * 0.5; i = (i + 1) % d
            out[n] = y
    return [a * (1 - mix) + b * mix for a, b in zip(sig, out)]
L = reverb(L); R = reverb(R)

# fade-out no último meio compasso
fo = int(BEAT * 2 * SR)
for k in range(fo):
    g = 1 - k / fo
    i = N - fo + k
    L[i] *= g
    R[i] *= g

peak = max(max(abs(x) for x in L), max(abs(x) for x in R)) or 1
g = 0.89 / peak
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'musica.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(b''.join(struct.pack('<hh', int(math.tanh(L[i] * g) * 32000), int(math.tanh(R[i] * g) * 32000)) for i in range(N)))
print('ok', DUR)
