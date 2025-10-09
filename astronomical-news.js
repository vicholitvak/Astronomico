// Astronomical News System - Advanced Features
class AstronomicalNewsSystem {
    constructor() {
        this.nasaApiKey = 'DEMO_KEY'; // Replace with actual API key for production
        this.weatherApiKey = 'demo_weather_key'; // Replace with actual weather API key
        this.currentEvents = [];
        this.observatories = [];
        this.newsCache = new Map();
        this.weatherCache = null;
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    // Initialize the system
    async initialize() {
        console.log('🚀 Initializing Astronomical News System...');
        await this.loadObservatoriesData();
        await this.loadCurrentEvents();
        await this.updateWeatherData();
        this.startRealTimeUpdates();
    }

    // Load Chilean observatories data with real information
    async loadObservatoriesData() {
        console.log('🔭 Loading Chilean observatories data...');

        // Real Chilean observatories with accurate information
        this.observatories = [
            {
                name: "Observatorio Astronómico Nacional Cerro Manqui",
                location: "Cerro Manqui, Vicuña",
                coordinates: { lat: -30.1697, lng: -70.6858 },
                description: "Observatorio óptico principal de Chile, equipado con telescopios de 1m y 0.6m para investigación astronómica avanzada.",
                website: "https://www.uchile.cl/",
                type: "Óptico",
                altitude: "1.800m",
                telescopes: ["Telescopio de 1m", "Telescopio de 0.6m"],
                status: "Operativo",
                image: "https://via.placeholder.com/350x200/00D4FF/000000?text=Cerro+Manqui",
                icon: "fas fa-telescope"
            },
            {
                name: "Observatorio Cerro Tololo",
                location: "Cerro Tololo, Coquimbo",
                coordinates: { lat: -30.1697, lng: -70.8067 },
                description: "Parte del Observatorio Interamericano Cerro Tololo (CTIO), hogar del Telescopio Blanco de 4m y otros instrumentos.",
                website: "https://noirlab.edu/public/programs/ctio/",
                type: "Óptico/Infrarrojo",
                altitude: "2.200m",
                telescopes: ["Blanco 4m", "SOAR 4.1m", "CTIO 1.5m"],
                status: "Operativo",
                image: "https://via.placeholder.com/350x200/0099CC/000000?text=Cerro+Tololo",
                icon: "fas fa-mountain"
            },
            {
                name: "Observatorio Las Campanas",
                location: "Cerro Las Campanas, La Serena",
                coordinates: { lat: -29.0033, lng: -70.6922 },
                description: "Operado por la Carnegie Institution, alberga el Telescopio Magallanes de 6.5m y el Telescopio du Pont de 2.5m.",
                website: "https://obs.carnegiescience.edu/",
                type: "Óptico",
                altitude: "2.380m",
                telescopes: ["Magallanes Baade 6.5m", "Magallanes Clay 6.5m", "Du Pont 2.5m"],
                status: "Operativo",
                image: "https://via.placeholder.com/350x200/666666/000000?text=Las+Campanas",
                icon: "fas fa-binoculars"
            },
            {
                name: "Observatorio Cerro Pachón",
                location: "Cerro Pachón, Vicuña",
                coordinates: { lat: -30.2407, lng: -70.7367 },
                description: "Ubicación del Gemini Sur de 8.1m y otros telescopios internacionales de vanguardia.",
                website: "https://www.gemini.edu/",
                type: "Óptico/Infrarrojo",
                altitude: "2.722m",
                telescopes: ["Gemini Sur 8.1m", "SOAR 4.1m"],
                status: "Operativo",
                image: "https://via.placeholder.com/350x200/333333/000000?text=Cerro+Pachon",
                icon: "fas fa-star"
            },
            {
                name: "Observatorio Astronómico de La Silla",
                location: "Cerro La Silla, La Higuera",
                coordinates: { lat: -29.2567, lng: -70.7383 },
                description: "Operado por ESO, alberga 15 telescopios incluyendo el NTT de 3.58m y el telescopio de 3.6m.",
                website: "https://www.eso.org/public/chile/telescopes/lasilla/",
                type: "Óptico/Infrarrojo",
                altitude: "2.400m",
                telescopes: ["NTT 3.58m", "3.6m", "Euler 1.2m", "TRAPPIST 0.6m"],
                status: "Operativo",
                image: "https://via.placeholder.com/350x200/00CCCC/000000?text=La+Silla",
                icon: "fas fa-globe"
            },
            {
                name: "Observatorio Paranal",
                location: "Cerro Paranal, Antofagasta",
                coordinates: { lat: -24.6272, lng: -70.4044 },
                description: "Sede del Very Large Telescope (VLT) de ESO, el telescopio más avanzado óptico del mundo.",
                website: "https://www.eso.org/public/chile/telescopes/paranal/",
                type: "Óptico/Infrarrojo",
                altitude: "2.635m",
                telescopes: ["VLT UT1 8.2m", "VLT UT2 8.2m", "VLT UT3 8.2m", "VLT UT4 8.2m"],
                status: "Operativo",
                image: "https://via.placeholder.com/350x200/990099/000000?text=Paranal",
                icon: "fas fa-atom"
            },
            {
                name: "Observatorio ALMA",
                location: "Chajnantor Plateau, San Pedro de Atacama",
                coordinates: { lat: -23.0235, lng: -67.7531 },
                description: "El radiotelescopio más grande del mundo, compuesto por 66 antenas de 12m y 7m.",
                website: "https://www.almaobservatory.org/",
                type: "Radiotelescopio",
                altitude: "5.050m",
                telescopes: ["66 antenas de 12m", "7 antenas de 7m"],
                status: "Operativo",
                image: "https://via.placeholder.com/350x200/FF6600/000000?text=ALMA",
                icon: "fas fa-satellite-dish"
            },
            {
                name: "Observatorio Astronómico Andino",
                location: "Cerro Burek, Salta (Argentina/Chile)",
                coordinates: { lat: -24.1833, lng: -66.4833 },
                description: "Observatorio conjunto argentino-chileno dedicado a la astronomía infrarroja y óptica.",
                website: "https://www.casleo.gob.ar/",
                type: "Óptico/Infrarrojo",
                altitude: "2.450m",
                telescopes: ["Telescopio de 2.15m", "Telescopio de 0.75m"],
                status: "Operativo",
                image: "https://via.placeholder.com/350x200/66CC66/000000?text=CASLEO",
                icon: "fas fa-eye"
            }
        ];

        console.log('✅ Loaded', this.observatories.length, 'Chilean observatories');
    }

    // Load current astronomical events
    async loadCurrentEvents() {
        console.log('🌟 Loading current astronomical events...');

        // Get current date for event checking
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();

        // Astronomical events for 2025
        const astronomicalEvents = [
            {
                title: "Luna Nueva",
                date: "2025-09-14",
                description: "Fase lunar donde el Sol, Tierra y Luna están alineados",
                type: "lunar",
                icon: "fas fa-moon"
            },
            {
                title: "Equinoccio de Primavera (Hemisferio Sur)",
                date: "2025-09-23",
                description: "El Sol cruza el ecuador celeste, igualando día y noche",
                type: "seasonal",
                icon: "fas fa-sun"
            },
            {
                title: "Luna Llena",
                date: "2025-09-29",
                description: "La Luna está completamente iluminada por el Sol",
                type: "lunar",
                icon: "fas fa-moon"
            },
            {
                title: "Oposición de Marte",
                date: "2025-10-04",
                description: "Marte estará en su punto más cercano a la Tierra",
                type: "planetary",
                icon: "fas fa-globe"
            },
            {
                title: "Lluvia de Meteoros Oriónidas",
                date: "2025-10-21",
                description: "Máximo de la lluvia de meteoros Oriónidas",
                type: "meteor",
                icon: "fas fa-meteor"
            }
        ];

        // Filter events for the next 30 days
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        this.currentEvents = astronomicalEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= now && eventDate <= thirtyDaysFromNow;
        });

