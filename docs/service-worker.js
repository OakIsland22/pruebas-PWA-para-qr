const CACHE_NAME = 'qr-pwa-v4';
const urlsToCache = [
  '.',
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache abierta');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[SW] Error al cachear archivos:', error);
      })
  );
  
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activado');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Estrategia de fetch: Network First, falling back to Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, guardar en cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Si falla, intentar obtener de cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Si tampoco está en cache y es una navegación, devolver index.html
          if (event.request.mode === 'navigate') {
            return caches.match('index.html');
          }
          
          return new Response('Sin conexión', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// Manejo de notificaciones push
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('QR PWA', options)
  );
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Click en notificación');
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si hay una ventana abierta, enfocarla
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Sincronización en background
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-qr-data') {
    event.waitUntil(syncQRData());
  }
});

function syncQRData() {
  console.log('[SW] Sincronizando datos QR...');
  // Aquí puedes agregar lógica para sincronizar datos cuando hay conexión
  return Promise.resolve();
}

// Mensajes desde el cliente
self.addEventListener('message', (event) => {
  console.log('[SW] Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
