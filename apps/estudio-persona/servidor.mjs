/*
 * Persona Studio: servidor local (sem dependências, Node 18+).
 * Guarda as chaves e os arquivos na pasta "dados/" deste computador e conversa com o fal.ai (vídeo)
 * e o ElevenLabs (voz). Abra com: node servidor.mjs  (ou dê dois cliques em iniciar.bat no Windows)
 */
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { modelo, modelosPublicos, montarEntrada, montarPrompt, validar } from './lib/modelos.mjs';
import * as fal from './lib/fal.mjs';
import * as eleven from './lib/eleven.mjs';
import { wavSilencioso } from './lib/wav.mjs';

const VERSAO = '1.0.0';
const [maior, menor] = process.versions.node.split('.').map(Number);
if (maior < 18 || (maior === 18 && menor < 17)) {
  console.error(`\n  Este app precisa do Node.js 18.17 ou mais novo (você tem ${process.versions.node}).\n  Baixe a versão LTS em https://nodejs.org e abra de novo.\n`);
  process.exit(1);
}
const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const PUBLICO = path.join(RAIZ, 'public');
const DADOS = process.env.PASTA_DADOS || path.join(RAIZ, 'dados');
const PASTAS = { personagens: 'personagens', audios: 'audios', videos: 'videos' };
for (const p of Object.values(PASTAS)) fs.mkdirSync(path.join(DADOS, p), { recursive: true });

/* ---------- Arquivos JSON simples ---------- */
const arqJson = (nome) => path.join(DADOS, nome);
function lerJson(nome, padrao) {
  try { return JSON.parse(fs.readFileSync(arqJson(nome), 'utf8')); } catch { return padrao; }
}
function gravarJson(nome, valor) {
  const tmp = arqJson(nome) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(valor, null, 2));
  fs.renameSync(tmp, arqJson(nome));
}

let config = lerJson('config.json', {});
const chaveFal = () => process.env.FAL_KEY || config.falKey || '';
const chaveEleven = () => process.env.ELEVEN_KEY || config.elevenKey || '';
const mascara = (k) => (k ? '•••• ' + k.slice(-4) : '');

let personagens = lerJson('personagens.json', []);
let audios = lerJson('audios.json', []);
let trabalhos = lerJson('trabalhos.json', []);
// Pedidos que estavam sendo enviados quando o programa fechou não têm como continuar.
for (const t of trabalhos) {
  if (t.status === 'enviando' && !t.demo) Object.assign(t, { status: 'erro', erro: 'O programa foi fechado no meio do envio. Gere de novo.' });
}
const salvarTrabalhos = () => gravarJson('trabalhos.json', trabalhos);

const novoId = () => crypto.randomBytes(6).toString('hex');
const agora = () => new Date().toISOString();

/* ---------- Utilidades HTTP ---------- */
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.aac': 'audio/aac',
  '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.json': 'application/json',
};
const EXT_DE_TIPO = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
  'audio/mpeg': '.mp3', 'audio/mp3': '.mp3', 'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/wave': '.wav',
  'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a', 'audio/m4a': '.m4a', 'audio/ogg': '.ogg', 'audio/aac': '.aac',
};

function json(res, status, corpo) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(corpo));
}
class ErroUsuario extends Error {}
async function lerCorpo(req, limite = 80 * 1024 * 1024) {
  const partes = [];
  let total = 0;
  for await (const p of req) {
    total += p.length;
    if (total > limite) throw new ErroUsuario('Arquivo grande demais (máx. 80 MB).');
    partes.push(p);
  }
  if (!total) return {};
  try { return JSON.parse(Buffer.concat(partes).toString('utf8')); } catch { throw new ErroUsuario('Pedido inválido.'); }
}
function lerDataUrl(d) {
  const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(d || '');
  if (!m) throw new ErroUsuario('Arquivo inválido.');
  return { tipo: m[1].toLowerCase(), buffer: Buffer.from(m[2], 'base64') };
}

