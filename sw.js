const CACHE_NAME = 'ty-db-v1'

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
                        console.log('Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            )
        })
    )
})

const SENSITIVE_API_HOSTS = new Set([
    'api.github.com',
    'sheets.googleapis.com',
    'www.googleapis.com',
    'vision.googleapis.com',
    'oauth2.googleapis.com',
    'accounts.google.com',
    'generativelanguage.googleapis.com'
])

globalThis.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return
    }
    const url = new URL(event.request.url)
    if (
        !url.protocol.startsWith('http') ||
        event.request.headers.has('Authorization') ||
        SENSITIVE_API_HOSTS.has(url.hostname)
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
