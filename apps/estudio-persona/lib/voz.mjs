/*
 * Voz pelo fal.ai (vozes do ElevenLabs hospedadas no fal). Assim o app usa uma chave e um saldo só.
 * Campos conforme a página do fal.ai (out/2026): text, voice, stability, similarity_boost, style, speed.
 */
import * as fal from './fal.mjs';

export const MODELOS_VOZ = [
  { id: 'multilingual-v2', nome: 'Multilingual v2', resumo: 'Natural e estável em português', endpoint: 'fal-ai/elevenlabs/tts/multilingual-v2', ajustes: true, precoMil: 0.1 },
  { id: 'eleven-v3', nome: 'Eleven v3', resumo: 'Mais expressivo, aceita [laughs] e [whispers]', endpoint: 'fal-ai/elevenlabs/tts/eleven-v3', ajustes: false, precoMil: 0.1 },
  { id: 'turbo-v2.5', nome: 'Turbo v2.5', resumo: 'Mais rápido e mais barato', endpoint: 'fal-ai/elevenlabs/tts/turbo-v2.5', ajustes: true, precoMil: 0.05, idioma: 'pt' },
];

// Vozes prontas do ElevenLabs (todas falam português com os modelos multilíngues).
export const VOZES = [
  ...['Sarah', 'Laura', 'Jessica', 'Alice', 'Matilda', 'Lily', 'Charlotte', 'Aria', 'Rachel'].map((nome) => ({ id: nome, nome, genero: 'f' })),
  ...['Liam', 'Will', 'Chris', 'Eric', 'Brian', 'Roger', 'Charlie', 'George', 'Callum', 'Daniel', 'Bill'].map((nome) => ({ id: nome, nome, genero: 'm' })),
  { id: 'River', nome: 'River', genero: 'n' },
];

export const modeloVoz = (id) => MODELOS_VOZ.find((m) => m.id === id) || MODELOS_VOZ[0];

export function montarEntradaVoz(m, { texto, voz, ajustes = {} }) {
  const n = (v, pad) => (Number.isFinite(Number(v)) ? Number(v) : pad);
  const e = { text: texto, voice: String(voz || 'Sarah').trim() };
  if (m.ajustes) {
    Object.assign(e, {
      stability: n(ajustes.estabilidade, 0.45),
      similarity_boost: n(ajustes.similaridade, 0.8),
      style: n(ajustes.estilo, 0.25),
      speed: Math.min(1.2, Math.max(0.7, n(ajustes.velocidade, 1))),
    });
  }
  if (m.idioma) e.language_code = m.idioma;
  return e;
}

/** Gera a fala e devolve o arquivo de áudio. */
export async function falar(chave, { texto, voz, modeloId, ajustes }, opcoes) {
  const m = modeloVoz(modeloId);
  const res = await fal.executar(chave, m.endpoint, montarEntradaVoz(m, { texto, voz, ajustes }), opcoes);
  const url = fal.acharAudio(res);
  if (!url) throw new Error('O fal.ai não devolveu o áudio da voz.');
  const r = await fetch(url);
  if (!r.ok) throw new Error('Não foi possível baixar o áudio da voz.');
  const tipo = (r.headers.get('content-type') || '').split(';')[0];
  const ext = /wav/.test(tipo) || /\.wav(\?|$)/i.test(url) ? '.wav' : '.mp3';
  return { buffer: Buffer.from(await r.arrayBuffer()), ext };
}
