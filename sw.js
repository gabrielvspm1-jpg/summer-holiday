/* Deixa o app abrir sem internet: guarda os arquivos no celular. Os dados (pedidos, estoque) ficam no Firestore offline. */
var V='shp-v19';
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
      var net=fetch(req,{cache:'no-cache'}).then(function(r){if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(function(){return hit});
      return hit||net;
    });
  });
}
/* abrir o app: tenta a internet primeiro (ate 3s) para sempre vir a versao nova; sem internet, usa a guardada */
function fresh(r){
  return caches.open(V).then(function(c){
    return new Promise(function(res){
      var done=false;
      function fallback(){c.match('index.html').then(function(h){if(!done){done=true;res(h||fetch(r))}})}
      var t=setTimeout(fallback,3000);
      fetch(r,{cache:'no-cache'}).then(function(x){
        clearTimeout(t);
        if(x&&x.ok){c.put('index.html',x.clone());if(!done){done=true;res(x)}}else fallback();
      }).catch(function(){clearTimeout(t);fallback()});
    });
  });
}
self.addEventListener('fetch',function(e){
  var r=e.request;if(r.method!=='GET')return;
  var u=new URL(r.url);
  var mine=u.origin===location.origin;
  var cdn=u.hostname==='www.gstatic.com'||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  if(!mine&&!cdn)return;
  if(r.mode==='navigate'){e.respondWith(fresh(r));return}
  e.respondWith(swr(r));
});
