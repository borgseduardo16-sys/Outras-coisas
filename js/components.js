/* Componentes reutilizáveis de interface. */
window.D31 = window.D31 || {};

(() => {
  const h = D31.h;

  /* ---------- Ícones (SVG inline, traço) ---------- */
  const PATHS = {
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    home: '<path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    skip: '<path d="M5 5l9 7-9 7zM18 5v14"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 010 7"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    repeat: '<path d="M4 12a6 6 0 016-6h8M15 3l3 3-3 3M20 12a6 6 0 01-6 6H6M9 21l-3-3 3-3"/>',
    chair: '<path d="M7 4v9h10M7 13v7M17 13v7M7 17h10"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>',
    moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
    walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M12 8l-2 5 3 2 1 5M12 8l3 2 3 1M10 13l-3 3"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
    print: '<path d="M7 9V4h10v5M7 17H5a1 1 0 01-1-1v-5a1 1 0 011-1h14a1 1 0 011 1v5a1 1 0 01-1 1h-2M7 14h10v6H7z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 01-8 0zM8 6H5v1a3 3 0 003 3M16 6h3v1a3 3 0 01-3 3M12 13v4M8 20h8M10 17h4"/>',
    flame: '<path d="M12 3s5 4.5 5 9.5a5 5 0 01-10 0c0-2 1-3 2-4 .3 1.5 1 2 2 2 0-3-1-5 1-7.5z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    rotate: '<path d="M20 12a8 8 0 11-2.4-5.7M20 4v5h-5"/>',
    turtle: '<path d="M3 15c0-4 3-7 8-7s8 3 8 7zM6 15v3M16 15v3M19 12l2-2"/>',
    zap: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
    shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  };
  D31.icon = (nome, tam = 24) => h('span', {
    class: 'ico', 'aria-hidden': 'true',
    html: `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PATHS[nome] || ''}</svg>`,
  });

  /* ---------- Botão ---------- */
  D31.Botao = ({ texto, icone, tipo = 'primario', grande = false, onclick, href, ...resto }) => {
    const cls = `btn btn-${tipo}${grande ? ' btn-grande' : ''}`;
    const filhos = [icone && D31.icon(icone, 26), h('span', {}, texto)];
    return href
      ? h('a', { class: cls, href, ...resto }, filhos)
      : h('button', { class: cls, type: 'button', onclick, ...resto }, filhos);
  };

  /* ---------- Barra de progresso ---------- */
  D31.BarraProgresso = (pct, rotulo) => h('div', {
    class: 'barra', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100,
    'aria-valuenow': pct, 'aria-label': rotulo || 'Progresso do desafio',
  }, h('div', { class: 'barra-fill', style: `width:${pct}%` }));

  /* ---------- Estatística ---------- */
  D31.Stat = (valor, rotulo) => h('div', { class: 'stat' },
    h('div', { class: 'stat-valor' }, valor), h('div', { class: 'stat-rotulo' }, rotulo));

  /* ---------- Diálogo de confirmação ---------- */
  D31.confirmar = ({ titulo, texto, confirmar = 'Confirmar', cancelar = 'Voltar', perigo = false }) =>
    new Promise((resolve) => {
      const anterior = document.activeElement;
      const fechar = (v) => { dlg.close(); dlg.remove(); anterior && anterior.focus && anterior.focus(); resolve(v); };
      const dlg = h('dialog', { class: 'dialogo', 'aria-labelledby': 'dlg-t' },
        h('h2', { id: 'dlg-t' }, titulo),
        h('p', {}, texto),
        h('div', { class: 'dialogo-acoes' },
          D31.Botao({ texto: cancelar, tipo: 'primario', onclick: () => fechar(false), autofocus: true }),
          D31.Botao({ texto: confirmar, tipo: perigo ? 'perigo' : 'secundario', onclick: () => fechar(true) })));
      dlg.addEventListener('cancel', (e) => { e.preventDefault(); fechar(false); });
      document.body.append(dlg);
      dlg.showModal();
    });

  /* ---------- Aviso de saúde ---------- */
  D31.AvisoSaude = () => h('aside', { class: 'aviso-saude' },
    D31.icon('info', 22), h('p', {}, D31.AVISO_CURTO));

  /* ---------- Ilustração do exercício (placeholder animado) ---------- */
  const FIGURA = (ex) => `
  <svg viewBox="0 0 240 260" role="img" aria-label="Ilustração demonstrativa: ${ex.nome}">
    <ellipse cx="120" cy="238" rx="70" ry="7" class="f-sombra"/>
    ${ex.animacao === 'parede' ? '<rect x="196" y="40" width="10" height="200" rx="3" class="f-obj"/>' : ''}
    ${['calcanhares','quadril','equilibrio','perna','agachar','inclinacao','marcha'].includes(ex.animacao) ? '<g class="f-obj"><rect x="26" y="130" width="8" height="108" rx="3"/><rect x="18" y="124" width="48" height="10" rx="4"/></g>' : ''}
    <g class="fig a-${ex.animacao}">
      <g class="legs">
        <g class="leg leg-l"><line x1="106" y1="150" x2="102" y2="230"/><ellipse class="foot" cx="98" cy="233" rx="13" ry="5"/></g>
        <g class="leg leg-r"><line x1="134" y1="150" x2="138" y2="230"/><ellipse class="foot" cx="142" cy="233" rx="13" ry="5"/></g>
      </g>
      <g class="upper">
        <line class="torso" x1="120" y1="78" x2="120" y2="152"/>
        <line class="ombros" x1="100" y1="82" x2="140" y2="82"/>
        <circle class="head" cx="120" cy="52" r="19"/>
        <g class="arm arm-l"><line x1="100" y1="82" x2="94" y2="146"/></g>
        <g class="arm arm-r"><line x1="140" y1="82" x2="146" y2="146"/></g>
      </g>
    </g>
  </svg>`;

  D31.Demonstracao = (ex, { pequeno = false } = {}) => {
    const m = ex.imagem_ou_video;
    let conteudo;
    if (m && /\.(mp4|webm)$/i.test(m)) {
      conteudo = h('video', { src: m, autoplay: true, loop: true, muted: true, playsinline: true, 'aria-label': `Demonstração: ${ex.nome}` });
    } else if (m) {
      conteudo = h('img', { src: m, alt: `Demonstração: ${ex.nome}` });
    } else {
      conteudo = h('div', { class: 'figura', html: FIGURA(ex) });
    }
    return h('div', { class: `demo${pequeno ? ' demo-pequeno' : ''}` },
      conteudo,
      !m && !pequeno && h('span', { class: 'demo-tag' }, 'Ilustração demonstrativa'));
  };

  /* ---------- Cabeçalho / navegação ---------- */
  D31.Navegacao = (rotaAtual) => {
    const itens = [
      { rota: '#/', icone: 'home', texto: 'Início' },
      { rota: '#/calendario', icone: 'calendar', texto: 'Calendário' },
      { rota: '#/dicas', icone: 'bulb', texto: 'Dicas' },
    ];
    return h('nav', { class: 'nav', 'aria-label': 'Navegação principal' },
      itens.map((i) => h('a', {
        href: i.rota, class: `nav-item${rotaAtual === i.rota ? ' ativo' : ''}`,
        'aria-current': rotaAtual === i.rota ? 'page' : null,
      }, D31.icon(i.icone, 26), h('span', {}, i.texto))));
  };

  D31.Marca = () => h('a', { class: 'marca', href: '#/', 'aria-label': 'Desafio 31 Dias — início' },
    h('span', { class: 'marca-logo', 'aria-hidden': 'true' }, '31'),
    h('span', { class: 'marca-texto' }, 'Desafio 31 Dias'));

  D31.AvisoConteudoDemo = () => !D31.CONTEUDO_VALIDADO && h('div', { class: 'demo-aviso', role: 'note' },
    'Versão de demonstração — os exercícios são ilustrativos e ainda serão revisados por um profissional qualificado.');
})();