/** Envia um arquivo do disco com suporte a "Range" (necessário para avançar o vídeo no navegador). */
function servirArquivo(req, res, caminho, baixar) {
  fs.stat(caminho, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Não encontrado'); }
    const tipo = TIPOS[path.extname(caminho).toLowerCase()] || 'application/octet-stream';
    const base = { 'Content-Type': tipo, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
    if (baixar) base['Content-Disposition'] = `attachment; filename="${baixar}"`;
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      const ini = m[1] ? Number(m[1]) : Math.max(0, st.size - Number(m[2]));
      const fim = m[1] && m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
      if (ini > fim || ini >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { ...base, 'Content-Range': `bytes ${ini}-${fim}/${st.size}`, 'Content-Length': fim - ini + 1 });
      return fs.createReadStream(caminho, { start: ini, end: fim }).pipe(res);
    }
    res.writeHead(200, { ...base, 'Content-Length': st.size });
    fs.createReadStream(caminho).pipe(res);
  });
}
const dentro = (pasta, nome) => {
  const p = path.resolve(pasta, nome);
  return p.startsWith(path.resolve(pasta) + path.sep) ? p : null;
};

/* ---------- Visões públicas ---------- */
const urlArquivo = (pasta, arquivo) => (arquivo ? `/arquivos/${pasta}/${encodeURIComponent(arquivo)}` : null);
const pubPersonagem = (p) => ({ id: p.id, nome: p.nome, url: urlArquivo('personagens', p.arquivo), largura: p.largura, altura: p.altura, criado: p.criado });
const pubAudio = (a) => ({ id: a.id, url: urlArquivo('audios', a.arquivo), origem: a.origem, texto: a.texto, duracao: a.duracao, demo: Boolean(a.demo) });
function pubTrabalho(t) {
  const p = personagens.find((x) => x.id === t.personagemId);
  const a = audios.find((x) => x.id === t.audioId);
  return {
    id: t.id, criado: t.criado, atualizado: t.atualizado, status: t.status, posicao: t.posicao ?? null,
    log: t.log || null, erro: t.erro || null, demo: Boolean(t.demo),
    modelo: t.modeloId, modeloNome: t.modeloNome, resolucao: t.resolucao || null, duracao: t.duracao,
    direcao: t.direcao, texto: t.texto || a?.texto || null, custoEstimado: t.custoEstimado ?? null,
    previsaoSeg: t.previsaoSeg, inicioGeracao: t.inicioGeracao || null,
    personagem: p ? pubPersonagem(p) : null, audio: a ? pubAudio(a) : null,
    video: urlArquivo('videos', t.video), baixar: t.video ? `/baixar/${t.id}` : null,
  };
}

/* ---------- Geração ---------- */
const emAndamento = new Set();
const PREVISAO = (dur) => Math.round(90 + dur * 6); // estimativa grosseira de tempo de geração (segundos)

async function iniciarRemoto(t) {
  try {
    const m = modelo(t.modeloId);
    const p = personagens.find((x) => x.id === t.personagemId);
    const a = audios.find((x) => x.id === t.audioId);
    const img = await fsp.readFile(path.join(DADOS, PASTAS.personagens, p.arquivo));
    const aud = await fsp.readFile(path.join(DADOS, PASTAS.audios, a.arquivo));
    const tipoImg = TIPOS[path.extname(p.arquivo)] || 'image/jpeg';
    const tipoAud = TIPOS[path.extname(a.arquivo)] || 'audio/mpeg';
    Object.assign(t, { log: 'Enviando a foto…', atualizado: agora() }); salvarTrabalhos();
    const urlImg = await fal.enviarArquivo(chaveFal(), img, tipoImg, p.arquivo);
    Object.assign(t, { log: 'Enviando o áudio…', atualizado: agora() }); salvarTrabalhos();
    const urlAud = await fal.enviarArquivo(chaveFal(), aud, tipoAud, a.arquivo);
    const entrada = montarEntrada(m, {
      imagem: urlImg, audio: urlAud, duracao: t.duracao, resolucao: t.resolucao, rapido: t.rapido,
      direcao: t.direcao, extras: t.extras,
    });
    t.req = await fal.enfileirar(chaveFal(), t.endpoint, entrada);
    Object.assign(t, { status: 'na_fila', log: 'Pedido recebido pelo fal.ai.', atualizado: agora() });
  } catch (e) {
    Object.assign(t, { status: 'erro', erro: traduzirErro(e), atualizado: agora() });
  }
  salvarTrabalhos();
}

