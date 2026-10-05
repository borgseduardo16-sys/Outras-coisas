/* Seção "Dicas para sua rotina". */
window.D31 = window.D31 || {};
D31.views = D31.views || {};

D31.views.dicas = () => {
  const { h } = D31;
  const raiz = h('div', { class: 'tela' });
  raiz.append(
    h('h1', { tabindex: '-1' }, 'Dicas para sua rotina'),
    h('p', { class: 'lead' }, 'Pequenos hábitos que combinam com o seu movimento diário.'),
    h('div', { class: 'dicas' }, D31.DICAS.map((d) => h('article', { class: 'card dica' },
      h('div', { class: 'dica-ico' }, D31.icon(d.icone, 30)),
      h('div', {}, h('h2', {}, d.titulo), h('p', {}, d.texto))))),
    h('p', { class: 'nota' }, 'Estas dicas têm caráter educativo geral e não constituem tratamento ou orientação médica individual.'),
    D31.Botao({ texto: 'Antes de começar', icone: 'shield', tipo: 'secundario', href: '#/antes' }),
    D31.AvisoSaude());
  return raiz;
};
