/* Service worker: deixa o app funcionar offline depois da primeira visita. */
const VERSAO = 'd31-v5';
const ARQUIVOS = [
  './', 'index.html', 'css/styles.css', 'manifest.webmanifest', 'icons/icone-192.png', 'icons/icone-512.png',
  'js/util.js', 'js/data/exercises.js', 'js/data/program.js', 'js/data/content.js', 'js/storage.js', 'js/progress.js',
  'js/audio.js', 'js/vendor/figure3d.js', 'js/components.js', 'js/components3d.js',
  'js/views/home.js', 'js/views/antes.js', 'js/views/calendario.js', 'js/views/dicas.js', 'js/views/dia.js',
  'js/views/treino.js', 'js/views/concluido.js', 'js/acesso.js', 'js/app.js',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).pathname.startsWith('/api/')) return;
  e.respondWith(caches.match(e.request).then((hit) => {
    const rede = fetch(e.request).then((r) => {
      if (r && r.ok && (r.type === 'basic' || r.type === 'cors')) { const cp = r.clone(); caches.open(VERSAO).then((c) => c.put(e.request, cp)); }
      return r;
    }).catch(() => hit);
    return hit || rede;
  }));
});
