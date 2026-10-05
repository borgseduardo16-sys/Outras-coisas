/* Treino guiado: exercício → descanso → próximo exercício, com boneco 3D e cronômetro em anel. */
window.D31 = window.D31 || {};
D31.views = D31.views || {};

D31.views.treino = (n) => {
  const { h, progress: P } = D31;
  if (!(n >= 1 && n <= D31.TOTAL_DIAS) || !P.podeTreinar(n) || !D31.storage.get().aviso) {
    location.hash = '#/'; return h('div');
  }
  const dia = D31.getDia(n);
  const total = dia.itens.length;

  const etapas = [{ tipo: 'preparo', dur: D31.PREPARO_SEG, ex: dia.itens[0].exercicio }];
  dia.itens.forEach((it, i) => {
    etapas.push({ tipo: 'exercicio', i, ex: it.exercicio, dur: it.duracao });
    if (i < total - 1) etapas.push({ tipo: 'descanso', ex: dia.itens[i + 1].exercicio, dur: dia.descanso });
  });

  let idx = 0, restante = etapas[0].dur, pausado = false, ativo = 0, ultimo = performance.now();
  let ultimoInteiro = Math.ceil(restante), timer = null, wake = null, encerrado = false;

  const contador = h('span', { class: 'treino-contador' });
  const titulo = h('h1', { class: 'treino-titulo', tabindex: '-1' });
  const segmentos = h('ol', { class: 'segmentos', 'aria-hidden': 'true' },
    dia.itens.map(() => h('li', {}, h('i'))));
  const figura = D31.Figura3D({ exercicio: { animacao: 'respirar', nome: 'Demonstração' }, controles: true, giro: 'nenhum', angulo: 0.4, alto: true });
  const tempo = h('span', { class: 'relogio', role: 'timer', 'aria-label': 'Tempo restante' });
  const rotuloAnel = h('span', { class: 'anel-leg' });
  const anel = D31.Anel({ pct: 100, tamanho: 190, traco: 14, fundo: 'rgba(255,255,255,.16)', centro: [tempo, rotuloAnel], rotulo: 'Tempo restante' });
  const lateral = h('div', { class: 'treino-lateral' });
  const texto = h('div', { class: 'treino-texto' });
  const controles = h('div', { class: 'treino-controles' });
  const anuncio = h('div', { class: 'sr-only', 'aria-live': 'polite' });

  const botaoSom = h('button', { class: 'btn-icone', type: 'button', onclick: () => { D31.storage.set({ som: !D31.storage.get().som }); atualizarSom(); } });
  const atualizarSom = () => {
    const som = D31.storage.get().som;
    botaoSom.replaceChildren(D31.icon(som ? 'sound' : 'mute', 26));
    botaoSom.setAttribute('aria-label', som ? 'Desligar sons' : 'Ligar sons');
  };
  atualizarSom();

  const sair = async () => {
    const jaPausado = pausado; pausado = true; aplicarPausa(); renderControles();
    const ok = await D31.confirmar({
      titulo: 'Sair do treino?',
      texto: 'Este treino ainda não será marcado como concluído. Você pode recomeçá-lo quando quiser.',
      confirmar: 'Sair do treino', cancelar: 'Continuar treino',
    });
    if (ok) { limpar(); location.hash = `#/dia/${n}`; }
    else { pausado = jaPausado; ultimo = performance.now(); aplicarPausa(); renderControles(); }
  };
  const aplicarPausa = () => { if (figura.viewer) figura.viewer.pausar(pausado); };

  const raiz = h('div', { class: 'treino', 'data-tipo': 'preparo' },
    h('div', { class: 'treino-topo' }, contador,
      h('div', { class: 'treino-topo-acoes' }, botaoSom,
        h('button', { class: 'btn-sair', type: 'button', onclick: sair }, D31.icon('close', 22), h('span', {}, 'Sair')))),
    segmentos, titulo,
    h('div', { class: 'treino-palco' }, figura),
    h('div', { class: 'treino-meio' }, anel, lateral),
    texto, controles,
    h('p', { class: 'treino-rodape' }, 'Sentiu dor, tontura ou desconforto? Pare e procure orientação profissional.'),
    anuncio);

  const aviso = (e) => h('p', { class: 'atencao' }, D31.icon('info', 20), h('span', {}, [e.ex.apoio, e.ex.precaucoes[0]].filter(Boolean).join(' ')));

  function renderEtapa() {
    const e = etapas[idx];
    raiz.dataset.tipo = e.tipo;
    texto.replaceChildren(); lateral.replaceChildren();
    const feitos = e.tipo === 'exercicio' ? e.i : e.tipo === 'descanso' ? etapas.slice(0, idx).filter((x) => x.tipo === 'exercicio').length : 0;
    [...segmentos.children].forEach((li, i) => { li.className = i < feitos ? 'feito' : (e.tipo === 'exercicio' && i === e.i) ? 'ativo' : ''; });

    if (e.tipo === 'exercicio') {
      contador.textContent = `EXERCÍCIO ${e.i + 1} DE ${total}`;
      titulo.textContent = e.ex.nome;
      rotuloAnel.textContent = 'segundos';
      if (figura.viewer) figura.viewer.definirAnimacao(e.ex.animacao, { tandem: e.ex.id === 'tandem' });
      lateral.append(h('span', { class: 'chip chip-claro' }, D31.NIVEIS[e.ex.nivel]), h('p', { class: 'treino-desc' }, e.ex.descricao));
      texto.append(h('ol', { class: 'passos' }, e.ex.instrucoes.map((t) => h('li', {}, t))), aviso(e));
      anuncio.textContent = `Exercício ${e.i + 1} de ${total}: ${e.ex.nome}. ${e.dur} segundos.`;
    } else {
      const prep = e.tipo === 'preparo';
      contador.textContent = prep ? 'PREPARE-SE' : 'DESCANSO';
      titulo.textContent = prep ? 'Prepare-se' : 'Descanso';
      rotuloAnel.textContent = prep ? 'começa em' : 'respire';
      if (figura.viewer) figura.viewer.definirAnimacao('respirar');
      lateral.append(h('p', { class: 'proximo-rotulo' }, prep ? 'Primeiro exercício' : 'A seguir'), h('b', { class: 'proximo-nome' }, e.ex.nome),
        h('span', { class: 'chip chip-claro' }, D31.NIVEIS[e.ex.nivel]));
      texto.append(h('p', { class: 'respire' }, prep ? 'Posicione-se com calma. O treino começa em instantes.' : 'Respire e prepare-se para o próximo movimento.'), aviso(e));
      anuncio.textContent = prep ? 'Prepare-se. O treino vai começar.' : `Descanso. Próximo: ${e.ex.nome}.`;
    }
    renderControles(); renderRelogio();
  }

  function renderControles() {
    const e = etapas[idx];
    controles.replaceChildren(...[
      D31.Botao({
        texto: pausado ? 'CONTINUAR' : 'PAUSAR', icone: pausado ? 'play' : 'pause', grande: true,
        tipo: pausado ? 'primario' : 'secundario',
        onclick: () => { pausado = !pausado; ultimo = performance.now(); aplicarPausa(); renderControles(); },
      }),
      e.tipo !== 'exercicio' && D31.Botao({ texto: e.tipo === 'preparo' ? 'COMEÇAR AGORA' : 'PULAR DESCANSO', icone: 'skip', tipo: 'texto', onclick: proxima }),
    ].filter(Boolean));
    raiz.classList.toggle('pausado', pausado);
    if (pausado) anuncio.textContent = 'Treino pausado.';
  }

  function renderRelogio() {
    const e = etapas[idx];
    tempo.textContent = D31.fmtTime(Math.ceil(restante));
    anel.setPct((restante / e.dur) * 100);
  }

  function proxima() {
    idx++;
    if (idx >= etapas.length) return finalizar();
    restante = etapas[idx].dur; ultimoInteiro = Math.ceil(restante); ultimo = performance.now();
    D31.audio.troca();
    renderEtapa();
  }

  function finalizar() {
    if (encerrado) return;
    limpar(); D31.audio.fim();
    D31.progress.concluirDia(n, { duracaoSeg: Math.round(ativo), exercicios: total });
    location.hash = D31.progress.todosConcluidos() ? '#/desafio-concluido' : `#/concluido/${n}`;
  }

  function tick() {
    const agora = performance.now();
    const dt = (agora - ultimo) / 1000; ultimo = agora;
    if (pausado || encerrado) return;
    restante -= dt;
    if (etapas[idx].tipo !== 'preparo') ativo += dt;
    const inteiro = Math.ceil(restante);
    if (inteiro !== ultimoInteiro) { ultimoInteiro = inteiro; if (inteiro > 0 && inteiro <= 3) D31.audio.tic(); }
    if (restante <= 0) proxima(); else renderRelogio();
  }

  async function pedirTelaLigada() { try { if ('wakeLock' in navigator) wake = await navigator.wakeLock.request('screen'); } catch (e) { /* opcional */ } }
  const aoVoltar = () => { if (document.visibilityState === 'visible' && !encerrado) pedirTelaLigada(); };
  function limpar() {
    encerrado = true; clearInterval(timer);
    document.removeEventListener('visibilitychange', aoVoltar);
    try { wake && wake.release(); } catch (e) {}
  }

  timer = setInterval(tick, 200);
  document.addEventListener('visibilitychange', aoVoltar);
  pedirTelaLigada();
  D31.router.aoSair(limpar);
  renderEtapa();
  return raiz;
};
