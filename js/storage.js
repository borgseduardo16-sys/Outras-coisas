/* Persistência local (localStorage) com fallback em memória. */
window.D31 = window.D31 || {};

D31.storage = (() => {
  const KEY = 'desafio31:v1';
  const vazio = () => ({
    versao: 1,
    inicio: null,        // data (AAAA-MM-DD) que ancora o calendário
    concluidos: {},      // { "1": { data, duracaoSeg, exercicios } }
    historico: [],       // todos os treinos concluídos (inclui repetições)
    ultimoTreino: null,  // data do último treino
    ciclos: 0,           // desafios completos anteriores
    nome: '',
    aviso: false,        // leu "Antes de começar"
    som: true,
  });
  let memoria = null;

  function ler() {
    if (memoria) return memoria;
    try {
      const bruto = localStorage.getItem(KEY);
      memoria = bruto ? { ...vazio(), ...JSON.parse(bruto) } : vazio();
    } catch (e) { memoria = vazio(); }
    return memoria;
  }
  function salvar() {
    try { localStorage.setItem(KEY, JSON.stringify(memoria)); } catch (e) { /* modo privado: segue em memória */ }
  }
  return {
    get: ler,
    set(parcial) { Object.assign(ler(), parcial); salvar(); },
    salvar,
    vazio,
    substituir(novo) { memoria = novo; salvar(); },
  };
})();
