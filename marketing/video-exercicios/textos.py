"""Textos do vídeo "3 exercícios para a coluna" (ASS 1080x1920), sincronizados com a narração.
Uso: python textos.py saida.ass
"""
import sys

FIM = 50.2
T_CARD = 43.72
AMARELO = r"{\c&H66D1FF&}"
TEAL = r"{\c&HC8E62E&}"
BR = r"{\c&HFFFFFF&}"


def ts(t):
    t = max(0.0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


ev = []


def add(est, a, z, txt, layer=0):
    ev.append((layer, est, a, z, txt))


def destaque(txt, cor=AMARELO):
    partes = txt.split("*")
    return "".join(((cor if i % 2 else BR) + p) for i, p in enumerate(partes))


# ---------- Legendas da fala (blocos curtos, tempo proporcional ao texto) ----------
FALA = [
    (0.02, 0.66, ["FAÇA ESSES"]),
    (0.78, 2.68, ["*3 EXERCÍCIOS*", "SE VOCÊ QUER MANTER"]),
    (2.78, 4.08, ["SUA *COLUNA* SAUDÁVEL"]),
    (4.38, 5.32, ["E FICA ATÉ O FINAL"]),
    (5.52, 9.08, ["QUE EU TE CONTO", "O *SEGREDO*", "QUE FEZ A MINHA COLUNA", "*PARAR DE DOER*"]),
    (9.63, 10.05, ["PRIMEIRO:"]),
    (10.32, 11.38, ["*GATO E CAMELO*"]),
    (11.78, 15.22, ["DE QUATRO APOIOS", "ARREDONDA AS COSTAS", "BEM *DEVAGAR*"]),
    (15.9, 17.92, ["E DEPOIS SOLTA", "OLHANDO PRA FRENTE"]),
    (18.34, 19.23, ["*DEZ VEZES*"]),
    (19.67, 20.19, ["SEGUNDO:"]),
    (20.48, 22.92, ["DEITA", "ABRAÇA OS *JOELHOS*", "NO PEITO"]),
    (23.34, 24.48, ["E RESPIRA FUNDO"]),
    (25.0, 26.56, ["SEGURA *30 SEGUNDOS*"]),
    (27.02, 28.38, ["TERCEIRO:", "*A PONTE*"]),
    (28.74, 31.45, ["PÉS NO CHÃO", "SOBE O QUADRIL", "*DEVAGAR*"]),
    (31.94, 32.48, ["E DESCE"]),
    (32.85, 33.73, ["*DEZ VEZES*"]),
    (34.19, 34.82, ["E O *SEGREDO*?"]),
    (35.2, 37.23, ["NÃO É SÓ FAZER", "EXERCÍCIO TODO DIA"]),
    (37.47, 40.12, ["É SEGUIR UM *MÉTODO*", "FEITO COM UMA", "*PROFISSIONAL*"]),
    (40.3, 43.44, ["PRA ALIVIAR", "DE VERDADE", "ESSAS DORES CHATAS", "NA *COLUNA*"]),
]
for ini, fim, blocos in FALA:
    pesos = [len(b.replace("*", "")) + 5 for b in blocos]
    tot, t = sum(pesos), ini
    for j, (b, p) in enumerate(zip(blocos, pesos)):
        d = (fim - ini) * p / tot
        z = t + d + (0.12 if j == len(blocos) - 1 else -0.01)
        add("Leg", t, z, r"{\an5\pos(540,1530)\fscx86\fscy86\t(0,100,\fscx100\fscy100)}" + destaque(b))
        t += d


# ---------- Desenhos ----------
def rrect(w, h, r):
    return (f"m {r} 0 l {w - r} 0 b {w} 0 {w} 0 {w} {r} l {w} {h - r} b {w} {h} {w} {h} {w - r} {h} "
            f"l {r} {h} b 0 {h} 0 {h} 0 {h - r} l 0 {r} b 0 0 0 0 {r} 0")


CADEADO = "m 0 22 l 34 22 l 34 50 l 0 50 m 5 22 l 5 13 b 5 -3 29 -3 29 13 l 29 22 l 23 22 l 23 13 b 23 5 11 5 11 13 l 11 22"
CADEADO_ABERTO = "m 0 22 l 34 22 l 34 50 l 0 50 m 5 22 l 5 5 b 5 -11 29 -11 29 5 l 29 9 l 23 9 l 23 5 b 23 -3 11 -3 11 5 l 11 22"
CHECK = "m 0 14 l 7 7 l 15 15 l 31 -1 l 38 6 l 15 29"

# ---------- Contador de etapas no topo: 1 · 2 · 3 · cadeado ----------
PW, PH, GAP = 150, 70, 22
X0 = (1080 - (4 * PW + 3 * GAP)) // 2
YP = 120
# estado de cada etapa ao longo do tempo: (início, fim, ativo[0..3], feitos)
ESTADOS = [
    (1.35, 2.30, 0, set()), (2.30, 3.25, 1, set()), (3.25, 4.30, 2, set()),
    (4.30, 9.45, 3, set()),
    (9.45, 19.5, 0, set()), (19.5, 26.9, 1, {0}), (26.9, 34.15, 2, {0, 1}),
    (34.15, T_CARD, 3, {0, 1, 2}),
]
for a, z, ativo, feitos in ESTADOS:
    for i in range(4):
        x = X0 + i * (PW + GAP)
        on, done = i == ativo, i in feitos
        if on:
            fundo, alfa = "&HC8E62E&", "&H00&"
        elif done:
            fundo, alfa = "&HFFFFFF&", "&H30&"
        else:
            fundo, alfa = "&H101010&", "&H50&"
        anim = r"\t(0,160,\fscx104\fscy104)\t(160,320,\fscx100\fscy100)" if on else ""
        add("Desenho", a, z, r"{\an7\pos(%d,%d)\1c%s\1a%s\bord0\shad0%s\p1}%s{\p0}" % (x, YP, fundo, alfa, anim, rrect(PW, PH, 22)), 1)
        cor_icone = "&H101010&" if (on or done) else "&HFFFFFF&"
        if i < 3:
            if done and not on:
                add("Desenho", a, z, r"{\an7\pos(%d,%d)\1c%s\bord0\shad0\p1}%s{\p0}" % (x + PW // 2 - 19, YP + 20, "&H2E9C2E&", CHECK), 2)
            else:
                add("Etapa", a, z, r"{\an5\pos(%d,%d)\1c%s}%d" % (x + PW // 2, YP + PH // 2 + 2, cor_icone, i + 1), 2)
        else:
            aberto = a >= 34.15
            pulso = r"\t(0,300,\fscx115\fscy115)\t(300,600,\fscx100\fscy100)" if (on and not aberto) else ""
            add("Desenho", a, z, r"{\an7\pos(%d,%d)\1c%s\bord0\shad0%s\p1}%s{\p0}" % (x + PW // 2 - 17, YP + 10, cor_icone, pulso, CADEADO_ABERTO if aberto else CADEADO), 2)

# ---------- Títulos ----------
add("Gancho", 0.0, 1.35, r"{\an5\pos(540,330)\fscx130\fscy130\t(0,180,\fscx100\fscy100)}" + "3 EXERCÍCIOS" + r"\N" + AMARELO + "PRA SUA COLUNA")
for a, z, nome in [(1.35, 2.3, "GATO E CAMELO"), (2.3, 3.25, "JOELHOS AO PEITO"), (3.25, 4.3, "PONTE")]:
    add("Titulo", a, z, r"{\an5\pos(540,300)\fscx115\fscy115\t(0,120,\fscx100\fscy100)}" + nome)
add("Titulo", 4.35, 9.45, r"{\an5\pos(540,300)\fad(150,0)\fscx115\fscy115\t(0,160,\fscx100\fscy100)}" + "SEGREDO NO FINAL")
add("Sub", 4.5, 9.45, r"{\an5\pos(540,372)\fad(200,0)}fica até o fim do vídeo")
TITULOS = [
    (9.55, 19.45, "1 · GATO E CAMELO", "10 vezes · bem devagar"),
    (19.6, 26.85, "2 · JOELHOS AO PEITO", "segure 30 segundos"),
    (27.0, 34.1, "3 · PONTE", "10 vezes"),
    (34.25, T_CARD, "O SEGREDO", ""),
]
for a, z, tit, sub in TITULOS:
    add("Titulo", a, z, r"{\an5\pos(540,300)\fad(150,0)\fscx112\fscy112\t(0,160,\fscx100\fscy100)}" + tit)
    if sub:
        add("Sub", a + 0.15, z, r"{\an5\pos(540,372)\fad(200,0)}" + sub)

# ---------- Cartão final (tela preta simples) ----------
add("Fundo", T_CARD - 0.25, FIM, r"{\an7\pos(0,0)\1c&H000000&\bord0\shad0\fad(250,0)\p1}m 0 0 l 1080 0 1080 1920 0 1920{\p0}", 5)
add("Card", T_CARD + 0.1, FIM, r"{\an5\pos(540,820)\fscx92\fscy92\t(0,450,\fscx100\fscy100)\fad(350,0)}Desafio " + TEAL + "31 Dias", 6)
add("Card2", 44.4, FIM, r"{\an5\pos(540,960)\fscx92\fscy92\t(0,450,\fscx100\fscy100)\fad(350,0)}link no perfil", 6)
add("Kicker", 46.5, FIM, r"{\an5\pos(540,1090)\fad(300,0)}por apenas", 6)
add("Preco", 46.75, FIM, r"{\an5\pos(540,1180)\fscx88\fscy88\t(0,400,\fscx100\fscy100)\fad(300,0)}R$ 49,90", 6)

cab = r"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Leg,Montserrat Black,82,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,6,3,5,50,50,0,1
Style: Gancho,Montserrat Black,104,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,1,0,1,6,4,5,40,40,0,1
Style: Titulo,Montserrat ExtraBold,74,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,1,0,1,4,3,5,40,40,0,1
Style: Sub,Montserrat Bold,50,&H00C8E62E,&H00C8E62E,&H00000000,&H80000000,0,0,0,0,100,100,1,0,1,3,2,5,40,40,0,1
Style: Etapa,Montserrat Black,46,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1
Style: Desenho,Montserrat Black,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Fundo,Montserrat Black,40,&H00000000,&H00000000,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Card,Montserrat ExtraBold,112,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,0,5,5,40,40,0,1
Style: Card2,Montserrat ExtraBold,80,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,0,4,5,40,40,0,1
Style: Kicker,Montserrat SemiBold,46,&H00BBBBBB,&H00BBBBBB,&H00000000,&H90000000,0,0,0,0,100,100,2,0,1,0,2,5,40,40,0,1
Style: Preco,Montserrat Black,120,&H00C8E62E,&H00C8E62E,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,0,5,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(sys.argv[1], "w", encoding="utf-8") as f:
    f.write(cab)
    for layer, est, a, z, txt in sorted(ev, key=lambda e: (e[2], e[0])):
        f.write(f"Dialogue: {layer},{ts(a)},{ts(z)},{est},,0,0,0,,{txt}\n")
print("ok", len(ev))
