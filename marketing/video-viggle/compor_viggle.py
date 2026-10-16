"""Reedita o vídeo do Viggle: recorta o boneco, troca a cozinha por um estúdio escuro,
adiciona brilho vermelho na coluna (fase de dor), anéis nos pés (fase ativa), zoom na virada.
Saída: quadros RAW 1080x1920 30fps em stdout (para o ffmpeg).
Uso: python compor_viggle.py entrada.mp4 [teste]
"""
import sys, math
import cv2
import numpy as np
from mediapipe.python.solutions import pose as mpose
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
import os
MODELOS = os.environ.get('MODELOS', 'models')

SRC = sys.argv[1]
TESTE = len(sys.argv) > 2
W, H = 1080, 1920
FPS = 30
BPM = 130
BAR = 60 / BPM * 4
# (início_no_original, duração, tipo, zoom_inicial, zoom_final)
SEG = [
    (16.15, BAR, 'dor', 1.10, 1.18),
    (0.70, BAR, 'dor', 1.05, 1.13),
    (4.25, BAR * 2, 'ativo', 0.98, 1.06, 0.82),   # braços para cima em leve câmera lenta
    (12.60, BAR * 2, 'ativo', 0.98, 1.06),
    (17.70, BAR, 'final', 1.04, 1.12),
]

cap = cv2.VideoCapture(SRC)
SFPS = cap.get(cv2.CAP_PROP_FPS) or 30
seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=mpt.BaseOptions(model_asset_path=os.path.join(MODELOS, 'selfie_multiclass_256x256.tflite')), output_confidence_masks=True))

# ---------- fundo de estúdio ----------
def fundo(pe_x, pe_y):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H * 0.42) / (H * 0.6)) ** 2)
    base = np.clip(1 - r, 0, 1) ** 1.6
    img = np.zeros((H, W, 3), np.float32)
    img += np.array([24, 22, 20], np.float32) * base[..., None] + 4          # BGR: cinza-azulado
    # poça de luz no chão
    fl = np.exp(-(((xx - pe_x) / (W * 0.42)) ** 2 + ((yy - pe_y) / (H * 0.06)) ** 2))
    img += np.array([40, 38, 36], np.float32) * fl[..., None]
    return img

CONN_BRACO = [(11, 13), (13, 15), (12, 14), (14, 16), (15, 19), (16, 20), (15, 17), (16, 18)]
CONN_PERNA = [(23, 25), (25, 27), (24, 26), (26, 28), (27, 31), (28, 32), (27, 29), (28, 30)]

