/*
 * BIBLIOTECA DE EXERCÍCIOS — CONTEÚDO DEMONSTRATIVO (PLACEHOLDER)
 *
 * Estes exercícios existem apenas para testar a interface. Antes da venda,
 * devem ser substituídos/revisados por um profissional qualificado
 * (ex.: fisioterapeuta ou profissional de Educação Física).
 *
 * Para trocar um exercício: edite o item abaixo (ou adicione novos) e
 * ajuste js/data/program.js. Para usar vídeo/imagem reais, preencha
 * `imagem_ou_video` com o caminho do arquivo (.mp4/.webm/.jpg/.png/.gif).
 * Enquanto estiver `null`, a interface mostra a ilustração demonstrativa
 * definida em `animacao`.
 *
 * Quando o conteúdo final for validado, mude CONTEUDO_VALIDADO para true.
 */
window.D31 = window.D31 || {};

D31.CONTEUDO_VALIDADO = false;

D31.NIVEIS = {
  1: 'Nível 1 · Muito suave',
  2: 'Nível 2 · Suave',
  3: 'Nível 3 · Moderado',
};

D31.CATEGORIAS = {
  mobilidade: 'Mobilidade',
  alongamento: 'Alongamento suave',
  fortalecimento: 'Fortalecimento leve',
  quadril: 'Mobilidade de quadril',
  toracica: 'Mobilidade torácica',
  equilibrio: 'Equilíbrio',
  funcional: 'Movimento funcional simples',
};

