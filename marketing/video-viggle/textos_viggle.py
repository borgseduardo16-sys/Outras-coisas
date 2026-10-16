"""Textos do vídeo Viggle (estilo da inspiração: texto grande, branco, no topo) + cartão final."""
import sys
BEAT = 60 / 130; BAR = BEAT * 4
T_DROP, T_FIM3D, FIM = BAR * 2, BAR * 7, BAR * 8
VERM, TEAL, BR = r"{\c&H3D4AFF&}", r"{\c&HC8E62E&}", r"{\c&HFFFFFF&}"

def ts(t):
    t = max(0, t); return f"{int(t//3600)}:{int(t%3600//60):02d}:{t%60:05.2f}"

ev = []
def topo(a, z, txt, fade=(120, 100)):
    ev.append((a, z, "Topo", r"{\an8\pos(540,235)\fad(%d,%d)\fscx94\fscy94\t(0,170,\fscx100\fscy100)}" % fade + txt))

topo(0.15, T_DROP - 0.04, "Sofrendo com\\N" + VERM + "dor na coluna?", (220, 50))
topo(T_DROP + 0.10, BAR * 4 - 0.04, TEAL + "5 minutinhos" + BR + "\\Npor dia")
topo(BAR * 4 + 0.04, BAR * 6 - 0.04, "Em casa,\\N" + TEAL + "sem equipamento")
topo(BAR * 6 + 0.04, T_FIM3D - 0.08, "Sua coluna\\Nvai " + TEAL + "agradecer", (100, 140))
ev.append((T_DROP - 0.02, T_DROP + 0.32, "Flash", r"{\an7\pos(0,0)\alpha&H40&\fad(0,300)\p1}m 0 0 l 1080 0 1080 1920 0 1920{\p0}"))
ev.append((T_FIM3D + 0.08, FIM, "Card", r"{\an5\pos(540,860)\fad(250,0)\fscx94\fscy94\t(0,200,\fscx100\fscy100)}Método " + TEAL + "Coluna Nova"))
ev.append((T_FIM3D + 0.32, FIM, "Card2", r"{\an5\pos(540,1010)\fad(250,0)}link na descrição"))

cab = r"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Topo,Montserrat ExtraBold,108,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,0,4,8,40,40,0,1
Style: Flash,Montserrat ExtraBold,10,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Card,Montserrat ExtraBold,112,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,40,40,0,1
Style: Card2,Montserrat ExtraBold,84,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(sys.argv[1] if len(sys.argv) > 1 else "textos_viggle.ass", "w", encoding="utf-8") as f:
    f.write(cab)
    for a, z, st, tx in sorted(ev):
        f.write(f"Dialogue: {1 if st=='Flash' else 0},{ts(a)},{ts(z)},{st},,0,0,0,,{tx}\n")
print("ok")
