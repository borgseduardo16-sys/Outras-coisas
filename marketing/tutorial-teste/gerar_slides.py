"""Gera os slides (PNG 1920x1080) do vídeo-tutorial do teste da Kiwify + site.
Uso: python gerar_slides.py <pasta_saida> <pasta_fontes>
Cria slides.txt (lista de arquivos e tempos) para o ffmpeg.
"""
import sys, os
from PIL import Image, ImageDraw, ImageFont

OUT, FONTS = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
W, H = 1920, 1080
F = lambda n, s: ImageFont.truetype(f"{FONTS}/Montserrat-{n}.ttf", s)   # 0 SemiBold, 1 ExtraBold, 2 Black
BG1, BG2 = (6, 24, 26), (10, 52, 54)
BRANCO, CINZA, LARANJA, VERDE, VERM, AMAR = (255, 255, 255), (178, 205, 200), (255, 143, 91), (46, 230, 200), (255, 90, 80), (255, 209, 102)

# ---------- Links numerados (a mesma ordem do texto da mensagem) ----------
LINKS = {
    1: ("O app", "https://desafio31.netlify.app"),
    2: ("Deploys do Netlify", "https://app.netlify.com/projects/desafio31/deploys"),
    3: ("Lista de webhooks (Kiwify)", "https://dashboard.kiwify.com/apps/webhooks"),
    4: ("Endereço p/ colar no webhook 31dias", "https://desafio31.netlify.app/api/kiwify/c01a338a617505d896f79a6e"),
    5: ("Log da função (Netlify)", "https://app.netlify.com/projects/desafio31/functions/kiwify"),
    6: ("Painel: último aviso recebido", "https://desafio31.netlify.app/api/admin?chave=f2a14fd52f5a1b18e31f1979&acao=webhook"),
    7: ("Link de compra (gerar o Pix)", "https://pay.kiwify.com.br/AeLsazF"),
    8: ("Logs do webhook 31dias (Kiwify)", "https://dashboard.kiwify.com/apps/webhooks/logs/60ab9630-2b8d-4167-aeee-c3b3e671fe2c"),
    9: ("Painel: e-mails liberados", "https://desafio31.netlify.app/api/admin?chave=f2a14fd52f5a1b18e31f1979&acao=listar"),
}


def fundo():
    im = Image.new("RGB", (W, H), BG1)
    d = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(BG1[i] + (BG2[i] - BG1[i]) * t) for i in range(3)))
    return im, d


def quebra(d, txt, fonte, largura):
    linhas, atual = [], ""
    for palavra in txt.split(" "):
        teste = (atual + " " + palavra).strip()
        if d.textlength(teste, font=fonte) <= largura:
            atual = teste
        else:
            linhas.append(atual); atual = palavra
    if atual: linhas.append(atual)
    return linhas


def chip(d, x, y, n, tam=46):
    rotulo = f"LINK {n}"
    fo = F(2, tam)
    w = int(d.textlength(rotulo, font=fo)) + 44
    d.rounded_rectangle([x, y, x + w, y + tam + 30], 18, fill=LARANJA)
    d.text((x + 22, y + 12), rotulo, font=fo, fill=(40, 16, 6))
    return w