function traduzirErro(e) {
  const m = String(e?.message || e);
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(m)) return 'Sem conexão com o serviço. Confira sua internet e tente de novo.';
  if (e?.status === 401 || e?.status === 403) return 'Chave do fal.ai recusada. Confira em Configurações.';
  if (e?.status === 402 || /balance|credit|payment|insufficient/i.test(m)) return 'Saldo insuficiente no fal.ai. Adicione créditos na sua conta do fal.ai.';
  if (e?.status === 404) return 'O modelo não foi encontrado no fal.ai. Confira o endpoint.';
  return m.slice(0, 400);
}

async function atualizar(t) {
  if (t.demo) return atualizarDemo(t);
  if (!['na_fila', 'gerando', 'baixando'].includes(t.status) || !t.req) return;
  if (emAndamento.has(t.id)) return;
  if (t._ultima && Date.now() - t._ultima < 2500) return;
  emAndamento.add(t.id);
  t._ultima = Date.now();
  try {
    if (t.status !== 'baixando') {
      const s = await fal.consultar(chaveFal(), t.req.status_url);
      const ultimo = Array.isArray(s.logs) && s.logs.length ? s.logs[s.logs.length - 1].message : null;
      if (s.status === 'IN_QUEUE') Object.assign(t, { status: 'na_fila', posicao: s.queue_position ?? null });
      else if (s.status === 'IN_PROGRESS') {
        if (!t.inicioGeracao) t.inicioGeracao = agora();
        Object.assign(t, { status: 'gerando', posicao: null, log: ultimo || t.log });
      } else if (s.status === 'COMPLETED') {
        if (s.error) throw Object.assign(new Error(typeof s.error === 'string' ? s.error : JSON.stringify(s.error)), { status: 500 });
        Object.assign(t, { status: 'baixando', log: 'Baixando o vídeo…' });
      }
      t.atualizado = agora();
    }
    if (t.status === 'baixando') {
      const r = await fal.resultado(chaveFal(), t.req.response_url);
      const url = fal.acharVideo(r);
      if (!url) throw new Error('O modelo terminou, mas não devolveu um vídeo.');
      const nome = `${t.id}.mp4`;
      const dl = await fetch(url);
      if (!dl.ok || !dl.body) throw new Error('Não foi possível baixar o vídeo gerado.');
      await pipeline(Readable.fromWeb(dl.body), fs.createWriteStream(path.join(DADOS, PASTAS.videos, nome)));
      Object.assign(t, { status: 'pronto', video: nome, urlOriginal: url, log: null, atualizado: agora() });
    }
  } catch (e) {
    Object.assign(t, { status: 'erro', erro: traduzirErro(e), atualizado: agora() });
  } finally {
    emAndamento.delete(t.id);
    salvarTrabalhos();
  }
}

/** Modo demonstração: simula as etapas sem gastar nada. O resultado é a foto com o áudio, sem animação. */
function atualizarDemo(t) {
  if (t.status === 'pronto') return;
  const s = (Date.now() - Date.parse(t.criado)) / 1000;
  if (s < 2) Object.assign(t, { status: 'enviando', log: 'Enviando a foto e o áudio…' });
  else if (s < 4.5) Object.assign(t, { status: 'na_fila', posicao: s < 3.2 ? 2 : 1, log: null });
  else if (s < 11) Object.assign(t, { status: 'gerando', posicao: null, inicioGeracao: t.inicioGeracao || agora(), log: 'Gerando os quadros (simulação)…' });
  else Object.assign(t, { status: 'pronto', log: null });
  t.atualizado = agora();
}

/* ---------- Rotas ---------- */
const rotas = [];
const rota = (metodo, padrao, fn) => rotas.push({ metodo, padrao, fn });

