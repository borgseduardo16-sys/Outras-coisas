/* Textos editoriais: dicas, mensagens motivacionais e avisos de saúde. */
window.D31 = window.D31 || {};

D31.AVISO_CURTO =
  'Esta é uma rotina de atividade física e educação geral. Ela não substitui a avaliação ou a orientação individual de profissionais de saúde.';

D31.ANTES_DE_COMECAR = {
  intro: 'Sua rotina deve respeitar o seu corpo. Leia com calma antes do primeiro treino.',
  procure: [
    'Você tem alguma condição de saúde, faz tratamento ou usa medicamentos que influenciam o movimento.',
    'Sente dor intensa ou dor que piora com o movimento.',
    'Tem sintomas neurológicos, como formigamento, perda de força, tontura frequente ou alterações de equilíbrio.',
    'Teve lesão, cirurgia ou internação recente.',
    'Está há muito tempo sem se exercitar ou tem dúvidas se a rotina é adequada para você.',
  ],
  cuidados: [
    'Use roupas confortáveis e calçado firme ou antiderrapante.',
    'Deixe uma cadeira firme ou bancada por perto para apoio.',
    'Escolha um local com espaço livre e piso sem risco de escorregar.',
    'Respeite os limites do seu corpo: movimento confortável é o suficiente.',
    'Pare imediatamente se sentir dor, tontura, falta de ar incomum ou mal-estar, e procure orientação profissional.',
    'Em caso de sintomas graves ou emergência, procure atendimento de saúde imediatamente.',
  ],
  nota: 'Nenhum exercício é adequado para todas as pessoas. As orientações do programa são gerais e não consideram a sua situação individual.',
};

D31.DICAS = [
  { icone: 'repeat', titulo: 'Regularidade vale mais que intensidade', texto: 'Alguns minutos todos os dias ajudam a criar o hábito. Se um dia for difícil, fazer um pouco ainda conta. Se perder um dia, continue de onde parou.' },
  { icone: 'chair', titulo: 'Postura nas atividades do dia a dia', texto: 'Ao sentar, procure apoiar bem as costas e manter os pés no chão. Ao levantar objetos, aproxime-os do corpo. Mude de posição com frequência para ficar confortável.' },
  { icone: 'clock', titulo: 'Pausas quando ficar muito tempo sentado', texto: 'A cada cerca de uma hora, levante-se, caminhe um pouco pela casa e alongue-se de forma suave. Pequenas pausas fazem parte de uma rotina ativa.' },
  { icone: 'drop', titulo: 'Hidratação', texto: 'Beber água ao longo do dia faz parte de um dia mais confortável. Se você tem orientação médica sobre a quantidade de líquidos, siga-a.' },
  { icone: 'moon', titulo: 'Sono', texto: 'Ter horários regulares para dormir e acordar ajuda a manter a disposição durante o dia. Em caso de dificuldades persistentes de sono, converse com um profissional de saúde.' },
  { icone: 'walk', titulo: 'Movimente-se ao longo do dia', texto: 'Caminhar até a padaria, cuidar das plantas ou dar uma volta no quarteirão também são formas de se movimentar. Escolha o que for confortável para você.' },
  { icone: 'heart', titulo: 'Respeite os limites do seu corpo', texto: 'Cada pessoa é diferente e cada dia é diferente. Se algo causar dor ou desconforto, interrompa o movimento. Seu corpo, seu ritmo.' },
];

D31.MOTIVACAO = [
  'Você está criando uma rotina.',
  'Não precisa fazer tudo de uma vez. Consistência importa.',
  'Hoje foram apenas alguns minutos. Amanhã você continua.',
  'Cada dia conta, no seu ritmo.',
  'Cuidar do movimento é um hábito. Você está construindo o seu.',
  'Um passo de cada vez. Você já começou.',
  'Respeitar seu ritmo também é progresso.',
];

D31.MOTIVACAO_CONCLUIDO = [
  'Mais um dia concluído.',
  'Muito bem! Você reservou um tempo para si.',
  'Parabéns por manter a sua rotina.',
  'Você cumpriu o que se propôs hoje.',
];

D31.motivacao = (n) => D31.MOTIVACAO[(n - 1) % D31.MOTIVACAO.length];
D31.motivacaoConcluido = (n) => D31.MOTIVACAO_CONCLUIDO[(n - 1) % D31.MOTIVACAO_CONCLUIDO.length];
