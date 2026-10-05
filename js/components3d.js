/* Visualizador 3D do exercício (boneco humano), anel de progresso e demais componentes visuais. */
window.D31 = window.D31 || {};

(() => {
  const h = D31.h;
  const svgFallback = D31.Demonstracao;           // ilustração 2D, usada se não houver WebGL
  const temWebGL = (() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  })();

  /**
   * Boneco 3D. opcoes: { exercicio, controles, giro: 'oscilar'|'girar'|'nenhum', angulo, alto }
   * Retorna o elemento; a instância fica em el.viewer (null se sem WebGL).
   */
  D31.Figura3D = (opcoes = {}) => {
    const ex = opcoes.exercicio || { animacao: 'respirar', nome: 'Demonstração' };
    const el = h('div', { class: `fig3d${opcoes.alto ? ' fig3d-alto' : ''}`, 'data-anim': ex.animacao });
    el.viewer = null;
    if (!window.D31.criarFigura3D || !temWebGL) { el.replaceChildren(svgFallback(ex)); return el; }

    const palco = h('div', { class: 'fig3d-palco', role: 'img', 'aria-label': `Demonstração 3D: ${ex.nome}` });
    el.append(palco);
    const montar = () => {
      if (el.viewer || !el.isConnected) return;
      try {
        el.viewer = D31.criarFigura3D(palco, {
          animacao: ex.animacao, tandem: ex.id === 'tandem', giro: opcoes.giro || 'oscilar', angulo: opcoes.angulo ?? 0.5,
        });
        if (ex.animacao === 'parede') el.viewer.angulo(1.35);
      } catch (e) { el.replaceChildren(svgFallback(ex)); }
    };
    requestAnimationFrame(() => requestAnimationFrame(montar));
    D31.router.aoSair(() => { if (el.viewer) { el.viewer.destruir(); el.viewer = null; } });
    el.destruir = () => { if (el.viewer) { el.viewer.destruir(); el.viewer = null; } };

    if (opcoes.controles) el.append(barraControles(el, palco));
    else el.append(h('span', { class: 'fig3d-dica' }, D31.icon('rotate', 16), ' Arraste para girar'));
    return el;
  };

  function barraControles(el) {
    const v = () => el.viewer;
    const ang = (rad, btn) => { v() && v().angulo(rad); marcar(btn); };
    const botoes = [
      { t: 'Frente', a: 0.0 }, { t: 'Lado', a: Math.PI / 2 }, { t: 'Costas', a: Math.PI },
    ].map((b) => h('button', { type: 'button', class: 'seg', onclick: (e) => ang(b.a, e.currentTarget) }, b.t));
    const marcar = (btn) => botoes.forEach((x) => x.classList.toggle('on', x === btn));
    const girar = h('button', { type: 'button', class: 'seg seg-icone', 'aria-pressed': 'false', 'aria-label': 'Girar automaticamente',
      onclick: () => { const on = girar.getAttribute('aria-pressed') !== 'true'; girar.setAttribute('aria-pressed', on); v() && v().modoGiro(on ? 'girar' : 'nenhum'); botoes.forEach((x) => x.classList.remove('on')); } },
      D31.icon('rotate', 20), h('span', {}, 'Girar'));
    const lento = h('button', { type: 'button', class: 'seg seg-icone', 'aria-pressed': 'false', 'aria-label': 'Câmera lenta',
      onclick: () => { const on = lento.getAttribute('aria-pressed') !== 'true'; lento.setAttribute('aria-pressed', on); v() && v().velocidade(on ? 0.5 : 1); } },
      D31.icon('turtle', 20), h('span', {}, 'Lento'));
    return h('div', { class: 'fig3d-barra', role: 'group', 'aria-label': 'Ângulo da demonstração' }, botoes, girar, lento);
  }

  /** Demonstração: mídia real (se houver) ou boneco 3D. */
  D31.Demonstracao = (ex, { pequeno = false, controles = false } = {}) => {
    const m = ex.imagem_ou_video;
    if (m && /\.(mp4|webm)$/i.test(m)) return h('div', { class: 'demo' }, h('video', { src: m, autoplay: true, loop: true, muted: true, playsinline: true, 'aria-label': `Demonstração: ${ex.nome}` }));
    if (m) return h('div', { class: 'demo' }, h('img', { src: m, alt: `Demonstração: ${ex.nome}` }));
    return D31.Figura3D({ exercicio: ex, controles, alto: !pequeno });
  };

  /** Anel de progresso circular com conteúdo central. */
  D31.Anel = ({ pct, tamanho = 150, traco = 12, centro, cor = 'url(#gAnel)', fundo = 'rgba(255,255,255,.2)', rotulo }) => {
    const r = (tamanho - traco) / 2, c = 2 * Math.PI * r;
    const wrap = h('div', { class: 'anel', style: `width:${tamanho}px;height:${tamanho}px`, role: 'img', 'aria-label': rotulo || `${pct}% concluído` });
    wrap.innerHTML = `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 ${tamanho} ${tamanho}">
      <defs><linearGradient id="gAnel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD27A"/><stop offset="1" stop-color="#FF8F5B"/></linearGradient></defs>
      <circle cx="${tamanho / 2}" cy="${tamanho / 2}" r="${r}" fill="none" stroke="${fundo}" stroke-width="${traco}"/>
      <circle class="anel-arco" cx="${tamanho / 2}" cy="${tamanho / 2}" r="${r}" fill="none" stroke="${cor}" stroke-width="${traco}" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(100, Math.max(0, pct)) / 100)}" transform="rotate(-90 ${tamanho / 2} ${tamanho / 2})"/></svg>`;
    wrap.append(h('div', { class: 'anel-centro' }, centro));
    wrap.setPct = (p) => { wrap.querySelector('.anel-arco').style.strokeDashoffset = c * (1 - Math.min(100, Math.max(0, p)) / 100); };
    return wrap;
  };

  /** Confete leve (CSS) para telas de conquista. */
  D31.Confete = () => {
    const cores = ['#FFC857', '#FF8F5B', '#17A398', '#7BD3C8', '#FFFFFF'];
    return h('div', { class: 'confete', 'aria-hidden': 'true' },
      Array.from({ length: 36 }, (_, i) => h('i', {
        style: `left:${(i * 97) % 100}%;background:${cores[i % cores.length]};animation-delay:${(i % 12) * 0.12}s;animation-duration:${3 + (i % 5) * 0.6}s;transform:rotate(${i * 31}deg)`,
      })));
  };

  D31.saudacao = () => { const hr = new Date().getHours(); return hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite'; };
})();
