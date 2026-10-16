// Renderiza todos os quadros da parte 3D (30 fps) em JPEG. Uso: node render_frames.js <saida> [w] [h]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  const out = process.argv[2], W = +(process.argv[3] || 810), H = +(process.argv[4] || 1440);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto(`http://localhost:8769/marketing/video-boneco/render3.html?w=${W}&h=${H}`);
  await p.waitForFunction(() => window.pronto, null, { timeout: 120000 });
  const total = Math.round(await p.evaluate(() => cena3.T_FIM3D) * 30);
  const ini = +(process.argv[5] || 0), fim = +(process.argv[6] || total);
  for (let i = ini; i < fim; i++) {
    const data = await p.evaluate((t) => { app.quadro(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, i / 30);
    fs.writeFileSync(`${out}/f${String(i).padStart(4, '0')}.jpg`, Buffer.from(data.split(',')[1], 'base64'));
    if (i % 30 === 0) console.log('quadro', i, '/', total);
  }
  console.log('FIM', total);
  await b.close();
})();
