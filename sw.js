/* Sole 365 – service worker sicuro
   Regola: non deve MAI rispondere con "undefined", altrimenti il browser
   restituisce ERR_FAILED. Strategia: prima la rete, la cache solo come riserva. */
var CACHE = 'sole365-v4';
var FILE = ['./', 'index.html', 'checklist.html', 'segnalazione.html', 'distrutti.html', 'dirai.html', 'manifest.json', 'icona.svg'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      // ogni file per conto suo: se uno manca, l'installazione non fallisce
      return Promise.all(FILE.map(function(f){
        return fetch(f, {cache:'no-store'})
          .then(function(r){ return r.ok ? c.put(f, r) : null; })
          .catch(function(){ return null; });
      }));
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(k){
      return Promise.all(k.map(function(n){ return n === CACHE ? null : caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('message', function(e){
  if (e.data === 'ripara'){
    caches.keys().then(function(k){ k.forEach(function(n){ caches.delete(n); }); })
      .then(function(){ return self.registration.unregister(); });
  }
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  if (req.url.indexOf(self.location.origin) !== 0) return;   // solo stesso dominio

  e.respondWith(
    fetch(req).then(function(resp){
      if (resp && resp.ok){
        var copia = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copia); }).catch(function(){});
      }
      return resp;
    }).catch(function(){
      return caches.match(req).then(function(r){
        return r || new Response(
          '<meta charset="utf-8"><p style="font:16px system-ui;padding:24px">Pagina non disponibile offline. Riprova quando torna la rete.</p>',
          {status:503, headers:{'Content-Type':'text/html; charset=utf-8'}}
        );
      });
    })
  );
});
