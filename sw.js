const CACHE_NAME = 'image-viewer-v1';
const urlsToCache = [
    './',
    './image-editor-mobile-2.html',
    './image-editor-mobile-2.css',
    './image-editor-mobile-2.js',
    './manifest.json'
];

// Service Worker Installation - Dateien im Cache speichern
self.addEventListener('install', event => {
    console.log('Service Worker wird installiert');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache geöffnet');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // Sofort aktivieren, ohne auf andere Tabs zu warten
                return self.skipWaiting();
            })
    );
});

// Service Worker Aktivierung
self.addEventListener('activate', event => {
    console.log('Service Worker wird aktiviert');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Alte Caches löschen
                    if (cacheName !== CACHE_NAME) {
                        console.log('Alten Cache löschen:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Sofort Kontrolle über alle Clients übernehmen
            return self.clients.claim();
        })
    );
});

// Fetch Event - Requests abfangen und aus Cache bedienen
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - Datei aus Cache zurückgeben
                if (response) {
                    return response;
                }
                
                // Cache miss - Datei vom Netzwerk laden
                return fetch(event.request).then(response => {
                    // Prüfen ob wir eine gültige Response erhalten haben
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Response klonen da Stream nur einmal gelesen werden kann
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(() => {
                // Netzwerk und Cache fehlgeschlagen - Fallback für HTML-Seiten
                if (event.request.destination === 'document') {
                    return caches.match('./image-editor-mobile-2.html');
                }
            })
    );
});

// Message Event - Kommunikation mit der Hauptanwendung
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Background Sync für zukünftige Erweiterungen
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Hier könnte später Code für Background Sync hinzugefügt werden
            console.log('Background sync ausgeführt')
        );
    }
});