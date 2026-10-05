/*
 * PROGRAMA DE 31 DIAS — configuração de fases, sequências e durações.
 * Tudo aqui é configurável e deve ser revisado por um profissional qualificado.
 *
 * Cada fase define:
 *  - dias: [primeiro, último]
 *  - descanso: segundos de descanso entre exercícios
 *  - duracao: segundos por exercício no início da fase
 *  - passo/max: aumento gradual (+passo a cada 3 dias da fase, até max)
 *  - rotinas: sequências de ids de exercícios que se alternam ao longo da fase
 * `ESPECIAIS` permite definir uma rotina própria para um dia específico.
 */
window.D31 = window.D31 || {};

D31.TOTAL_DIAS = 31;
D31.PREPARO_SEG = 5;
D31.DURACAO_RESPIRACAO = 30;

D31.FASES = [
  {
    id: 1, nome: 'Adaptação', dias: [1, 7], descanso: 15, duracao: 30, passo: 5, max: 40,
    resumo: 'Movimentos leves para conhecer a rotina.',
    rotinas: [
      ['respiracao', 'ombros', 'bracos', 'inclinacao', 'marcha', 'tornozelo', 'respiracao'],
      ['respiracao', 'ombros', 'rotacao', 'bracos', 'calcanhares', 'peitoral', 'respiracao'],
      ['respiracao', 'quadril', 'inclinacao', 'marcha', 'ombros', 'peitoral', 'respiracao'],
    ],
  },
  {
    id: 2, nome: 'Consistência', dias: [8, 14], descanso: 12, duracao: 40, passo: 5, max: 50,
    resumo: 'Mantendo o hábito, com um pouco mais de variedade.',
    rotinas: [
      ['respiracao', 'ombros', 'rotacao', 'marcha', 'calcanhares', 'equilibrio1', 'respiracao'],
      ['respiracao', 'quadril', 'inclinacao', 'meioagacho', 'tornozelo', 'peitoral', 'respiracao'],
      ['respiracao', 'bracos', 'paredeflex', 'marcha', 'equilibrio1', 'rotacao', 'respiracao'],
    ],
  },
  {
    id: 3, nome: 'Evolução', dias: [15, 21], descanso: 10, duracao: 40, passo: 5, max: 50,
    resumo: 'Progressão gradual, respeitando seus limites.',
    rotinas: [
      ['respiracao', 'ombros', 'rotacao', 'meioagacho', 'pernalateral', 'equilibrio1', 'peitoral', 'respiracao'],
      ['respiracao', 'quadril', 'marcha', 'paredeflex', 'calcanhares', 'tandem', 'inclinacao', 'respiracao'],
      ['respiracao', 'bracos', 'meioagacho', 'pernalateral', 'tornozelo', 'equilibrio1', 'peitoral', 'respiracao'],
    ],
  },
  {
    id: 4, nome: 'Consolidação', dias: [22, 31], descanso: 10, duracao: 45, passo: 5, max: 55,
    resumo: 'Fixando a rotina que você construiu.',
    rotinas: [
      ['respiracao', 'quadril', 'meioagacho', 'paredeflex', 'pernalateral', 'tandem', 'peitoral', 'respiracao'],
      ['respiracao', 'ombros', 'rotacao', 'marcha', 'meioagacho', 'equilibrio1', 'inclinacao', 'respiracao'],
      ['respiracao', 'bracos', 'calcanhares', 'pernalateral', 'tandem', 'paredeflex', 'peitoral', 'respiracao'],
    ],
  },
];

// Rotinas específicas por dia (opcional).
D31.ESPECIAIS = {
  31: ['respiracao', 'ombros', 'bracos', 'rotacao', 'marcha', 'equilibrio1', 'peitoral', 'respiracao'],
};

D31.faseDoDia = (n) => D31.FASES.find((f) => n >= f.dias[0] && n <= f.dias[1]);

/** Monta o treino do dia n (1–31): fase, itens (exercício + duração) e totais. */
D31.getDia = (n) => {
  const fase = D31.faseDoDia(n);
  const idx = n - fase.dias[0];
  const ids = D31.ESPECIAIS[n] || fase.rotinas[idx % fase.rotinas.length];
  const duracao = Math.min(fase.max, fase.duracao + fase.passo * Math.floor(idx / 3));
  const itens = ids.map((id) => ({
    exercicio: D31.getExercicio(id),
    duracao: id === 'respiracao' ? D31.DURACAO_RESPIRACAO : duracao,
  }));
  const totalSeg = itens.reduce((s, i) => s + i.duracao, 0) + fase.descanso * (itens.length - 1);
  return { dia: n, fase, itens, descanso: fase.descanso, totalSeg };
};
