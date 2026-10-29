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

export const MSG_SALDO = 'Seu saldo no fal.ai acabou. Adicione créditos em fal.ai/dashboard/billing e clique em "Tentar de novo".';
export const MSG_CHAVE = 'Chave do fal.ai recusada. Confira em Configurações.';

/** Transforma a resposta de erro do fal.ai numa mensagem clara (saldo acabou ≠ chave errada). */
async function erroDe(r) {
  const msg = await lerErro(r);
  if (/exhausted|balance|locked|top.?up|insufficient|credit|billing|payment/i.test(msg) || r.status === 402) return new ErroFal(MSG_SALDO, 402);
  if (r.status === 401 || r.status === 403) return new ErroFal(MSG_CHAVE, r.status);
  return new ErroFal(msg, r.status);
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
      if (r.status === 401 || r.status === 402 || r.status === 403) throw await erroDe(r);
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
  if (!r.ok) throw await erroDe(r);
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
  if (!r.ok && r.status !== 202) throw await erroDe(r);
  return r.json();
}

/** Resultado final do modelo (formato varia de modelo para modelo). */
export async function resultado(chave, responseUrl) {
  const r = await fetch(responseUrl, { headers: cabecalho(chave) });
  if (!r.ok) throw await erroDe(r);
  return r.json();
}

/** Procura um arquivo de certo tipo dentro do resultado (campo direto ou qualquer URL com a extensão). */
function acharArquivo(res, campo, exts) {
  if (res?.[campo]?.url) return res[campo].url;
  if (Array.isArray(res?.[campo + 's']) && res[campo + 's'][0]?.url) return res[campo + 's'][0].url;
  const padrao = new RegExp(`^https?://\\S+\\.(${exts})(\\?|$)`, 'i');
  let achado = null;
  const visitar = (v) => {
    if (achado || v == null) return;
    if (typeof v === 'string') { if (padrao.test(v)) achado = v; return; }
    if (typeof v === 'object') for (const x of Object.values(v)) visitar(x);
  };
  visitar(res);
  return achado;
}
export const acharVideo = (res) => acharArquivo(res, 'video', 'mp4|mov|webm');
export const acharAudio = (res) => acharArquivo(res, 'audio', 'mp3|wav|ogg|m4a|aac');

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/** Pedido curto (ex.: voz): coloca na fila e espera o resultado. */
export async function executar(chave, endpoint, entrada, { intervalo = 1000, limite = 180000 } = {}) {
  const req = await enfileirar(chave, endpoint, entrada);
  const inicio = Date.now();
  for (;;) {
    const s = await consultar(chave, req.status_url);
    if (s.status === 'COMPLETED') break;
    if (Date.now() - inicio > limite) throw new ErroFal('O fal.ai demorou demais para responder. Tente de novo.');
    await esperar(intervalo);
  }
  return resultado(chave, req.response_url);
}

/** Testa a chave sem gastar nada: consulta um pedido inexistente (401 = chave errada; 404/400 = chave ok). */
export async function testarChave(chave) {
  const r = await fetch(`${FILA()}/fal-ai/fast-sdxl/requests/00000000-0000-0000-0000-000000000000/status`, { headers: cabecalho(chave) });
  if (r.status === 401 || r.status === 402 || r.status === 403) return { ok: false, msg: (await erroDe(r)).message };
  return { ok: true };
}
