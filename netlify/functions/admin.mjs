/*
 * Painel simples pelo navegador: GET /api/admin?chave=CHAVE_ADMIN&acao=...&email=...
 *   acao=liberar  email=...   libera um comprador manualmente
 *   acao=remover  email=...   corta o acesso
 *   acao=resetar  email=...   apaga os aparelhos (quando o comprador troca de celular)
 *   acao=ver      email=...   mostra o cadastro
 *   acao=listar               lista os e-mails cadastrados
 *   acao=webhook              mostra o último aviso aceito e a última tentativa (mesmo recusada)
 */
import { liberar, cancelar, lerComprador, salvarComprador, normEmail, emailValido, chaveConfere, json, loja } from '../lib/acesso.mjs';

export default async (req) => {
  const q = new URL(req.url).searchParams;
  if (!chaveConfere(q.get('chave'), process.env.CHAVE_ADMIN)) return json({ ok: false, erro: 'chave' }, 401);
  const acao = q.get('acao') || 'listar', email = normEmail(q.get('email'));
  const precisaEmail = ['liberar', 'remover', 'resetar', 'ver'].includes(acao);
  if (precisaEmail && !emailValido(email)) return json({ ok: false, erro: 'email_invalido' }, 400);

  switch (acao) {
    case 'liberar': return json({ ok: true, comprador: await liberar(email, 'manual') });
    case 'remover': return json({ ok: true, comprador: await cancelar(email, 'manual') });
    case 'resetar': {
      const c = await lerComprador(email);
      if (!c) return json({ ok: false, erro: 'nao_encontrado' }, 404);
      c.dispositivos = []; c.atualizado = new Date().toISOString();
      await salvarComprador(email, c);
      return json({ ok: true, comprador: c });
    }
    case 'ver': return json({ ok: true, comprador: await lerComprador(email) });
    case 'listar': {
      const { blobs } = await (await loja()).list();
      return json({ ok: true, total: blobs.length, emails: blobs.map((b) => b.key) });
    }
    case 'webhook': {
      const l = await loja('logs');
      return json({ ok: true, ultimo: await l.get('ultimo-webhook', { type: 'json' }), tentativa: await l.get('ultima-tentativa', { type: 'json' }) });
    }
  }
  return json({ ok: false, erro: 'acao_desconhecida' }, 400);
};

export const config = { path: '/api/admin' };