rota('GET', /^\/api\/estado$/, async () => ({
  versao: VERSAO, fal: Boolean(chaveFal()), eleven: Boolean(chaveEleven()),
  falMascara: mascara(chaveFal()), elevenMascara: mascara(chaveEleven()),
  modelos: modelosPublicos(), modelosVoz: eleven.MODELOS_VOZ,
}));

rota('POST', /^\/api\/config$/, async (req) => {
  const c = await lerCorpo(req);
  for (const [campo, nome] of [['falKey', 'falKey'], ['elevenKey', 'elevenKey']]) {
    if (typeof c[campo] === 'string') {
      const v = c[campo].trim();
      if (v) config[nome] = v; else delete config[nome];
    }
  }
  gravarJson('config.json', config);
  cacheVozes = null;
  return { ok: true, fal: Boolean(chaveFal()), eleven: Boolean(chaveEleven()), falMascara: mascara(chaveFal()), elevenMascara: mascara(chaveEleven()) };
});

rota('POST', /^\/api\/testar$/, async (req) => {
  const { servico } = await lerCorpo(req);
  try {
    if (servico === 'fal') {
      if (!chaveFal()) return { ok: false, msg: 'Nenhuma chave salva.' };
      return await fal.testarChave(chaveFal());
    }
    if (servico === 'eleven') {
      if (!chaveEleven()) return { ok: false, msg: 'Nenhuma chave salva.' };
      const v = await eleven.vozes(chaveEleven());
      return { ok: true, msg: `${v.length} vozes encontradas.` };
    }
  } catch (e) { return { ok: false, msg: traduzirErro(e) }; }
  return { ok: false, msg: 'Serviço desconhecido.' };
});

let cacheVozes = null;
rota('GET', /^\/api\/vozes$/, async () => {
  if (!chaveEleven()) return { conectado: false, vozes: [] };
  if (!cacheVozes || Date.now() - cacheVozes.em > 10 * 60 * 1000) cacheVozes = { em: Date.now(), vozes: await eleven.vozes(chaveEleven()) };
  return { conectado: true, vozes: cacheVozes.vozes };
});

rota('POST', /^\/api\/prompt$/, async (req) => ({ prompt: montarPrompt((await lerCorpo(req)).direcao) }));

rota('GET', /^\/api\/personagens$/, async () => personagens.slice().reverse().map(pubPersonagem));
rota('POST', /^\/api\/personagens$/, async (req) => {
  const c = await lerCorpo(req);
  const { tipo, buffer } = lerDataUrl(c.imagem);
  const ext = EXT_DE_TIPO[tipo];
  if (!ext || !tipo.startsWith('image/')) throw new ErroUsuario('Use uma imagem JPG, PNG ou WEBP.');
  const id = novoId();
  const p = { id, nome: String(c.nome || 'Personagem').slice(0, 60), arquivo: id + ext, largura: c.largura, altura: c.altura, criado: agora() };
  await fsp.writeFile(path.join(DADOS, PASTAS.personagens, p.arquivo), buffer);
  personagens.push(p);
  gravarJson('personagens.json', personagens);
  return pubPersonagem(p);
});
rota('DELETE', /^\/api\/personagens\/(\w+)$/, async (req, [, id]) => {
  const p = personagens.find((x) => x.id === id);
  if (!p) throw new ErroUsuario('Personagem não encontrado.');
  personagens = personagens.filter((x) => x.id !== id);
  gravarJson('personagens.json', personagens);
  // A foto continua no disco se algum vídeo usou; o histórico precisa dela.
  if (!trabalhos.some((t) => t.personagemId === id)) await fsp.rm(path.join(DADOS, PASTAS.personagens, p.arquivo), { force: true });
  return { ok: true };
});

