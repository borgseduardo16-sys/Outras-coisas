"""Legendas fixas do vídeo POV (ASS 1080x1920) + flashes das transições do meio dos clipes.
Uso: python textos_pov.py saida.ass "texto de cima" "texto de baixo"
"""
import sys

FIM = 15.6
saida, cima, baixo = sys.argv[1], sys.argv[2], sys.argv[3]


def ts(t):
    return f"0:{int(t // 60):02d}:{t % 60:05.2f}"


ev = [
    (2, "Cima", 0.0, FIM, r"{\an5\pos(540,330)\fscx90\fscy90\t(0,250,\fscx100\fscy100)\fad(200,0)}" + cima),
    (2, "Baixo", 0.6, FIM, r"{\an5\pos(540,1440)\fscx90\fscy90\t(0,250,\fscx100\fscy100)\fad(200,0)}" + baixo),
]
# flash branco rápido nas transições do meio de cada clipe (4 s e 11,6 s); a troca de clipe usa o zoom do xfade
for t in (3.96, 11.56):
    ev.append((1, "Flash", t, t + 0.32, r"{\an7\pos(0,0)\1c&HFFFFFF&\bord0\shad0\alpha&H30&\fad(0,280)\p1}m 0 0 l 1080 0 1080 1920 0 1920{\p0}"))

cab = r"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cima,Montserrat ExtraBold,68,&H00FFFFFF,&H00FFFFFF,&H50000000,&H00000000,0,0,0,0,100,100,0,0,3,18,0,5,120,120,0,1
Style: Baixo,Montserrat ExtraBold,68,&H00FFFFFF,&H00FFFFFF,&H50000000,&H00000000,0,0,0,0,100,100,0,0,3,18,0,5,120,120,0,1
Style: Flash,Montserrat Black,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(saida, "w", encoding="utf-8") as f:
    f.write(cab)
    for layer, est, a, z, txt in ev:
        f.write(f"Dialogue: {layer},{ts(a)},{ts(z)},{est},,0,0,0,,{txt}\n")
print("ok")
