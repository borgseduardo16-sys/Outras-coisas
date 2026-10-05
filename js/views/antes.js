/* "Antes de começar": orientações de saúde e confirmação de leitura. */
window.D31 = window.D31 || {};
D31.views = D31.views || {};

D31.views.antes = () => {
  const { h } = D31;
  const C = D31.ANTES_DE_COMECAR;
  const jaLeu = D31.storage.get().aviso;
  const raiz = h('div', { class: 'tela' });

  raiz.append(
    h('h1', { tabindex: '-1' }, 'Antes de começar'),
    h('p', { class: 'lead' }, C.intro),
    h('section', { class: 'card card-destaque' },
      h('h2', {}, 'Procure orientação profissional antes de iniciar se:'),
      h('ul', { class: 'lista' }, C.procure.map((t) => h('li', {}, t)))),
    h('section', { class: 'card' },
      h('h2', {}, 'Cuidados durante a rotina'),
      h('ul', { class: 'lista' }, C.cuidados.map((t) => h('li', {}, t)))),
    h('p', { class: 'nota-forte' }, C.nota),
    D31.AvisoSaude());

  if (jaLeu) {
    raiz.append(D31.Botao({ texto: 'VOLTAR', icone: 'back', tipo: 'secundario', grande: true, onclick: () => history.back() }));
    return raiz;
  }

  const botao = D31.Botao({ texto: 'VAMOS COMEÇAR', icone: 'arrow', grande: true, disabled: true });
  const caixa = h('input', { type: 'checkbox', id: 'li-entendi' });
  caixa.addEventListener('change', () => { botao.disabled = !caixa.checked; });
  botao.addEventListener('click', () => {
    D31.storage.set({ aviso: true });
    location.hash = `#/dia/${D31.progress.proximoDia() || 1}`;
  });
  raiz.append(
    h('label', { class: 'confirma', for: 'li-entendi' }, caixa,
      h('span', {}, 'Li as orientações e entendo que esta rotina não substitui a avaliação de um profissional de saúde.')),
    botao);
  return raiz;
};
