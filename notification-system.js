// notification-system.js - Automated Notification System for Astronomical Events

class AutoNotificationSystem {
    constructor() {
        this.subscribers = JSON.parse(localStorage.getItem('astro_notifications') || '[]');
        this.lastNotificationCheck = localStorage.getItem('last_notification_check');
        this.checkInterval = 30 * 60 * 1000; // 30 minutes
        this.init();
    }

    init() {
        this.startBackgroundCheck();
        this.setupServiceWorker();
    }

    // Service Worker for push notifications
    async setupServiceWorker() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    // Subscribe to notifications
    async subscribe(alertTypes, email, phone = null, method = 'email') {
        const subscription = {
            id: Date.now(),
            alertTypes: alertTypes,
            email: email,
            phone: phone,
            method: method,
            created: new Date().toISOString(),
            active: true,
            lastNotified: {}
        };

        this.subscribers.push(subscription);
        this.saveSubscribers();

        // Request browser notification permission
        if ('Notification' in window) {
            await Notification.requestPermission();
        }

        return subscription.id;
    }

    // Unsubscribe from notifications
    unsubscribe(subscriptionId) {
        this.subscribers = this.subscribers.filter(sub => sub.id !== subscriptionId);
        this.saveSubscribers();
    }

    // Save subscribers to localStorage
    saveSubscribers() {
        localStorage.setItem('astro_notifications', JSON.stringify(this.subscribers));
    }

    // Start background checking
    startBackgroundCheck() {
        this.checkForNotifications();
        setInterval(() => {
            this.checkForNotifications();
        }, this.checkInterval);
    }