rota('GET', /^\/api\/audios\/(\w+)$/, async (req, [, id]) => {
  const a = audios.find((x) => x.id === id);
  if (!a || !fs.existsSync(path.join(DADOS, PASTAS.audios, a.arquivo))) throw new ErroUsuario('Áudio não encontrado.');
  return pubAudio(a);
});
rota('POST', /^\/api\/audios$/, async (req) => {
  const c = await lerCorpo(req);
  const { tipo, buffer } = lerDataUrl(c.dados);
  const ext = EXT_DE_TIPO[tipo];
  if (!ext || !tipo.startsWith('audio/')) throw new ErroUsuario('Use um áudio MP3, WAV, M4A, OGG ou AAC.');
  const id = novoId();
  const a = { id, arquivo: id + ext, origem: 'arquivo', nome: String(c.nome || '').slice(0, 80), duracao: Number(c.duracao) || null, criado: agora() };
  await fsp.writeFile(path.join(DADOS, PASTAS.audios, a.arquivo), buffer);
  audios.push(a);
  gravarJson('audios.json', audios);
  return pubAudio(a);
});

rota('POST', /^\/api\/voz$/, async (req) => {
  const c = await lerCorpo(req);
  const texto = String(c.texto || '').trim();
  if (!texto) throw new ErroUsuario('Escreva o texto da fala.');
  if (texto.length > 4000) throw new ErroUsuario('Texto longo demais (máx. 4.000 caracteres).');
  const demo = !chaveEleven();
  const chaveCache = crypto.createHash('sha1').update(JSON.stringify([demo, texto, c.vozId, c.modelo, c.ajustes])).digest('hex').slice(0, 16);
  const existente = audios.find((a) => a.cache === chaveCache && fs.existsSync(path.join(DADOS, PASTAS.audios, a.arquivo)));
  if (existente) return pubAudio(existente);
  let buffer, ext, duracao;
  if (demo) {
    // Sem ElevenLabs: áudio silencioso com a duração aproximada da fala, só para testar o fluxo.
    duracao = Math.max(2, Math.round((texto.length / 15) * 10) / 10);
    buffer = wavSilencioso(duracao);
    ext = '.wav';
  } else {
    if (!c.vozId) throw new ErroUsuario('Escolha uma voz.');
    buffer = await eleven.falar(chaveEleven(), { texto, vozId: c.vozId, modelo: c.modelo, ajustes: c.ajustes });
    ext = '.mp3';
    duracao = Math.round((buffer.length * 8 / 128000) * 10) / 10; // MP3 a 128 kbps
  }
  const id = novoId();
  const a = { id, arquivo: id + ext, origem: 'voz', texto, vozId: c.vozId || null, duracao, demo, cache: chaveCache, criado: agora() };
  await fsp.writeFile(path.join(DADOS, PASTAS.audios, a.arquivo), buffer);
  audios.push(a);
  gravarJson('audios.json', audios);
  return pubAudio(a);
});

rota('POST', /^\/api\/gerar$/, async (req) => {
  const c = await lerCorpo(req);
  if (!c.consentimento) throw new ErroUsuario('Confirme que você tem o direito de usar esta imagem e esta voz.');
  const p = personagens.find((x) => x.id === c.personagemId);
  if (!p) throw new ErroUsuario('Escolha o personagem.');
  const a = audios.find((x) => x.id === c.audioId);
  if (!a) throw new ErroUsuario('Prepare a fala (texto ou áudio).');
  const m = modelo(c.modeloId);
  const duracao = Number(c.duracao) || a.duracao || 0;
  let extras = null;
  if (m?.personalizado && c.extras) {
    try { extras = JSON.parse(c.extras); } catch { throw new ErroUsuario('Os campos extras precisam estar em JSON válido.'); }
  }
  const problema = validar(m, { duracao, resolucao: c.resolucao, endpoint: c.endpoint });
  if (problema) throw new ErroUsuario(problema);
  const resolucao = m.resolucoes ? (m.resolucoes.includes(c.resolucao) ? c.resolucao : m.resolucaoPadrao) : null;
  const demo = !chaveFal();
  if (!demo && a.demo) throw new ErroUsuario('Este áudio é silencioso (feito no modo demonstração). Conecte o ElevenLabs e gere a voz de novo, ou envie um arquivo de áudio.');
  const t = {
    id: novoId(), criado: agora(), atualizado: agora(), status: 'enviando', demo,
    modeloId: m.id, modeloNome: m.personalizado ? c.endpoint : m.nome, endpoint: m.personalizado ? c.endpoint : m.endpoint,
    personagemId: p.id, audioId: a.id, duracao, resolucao, rapido: Boolean(c.rapido), extras,
    direcao: c.direcao || {}, prompt: m.usaDirecao ? montarPrompt(c.direcao) : null, texto: a.texto || null,
    custoEstimado: m.precoSeg && duracao ? Math.round(m.precoSeg * duracao * 100) / 100 : null,
    previsaoSeg: demo ? 7 : PREVISAO(duracao),
  };
  trabalhos.push(t);
  salvarTrabalhos();
  if (!demo) iniciarRemoto(t);
  return pubTrabalho(t);
});

