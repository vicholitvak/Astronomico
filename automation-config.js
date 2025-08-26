// automation-config.js - Configuration for automated content generation and optimization

const AUTOMATION_CONFIG = {
    // API Update Frequencies (in minutes)
    updateIntervals: {
        spaceflightNews: 30,
        nasaApod: 60,
        arxivPapers: 120,
        issPosition: 5,
        spaceWeather: 15,
        astronomyEvents: 60
    },

    // Content Generation Settings
    contentGeneration: {
        maxNewsArticles: 50,
        maxPapersPerCategory: 20,
        enableAutoSummary: true,
        enableImageOptimization: true,
        generateRSSFeed: true
    },

    // SEO Optimization
    seo: {
        enableStructuredData: true,
        generateSitemap: true,
        enableMetaTagOptimization: true,
        enableOpenGraph: true,
        enableTwitterCards: true,
        canonicalUrls: true
    },

    // Performance Optimization
    performance: {
        enableCaching: true,
        cacheExpiry: 1800000, // 30 minutes in ms
        enableImageCompression: true,
        enableLazyLoading: true,
        enableServiceWorker: true,
        enableCDN: false
    },

    // Notification Settings
    notifications: {
        enablePushNotifications: true,
        enableEmailAlerts: true,
        enableWhatsAppAlerts: true,
        urgentEventThreshold: 2, // hours before event
        batchNotifications: true,
        maxNotificationsPerDay: 5
    },

    // Analytics and Tracking
    analytics: {
        trackNewsViews: true,
        trackAPIUsage: true,
        trackUserInteractions: true,
        trackNotificationEngagement: true,
        enableHeatmaps: false
    }
};

// Automated Content Manager
class AutomatedContentManager {
    constructor(config) {
        this.config = config;
        this.contentCache = new Map();
        this.updateSchedules = new Map();
        this.init();
    }

    init() {
        this.setupUpdateSchedules();
        this.setupPerformanceOptimizations();
        this.setupSEOOptimizations();
        this.startContentGeneration();
    }

    // Setup automatic update schedules for different APIs
    setupUpdateSchedules() {
        Object.entries(this.config.updateIntervals).forEach(([apiName, interval]) => {
            const scheduleId = setInterval(() => {
                this.updateContent(apiName);
            }, interval * 60 * 1000);

            this.updateSchedules.set(apiName, scheduleId);
        });

        console.log('Update schedules configured:', this.config.updateIntervals);
    }

    // Update content from specific API
    async updateContent(apiName) {
        try {
            console.log(`Updating content from ${apiName}...`);
            
            switch (apiName) {
                case 'spaceflightNews':
                    await this.updateSpaceflightNews();
                    break;
                case 'nasaApod':
                    await this.updateNASAContent();
                    break;
                case 'arxivPapers':
                    await this.updateArxivPapers();
                    break;
                case 'issPosition':
                    await this.updateISSData();
                    break;
                case 'spaceWeather':
                    await this.updateSpaceWeather();
                    break;
                case 'astronomyEvents':
                    await this.updateAstronomyEvents();
                    break;
            }

            this.generateSEOContent(apiName);
            this.updateSitemap();
            
        } catch (error) {
            console.error(`Error updating ${apiName}:`, error);
        }
    }

    // Update Spaceflight News content
    async updateSpaceflightNews() {
        if (!window.astroNewsAPI) return;

        const news = await window.astroNewsAPI.fetchSpaceflightNews(this.config.contentGeneration.maxNewsArticles);
        
        // Generate summaries if enabled
        if (this.config.contentGeneration.enableAutoSummary) {
            news.forEach(article => {
                article.autoSummary = this.generateSummary(article.summary);
            });
        }

        this.contentCache.set('spaceflightNews', {
            data: news,
            timestamp: Date.now()
        });

        // Update DOM
        if (typeof displaySpaceflightNews === 'function') {
            displaySpaceflightNews();
        }

        console.log(`Updated ${news.length} news articles`);
    }

    // Update NASA APOD content
    async updateNASAContent() {
        if (!window.astroNewsAPI) return;

        const apod = await window.astroNewsAPI.fetchNASAApod();
        
        if (apod) {
            // Optimize image if enabled
            if (this.config.contentGeneration.enableImageOptimization) {
                apod.optimizedUrl = await this.optimizeImage(apod.url);
            }

            this.contentCache.set('nasaApod', {
                data: apod,
                timestamp: Date.now()
            });

            // Update DOM
            if (typeof displayAPOD === 'function') {
                displayAPOD();
            }

            console.log('Updated NASA APOD content');
        }
    }

