// Gera o anúncio original nos 3 formatos do Meta (1:1, 9:16, 1.91:1) e um PDF de conferência.
// Uso: node formatos.js <pasta-saida>
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
const out = process.argv[2] || __dirname;
const BASE = 'file://' + path.join(__dirname, 'img/anuncio_base_1024x1536.png');
const BG = '#0b0b0d';
const css = `*{margin:0;padding:0;box-sizing:border-box}body{background:${BG}}
.t{position:relative;overflow:hidden;background:${BG}}
.c{position:absolute;background-image:url(${BASE});background-repeat:no-repeat}
.fx2{-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 8%,#000 92%,transparent 100%),linear-gradient(180deg,transparent 0,#000 8%,#000 92%,transparent 100%);-webkit-mask-composite:source-in;mask-image:linear-gradient(90deg,transparent 0,#000 8%,#000 92%,transparent 100%),linear-gradient(180deg,transparent 0,#000 8%,#000 92%,transparent 100%);mask-composite:intersect}
.fx{-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%)}`;
// recorte da base: x,y,w,h (px da base) colocado em (dx,dy) com escala s
const crop = (x, y, w, h, dx, dy, s, extra = '') =>
  `<div class="c ${extra}" style="left:${dx}px;top:${dy}px;width:${w * s}px;height:${h * s}px;background-size:${1024 * s}px ${1536 * s}px;background-position:${-x * s}px ${-y * s}px"></div>`;

const formatos = {
  '1_QUADRADO_1x1_1080x1080': { w: 1080, h: 1080, html: crop(0, 0, 1024, 1536, 190, 0, 1080 / 1536, 'fx') },
  '2_STORIES_REELS_9x16_1080x1920': { w: 1080, h: 1920, html: crop(0, 0, 1024, 1536, 0, 255, 1080 / 1024 * 0.97 * 0 + 1330 / 1536, 'fx').replace('left:0px', 'left:' + (1080 - 1024 * 1330 / 1536) / 2 + 'px') },
  '3_HORIZONTAL_1.91x1_1200x628': { w: 1200, h: 628, html:
    crop(0, 0, 500, 880, 0, 0, 628 / 880, 'fx') +
    crop(470, 314, 530, 342, 318, 20, 1.0, 'fx2') +
    crop(587, 684, 377, 84, 375, 380, 0.95, 'fx2') +
    crop(230, 1236, 562, 94, 375, 485, 0.9, 'fx2') +
    crop(635, 35, 336, 265, 880, 170, 0.78, 'fx2') },
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const paginas = [];
  for (const [nome, f] of Object.entries(formatos)) {
    const p = await b.newPage({ viewport: { width: f.w, height: f.h } });
    const hf = path.join(__dirname, '_tmp_' + f.w + 'x' + f.h + '.html'); fs.writeFileSync(hf, `<meta charset="utf-8"><style>${css}</style><div class="t" style="width:${f.w}px;height:${f.h}px">${f.html}</div>`); await p.goto('file://' + hf); fs.unlinkSync(hf);
    await p.waitForTimeout(300);
    const arq = path.join(out, nome + '.png');
    await p.screenshot({ path: arq });
    paginas.push([nome, arq, f]);
    await p.close();
  }
  const html = `<style>@page{size:A4;margin:0}body{font-family:Arial,sans-serif;background:#fff}
  .pg{width:210mm;height:297mm;padding:14mm;page-break-after:always;display:flex;flex-direction:column;align-items:center}
  h1{font-size:26pt;margin-bottom:4mm}p{font-size:13pt;color:#333;margin-bottom:8mm;text-align:center}
  img{max-width:100%;max-height:200mm;border:1px solid #999}</style>` +
    paginas.map(([n, a, f], i) => `<div class="pg"><h1>Formato ${i + 1}</h1><p><b>${n.replace(/_/g, ' ')}</b><br>${[
      'Para os posicionamentos do corte 1:1', 'Para Stories e Reels, o corte 9:16', 'Para Coluna da direita e Resultados da pesquisa, o corte 1,91:1'][i]}</p>
      <img src="file://${a}"></div>`).join('');
  const pp = await b.newPage();
  const hp = path.join(__dirname, '_tmp_pdf.html'); fs.writeFileSync(hp, '<meta charset="utf-8">' + html); await pp.goto('file://' + hp); fs.unlinkSync(hp);
  await pp.waitForTimeout(500);
  await pp.pdf({ path: path.join(out, 'ANUNCIO_3_FORMATOS.pdf'), format: 'A4', printBackground: true });
  await b.close();
  console.log('ok');
})();
