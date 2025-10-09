/**
 * Astronomical System Configuration
 * Customize system behavior and settings
 */

const AstronomicalConfig = {
    // API Configuration
    apis: {
        nasa: {
            apodUrl: 'https://api.nasa.gov/planetary/apod',
            apiKey: 'DEMO_KEY', // Replace with your NASA API key for production
            cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
            retryAttempts: 3,
            retryDelay: 1000 // 1 second
        },
        spaceflight: {
            baseUrl: 'https://api.spaceflightnewsapi.net/v4',
            articlesEndpoint: '/articles',
            cacheTimeout: 60 * 60 * 1000, // 1 hour
            retryAttempts: 3,
            retryDelay: 1000,
            maxArticles: 50
        }
    },

    // UI Configuration
    ui: {
        theme: 'dark', // 'dark' or 'light'
        language: 'es', // 'es' for Spanish, 'en' for English
        animations: {
            enabled: true,
            duration: 300, // milliseconds
            easing: 'ease-out'
        },
        loading: {
            showSpinner: true,
            timeout: 10000 // 10 seconds
        }
    },

    // Content Configuration
    content: {
        observatories: {
            showAll: true,
            highlightFeatured: true,
            featuredIds: ['alma', 'vlt', 'vista']
        },
        events: {
            showPastEvents: false,
            maxFutureEvents: 10,
            calendarRange: 365 // days
        },
        news: {
            autoRefresh: true,
            refreshInterval: 30 * 60 * 1000, // 30 minutes
            maxItems: 20,
            showImages: true
        }
    },

    // Performance Configuration
    performance: {
        caching: {
            enabled: true,
            storage: 'localStorage', // 'localStorage' or 'sessionStorage'
            compress: true
        },
        lazyLoading: {
            enabled: true,
            threshold: 100 // pixels
        },
        prefetching: {
            enabled: true,
            resources: ['fontawesome', 'nasa-image']
        }
    },

    // Error Handling
    errorHandling: {
        showUserMessages: true,
        logErrors: true,
        fallbackContent: true,
        retryFailedRequests: true
    },

    // Analytics (optional)
    analytics: {
        enabled: false,
        trackingId: null,
        events: {
            pageView: true,
            apiCall: false,
            userInteraction: true
        }
    },

    // Development
    development: {
        debug: false,
        testMode: false,
        mockData: false,
        consoleLogging: true
    }
};

// Environment-specific overrides
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Development overrides
    AstronomicalConfig.development.debug = true;
    AstronomicalConfig.development.testMode = true;
    AstronomicalConfig.ui.animations.duration = 0; // Disable animations for faster testing
}

if (window.location.protocol === 'file:') {
    // Local file overrides
    AstronomicalConfig.apis.nasa.apiKey = null; // Disable NASA API for local files
    AstronomicalConfig.performance.caching.enabled = false;
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AstronomicalConfig;
} else {
    window.AstronomicalConfig = AstronomicalConfig;
}