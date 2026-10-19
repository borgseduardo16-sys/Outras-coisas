"""Legendas do criativo em vídeo (ASS 1080x1920), sincronizadas com a locução e flashes nos cortes.
Uso: python legendas.py saida.ass"""
import sys

saida = sys.argv[1]
V = r"{\c&H3B30FF&}"   # vermelho do anúncio (BGR)
B = r"{\c&HFFFFFF&}"


def ts(t):
    return f"0:{int(t // 60):02d}:{t % 60:05.2f}"


# (início, fim, texto)
FALAS = [
    (0.00, 1.85, f"{V}DOR NA COLUNA{B}\\NNÃO AVISA"),
    (2.14, 4.60, f"ELA TE {V}TRAVA{B} NO MEIO\\NDE UMA TAREFA SIMPLES"),
    (4.99, 6.95, "VOCÊ DEITA,\\NESPERA PASSAR..."),
    (7.21, 7.98, "TOMA ALGO..."),
    (8.37, 9.70, f"MAS ELA SEMPRE\\N{V}VOLTA{B}"),
    (10.15, 11.65, "E SEMPRE NA\\NPIOR HORA"),
    (12.06, 14.72, "NA RUA, NO TRABALHO,\\NNA HORA DE SENTAR"),
    (15.17, 18.10, f"MAS EXISTE UM\\N{V}MÉTODO SIMPLES{B}\\NQUE POUCA GENTE CONHECE"),
]
CORTES = (4.78, 11.83, 18.28)

ev = []
for a, z, txt in FALAS:
    ev.append((2, "Fala", a, z, r"{\an5\pos(540,1290)\fscx88\fscy88\t(0,200,\fscx100\fscy100)\fad(120,90)}" + txt))
for t in CORTES:
    ev.append((1, "Flash", t - 0.04, t + 0.26, r"{\an7\pos(0,0)\1c&HFFFFFF&\bord0\shad0\alpha&H50&\fad(0,240)\p1}m 0 0 l 1080 0 1080 1920 0 1920{\p0}"))

cab = r"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Fala,Montserrat Black,78,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,7,3,5,60,60,0,1
Style: Flash,Montserrat Black,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(saida, "w", encoding="utf-8") as f:
    f.write(cab)
    for layer, est, a, z, txt in ev:
        f.write(f"Dialogue: {layer},{ts(a)},{ts(z)},{est},,0,0,0,,{txt}\n")
print("ok")
