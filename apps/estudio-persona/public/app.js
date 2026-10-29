/* Persona Studio: interface. Conversa só com o servidor local (servidor.mjs). */

const $ = (id) => document.getElementById(id);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

/* ---------- Ícones ---------- */
const ICONES = {
  ajustes: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="15" cy="6" r="2" fill="#fff"/><circle cx="9" cy="12" r="2" fill="#fff"/><circle cx="17" cy="18" r="2" fill="#fff"/>',
  imagem: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-9 9"/>',
  som: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  baixar: '<path d="M12 3v12M7 10l5 5 5-5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  lixo: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  play: '<path d="M8 5v14l11-7z"/>',
};
const icone = (nome) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nome] || ''}</svg>`;
function aplicarIcones(raiz = document) {
  for (const e of $$('[data-icone]', raiz)) {
    if (e.querySelector(':scope > .ic')) continue;
    e.insertAdjacentHTML('afterbegin', icone(e.dataset.icone));
  }
}

/** Cria elementos com texto seguro (nada de HTML vindo do usuário). */
function el(tag, attrs = {}, ...filhos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const f of filhos.flat()) if (f != null) e.append(f.nodeType ? f : document.createTextNode(String(f)));
  return e;
}

/* ---------- Comunicação ---------- */
async function api(metodo, url, corpo) {
  const r = await fetch(url, {
    method: metodo,
    headers: corpo ? { 'Content-Type': 'application/json' } : {},
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  let j = null;
  try { j = await r.json(); } catch {}
  if (!r.ok) throw new Error(j?.erro || `Erro ${r.status}`);
  return j;
}
function avisar(msg, tipo = '') {
  const t = el('div', { class: `toast ${tipo}` }, msg);
  $('avisos').append(t);
  setTimeout(() => t.remove(), tipo === 'erro' ? 6000 : 3200);
}
async function comCarregando(botao, fn) {
  botao.classList.add('carregando');
  try { return await fn(); } finally { botao.classList.remove('carregando'); }
}
const lerArquivo = (f) => new Promise((ok, falha) => {
  const r = new FileReader();
  r.onload = () => ok(r.result);
  r.onerror = () => falha(new Error('Não foi possível ler o arquivo.'));
  r.readAsDataURL(f);
});
const duracaoDe = (url) => new Promise((ok) => {
  const a = new Audio();
  a.preload = 'metadata';
  a.onloadedmetadata = () => ok(Number.isFinite(a.duration) ? a.duration : null);
  a.onerror = () => ok(null);
  a.src = url;
});
const fmtSeg = (s) => (s == null ? '—' : s < 60 ? `${Math.round(s)} s` : `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`);
const fmtUsd = (v) => `US$ ${v.toFixed(2).replace('.', ',')}`;

/* ---------- Estado ---------- */
const est = {
  estado: null,
  modelos: [],
  modeloId: 'omnihuman-15',
  resolucao: null,
  formato: '9:16',
  personagens: [],
  personagemId: null,
  vozes: [],
  audio: null,
  direcao: { enquadramento: 'selfie', energia: 'natural', gestos: 'sutis', expressao: 'neutra', camera: 'mao', extra: '' },
  trabalho: null,
  trabalhos: [],
  modoPalco: 'previa', // previa | gerando | resultado | erro
};
const modeloAtual = () => est.modelos.find((m) => m.id === est.modeloId);
const personagemAtual = () => est.personagens.find((p) => p.id === est.personagemId);

const RASCUNHO = 'persona:rascunho';
function salvarRascunho() {
  try {
    localStorage.setItem(RASCUNHO, JSON.stringify({
      texto: $('texto').value, vozId: $('voz').value, modeloVoz: $('modelo-voz').value,
      ajustes: lerAjustes(), direcao: est.direcao, modeloId: est.modeloId, resolucao: est.resolucao,
      rapido: $('rapido').checked, formato: est.formato, personagemId: est.personagemId,
      endpoint: $('endpoint').value, extras: $('extras').value, audioId: est.audio?.id || null,
    }));
  } catch {}
}
function lerRascunho() {
  try { return JSON.parse(localStorage.getItem(RASCUNHO)) || {}; } catch { return {}; }
}

/* ---------- Abas ---------- */
function ligarAbas(etapa) {
  const abas = $$('.aba', etapa);
  for (const a of abas) a.addEventListener('click', () => trocarAba(etapa, a.dataset.aba));
}
function trocarAba(etapa, nome) {
  for (const a of $$('.aba', etapa)) a.classList.toggle('ativa', a.dataset.aba === nome);
  for (const p of $$('.aba-painel', etapa)) p.hidden = p.dataset.painel !== nome;
}

/* ---------- Conexões ---------- */
function mostrarConexoes() {
  const e = est.estado;
  $('conexao-fal').classList.toggle('ok', e.fal);
  $('conexao-eleven').classList.toggle('ok', e.eleven);
  $('conexao-fal').title = e.fal ? `fal.ai conectado (${e.falMascara})` : 'fal.ai não conectado';
  $('conexao-eleven').title = e.eleven ? `ElevenLabs conectado (${e.elevenMascara})` : 'ElevenLabs não conectado';
  $('aviso-demo').hidden = e.fal;
}

/* ---------- 1. Personagem ---------- */
const recorte = { img: null, zoom: 1, cx: 0, cy: 0, arrastando: null, nomeArquivo: '' };
const TAMANHO = { '9:16': [1080, 1920], '1:1': [1080, 1080], '16:9': [1920, 1080] };
const PREVIA = { '9:16': [360, 640], '1:1': [480, 480], '16:9': [640, 360] };

function escalaRecorte() {
  const c = $('recorte-canvas');
  const { img } = recorte;
  return Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight) * recorte.zoom;
}
function limitarRecorte() {
  const c = $('recorte-canvas');
  const s = escalaRecorte();
  const meioW = c.width / (2 * s), meioH = c.height / (2 * s);
  recorte.cx = Math.min(Math.max(recorte.cx, meioW), recorte.img.naturalWidth - meioW);
  recorte.cy = Math.min(Math.max(recorte.cy, meioH), recorte.img.naturalHeight - meioH);
}
function desenharRecorte(canvas = $('recorte-canvas')) {
  if (!recorte.img) return;
  const base = $('recorte-canvas');
  const s = escalaRecorte() * (canvas.width / base.width);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(recorte.img, recorte.cx - canvas.width / (2 * s), recorte.cy - canvas.height / (2 * s), canvas.width / s, canvas.height / s, 0, 0, canvas.width, canvas.height);
}
function aplicarFormatoRecorte() {
  const c = $('recorte-canvas');
  [c.width, c.height] = PREVIA[est.formato];
  for (const b of $$('#formato button')) b.classList.toggle('ativo', b.dataset.valor === est.formato);
  if (recorte.img) { limitarRecorte(); desenharRecorte(); }
}
async function carregarImagem(arquivo) {
  if (!arquivo || !/^image\/(jpeg|png|webp)$/.test(arquivo.type)) return avisar('Use uma imagem JPG, PNG ou WEBP.', 'erro');
  const url = await lerArquivo(arquivo);
  const img = new Image();
  img.onload = () => {
    $('recorte-canvas').parentElement.classList.remove('mexeu');
    Object.assign(recorte, { img, zoom: 1, cx: img.naturalWidth / 2, cy: img.naturalHeight * 0.42, nomeArquivo: arquivo.name });
    $('recorte-zoom').value = 1;
    $('soltar-imagem').hidden = true;
    $('recorte').hidden = false;
    if (!$('nome-personagem').value) $('nome-personagem').value = arquivo.name.replace(/\.[^.]+$/, '').slice(0, 60);
    aplicarFormatoRecorte();
    if (img.naturalWidth < 720 && img.naturalHeight < 720) avisar('A foto é pequena: o vídeo pode sair com pouca definição.');
  };
  img.onerror = () => avisar('Não foi possível abrir essa imagem.', 'erro');
  img.src = url;
}
function ligarRecorte() {
  const c = $('recorte-canvas');
  c.addEventListener('pointerdown', (e) => { recorte.arrastando = { x: e.clientX, y: e.clientY }; c.setPointerCapture(e.pointerId); c.parentElement.classList.add('mexeu'); });
  c.addEventListener('pointermove', (e) => {
    if (!recorte.arrastando) return;
    const r = c.getBoundingClientRect();
    const fator = c.width / r.width / escalaRecorte();
    recorte.cx -= (e.clientX - recorte.arrastando.x) * fator;
    recorte.cy -= (e.clientY - recorte.arrastando.y) * fator;
    recorte.arrastando = { x: e.clientX, y: e.clientY };
    limitarRecorte(); desenharRecorte();
  });
  const soltar = () => { recorte.arrastando = null; };
  c.addEventListener('pointerup', soltar);
  c.addEventListener('pointercancel', soltar);
  c.addEventListener('wheel', (e) => {
    e.preventDefault();
    recorte.zoom = Math.min(3, Math.max(1, recorte.zoom * (e.deltaY < 0 ? 1.06 : 0.94)));
    $('recorte-zoom').value = recorte.zoom;
    limitarRecorte(); desenharRecorte();
  }, { passive: false });
  $('recorte-zoom').addEventListener('input', (e) => { recorte.zoom = Number(e.target.value); limitarRecorte(); desenharRecorte(); });
  for (const b of $$('#formato button')) b.addEventListener('click', () => { est.formato = b.dataset.valor; aplicarFormatoRecorte(); salvarRascunho(); });

  const zona = $('soltar-imagem');
  $('arquivo-imagem').addEventListener('change', (e) => carregarImagem(e.target.files[0]));
  zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.classList.add('sobre'); });
  zona.addEventListener('dragleave', () => zona.classList.remove('sobre'));
  zona.addEventListener('drop', (e) => { e.preventDefault(); zona.classList.remove('sobre'); carregarImagem(e.dataTransfer.files[0]); });

  $('salvar-personagem').addEventListener('click', (e) => comCarregando(e.currentTarget, async () => {
    const [w, h] = TAMANHO[est.formato];
    const saida = el('canvas', { width: w, height: h });
    desenharRecorte(saida);
    const imagem = saida.toDataURL('image/jpeg', 0.92);
    try {
      const p = await api('POST', '/api/personagens', { nome: $('nome-personagem').value.trim() || 'Personagem', imagem, largura: w, altura: h });
      est.personagens.unshift(p);
      est.personagemId = p.id;
      Object.assign(recorte, { img: null });
      $('recorte').hidden = true;
      $('soltar-imagem').hidden = false;
      $('arquivo-imagem').value = '';
      $('nome-personagem').value = '';
      renderPersonagens();
      trocarAba($('etapa-personagem'), 'biblioteca');
      atualizarTudo();
      avisar('Personagem salvo.');
    } catch (err) { avisar(err.message, 'erro'); }
  }));
}
function renderPersonagens() {
  const g = $('galeria-personagens');
  g.replaceChildren(...est.personagens.map((p) => el('div', {
    class: `personagem${p.id === est.personagemId ? ' ativo' : ''}`, role: 'button', tabindex: 0, title: p.nome,
    onclick: () => { est.personagemId = p.id; renderPersonagens(); atualizarTudo(); },
    onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } },
  },
  el('img', { src: p.url, alt: '', loading: 'lazy' }),
  el('span', {}, p.nome),
  el('button', {
    class: 'apagar', type: 'button', title: 'Remover da biblioteca', 'aria-label': `Remover ${p.nome}`, html: icone('lixo'),
    onclick: async (e) => {
      e.stopPropagation();
      if (!confirm(`Remover “${p.nome}” da biblioteca?`)) return;
      try {
        await api('DELETE', `/api/personagens/${p.id}`);
        est.personagens = est.personagens.filter((x) => x.id !== p.id);
        if (est.personagemId === p.id) est.personagemId = null;
        renderPersonagens(); atualizarTudo();
      } catch (err) { avisar(err.message, 'erro'); }
    },
  }))));
  $('galeria-vazia').hidden = est.personagens.length > 0;
  $('qtd-personagens').textContent = est.personagens.length;
}

/* ---------- 2. Fala ---------- */
const AJUSTES = [['estabilidade', 'aj-estabilidade'], ['similaridade', 'aj-similaridade'], ['estilo', 'aj-estilo'], ['velocidade', 'aj-velocidade']];
const lerAjustes = () => Object.fromEntries(AJUSTES.map(([k, id]) => [k, Number($(id).value)]));
function mostrarAjuste(input) {
  const v = Number(input.value);
  input.nextElementSibling.value = input.id === 'aj-velocidade' ? `${v.toFixed(2)}×` : `${Math.round(v * 100)}%`;
}
function atualizarContagem() {
  const n = $('texto').value.trim().length;
  $('texto-contagem').textContent = `${n} caractere${n === 1 ? '' : 's'}`;
  $('texto-duracao').textContent = n ? `≈ ${fmtSeg(n / 15)} de fala` : '';
}
async function carregarVozes() {
  const sel = $('voz');
  const anterior = sel.value || lerRascunho().vozId;
  try {
    const { conectado, vozes } = await api('GET', '/api/vozes');
    est.vozes = vozes;
    sel.disabled = !conectado;
    $('modelo-voz').disabled = !conectado;
    if (!conectado) {
      sel.replaceChildren(el('option', { value: '' }, 'Conecte o ElevenLabs em Configurações'));
      $('nota-voz').hidden = false;
      $('nota-voz').textContent = 'Sem o ElevenLabs conectado, o botão abaixo cria um áudio silencioso, só para testar o app. Você também pode enviar um áudio pronto.';
      return;
    }
    $('nota-voz').hidden = true;
    const grupos = {};
    for (const v of vozes) (grupos[v.tipo === 'cloned' || v.tipo === 'generated' || v.tipo === 'professional' ? 'Minhas vozes' : 'Vozes da biblioteca'] ||= []).push(v);
    sel.replaceChildren(...Object.entries(grupos).map(([nome, lista]) => el('optgroup', { label: nome },
      lista.map((v) => el('option', { value: v.id }, v.descricao ? `${v.nome} · ${v.descricao}` : v.nome)))));
    if (anterior && vozes.some((v) => v.id === anterior)) sel.value = anterior;
  } catch (e) {
    sel.replaceChildren(el('option', { value: '' }, 'Não foi possível carregar as vozes'));
    $('nota-voz').hidden = false;
    $('nota-voz').textContent = e.message;
  }
}
function definirAudio(a) {
  est.audio = a;
  const box = $('audio-pronto');
  if (!a) { box.hidden = true; $('audio-player').removeAttribute('src'); atualizarTudo(); return; }
  box.hidden = false;
  $('audio-player').src = a.url;
  $('audio-titulo').textContent = a.origem === 'voz' ? (a.demo ? 'Áudio de teste (silencioso)' : 'Voz gerada') : 'Áudio enviado';
  $('audio-sub').textContent = a.duracao ? fmtSeg(a.duracao) : '';
  duracaoDe(a.url).then((d) => {
    if (d && est.audio?.id === a.id) { a.duracao = d; $('audio-sub').textContent = fmtSeg(d); atualizarTudo(); }
  });
  atualizarTudo();
  salvarRascunho();
}
const audioDesatualizado = () => est.audio?.origem === 'voz' && est.audio.texto !== $('texto').value.trim();

function ligarFala() {
  ligarAbas($('etapa-fala'));
  $('texto').addEventListener('input', () => { atualizarContagem(); atualizarTudo(); salvarRascunho(); });
  for (const [, id] of AJUSTES) {
    const i = $(id);
    mostrarAjuste(i);
    i.addEventListener('input', () => { mostrarAjuste(i); salvarRascunho(); });
  }
  $('voz').addEventListener('change', salvarRascunho);
  $('modelo-voz').addEventListener('change', salvarRascunho);
  $('gerar-voz').addEventListener('click', (e) => comCarregando(e.currentTarget, async () => {
    const texto = $('texto').value.trim();
    if (!texto) return avisar('Escreva o texto da fala primeiro.', 'erro');
    try {
      const a = await api('POST', '/api/voz', { texto, vozId: $('voz').value, modelo: $('modelo-voz').value, ajustes: lerAjustes() });
      definirAudio(a);
      $('audio-player').play().catch(() => {});
    } catch (err) { avisar(err.message, 'erro'); }
  }));

  const zona = $('soltar-audio');
  const enviar = async (f) => {
    if (!f) return;
    if (!/^audio\//.test(f.type) && !/\.(mp3|wav|m4a|ogg|aac)$/i.test(f.name)) return avisar('Use um áudio MP3, WAV, M4A, OGG ou AAC.', 'erro');
    zona.classList.add('carregando');
    try {
      const url = URL.createObjectURL(f);
      const duracao = await duracaoDe(url);
      URL.revokeObjectURL(url);
      let dados = await lerArquivo(f);
      // Alguns sistemas não informam o tipo do arquivo; corrige pelo nome.
      if (/^data:(application\/octet-stream)?;/.test(dados)) {
        const ext = f.name.split('.').pop().toLowerCase();
        const tipo = { mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', ogg: 'audio/ogg', aac: 'audio/aac' }[ext];
        dados = dados.replace(/^data:[^;]*;/, `data:${tipo};`);
      }
      definirAudio(await api('POST', '/api/audios', { nome: f.name, dados, duracao }));
    } catch (err) { avisar(err.message, 'erro'); } finally { zona.classList.remove('carregando'); $('arquivo-audio').value = ''; }
  };
  $('arquivo-audio').addEventListener('change', (e) => enviar(e.target.files[0]));
  zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.classList.add('sobre'); });
  zona.addEventListener('dragleave', () => zona.classList.remove('sobre'));
  zona.addEventListener('drop', (e) => { e.preventDefault(); zona.classList.remove('sobre'); enviar(e.dataTransfer.files[0]); });
}

/* ---------- 3. Direção ---------- */
let tempoPrompt = null;
function atualizarPrompt() {
  clearTimeout(tempoPrompt);
  tempoPrompt = setTimeout(async () => {
    try { $('prompt').textContent = (await api('POST', '/api/prompt', { direcao: est.direcao })).prompt; } catch {}
  }, 250);
}
function renderDirecao() {
  for (const g of $$('#direcao .grupo')) {
    for (const b of $$('button', g)) b.classList.toggle('ativa', est.direcao[g.dataset.campo] === b.dataset.v);
  }
  $('direcao-extra').value = est.direcao.extra || '';
}
function ligarDirecao() {
  for (const g of $$('#direcao .grupo')) {
    for (const b of $$('button', g)) {
      b.type = 'button';
      b.addEventListener('click', () => { est.direcao[g.dataset.campo] = b.dataset.v; renderDirecao(); atualizarPrompt(); salvarRascunho(); });
    }
  }
  $('direcao-extra').addEventListener('input', (e) => { est.direcao.extra = e.target.value; atualizarPrompt(); salvarRascunho(); });
}

/* ---------- 4. Modelo ---------- */
function renderModelos() {
  const lista = $('modelos');
  lista.replaceChildren(...est.modelos.map((m) => el('button', {
    type: 'button', role: 'radio', 'aria-checked': String(m.id === est.modeloId),
    class: `modelo${m.id === est.modeloId ? ' ativo' : ''}`,
    onclick: () => { est.modeloId = m.id; est.resolucao = m.resolucaoPadrao || null; renderModelos(); atualizarTudo(); salvarRascunho(); },
  },
  el('span', { class: 'modelo-radio' }),
  el('span', { class: 'modelo-nome' }, m.nome, el('small', {}, m.fornecedor), m.id === 'omnihuman-15' ? el('span', { class: 'etiqueta' }, 'Recomendado') : null),
  el('span', { class: 'modelo-preco' }, m.precoSeg ? `≈ ${fmtUsd(m.precoSeg)}/s` : ''),
  el('span', { class: 'modelo-resumo' }, m.resumo))));

  const m = modeloAtual();
  const res = $('resolucao');
  $('campo-resolucao').hidden = !m?.resolucoes;
  if (m?.resolucoes) {
    if (!m.resolucoes.includes(est.resolucao)) est.resolucao = m.resolucaoPadrao;
    res.replaceChildren(...m.resolucoes.map((r) => el('button', {
      type: 'button', class: r === est.resolucao ? 'ativo' : '',
      onclick: () => { est.resolucao = r; renderModelos(); atualizarTudo(); salvarRascunho(); },
    }, r)));
  }
  $('campo-rapido').hidden = !m?.temRapido;
  $('opcoes-modelo').hidden = !m?.resolucoes && !m?.temRapido;
  $('campos-personalizado').hidden = !m?.personalizado;
  $('etapa-direcao').classList.toggle('desligada', m ? !m.usaDirecao : false);
  $('nota-direcao').hidden = m ? m.usaDirecao : true;
}

/* ---------- Palco ---------- */
function formatoDe(p) {
  if (!p?.largura || !p?.altura) return '9:16';
  const r = p.largura / p.altura;
  return r < 0.8 ? '9:16' : r > 1.25 ? '16:9' : '1:1';
}
function problemas() {
  const m = modeloAtual();
  const lista = [];
  if (!personagemAtual()) lista.push('Escolha ou envie a foto do personagem.');
  if (!est.audio) lista.push('Prepare a fala: gere a voz ou envie um áudio.');
  else if (audioDesatualizado()) lista.push('O texto mudou depois de gerar a voz. Clique em “Gerar voz e ouvir” de novo.');
  if (m?.personalizado && !/^[\w.-]+\/[\w./-]+$/.test($('endpoint').value.trim())) lista.push('Informe o endpoint do modelo no fal.ai.');
  const lim = m?.limiteSeg?.[est.resolucao];
  if (lim && est.audio?.duracao > lim) lista.push(`O ${m.nome} aceita até ${lim} s de áudio em ${est.resolucao}. Encurte a fala${m.resolucoes?.length > 1 ? ' ou troque a resolução' : ''}.`);
  if (est.estado?.fal && est.audio?.demo) lista.push('Este áudio é silencioso (teste). Conecte o ElevenLabs e gere a voz de novo, ou envie um áudio.');
  return lista;
}
function atualizarTudo() {
  const p = personagemAtual();
  const m = modeloAtual();
  $('etapa-personagem').classList.toggle('feita', Boolean(p));
  $('etapa-fala').classList.toggle('feita', Boolean(est.audio) && !audioDesatualizado());
  $('etapa-modelo').classList.toggle('feita', Boolean(m));

  if (est.modoPalco === 'previa') {
    const tela = $('tela');
    tela.dataset.formato = formatoDe(p);
    tela.classList.remove('demo');
    $('tela-vazia').hidden = Boolean(p);
    $('tela-imagem').hidden = !p;
    if (p) $('tela-imagem').src = p.url;
    $('tela-video').hidden = true;
    $('tela-demo').hidden = true;
    $('tela-status').hidden = true;
  }

  const dur = est.audio?.duracao;
  $('r-duracao').textContent = dur ? fmtSeg(dur) : '—';
  $('r-modelo').textContent = m ? (m.personalizado ? ($('endpoint').value.trim() || 'Personalizado') : `${m.nome}${est.resolucao ? ' · ' + est.resolucao : ''}`) : '—';
  $('r-custo').textContent = !m ? '—' : m.precoSeg && dur ? `≈ ${fmtUsd(m.precoSeg * dur)}` : m.precoSeg ? `≈ ${fmtUsd(m.precoSeg)}/s` : 'Ver no fal.ai';
  $('r-custo').title = m?.precoSeg ? 'Preço de referência (out/2026). Confira o valor atual na página do modelo no fal.ai.' : '';

  if (est.modoPalco === 'previa') {
    const lista = problemas();
    const alerta = $('alerta');
    alerta.classList.remove('erro');
    alerta.hidden = lista.length === 0 || (!p && !est.audio);
    alerta.textContent = lista[0] || '';
    $('gerar').disabled = lista.length > 0 || !$('consentimento').checked;
    $('gerar').textContent = est.estado?.fal ? 'Gerar vídeo' : 'Gerar vídeo (demonstração)';
  }
}

function modoPalco(modo) {
  est.modoPalco = modo;
  $('palco-acoes').hidden = modo !== 'previa';
  $('acoes-resultado').hidden = modo !== 'resultado';
  $('acoes-erro').hidden = modo !== 'erro';
  $('consentimento').closest('label').hidden = modo !== 'previa';
  if (modo === 'previa') atualizarTudo();
}

const ORDEM = ['enviando', 'na_fila', 'gerando', 'pronto'];
function mostrarTrabalho(t) {
  est.trabalho = t;
  const tela = $('tela');
  tela.dataset.formato = formatoDe(t.personagem);
  $('tela-vazia').hidden = true;
  $('tela-demo').hidden = true;
  tela.classList.remove('demo');

  if (t.status === 'pronto') {
    $('tela-status').hidden = true;
    $('alerta').hidden = true;
    modoPalco('resultado');
    if (t.demo) {
      tela.classList.add('demo');
      $('tela-video').hidden = true;
      $('tela-imagem').hidden = false;
      $('tela-imagem').src = t.personagem?.url || '';
      $('tela-demo').hidden = false;
      $('baixar').setAttribute('aria-disabled', 'true');
      $('baixar').removeAttribute('href');
      if (t.audio) { const a = new Audio(t.audio.url); a.play().catch(() => {}); est.audioDemo?.pause(); est.audioDemo = a; }
    } else {
      $('tela-imagem').hidden = true;
      const v = $('tela-video');
      v.hidden = false;
      v.poster = t.personagem?.url || '';
      if (v.getAttribute('src') !== t.video) v.src = t.video;
      $('baixar').removeAttribute('aria-disabled');
      $('baixar').href = t.baixar;
    }
    return;
  }
  $('tela-video').hidden = true;
  $('tela-imagem').hidden = !t.personagem;
  if (t.personagem) $('tela-imagem').src = t.personagem.url;

  if (t.status === 'erro') {
    $('tela-status').hidden = true;
    const alerta = $('alerta');
    alerta.hidden = false;
    alerta.classList.add('erro');
    alerta.textContent = t.erro || 'A geração falhou.';
    modoPalco('erro');
    return;
  }

  modoPalco('gerando');
  $('alerta').hidden = true;
  $('tela-status').hidden = false;
  let titulo = 'Preparando…', sub = t.log || '', pct = 6;
  if (t.status === 'enviando') { titulo = 'Enviando os arquivos'; pct = 8; }
  if (t.status === 'na_fila') { titulo = 'Na fila'; sub = t.posicao != null ? `Posição ${t.posicao + 1} na fila do servidor` : 'Aguardando um servidor livre'; pct = 16; }
  if (t.status === 'gerando') {
    titulo = 'Gerando o vídeo';
    const decorrido = t.inicioGeracao ? (Date.now() - Date.parse(t.inicioGeracao)) / 1000 : 0;
    const fracao = Math.min(1, decorrido / (t.previsaoSeg || 120));
    pct = 20 + Math.round(fracao * 74);
    const resta = Math.max(0, (t.previsaoSeg || 120) - decorrido);
    sub = t.log && !t.demo ? t.log : resta > 20 ? `Estimativa: cerca de ${Math.ceil(resta / 60)} min` : 'Quase lá…';
  }
  if (t.status === 'baixando') { titulo = 'Finalizando'; sub = 'Baixando o vídeo para este computador'; pct = 97; }
  $('status-titulo').textContent = titulo;
  $('status-sub').textContent = sub.length > 90 ? sub.slice(0, 90) + '…' : sub;
  $('status-barra').style.width = `${pct}%`;
  const atual = ORDEM.indexOf(t.status === 'baixando' ? 'gerando' : t.status);
  $$('#passos li').forEach((li, i) => {
    li.classList.toggle('feito', i < atual);
    li.classList.toggle('atual', i === atual);
  });
}

let tempoConsulta = null;
async function acompanhar(id) {
  clearTimeout(tempoConsulta);
  try {
    const t = await api('GET', `/api/trabalhos/${id}`);
    if (est.trabalho?.id !== id) return; // o usuário saiu desta tela
    mostrarTrabalho(t);
    if (t.status === 'pronto' || t.status === 'erro') {
      carregarTrabalhos();
      if (t.status === 'pronto') avisar(t.demo ? 'Demonstração concluída.' : 'Vídeo pronto!');
      return;
    }
  } catch (e) {
    $('status-sub').textContent = 'Reconectando…';
  }
  tempoConsulta = setTimeout(() => acompanhar(id), est.trabalho?.demo ? 1000 : 3000);
}

async function gerar() {
  const m = modeloAtual();
  const botao = $('gerar');
  await comCarregando(botao, async () => {
    try {
      const t = await api('POST', '/api/gerar', {
        personagemId: est.personagemId, audioId: est.audio.id, duracao: est.audio.duracao,
        modeloId: m.id, resolucao: est.resolucao, rapido: $('rapido').checked,
        direcao: est.direcao, endpoint: $('endpoint').value.trim(), extras: $('extras').value.trim(),
        consentimento: $('consentimento').checked,
      });
      est.trabalho = t;
      mostrarTrabalho(t);
      acompanhar(t.id);
      carregarTrabalhos();
      document.querySelector('.palco').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { avisar(e.message, 'erro'); }
  });
}
function voltarPrevia() {
  clearTimeout(tempoConsulta);
  est.audioDemo?.pause();
  est.trabalho = null;
  const v = $('tela-video');
  v.pause(); v.removeAttribute('src'); v.load();
  modoPalco('previa');
}

/* ---------- Biblioteca ---------- */
const NOMES_STATUS = { enviando: 'Enviando', na_fila: 'Na fila', gerando: 'Gerando', baixando: 'Finalizando', pronto: 'Pronto', erro: 'Falhou' };
let tempoLista = null;
async function carregarTrabalhos() {
  clearTimeout(tempoLista);
  try { est.trabalhos = await api('GET', '/api/trabalhos'); } catch { return; }
  renderTrabalhos();
  const ativos = est.trabalhos.some((t) => !['pronto', 'erro'].includes(t.status) && t.id !== est.trabalho?.id);
  if (ativos) tempoLista = setTimeout(carregarTrabalhos, 6000);
}
function renderTrabalhos() {
  const lista = $('lista-videos');
  const fmtData = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  lista.replaceChildren(...est.trabalhos.map((t) => {
    const classeSelo = t.status === 'pronto' ? 'pronto' : t.status === 'erro' ? 'erro' : 'andando';
    const capa = t.video
      ? el('video', { src: `${t.video}#t=0.3`, poster: t.personagem?.url, muted: true, preload: 'metadata', playsinline: true })
      : el('img', { src: t.personagem?.url || '', alt: '', loading: 'lazy' });
    return el('article', { class: 'video-cartao' },
      el('button', { class: 'video-capa', type: 'button', title: 'Abrir', onclick: () => abrirTrabalho(t) },
        capa,
        el('span', { class: `selo ${classeSelo}` }, t.demo && t.status === 'pronto' ? 'Demonstração' : NOMES_STATUS[t.status] || t.status),
        t.status === 'pronto' ? el('span', { class: 'play', html: icone('play') }) : null),
      el('div', { class: 'video-info' },
        el('strong', { title: t.texto || '' }, t.texto ? t.texto.slice(0, 60) : (t.personagem?.nome || 'Vídeo')),
        el('span', {}, `${t.modeloNome} · ${fmtSeg(t.duracao)}`),
        el('span', {}, fmtData(t.criado))),
      el('div', { class: 'video-acoes' },
        t.video ? el('a', { class: 'icone-btn', href: t.baixar, title: 'Baixar MP4', 'aria-label': 'Baixar MP4', html: icone('baixar') }) : null,
        el('button', {
          class: 'icone-btn', type: 'button', title: 'Excluir', 'aria-label': 'Excluir vídeo', html: icone('lixo'),
          onclick: async () => {
            if (!confirm('Excluir este vídeo? O arquivo será apagado deste computador.')) return;
            try {
              await api('DELETE', `/api/trabalhos/${t.id}`);
              if (est.trabalho?.id === t.id) voltarPrevia();
              carregarTrabalhos();
            } catch (e) { avisar(e.message, 'erro'); }
          },
        })));
  }));
  $('videos-vazio').hidden = est.trabalhos.length > 0;
  const prontos = est.trabalhos.filter((t) => t.status === 'pronto' && !t.demo).length;
  $('qtd-videos').textContent = est.trabalhos.length ? `${prontos} pronto${prontos === 1 ? '' : 's'} · salvos em dados/videos` : '';
}
function abrirTrabalho(t) {
  est.audioDemo?.pause();
  est.trabalho = t;
  mostrarTrabalho(t);
  if (!['pronto', 'erro'].includes(t.status)) acompanhar(t.id);
  document.querySelector('.palco').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- Configurações ---------- */
function abrirConfig() {
  const e = est.estado;
  $('chave-fal').value = '';
  $('chave-eleven').value = '';
  $('chave-fal').placeholder = e.fal ? `Chave salva (${e.falMascara}). Cole outra para trocar.` : 'Cole a chave da API do fal.ai';
  $('chave-eleven').placeholder = e.eleven ? `Chave salva (${e.elevenMascara}). Cole outra para trocar.` : 'Cole a chave da API do ElevenLabs';
  for (const s of ['fal', 'eleven']) { $(`status-${s}`).textContent = ''; $(`status-${s}`).className = 'servico-status'; }
  $('modal-config').showModal();
}
async function salvarChaves() {
  const corpo = {};
  if ($('chave-fal').value.trim()) corpo.falKey = $('chave-fal').value.trim();
  if ($('chave-eleven').value.trim()) corpo.elevenKey = $('chave-eleven').value.trim();
  if (!Object.keys(corpo).length) return false;
  const r = await api('POST', '/api/config', corpo);
  Object.assign(est.estado, r);
  mostrarConexoes();
  $('chave-fal').value = ''; $('chave-eleven').value = '';
  return true;
}
function ligarConfig() {
  $('abrir-config').addEventListener('click', abrirConfig);
  for (const b of $$('[data-abrir-config]')) b.addEventListener('click', abrirConfig);
  $('salvar-config').addEventListener('click', (e) => comCarregando(e.currentTarget, async () => {
    try {
      const mudou = await salvarChaves();
      $('modal-config').close();
      if (mudou) { avisar('Configurações salvas.'); carregarVozes(); atualizarTudo(); }
    } catch (err) { avisar(err.message, 'erro'); }
  }));
  for (const b of $$('[data-testar]')) b.addEventListener('click', (e) => comCarregando(e.currentTarget, async () => {
    const s = b.dataset.testar;
    const st = $(`status-${s}`);
    try {
      await salvarChaves();
      const r = await api('POST', '/api/testar', { servico: s });
      st.textContent = r.ok ? `Conectado.${r.msg ? ' ' + r.msg : ''}` : r.msg;
      st.className = `servico-status ${r.ok ? 'ok' : 'erro'}`;
      if (r.ok && s === 'eleven') carregarVozes();
      atualizarTudo();
    } catch (err) { st.textContent = err.message; st.className = 'servico-status erro'; }
  }));
}

/* ---------- Início ---------- */
async function iniciar() {
  aplicarIcones();
  ligarAbas($('etapa-personagem'));
  ligarRecorte();
  ligarFala();
  ligarDirecao();
  ligarConfig();
  $('consentimento').addEventListener('change', atualizarTudo);
  $('gerar').addEventListener('click', gerar);
  $('novo').addEventListener('click', voltarPrevia);
  $('voltar').addEventListener('click', voltarPrevia);
  $('tentar').addEventListener('click', () => { voltarPrevia(); if (!$('gerar').disabled) gerar(); });
  $('endpoint').addEventListener('input', () => { atualizarTudo(); salvarRascunho(); });
  $('extras').addEventListener('input', salvarRascunho);
  $('rapido').addEventListener('change', salvarRascunho);

  const [estado, personagens] = await Promise.all([api('GET', '/api/estado'), api('GET', '/api/personagens')]);
  est.estado = estado;
  est.modelos = estado.modelos;
  est.personagens = personagens;
  mostrarConexoes();
  $('modelo-voz').replaceChildren(...estado.modelosVoz.map((m) => el('option', { value: m.id }, `${m.nome} · ${m.resumo}`)));

  // Recupera o rascunho da última visita.
  const r = lerRascunho();
  if (r.texto) $('texto').value = r.texto;
  if (r.modeloVoz && estado.modelosVoz.some((m) => m.id === r.modeloVoz)) $('modelo-voz').value = r.modeloVoz;
  if (r.ajustes) for (const [k, id] of AJUSTES) if (r.ajustes[k] != null) { $(id).value = r.ajustes[k]; mostrarAjuste($(id)); }
  if (r.direcao) Object.assign(est.direcao, r.direcao);
  if (r.modeloId && est.modelos.some((m) => m.id === r.modeloId)) est.modeloId = r.modeloId;
  est.resolucao = r.resolucao || modeloAtual()?.resolucaoPadrao || null;
  $('rapido').checked = Boolean(r.rapido);
  if (r.formato && TAMANHO[r.formato]) est.formato = r.formato;
  if (r.endpoint) $('endpoint').value = r.endpoint;
  if (r.extras) $('extras').value = r.extras;
  if (r.personagemId && personagens.some((p) => p.id === r.personagemId)) est.personagemId = r.personagemId;
  else if (personagens.length) est.personagemId = personagens[0].id;
  if (personagens.length) trocarAba($('etapa-personagem'), 'biblioteca');

  renderPersonagens();
  renderDirecao();
  renderModelos();
  atualizarContagem();
  aplicarFormatoRecorte();
  atualizarPrompt();
  await carregarVozes();
  await carregarTrabalhos();

  // Retoma o último áudio preparado.
  if (r.audioId) {
    try { definirAudio(await api('GET', `/api/audios/${r.audioId}`)); } catch {}
  }

  // Se algum vídeo ainda está sendo gerado, volta a acompanhar.
  const ativo = est.trabalhos.find((t) => !['pronto', 'erro'].includes(t.status));
  if (ativo) abrirTrabalho(ativo); else modoPalco('previa');
}

iniciar().catch((e) => {
  console.error(e);
  avisar('Não foi possível conectar ao servidor do app. Ele está aberto?', 'erro');
});
