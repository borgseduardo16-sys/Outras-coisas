/* Pré-visualização do treino do dia, com detalhes de cada exercício. */
window.D31 = window.D31 || {};
D31.views = D31.views || {};

D31.views.dia = (n) => {
  const { h, progress: P } = D31;
  if (!(n >= 1 && n <= D31.TOTAL_DIAS) || !P.podeTreinar(n)) { location.hash = '#/'; return h('div'); }
  if (!D31.storage.get().aviso) { location.hash = '#/antes'; return h('div'); }

  const dia = D31.getDia(n);
  const raiz = h('div', { class: 'tela' });
  const repete = P.foiConcluido(n);

  raiz.append(
    h('p', { class: 'selo' }, `Fase ${dia.fase.id} · ${dia.fase.nome}`),
    h('h1', { tabindex: '-1' }, `Dia ${n}`),
    h('p', { class: 'lead' }, `${dia.itens.length} exercícios · cerca de ${Math.ceil(dia.totalSeg / 60)} minutos`),
    repete && h('p', { class: 'nota-ok' }, 'Você já concluiu este dia. Pode repetir quando quiser — seu progresso total não muda.'),
    h('p', { class: 'motivacao' }, D31.motivacao(n)));

  raiz.append(D31.Botao({
    texto: 'COMEÇAR TREINO', icone: 'play', grande: true,
    onclick: () => { D31.audio.desbloquear(); location.hash = `#/treino/${n}`; },
  }));

  raiz.append(h('h2', { class: 'secao' }, 'O que vamos fazer hoje'));
  const lista = h('ol', { class: 'plano' });
  dia.itens.forEach(({ exercicio: ex, duracao }, i) => {
    lista.append(h('li', {},
      h('details', { class: 'plano-item' },
        h('summary', {},
          h('span', { class: 'plano-n' }, i + 1),
          h('span', { class: 'plano-nome' }, ex.nome),
          h('span', { class: 'plano-dur' }, `${duracao} s`)),
        h('div', { class: 'plano-det' },
          D31.Demonstracao(ex, { pequeno: true }),
          h('div', {},
            h('p', { class: 'chips' },
              h('span', { class: 'chip' }, D31.NIVEIS[ex.nivel]),
              h('span', { class: 'chip chip-neutro' }, D31.CATEGORIAS[ex.categoria])),
            h('p', {}, ex.descricao),
            ex.apoio && h('p', { class: 'apoio' }, h('strong', {}, 'Apoio: '), ex.apoio),
            h('h3', {}, 'Como fazer'),
            h('ul', { class: 'lista' }, ex.instrucoes.map((t) => h('li', {}, t))),
            h('h3', {}, 'Precauções'),
            h('ul', { class: 'lista lista-aviso' }, ex.precaucoes.map((t) => h('li', {}, t))))))));
  });
  raiz.append(lista);
  raiz.append(h('p', { class: 'nota' }, `Descanso de ${dia.descanso} segundos entre os exercícios. Toque em um exercício para ver detalhes.`));
  raiz.append(D31.AvisoConteudoDemo(), D31.AvisoSaude());
  return raiz;
};
