"""Adiciona a coluna vermelha em "raio-X" no clipe da dor (Google Flow, fundo preto).
Uso: python coluna_flow.py entrada.mp4 saida.mp4
A máscara do corpo vem da luminância (manequim claro sobre fundo preto), sem recorte.
"""
import sys, math
import cv2
import numpy as np
from mediapipe.python.solutions import pose as mpose

ent, sai = sys.argv[1], sys.argv[2]
cap = cv2.VideoCapture(ent)
fps = cap.get(cv2.CAP_PROP_FPS)
w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
out = cv2.VideoWriter(sai, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
po = mpose.Pose(static_image_mode=False, model_complexity=2, smooth_landmarks=True)

IDX = (11, 12, 23, 24)
suave = None


def brilho(P, alfa, pulso):
    g = np.zeros((h, w), np.float32)
    ms, mh = (P[11] + P[12]) / 2, (P[23] + P[24]) / 2
    ombro = np.linalg.norm(P[11] - P[12]) + 1
    ombro = max(ombro, np.linalg.norm(ms - mh) * 0.55)   # de perfil os ombros "somem"
    top = ms + (ms - mh) * 0.10
    eixo = mh - top; L = np.linalg.norm(eixo) + 1e-6; d = eixo / L
    ang = math.degrees(math.atan2(d[1], d[0])) + 90
    N = 15
    for i in range(N):
        c = top + eixo * (i + 0.5) / N
        larg = ombro * (0.05 + 0.03 * i / N)
        cv2.ellipse(g, tuple(c.astype(int)), (int(larg), max(2, int(L / N * 0.32))), ang, 0, 360, 1.0, -1, cv2.LINE_AA)
    nitido = cv2.GaussianBlur(g, (0, 0), 1.0)
    difuso = cv2.GaussianBlur(g, (0, 0), ombro * 0.10)
    lomb = np.zeros_like(g); c = mh - eixo * 0.16
    cv2.circle(lomb, tuple(c.astype(int)), int(ombro * 0.16), 1.0, -1)
    lomb = cv2.GaussianBlur(lomb, (0, 0), ombro * 0.13)
    return (nitido * 0.9 + difuso * 1.5 + lomb * (0.8 + 0.7 * pulso)) * alfa


i = 0
while True:
    ok, im = cap.read()
    if not ok:
        break
    t = i / fps
    r = po.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    if r.pose_landmarks:
        lm = r.pose_landmarks.landmark
        P = {k: np.array([lm[k].x * w, lm[k].y * h]) for k in IDX}
        suave = P if suave is None else {k: suave[k] * 0.55 + P[k] * 0.45 for k in IDX}
    alfa = min(1.0, max(0.0, (t - 0.6) / 0.8))          # acende quando ele começa a curvar
    if suave is not None and alfa > 0:
        pulso = 0.5 + 0.5 * math.sin(t * 2 * math.pi * 1.6)
        gl = brilho(suave, alfa, pulso)
        cinza = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
        corpo = np.clip((cinza - 35) / 40, 0, 1)
        corpo = cv2.GaussianBlur(cv2.dilate(corpo, np.ones((9, 9), np.uint8)), (0, 0), 3)
        gl = gl * (0.25 + 0.75 * corpo)
        f = im.astype(np.float32)
        # escurece levemente o corpo sob a coluna para o vermelho "acender" e soma o brilho
        f *= (1 - 0.35 * np.clip(gl, 0, 1))[..., None]
        f += gl[..., None] * np.array([40, 55, 255], np.float32) * 0.95
        im = np.clip(f, 0, 255).astype(np.uint8)
    out.write(im)
    i += 1
out.release()
print("ok", i)
