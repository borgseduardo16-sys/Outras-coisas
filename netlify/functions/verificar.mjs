/* POST /api/verificar  { token } -> confere se a compra continua ativa e o aparelho continua liberado. */
import { verificar, json } from '../lib/acesso.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, erro: 'metodo' }, 405);
  let corpo;
  try { corpo = await req.json(); } catch { return json({ ok: false, erro: 'token_invalido' }, 400); }
  const r = await verificar(corpo.token);
  return json(r, r.ok ? 200 : 403);
};

export const config = { path: '/api/verificar' };
