/* Tela inicial: herói com boneco 3D, progresso, treino de hoje, jornada e conquistas. */
window.D31 = window.D31 || {};
D31.views = D31.views || {};

D31.views.home = () => {
  const { h, progress: P } = D31;
  const T = D31.TOTAL_DIAS;
  const concl = P.concluidosQtd();
  const proximo = P.proximoDia();
  const iniciou = concl > 0 || D31.storage.get().inicio;
  const seq = P.sequencia();
  const nome = (D31.storage.get().nome || '').split(' ')[0];
  const pct = P.porcentagem();
  const liberado = proximo != null && P.podeTreinar(proximo);
  const destino = D31.storage.get().aviso ? `#/dia/${proximo}` : '#/antes';
  const demoEx = D31.getExercicio('respiracao');

  const raiz = h('div', { class: 'tela tela-home' });

  /* ---------- Herói ---------- */
  raiz.append(h('header', { class: 'hero' },
    h('div', { class: 'hero-texto' },
      h('p', { class: 'hero-saudacao' }, `${D31.saudacao()}${nome ? ', ' + nome : ''}!`),
      h('h1', { tabindex: '-1' }, 'Desafio 31 Dias'),
      h('p', { class: 'hero-sub' }, 'Uma rotina guiada de movimento, mobilidade e fortalecimento gradual.'),
      h('ul', { class: 'hero-chips' },
        h('li', {}, D31.icon('clock', 18), '5 a 8 min por dia'),
        h('li', {}, D31.icon('calendar', 18), '31 dias'),
        h('li', {}, D31.icon('zap', 18), 'Sem equipamentos'))),
    h('div', { class: 'hero-palco' }, D31.Figura3D({ exercicio: demoEx, giro: 'oscilar', angulo: 0.4 }))));

  raiz.append(h('p', { class: 'hero-chamada' }, 'Alguns minutos por dia. Uma rotina para ajudar você a manter o corpo em movimento.'));

  /* ---------- Progresso ---------- */
  const diaTexto = proximo == null ? 'Concluído' : `Dia ${proximo}`;
  const progresso = h('section', { class: 'card card-progresso', 'aria-label': 'Seu progresso' },
    D31.Anel({
      pct, tamanho: 150, traco: 14, fundo: '#DCEBE8', cor: 'url(#gAnel)',
      rotulo: `${pct}% do desafio concluído`,
      centro: [h('span', { class: 'anel-num' }, `${pct}%`), h('span', { class: 'anel-leg' }, 'concluído')],
    }),
    h('div', { class: 'prog-info' },
      h('p', { class: 'prog-dia' }, proximo == null ? `${T} de ${T} dias` : `${diaTexto} de ${T}`),
      D31.BarraProgresso(pct),
      h('div', { class: 'prog-chips' },
        h('span', { class: 'pill pill-fogo' }, `🔥 Sequência: ${seq} ${seq === 1 ? 'dia' : 'dias'}`),
        h('span', { class: 'pill' }, D31.icon('check', 16), `${concl} ${concl === 1 ? 'dia concluído' : 'dias concluídos'}`))));
  raiz.append(progresso);
  if (seq === 0 && D31.storage.get().historico.length) {
    raiz.append(h('p', { class: 'nota nota-centro' }, 'Sua sequência recomeça quando você treinar. O progresso total continua salvo.'));
  }

  /* ---------- Treino de hoje / ação principal ---------- */
  if (proximo == null) {
    raiz.append(h('section', { class: 'card card-feito' },
      h('p', { class: 'msg-grande' }, '🏆 Você completou os 31 dias!'),
      D31.Botao({ texto: 'VER MEU CERTIFICADO', icone: 'arrow', grande: true, href: '#/desafio-concluido' })));
  } else {
    if (P.temAtraso() && liberado) {
      raiz.append(h('div', { class: 'card card-atraso' },
        h('p', { class: 'msg-grande' }, 'Você não perdeu seu progresso.'),
        h('p', {}, `Continue a partir de hoje. Seu próximo treino é o Dia ${proximo}.`),
        D31.Botao({ texto: 'CONTINUAR A PARTIR DE HOJE', tipo: 'secundario', onclick: () => { P.continuarDeHoje(); D31.router.renderizar(); } })));
    }
    const dia = D31.getDia(proximo);
    const chips = dia.itens.slice(0, 4).map((i) => h('li', {}, i.exercicio.nome));
    if (dia.itens.length > 4) chips.push(h('li', { class: 'mais' }, `+${dia.itens.length - 4}`));
    const cartao = h('section', { class: `card card-hoje${liberado ? '' : ' card-hoje-off'}`, 'aria-label': 'Treino de hoje' },
      h('div', { class: 'hoje-topo' },
        h('span', { class: 'selo' }, `Fase ${dia.fase.id} · ${dia.fase.nome}`),
        h('span', { class: 'hoje-meta' }, D31.icon('clock', 18), `${Math.ceil(dia.totalSeg / 60)} min · ${dia.itens.length} exercícios`)),
      h('h2', {}, liberado ? `Treino de hoje — Dia ${proximo}` : '🎉 Treino de hoje concluído!'),
      liberado
        ? h('ul', { class: 'hoje-lista' }, chips)
        : h('p', {}, `Descanse bem. Volte amanhã para o Dia ${proximo}.`));
    if (liberado) {
      cartao.append(
        D31.Botao({
          texto: iniciou ? `COMEÇAR TREINO · DIA ${proximo}` : 'COMEÇAR MEU DESAFIO',
          icone: 'arrow', grande: true, href: destino,
        }),
        h('p', { class: 'motivacao' }, D31.motivacao(proximo)));
    } else {
      cartao.append(D31.Botao({ texto: 'VER CALENDÁRIO', icone: 'calendar', tipo: 'secundario', grande: true, href: '#/calendario' }));
    }
    raiz.append(cartao);
  }

  /* ---------- Semana ---------- */
  raiz.append(h('section', { class: 'card', 'aria-label': 'Sua semana' },
    h('h2', { class: 'card-titulo' }, 'Sua semana'),
    h('ol', { class: 'semana' }, P.semana().map((d) => h('li', { class: `${d.feito ? 'feito' : ''}${d.hoje ? ' hoje' : ''}` },
      h('span', { class: 'sem-bola', 'aria-hidden': 'true' }, d.feito ? D31.icon('check', 18) : ''),
      h('span', { class: 'sem-letra' }, d.letra),
      h('span', { class: 'sr-only' }, `${D31.dates.longa(d.data)}: ${d.feito ? 'treinou' : 'sem treino'}`))))));

  /* ---------- Estatísticas ---------- */
  raiz.append(h('section', { class: 'stats-3', 'aria-label': 'Resumo' },
    h('div', { class: 'stat-card' }, D31.icon('clock', 26), h('b', {}, P.minutosTotais()), h('span', {}, 'minutos em movimento')),
    h('div', { class: 'stat-card' }, D31.icon('walk', 26), h('b', {}, P.exerciciosTotais()), h('span', {}, 'exercícios feitos')),
    h('div', { class: 'stat-card' }, D31.icon('flame', 26), h('b', {}, P.melhorSequencia()), h('span', {}, 'melhor sequência'))));

  /* ---------- Jornada por fases ---------- */
  raiz.append(h('section', { 'aria-label': 'Sua jornada' },
    h('h2', { class: 'secao' }, 'Sua jornada'),
    h('ol', { class: 'jornada' }, D31.FASES.map((f) => {
      const pr = P.progressoFase(f);
      const atual = proximo != null && proximo >= f.dias[0] && proximo <= f.dias[1];
      return h('li', { class: `fase-card${pr.completa ? ' completa' : ''}${atual ? ' atual' : ''}` },
        h('span', { class: 'fase-n' }, pr.completa ? D31.icon('check', 22) : f.id),
        h('div', { class: 'fase-corpo' },
          h('b', {}, f.nome), h('span', {}, `Dias ${f.dias[0]}–${f.dias[1]}`),
          h('div', { class: 'mini-barra' }, h('i', { style: `width:${(pr.feitos / pr.total) * 100}%` }))),
        h('span', { class: 'fase-qtd' }, `${pr.feitos}/${pr.total}`));
    }))));

  /* ---------- Conquistas ---------- */
  const conq = P.conquistas();
  raiz.append(h('section', { 'aria-label': 'Conquistas' },
    h('h2', { class: 'secao' }, 'Conquistas', h('small', {}, ` ${conq.filter((c) => c.ok).length}/${conq.length}`)),
    h('ul', { class: 'conquistas' }, conq.map((c) => h('li', { class: c.ok ? 'ok' : '' },
      h('span', { class: 'medalha' }, D31.icon(c.ok ? c.icone : 'lock', 26)),
      h('b', {}, c.titulo), h('span', {}, c.desc))))));

  /* ---------- Dica do dia ---------- */
  const dica = D31.DICAS[(proximo || 1) % D31.DICAS.length];
  raiz.append(h('a', { class: 'card dica-dia', href: '#/dicas' },
    h('span', { class: 'dica-ico' }, D31.icon(dica.icone, 30)),
    h('div', {}, h('p', { class: 'selo-peq' }, 'Dica do dia'), h('b', {}, dica.titulo), h('p', {}, dica.texto)),
    D31.icon('arrow', 22)));

  raiz.append(h('p', { class: 'link-centro' }, h('a', { href: '#/antes' }, D31.icon('shield', 22), ' Antes de começar')));
  raiz.append(D31.AvisoSaude());
  return raiz;
};
