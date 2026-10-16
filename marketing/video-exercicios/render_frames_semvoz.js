// Renderiza quadros da cena 3D em JPEG.
// Uso: node render_frames.js <saida> <w> <h> <ini> <fim>       (índices de quadro, 30 fps)
//      node render_frames.js <saida> <w> <h> --tempos 1.0,5.2  (só esses instantes, para conferência)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const out = process.argv[2], W = +process.argv[3], H = +process.argv[4];
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  p.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('ERRO')) console.log('CONSOLE', m.text()); });
  await p.goto(`http://localhost:8771/marketing/video-exercicios/render_semvoz.html?w=${W}&h=${H}`);
  await p.waitForFunction(() => window.pronto || window.erro, null, { timeout: 120000 });
  if (process.env.CAM) await p.evaluate((c) => { window.camFixa = JSON.parse(c); }, process.env.CAM);
  const erro = await p.evaluate(() => window.erro); if (erro) { console.log('ERRO', erro); process.exit(1); }
  const grava = async (t, nome) => {
    const data = await p.evaluate((t) => { app.quadro(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, t);
    fs.writeFileSync(`${out}/${nome}.jpg`, Buffer.from(data.split(',')[1], 'base64'));
  };
  if (process.argv[5] === '--tempos') {
    for (const t of process.argv[6].split(',').map(Number)) await grava(t, `t${t.toFixed(2)}`);
  } else {
    const ini = +process.argv[5], fim = +process.argv[6], t0 = Date.now();
    for (let i = ini; i < fim; i++) {
      await grava(i / 30, `f${String(i).padStart(4, '0')}`);
      if (i % 30 === 0) console.log('quadro', i, ((Date.now() - t0) / (i - ini + 1)).toFixed(0), 'ms/quadro');
    }
  }
  console.log('FIM');
  await b.close();
})();
