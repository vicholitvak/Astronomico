// sw.js - Service Worker for Push Notifications

const CACHE_NAME = 'atacama-nightsky-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/noticias.html',
    '/styles.css',
    '/news-styles.css',
    '/script.js',
    '/news-script.js',
    '/news-api.js',
    '/notification-system.js',
    '/images/Nightskylogo.webp'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
    console.log('Push message received:', event);
    
    let notificationData = {
        title: 'Atacama Nightsky',
        body: 'Nuevo evento astronómico disponible',
        icon: '/images/Nightskylogo.webp',
        badge: '/images/Nightskylogo.webp',
        tag: 'astronomy-event',
        requireInteraction: false,
        actions: [
            {
                action: 'view',
                title: 'Ver Evento',
                icon: '/images/telescope-icon.png'
            },
            {
                action: 'book',
                title: 'Reservar Tour',
                icon: '/images/book-icon.png'
            }
        ],
        data: {
            url: '/noticias.html',
            timestamp: Date.now()
        }
    };

    // If push has data, use it
    if (event.data) {
        try {
            const pushData = event.data.json();
            notificationData = { ...notificationData, ...pushData };
        } catch (e) {
            console.error('Error parsing push data:', e);
        }
    }

    const promiseChain = self.registration.showNotification(
        notificationData.title,
        {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            requireInteraction: notificationData.requireInteraction,
            actions: notificationData.actions,
            data: notificationData.data,
            vibrate: [200, 100, 200],
            timestamp: notificationData.data.timestamp
        }
    );

    event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Notification click received:', event);
    
    event.notification.close();
    
    let clickedUrl = '/noticias.html';
    
    // Handle action clicks
    if (event.action === 'view') {
        clickedUrl = event.notification.data?.url || '/noticias.html';
    } else if (event.action === 'book') {
        clickedUrl = '/index.html#tours';
    } else if (event.notification.data?.url) {
        clickedUrl = event.notification.data.url;
    }

    // Focus existing tab or open new one
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Check if there's already a tab open with our site
            for (const client of clientList) {
                if (client.url === clickedUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // If no tab is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(clickedUrl);
            }
        })
    );

    // Track notification interaction
    self.registration.sync?.register('notification-click');
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'notification-click') {
        event.waitUntil(
            // Track the notification click when back online
            fetch('/api/track-notification-click', {
                method: 'POST',
                body: JSON.stringify({ timestamp: Date.now() }),
                headers: { 'Content-Type': 'application/json' }
            }).catch(() => {
                // Ignore if tracking fails
                console.log('Notification click tracking failed (offline)');
            })
        );
    }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event.notification.tag);
    
    // Track notification dismissal
    event.waitUntil(
        fetch('/api/track-notification-dismiss', {
            method: 'POST',
            body: JSON.stringify({ 
                tag: event.notification.tag,
                timestamp: Date.now() 
            }),
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => {
            console.log('Notification dismiss tracking failed');
        })
    );
});

// Periodic background sync for checking new events
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-astronomy-events') {
        event.waitUntil(
            checkAndNotifyAstronomyEvents()
        );
    }
});

// Function to check and notify about astronomy events
async function checkAndNotifyAstronomyEvents() {
    try {
        console.log('Background sync: Checking astronomy events');
        
        // This would typically fetch from your API
        const response = await fetch('/api/astronomy-events');
        const events = await response.json();
        
        // Check for urgent events
        const urgentEvents = events.filter(event => 
            event.urgency === 'high' && 
            new Date(event.time) - new Date() < 2 * 60 * 60 * 1000 // Within 2 hours
        );
        
        // Send notifications for urgent events
        urgentEvents.forEach(event => {
            self.registration.showNotification(event.title, {
                body: event.description,
                icon: '/images/Nightskylogo.webp',
                badge: '/images/Nightskylogo.webp',
                tag: `urgent-${event.id}`,
                requireInteraction: true,
                actions: [
                    { action: 'view', title: 'Ver Detalles' },
                    { action: 'book', title: 'Reservar Tour Urgente' }
                ],
                data: { url: '/noticias.html', eventId: event.id }
            });
        });
        
    } catch (error) {
        console.error('Error in background sync:', error);
    }
}

// Message from main thread
self.addEventListener('message', (event) => {
    console.log('SW received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CLIENT_ID') {
        event.ports[0].postMessage({
            type: 'CLIENT_ID',
            clientId: event.source.id
        });
    }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Take control of all clients
    return self.clients.claim();
});

// Push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('Push subscription changed');
    
    event.waitUntil(
        // Re-subscribe the user
        self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                'YOUR_VAPID_PUBLIC_KEY' // Replace with your VAPID public key
            )
        }).then((subscription) => {
            // Send new subscription to server
            return fetch('/api/push-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });
        })
    );
});

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

console.log('Atacama Nightsky Service Worker loaded');