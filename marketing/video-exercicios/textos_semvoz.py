"""Textos do vídeo sem narração (só música do TikTok). Tudo em branco. Uso: python textos_semvoz.py saida.ass"""
import sys

FIM = 19.6
T_CARD = 15.55


def ts(t):
    t = max(0.0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


ev = []
add = lambda est, a, z, txt, layer=0: ev.append((layer, est, a, z, txt))
pop = r"\fscx88\fscy88\t(0,160,\fscx100\fscy100)"

add("Topo", 0.25, 4.05, r"{\an5\pos(540,1560)\fad(200,150)" + pop + r"}quando você tenta\Npegar algo no chão...")
add("Topo", 6.1, 12.05, r"{\an5\pos(540,1560)\fad(200,150)" + pop + r"}5 minutinhos por dia")
add("Topo", 12.15, T_CARD - 0.1, r"{\an5\pos(540,1560)\fad(200,150)" + pop + r"}alguns dias depois...")
add("Aviso", 0.0, T_CARD, r"{\an3\pos(1040,1880)}personagem ilustrativo")

# flash branco da transição
add("Fundo", 5.96, 6.32, r"{\an7\pos(0,0)\1c&HFFFFFF&\bord0\shad0\fad(0,300)\p1}m 0 0 l 1080 0 1080 1920 0 1920{\p0}", 4)

# cartão final: tela preta, letras brancas
add("Fundo", T_CARD - 0.2, FIM, r"{\an7\pos(0,0)\1c&H000000&\bord0\shad0\fad(200,0)\p1}m 0 0 l 1080 0 1080 1920 0 1920{\p0}", 5)
add("Comente", T_CARD + 0.1, FIM, r"{\an5\pos(540,780)\fscx90\fscy90\t(0,400,\fscx100\fscy100)\fad(300,0)}Comente", 6)
add("Quero", T_CARD + 0.45, FIM, r"{\an5\pos(540,910)\fscx75\fscy75\t(0,260,\fscx105\fscy105)\t(260,420,\fscx100\fscy100)\t(1400,1800,\fscx104\fscy104)\t(1800,2200,\fscx100\fscy100)\fad(150,0)}EU QUERO", 6)
add("Kicker", T_CARD + 1.2, FIM, r"{\an5\pos(540,1050)\fad(350,0)}que eu te mando o", 6)
add("Metodo", T_CARD + 1.55, FIM, r"{\an5\pos(540,1140)\fscx92\fscy92\t(0,400,\fscx100\fscy100)\fad(350,0)}Método Coluna Nova em 30 dias", 6)

cab = r"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Topo,Montserrat ExtraBold,76,&H00FFFFFF,&H00FFFFFF,&H00000000,&H70000000,0,0,0,0,100,100,0,0,1,5,3,5,50,50,0,1
Style: Aviso,Montserrat SemiBold,28,&H60FFFFFF,&H60FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,2,0,3,0,0,0,1
Style: Fundo,Montserrat Black,40,&H00000000,&H00000000,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Comente,Montserrat ExtraBold,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,40,40,0,1
Style: Quero,Montserrat Black,150,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,0,0,5,40,40,0,1
Style: Kicker,Montserrat SemiBold,54,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,1,0,1,0,0,5,40,40,0,1
Style: Metodo,Montserrat ExtraBold,66,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(sys.argv[1], "w", encoding="utf-8") as f:
    f.write(cab)
    for layer, est, a, z, txt in sorted(ev, key=lambda e: (e[2], e[0])):
        f.write(f"Dialogue: {layer},{ts(a)},{ts(z)},{est},,0,0,0,,{txt}\n")
print("ok", len(ev))
