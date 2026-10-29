/* Testes: node --test testes/  (precisa do ffmpeg só para criar os arquivos de teste) */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { MODELOS, modelo, montarEntrada, montarPrompt, validar } from '../lib/modelos.mjs';
import { acharVideo } from '../lib/fal.mjs';
import { modeloVoz, montarEntradaVoz } from '../lib/voz.mjs';
import { criarMock } from './mock-servicos.mjs';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'persona-'));
const VIDEO = path.join(TMP, 'v.mp4');
const MP3 = path.join(TMP, 'v.mp3');
const IMG = path.join(TMP, 'i.jpg');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=s=360x640:d=2', '-f', 'lavfi', '-i', 'sine=d=2', '-shortest', '-c:v', 'libx264', '-c:a', 'aac', VIDEO]);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=f=220:d=3', '-c:a', 'libmp3lame', '-b:a', '128k', MP3]);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=gray:s=1080x1920', '-frames:v', '1', IMG]);
const dataUrl = (arq, tipo) => `data:${tipo};base64,${fs.readFileSync(arq).toString('base64')}`;

/* ---------- Montagem dos pedidos ---------- */
test('prompt reflete as escolhas de direção', () => {
  const p = montarPrompt({ energia: 'animada', gestos: 'expressivos', enquadramento: 'meio', extra: 'ri no final' });
  assert.match(p, /upbeat and lively/);
  assert.match(p, /frequent natural hand gestures/);
  assert.match(p, /waist up/);
  assert.match(p, /Extra direction: ri no final$/);
});

test('cada modelo monta o corpo com os campos certos', () => {
  const c = { imagem: 'https://i', audio: 'https://a', duracao: 10, resolucao: '720p', rapido: true, direcao: {} };
  const omni = montarEntrada(modelo('omnihuman-15'), c);
  assert.deepEqual(Object.keys(omni).sort(), ['audio_url', 'image_url', 'prompt', 'resolution', 'turbo_mode']);
  assert.equal(omni.resolution, '720p');
  assert.equal(omni.turbo_mode, true);
  const fabric = montarEntrada(modelo('fabric'), { ...c, resolucao: '1080p' });
  assert.deepEqual(Object.keys(fabric).sort(), ['audio_url', 'image_url', 'resolution']);
  assert.equal(fabric.resolution, '720p', 'resolução inválida cai no padrão do modelo');
  const kling = montarEntrada(modelo('kling-avatar-pro'), c);
  assert.ok(kling.prompt.length > 20);
  assert.equal(kling.resolution, undefined);
  const inf = montarEntrada(modelo('infinitalk'), c);
  assert.equal(inf.num_frames, 251);
  assert.equal(montarEntrada(modelo('infinitalk'), { ...c, duracao: 60 }).num_frames, 721);
  const pers = montarEntrada(modelo('personalizado'), { ...c, extras: { seed: 4 } });
  assert.equal(pers.seed, 4);
  for (const m of MODELOS) assert.ok(m.endpoint || m.personalizado, m.id);
});

test('voz: campos enviados ao fal.ai', () => {
  const v2 = montarEntradaVoz(modeloVoz('multilingual-v2'), { texto: 'Oi', voz: 'Sarah', ajustes: { velocidade: 1.5, estabilidade: 0.3 } });
  assert.deepEqual(v2, { text: 'Oi', voice: 'Sarah', stability: 0.3, similarity_boost: 0.8, style: 0.25, speed: 1.2 });
  assert.deepEqual(montarEntradaVoz(modeloVoz('eleven-v3'), { texto: 'Oi', voz: 'Liam' }), { text: 'Oi', voice: 'Liam' });
  assert.equal(montarEntradaVoz(modeloVoz('turbo-v2.5'), { texto: 'Oi', voz: 'Liam' }).language_code, 'pt');
});

test('limites de duração', () => {
  assert.match(validar(modelo('omnihuman-15'), { duracao: 40, resolucao: '1080p' }), /até 30 s/);
  assert.equal(validar(modelo('omnihuman-15'), { duracao: 40, resolucao: '720p' }), null);
  assert.match(validar(modelo('personalizado'), { duracao: 5, endpoint: 'sem barra' }), /endpoint/);
});

test('acha o vídeo em formatos diferentes de resposta', () => {
  assert.equal(acharVideo({ video: { url: 'https://x/a.mp4' } }), 'https://x/a.mp4');
  assert.equal(acharVideo({ videos: [{ url: 'https://x/b' }] }), 'https://x/b');
  assert.equal(acharVideo({ data: { output: ['https://cdn/c.mp4?t=1'] } }), 'https://cdn/c.mp4?t=1');
  assert.equal(acharVideo({ nada: 1 }), null);
});

