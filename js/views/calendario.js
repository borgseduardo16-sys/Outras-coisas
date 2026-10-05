/* Calendário visual dos 31 dias, agrupado por fases. */
window.D31 = window.D31 || {};
D31.views = D31.views || {};

D31.views.calendario = () => {
  const { h, progress: P } = D31;
  const T = D31.TOTAL_DIAS;
  const raiz = h('div', { class: 'tela' });

  raiz.append(
    h('h1', { tabindex: '-1' }, 'Seu calendário'),
    h('p', { class: 'lead' }, `${P.concluidosQtd()} de ${T} dias concluídos`),
    D31.BarraProgresso(P.porcentagem()));

  if (P.temAtraso() && P.proximoDia() != null) {
    raiz.append(h('div', { class: 'card card-atraso' },
      h('p', { class: 'msg-grande' }, 'Você não perdeu seu progresso.'),
      h('p', {}, 'Continue a partir de hoje. Os dias concluídos continuam salvos.'),
      D31.Botao({ texto: 'CONTINUAR A PARTIR DE HOJE', tipo: 'secundario',
        onclick: () => { P.continuarDeHoje(); D31.router.renderizar(); } })));
  }

  raiz.append(h('ul', { class: 'legenda', 'aria-label': 'Legenda' },
    h('li', {}, h('span', { class: 'tile-mini t-concluido' }, D31.icon('check', 16)), 'Concluído'),
    h('li', {}, h('span', { class: 'tile-mini t-disponivel' }), 'Disponível'),
    h('li', {}, h('span', { class: 'tile-mini t-nao_concluido' }), 'Não concluído'),
    h('li', {}, h('span', { class: 'tile-mini t-futuro' }, D31.icon('lock', 14)), 'Futuro')));

  const ROTULO = { concluido: 'concluído', disponivel: 'disponível', nao_concluido: 'não concluído', futuro: 'futuro, ainda bloqueado' };
  D31.FASES.forEach((fase) => {
    const grade = h('div', { class: 'grade' });
    for (let n = fase.dias[0]; n <= fase.dias[1]; n++) {
      const est = P.estado(n);
      const icone = est === 'concluido' ? D31.icon('check', 22) : est === 'futuro' ? D31.icon('lock', 18) : null;
      const filhos = [h('span', { class: 'tile-num' }, n), icone];
      const attrs = { class: `tile t-${est}`, 'aria-label': `Dia ${n}, ${ROTULO[est]}` };
      grade.append(est === 'futuro'
        ? h('div', { ...attrs, role: 'img' }, filhos)
        : h('a', { ...attrs, href: `#/dia/${n}` }, filhos));
    }
    raiz.append(h('section', { class: 'fase' },
      h('h2', {}, `Fase ${fase.id} — ${fase.nome}`),
      h('p', { class: 'fase-sub' }, `Dias ${fase.dias[0]}–${fase.dias[1]} · ${fase.resumo}`),
      grade));
  });

  raiz.append(h('div', { class: 'rodape-acao' },
    D31.Botao({
      texto: 'Recomeçar desafio', tipo: 'texto',
      onclick: async () => {
        const ok = await D31.confirmar({
          titulo: 'Recomeçar o desafio?',
          texto: 'Os dias concluídos voltarão a zero e você começa novamente do Dia 1. Esta ação não pode ser desfeita.',
          confirmar: 'Sim, recomeçar', cancelar: 'Manter meu progresso', perigo: true,
        });
        if (ok) { D31.progress.recomecar(); location.hash = '#/'; D31.router.renderizar(); }
      },
    })));
  raiz.append(D31.AvisoSaude());
  return raiz;
};
