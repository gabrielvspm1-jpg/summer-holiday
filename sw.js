/* Deixa o app abrir sem internet: guarda os arquivos no celular. Os dados (pedidos, estoque) ficam no Firestore offline. */
var V='shp-v2';
var CORE=['./','index.html','config.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
var CDN=['https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js','https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(V).then(function(c){
    return Promise.all(CORE.map(function(u){return c.add(u).catch(function(){})}).concat(CDN.map(function(u){return fetch(u,{mode:'no-cors'}).then(function(r){return c.put(u,r)}).catch(function(){})})));
  }).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
function swr(req){
  return caches.open(V).then(function(c){
    return c.match(req,{ignoreSearch:true}).then(function(hit){
      var net=fetch(req).then(function(r){if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(function(){return hit});
      return hit||net;
    });
  });
}
self.addEventListener('fetch',function(e){
  var r=e.request;if(r.method!=='GET')return;
  var u=new URL(r.url);
  var mine=u.origin===location.origin;
  var cdn=u.hostname==='www.gstatic.com'||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  if(!mine&&!cdn)return;
  if(r.mode==='navigate'){e.respondWith(caches.match('index.html').then(function(hit){var net=fetch(r).then(function(x){var cp=x.clone();caches.open(V).then(function(c){c.put('index.html',cp)});return x}).catch(function(){return hit});return hit||net}));return}
  e.respondWith(swr(r));
});
