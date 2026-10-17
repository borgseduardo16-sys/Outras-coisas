// Testes das funções de acesso com um armazenamento em memória.  Rodar: node --test netlify/testes/
import test from 'node:test';
import assert from 'node:assert/strict';

const lojas = new Map();
globalThis.__lojaTeste = (nome) => {
  if (!lojas.has(nome)) lojas.set(nome, new Map());
  const m = lojas.get(nome);
  return {
    get: async (k) => (m.has(k) ? JSON.parse(m.get(k)) : null),
    setJSON: async (k, v) => { m.set(k, JSON.stringify(v)); },
    list: async () => ({ blobs: [...m.keys()].map((key) => ({ key })) }),
  };
};
process.env.SEGREDO_TOKEN = 'segredo-de-teste-bem-comprido-123';
process.env.CHAVE_WEBHOOK = 'wh-chave';
process.env.CHAVE_ADMIN = 'adm-chave';

const kiwify = (await import('../functions/kiwify.mjs')).default;
const ativar = (await import('../functions/ativar.mjs')).default;
const verificar = (await import('../functions/verificar.mjs')).default;
const admin = (await import('../functions/admin.mjs')).default;

const post = (url, corpo) => new Request(`https://x.netlify.app${url}`, { method: 'POST', body: JSON.stringify(corpo), headers: { 'content-type': 'application/json' } });
const get = (url) => new Request(`https://x.netlify.app${url}`);
const resp = async (r) => ({ status: r.status, ...(await r.json()) });

test('webhook exige a chave', async () => {
  const r = await resp(await kiwify(post('/api/kiwify?chave=errada', {})));
  assert.equal(r.status, 401);
});

test('compra aprovada libera; 2 aparelhos entram; o 3º é bloqueado', async () => {
  const w = await resp(await kiwify(post('/api/kiwify?chave=wh-chave', { order_status: 'paid', webhook_event_type: 'order_approved', Customer: { email: 'Maria@Email.com ' } })));
  assert.equal(w.acao, 'liberado');
  const a1 = await resp(await ativar(post('/api/ativar', { email: 'maria@email.com', dispositivo: 'aparelho-111' })));
  assert.equal(a1.ok, true); assert.ok(a1.token);
  const a1b = await resp(await ativar(post('/api/ativar', { email: 'MARIA@email.com', dispositivo: 'aparelho-111' })));
  assert.equal(a1b.ok, true, 'mesmo aparelho entra de novo sem gastar vaga');
  const a2 = await resp(await ativar(post('/api/ativar', { email: 'maria@email.com', dispositivo: 'aparelho-222' })));
  assert.equal(a2.ok, true);
  const a3 = await resp(await ativar(post('/api/ativar', { email: 'maria@email.com', dispositivo: 'aparelho-333' })));
  assert.equal(a3.status, 403); assert.equal(a3.erro, 'limite');
  const v = await resp(await verificar(post('/api/verificar', { token: a1.token })));
  assert.equal(v.ok, true);
});

test('e-mail que não comprou não entra', async () => {
  const r = await resp(await ativar(post('/api/ativar', { email: 'pirata@email.com', dispositivo: 'aparelho-999' })));
  assert.equal(r.erro, 'nao_encontrado');
});

test('token adulterado é recusado', async () => {
  const a = await resp(await ativar(post('/api/ativar', { email: 'maria@email.com', dispositivo: 'aparelho-111' })));
  const [corpo, ass] = a.token.split('.');
  const falso = Buffer.from(JSON.stringify({ e: 'maria@email.com', d: 'aparelho-555' })).toString('base64url') + '.' + ass;
  const v = await resp(await verificar(post('/api/verificar', { token: falso })));
  assert.equal(v.erro, 'token_invalido');
  assert.ok(corpo);
});

