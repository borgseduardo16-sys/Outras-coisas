/*
 * Núcleo do controle de acesso: compradores (por e-mail), aparelhos liberados e tokens assinados.
 * Armazenamento: Netlify Blobs (loja "acessos"). Em testes, defina globalThis.__lojaTeste com get/set/list.
 *
 * Variáveis de ambiente (Netlify → Site configuration → Environment variables):
 *   SEGREDO_TOKEN   texto longo e aleatório usado para assinar os acessos
 *   CHAVE_WEBHOOK   vai no link do webhook da Kiwify (?chave=...)
 *   CHAVE_ADMIN     senha do painel /api/admin
 *   LIMITE_APARELHOS  (opcional, padrão 2)
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const LIMITE = () => Math.max(1, parseInt(process.env.LIMITE_APARELHOS || '2', 10) || 2);

export async function loja(nome = 'acessos') {
  if (globalThis.__lojaTeste) return globalThis.__lojaTeste(nome);
  const { getStore } = await import('@netlify/blobs');
  return getStore({ name: nome, consistency: 'strong' });
}

export const normEmail = (e) => String(e || '').trim().toLowerCase();
export const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function lerComprador(email) {
  const l = await loja();
  return (await l.get(email, { type: 'json' })) || null;
}
export async function salvarComprador(email, dados) {
  const l = await loja();
  await l.setJSON(email, dados);
}

/** Cria ou reativa um comprador (compra aprovada ou liberação manual). */
export async function liberar(email, origem) {
  const atual = (await lerComprador(email)) || { dispositivos: [], criado: new Date().toISOString() };
  atual.status = 'ativo'; atual.origem = origem; atual.atualizado = new Date().toISOString();
  await salvarComprador(email, atual);
  return atual;
}
/** Corta o acesso (reembolso, chargeback ou remoção manual). */
export async function cancelar(email, origem) {
  const atual = await lerComprador(email);
  if (!atual) return null;
  atual.status = 'cancelado'; atual.origem = origem; atual.atualizado = new Date().toISOString();
  await salvarComprador(email, atual);
  return atual;
}

/* ---------- Token assinado: base64url(JSON{e,d}).assinatura ---------- */
function segredo() {
  const s = process.env.SEGREDO_TOKEN;
  if (!s || s.length < 16) throw new Error('SEGREDO_TOKEN ausente ou curto demais');
  return s;
}
const assinar = (corpo) => createHmac('sha256', segredo()).update(corpo).digest('base64url');

export function criarToken(email, dispositivo) {
  const corpo = Buffer.from(JSON.stringify({ e: email, d: dispositivo })).toString('base64url');
  return `${corpo}.${assinar(corpo)}`;
}
export function lerToken(token) {
  const [corpo, ass] = String(token || '').split('.');
  if (!corpo || !ass) return null;
  const esperado = Buffer.from(assinar(corpo)), recebido = Buffer.from(ass);
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null;
  try { return JSON.parse(Buffer.from(corpo, 'base64url').toString()); } catch { return null; }
}

/**
 * Ativa um aparelho para o e-mail. Resultado:
 *   { ok: true, token } | { ok: false, erro: 'nao_encontrado' | 'cancelado' | 'limite' }
 */
export async function ativar(emailBruto, dispositivo, nome = '') {
  const email = normEmail(emailBruto);
  const disp = String(dispositivo || '').slice(0, 80);
  if (!emailValido(email) || disp.length < 8) return { ok: false, erro: 'dados_invalidos' };
  const c = await lerComprador(email);
  if (!c) return { ok: false, erro: 'nao_encontrado' };
  if (c.status !== 'ativo') return { ok: false, erro: 'cancelado' };
  c.dispositivos = c.dispositivos || [];
  if (!c.dispositivos.some((d) => d.id === disp)) {
    if (c.dispositivos.length >= LIMITE()) return { ok: false, erro: 'limite' };
    c.dispositivos.push({ id: disp, nome: String(nome).slice(0, 120), desde: new Date().toISOString() });
    await salvarComprador(email, c);
  }
  return { ok: true, token: criarToken(email, disp) };
}

/** Confere um token já emitido: compra ainda ativa e aparelho ainda liberado. */
export async function verificar(token) {
  const t = lerToken(token);
  if (!t) return { ok: false, erro: 'token_invalido' };
  const c = await lerComprador(t.e);
  if (!c) return { ok: false, erro: 'nao_encontrado' };
  if (c.status !== 'ativo') return { ok: false, erro: 'cancelado' };
  if (!(c.dispositivos || []).some((d) => d.id === t.d)) return { ok: false, erro: 'limite' };
  return { ok: true };
}

export const json = (dados, status = 200) => new Response(JSON.stringify(dados), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

/** Compara segredos sem vazar tempo. */
export function chaveConfere(recebida, esperada) {
  if (!esperada) return false;
  const a = Buffer.from(String(recebida || '')), b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}
