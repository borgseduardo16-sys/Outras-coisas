/*
 * Modelos de vídeo (todos rodam pela fila do fal.ai) e a montagem do pedido de cada um.
 * Os nomes dos endpoints e campos seguem as páginas do fal.ai (out/2026). Se algum mudar,
 * dá para usar "Outro modelo do fal.ai" informando o endpoint e campos extras em JSON.
 */

const limitar = (n, min, max) => Math.max(min, Math.min(max, n));

export const MODELOS = [
  {
    id: 'omnihuman-15',
    nome: 'OmniHuman 1.5',
    fornecedor: 'ByteDance',
    endpoint: 'fal-ai/bytedance/omnihuman/v1.5',
    resumo: 'O mais realista: expressões, cabeça e mãos se movem junto com a fala.',
    usaDirecao: true,
    resolucoes: ['1080p', '720p'],
    resolucaoPadrao: '1080p',
    limiteSeg: { '1080p': 30, '720p': 60 },
    precoSeg: 0.16,
    temRapido: true,
    entrada: (c) => ({
      image_url: c.imagem, audio_url: c.audio, prompt: c.prompt,
      resolution: c.resolucao, turbo_mode: Boolean(c.rapido),
    }),
  },
  {
    id: 'kling-avatar-pro',
    nome: 'Kling Avatar 2 Pro',
    fornecedor: 'Kuaishou',
    endpoint: 'fal-ai/kling-video/ai-avatar/v2/pro',
    resumo: 'Alta definição e boca muito bem sincronizada.',
    usaDirecao: true,
    resolucoes: null,
    precoSeg: null,
    entrada: (c) => ({ image_url: c.imagem, audio_url: c.audio, prompt: c.prompt || '.' }),
  },
  {
    id: 'kling-avatar-std',
    nome: 'Kling Avatar 2 Standard',
    fornecedor: 'Kuaishou',
    endpoint: 'fal-ai/kling-video/ai-avatar/v2/standard',
    resumo: 'Boa qualidade com custo menor. Bom para testar roteiros.',
    usaDirecao: true,
    resolucoes: null,
    precoSeg: 0.0562,
    entrada: (c) => ({ image_url: c.imagem, audio_url: c.audio, prompt: c.prompt || '.' }),
  },
  {
    id: 'fabric',
    nome: 'VEED Fabric 1.0',
    fornecedor: 'VEED',
    endpoint: 'veed/fabric-1.0',
    resumo: 'Rápido. Anima o rosto a partir da foto, sem instruções de direção.',
    usaDirecao: false,
    resolucoes: ['720p', '480p'],
    resolucaoPadrao: '720p',
    precoSeg: null,
    entrada: (c) => ({ image_url: c.imagem, audio_url: c.audio, resolution: c.resolucao }),
  },
  {
    id: 'infinitalk',
    nome: 'InfiniteTalk',
    fornecedor: 'Código aberto',
    endpoint: 'fal-ai/infinitalk',
    resumo: 'Bom para falas longas, com movimento de corpo leve.',
    usaDirecao: true,
    resolucoes: ['720p', '480p'],
    resolucaoPadrao: '720p',
    limiteSeg: { '720p': 28, '480p': 28 },
    precoSeg: null,
    // O modelo gera em quadros (25 por segundo, de 41 a 721).
    entrada: (c) => ({
      image_url: c.imagem, audio_url: c.audio, prompt: c.prompt || 'A person talking to the camera.',
      resolution: c.resolucao, acceleration: 'regular',
      num_frames: limitar(Math.ceil((c.duracao || 6) * 25) + 1, 41, 721),
    }),
  },
  {
    id: 'personalizado',
    nome: 'Outro modelo do fal.ai',
    fornecedor: 'Você escolhe',
    endpoint: '',
    resumo: 'Use qualquer modelo de "imagem + áudio" do fal.ai informando o endpoint.',
    usaDirecao: true,
    resolucoes: null,
    precoSeg: null,
    personalizado: true,
    entrada: (c) => ({ image_url: c.imagem, audio_url: c.audio, prompt: c.prompt, ...(c.extras || {}) }),
  },
];

