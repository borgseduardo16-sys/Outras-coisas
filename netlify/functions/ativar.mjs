/* POST /api/ativar  { email, dispositivo, nome } -> libera este aparelho para o comprador (até o limite). */
import { ativar, json } from '../lib/acesso.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, erro: 'metodo' }, 405);
  let corpo;
  try { corpo = await req.json(); } catch { return json({ ok: false, erro: 'dados_invalidos' }, 400); }
  const r = await ativar(corpo.email, corpo.dispositivo, corpo.nome);
  return json(r, r.ok ? 200 : (r.erro === 'dados_invalidos' ? 400 : 403));
};

export const config = { path: '/api/ativar' };