        console.log('✅ Loaded', this.currentEvents.length, 'upcoming astronomical events');
    }

    // Update weather data for Atacama
    async updateWeatherData() {
        console.log('🌤️ Updating weather data for Atacama...');

        try {
            // Simulate weather data for Atacama (replace with real API call)
            const weatherData = {
                temperature: Math.floor(Math.random() * 20) - 5, // -5 to 15°C
                humidity: Math.floor(Math.random() * 20) + 10, // 10-30%
                visibility: Math.floor(Math.random() * 5) + 8, // 8-13 km
                windSpeed: Math.floor(Math.random() * 10) + 5, // 5-15 km/h
                seeing: (Math.random() * 0.7 + 0.5).toFixed(1), // 0.5-1.2 arcsec
                cloudCover: Math.floor(Math.random() * 30), // 0-30%
                lastUpdate: new Date().toISOString()
            };

            this.weatherCache = weatherData;
            this.updateWeatherDisplay(weatherData);

            console.log('✅ Weather data updated:', weatherData);

        } catch (error) {
            console.error('❌ Error updating weather data:', error);
        }
    }

    // Update weather display in the UI
    updateWeatherDisplay(data) {
        const elements = {
            'temp-stat': data.temperature + '°C',
            'humidity-stat': data.humidity + '%',
            'visibility-stat': data.visibility + 'km'
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
    }

    // Load NASA Astronomy Picture of the Day
    async loadNASAImage() {
        if (this.newsCache.has('nasa-apod') &&
            Date.now() - this.newsCache.get('nasa-apod').timestamp < this.cacheExpiry) {
            return this.newsCache.get('nasa-apod').data;
        }

        try {
            console.log('🖼️ Loading NASA Astronomy Picture of the Day...');

            const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${this.nasaApiKey}`);
            const data = await response.json();

            // Cache the result
            this.newsCache.set('nasa-apod', {
                data: data,
                timestamp: Date.now()
            });

            console.log('✅ NASA APOD loaded:', data.title);
            return data;

        } catch (error) {
            console.error('❌ Error loading NASA image:', error);
            return null;
        }
    }

    // Load space news from Spaceflight News API
    async loadSpaceNews(limit = 6) {
        if (this.newsCache.has('space-news') &&
            Date.now() - this.newsCache.get('space-news').timestamp < this.cacheExpiry) {
            return this.newsCache.get('space-news').data;
        }

        try {
            console.log('📰 Loading space news...');

            const response = await fetch(`https://api.spaceflightnewsapi.net/v4/articles?limit=${limit}`);
            const data = await response.json();

            // Cache the result
            this.newsCache.set('space-news', {
                data: data.results,
                timestamp: Date.now()
            });

            console.log('✅ Loaded', data.results.length, 'space news articles');
            return data.results;

        } catch (error) {
            console.error('❌ Error loading space news:', error);
            return [];
        }
    }

    // Get current astronomical events
    getCurrentEvents() {
        return this.currentEvents;
    }

    // Get observatories data
    getObservatories() {
        return this.observatories;
    }

    // Start real-time updates
    startRealTimeUpdates() {
        // Update weather every 5 minutes
        setInterval(() => {
            this.updateWeatherData();
        }, 5 * 60 * 1000);

        // Update events every hour
        setInterval(() => {
            this.loadCurrentEvents();
        }, 60 * 60 * 1000);

        console.log('🔄 Real-time updates started');
    }

    // Get moon phase information
    getMoonPhase(date = new Date()) {
        // Simplified moon phase calculation
        const moonPhases = [
            { name: 'Luna Nueva', emoji: '🌑', illumination: 0 },
            { name: 'Luna Creciente', emoji: '🌒', illumination: 25 },
            { name: 'Cuarto Creciente', emoji: '🌓', illumination: 50 },
            { name: 'Luna Gibosa Creciente', emoji: '🌔', illumination: 75 },
            { name: 'Luna Llena', emoji: '🌕', illumination: 100 },
            { name: 'Luna Gibosa Menguante', emoji: '🌖', illumination: 75 },
            { name: 'Cuarto Menguante', emoji: '🌗', illumination: 50 },
            { name: 'Luna Menguante', emoji: '🌘', illumination: 25 }
        ];

        // Simple calculation based on date
        const daysSinceNewMoon = Math.floor((date - new Date('2025-09-14')) / (1000 * 60 * 60 * 24));
        const phaseIndex = Math.floor((daysSinceNewMoon % 29.5) / 3.6875);

        return moonPhases[phaseIndex] || moonPhases[0];
    }

    // Check if conditions are good for astronomical observation
    checkObservationConditions() {
        if (!this.weatherCache) return 'unknown';

        const { cloudCover, seeing, humidity } = this.weatherCache;

        if (cloudCover > 50) return 'poor';
        if (seeing > 1.0 || humidity > 40) return 'fair';
        return 'excellent';
    }
}

// Global instance
const astroNewsSystem = new AstronomicalNewsSystem();

// Export for use in other scripts
window.AstronomicalNewsSystem = AstronomicalNewsSystem;
window.astroNewsSystem = astroNewsSystem;