test('reembolso corta o acesso de quem já estava dentro', async () => {
  const a = await resp(await ativar(post('/api/ativar', { email: 'maria@email.com', dispositivo: 'aparelho-111' })));
  await kiwify(post('/api/kiwify?chave=wh-chave', { order_status: 'refunded', webhook_event_type: 'order_refunded', Customer: { email: 'maria@email.com' } }));
  const v = await resp(await verificar(post('/api/verificar', { token: a.token })));
  assert.equal(v.erro, 'cancelado');
  const n = await resp(await ativar(post('/api/ativar', { email: 'maria@email.com', dispositivo: 'aparelho-111' })));
  assert.equal(n.erro, 'cancelado');
});

test('painel: chave, liberar manual, resetar aparelhos, listar e último webhook', async () => {
  assert.equal((await admin(get('/api/admin?chave=x&acao=listar'))).status, 401);
  const l = await resp(await admin(get('/api/admin?chave=adm-chave&acao=liberar&email=joao@email.com')));
  assert.equal(l.comprador.status, 'ativo');
  for (const d of ['d-aaaaaaaa', 'd-bbbbbbbb']) await ativar(post('/api/ativar', { email: 'joao@email.com', dispositivo: d }));
  const bloqueado = await resp(await ativar(post('/api/ativar', { email: 'joao@email.com', dispositivo: 'd-cccccccc' })));
  assert.equal(bloqueado.erro, 'limite');
  await admin(get('/api/admin?chave=adm-chave&acao=resetar&email=joao@email.com'));
  const novo = await resp(await ativar(post('/api/ativar', { email: 'joao@email.com', dispositivo: 'd-cccccccc' })));
  assert.equal(novo.ok, true, 'depois de resetar, o celular novo entra');
  const lista = await resp(await admin(get('/api/admin?chave=adm-chave&acao=listar')));
  assert.deepEqual(lista.emails.sort(), ['joao@email.com', 'maria@email.com']);
  const wh = await resp(await admin(get('/api/admin?chave=adm-chave&acao=webhook')));
  assert.equal(wh.ultimo.corpo.order_status, 'refunded');
});

test('aviso de pagamento pendente não libera', async () => {
  const w = await resp(await kiwify(post('/api/kiwify?chave=wh-chave', { order_status: 'waiting_payment', Customer: { email: 'pix@email.com' } })));
  assert.ok(w.ignorado);
  const r = await resp(await ativar(post('/api/ativar', { email: 'pix@email.com', dispositivo: 'aparelho-777' })));
  assert.equal(r.erro, 'nao_encontrado');
});

test('toda tentativa no webhook fica anotada, mesmo a recusada', async () => {
  await kiwify(post('/api/kiwify?chave=errada', { order_status: 'paid' }));
  let wh = await resp(await admin(get('/api/admin?chave=adm-chave&acao=webhook')));
  assert.equal(wh.tentativa.chaveOk, false);
  assert.equal(wh.tentativa.corpoTexto, undefined, 'não guarda o corpo quando a chave está errada');
  await kiwify(post('/api/kiwify?chave=wh-chave', { order_status: 'paid', Customer: { email: 'novo@email.com' } }));
  wh = await resp(await admin(get('/api/admin?chave=adm-chave&acao=webhook')));
  assert.equal(wh.tentativa.chaveOk, true);
  assert.match(wh.tentativa.corpoTexto, /novo@email.com/);
  const a = await resp(await ativar(post('/api/ativar', { email: 'novo@email.com', dispositivo: 'aparelho-888' })));
  assert.equal(a.ok, true);
});

test('webhook aceita a chave mesmo com "?signature=" colado pela Kiwify', async () => {
  const r = await resp(await kiwify(post('/api/kiwify?chave=wh-chave?signature=17f3d362f9c9017fd39da60f1b1895e8bae7e339',
    { order_id: 'x', order_status: 'paid', webhook_event_type: 'order_approved', Customer: { email: 'assin@email.com' } })));
  assert.equal(r.acao, 'liberado');
  const ruim = await resp(await kiwify(post('/api/kiwify?chave=outra?signature=abc', { order_status: 'paid' })));
  assert.equal(ruim.status, 401);
});
