/* Cache offline: la pagina resta utilizzabile senza rete */
var CACHE = 'sole365-v1';
var FILE = ['index.html', 'checklist.html', 'segnalazione.html', 'manifest.json', 'icona.svg'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILE); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(k){
    return Promise.all(k.map(function(n){ return n === CACHE ? null : caches.delete(n); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request).then(function(resp){
        var copia = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copia); });
        return resp;
      }).catch(function(){ return caches.match('index.html'); });
    })
  );
});
