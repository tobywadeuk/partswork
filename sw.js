// Offline copy of the app. Network first: online you always get the newest
// version; with no signal, the last copy that loaded opens instead.
// Nothing you write passes through here — it lives in the browser's storage.
const CACHE = 'inner-dialogues';
const SHELL = [
    '/',
    '/fonts/dm-mono-400-latin-ext.woff2',
    '/fonts/dm-mono-400-latin.woff2',
    '/fonts/dm-mono-500-latin-ext.woff2',
    '/fonts/dm-mono-500-latin.woff2',
    '/fonts/lora-400-italic-latin-ext.woff2',
    '/fonts/lora-400-italic-latin.woff2',
    '/fonts/lora-400-latin-ext.woff2',
    '/fonts/lora-400-latin.woff2',
    '/fonts/lora-500-latin-ext.woff2',
    '/fonts/lora-500-latin.woff2',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  // Best effort: a failed file here must never stop the worker installing.
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))));
});

self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // One cache entry per file, whatever query string it was asked for with.
  const key = req.mode === 'navigate' ? '/' : url.pathname;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok && (req.mode !== 'navigate' || url.pathname === '/' || url.pathname === '/index.html')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(key, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      const hit = await caches.match(key);
      if (hit) return hit;
      throw err;
    }
  })());
});