rota('GET', /^\/api\/trabalhos$/, async () => {
  await Promise.all(trabalhos.map(atualizar));
  return trabalhos.slice().reverse().map(pubTrabalho);
});
rota('GET', /^\/api\/trabalhos\/(\w+)$/, async (req, [, id]) => {
  const t = trabalhos.find((x) => x.id === id);
  if (!t) throw new ErroUsuario('Vídeo não encontrado.');
  await atualizar(t);
  return pubTrabalho(t);
});
rota('DELETE', /^\/api\/trabalhos\/(\w+)$/, async (req, [, id]) => {
  const t = trabalhos.find((x) => x.id === id);
  if (!t) throw new ErroUsuario('Vídeo não encontrado.');
  trabalhos = trabalhos.filter((x) => x.id !== id);
  salvarTrabalhos();
  if (t.video) await fsp.rm(path.join(DADOS, PASTAS.videos, t.video), { force: true });
  return { ok: true };
});

/* ---------- Servidor ---------- */
const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local');
  const caminho = decodeURIComponent(url.pathname);
  try {
    if (caminho.startsWith('/api/')) {
      for (const r of rotas) {
        const m = r.metodo === req.method && r.padrao.exec(caminho);
        if (m) return json(res, 200, await r.fn(req, m, url));
      }
      return json(res, 404, { erro: 'Rota não encontrada.' });
    }
    if (caminho.startsWith('/arquivos/')) {
      const [, , pasta, nome] = caminho.split('/');
      const dir = PASTAS[pasta] && path.join(DADOS, PASTAS[pasta]);
      const arq = dir && nome && dentro(dir, nome);
      if (!arq) { res.writeHead(404); return res.end(); }
      return servirArquivo(req, res, arq);
    }
    const b = /^\/baixar\/(\w+)$/.exec(caminho);
    if (b) {
      const t = trabalhos.find((x) => x.id === b[1]);
      if (!t?.video) { res.writeHead(404); return res.end(); }
      const data = t.criado.slice(0, 10);
      return servirArquivo(req, res, path.join(DADOS, PASTAS.videos, t.video), `persona-${data}-${t.id}.mp4`);
    }
    const arq = dentro(PUBLICO, caminho === '/' ? 'index.html' : caminho.slice(1));
    if (!arq) { res.writeHead(404); return res.end(); }
    servirArquivo(req, res, arq);
  } catch (e) {
    if (e instanceof ErroUsuario) return json(res, 400, { erro: e.message });
    console.error(e);
    json(res, 500, { erro: traduzirErro(e) });
  }
});

function abrirNavegador(url) {
  if (process.env.SEM_NAVEGADOR) return;
  const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
    : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  try { spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).on('error', () => {}).unref(); } catch {}
}

function ouvir(porta, tentativas = 10) {
  servidor.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && tentativas > 0) return ouvir(porta + 1, tentativas - 1);
    console.error('Não foi possível abrir o servidor:', e.message);
    process.exit(1);
  });
  servidor.listen(porta, '127.0.0.1', () => {
    const url = `http://localhost:${porta}`;
    console.log(`\n  Persona Studio ${VERSAO} aberto em ${url}\n  Deixe esta janela aberta enquanto usa o app. Para fechar: Ctrl+C.\n`);
    abrirNavegador(url);
  });
}
ouvir(Number(process.env.PORTA) || 4317);
