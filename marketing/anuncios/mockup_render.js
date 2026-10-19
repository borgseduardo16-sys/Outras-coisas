// Gera as camadas transparentes da simulação de Stories. Uso: node mockup_render.js <pasta-saida>
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || __dirname;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const v of ['img', 'vid', 'callout']) {
    await p.goto(`file://${path.join(__dirname, 'mockup_stories.html')}?v=${v}`);
    await p.waitForFunction(() => window.pronto);
    await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(out, `camada_${v}.png`), omitBackground: true });
  }
  await b.close();
  console.log('ok');
})();
