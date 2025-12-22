const CACHE='fibreos-clean-v29';
const ASSETS=[
'./',
'./index.html',
'./styles.css',
'./app.js',
'./manifest.json',
'./sw.js',
'./icon-192.png',
'./icon-512.png',
'./assets/cover_00.png',
'./assets/cover_01.png',
'./assets/cover_02.png',
'./assets/cover_03.png',
'./assets/cover_04.png',
'./assets/cover_05.png',
'./assets/cover_06.png',
'./assets/cover_07.png',
'./assets/cover_08.png',
'./assets/cover_09.png',
'./assets/cover_10.png',
'./assets/cover_11.png',
'./assets/cover_12.png',
'./assets/cover_13.png',
'./assets/cover_14.png',
'./assets/cover_15.png'
];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
