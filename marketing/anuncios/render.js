// Gera os PNGs dos criativos. Uso: node render.js <pasta-saida>
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || __dirname;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const f of ['feed', 'story']) {
    const p = await b.newPage({ viewport: { width: 1080, height: f === 'story' ? 1920 : 1350 } });
    for (const v of [1, 2, 3]) {
      await p.goto(`file://${path.join(__dirname, 'anuncio.html')}?v=${v}&f=${f}`);
      await p.waitForFunction(() => window.pronto);
      await p.waitForTimeout(200);
      await p.screenshot({ path: path.join(out, `anuncio_v${v}_${f}.png`) });
    }
    await p.close();
  }
  await b.close();
  console.log('ok');
})();
