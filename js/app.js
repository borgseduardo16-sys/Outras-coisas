/* Roteador por hash e montagem da aplicação. */
window.D31 = window.D31 || {};

D31.router = (() => {
  const { h } = D31;
  let limpezas = [];
  const app = () => document.getElementById('app');

  function aoSair(fn) { limpezas.push(fn); }

  function resolver(hash) {
    const [, rota = '', arg] = hash.replace(/^#/, '').split('/');
    const n = parseInt(arg, 10);
    switch (rota) {
      case '': return { v: D31.views.home, nav: '#/' };
      case 'calendario': return { v: D31.views.calendario, nav: '#/calendario' };
      case 'dicas': return { v: D31.views.dicas, nav: '#/dicas' };
      case 'antes': return { v: D31.views.antes, nav: null };
      case 'dia': return { v: () => D31.views.dia(n), nav: null };
      case 'treino': return { v: () => D31.views.treino(n), nav: null, imersivo: true };
      case 'concluido': return { v: () => D31.views.concluido(n), nav: null };
      case 'desafio-concluido': return { v: D31.views.desafio, nav: null };
      default: return { v: D31.views.home, nav: '#/' };
    }
  }

  function renderizar() {
    limpezas.forEach((f) => { try { f(); } catch (e) {} });
    limpezas = [];
    const alvo = app();
    const r = resolver(location.hash);
    const conteudo = r.v();
    document.body.classList.toggle('imersivo', !!r.imersivo);
    alvo.replaceChildren(...[
      !r.imersivo && h('header', { class: 'topo' }, D31.Marca()),
      h('main', { id: 'conteudo', class: 'conteudo', tabindex: '-1' }, conteudo),
      !r.imersivo && D31.Navegacao(r.nav),
    ].filter(Boolean));
    window.scrollTo(0, 0);
    const foco = alvo.querySelector('h1');
    if (foco) foco.focus({ preventScroll: true });
  }

  function iniciar() {
    window.addEventListener('hashchange', renderizar);
    renderizar();
  }
  return { iniciar, renderizar, aoSair };
})();

document.addEventListener('DOMContentLoaded', D31.router.iniciar);
