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
  if (!chaveConfere(url.searchParams.get('chave'), process.env.CHAVE_WEBHOOK)) return json({ ok: false, erro: 'chave' }, 401);
  if (req.method !== 'POST') return json({ ok: false, erro: 'metodo' }, 405);
  let corpo;
  try { corpo = await req.json(); } catch { return json({ ok: false, erro: 'json' }, 400); }

  const logs = await loja('logs');
  await logs.setJSON('ultimo-webhook', { recebido: new Date().toISOString(), corpo });

  const email = acharEmail(corpo), status = acharStatus(corpo);
  if (!emailValido(email)) return json({ ok: true, ignorado: 'sem_email' });
  if (status.some((s) => CANCELADO.includes(s))) { await cancelar(email, `kiwify:${status.join(',')}`); return json({ ok: true, acao: 'cancelado' }); }
  if (status.some((s) => APROVADO.includes(s))) { await liberar(email, `kiwify:${status.join(',')}`); return json({ ok: true, acao: 'liberado' }); }
  return json({ ok: true, ignorado: status.join(',') || 'sem_status' });
};

export const config = { path: '/api/kiwify' };
