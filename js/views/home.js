/* Tela inicial: simples, com o botão principal bem evidente. */
window.D31 = window.D31 || {};
D31.views = D31.views || {};

D31.views.home = () => {
  const { h, progress: P } = D31;
  const T = D31.TOTAL_DIAS;
  const concl = P.concluidosQtd();
  const proximo = P.proximoDia();
  const iniciou = concl > 0 || D31.storage.get().inicio;
  const seq = P.sequencia();
  const historico = D31.storage.get().historico.length > 0;

  const raiz = h('div', { class: 'tela tela-home' });

  raiz.append(h('header', { class: 'hero' },
    h('p', { class: 'selo' }, '5 a 8 minutos por dia'),
    h('h1', { tabindex: '-1' }, 'Desafio 31 Dias'),
    h('p', { class: 'subtitulo' }, 'Uma rotina guiada de movimento, mobilidade e fortalecimento gradual.'),
    h('p', { class: 'chamada' }, 'Alguns minutos por dia. Uma rotina para ajudar você a manter o corpo em movimento.')));

  /* --- cartão de progresso --- */
  const diaTexto = proximo == null ? `${T} de ${T} dias` : `Dia ${proximo} de ${T}`;
  const card = h('section', { class: 'card card-progresso', 'aria-label': 'Seu progresso' },
    h('div', { class: 'progresso-topo' },
      h('div', { class: 'dia-atual' }, diaTexto),
      h('div', { class: 'pct' }, `${P.porcentagem()}%`)),
    D31.BarraProgresso(P.porcentagem()),
    h('div', { class: 'stats' },
      D31.Stat(`🔥 ${seq} ${seq === 1 ? 'dia' : 'dias'}`, 'Sequência atual'),
      D31.Stat(`${concl}`, concl === 1 ? 'Dia concluído' : 'Dias concluídos')));
  if (seq === 0 && historico) {
    card.append(h('p', { class: 'nota' }, 'Sua sequência recomeça quando você treinar. O progresso total continua salvo.'));
  }
  raiz.append(card);

  /* --- ação principal --- */
  const acao = h('section', { class: 'acao' });
  if (proximo == null) {
    acao.append(
      h('p', { class: 'msg-grande' }, '🏆 Você completou os 31 dias!'),
      D31.Botao({ texto: 'VER MEU CERTIFICADO', icone: 'arrow', grande: true, href: '#/desafio-concluido' }));
  } else if (!P.podeTreinar(proximo)) {
    acao.append(
      h('div', { class: 'card card-feito' },
        h('p', { class: 'msg-grande' }, '🎉 Treino de hoje concluído!'),
        h('p', {}, `Descanse bem. Volte amanhã para o Dia ${proximo}.`)),
      D31.Botao({ texto: 'VER CALENDÁRIO', icone: 'calendar', tipo: 'secundario', grande: true, href: '#/calendario' }));
  } else {
    if (P.temAtraso()) {
      acao.append(h('div', { class: 'card card-atraso' },
        h('p', { class: 'msg-grande' }, 'Você não perdeu seu progresso.'),
        h('p', {}, 'Continue a partir de hoje. Seu próximo treino é o Dia ' + proximo + '.'),
        D31.Botao({
          texto: 'CONTINUAR A PARTIR DE HOJE', tipo: 'secundario',
          onclick: () => { P.continuarDeHoje(); D31.router.renderizar(); },
        })));
    }
    const novo = !iniciou;
    const destino = D31.storage.get().aviso ? `#/dia/${proximo}` : '#/antes';
    acao.append(
      D31.Botao({
        texto: novo ? 'COMEÇAR MEU DESAFIO' : `COMEÇAR TREINO · DIA ${proximo}`,
        icone: 'arrow', grande: true, href: destino,
      }),
      h('p', { class: 'motivacao' }, D31.motivacao(proximo)));
  }
  raiz.append(acao);

  raiz.append(h('p', { class: 'link-centro' },
    h('a', { href: '#/antes' }, D31.icon('shield', 22), ' Antes de começar')));
  raiz.append(D31.AvisoSaude());
  return raiz;
};
