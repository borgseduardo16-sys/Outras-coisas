/*
 * Imita o fal.ai (armazenamento + fila, inclusive a voz) para testar o app sem gastar nada.
 * Chaves: "teste-fal" funciona; "sem-saldo" responde como conta sem créditos; qualquer outra é recusada.
 * Uso: node mock-servicos.mjs <porta> <video.mp4> <voz.mp3>
 */
import http from 'node:http';
import fs from 'node:fs';

export function criarMock({ video, mp3, passosAteFicarPronto = 3 }) {
  const arquivos = new Map();
  const pedidos = new Map();
  const log = [];
  let base = '';

  const json = (res, s, c) => { res.writeHead(s, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(c)); };
  const corpo = async (req) => { const p = []; for await (const c of req) p.push(c); return Buffer.concat(p); };

  const srv = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    const b = await corpo(req);
    log.push({ metodo: req.method, caminho: u.pathname, auth: req.headers.authorization || req.headers['xi-api-key'] || null, tamanho: b.length, corpo: req.headers['content-type']?.includes('json') ? JSON.parse(b.toString() || 'null') : null });

    const chave = req.headers.authorization;
    const recusar = () => (chave === 'Key sem-saldo'
      ? json(res, 403, { detail: 'User is locked. Reason: Exhausted balance. Top up your balance at fal.ai/dashboard/billing.' })
      : json(res, 401, { detail: 'Unauthorized' }));

    // ---- fal.ai: armazenamento ----
    if (u.pathname === '/storage/upload/initiate') {
      if (chave !== 'Key teste-fal') return recusar();
      const { file_name } = JSON.parse(b.toString());
      const id = Math.random().toString(36).slice(2);
      return json(res, 200, { upload_url: `${base}/upload/${id}`, file_url: `${base}/files/${id}/${file_name}` });
    }
    if (u.pathname.startsWith('/upload/') && req.method === 'PUT') {
      arquivos.set(u.pathname.split('/')[2], { tipo: req.headers['content-type'], tamanho: b.length });
      res.writeHead(200); return res.end();
    }
    if (u.pathname === '/voz.mp3') {
      res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
      return res.end(fs.readFileSync(mp3));
    }
    if (u.pathname === '/video.mp4') {
      res.writeHead(200, { 'Content-Type': 'video/mp4' });
      return res.end(fs.readFileSync(video));
    }

    // ---- fal.ai: fila ----
    if (u.pathname.startsWith('/fila/')) {
      if (chave !== 'Key teste-fal') return recusar();
      const partes = u.pathname.split('/').slice(2);
      const st = /^(.*)\/requests\/([\w-]+)(\/status)?$/.exec(partes.join('/'));
      if (st && req.method === 'GET') {
        const p = pedidos.get(st[2]);
        if (!p) return json(res, 404, { detail: 'Request not found' });
        if (st[3]) {
          p.consultas++;
          if (p.consultas === 1) return json(res, 202, { status: 'IN_QUEUE', queue_position: 0 });
          if (p.consultas < passosAteFicarPronto) return json(res, 202, { status: 'IN_PROGRESS', logs: [{ message: 'Generating frames 40%' }] });
          return json(res, 200, { status: 'COMPLETED', logs: [] });
        }
        if (p.endpoint.includes('falha')) return json(res, 422, { detail: [{ msg: 'audio_url: Audio is too long' }] });
        if (p.endpoint.includes('/tts/')) {
          if (p.entrada.voice === 'VozQueNaoExiste') return json(res, 422, { detail: [{ msg: 'voice: Voice not found' }] });
          return json(res, 200, { audio: { url: `${base}/voz.mp3`, content_type: 'audio/mpeg' } });
        }
        return json(res, 200, { video: { url: `${base}/video.mp4`, content_type: 'video/mp4' }, duration: 4 });
      }
      if (req.method === 'POST') {
        const endpoint = partes.join('/');
        const id = `req-${pedidos.size + 1}`;
        pedidos.set(id, { endpoint, entrada: JSON.parse(b.toString()), consultas: 0 });
        const app = partes.slice(0, 2).join('/');
        return json(res, 200, { request_id: id, status_url: `${base}/fila/${app}/requests/${id}/status`, response_url: `${base}/fila/${app}/requests/${id}` });
      }
    }
    json(res, 404, { detail: 'Not found' });
  });

  return {
    log, pedidos, arquivos,
    ouvir: (porta = 0) => new Promise((ok) => srv.listen(porta, '127.0.0.1', () => { base = `http://127.0.0.1:${srv.address().port}`; ok(base); })),
    fechar: () => new Promise((ok) => srv.close(ok)),
  };
}

if (process.argv[1] && process.argv[1].endsWith('mock-servicos.mjs')) {
  const [porta, video, mp3] = process.argv.slice(2);
  const m = criarMock({ video, mp3, passosAteFicarPronto: 6 });
  m.ouvir(Number(porta)).then((b) => console.log('mock em', b));
}
