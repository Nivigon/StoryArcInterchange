// Wisselapp service worker
// Strategie: stale-while-revalidate. De app opent direct uit de cache (dus offline),
// en haalt op de achtergrond de nieuwste versie op zodat je bij de volgende keer
// openen met internet automatisch de laatste versie hebt.

var CACHE = 'wisselapp-v1';
var ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS).catch(function () {}); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;
  e.respondWith((async function () {
    var cache = await caches.open(CACHE);
    var cached = await cache.match(req);
    var network = fetch(req).then(function (res) {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(function () { return null; });
    return cached || (await network) || (await cache.match('./index.html'));
  })());
});
