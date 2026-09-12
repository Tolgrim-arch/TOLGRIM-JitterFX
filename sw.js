const CACHE_NAME = 'jitterfx-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './gif.js',
    './gif.worker.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request)
        .then(response => response || fetch(e.request))
    );
});
