"""Gera textos.ass (legendas no estilo da inspiração: texto grande, branco, no topo)."""
import sys
BEAT = 60 / 135; BAR = BEAT * 4
T_DROP, T_FINAL, T_FIM3D, FIM = BAR * 2, BAR * 5, BAR * 6, BAR * 7
VERM, TEAL, BR = r"{\c&H3D4AFF&}", r"{\c&HC8E62E&}", r"{\c&HFFFFFF&}"

def ts(t):
    t = max(0, t); return f"{int(t//3600)}:{int(t%3600//60):02d}:{t%60:05.2f}"

ev = []
def topo(a, z, txt, fade=(120, 120)):
    ev.append((a, z, "Topo", r"{\an8\pos(540,250)\fad(%d,%d)\fscx96\fscy96\t(0,160,\fscx100\fscy100)}" % fade + txt))

topo(0.15, T_DROP - 0.05, "Coluna " + VERM + "travada?", (200, 60))
topo(T_DROP + 0.12, T_FINAL - 0.05, "5 minutinhos" + BR + "\\Npor dia", (80, 100))
ev[-1] = (ev[-1][0], ev[-1][1], "Topo", ev[-1][3].replace("5 minutinhos", TEAL + "5 minutinhos"))
topo(T_FINAL + 0.05, T_FIM3D - 0.1, "Sua coluna\\Nvai " + TEAL + "agradecer", (100, 150))
# flash na virada
ev.append((T_DROP - 0.02, T_DROP + 0.3, "Flash", r"{\an7\pos(0,0)\alpha&H50&\fad(0,280)\p1}m 0 0 l 1080 0 1080 1920 0 1920{\p0}"))
# cartão final
ev.append((T_FIM3D + 0.1, FIM, "Card", r"{\an5\pos(540,880)\fad(250,0)}Desafio 31 Dias"))
ev.append((T_FIM3D + 0.3, FIM, "Card2", r"{\an5\pos(540,1010)\fad(250,0)}link na bio"))

cab = r"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Topo,Montserrat ExtraBold,96,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,0,4,8,40,40,0,1
Style: Flash,Montserrat ExtraBold,10,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Card,Montserrat ExtraBold,108,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,40,40,0,1
Style: Card2,Montserrat ExtraBold,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(sys.argv[1] if len(sys.argv) > 1 else "textos.ass", "w", encoding="utf-8") as f:
    f.write(cab)
    for a, z, st, tx in sorted(ev):
        f.write(f"Dialogue: {1 if st=='Flash' else 0},{ts(a)},{ts(z)},{st},,0,0,0,,{tx}\n")
print("ok")
