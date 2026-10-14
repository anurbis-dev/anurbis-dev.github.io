/* Service worker of Data Cube: the game works offline after the first visit.
   The cache is named after the game's VERSION (the page registers sw.js?v=<VERSION>): a new version — a new cache, the old ones go.
   The page (navigation) — network first, the cached copy offline; the rest of the precache — cache first;
   Google Fonts — stale-while-revalidate (cached once seen; the page doesn't wait for them anyway) */
const V = new URL(self.location).searchParams.get('v') || '0', CACHE = 'cube-' + V;
const PRE = ['index.html', 'vendor/three.r128.min.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('cube-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (FONTS.test(r.url)) return e.respondWith(swr(r));
  if (u.origin !== self.location.origin) return;
  if (r.mode === 'navigate') return e.respondWith(fetch(r).then(res => { if (res.ok) put(new Request(u.pathname), res.clone()); return res; })
    .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => m || fetch(r)));
});
const put = (k, res) => caches.open(CACHE).then(c => c.put(k, res)).catch(() => {});
function swr(r) {
  return caches.open(CACHE).then(c => c.match(r, { ignoreVary: true }).then(m => {
    const net = fetch(r).then(res => { if (res.ok || res.type === 'opaque') c.put(r, res.clone()).catch(() => {}); return res; });
    if (m) { net.catch(() => {}); return m; }
    return net;
  }));
}
