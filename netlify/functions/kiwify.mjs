/*
 * POST /api/kiwify?chave=CHAVE_WEBHOOK  — webhook da Kiwify.
 * Compra aprovada -> libera o e-mail. Reembolso/chargeback/cancelamento -> corta o acesso.
 * Os nomes dos campos são lidos de forma tolerante; o último aviso recebido fica salvo para conferência
 * (veja em /api/admin?acao=webhook).
 */
import { liberar, cancelar, normEmail, emailValido, chaveConfere, json, loja } from '../lib/acesso.mjs';

const APROVADO = ['paid', 'approved', 'complete', 'completed', 'order_approved', 'compra_aprovada', 'pago', 'aprovado'];
const CANCELADO = ['refunded', 'chargedback', 'chargeback', 'canceled', 'cancelled', 'order_refunded', 'compra_reembolsada',
  'subscription_canceled', 'reembolsado', 'estornado'];

function acharEmail(o) {
  const c = o?.Customer || o?.customer || o?.buyer || o?.Buyer || o?.cliente || o?.order?.Customer || o?.order?.customer || {};
  return normEmail(c.email || c.Email || o?.email || o?.customer_email);
}
function acharStatus(o) {
  return [o?.webhook_event_type, o?.order_status, o?.status, o?.event, o?.order?.order_status]
    .filter(Boolean).map((s) => String(s).toLowerCase());
}

export default async (req) => {
  const url = new URL(req.url);
  const chaveOk = chaveConfere(url.searchParams.get('chave'), process.env.CHAVE_WEBHOOK);
  const texto = req.method === 'POST' ? await req.text().catch(() => '') : '';

  // Anota toda tentativa (inclusive as recusadas) para conferência em /api/admin?acao=webhook.
  // O corpo só é guardado quando a chave confere.
  try {
    await (await loja('logs')).setJSON('ultima-tentativa', {
      recebido: new Date().toISOString(), metodo: req.method, chaveOk,
      tipo: req.headers.get('content-type') || '', tamanho: texto.length,
      corpoTexto: chaveOk ? texto.slice(0, 4000) : undefined,
    });
  } catch { /* o registro nunca derruba o webhook */ }

  if (!chaveOk) return json({ ok: false, erro: 'chave' }, 401);
  if (req.method !== 'POST') return json({ ok: false, erro: 'metodo' }, 405);
  let corpo;
  try { corpo = JSON.parse(texto); } catch { return json({ ok: false, erro: 'json' }, 400); }

  await (await loja('logs')).setJSON('ultimo-webhook', { recebido: new Date().toISOString(), corpo });

  const email = acharEmail(corpo), status = acharStatus(corpo);
  if (!emailValido(email)) return json({ ok: true, ignorado: 'sem_email' });
  if (status.some((s) => CANCELADO.includes(s))) { await cancelar(email, `kiwify:${status.join(',')}`); return json({ ok: true, acao: 'cancelado' }); }
  if (status.some((s) => APROVADO.includes(s))) { await liberar(email, `kiwify:${status.join(',')}`); return json({ ok: true, acao: 'liberado' }); }
  return json({ ok: true, ignorado: status.join(',') || 'sem_status' });
};

export const config = { path: '/api/kiwify' };