def mascara_esqueleto(lm, w, h, k=1.0, dil=15, blur=31):
    m = np.zeros((h, w), np.uint8)
    P = lambda i: (int(lm[i].x * w), int(lm[i].y * h))
    ombro = math.dist(P(11), P(12)) + 1
    tronco = np.array([P(11), P(12), P(24), P(23)], np.int32)
    cv2.fillConvexPoly(m, cv2.convexHull(tronco), 255)
    cv2.polylines(m, [tronco], True, 255, max(2, int(ombro * 0.45 * k)))
    for a, b in CONN_BRACO: cv2.line(m, P(a), P(b), 255, max(2, int(ombro * 0.5 * k)))
    for a, b in CONN_PERNA: cv2.line(m, P(a), P(b), 255, max(2, int(ombro * 0.58 * k)))
    cab = P(0); cv2.circle(m, cab, max(2, int(ombro * 0.34 * k)), 255, -1)
    cv2.line(m, cab, ((P(11)[0] + P(12)[0]) // 2, (P(11)[1] + P(12)[1]) // 2), 255, max(2, int(ombro * 0.5 * k)))
    if dil: m = cv2.dilate(m, np.ones((dil, dil), np.uint8))
    return cv2.GaussianBlur(m, (blur, blur), 0).astype(np.float32) / 255

def brilho_coluna(lm, w, h, alfa):
    """Coluna em "raio-X": vértebras vermelhas do pescoço ao quadril + brilho difuso."""
    g = np.zeros((h, w), np.float32)
    P = lambda i: np.array([lm[i].x * w, lm[i].y * h])
    ms, mh = (P(11) + P(12)) / 2, (P(23) + P(24)) / 2
    ombro = np.linalg.norm(P(11) - P(12)) + 1
    top = ms + (ms - mh) * 0.12            # um pouco acima da linha dos ombros (pescoço)
    eixo = mh - top; L = np.linalg.norm(eixo) + 1e-6; d = eixo / L
    ang = math.degrees(math.atan2(d[1], d[0])) + 90
    N = 15
    for i in range(N):
        c = top + eixo * (i + 0.5) / N
        largura = ombro * (0.045 + 0.03 * i / N)
        cv2.ellipse(g, tuple(c.astype(int)), (int(largura), max(2, int(L / N * 0.32))), ang, 0, 360, 1.0, -1, cv2.LINE_AA)
    nitido = cv2.GaussianBlur(g, (0, 0), 1.2)
    difuso = cv2.GaussianBlur(g, (0, 0), ombro * 0.09)
    lomb = np.zeros_like(g); c = mh - eixo * 0.18
    cv2.circle(lomb, tuple(c.astype(int)), int(ombro * 0.14), 1.0, -1)
    lomb = cv2.GaussianBlur(lomb, (0, 0), ombro * 0.12)
    return (nitido * 0.85 + difuso * 1.6 + lomb * 0.9) * alfa

def aneis(img, cx, cy, raio, alfa):
    if alfa <= 0.01: return
    layer = np.zeros_like(img)
    for dx in (-raio * 0.75, raio * 0.75):
        c = (int(cx + dx), int(cy))
        cv2.ellipse(layer, c, (int(raio), int(raio * 0.28)), 0, 0, 360, (200, 230, 46), 5, cv2.LINE_AA)
    glow = cv2.GaussianBlur(layer, (0, 0), 9)
    img += (layer * 0.9 + glow * 1.6) * alfa

out = sys.stdout.buffer
t_out = 0.0
quadros_teste = []
for si, (ini, dur, tipo, z0, z1, *vel) in enumerate(SEG):
    vel = vel[0] if vel else 1.0
    n = int(round(dur * FPS))
    mask_ema = None
    po = mpose.Pose(static_image_mode=False, model_complexity=2, smooth_landmarks=True)
    for k in range(n):
        ts = ini + k / FPS * vel
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(round(ts * SFPS)))
        ok, fr = cap.read()
        if not ok: break
        h, w = fr.shape[:2]
        rgb = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)
        im = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        sm = 1 - seg.segment(im).confidence_masks[0].numpy_view().astype(np.float32)
        sm = np.clip((sm - 0.3) / 0.4, 0, 1)
        # descarta fundo pela cor (só fora do miolo do corpo): parede/sombra são quentes (R > B),
        # geladeira/azulejo são brancos neutros; o boneco é cinza-azulado e a bermuda azul-marinho.
        f32 = fr.astype(np.float32); Bc, Gc, Rc = f32[..., 0], f32[..., 1], f32[..., 2]
        quente = np.clip((Rc - Bc - 3) / 8, 0, 1)
        lum = (Rc + Gc + Bc) / 3; sat = np.max(f32, 2) - np.min(f32, 2)
        branco = np.clip((lum - 214) / 14, 0, 1) * (sat < 14)
        sm = sm * (1 - np.maximum(quente, branco))
        pr = po.process(rgb)
        lm = pr.pose_landmarks.landmark if pr.pose_landmarks else None
        if lm is not None:
            core = mascara_esqueleto(lm, w, h, 0.72, 0, 9)       # miolo do corpo (sempre aceso)
            larga = mascara_esqueleto(lm, w, h, 0.98, 11, 31)    # região onde o recorte é confiável
            sm = np.maximum(core, sm * larga)
        branco_forte = np.clip((lum - 226) / 10, 0, 1) * (sat < 10)
        sm = sm * (1 - branco_forte)
        mask_ema = sm if mask_ema is None else mask_ema * 0.15 + sm * 0.85
        m = cv2.GaussianBlur(cv2.erode(mask_ema, np.ones((3, 3), np.uint8)), (0, 0), 1.6)
        halo = cv2.GaussianBlur(cv2.dilate(mask_ema, np.ones((9, 9), np.uint8)), (0, 0), 18)

        pessoa = fr.astype(np.float32)
        pessoa = (pessoa - 128) * 1.08 + 122                      # contraste leve
        pessoa *= np.array([1.03, 1.0, 0.97], np.float32)         # tom levemente frio
        u = k / max(1, n - 1)
        t_global = t_out + k / FPS
        if tipo == 'dor' and lm is not None:
            pulso = 0.75 + 0.25 * math.sin(t_global * 5.5)
            gl = brilho_coluna(lm, w, h, pulso) * m
            pessoa += gl[..., None] * np.array([40, 60, 255], np.float32)
            pessoa *= 0.93
        # escala/zoom (com "soco" de zoom no início da fase ativa)
        zoom = z0 + (z1 - z0) * u
        if si == 2 and k / FPS < 0.35: zoom *= 1 + 0.16 * math.exp(-(k / FPS) * 10)
        if lm is not None:
            cx = (lm[23].x + lm[24].x) / 2 * w
            pe = max(lm[29].y, lm[30].y, lm[31].y, lm[32].y) * h
        else:
            cx, pe = w / 2, h * 0.85
        esc = (W / w) * zoom
        # posiciona: quadril no centro horizontal; pés a ~84% da altura
        ox = W / 2 - cx * esc
        oy = H * 0.885 - h * esc            # base do vídeo original no "chão" (os pés saem do quadro original)
        M = np.float32([[esc, 0, ox], [0, esc, oy]])
        # fora do corpo: cozinha quase apagada (só um resto suave de luz em volta do corpo)
        orig = fr.astype(np.float32)
        fade = np.ones((h, 1, 1), np.float32); nf = int(h * 0.09)
        fade[h - nf:, 0, 0] = np.linspace(1, 0, nf) ** 1.4      # pernas somem no escuro do chão
        pessoa *= fade
        fora = orig * (0.03 + 0.04 * halo[..., None])
        pessoa = pessoa * m[..., None] + fora * (1 - m[..., None])
        P = cv2.warpAffine(np.clip(pessoa, 0, 255), M, (W, H), flags=cv2.INTER_CUBIC)
        quadro = cv2.warpAffine(np.ones((h, w), np.float32), M, (W, H), flags=cv2.INTER_LINEAR)
        quadro = cv2.GaussianBlur(quadro, (0, 0), 25)
        A = np.maximum(cv2.warpAffine(m, M, (W, H), flags=cv2.INTER_LINEAR), quadro * 0.0)[..., None]
        Q = quadro[..., None]
        pe_x, pe_y = W / 2, H * 0.875
        img = fundo(pe_x, pe_y)
        # sombra de contato
        sh = np.zeros((H, W), np.float32)
        cv2.ellipse(sh, (int(pe_x), int(pe_y)), (int(W * 0.17), int(H * 0.012)), 0, 0, 360, 1.0, -1)
        sh = cv2.GaussianBlur(sh, (0, 0), 22)
        img *= (1 - 0.75 * sh[..., None])
        if tipo != 'dor':
            on = min(1.0, (t_global - BAR * 2 - 0.15) / 0.4) if si == 2 else 1.0
            batida = 0.8 + 0.2 * math.cos(t_global / (60 / BPM) * math.pi * 2)
            aneis(img, pe_x, pe_y + 6, W * 0.085 * zoom / 1.35, max(0, on) * batida)
        img = img * (1 - Q) + np.maximum(img, P) * Q * (1 - A) + P * A
        f8 = np.clip(img, 0, 255).astype(np.uint8)
        if TESTE:
            if k == n // 2: quadros_teste.append(cv2.resize(f8, (270, 480)))
            continue
        out.write(f8.tobytes())
    t_out += n / FPS
if TESTE:
    cv2.imwrite(sys.argv[2], np.hstack(quadros_teste))
print('fim', t_out, file=sys.stderr)