/* ---------- Servidor de verdade contra os serviços simulados ---------- */
async function subirApp(env) {
  const dados = fs.mkdtempSync(path.join(TMP, 'dados-'));
  const porta = 4800 + Math.floor(Math.random() * 500);
  const p = spawn(process.execPath, ['servidor.mjs'], { cwd: RAIZ, env: { ...process.env, ...env, PASTA_DADOS: dados, PORTA: String(porta), SEM_NAVEGADOR: '1' }, stdio: 'pipe' });
  await new Promise((ok, falha) => {
    p.stdout.on('data', (d) => /aberto em/.test(d) && ok());
    p.stderr.on('data', (d) => process.stderr.write(d));
    p.on('exit', (c) => falha(new Error('servidor saiu ' + c)));
  });
  const base = `http://localhost:${p.porta = porta}`;
  const api = async (metodo, url, corpo) => {
    const r = await fetch(base + url, { method: metodo, headers: corpo ? { 'Content-Type': 'application/json' } : {}, body: corpo ? JSON.stringify(corpo) : undefined });
    return { status: r.status, j: await r.json() };
  };
  return { p, base, api, dados };
}
async function esperarFim(api, id) {
  for (let i = 0; i < 60; i++) {
    const { j } = await api('GET', `/api/trabalhos/${id}`);
    if (j.status === 'pronto' || j.status === 'erro') return j;
    await new Promise((r) => setTimeout(r, 900));
  }
  throw new Error('não terminou');
}

