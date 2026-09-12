const CACHE_NAME = 'jitterfx-v13';
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
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.method === 'POST') {
        e.respondWith((async () => {
            const formData = await e.request.formData();
            const image = formData.get('image');
            const cache = await caches.open('jitterfx-shared');
            await cache.put(new Request('/shared-image'), new Response(image));
            return Response.redirect('./?shared=true', 303);
        })());
        return;
    }

    e.respondWith(
        fetch(e.request).then(response => {
            // Update cache with fresh version
            if (response && response.status === 200) {
                let responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(e.request, responseClone);
                });
            }
            return response;
        }).catch(() => caches.match(e.request))
    );
});