def slide(nome, etapa, titulo, itens, esperado=None, links=(), aviso=None, tempo=10):
    """itens: lista de strings; esperado: [(cor, texto)]; links: números mostrados no topo."""
    im, d = fundo()
    y = 70
    if etapa:
        d.rounded_rectangle([90, y, 90 + 260, y + 70], 35, fill=VERDE)
        d.text((90 + 130, y + 35), etapa, font=F(2, 38), fill=(4, 30, 28), anchor="mm")
    x = 390 if etapa else 90
    for n in links:
        x += chip(d, x, y - 2, n, 40) + 16
    y += 120
    for l in quebra(d, titulo, F(2, 78), W - 180):
        d.text((90, y), l, font=F(2, 78), fill=BRANCO); y += 100
    y += 20
    for it in itens:
        marca = it.startswith("•")
        texto = it[1:].strip() if marca else it
        fo = F(0, 50)
        linhas = quebra(d, texto, fo, W - 260)
        if marca:
            d.ellipse([100, y + 18, 118, y + 36], fill=LARANJA)
        for l in linhas:
            partes = l.split("**")
            xx = 150 if marca else 90
            for i, p in enumerate(partes):
                fo2 = F(1, 50) if i % 2 else fo
                d.text((xx, y), p, font=fo2, fill=AMAR if i % 2 else (232, 244, 242))
                xx += d.textlength(p, font=fo2)
            y += 68
        y += 14
    if esperado:
        y += 10
        for cor, txt in esperado:
            fo = F(1, 46)
            linhas = quebra(d, txt, fo, W - 330)
            alt = 30 + 62 * len(linhas)
            d.rounded_rectangle([90, y, W - 90, y + alt], 24, fill=(cor[0] // 6, cor[1] // 6, cor[2] // 6), outline=cor, width=4)
            for i, l in enumerate(linhas):
                d.text((130, y + 18 + 62 * i), l, font=fo, fill=cor)
            y += alt + 18
    if aviso:
        d.text((90, H - 90), aviso, font=F(0, 36), fill=CINZA)
    d.text((W - 90, H - 60), "Teste do aviso da Kiwify", font=F(0, 30), fill=(90, 130, 128), anchor="rm")
    p = f"{OUT}/{nome}.png"
    im.save(p)
    return p, tempo


S = []
# 1 capa
im, d = fundo()
d.text((W // 2, 330), "TESTE COMPLETO", font=F(2, 130), fill=BRANCO, anchor="mm")
d.text((W // 2, 480), "A Kiwify consegue avisar o seu site?", font=F(1, 64), fill=VERDE, anchor="mm")
d.text((W // 2, 640), "Siga na ordem, um passo de cada vez.", font=F(0, 50), fill=(232, 244, 242), anchor="mm")
d.text((W // 2, 720), "Pause o vídeo quando quiser.", font=F(0, 50), fill=(232, 244, 242), anchor="mm")
d.text((W // 2, 880), "Custo: R$ 0   ·   Tempo: uns 10 minutos   ·   Você NÃO paga nada", font=F(0, 40), fill=CINZA, anchor="mm")
im.save(f"{OUT}/s01.png"); S.append((f"{OUT}/s01.png", 9))

S.append(slide("s02", None, "O que vamos descobrir",
    ["Quando alguém compra, a Kiwify precisa **avisar o seu site** para ele funcionar sozinho.",
     "Até agora a Kiwify mostrou **Falhou** e nada chegou ao site.",
     "Neste teste a gente gera um Pix **sem pagar** e vê, com os próprios olhos, se o aviso chega."],
    esperado=[(VERDE, "Resultado A: chegou → está tudo funcionando"), (VERM, "Resultado B: não chegou → eu te mostro o plano seguinte")], tempo=14))

# 3 lista de links (2 slides)
def slide_links(nome, ns, titulo):
    im, d = fundo()
    d.text((90, 70), titulo, font=F(2, 70), fill=BRANCO)
    d.text((90, 160), "Os endereços completos estão na mensagem, abaixo do vídeo.", font=F(0, 40), fill=CINZA)
    y = 260
    for n in ns:
        w = chip(d, 90, y, n, 44)
        d.text((90 + w + 36, y + 12), LINKS[n][0], font=F(1, 50), fill=(232, 244, 242))
        y += 150
    im.save(f"{OUT}/{nome}.png")
    return f"{OUT}/{nome}.png", 13
S.append(slide_links("s03", [1, 2, 3, 4, 5], "Os links do teste (1 a 5)"))
S.append(slide_links("s04", [6, 7, 8, 9], "Os links do teste (6 a 9)"))

S.append(slide("s05", "PASSO 1", "O app abre direto?",
    ["Abra uma **aba anônima**: tecla **Ctrl + Shift + N**.", "Cole o **LINK 1** na barra de endereço e aperte Enter."],
    esperado=[(VERDE, "Certo: abre a tela inicial, com o boneco, SEM pedir e-mail"), (VERM, "Errado: pediu e-mail → pare aqui e me avise")], links=(1,), tempo=13))

S.append(slide("s06", "PASSO 2", "O site novo foi publicado?",
    ["Abra o **LINK 2**.", "Olhe o **primeiro item** da lista (o mais novo)."],
    esperado=[(VERDE, "Certo: aparece Published (verde)"), (AMAR, "Se estiver Building: espere 3 minutos e recarregue"), (VERM, "Se estiver Failed (vermelho): me mande o print")], links=(2,), tempo=13))

S.append(slide("s07", "PASSO 3", "Conferir o endereço do webhook na Kiwify",
    ["Abra o **LINK 3** (lista de webhooks).", "Na linha **31dias**, clique nos **3 pontinhos (···)** → **Editar**.",
     "No campo **URL do Webhook**: **Ctrl + A**, apague e cole o **LINK 4**."],
    esperado=[(AMAR, "O LINK 4 NÃO tem interrogação (?) — a senha vai dentro do endereço")], links=(3, 4), aviso="Se o LINK 3 não abrir: na Kiwify, menu Apps → Webhooks", tempo=17))

S.append(slide("s08", "PASSO 3", "Eventos marcados e salvar",
    ["Confira que estes eventos estão **marcados**: **Compra aprovada**, **Reembolso**, **Chargeback**, **Boleto gerado** e **Pix gerado**.",
     "Clique em **Salvar alterações**."],
    esperado=[(VERDE, "Pronto: o endereço novo ficou salvo")], links=(3,), tempo=13))

S.append(slide("s09", "PASSO 4", "Preparar os dois lugares de conferência",
    ["Abra o **LINK 6** numa aba nova. Ele mostra o **último aviso recebido**.",
     "**Anote o horário** do campo \"recebido\" dentro de \"tentativa\" (deve ser um GET antigo, de 14:34).",
     "Abra o **LINK 5** em outra aba e **deixe aberto** (modo Real-time)."],
    esperado=[(AMAR, "Não feche essas duas abas até o final do teste")], links=(6, 5), tempo=17))

S.append(slide("s10", "PASSO 5", "Gerar o Pix de teste (sem pagar)",
    ["Abra o **LINK 7** (link de compra).", "Escolha **Pix** e use **qualquer e-mail**.", "Clique para gerar o código do Pix e **PARE AÍ**."],
    esperado=[(VERM, "NÃO PAGUE o Pix"), (AMAR, "Anote a hora em que você gerou")], links=(7,), tempo=14))

S.append(slide("s11", "PASSO 6", "Espere 1 minuto e olhe a Kiwify",
    ["Espere **1 minuto**.", "Abra o **LINK 8** (logs do webhook 31dias) e clique em **Atualizar**.",
     "Olhe a **linha mais nova**, com a hora de agora."],
    esperado=[(VERDE, "Sucesso → a Kiwify entregou"), (VERM, "Falhou → não entregou")], links=(8,), aviso="Não clique em \"Reenviar webhooks\" neste teste", tempo=15))

S.append(slide("s12", "PASSO 7", "Olhe o site",
    ["Volte na aba do **LINK 6** e aperte **F5**.", "Olhe o campo **tentativa**: tem **horário novo** e **\"metodo\":\"POST\"**?",
     "Na aba do **LINK 5**: apareceu uma **linha nova** no Function log?"],
    esperado=[(VERDE, "POST com horário novo → o aviso chegou ao site"), (VERM, "Continua o horário antigo (GET 14:34) → não chegou")], links=(6, 5), tempo=17))

S.append(slide("s13", "RESULTADO", "Como ler o resultado",
    ["**A) Sucesso + POST novo:** funciona! O próximo passo é uma compra real aprovada.",
     "**B) Falhou e nada novo no site:** a Kiwify não entrega no seu endereço. Me mande 3 prints (próximo slide).",
     "**C) POST novo, mas \"chaveOk\": false:** o aviso chegou e foi recusado. Me avise, eu corrijo."],
    tempo=18))

S.append(slide("s14", "SE DER ERRO", "Os 3 prints que eu preciso",
    ["**1)** A tela do **LINK 8** (linha mais nova, com Sucesso ou Falhou).",
     "**2)** A tela do **LINK 6** depois do F5.", "**3)** A tela do **LINK 5** (Function log)."],
    esperado=[(AMAR, "Pode mandar os 3 prints juntos, que eu analiso")], links=(8, 6, 5), tempo=14))

S.append(slide("s15", "DEPOIS", "Na primeira venda real",
    ["Quando alguém **pagar de verdade**, abra o **LINK 9**.",
     "Se o e-mail do comprador aparecer na lista, a liberação automática está funcionando.",
     "Hoje o app está aberto para todos, então ninguém fica sem acesso mesmo assim."],
    esperado=[(AMAR, "O Pix gerado só testa a entrega; a compra aprovada de verdade é que libera o e-mail")], links=(9,), tempo=17))

im, d = fundo()
d.text((W // 2, 360), "Pronto!", font=F(2, 150), fill=BRANCO, anchor="mm")
d.text((W // 2, 540), "Me mande o resultado do passo 6 e do passo 7.", font=F(1, 58), fill=VERDE, anchor="mm")
d.text((W // 2, 650), "Se algo não bater em qualquer passo,", font=F(0, 50), fill=(232, 244, 242), anchor="mm")
d.text((W // 2, 720), "pare nele e me diga qual foi.", font=F(0, 50), fill=(232, 244, 242), anchor="mm")
im.save(f"{OUT}/s16.png"); S.append((f"{OUT}/s16.png", 10))

with open(f"{OUT}/slides.txt", "w") as f:
    for p, t in S:
        f.write(f"file '{os.path.abspath(p)}'\nduration {t}\n")
    f.write(f"file '{os.path.abspath(S[-1][0])}'\n")
print(len(S), "slides;", sum(t for _, t in S), "s")
