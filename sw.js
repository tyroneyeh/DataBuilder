const CACHE_NAME = 'ty-db-v3'

const ALLOWED_CACHE_ORIGINS = new Set([
    globalThis.location.origin,
    'https://cdn.jsdelivr.net'
])

globalThis.addEventListener('message', (event) => {
    if (event.origin !== globalThis.location.origin) {
        console.warn('Received message from unexpected origin', event.origin)
        return
    }
    if (event.data?.type === 'SKIP_WAITING') {
        globalThis.skipWaiting()
    }
})

globalThis.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(['./', './index.html'])
        })
    )
})

globalThis.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache', cacheName)
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
})

globalThis.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return
    }
    const url = new URL(event.request.url)
    if (
        !url.protocol.startsWith('http') ||
        event.request.headers.has('Authorization') ||
        url.pathname.startsWith('/api/') ||
        !ALLOWED_CACHE_ORIGINS.has(url.origin)
    ) {
        return
    }
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.ok && (response.type === 'basic' || response.type === 'cors')) {
                    const responseClone = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone)
                    })
                }
                return response
            })
            .catch(() => {
                return caches.match(event.request).then((cached) => cached || Response.error())
            })
    )
})
