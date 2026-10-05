/* Regras de progresso: dia atual, estados do calendário, sequência. */
window.D31 = window.D31 || {};

D31.progress = (() => {
  const S = () => D31.storage.get();
  const T = D31.TOTAL_DIAS;
  const hoje = () => D31.dates.hoje();

  const concluidosQtd = () => Object.keys(S().concluidos).length;
  const foiConcluido = (n) => !!S().concluidos[n];
  const todosConcluidos = () => concluidosQtd() >= T;

  /** Maior dia "liberado" pelo calendário (1 antes de começar). */
  function diaLiberado() {
    const inicio = S().inicio;
    if (!inicio) return 1;
    return Math.max(1, Math.min(T, D31.dates.diff(inicio, hoje()) + 1));
  }

  /** Menor dia ainda não concluído (null se todos concluídos). */
  function proximoDia() {
    for (let n = 1; n <= T; n++) if (!foiConcluido(n)) return n;
    return null;
  }

  /** concluido | disponivel | nao_concluido | futuro */
  function estado(n) {
    if (foiConcluido(n)) return 'concluido';
    const lib = diaLiberado();
    if (n < lib) return 'nao_concluido';
    if (n === lib) return 'disponivel';
    return 'futuro';
  }

  const podeTreinar = (n) => estado(n) !== 'futuro';
  const treinouHoje = () => S().ultimoTreino === hoje();

  /** Há dias liberados que ficaram sem treino antes do próximo a fazer? */
  function temAtraso() {
    const p = proximoDia();
    return p != null && p < diaLiberado();
  }

  /** Sequência: dias consecutivos com treino, terminando hoje ou ontem. */
  function sequencia() {
    const datas = new Set(S().historico.map((h) => h.data));
    let d = hoje();
    if (!datas.has(d)) d = D31.dates.add(d, -1);
    let n = 0;
    while (datas.has(d)) { n++; d = D31.dates.add(d, -1); }
    return n;
  }

  function iniciar() {
    if (!S().inicio) D31.storage.set({ inicio: hoje() });
  }

  function concluirDia(n, { duracaoSeg, exercicios }) {
    const s = S();
    const data = hoje();
    const jaTinha = foiConcluido(n);
    if (!s.inicio) s.inicio = data;
    if (!jaTinha) s.concluidos[n] = { data, duracaoSeg, exercicios };
    s.historico.push({ dia: n, data, duracaoSeg, exercicios, repeticao: jaTinha });
    s.ultimoTreino = data;
    D31.storage.salvar();
    return { repeticao: jaTinha };
  }

  /** "Continuar a partir de hoje": o próximo dia a fazer passa a ser o de hoje. */
  function continuarDeHoje() {
    const p = proximoDia();
    if (p == null) return;
    D31.storage.set({ inicio: D31.dates.add(hoje(), -(p - 1)) });
  }

  /** Recomeça o desafio, preservando nome, preferências e histórico. */
  function recomecar() {
    const s = S();
    const novo = D31.storage.vazio();
    novo.nome = s.nome; novo.som = s.som; novo.aviso = s.aviso;
    novo.historico = s.historico;
    novo.ultimoTreino = s.ultimoTreino;
    novo.ciclos = s.ciclos + (todosConcluidos() ? 1 : 0);
    D31.storage.substituir(novo);
  }

  const ultimaConclusao = () => {
    const datas = Object.values(S().concluidos).map((c) => c.data).sort();
    return datas[datas.length - 1] || hoje();
  };

  return {
    concluidosQtd, foiConcluido, todosConcluidos, diaLiberado, proximoDia, estado,
    podeTreinar, treinouHoje, temAtraso, sequencia, iniciar, concluirDia,
    continuarDeHoje, recomecar, ultimaConclusao,
    porcentagem: () => Math.round((concluidosQtd() / T) * 100),
  };
})();

/* ---------- Extensões: estatísticas, jornada e conquistas ---------- */
(() => {
  const S = () => D31.storage.get();
  const P = D31.progress;

  P.datasComTreino = () => new Set(S().historico.map((h) => h.data));

  P.melhorSequencia = () => {
    const datas = [...P.datasComTreino()].sort();
    let melhor = 0, atual = 0, ant = null;
    datas.forEach((d) => {
      atual = ant && D31.dates.diff(ant, d) === 1 ? atual + 1 : 1;
      melhor = Math.max(melhor, atual); ant = d;
    });
    return melhor;
  };
  P.minutosTotais = () => Math.round(S().historico.reduce((s, h) => s + (h.duracaoSeg || 0), 0) / 60);
  P.exerciciosTotais = () => S().historico.reduce((s, h) => s + (h.exercicios || 0), 0);

  P.progressoFase = (fase) => {
    let feitos = 0;
    for (let n = fase.dias[0]; n <= fase.dias[1]; n++) if (P.foiConcluido(n)) feitos++;
    const total = fase.dias[1] - fase.dias[0] + 1;
    return { feitos, total, completa: feitos === total };
  };

  /** Últimos 7 dias (terminando hoje) com marcação de treino. */
  P.semana = () => {
    const datas = P.datasComTreino(), hoje = D31.dates.hoje(), dias = [];
    const nomes = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    for (let i = 6; i >= 0; i--) {
      const d = D31.dates.add(hoje, -i);
      dias.push({ data: d, letra: nomes[new Date(D31.dates.parse(d)).getUTCDay()], feito: datas.has(d), hoje: i === 0 });
    }
    return dias;
  };

  P.conquistas = () => {
    const c = P.concluidosQtd(), melhor = P.melhorSequencia(), fases = D31.FASES.map(P.progressoFase);
    return [
      { id: 'primeiro', icone: 'star', titulo: 'Primeiro passo', desc: 'Concluiu o 1º treino', ok: c >= 1 },
      { id: 'seq3', icone: 'flame', titulo: '3 dias seguidos', desc: 'Sequência de 3 dias', ok: melhor >= 3 },
      { id: 'semana', icone: 'calendar', titulo: 'Uma semana', desc: '7 dias concluídos', ok: c >= 7 },
      { id: 'fase1', icone: 'shield', titulo: 'Adaptação completa', desc: 'Fase 1 concluída', ok: fases[0].completa },
      { id: 'fase2', icone: 'repeat', titulo: 'Consistência', desc: 'Fase 2 concluída', ok: fases[1].completa },
      { id: 'meio', icone: 'target', titulo: 'Meio caminho', desc: '16 dias concluídos', ok: c >= 16 },
      { id: 'fase3', icone: 'walk', titulo: 'Evolução', desc: 'Fase 3 concluída', ok: fases[2].completa },
      { id: 'final', icone: 'trophy', titulo: 'Desafio completo', desc: '31 dias concluídos', ok: c >= D31.TOTAL_DIAS },
    ];
  };

  P.registrarEsforco = (dia, esforco) => {
    const h = [...S().historico].reverse().find((x) => x.dia === dia);
    if (h) { h.esforco = esforco; D31.storage.salvar(); }
  };
})();
