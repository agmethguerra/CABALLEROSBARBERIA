const CACHE = 'caballeros-cache-v1';
const ASSETS = [
  '/', '/login.html', '/manifest.json',
  '/shared/styles.css','/shared/db.js','/shared/auth.js','/shared/utils.js',
  '/admin/index.html','/admin/js/admin-app.js','/admin/js/barbers-crud.js','/admin/js/payroll.js','/admin/js/pdf.js',
  '/barber/index.html','/barber/js/barber-app.js'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(resp => resp || fetch(e.request)));
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});
