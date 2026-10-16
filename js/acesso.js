/*
 * Controle de acesso por comprador: na 1ª vez pede o e-mail da compra; cada e-mail funciona em até 2 aparelhos.
 * Se o acesso for compartilhado além disso, ou cancelado (reembolso), mostra uma tela preta de bloqueio.
 * Depois de liberado, o app abre direto (inclusive sem internet) e confere o acesso em segundo plano.
 */
window.D31 = window.D31 || {};

D31.acesso = (() => {
  const { h } = D31;
  const K_TOKEN = 'd31:acesso', K_DISP = 'd31:dispositivo', K_BLOQ = 'd31:bloqueio';
  const API = '/api';
  const ler = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const gravar = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };

  // Rodando como arquivo local ou em teste local: sem bloqueio.
  const desligado = () => location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(location.hostname) && !window.D31_TESTE_ACESSO;

  function dispositivo() {
    let id = ler(K_DISP);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      gravar(K_DISP, id);
    }
    return id;
  }
  const nomeAparelho = () => (navigator.userAgentData?.platform || navigator.platform || '') + ' · ' + (navigator.userAgent || '').slice(0, 80);

  async function chamar(rota, dados) {
    const r = await fetch(`${API}/${rota}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dados) });
    let corpo = {};
    try { corpo = await r.json(); } catch (e) {}
    return corpo;
  }

  /* ---------- Telas ---------- */
  function telaBloqueio(motivo) {
    const textos = {
      limite: ['Acesso bloqueado', 'Este acesso já está sendo usado em outros aparelhos. O Desafio 31 Dias é individual e não pode ser compartilhado.', 'Se você é quem comprou e trocou de celular, fale com o suporte pela Kiwify.'],
      cancelado: ['Acesso encerrado', 'Esta compra foi cancelada ou reembolsada.', 'Se acha que é um engano, fale com o suporte pela Kiwify.'],
    };
    const [titulo, texto, ajuda] = textos[motivo] || textos.limite;
    document.body.className = 'tela-acesso tela-bloqueio';
    document.getElementById('app').replaceChildren(h('div', { class: 'acesso-caixa', role: 'alert' },
      h('div', { class: 'acesso-cadeado', 'aria-hidden': 'true' }, D31.icon ? D31.icon('lock', 34) : '🔒'),
      h('h1', {}, titulo), h('p', {}, texto), h('p', { class: 'acesso-ajuda' }, ajuda),
      h('button', { type: 'button', class: 'acesso-link', onclick: () => { gravar(K_TOKEN, null); gravar(K_BLOQ, null); telaEmail(); } }, 'Entrar com outro e-mail')));
  }

  let aoLiberar = () => {};
  function telaEmail(msg = '') {
    document.body.className = 'tela-acesso';
    const campo = h('input', { type: 'email', id: 'acesso-email', autocomplete: 'email', inputmode: 'email', placeholder: 'seuemail@exemplo.com', required: true });
    const aviso = h('p', { class: 'acesso-erro', 'aria-live': 'polite' }, msg);
    const botao = h('button', { type: 'submit', class: 'acesso-botao' }, 'ENTRAR');
    const form = h('form', { class: 'acesso-form', novalidate: true },
      h('label', { for: 'acesso-email' }, 'E-mail usado na compra'), campo, aviso, botao);
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const email = campo.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { aviso.textContent = 'Digite um e-mail válido.'; return; }
      botao.disabled = true; botao.textContent = 'VERIFICANDO...'; aviso.textContent = '';
      let r;
      try { r = await chamar('ativar', { email, dispositivo: dispositivo(), nome: nomeAparelho() }); } catch (e) { r = { erro: 'rede' }; }
      botao.disabled = false; botao.textContent = 'ENTRAR';
      if (r.ok && r.token) { gravar(K_TOKEN, r.token); gravar(K_BLOQ, null); document.body.className = ''; aoLiberar(); return; }
      if (r.erro === 'limite' || r.erro === 'cancelado') { telaBloqueio(r.erro); return; }
      aviso.textContent = {
        nao_encontrado: 'Não encontramos uma compra com esse e-mail. Use o mesmo e-mail da compra na Kiwify.',
        rede: 'Sem conexão. Conecte-se à internet para entrar pela primeira vez.',
      }[r.erro] || 'Não foi possível entrar agora. Tente de novo em instantes.';
    });
    document.getElementById('app').replaceChildren(h('div', { class: 'acesso-caixa' },
      h('div', { class: 'acesso-marca' }, h('span', { class: 'acesso-31' }, '31'), ' Desafio 31 Dias'),
      h('h1', {}, 'Bem-vindo(a)!'),
      h('p', {}, 'Para começar, digite o e-mail que você usou na compra. Você só faz isso uma vez neste aparelho.'),
      form,
      h('p', { class: 'acesso-ajuda' }, 'Seu acesso é pessoal e funciona em até 2 aparelhos.')));
    setTimeout(() => campo.focus(), 50);
  }

  /** Abre o app se este aparelho já está liberado; senão pede o e-mail. Confere o acesso em segundo plano. */
  function garantir(iniciarApp) {
    aoLiberar = iniciarApp;
    if (desligado()) { iniciarApp(); return; }
    const bloq = ler(K_BLOQ);
    if (bloq) { telaBloqueio(bloq); return; }
    const token = ler(K_TOKEN);
    if (!token) { telaEmail(); return; }
    iniciarApp();
    if (navigator.onLine === false) return;
    chamar('verificar', { token }).then((r) => {
      if (r.ok) return;
      if (r.erro === 'limite' || r.erro === 'cancelado' || r.erro === 'token_invalido' || r.erro === 'nao_encontrado') {
        gravar(K_TOKEN, null);
        if (r.erro === 'limite' || r.erro === 'cancelado') gravar(K_BLOQ, r.erro);
        location.reload();   // recarrega já na tela certa (o app aberto some por completo)
      }
    }).catch(() => { /* sem internet ou servidor fora: mantém o acesso já liberado */ });
  }

  return { garantir };
})();