test('fluxo completo com o fal.ai simulado (voz e vídeo na mesma conta)', async () => {
  const mock = criarMock({ video: VIDEO, mp3: MP3 });
  const m = await mock.ouvir();
  const app = await subirApp({ FAL_FILA_URL: `${m}/fila`, FAL_REST_URL: m });
  try {
    let r = await app.api('GET', '/api/estado');
    assert.equal(r.j.fal, false);

    assert.ok(r.j.vozes.length >= 10);
    r = await app.api('POST', '/api/config', { falKey: 'teste-fal' });
    assert.equal(r.j.falMascara, '•••• -fal');
    assert.equal((await app.api('POST', '/api/testar', {})).j.ok, true);

    const pedirVoz = (extra = {}) => app.api('POST', '/api/voz', { texto: 'Oi, tudo bem?', voz: 'Sarah', modeloVoz: 'multilingual-v2', ajustes: { velocidade: 1.1 }, ...extra });
    const audio = (await pedirVoz()).j;
    assert.equal(audio.demo, false);
    assert.ok(audio.url.endsWith('.mp3'));
    const tts = [...mock.pedidos.values()].find((p) => p.endpoint === 'fal-ai/elevenlabs/tts/multilingual-v2');
    assert.equal(tts.entrada.voice, 'Sarah');
    assert.equal(tts.entrada.speed, 1.1);
    // Mesma fala de novo usa o cache (não paga duas vezes).
    assert.equal((await pedirVoz()).j.id, audio.id);
    assert.equal([...mock.pedidos.values()].filter((p) => p.endpoint.includes('/tts/')).length, 1);
    // Voz inexistente vira mensagem clara.
    r = await pedirVoz({ voz: 'VozQueNaoExiste' });
    assert.equal(r.status, 400);
    assert.match(r.j.erro, /não aceitou a voz/);
    audio.duracao = 3;

    const pers = (await app.api('POST', '/api/personagens', { nome: 'Ana', imagem: dataUrl(IMG, 'image/jpeg'), largura: 1080, altura: 1920 })).j;
    assert.equal(pers.nome, 'Ana');

    r = await app.api('POST', '/api/gerar', { personagemId: pers.id, audioId: audio.id, duracao: audio.duracao, modeloId: 'omnihuman-15', resolucao: '720p', direcao: { energia: 'animada' } });
    assert.equal(r.status, 400, 'sem consentimento não gera');

    r = await app.api('POST', '/api/gerar', { personagemId: pers.id, audioId: audio.id, duracao: audio.duracao, modeloId: 'omnihuman-15', resolucao: '720p', direcao: { energia: 'animada' }, consentimento: true });
    assert.equal(r.status, 200);
    assert.equal(r.j.demo, false);
    const fim = await esperarFim(app.api, r.j.id);
    assert.equal(fim.status, 'pronto', fim.erro);
    assert.ok(fim.video);

    const pedido = [...mock.pedidos.values()].find((p) => p.endpoint.includes('omnihuman'));
    assert.equal(pedido.endpoint, 'fal-ai/bytedance/omnihuman/v1.5');
    assert.match(pedido.entrada.image_url, /^http:\/\/127\.0\.0\.1:\d+\/files\//);
    assert.match(pedido.entrada.audio_url, /\/files\//);
    assert.equal(pedido.entrada.resolution, '720p');
    assert.match(pedido.entrada.prompt, /upbeat/);
    assert.deepEqual([...mock.arquivos.values()].map((a) => a.tipo).sort(), ['audio/mpeg', 'image/jpeg']);

    // O vídeo foi baixado e o download funciona com Range (para o player avançar).
    const v = await fetch(app.base + fim.video, { headers: { Range: 'bytes=0-99' } });
    assert.equal(v.status, 206);
    assert.equal((await v.arrayBuffer()).byteLength, 100);
    const d = await fetch(app.base + fim.baixar);
    assert.match(d.headers.get('content-disposition'), /attachment; filename="persona-/);
    assert.equal((await d.arrayBuffer()).byteLength, fs.statSync(VIDEO).size);

    // Erro do modelo aparece em português para o usuário.
    r = await app.api('POST', '/api/gerar', { personagemId: pers.id, audioId: audio.id, duracao: audio.duracao, modeloId: 'personalizado', endpoint: 'fal-ai/modelo-falha', direcao: {}, consentimento: true });
    const erro = await esperarFim(app.api, r.j.id);
    assert.equal(erro.status, 'erro');
    assert.match(erro.erro, /Audio is too long/);

    // Histórico e exclusão.
    const lista = (await app.api('GET', '/api/trabalhos')).j;
    assert.equal(lista.length, 2);
    await app.api('DELETE', `/api/trabalhos/${fim.id}`);
    assert.equal((await app.api('GET', '/api/trabalhos')).j.length, 1);
    assert.equal(fs.existsSync(path.join(app.dados, 'videos', `${fim.id}.mp4`)), false);

    // Saldo acabou: a mensagem fala de saldo (não de chave errada) e, depois de recarregar, "tentar de novo" funciona.
    await app.api('POST', '/api/config', { falKey: 'sem-saldo' });
    assert.match((await app.api('POST', '/api/testar', {})).j.msg, /saldo no fal.ai acabou/);
    r = await app.api('POST', '/api/gerar', { personagemId: pers.id, audioId: audio.id, duracao: audio.duracao, modeloId: 'fabric', direcao: {}, consentimento: true });
    const semSaldo = await esperarFim(app.api, r.j.id);
    assert.match(semSaldo.erro, /saldo no fal.ai acabou/);
    r = await pedirVoz({ texto: 'Outro texto' });
    assert.match(r.j.erro, /saldo no fal.ai acabou/);
    await app.api('POST', '/api/config', { falKey: 'teste-fal' });
    r = await app.api('POST', `/api/trabalhos/${semSaldo.id}/repetir`);
    assert.equal(r.j.modelo, 'fabric');
    assert.equal((await esperarFim(app.api, r.j.id)).status, 'pronto');

    // Chave errada vira mensagem de chave.
    await app.api('POST', '/api/config', { falKey: 'errada' });
    r = await app.api('POST', '/api/gerar', { personagemId: pers.id, audioId: audio.id, duracao: audio.duracao, modeloId: 'fabric', direcao: {}, consentimento: true });
    const recusado = await esperarFim(app.api, r.j.id);
    assert.match(recusado.erro, /Chave do fal.ai recusada/);
  } finally {
    app.p.kill();
    await mock.fechar();
  }
});

test('modo demonstração funciona sem nenhuma chave', async () => {
  const app = await subirApp({ FAL_FILA_URL: 'http://127.0.0.1:9/x' });
  try {
    const audio = (await app.api('POST', '/api/voz', { texto: 'Um texto de teste com uns trinta caracteres' })).j;
    assert.equal(audio.demo, true);
    assert.ok(audio.url.endsWith('.wav'));
    const pers = (await app.api('POST', '/api/personagens', { nome: 'X', imagem: dataUrl(IMG, 'image/jpeg') })).j;
    const r = await app.api('POST', '/api/gerar', { personagemId: pers.id, audioId: audio.id, modeloId: 'omnihuman-15', direcao: {}, consentimento: true });
    assert.equal(r.j.demo, true);
    const fim = await esperarFim(app.api, r.j.id);
    assert.equal(fim.status, 'pronto');
    assert.equal(fim.video, null);
    // Arquivos fora das pastas permitidas não são servidos.
    assert.equal((await fetch(`${app.base}/arquivos/videos/..%2F..%2Fconfig.json`)).status, 404);
    assert.equal((await fetch(`${app.base}/arquivos/qualquer/config.json`)).status, 404);
  } finally {
    app.p.kill();
  }
});
