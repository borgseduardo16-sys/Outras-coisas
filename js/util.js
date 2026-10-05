/* Utilitários gerais: criação de DOM, formatação de tempo e datas. */
window.D31 = window.D31 || {};

D31.h = function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  const add = (c) => {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(add);
    else el.append(c.nodeType ? c : document.createTextNode(String(c)));
  };
  children.forEach(add);
  return el;
};

D31.fmtTime = (s) => {
  s = Math.max(0, Math.round(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};

D31.fmtDuracaoLonga = (s) => {
  const m = Math.floor(s / 60), r = Math.round(s % 60);
  if (m === 0) return `${r} segundos`;
  return r ? `${m} min ${r} s` : `${m} min`;
};

D31.dates = {
  iso(d = new Date()) {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  },
  hoje() { return this.iso(); },
  parse(iso) { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); },
  diff(a, b) { return Math.round((this.parse(b) - this.parse(a)) / 86400000); },
  add(iso, n) { const d = new Date(this.parse(iso) + n * 86400000); const p = (x) => String(x).padStart(2, '0'); return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`; },
  longa(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  },
};