export const modelo = (id) => MODELOS.find((m) => m.id === id);

/** Dados do modelo que a interface precisa (sem as funções). */
export const modelosPublicos = () => MODELOS.map(({ entrada, ...m }) => m);

/* ---------- Direção: transforma as escolhas da tela em instruções (em inglês, que os modelos entendem melhor) ---------- */
const TEXTOS = {
  enquadramento: {
    selfie: 'vertical selfie-style video, phone held at arm\'s length, face and shoulders in frame',
    meio: 'medium shot from the waist up, phone on a stand',
    close: 'close-up on the face and shoulders',
  },
  energia: {
    calma: 'calm, warm and reassuring tone, soft facial expressions',
    natural: 'natural conversational tone, like talking to a friend',
    animada: 'upbeat and lively, expressive face and eyebrows',
    intensa: 'energetic and persuasive, strong and confident expressions',
  },
  gestos: {
    nenhum: 'hands mostly still, almost no gestures',
    sutis: 'occasional subtle hand gestures',
    expressivos: 'frequent natural hand gestures that emphasize key words',
  },
  expressao: {
    neutra: 'neutral, relaxed face',
    sorridente: 'friendly smile between sentences',
    seria: 'serious and focused expression',
  },
  camera: {
    fixa: 'static camera',
    mao: 'handheld phone camera with slight natural movement',
  },
};

export function montarPrompt(d = {}) {
  const partes = [
    'A realistic video of the person in the image speaking directly to the camera',
    TEXTOS.enquadramento[d.enquadramento] || TEXTOS.enquadramento.selfie,
    TEXTOS.energia[d.energia] || TEXTOS.energia.natural,
    TEXTOS.gestos[d.gestos] || TEXTOS.gestos.sutis,
    TEXTOS.expressao[d.expressao] || TEXTOS.expressao.neutra,
    TEXTOS.camera[d.camera] || TEXTOS.camera.mao,
    'keeps eye contact with the lens, natural blinking and head movement, accurate lip sync',
    'keep the original face, hair, clothes, background and lighting from the image',
    'realistic skin texture, no text, no subtitles, no watermark',
  ];
  let p = partes.join(', ') + '.';
  const extra = String(d.extra || '').trim().slice(0, 400);
  if (extra) p += ` Extra direction: ${extra}`;
  return p;
}

/** Monta o corpo enviado ao fal.ai. */
export function montarEntrada(m, c) {
  const prompt = m.usaDirecao ? montarPrompt(c.direcao) : undefined;
  const resolucao = m.resolucoes ? (m.resolucoes.includes(c.resolucao) ? c.resolucao : m.resolucaoPadrao) : undefined;
  const corpo = m.entrada({ ...c, prompt, resolucao });
  for (const k of Object.keys(corpo)) if (corpo[k] === undefined) delete corpo[k];
  return corpo;
}

/** Problemas que impedem a geração (ex.: áudio maior que o limite do modelo). */
export function validar(m, { duracao, resolucao, endpoint }) {
  if (!m) return 'Escolha um modelo.';
  if (m.personalizado && !/^[\w.-]+\/[\w./-]+$/.test(endpoint || '')) return 'Informe o endpoint do modelo (ex.: fal-ai/nome-do-modelo).';
  const r = m.resolucoes ? (m.resolucoes.includes(resolucao) ? resolucao : m.resolucaoPadrao) : null;
  const lim = m.limiteSeg && r ? m.limiteSeg[r] : null;
  if (lim && duracao > lim) return `O ${m.nome} aceita até ${lim} s de áudio em ${r}. Seu áudio tem ${Math.round(duracao)} s.`;
  return null;
}
