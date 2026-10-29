/* Voz pelo ElevenLabs: lista as vozes da conta e transforma texto em áudio (MP3). */

const BASE = () => process.env.ELEVEN_URL || 'https://api.elevenlabs.io';

export const MODELOS_VOZ = [
  { id: 'eleven_multilingual_v2', nome: 'Multilingual v2', resumo: 'Estável e natural em português' },
  { id: 'eleven_v3', nome: 'Eleven v3', resumo: 'Mais expressivo, aceita [laughs], [whispers]' },
  { id: 'eleven_flash_v2_5', nome: 'Flash v2.5', resumo: 'Mais rápido e barato' },
];

async function erro(r) {
  let t = '';
  try { t = await r.text(); } catch {}
  try {
    const j = JSON.parse(t);
    const d = j.detail;
    if (d?.message) return d.message;
    if (typeof d === 'string') return d;
  } catch {}
  if (r.status === 401) return 'Chave do ElevenLabs recusada. Confira em Configurações.';
  return t.slice(0, 300) || `HTTP ${r.status}`;
}

export async function vozes(chave) {
  const r = await fetch(`${BASE()}/v1/voices`, { headers: { 'xi-api-key': chave } });
  if (!r.ok) throw new Error(await erro(r));
  const j = await r.json();
  return (j.voices || []).map((v) => ({
    id: v.voice_id,
    nome: v.name,
    tipo: v.category || '',
    descricao: [v.labels?.gender, v.labels?.age, v.labels?.accent, v.labels?.description].filter(Boolean).join(' · '),
    previa: v.preview_url || null,
  }));
}

export async function falar(chave, { texto, vozId, modelo = 'eleven_multilingual_v2', ajustes = {} }) {
  const n = (v, pad) => (Number.isFinite(Number(v)) ? Number(v) : pad);
  // O v3 só aceita estabilidade em poucos valores; os outros modelos aceitam todos os ajustes.
  const voice_settings = modelo === 'eleven_v3'
    ? { stability: [0, 0.5, 1].reduce((a, b) => (Math.abs(b - n(ajustes.estabilidade, 0.5)) < Math.abs(a - n(ajustes.estabilidade, 0.5)) ? b : a)) }
    : {
        stability: n(ajustes.estabilidade, 0.45),
        similarity_boost: n(ajustes.similaridade, 0.8),
        style: n(ajustes.estilo, 0.25),
        use_speaker_boost: true,
        speed: n(ajustes.velocidade, 1),
      };
  const r = await fetch(`${BASE()}/v1/text-to-speech/${encodeURIComponent(vozId)}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': chave, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: texto, model_id: modelo, voice_settings }),
  });
  if (!r.ok) throw new Error(await erro(r));
  return Buffer.from(await r.arrayBuffer());
}
