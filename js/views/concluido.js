/* Conclusão do dia e conclusão dos 31 dias (com certificado). */
window.D31 = window.D31 || {};
D31.views = D31.views || {};

D31.views.concluido = (n) => {
  const { h, progress: P } = D31;
  const reg = [...D31.storage.get().historico].reverse().find((x) => x.dia === n);
  if (!reg) { location.hash = '#/'; return h('div'); }
  const T = D31.TOTAL_DIAS;
  const prox = P.proximoDia();
  const seq = P.sequencia();

  const esf = h('div', { class: 'esforco' },
    h('p', { class: 'esforco-t' }, 'Como foi o treino de hoje?'),
    h('div', { class: 'esforco-opcoes', role: 'group', 'aria-label': 'Como foi o treino' },
      [['leve', '😌', 'Leve'], ['medida', '🙂', 'Na medida'], ['cansativo', '😮‍💨', 'Cansativo']].map(([v, e, t]) => h('button', {
        type: 'button', class: 'esforco-op', 'aria-pressed': reg.esforco === v ? 'true' : 'false',
        onclick: (ev) => { P.registrarEsforco(n, v); esf.querySelectorAll('.esforco-op').forEach((b) => b.setAttribute('aria-pressed', 'false')); ev.currentTarget.setAttribute('aria-pressed', 'true'); esf.querySelector('.esforco-ok').textContent = 'Anotado. Obrigado!'; },
      }, h('span', { 'aria-hidden': 'true' }, e), t))),
    h('p', { class: 'esforco-ok', 'aria-live': 'polite' }, reg.esforco ? 'Anotado. Obrigado!' : ''));

  return h('div', { class: 'tela tela-festa' },
    D31.Confete(),
    h('div', { class: 'festa-emoji', 'aria-hidden': 'true' }, '🎉'),
    h('h1', { tabindex: '-1' }, 'TREINO CONCLUÍDO!'),
    h('p', { class: 'lead' }, `Você completou o Dia ${n}.`),
    h('p', { class: 'motivacao' }, D31.motivacaoConcluido(n)),
    h('div', { class: 'card stats-grade' },
      D31.Stat(D31.fmtDuracaoLonga(reg.duracaoSeg), 'Duração'),
      D31.Stat(`${reg.exercicios} de ${reg.exercicios}`, 'Exercícios concluídos'),
      D31.Stat(`${P.concluidosQtd()}/${T} · ${P.porcentagem()}%`, 'Progresso total'),
      D31.Stat(`🔥 ${seq} ${seq === 1 ? 'dia' : 'dias'}`, 'Sequência atual')),
    D31.BarraProgresso(P.porcentagem()),
    esf,
    reg.repeticao && h('p', { class: 'nota' }, 'Este dia foi repetido, por isso o progresso total não mudou.'),
    prox && h('p', { class: 'lead' }, P.podeTreinar(prox) ? `Próximo: Dia ${prox}.` : `Volte amanhã para o Dia ${prox}.`),
    D31.Botao({ texto: 'VOLTAR AO CALENDÁRIO', icone: 'calendar', grande: true, href: '#/calendario' }),
    D31.AvisoSaude());
};

D31.views.desafio = () => {
  const { h, progress: P } = D31;
  const T = D31.TOTAL_DIAS;
  if (!P.todosConcluidos()) { location.hash = '#/'; return h('div'); }
  const dataFim = D31.dates.longa(P.ultimaConclusao());

  const nomeEl = h('span', { class: 'cert-nome' });
  const entrada = h('input', {
    type: 'text', id: 'nome', maxlength: 60, autocomplete: 'name', placeholder: 'Seu nome',
    value: D31.storage.get().nome || '',
  });
  const atualizar = () => { nomeEl.textContent = entrada.value.trim() || 'Participante'; };
  entrada.addEventListener('input', () => { D31.storage.set({ nome: entrada.value.trim() }); atualizar(); });
  atualizar();

  return h('div', { class: 'tela tela-festa' },
    D31.Confete(),
    h('div', { class: 'festa-emoji', 'aria-hidden': 'true' }, '🏆'),
    h('h1', { tabindex: '-1' }, 'DESAFIO CONCLUÍDO'),
    h('p', { class: 'lead' }, 'Você completou os 31 dias.'),
    h('div', { class: 'card stats-grade' },
      D31.Stat(`${T}/${T} dias`, 'Concluídos'),
      D31.Stat('100%', 'Concluído')),
    D31.BarraProgresso(100),
    h('p', { class: 'motivacao' }, 'Você criou uma rotina e a manteve. Isso é uma conquista sua.'),

    h('div', { class: 'campo no-print' },
      h('label', { for: 'nome' }, 'Seu nome para o certificado'), entrada),

    h('section', { class: 'certificado', 'aria-label': 'Certificado de conclusão' },
      h('div', { class: 'cert-borda' },
        h('p', { class: 'cert-selo' }, 'Desafio 31 Dias'),
        h('h2', {}, 'Certificado de conclusão'),
        h('p', { class: 'cert-texto' }, 'Certificamos que'),
        nomeEl,
        h('p', { class: 'cert-texto' }, 'concluiu os 31 dias da rotina guiada de movimento, mobilidade e fortalecimento gradual.'),
        h('p', { class: 'cert-data' }, dataFim),
        h('p', { class: 'cert-aviso' }, 'Certificado de participação em uma rotina de atividade física e educação geral.'))),

    h('div', { class: 'acoes-col no-print' },
      D31.Botao({ texto: 'IMPRIMIR OU SALVAR EM PDF', icone: 'print', tipo: 'secundario', grande: true, onclick: () => window.print() }),
      D31.Botao({
        texto: 'RECOMEÇAR DESAFIO', icone: 'repeat', grande: true,
        onclick: async () => {
          const ok = await D31.confirmar({
            titulo: 'Recomeçar o desafio?',
            texto: 'Você começará novamente do Dia 1. Seu histórico e seu nome continuam guardados.',
            confirmar: 'Sim, recomeçar', cancelar: 'Voltar',
          });
          if (ok) { D31.progress.recomecar(); location.hash = '#/'; D31.router.renderizar(); }
        },
      })),
    D31.AvisoSaude());
};
