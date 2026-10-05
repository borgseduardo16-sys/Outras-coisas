/* Pré-visualização do treino do dia, com detalhes e demonstração 3D de cada exercício. */
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
    h('header', { class: 'cab-dia' },
      h('a', { class: 'voltar', href: '#/calendario' }, D31.icon('back', 22), 'Calendário'),
      h('p', { class: 'selo' }, `Fase ${dia.fase.id} · ${dia.fase.nome}`),
      h('h1', { tabindex: '-1' }, `Dia ${n}`),
      h('ul', { class: 'hero-chips escuro' },
        h('li', {}, D31.icon('clock', 18), `≈ ${Math.ceil(dia.totalSeg / 60)} min`),
        h('li', {}, D31.icon('walk', 18), `${dia.itens.length} exercícios`),
        h('li', {}, D31.icon('repeat', 18), `descanso ${dia.descanso} s`)),
      h('p', { class: 'motivacao claro' }, D31.motivacao(n))));

  if (repete) raiz.append(h('p', { class: 'nota-ok' }, 'Você já concluiu este dia. Pode repetir quando quiser — seu progresso total não muda.'));

  raiz.append(D31.Botao({
    texto: 'COMEÇAR TREINO', icone: 'play', grande: true,
    onclick: () => { D31.audio.desbloquear(); location.hash = `#/treino/${n}`; },
  }));

  raiz.append(h('h2', { class: 'secao' }, 'O que vamos fazer hoje'));
  const lista = h('ol', { class: 'plano' });
  dia.itens.forEach(({ exercicio: ex, duracao }, i) => {
    const corpo = h('div', { class: 'plano-det' });
    const det = h('details', { class: 'plano-item' },
      h('summary', {},
        h('span', { class: 'plano-n' }, i + 1),
        h('span', { class: 'plano-txt' }, h('span', { class: 'plano-nome' }, ex.nome), h('span', { class: 'plano-cat' }, D31.CATEGORIAS[ex.categoria])),
        h('span', { class: 'plano-dur' }, `${duracao}s`),
        D31.icon('arrow', 18)),
      corpo);
    det.addEventListener('toggle', () => {
      if (det.open && !corpo.firstChild) {
        corpo.append(
          D31.Demonstracao(ex, { pequeno: false, controles: true }),
          h('div', { class: 'plano-texto' },
            h('p', { class: 'chips' }, h('span', { class: 'chip' }, D31.NIVEIS[ex.nivel])),
            h('p', {}, ex.descricao),
            ex.apoio && h('p', { class: 'apoio' }, h('strong', {}, 'Apoio: '), ex.apoio),
            h('h3', {}, 'Como fazer'), h('ul', { class: 'lista' }, ex.instrucoes.map((t) => h('li', {}, t))),
            h('h3', {}, 'Precauções'), h('ul', { class: 'lista lista-aviso' }, ex.precaucoes.map((t) => h('li', {}, t)))));
      } else if (!det.open) {
        const f = corpo.querySelector('.fig3d'); if (f && f.destruir) f.destruir();
        corpo.replaceChildren();
      }
    });
    lista.append(h('li', {}, det));
  });
  raiz.append(lista);
  raiz.append(h('p', { class: 'nota' }, 'Toque em um exercício para ver a demonstração em 3D. Arraste o boneco para ver de outros ângulos.'));
  raiz.append(D31.AvisoConteudoDemo(), D31.AvisoSaude());
  return raiz;
};
