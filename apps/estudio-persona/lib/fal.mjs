/*
 * Cliente mínimo da fila do fal.ai (sem bibliotecas).
 * Fluxo: envia os arquivos para o armazenamento do fal → coloca o pedido na fila →
 * consulta o status → busca o resultado.
 * Os endereços podem ser trocados por variáveis de ambiente (usado nos testes).
 */

const FILA = () => process.env.FAL_FILA_URL || 'https://queue.fal.run';
const REST = () => (process.env.FAL_REST_URL || 'https://rest.fal.ai,https://rest.alpha.fal.ai').split(',');

const cabecalho = (chave, extra = {}) => ({ Authorization: `Key ${chave}`, ...extra });

async function lerErro(r) {
  let txt = '';
  try { txt = await r.text(); } catch {}
  try {
    const j = JSON.parse(txt);
    const d = j.detail ?? j.error ?? j.message;
    if (Array.isArray(d)) return d.map((x) => x.msg || JSON.stringify(x)).join('; ');
    if (d) return typeof d === 'string' ? d : JSON.stringify(d);
  } catch {}
  return txt.slice(0, 300) || `HTTP ${r.status}`;
}

export class ErroFal extends Error {
  constructor(msg, status) { super(msg); this.status = status; }
}

/** Envia um arquivo e devolve o endereço público dele. Se o envio falhar, usa o arquivo embutido (data URI). */
export async function enviarArquivo(chave, buffer, tipo, nome) {
  for (const base of REST()) {
    try {
      const r = await fetch(`${base}/storage/upload/initiate?storage_type=fal-cdn-v3`, {
        method: 'POST',
        headers: cabecalho(chave, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ content_type: tipo, file_name: nome }),
      });
      if (r.status === 401 || r.status === 403) throw new ErroFal('Chave do fal.ai recusada. Confira em Configurações.', r.status);
      if (!r.ok) continue;
      const { upload_url, file_url } = await r.json();
      if (!upload_url || !file_url) continue;
      const put = await fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': tipo }, body: buffer });
      if (put.ok) return file_url;
    } catch (e) {
      if (e instanceof ErroFal) throw e;
    }
  }
  return `data:${tipo};base64,${buffer.toString('base64')}`;
}

/** Coloca o pedido na fila. Devolve { request_id, status_url, response_url }. */
export async function enfileirar(chave, endpoint, entrada) {
  const r = await fetch(`${FILA()}/${endpoint}`, {
    method: 'POST',
    headers: cabecalho(chave, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(entrada),
  });
  if (!r.ok) throw new ErroFal(await lerErro(r), r.status);
  const j = await r.json();
  if (!j.request_id) throw new ErroFal('O fal.ai não devolveu o número do pedido.');
  // Se o fal não mandar os endereços, monta pelo padrão (o caminho usa só "dono/app").
  const app = endpoint.split('/').slice(0, 2).join('/');
  return {
    request_id: j.request_id,
    status_url: j.status_url || `${FILA()}/${app}/requests/${j.request_id}/status`,
    response_url: j.response_url || `${FILA()}/${app}/requests/${j.request_id}`,
  };
}

/** Status atual: { status: IN_QUEUE | IN_PROGRESS | COMPLETED, queue_position, logs } */
export async function consultar(chave, statusUrl) {
  const u = new URL(statusUrl);
  u.searchParams.set('logs', '1');
  const r = await fetch(u, { headers: cabecalho(chave) });
  if (!r.ok && r.status !== 202) throw new ErroFal(await lerErro(r), r.status);
  return r.json();
}

/** Resultado final do modelo (formato varia de modelo para modelo). */
export async function resultado(chave, responseUrl) {
  const r = await fetch(responseUrl, { headers: cabecalho(chave) });
  if (!r.ok) throw new ErroFal(await lerErro(r), r.status);
  return r.json();
}

/** Procura o endereço do vídeo dentro do resultado (video.url, videos[0].url ou qualquer .mp4). */
export function acharVideo(res) {
  if (res?.video?.url) return res.video.url;
  if (Array.isArray(res?.videos) && res.videos[0]?.url) return res.videos[0].url;
  let achado = null;
  const visitar = (v) => {
    if (achado || v == null) return;
    if (typeof v === 'string') { if (/^https?:\/\/\S+\.(mp4|mov|webm)(\?|$)/i.test(v)) achado = v; return; }
    if (typeof v === 'object') for (const x of Object.values(v)) visitar(x);
  };
  visitar(res);
  return achado;
}

/** Testa a chave sem gastar nada: consulta um pedido inexistente (401 = chave errada; 404/400 = chave ok). */
export async function testarChave(chave) {
  const r = await fetch(`${FILA()}/fal-ai/fast-sdxl/requests/00000000-0000-0000-0000-000000000000/status`, { headers: cabecalho(chave) });
  if (r.status === 401 || r.status === 403) return { ok: false, msg: 'Chave recusada pelo fal.ai.' };
  return { ok: true };
}