D31.EXERCICIOS = [
  {
    id: 'respiracao', ordem: 1, categoria: 'mobilidade', nome: 'Respiração e postura',
    descricao: 'Respiração tranquila, em pé ou sentado, para começar e terminar a rotina.',
    duracao: 30, nivel: 1, animacao: 'respirar', apoio: null,
    instrucoes: ['Fique em pé ou sentado, com a coluna confortável.', 'Inspire pelo nariz, devagar.', 'Solte o ar pela boca, sem pressa.'],
    precaucoes: ['Se sentir tontura, interrompa e descanse sentado.'],
    imagem_ou_video: null,
  },
  {
    id: 'ombros', ordem: 2, categoria: 'mobilidade', nome: 'Círculos suaves com os ombros',
    descricao: 'Movimento leve e lento de ombros.',
    duracao: 30, nivel: 1, animacao: 'ombros', apoio: null,
    instrucoes: ['Deixe os braços soltos ao lado do corpo.', 'Faça círculos pequenos e lentos com os ombros.', 'Inverta o sentido na metade do tempo.'],
    precaucoes: ['Faça apenas dentro de um movimento confortável.', 'Pare se sentir dor no ombro.'],
    imagem_ou_video: null,
  },
  {
    id: 'bracos', ordem: 3, categoria: 'mobilidade', nome: 'Elevação suave dos braços',
    descricao: 'Elevar os braços até onde for confortável.',
    duracao: 30, nivel: 1, animacao: 'bracos', apoio: null,
    instrucoes: ['Comece com os braços ao lado do corpo.', 'Suba os braços devagar, até onde for confortável.', 'Desça com o mesmo cuidado.'],
    precaucoes: ['Não force além do conforto.', 'Interrompa se sentir dor ou formigamento.'],
    imagem_ou_video: null,
  },
  {
    id: 'inclinacao', ordem: 4, categoria: 'alongamento', nome: 'Inclinação lateral suave',
    descricao: 'Inclinar o tronco para o lado, de forma lenta e curta.',
    duracao: 30, nivel: 1, animacao: 'inclinacao', apoio: 'Apoie uma das mãos em uma cadeira firme, se preferir.',
    instrucoes: ['Pés confortavelmente afastados.', 'Incline o tronco levemente para um lado.', 'Volte ao centro e alterne os lados, sem pressa.'],
    precaucoes: ['Movimento pequeno é suficiente.', 'Evite se sentir tontura ou dor nas costas.'],
    imagem_ou_video: null,
  },
  {
    id: 'rotacao', ordem: 5, categoria: 'toracica', nome: 'Rotação suave do tronco',
    descricao: 'Girar levemente a parte superior do corpo.',
    duracao: 30, nivel: 2, animacao: 'rotacao', apoio: 'Pode ser feito sentado em uma cadeira firme.',
    instrucoes: ['Braços cruzados à frente do peito ou soltos.', 'Gire o tronco um pouco para um lado.', 'Volte ao centro e gire para o outro lado.'],
    precaucoes: ['Gire apenas até onde for confortável.', 'Pare se houver dor nas costas ou formigamento.'],
    imagem_ou_video: null,
  },
  {
    id: 'marcha', ordem: 6, categoria: 'funcional', nome: 'Marcha no lugar',
    descricao: 'Caminhar sem sair do lugar, em ritmo tranquilo.',
    duracao: 30, nivel: 1, animacao: 'marcha', apoio: 'Fique perto de uma parede ou cadeira firme.',
    instrucoes: ['Levante um pé de cada vez, em ritmo confortável.', 'Balance os braços levemente.', 'Mantenha a respiração tranquila.'],
    precaucoes: ['Mantenha um apoio por perto.', 'Reduza o ritmo se ficar ofegante.'],
    imagem_ou_video: null,
  },
  {
    id: 'calcanhares', ordem: 7, categoria: 'fortalecimento', nome: 'Elevação de calcanhares',
    descricao: 'Subir na ponta dos pés com apoio.',
    duracao: 30, nivel: 2, animacao: 'calcanhares', apoio: 'Segure no encosto de uma cadeira firme ou na bancada.',
    instrucoes: ['Segure em um apoio firme.', 'Suba devagar na ponta dos pés.', 'Desça com controle.'],
    precaucoes: ['Use sempre um apoio.', 'Evite se sentir tontura ou instabilidade.'],
    imagem_ou_video: null,
  },
  {
    id: 'quadril', ordem: 8, categoria: 'quadril', nome: 'Círculos suaves de quadril',
    descricao: 'Movimento circular lento com o quadril.',
    duracao: 30, nivel: 1, animacao: 'quadril', apoio: 'Apoie as mãos em uma cadeira firme ou na parede.',
    instrucoes: ['Mãos apoiadas, pés afastados na largura do quadril.', 'Faça círculos pequenos e lentos com o quadril.', 'Troque o sentido na metade do tempo.'],
    precaucoes: ['Círculos pequenos são suficientes.', 'Interrompa se houver dor no quadril ou nas costas.'],
    imagem_ou_video: null,
  },
  {
    id: 'equilibrio1', ordem: 9, categoria: 'equilibrio', nome: 'Equilíbrio com apoio',
    descricao: 'Transferir o peso de um pé para o outro, com apoio.',
    duracao: 30, nivel: 2, animacao: 'equilibrio', apoio: 'Fique ao lado de uma bancada ou cadeira firme, com a mão próxima ao apoio.',
    instrucoes: ['Segure em um apoio firme.', 'Transfira o peso para um pé e levante o outro só um pouco.', 'Apoie o pé e alterne.'],
    precaucoes: ['Sempre com apoio por perto.', 'Evite em caso de tontura ou risco de queda.'],
    imagem_ou_video: null,
  },
  {
    id: 'peitoral', ordem: 10, categoria: 'alongamento', nome: 'Abertura suave do peito',
    descricao: 'Abrir os braços para os lados, com delicadeza.',
    duracao: 30, nivel: 1, animacao: 'peitoral', apoio: null,
    instrucoes: ['Em pé ou sentado, com a coluna ereta.', 'Abra os braços para os lados, devagar.', 'Respire tranquilo e volte.'],
    precaucoes: ['Pare se sentir desconforto nos ombros.', 'Nunca force o movimento.'],
    imagem_ou_video: null,
  },
  {
    id: 'tornozelo', ordem: 11, categoria: 'mobilidade', nome: 'Mobilidade de tornozelos',
    descricao: 'Pequenos círculos com os pés, apoiado.',
    duracao: 30, nivel: 1, animacao: 'tornozelo', apoio: 'Faça sentado ou com apoio firme.',
    instrucoes: ['Apoie-se bem.', 'Levante um pé levemente e faça círculos com o tornozelo.', 'Troque de pé na metade do tempo.'],
    precaucoes: ['Movimento pequeno e lento.', 'Evite se houver lesão recente no tornozelo.'],
    imagem_ou_video: null,
  },
  {
    id: 'meioagacho', ordem: 12, categoria: 'fortalecimento', nome: 'Flexão leve de joelhos com apoio',
    descricao: 'Dobrar os joelhos só um pouco, segurando em um apoio.',
    duracao: 30, nivel: 2, animacao: 'agachar', apoio: 'Segure em uma bancada ou cadeira firme.',
    instrucoes: ['Segure em um apoio firme.', 'Dobre os joelhos apenas um pouco, sem sair do conforto.', 'Volte a ficar em pé, devagar.'],
    precaucoes: ['Faça um movimento curto.', 'Evite se tiver dor nos joelhos ou quadril.', 'Os joelhos acompanham a direção dos pés.'],
    imagem_ou_video: null,
  },
  {
    id: 'paredeflex', ordem: 13, categoria: 'fortalecimento', nome: 'Empurrar a parede',
    descricao: 'Apoiar as mãos na parede e aproximar o corpo dela.',
    duracao: 30, nivel: 2, animacao: 'parede', apoio: 'Fique em frente a uma parede firme.',
    instrucoes: ['Mãos na parede, na altura dos ombros.', 'Dobre os cotovelos e aproxime o corpo, devagar.', 'Empurre e volte.'],
    precaucoes: ['Comece bem perto da parede.', 'Pare se sentir dor no ombro, punho ou cotovelo.'],
    imagem_ou_video: null,
  },
  {
    id: 'pernalateral', ordem: 14, categoria: 'fortalecimento', nome: 'Elevação lateral da perna com apoio',
    descricao: 'Levar a perna levemente para o lado, segurando um apoio.',
    duracao: 30, nivel: 3, animacao: 'perna', apoio: 'Segure em uma cadeira firme ou na bancada.',
    instrucoes: ['Segure em um apoio, corpo ereto.', 'Leve uma perna um pouco para o lado.', 'Volte ao centro e troque de perna na metade do tempo.'],
    precaucoes: ['Movimento curto e controlado.', 'Evite se tiver dor no quadril ou instabilidade.'],
    imagem_ou_video: null,
  },
  {
    id: 'tandem', ordem: 15, categoria: 'equilibrio', nome: 'Equilíbrio com pés em linha',
    descricao: 'Um pé à frente do outro, com apoio próximo.',
    duracao: 30, nivel: 3, animacao: 'equilibrio', apoio: 'Fique ao lado de uma bancada ou parede, com a mão próxima ao apoio.',
    instrucoes: ['Coloque um pé à frente do outro.', 'Mantenha a mão perto do apoio.', 'Troque o pé da frente na metade do tempo.'],
    precaucoes: ['Sempre com apoio por perto.', 'Evite em caso de tontura ou risco de queda.'],
    imagem_ou_video: null,
  },
];

D31.getExercicio = (id) => D31.EXERCICIOS.find((e) => e.id === id);
