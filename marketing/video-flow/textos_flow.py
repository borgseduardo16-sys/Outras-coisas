"""Legendas/textos (ASS, 1080x1920) do vídeo do Flow. Uso: python textos_flow.py saida.ass"""
import sys

T_TRANS, T_CARD, FIM = 7.5, 13.9, 16.6
BEAT = 60 / 128
VERM = r"{\c&H3D4AFF&}"
TEAL = r"{\c&HC8E62E&}"
BR = r"{\c&HFFFFFF&}"


def ts(t):
    t = max(0.0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


ev = []


def pop(a, z, txt, y, est="Leg", esc=100):
    ev.append((est, a, z, r"{\an5\pos(540,%d)\fscx%d\fscy%d\t(0,110,\fscx%d\fscy%d)\fad(0,80)}" % (y, esc + 22, esc + 22, esc, esc) + txt))


# --- Parte 1: dor (texto no alto, sobre o fundo escuro) ---
pop(0.05, 2.45, "DOR NA " + VERM + "COLUNA" + BR + r"\N" + r"{\fs62}toda vez que se abaixa?", 235, "Gancho")
pop(2.50, 4.95, "TRAVA SÓ DE" + r"\N" + VERM + "PEGAR ALGO" + BR + " NO CHÃO?", 235, "Gancho")
pop(5.00, T_TRANS - 0.02, "OLHA ESSA" + r"\N" + TEAL + "ROTINA" + BR + " DE 5 MIN", 235, "Gancho")

# flash branco na transição
ev.append(("Leg", T_TRANS - 0.04, T_TRANS + 0.30,
           r"{\an7\pos(0,0)\1c&HFFFFFF&\bord0\shad0\alpha&H10&\fad(0,260)\p1}m 0 0 l 1080 0 1080 1920 0 1920{\p0}"))

# --- Parte 2: treino rápido, palavras no tempo da música ---
blocos = [
    ("5 MINUTOS", "por dia"),
    ("EM CASA", "sem equipamento"),
    ("PASSO A PASSO", "é só apertar o play"),
]
t = T_TRANS + 0.05
dur = BEAT * 3
for grande, peq in blocos:
    pop(t, t + dur - 0.03, grande, 215, "Grande")
    pop(t + 0.12, t + dur - 0.03, peq, 325, "Sub")
    t += dur
pop(t, T_CARD, "SUA " + TEAL + "COLUNA" + BR + r"\N" + "VAI AGRADECER", 250, "Gancho")

# --- Cartão final ---
ev.append(("Kicker", T_CARD + 0.10, FIM, r"{\an5\pos(540,700)\fad(250,0)}DESAFIO 31 DIAS"))
ev.append(("Card", T_CARD + 0.15, FIM,
           r"{\an5\pos(540,860)\fscx120\fscy120\t(0,180,\fscx100\fscy100)\fad(150,0)}Método " + TEAL + "Coluna Nova"))
ev.append(("Card2", T_CARD + 0.55, FIM,
           r"{\an5\pos(540,1010)\fscx120\fscy120\t(0,160,\fscx100\fscy100)\fad(150,0)}link na descrição"))
# seta animada apontando para baixo
for k in range(3):
    a = T_CARD + 0.9 + k * 0.12
    ev.append(("Seta", a, FIM, r"{\an5\pos(540,%d)\fad(200,0)\bord0\shad0\p1}m 0 0 l 36 30 l 72 0 l 72 14 l 36 44 l 0 14{\p0}" % (1135 + k * 46)))

cab = r"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Leg,Montserrat Black,80,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,0,0,5,40,40,0,1
Style: Gancho,Montserrat Black,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,4,5,5,40,40,0,1
Style: Grande,Montserrat Black,120,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,2,0,1,4,5,5,40,40,0,1
Style: Sub,Montserrat Bold,66,&H00C8E62E,&H00C8E62E,&H00000000,&H90000000,0,0,0,0,100,100,1,0,1,3,3,5,40,40,0,1
Style: Kicker,Montserrat SemiBold,44,&H00D0D0D0,&H00D0D0D0,&H00000000,&H90000000,0,0,0,0,100,100,8,0,1,0,3,5,40,40,0,1
Style: Card,Montserrat ExtraBold,112,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,0,5,5,40,40,0,1
Style: Card2,Montserrat ExtraBold,84,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,0,4,5,40,40,0,1
Style: Seta,Montserrat Black,90,&H00C8E62E,&H00C8E62E,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,0,0,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(sys.argv[1], "w", encoding="utf-8") as f:
    f.write(cab)
    for est, a, z, txt in sorted(ev, key=lambda e: e[1]):
        f.write(f"Dialogue: 0,{ts(a)},{ts(z)},{est},,0,0,0,,{txt}\n")
print("ok", len(ev))