    // Main notification check function
    async checkForNotifications() {
        if (this.subscribers.length === 0) return;

        try {
            const events = await this.getCurrentAstronomicalEvents();
            const notifications = this.generateNotifications(events);
            
            notifications.forEach(notification => {
                this.sendNotification(notification);
            });

            localStorage.setItem('last_notification_check', new Date().toISOString());
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }

    // Get current astronomical events
    async getCurrentAstronomicalEvents() {
        const events = [];
        const today = new Date();

        try {
            // ISS Pass events
            if (window.ISSTracker) {
                const issTracker = new ISSTracker();
                const passes = await issTracker.getPassTimes();
                
                passes.forEach(pass => {
                    const hoursUntil = (pass.risetime - today) / (1000 * 60 * 60);
                    if (hoursUntil > 0 && hoursUntil < 24) {
                        events.push({
                            type: 'iss',
                            title: 'Paso de la ISS visible desde Atacama',
                            description: `La Estación Espacial Internacional será visible desde Atacama`,
                            time: pass.risetime,
                            duration: pass.duration,
                            urgency: hoursUntil < 2 ? 'high' : hoursUntil < 6 ? 'medium' : 'low'
                        });
                    }
                });
            }

            // Space Weather events
            if (window.SpaceWeatherMonitor) {
                const spaceWeather = new SpaceWeatherMonitor();
                const activity = await spaceWeather.getSolarActivity();
                
                if (activity && (activity.geomagneticActivity === 'Storm' || activity.xrayClass.includes('X'))) {
                    events.push({
                        type: 'space_weather',
                        title: 'Alerta de Clima Espacial',
                        description: activity.recommendation,
                        time: today,
                        urgency: 'high'
                    });
                }
            }

            // Astronomical events from local data
            const upcomingEvents = await this.getUpcomingAstronomicalEvents();
            events.push(...upcomingEvents);

        } catch (error) {
            console.error('Error fetching astronomical events:', error);
        }

        return events;
    }

    // Get upcoming events from local data
    async getUpcomingAstronomicalEvents() {
        const events = [];
        const today = new Date();
        
        // Meteor Showers
        const meteorShowers = this.getMeteorShowerSchedule();
        const currentShower = meteorShowers.find(shower => {
            const showerDate = new Date(shower.peak);
            const daysDiff = (showerDate - today) / (1000 * 60 * 60 * 24);
            return daysDiff >= 0 && daysDiff <= 3; // Next 3 days
        });

        if (currentShower) {
            events.push({
                type: 'meteors',
                title: `Lluvia de Meteoros ${currentShower.name}`,
                description: `Pico de actividad esperado. ${currentShower.description}`,
                time: new Date(currentShower.peak),
                urgency: 'medium'
            });
        }

        // Planetary events (simulated)
        const planetaryEvents = [
            {
                type: 'planets',
                title: 'Conjunción Venus-Júpiter',
                description: 'Los dos planetas más brillantes se acercarán visualmente',
                time: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
                urgency: 'medium'
            }
        ];

        return events.concat(planetaryEvents.filter(event => {
            const daysDiff = (event.time - today) / (1000 * 60 * 60 * 24);
            return daysDiff >= 0 && daysDiff <= 7; // Next week
        }));
    }

    // Get meteor shower schedule
    getMeteorShowerSchedule() {
        const year = new Date().getFullYear();
        return [
            {
                name: 'Cuadrántidas',
                peak: `${year}-01-04`,
                description: 'Una de las mejores lluvias del año con hasta 40 meteoros/hora'
            },
            {
                name: 'Líridas',
                peak: `${year}-04-22`,
                description: 'Lluvia moderada con meteoros rápidos y brillantes'
            },
            {
                name: 'Eta Acuáridas',
                peak: `${year}-05-06`,
                description: 'Excelente desde el hemisferio sur, hasta 60 meteoros/hora'
            },
            {
                name: 'Perseidas',
                peak: `${year}-08-12`,
                description: 'La lluvia más popular con hasta 100 meteoros/hora'
            },
            {
                name: 'Gemínidas',
                peak: `${year}-12-14`,
                description: 'La mejor lluvia del año con hasta 120 meteoros/hora'
            }
        ];
    }

    // Generate notifications based on events and subscriptions
    generateNotifications(events) {
        const notifications = [];

        this.subscribers.forEach(subscriber => {
            if (!subscriber.active) return;

            events.forEach(event => {
                // Check if subscriber is interested in this type of event
                if (!subscriber.alertTypes.includes(event.type)) return;

                // Check if we've already notified about this event
                const eventKey = `${event.type}-${event.time.getTime()}`;
                if (subscriber.lastNotified[eventKey]) return;

                // Generate notification
                const notification = {
                    subscriberId: subscriber.id,
                    eventKey: eventKey,
                    email: subscriber.email,
                    phone: subscriber.phone,
                    method: subscriber.method,
                    title: event.title,
                    description: event.description,
                    urgency: event.urgency,
                    time: event.time,
                    ctaUrl: 'https://atacamadarksky.cl/noticias.html'
                };

                notifications.push(notification);

                // Mark as notified
                subscriber.lastNotified[eventKey] = new Date().toISOString();
            });
        });

        this.saveSubscribers();
        return notifications;
    }

    // Send notification
    async sendNotification(notification) {
        try {
            // Browser notification
            await this.sendBrowserNotification(notification);

            // Email notification (would require backend)
            if (notification.method === 'email' || notification.method === 'both') {
                await this.sendEmailNotification(notification);
            }

            // WhatsApp notification (would require backend)
            if (notification.method === 'whatsapp' || notification.method === 'both') {
                await this.sendWhatsAppNotification(notification);
            }

            console.log('Notification sent:', notification.title);
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    // Send browser notification
    async sendBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const options = {
                body: notification.description,
                icon: '/images/Nightskylogo.webp',
                badge: '/images/Nightskylogo.webp',
                tag: notification.eventKey,
                requireInteraction: notification.urgency === 'high',
                actions: [
                    {
                        action: 'view',
                        title: 'Ver Detalles'
                    },
                    {
                        action: 'book',
                        title: 'Reservar Tour'
                    }
                ]
            };

            const browserNotification = new Notification(notification.title, options);
            
            browserNotification.onclick = () => {
                window.open(notification.ctaUrl, '_blank');
                browserNotification.close();
            };
        }
    }

    // Send email notification (placeholder - requires backend)
    async sendEmailNotification(notification) {
        // In production, this would make an API call to your backend
        console.log('Email notification would be sent to:', notification.email);
        
        const emailData = {
            to: notification.email,
            subject: `🌌 ${notification.title} - Atacama Nightsky`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #00d4ff;">${notification.title}</h2>
                    <p>${notification.description}</p>
                    <p><strong>Tiempo del evento:</strong> ${notification.time.toLocaleString('es-ES')}</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${notification.ctaUrl}" style="background: #00d4ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                            Ver Más Información
                        </a>
                    </div>
                    <p style="color: #666;">
                        ¿Quieres observar este evento? Reserva tu tour astronómico en Atacama Nightsky.
                    </p>
                </div>
            `
        };

        // Here you would send the email via your backend API
        // await fetch('/api/send-email', { method: 'POST', body: JSON.stringify(emailData) });
    }

    // Send WhatsApp notification (placeholder - requires backend)
    async sendWhatsAppNotification(notification) {
        console.log('WhatsApp notification would be sent to:', notification.phone);
        
        const message = `🌌 *${notification.title}*\n\n${notification.description}\n\n⏰ ${notification.time.toLocaleString('es-ES')}\n\n¿Te interesa observar este evento? ¡Reserva tu tour astronómico!`;
        
        // Here you would send via WhatsApp API (Twilio, etc.)
        // await this.sendWhatsAppMessage(notification.phone, message);
    }

    // Get notification statistics
    getStats() {
        const stats = {
            totalSubscribers: this.subscribers.length,
            activeSubscribers: this.subscribers.filter(s => s.active).length,
            notificationsSent: 0,
            popularAlertTypes: {}
        };

        this.subscribers.forEach(sub => {
            sub.alertTypes.forEach(type => {
                stats.popularAlertTypes[type] = (stats.popularAlertTypes[type] || 0) + 1;
            });
            
            stats.notificationsSent += Object.keys(sub.lastNotified).length;
        });

        return stats;
    }

    // Manual notification test
    async testNotification(type = 'iss') {
        const testEvent = {
            type: type,
            title: 'Prueba de Notificación',
            description: 'Esta es una notificación de prueba del sistema Atacama Nightsky',
            time: new Date(),
            urgency: 'medium'
        };

        const notifications = this.generateNotifications([testEvent]);
        notifications.forEach(notification => {
            this.sendNotification(notification);
        });

        return notifications.length;
    }
}

// Smart Notification Triggers
class SmartNotificationTriggers {
    constructor(notificationSystem) {
        this.notificationSystem = notificationSystem;
        this.setupTriggers();
    }

    setupTriggers() {
        // Weather-based triggers
        this.setupWeatherTriggers();
        
        // Time-based triggers
        this.setupTimeTriggers();
        
        // Event proximity triggers
        this.setupProximityTriggers();
    }

    setupWeatherTriggers() {
        // Check for perfect viewing conditions
        setInterval(async () => {
            if (window.SpaceWeatherMonitor) {
                const spaceWeather = new SpaceWeatherMonitor();
                const activity = await spaceWeather.getSolarActivity();
                const impact = spaceWeather.getImpactOnObservation(activity);

                if (impact.rating === 'Excelente' && this.isNightTime()) {
                    this.triggerViewingConditionAlert(impact);
                }
            }
        }, 60 * 60 * 1000); // Check every hour
    }

    setupTimeTriggers() {
        // Sunset notifications for astronomy
        this.scheduleSunsetNotifications();
        
        // Weekly astronomy digest
        this.scheduleWeeklyDigest();
    }

    setupProximityTriggers() {
        // ISS pass alerts (2 hours before)
        setInterval(async () => {
            if (window.ISSTracker) {
                const issTracker = new ISSTracker();
                const passes = await issTracker.getPassTimes();
                
                passes.forEach(pass => {
                    const hoursUntil = (pass.risetime - new Date()) / (1000 * 60 * 60);
                    if (hoursUntil > 1.5 && hoursUntil < 2.5) {
                        this.triggerISSAlert(pass);
                    }
                });
            }
        }, 30 * 60 * 1000); // Check every 30 minutes
    }

    isNightTime() {
        const hour = new Date().getHours();
        return hour >= 20 || hour <= 6; // 8 PM to 6 AM
    }

    scheduleSunsetNotifications() {
        // Calculate sunset time for Atacama
        const now = new Date();
        const sunsetHour = 19; // Approximate for Atacama
        
        if (now.getHours() === sunsetHour && now.getMinutes() < 30) {
            this.triggerSunsetAlert();
        }
    }

    scheduleWeeklyDigest() {
        const now = new Date();
        
        // Send on Sundays at 10 AM
        if (now.getDay() === 0 && now.getHours() === 10 && now.getMinutes() < 30) {
            this.sendWeeklyDigest();
        }
    }

    triggerViewingConditionAlert(impact) {
        console.log('Triggering perfect viewing conditions alert');
        // Implementation would send immediate notification about perfect conditions
    }

    triggerISSAlert(pass) {
        console.log('Triggering ISS pass alert:', pass);
        // Implementation would send ISS pass reminder
    }

    triggerSunsetAlert() {
        console.log('Triggering sunset/astronomy time alert');
        // Implementation would send "astronomy time" notification
    }

    sendWeeklyDigest() {
        console.log('Sending weekly astronomy digest');
        // Implementation would compile and send weekly events summary
    }
}

// Initialize notification system
let autoNotificationSystem;
let smartTriggers;

document.addEventListener('DOMContentLoaded', () => {
    autoNotificationSystem = new AutoNotificationSystem();
    smartTriggers = new SmartNotificationTriggers(autoNotificationSystem);
    
    // Export globally
    window.autoNotificationSystem = autoNotificationSystem;
    window.smartTriggers = smartTriggers;
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AutoNotificationSystem, SmartNotificationTriggers };
}