    // Update arXiv papers
    async updateArxivPapers() {
        if (!window.astroNewsAPI) return;

        const categories = ['astro-ph', 'astro-ph.GA', 'astro-ph.CO', 'astro-ph.EP'];
        const allPapers = [];

        for (const category of categories) {
            const papers = await window.astroNewsAPI.fetchArxivPapers(
                category, 
                this.config.contentGeneration.maxPapersPerCategory
            );
            allPapers.push(...papers);
        }

        this.contentCache.set('arxivPapers', {
            data: allPapers,
            timestamp: Date.now()
        });

        console.log(`Updated ${allPapers.length} academic papers`);
    }

    // Update ISS tracking data
    async updateISSData() {
        if (!window.ISSTracker) return;

        const issTracker = new ISSTracker();
        const [position, passes] = await Promise.all([
            issTracker.getCurrentPosition(),
            issTracker.getPassTimes()
        ]);

        this.contentCache.set('issData', {
            data: { position, passes },
            timestamp: Date.now()
        });

        // Update DOM
        if (typeof displayISSInfo === 'function') {
            displayISSInfo();
        }

        console.log('Updated ISS tracking data');
    }

    // Update space weather
    async updateSpaceWeather() {
        if (!window.SpaceWeatherMonitor) return;

        const spaceWeather = new SpaceWeatherMonitor();
        const activity = await spaceWeather.getSolarActivity();

        this.contentCache.set('spaceWeather', {
            data: activity,
            timestamp: Date.now()
        });

        // Check for urgent alerts
        if (activity && (activity.geomagneticActivity === 'Storm' || activity.xrayClass.includes('X'))) {
            this.triggerUrgentAlert('space_weather', activity);
        }

        console.log('Updated space weather data');
    }

    // Update astronomy events
    async updateAstronomyEvents() {
        if (!window.AstronomyEventsAPI) return;

        const eventsAPI = new AstronomyEventsAPI();
        const [planetaryEvents, meteorShowers] = await Promise.all([
            eventsAPI.getPlanetaryPositions(),
            eventsAPI.getMeteorShowers()
        ]);

        this.contentCache.set('astronomyEvents', {
            data: { planetaryEvents, meteorShowers },
            timestamp: Date.now()
        });

        console.log('Updated astronomy events data');
    }

    // Generate automatic summaries
    generateSummary(text, maxLength = 150) {
        if (!text || text.length <= maxLength) return text;
        
        // Simple extractive summarization
        const sentences = text.split('. ');
        let summary = '';
        
        for (const sentence of sentences) {
            if (summary.length + sentence.length + 2 <= maxLength) {
                summary += sentence + '. ';
            } else {
                break;
            }
        }
        
        return summary.trim() || text.substring(0, maxLength) + '...';
    }

    // Setup performance optimizations
    setupPerformanceOptimizations() {
        if (this.config.performance.enableServiceWorker) {
            this.registerServiceWorker();
        }

        if (this.config.performance.enableLazyLoading) {
            this.setupLazyLoading();
        }

        if (this.config.performance.enableImageCompression) {
            this.setupImageCompression();
        }
    }

    // Register service worker
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // Setup lazy loading for images
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            // Observe all lazy images
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Setup image compression
    setupImageCompression() {
        // This would integrate with an image optimization service
        console.log('Image compression configured');
    }

    // SEO optimizations
    setupSEOOptimizations() {
        if (this.config.seo.enableMetaTagOptimization) {
            this.updateMetaTags();
        }

        if (this.config.seo.generateSitemap) {
            this.generateSitemap();
        }

        if (this.config.seo.enableOpenGraph) {
            this.updateOpenGraphTags();
        }
    }

