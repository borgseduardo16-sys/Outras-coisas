"""Textos do vídeo "A jornada do João" — versão "comenta EU QUERO" (ASS 1080x1920). Uso: python textos_joao_euquero.py saida.ass"""
import sys

FIM = 19.9
T_CARD = 16.1
AMARELO = r"{\c&H66D1FF&}"
TEAL = r"{\c&HC8E62E&}"
BR = r"{\c&HFFFFFF&}"


def ts(t):
    t = max(0.0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


ev = []
add = lambda est, a, z, txt, layer=0: ev.append((layer, est, a, z, txt))


def destaque(txt):
    return "".join(((AMARELO if i % 2 else BR) + p) for i, p in enumerate(txt.split("*")))


def rrect(w, h, r):
    return (f"m {r} 0 l {w - r} 0 b {w} 0 {w} 0 {w} {r} l {w} {h - r} b {w} {h} {w} {h} {w - r} {h} "
            f"l {r} {h} b 0 {h} 0 {h} 0 {h - r} l 0 {r} b 0 0 0 0 {r} 0")


# ---------- Legendas da fala ----------
FALA = [
    (1.50, 5.07, ["ELE TRAVAVA A *COLUNA*", "SÓ DE SE ABAIXAR", "PRA PEGAR ALGO NO CHÃO"]),
    (5.70, 6.93, ["AÍ ELE COMEÇOU", "UM *DESAFIO*"]),
    (7.35, 9.49, ["*5 MINUTINHOS* POR DIA", "EM CASA"]),
    (10.14, 11.88, ["HOJE É O *DIA 10*", "DO JOÃO"]),
    (12.25, 13.94, ["E OLHA COMO", "ELE JÁ SE *MEXE*"]),
    (14.52, 15.72, ["QUER SABER O QUE", "O *JOÃO* FEZ?"]),
]
for ini, fim, blocos in FALA:
    pesos = [len(b.replace("*", "")) + 5 for b in blocos]
    tot, t = sum(pesos), ini
    for j, (b, p) in enumerate(zip(blocos, pesos)):
        d = (fim - ini) * p / tot
        z = t + d + (0.15 if j == len(blocos) - 1 else -0.01)
        add("Leg", t, z, r"{\an5\pos(540,1530)\fscx86\fscy86\t(0,100,\fscx100\fscy100)}" + destaque(b))
        t += d

# ---------- Apresentação ----------
add("Gancho", 0.0, 1.5, r"{\an5\pos(540,300)\fscx135\fscy135\t(0,200,\fscx100\fscy100)}ESSE É O " + TEAL + "JOÃO")

# ---------- Selo do dia + barra de progresso (31 dias) ----------
PW, PH, YP = 300, 86, 128
BW, BH, YB = 560, 12, 222
DIAS = [(1.5, 5.7, "ANTES", None, "&H3D4AFF&"), (5.7, 6.85, "DIA 1", 1, None), (6.85, 8.0, "DIA 3", 3, None),
        (8.0, 9.15, "DIA 6", 6, None), (9.15, 10.15, "DIA 8", 8, None), (10.15, T_CARD, "DIA 10", 10, None)]
for a, z, rot, dia, cor in DIAS:
    fundo = cor or "&HC8E62E&"
    pop = r"\fscx80\fscy80\t(0,140,\fscx106\fscy106)\t(140,260,\fscx100\fscy100)"
    add("Desenho", a, z, r"{\an7\pos(%d,%d)\1c%s\bord0\shad2\4a&H80&%s\p1}%s{\p0}" % ((1080 - PW) // 2, YP - PH // 2, fundo, pop, rrect(PW, PH, 30)), 1)
    add("Dia", a, z, r"{\an5\pos(540,%d)%s\1c%s}%s" % (YP + 3, pop, "&HFFFFFF&" if cor else "&H101010&", rot), 2)
    if dia:
        x0 = (1080 - BW) // 2
        add("Desenho", a, z, r"{\an7\pos(%d,%d)\1c&HFFFFFF&\1a&H90&\bord0\shad0\p1}%s{\p0}" % (x0, YB, rrect(BW, BH, 6)), 1)
        add("Desenho", a, z, r"{\an7\pos(%d,%d)\1c&HC8E62E&\bord0\shad0\p1}%s{\p0}" % (x0, YB, rrect(max(BH, int(BW * dia / 31)), BH, 6)), 2)
        add("Mini", a, z, r"{\an5\pos(540,%d)}%d de 31 dias" % (YB + 42, dia), 2)

add("Aviso", 0.0, T_CARD, r"{\an3\pos(1040,1880)}personagem ilustrativo")

# ---------- Cartão final ----------
add("Fundo", T_CARD - 0.22, FIM, r"{\an7\pos(0,0)\1c&H000000&\bord0\shad0\fad(220,0)\p1}m 0 0 l 1080 0 1080 1920 0 1920{\p0}", 5)
add("Card2", T_CARD + 0.08, FIM, r"{\an5\pos(540,800)\fscx92\fscy92\t(0,400,\fscx100\fscy100)\fad(300,0)}Comenta", 6)
add("Quero", T_CARD + 0.55, FIM, r"{\an5\pos(540,930)\fscx70\fscy70\t(0,260,\fscx106\fscy106)\t(260,420,\fscx100\fscy100)\t(1300,1700,\fscx104\fscy104)\t(1700,2100,\fscx100\fscy100)\fad(150,0)}EU QUERO", 6)
add("Kicker", 17.5, FIM, r"{\an5\pos(540,1060)\fad(350,0)}que eu te mando o método", 6)

cab = r"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Leg,Montserrat Black,84,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,6,3,5,50,50,0,1
Style: Gancho,Montserrat Black,112,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,1,0,1,6,4,5,40,40,0,1
Style: Dia,Montserrat Black,58,&H00101010,&H00101010,&H00000000,&H80000000,0,0,0,0,100,100,2,0,1,0,0,5,0,0,0,1
Style: Mini,Montserrat Bold,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,1,0,1,3,2,5,0,0,0,1
Style: Desenho,Montserrat Black,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Fundo,Montserrat Black,40,&H00000000,&H00000000,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Aviso,Montserrat SemiBold,28,&H60FFFFFF,&H60FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,2,0,3,0,0,0,1
Style: Card,Montserrat ExtraBold,104,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,0,5,5,40,40,0,1
Style: Quero,Montserrat Black,150,&H00C8E62E,&H00C8E62E,&H00000000,&H90000000,0,0,0,0,100,100,2,0,1,0,6,5,40,40,0,1
Style: Kicker,Montserrat SemiBold,50,&H00DDDDDD,&H00DDDDDD,&H00000000,&H90000000,0,0,0,0,100,100,1,0,1,0,3,5,40,40,0,1
Style: Card2,Montserrat ExtraBold,84,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,0,4,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(sys.argv[1], "w", encoding="utf-8") as f:
    f.write(cab)
    for layer, est, a, z, txt in sorted(ev, key=lambda e: (e[2], e[0])):
        f.write(f"Dialogue: {layer},{ts(a)},{ts(z)},{est},,0,0,0,,{txt}\n")
print("ok", len(ev))
