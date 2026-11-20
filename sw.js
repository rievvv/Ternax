const C='ternax-v5';
const SHELL=['./','index.html','style.css','script.js','hpp.js','firebase-config.js','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||/googleapis\.com|firebaseio|identitytoolkit|securetoken/.test(u.host))return;
  const same=u.origin===location.origin;
  e.respondWith(same
    ? fetch(r,{cache:'no-cache'}).then(x=>{const c=x.clone();caches.open(C).then(k=>k.put(r,c));return x}).catch(()=>caches.match(r))
    : caches.match(r).then(m=>m||fetch(r).then(x=>{const c=x.clone();caches.open(C).then(k=>k.put(r,c));return x})));
});