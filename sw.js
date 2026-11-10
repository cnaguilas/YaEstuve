// YaEstuve · service worker
// - La app (index.html) se pide siempre a la red primero: así cada vez que
//   subes una versión nueva a GitHub, el móvil la coge al momento. Si no hay
//   conexión, se abre la última copia guardada.
// - Iconos y librerías se guardan para que la app abra rápido.
// - Los datos (Firebase) y los mapas no se guardan aquí: siempre en directo.
const VERSION = 'yaestuve-v1';
const BASICOS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png', '/icon-maskable-192.png', '/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASICOS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Datos y servicios externos: directo a la red, sin guardar
  if (/firebaseio|firebasedatabase|googleapis|nominatim|photon|basemaps|tile|gstatic\.com\/firebasejs/.test(url.host + url.pathname) && !/unpkg/.test(url.host)) return;

  // Páginas: red primero, copia guardada si no hay conexión
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => { const copia = r.clone(); caches.open(VERSION).then(c => c.put('/index.html', copia)); return r; })
        .catch(() => caches.match('/index.html').then(r => r || caches.match('/')))
    );
    return;
  }
  // Mismo sitio y librerías (Leaflet, fuentes): copia guardada y se actualiza en segundo plano
  if (url.origin === location.origin || /unpkg\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(
      caches.match(req).then(guardado => {
        const red = fetch(req).then(r => { if (r.ok) { const copia = r.clone(); caches.open(VERSION).then(c => c.put(req, copia)); } return r; }).catch(() => guardado);
        return guardado || red;
      })
    );
  }
});