    // Update meta tags dynamically
    updateMetaTags() {
        const metaUpdates = {
            'description': 'Centro de noticias astronómicas en tiempo real desde el Desierto de Atacama - ISS tracking, clima espacial, eventos celestiales',
            'keywords': 'astronomía, noticias espaciales, ISS, clima espacial, atacama, chile, tours astronómicos, telescopios',
            'author': 'Atacama NightSky',
            'robots': 'index, follow',
            'revisit-after': '1 day'
        };

        Object.entries(metaUpdates).forEach(([name, content]) => {
            let meta = document.querySelector(`meta[name="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = name;
                document.head.appendChild(meta);
            }
            meta.content = content;
        });
    }

    // Generate dynamic sitemap
    generateSitemap() {
        const urls = [
            { loc: '/', priority: '1.0', changefreq: 'daily' },
            { loc: '/noticias.html', priority: '0.9', changefreq: 'hourly' },
            { loc: '/index.html#tours', priority: '0.8', changefreq: 'weekly' }
        ];

        // Add news articles to sitemap
        const cachedNews = this.contentCache.get('spaceflightNews');
        if (cachedNews) {
            cachedNews.data.forEach(article => {
                urls.push({
                    loc: `/noticias.html#${article.id}`,
                    priority: '0.7',
                    changefreq: 'never',
                    lastmod: article.published_at
                });
            });
        }

        console.log('Sitemap generated with', urls.length, 'URLs');
        
        // In production, this would generate an actual XML sitemap file
        return urls;
    }

    // Update Open Graph tags
    updateOpenGraphTags() {
        const ogTags = {
            'og:title': 'Noticias Astronómicas - Atacama NightSky',
            'og:description': 'Datos espaciales en tiempo real desde el desierto más claro del mundo',
            'og:type': 'website',
            'og:url': window.location.href,
            'og:image': '/images/Nightskylogo.webp',
            'og:site_name': 'Atacama NightSky',
            'og:locale': 'es_CL'
        };

        Object.entries(ogTags).forEach(([property, content]) => {
            let meta = document.querySelector(`meta[property="${property}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('property', property);
                document.head.appendChild(meta);
            }
            meta.content = content;
        });
    }

    // Generate SEO content based on updated data
    generateSEOContent(apiName) {
        // Generate meta descriptions based on latest content
        const cachedData = this.contentCache.get(apiName);
        if (!cachedData) return;

        switch (apiName) {
            case 'spaceflightNews':
                this.updateNewsMetaDescription(cachedData.data);
                break;
            case 'nasaApod':
                this.updateAPODMetaDescription(cachedData.data);
                break;
        }
    }

    // Update meta description based on latest news
    updateNewsMetaDescription(news) {
        if (news.length > 0) {
            const latestNews = news[0];
            const description = `Última noticia: ${latestNews.title}. ${this.generateSummary(latestNews.summary, 120)}`;
            
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.content = description;
            }
        }
    }

    // Trigger urgent alerts
    triggerUrgentAlert(type, data) {
        if (window.autoNotificationSystem) {
            console.log('Triggering urgent alert for:', type, data);
            // Implementation would send immediate notification
        }
    }

    // Generate RSS feed
    generateRSSFeed() {
        if (!this.config.contentGeneration.generateRSSFeed) return;

        const cachedNews = this.contentCache.get('spaceflightNews');
        if (!cachedNews) return;

        // RSS feed structure
        const rssItems = cachedNews.data.slice(0, 20).map(article => ({
            title: article.title,
            link: article.url,
            description: article.summary,
            pubDate: new Date(article.published_at).toUTCString(),
            guid: article.id
        }));

        console.log('RSS feed generated with', rssItems.length, 'items');
        return rssItems;
    }

    // Get content statistics
    getStatistics() {
        const stats = {
            cacheSize: this.contentCache.size,
            lastUpdates: {},
            contentCounts: {}
        };

        this.contentCache.forEach((value, key) => {
            stats.lastUpdates[key] = new Date(value.timestamp).toISOString();
            stats.contentCounts[key] = Array.isArray(value.data) ? value.data.length : 1;
        });

        return stats;
    }

    // Start content generation
    startContentGeneration() {
        console.log('Automated Content Manager started with config:', this.config);
        
        // Initial content load
        Object.keys(this.config.updateIntervals).forEach(apiName => {
            this.updateContent(apiName);
        });

        // Setup RSS feed generation (daily)
        if (this.config.contentGeneration.generateRSSFeed) {
            setInterval(() => {
                this.generateRSSFeed();
            }, 24 * 60 * 60 * 1000); // Daily
        }
    }

    // Stop all automated processes
    stop() {
        this.updateSchedules.forEach((scheduleId) => {
            clearInterval(scheduleId);
        });
        this.updateSchedules.clear();
        console.log('Automated Content Manager stopped');
    }
}

// Initialize automation system
let automatedContentManager;

document.addEventListener('DOMContentLoaded', () => {
    automatedContentManager = new AutomatedContentManager(AUTOMATION_CONFIG);
    
    // Export globally for debugging
    window.automatedContentManager = automatedContentManager;
    window.AUTOMATION_CONFIG = AUTOMATION_CONFIG;
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AutomatedContentManager, AUTOMATION_CONFIG };
}