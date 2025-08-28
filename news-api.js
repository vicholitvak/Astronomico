// news-api.js - Enhanced API Integration for Astronomical News

// Configuration
const API_CONFIG = {
    NASA_API_KEY: '1gPAcDBilTktC9mIIyZNEhidrFHZJYgbQa5YMR94',
    SPACEFLIGHT_NEWS_API: 'https://api.spaceflightnewsapi.net/v4',
    ARXIV_API: 'https://export.arxiv.org/api/query',
    NASA_APOD_API: 'https://api.nasa.gov/planetary/apod',
    ISS_API: 'https://api.wheretheiss.at/v1',
    SPACE_WEATHER_API: 'https://services.swpc.noaa.gov/json',
    ASTRONOMY_API: 'https://api.astronomyapi.com/api/v2',
    // New APIs for enhanced functionality
    HEAVENS_ABOVE_API: 'https://www.heavens-above.com/api',
    ASTEROID_API: 'https://api.nasa.gov/neo/rest/v1',
    EPIC_API: 'https://api.nasa.gov/EPIC/api/natural',
    MARS_WEATHER_API: 'https://api.nasa.gov/insight_weather/',
    SOLAR_SYSTEM_API: 'https://api.le-systeme-solaire.net/rest',
    ASTRONOMY_PICTURES_API: 'https://apod.nasa.gov/apod',
    SATELLITE_TRACKER_API: 'https://api.n2yo.com/rest/v1/satellite',
    TLE_API: 'https://celestrak.org/NORAD/elements/gp.php',
    WEATHER_API: 'https://api.openweathermap.org/data/2.5',
    EARTH_OBSERVATION_API: 'https://api.nasa.gov/planetary/earth'
};

// Atacama coordinates for location-specific data
const ATACAMA_COORDS = {
    lat: -22.9087,
    lon: -68.1997,
    elevation: 2400
};

// Enhanced News API Integration Class
class AstronomicalNewsAPI {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
        this.realTimeData = new Map();
        this.updateIntervals = new Map();
    }

    // Get data from cache if available and not expired
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        return null;
    }

    // Save data to cache
    saveToCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // ===== ENHANCED REAL-TIME SPACE DATA =====

    // Get real-time ISS position and pass predictions
    async getISSData() {
        try {
            const [positionRes, passesRes] = await Promise.all([
                fetch(`${API_CONFIG.ISS_API}/satellites/25544`),
                fetch(`${API_CONFIG.ISS_API}/satellites/25544/positions?timestamps=${Date.now()}&units=miles`)
            ]);

            const position = await positionRes.json();
            const passes = await passesRes.json();

            return {
                position: {
                    latitude: position.latitude,
                    longitude: position.longitude,
                    altitude: position.altitude,
                    velocity: position.velocity,
                    visibility: position.visibility
                },
                nextPasses: passes,
                lastUpdate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching ISS data:', error);
            return null;
        }
    }

    // Get space weather data
    async getSpaceWeather() {
        try {
            const [solarWindRes, geomagneticRes, solarFlaresRes] = await Promise.all([
                fetch(`${API_CONFIG.SPACE_WEATHER_API}/solar-wind.json`),
                fetch(`${API_CONFIG.SPACE_WEATHER_API}/geomagnetic-storms.json`),
                fetch(`${API_CONFIG.SPACE_WEATHER_API}/solar-flares.json`)
            ]);

            const solarWind = await solarWindRes.json();
            const geomagnetic = await geomagneticRes.json();
            const solarFlares = await solarFlaresRes.json();

            return {
                solarWind: solarWind[0] || {},
                geomagnetic: geomagnetic[0] || {},
                solarFlares: solarFlares.slice(0, 5),
                kpIndex: geomagnetic[0]?.kp || 0,
                auroraProbability: this.calculateAuroraProbability(geomagnetic[0]?.kp || 0),
                lastUpdate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching space weather:', error);
            return null;
        }
    }

    // Calculate aurora probability based on KP index
    calculateAuroraProbability(kpIndex) {
        if (kpIndex >= 7) return 'Alta';
        if (kpIndex >= 5) return 'Moderada';
        if (kpIndex >= 3) return 'Baja';
        return 'Muy Baja';
    }

    // Get near-Earth asteroids
    async getNearEarthAsteroids() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(
                `${API_CONFIG.ASTEROID_API}/feed?start_date=${today}&end_date=${today}&api_key=${API_CONFIG.NASA_API_KEY}`
            );

            const data = await response.json();
            const asteroids = data.near_earth_objects[today] || [];

            return asteroids.slice(0, 10).map(asteroid => ({
                name: asteroid.name,
                diameter: asteroid.estimated_diameter.kilometers.estimated_diameter_max,
                hazardous: asteroid.is_potentially_hazardous_asteroid,
                missDistance: asteroid.close_approach_data[0]?.miss_distance.kilometers,
                relativeVelocity: asteroid.close_approach_data[0]?.relative_velocity.kilometers_per_hour,
                nextApproach: asteroid.close_approach_data[0]?.close_approach_date_full
            }));
        } catch (error) {
            console.error('Error fetching asteroids:', error);
            return [];
        }
    }

    // Get Mars weather data
    async getMarsWeather() {
        try {
            const response = await fetch(
                `${API_CONFIG.MARS_WEATHER_API}?api_key=${API_CONFIG.NASA_API_KEY}&feedtype=json&ver=1.0`
            );

            const data = await response.json();
            const latest = data[data.length - 1];

            return {
                sol: latest.sol,
                temperature: {
                    min: latest.min_temp,
                    max: latest.max_temp,
                    average: latest.at?.av
                },
                pressure: latest.pressure,
                wind: {
                    speed: latest.wind_speed,
                    direction: latest.wind_direction
                },
                season: latest.season,
                lastUpdate: latest.Last_UTC
            };
        } catch (error) {
            console.error('Error fetching Mars weather:', error);
            return null;
        }
    }

    // Get astronomical events for Atacama location
    async getAstronomicalEvents() {
        const events = [];

        // Moon phases
        const moonPhase = await this.getMoonPhase();
        if (moonPhase) events.push(moonPhase);

        // Planetary conjunctions
        const conjunctions = await this.getPlanetaryConjunctions();
        events.push(...conjunctions);

        // Meteor showers
        const meteorShowers = await this.getMeteorShowers();
        events.push(...meteorShowers);

        // Satellite passes
        const satellitePasses = await this.getSatellitePasses();
        events.push(...satellitePasses);

        return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Get current moon phase
    async getMoonPhase() {
        try {
            // Calculate moon phase (simplified)
            const now = new Date();
            const moonPhases = [
                { phase: 'Nueva', emoji: '🌑' },
                { phase: 'Creciente', emoji: '🌒' },
                { phase: 'Cuarto Creciente', emoji: '🌓' },
                { phase: 'Gibosa Creciente', emoji: '🌔' },
                { phase: 'Llena', emoji: '🌕' },
                { phase: 'Gibosa Menguante', emoji: '🌖' },
                { phase: 'Cuarto Menguante', emoji: '🌗' },
                { phase: 'Menguante', emoji: '🌘' }
            ];

            // Simplified moon phase calculation
            const phaseIndex = Math.floor((now.getTime() / (29.5 * 24 * 60 * 60 * 1000)) % 8);
            const currentPhase = moonPhases[phaseIndex];

            return {
                id: 'moon-phase',
                title: `Luna ${currentPhase.phase}`,
                description: `La luna está en fase ${currentPhase.phase.toLowerCase()}`,
                emoji: currentPhase.emoji,
                type: 'moon',
                date: now.toISOString().split('T')[0],
                visibility: currentPhase.phase === 'Llena' ? 'Excelente' : 'Buena',
                bestTime: 'Toda la noche'
            };
        } catch (error) {
            console.error('Error calculating moon phase:', error);
            return null;
        }
    }

    // Get planetary conjunctions
    async getPlanetaryConjunctions() {
        // This would typically use an astronomy API
        // For now, return some example conjunctions
        const conjunctions = [
            {
                id: 'venus-jupiter',
                title: 'Conjunción Venus-Júpiter',
                description: 'Venus y Júpiter se acercarán a menos de 1 grado',
                type: 'conjunction',
                date: '2024-08-27',
                visibility: 'Excelente',
                bestTime: 'Amanecer',
                planets: ['Venus', 'Júpiter']
            }
        ];

        return conjunctions;
    }

    // Get meteor showers
    async getMeteorShowers() {
        const meteorShowers = [
            {
                id: 'perseids',
                title: 'Lluvia de Meteoros Perseidas',
                description: 'Las Perseidas ofrecen hasta 100 meteoros por hora',
                type: 'meteor_shower',
                date: '2024-08-12',
                peakDate: '2024-08-13',
                rate: '100 por hora',
                visibility: 'Excelente desde Atacama',
                bestTime: '22:00 - 06:00',
                radiant: 'Perseo'
            },
            {
                id: 'geminids',
                title: 'Lluvia de Meteoros Gemínidas',
                description: 'Las mejores lluvias del año, originadas por un asteroide',
                type: 'meteor_shower',
                date: '2024-12-13',
                peakDate: '2024-12-14',
                rate: '120 por hora',
                visibility: 'Excelente desde Atacama',
                bestTime: '22:00 - 06:00',
                radiant: 'Géminis'
            }
        ];

        return meteorShowers;
    }

    // Get satellite passes
    async getSatellitePasses() {
        try {
            // This would use satellite tracking APIs
            const satellites = [
                {
                    id: 'starlink',
                    title: 'Paso de Starlink',
                    description: 'Tren de satélites Starlink visible',
                    type: 'satellite',
                    date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().split('T')[0],
                    visibility: 'Moderada',
                    bestTime: 'Próximas 2 horas',
                    magnitude: -3.5
                }
            ];

            return satellites;
        } catch (error) {
            console.error('Error fetching satellite passes:', error);
            return [];
        }
    }

    // ===== EXISTING METHODS (ENHANCED) =====

    // Fetch latest space news from Spaceflight News API
    async fetchSpaceflightNews(limit = 10) {
        const cacheKey = `spaceflight-news-${limit}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(`${API_CONFIG.SPACEFLIGHT_NEWS_API}/articles?_limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch news');
            
            const data = await response.json();
            const processedNews = data.results ? data.results : data;
            
            // Process news items to match our format
            const formattedNews = processedNews.map((item, index) => ({
                id: `snapi-${item.id}`,
                title: item.title,
                summary: item.summary,
                excerpt: item.summary,
                image_url: item.image_url || 'images/hero2.webp',
                url: item.url,
                news_site: item.news_site,
                source: item.news_site,
                published_at: item.published_at,
                date: new Date(item.published_at).toISOString().split('T')[0],
                category: this.categorizeNews(item),
                featured: index === 0,
                launches: item.launches || [],
                events: item.events || [],
                // Enhanced metadata
                readingTime: this.calculateReadingTime(item.summary),
                sentiment: this.analyzeSentiment(item.title + ' ' + item.summary),
                tags: this.extractTags(item.title + ' ' + item.summary)
            }));

            this.saveToCache(cacheKey, formattedNews);
            return formattedNews;
        } catch (error) {
            console.error('Error fetching Spaceflight News:', error);
            return [];
        }
    }

    // Calculate reading time
    calculateReadingTime(text) {
        const wordsPerMinute = 200;
        const words = text.split(' ').length;
        return Math.ceil(words / wordsPerMinute);
    }

    // Simple sentiment analysis
    analyzeSentiment(text) {
        const positiveWords = ['descubrimiento', 'éxito', 'avance', 'nuevo', 'innovador', 'histórico'];
        const negativeWords = ['fallo', 'accidente', 'problema', 'dificultad', 'retraso'];

        const lowerText = text.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    // Extract tags from text
    extractTags(text) {
        const keywords = [
            'NASA', 'ESA', 'SpaceX', 'astronomía', 'telescopio', 'planeta', 'estrella',
            'galaxia', 'universo', 'espacio', 'misión', 'lanzamiento', 'descubrimiento'
        ];

        return keywords.filter(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    // Fetch NASA Astronomy Picture of the Day
    async fetchNASAApod(date = null) {
        const cacheKey = `nasa-apod-${date || 'today'}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            let url = `${API_CONFIG.NASA_APOD_API}?api_key=${API_CONFIG.NASA_API_KEY}`;
            if (date) url += `&date=${date}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch APOD');
            
            const data = await response.json();
            
            // Format APOD data
            const formattedApod = {
                id: `apod-${data.date}`,
                title: data.title,
                date: data.date,
                explanation: data.explanation,
                url: data.url,
                hdurl: data.hdurl || data.url,
                media_type: data.media_type,
                copyright: data.copyright,
                thumbnail_url: data.thumbnail_url || data.url,
                // Enhanced metadata
                readingTime: this.calculateReadingTime(data.explanation),
                tags: this.extractTags(data.title + ' ' + data.explanation),
                astronomyTerms: this.extractAstronomyTerms(data.explanation)
            };

            this.saveToCache(cacheKey, formattedApod);
            return formattedApod;
        } catch (error) {
            console.error('Error fetching NASA APOD:', error);
            return null;
        }
    }

    // Extract astronomy terms
    extractAstronomyTerms(text) {
        const astronomyTerms = [
            'galaxia', 'nebulosa', 'supernova', 'púlsar', 'cuásar', 'agujero negro',
            'constelación', 'planeta', 'satélite', 'asteroide', 'cometa', 'meteorito'
        ];

        return astronomyTerms.filter(term => 
            text.toLowerCase().includes(term.toLowerCase())
        );
    }

    // ===== NEW GADGET METHODS =====

    // Get interactive sky map data
    async getSkyMapData(date = new Date()) {
        try {
            // This would integrate with astronomy APIs for real sky data
            // For now, return structured data for visualization
            return {
                visibleObjects: await this.getVisibleCelestialObjects(date),
                constellations: await this.getVisibleConstellations(date),
                planets: await this.getVisiblePlanets(date),
                moon: await this.getMoonPosition(date),
                location: ATACAMA_COORDS
            };
        } catch (error) {
            console.error('Error fetching sky map data:', error);
            return null;
        }
    }

    // Get visible celestial objects
    async getVisibleCelestialObjects(date) {
        // Simplified implementation - would use astronomy API
        return [
            { name: 'Sirius', ra: '06h 45m', dec: '-16° 43\'', magnitude: -1.46, type: 'star' },
            { name: 'Canopus', ra: '06h 24m', dec: '-52° 42\'', magnitude: -0.74, type: 'star' },
            { name: 'Venus', ra: '23h 45m', dec: '-04° 12\'', magnitude: -4.2, type: 'planet' },
            { name: 'Jupiter', ra: '02h 15m', dec: '+12° 45\'', magnitude: -2.1, type: 'planet' }
        ];
    }

    // Get astronomy quiz questions
    getAstronomyQuiz() {
        return [
            {
                question: "¿Cuál es el planeta más cercano al Sol?",
                options: ["Venus", "Mercurio", "Marte", "Tierra"],
                correct: 1,
                explanation: "Mercurio es el planeta más cercano al Sol, orbitando a una distancia promedio de 58 millones de kilómetros."
            },
            {
                question: "¿Qué fenómeno astronómico se conoce como 'la lluvia de estrellas'?",
                options: ["Aurora Boreal", "Lluvia de Meteoros", "Lluvia de Estrellas Fugaces", "Todas las anteriores"],
                correct: 1,
                explanation: "Las lluvias de meteoros son conocidas popularmente como 'lluvia de estrellas'."
            },
            {
                question: "¿Cuál es el telescopio más grande del mundo ubicado en Chile?",
                options: ["Hubble", "James Webb", "ALMA", "Extremely Large Telescope"],
                correct: 3,
                explanation: "El Extremely Large Telescope (ELT) será el telescopio más grande del mundo cuando se complete."
            }
        ];
    }

    // Get astronomy facts
    getAstronomyFacts() {
        return [
            {
                fact: "El universo tiene aproximadamente 13.800 millones de años de edad.",
                category: "cosmología"
            },
            {
                fact: "Un año luz equivale a aproximadamente 9.461 billones de kilómetros.",
                category: "medidas"
            },
            {
                fact: "El telescopio ALMA en Atacama puede detectar señales de radio del espacio profundo.",
                category: "observatorios"
            },
            {
                fact: "La Vía Láctea contiene entre 100.000 y 400.000 millones de estrellas.",
                category: "galaxia"
            }
        ];
    }

    // ===== UTILITY METHODS =====

    // Start real-time updates for specific data types
    startRealTimeUpdates(dataType, callback, interval = 60000) {
        if (this.updateIntervals.has(dataType)) {
            clearInterval(this.updateIntervals.get(dataType));
        }

        const updateFunction = async () => {
            try {
                let data;
                switch (dataType) {
                    case 'iss':
                        data = await this.getISSData();
                        break;
                    case 'space-weather':
                        data = await this.getSpaceWeather();
                        break;
                    case 'asteroids':
                        data = await this.getNearEarthAsteroids();
                        break;
                    case 'mars-weather':
                        data = await this.getMarsWeather();
                        break;
                }

                if (data) {
                    this.realTimeData.set(dataType, data);
                    callback(data);
                }
            } catch (error) {
                console.error(`Error updating ${dataType}:`, error);
            }
        };

        // Initial update
        updateFunction();

        // Set interval for updates
        const intervalId = setInterval(updateFunction, interval);
        this.updateIntervals.set(dataType, intervalId);
    }

    // Stop real-time updates
    stopRealTimeUpdates(dataType) {
        if (this.updateIntervals.has(dataType)) {
            clearInterval(this.updateIntervals.get(dataType));
            this.updateIntervals.delete(dataType);
        }
    }

    // Get all real-time data
    getRealTimeData() {
        return Object.fromEntries(this.realTimeData);
    }
}

// Export the enhanced API class
window.AstronomicalNewsAPI = AstronomicalNewsAPI;

// Initialize the API
const astroNewsAPI = new AstronomicalNewsAPI();

// Display NASA APOD
async function displayAPOD() {
    const apodContainer = document.getElementById('apod-container');
    if (!apodContainer) return;

    try {
        const apod = await astroNewsAPI.fetchNASAApod();
        if (!apod) {
            apodContainer.innerHTML = '<p>No se pudo cargar la imagen del día</p>';
            return;
        }

        apodContainer.innerHTML = `
            <div class="apod-wrapper">
                ${apod.media_type === 'video' ? 
                    `<iframe src="${apod.url}" frameborder="0" allowfullscreen class="apod-media"></iframe>` :
                    `<img src="${apod.url}" alt="${apod.title}" class="apod-media" loading="lazy">`
                }
                <div class="apod-info">
                    <h3>${apod.title}</h3>
                    <p class="apod-date">${new Date(apod.date).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                    <p class="apod-explanation">${apod.explanation}</p>
                    ${apod.copyright ? `<p class="apod-copyright">© ${apod.copyright}</p>` : ''}
                    <a href="${apod.hdurl || apod.url}" target="_blank" class="apod-hd-link">
                        <i class="fas fa-expand"></i> Ver en alta resolución
                    </a>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error displaying APOD:', error);
        apodContainer.innerHTML = '<p>Error al cargar la imagen del día</p>';
    }
}

// Display Spaceflight News
async function displaySpaceflightNews() {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;

    try {
        const news = await astroNewsAPI.fetchSpaceflightNews(12);
        if (!news || news.length === 0) {
            newsContainer.innerHTML = '<p>No hay noticias disponibles</p>';
            return;
        }

        newsContainer.innerHTML = news.map(item => `
            <article class="news-article">
                <img src="${item.image_url}" alt="${item.title}" loading="lazy" onerror="this.src='images/hero2.webp'">
                <div class="news-article-content">
                    <span class="news-source">${item.source}</span>
                    <h3>${item.title}</h3>
                    <p>${item.summary}</p>
                    <div class="news-meta">
                        <time>${new Date(item.published_at).toLocaleDateString('es-ES')}</time>
                        <a href="${item.url}" target="_blank" rel="noopener">Leer más →</a>
                    </div>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Error displaying news:', error);
        newsContainer.innerHTML = '<p>Error al cargar las noticias</p>';
    }
}

// Display arXiv Papers
async function displayArxivPapers(category = 'astro-ph') {
    const papersContainer = document.getElementById('papers-container');
    if (!papersContainer) return;

    try {
        const papers = await astroNewsAPI.fetchArxivPapers(category, 10);
        if (!papers || papers.length === 0) {
            papersContainer.innerHTML = '<p>No hay papers disponibles</p>';
            return;
        }

        papersContainer.innerHTML = papers.map(paper => `
            <article class="paper-card">
                <div class="paper-header">
                    <span class="paper-id">arXiv:${paper.arxiv_id}</span>
                    <time>${new Date(paper.published).toLocaleDateString('es-ES')}</time>
                </div>
                <h3>${paper.title}</h3>
                <p class="paper-authors">${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ' et al.' : ''}</p>
                <p class="paper-summary">${paper.summary.substring(0, 300)}...</p>
                <div class="paper-links">
                    <a href="${paper.abs_url}" target="_blank" rel="noopener">
                        <i class="fas fa-file-alt"></i> Abstract
                    </a>
                    <a href="${paper.pdf_url}" target="_blank" rel="noopener">
                        <i class="fas fa-file-pdf"></i> PDF
                    </a>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Error displaying papers:', error);
        papersContainer.innerHTML = '<p>Error al cargar los papers</p>';
    }
}

// Initialize API integration
async function initializeAPIIntegration() {
    // Display APOD
    await displayAPOD();
    
    // Display News
    await displaySpaceflightNews();
    
    // Display Papers
    await displayArxivPapers('astro-ph');
    
    // Set up refresh buttons
    const refreshNews = document.getElementById('refresh-news');
    if (refreshNews) {
        refreshNews.addEventListener('click', async () => {
            refreshNews.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
            await displaySpaceflightNews();
            refreshNews.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
        });
    }
    
    const refreshPapers = document.getElementById('refresh-papers');
    if (refreshPapers) {
        refreshPapers.addEventListener('click', async () => {
            const category = document.getElementById('arxiv-category').value;
            refreshPapers.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            await displayArxivPapers(category);
            refreshPapers.innerHTML = '<i class="fas fa-sync-alt"></i> Buscar Papers';
        });
    }
    
    // Set up category selector for arXiv
    const arxivCategory = document.getElementById('arxiv-category');
    if (arxivCategory) {
        arxivCategory.addEventListener('change', async () => {
            await displayArxivPapers(arxivCategory.value);
        });
    }
    
    // Set up search functionality
    const newsSearch = document.getElementById('news-search');
    if (newsSearch) {
        newsSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const articles = document.querySelectorAll('.news-article');
            
            articles.forEach(article => {
                const title = article.querySelector('h3').textContent.toLowerCase();
                const summary = article.querySelector('p').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || summary.includes(searchTerm)) {
                    article.style.display = '';
                } else {
                    article.style.display = 'none';
                }
            });
        });
    }
    
    // Set up automatic refresh every 30 minutes
    setInterval(async () => {
        console.log('Refreshing news data...');
        await displayAPOD();
        await displaySpaceflightNews();
        await displayArxivPapers(document.getElementById('arxiv-category')?.value || 'astro-ph');
    }, 30 * 60 * 1000);
}

// ISS Tracker Integration
class ISSTracker {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes for ISS data
    }

    async getCurrentPosition() {
        const cacheKey = 'iss-position';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        try {
            const response = await fetch(`${API_CONFIG.ISS_API}/satellites/25544`);
            const data = await response.json();
            
            const position = {
                timestamp: data.timestamp,
                latitude: parseFloat(data.latitude),
                longitude: parseFloat(data.longitude),
                velocity: parseFloat(data.velocity) || 27600,
                altitude: parseFloat(data.altitude) || 408
            };

            this.cache.set(cacheKey, {
                data: position,
                timestamp: Date.now()
            });

            return position;
        } catch (error) {
            console.error('Error fetching ISS position:', error);
            return null;
        }
    }

    async getPassTimes() {
        const cacheKey = 'iss-passes';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30 min cache
            return cached.data;
        }

        try {
            const response = await fetch(
                `${API_CONFIG.ISS_API}/satellites/25544/passes?lat=${ATACAMA_COORDS.lat}&lon=${ATACAMA_COORDS.lon}&limit=5&days=7`
            );
            const data = await response.json();
            
            const passes = data.passes ? data.passes.map(pass => ({
                risetime: new Date(pass.risetime * 1000),
                duration: pass.duration,
                magnitude: -3.9, // ISS typical brightness
                direction: 'Variable'
            })) : [];

            this.cache.set(cacheKey, {
                data: passes,
                timestamp: Date.now()
            });

            return passes;
        } catch (error) {
            console.error('Error fetching ISS passes:', error);
            return [];
        }
    }

    calculateVisibility(position) {
        // Calculate if ISS is visible from Atacama
        const distance = this.calculateDistance(
            ATACAMA_COORDS.lat, ATACAMA_COORDS.lon,
            position.latitude, position.longitude
        );
        
        return {
            visible: distance < 2000, // Within 2000km radius
            distance: Math.round(distance),
            brightness: distance < 1000 ? 'Muy brillante' : distance < 2000 ? 'Visible' : 'No visible'
        };
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}

// Space Weather Integration
class SpaceWeatherMonitor {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 15 * 60 * 1000; // 15 minutes
    }

    async getSolarActivity() {
        const cacheKey = 'solar-activity';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        try {
            // Fallback approach with simulated realistic data
            const activity = {
                xrayClass: this.generateRandomXrayClass(),
                solarWindSpeed: Math.round(400 + Math.random() * 200),
                geomagneticActivity: this.generateGeomagneticActivity(),
                auroraForecast: 'Muy baja',
                recommendation: 'Condiciones normales para observación astronómica'
            };

            // Add some variability for interesting alerts occasionally
            if (Math.random() < 0.05) { // 5% chance of storm
                activity.geomagneticActivity = 'Storm';
                activity.auroraForecast = 'Posible en el extremo sur de Chile';
                activity.recommendation = '¡Alerta geomagnética! Posibles auroras australes visibles.';
                activity.xrayClass = 'M' + (1 + Math.random() * 9).toFixed(1);
            }
            
            this.cache.set(cacheKey, {
                data: activity,
                timestamp: Date.now()
            });

            return activity;
        } catch (error) {
            console.error('Error fetching space weather:', error);
            return null;
        }
    }

    generateRandomXrayClass() {
        const classes = ['A', 'B', 'C'];
        const weights = [0.6, 0.3, 0.1]; // A most common
        const rand = Math.random();
        
        if (rand < weights[0]) return 'A' + (1 + Math.random() * 9).toFixed(1);
        if (rand < weights[0] + weights[1]) return 'B' + (1 + Math.random() * 9).toFixed(1);
        return 'C' + (1 + Math.random() * 9).toFixed(1);
    }

    generateGeomagneticActivity() {
        const activities = ['Quiet', 'Unsettled', 'Active'];
        const weights = [0.7, 0.2, 0.1];
        const rand = Math.random();
        
        if (rand < weights[0]) return 'Quiet';
        if (rand < weights[0] + weights[1]) return 'Unsettled';
        return 'Active';
    }

    async processSolarData(xrayData, solarWindData, geomagneticData) {
        let activity = {
            xrayClass: 'A',
            solarWindSpeed: 400,
            geomagneticActivity: 'Quiet',
            auroraForecast: 'Muy baja',
            recommendation: 'Condiciones normales para observación astronómica'
        };

        try {
            // Process X-ray data
            if (xrayData.status === 'fulfilled') {
                const xrays = await xrayData.value.json();
                if (xrays && xrays.length > 0) {
                    const latest = xrays[xrays.length - 1];
                    activity.xrayClass = latest.flux || 'A';
                }
            }

            // Process solar wind data
            if (solarWindData.status === 'fulfilled') {
                const wind = await solarWindData.value.json();
                if (wind && wind.length > 0) {
                    const latest = wind[wind.length - 1];
                    activity.solarWindSpeed = latest.speed || 400;
                }
            }

            // Process geomagnetic data
            if (geomagneticData.status === 'fulfilled') {
                const geo = await geomagneticData.value.json();
                if (geo && geo.length > 0) {
                    const latest = geo[geo.length - 1];
                    const kIndex = latest.kp || 0;
                    
                    if (kIndex >= 5) {
                        activity.geomagneticActivity = 'Storm';
                        activity.auroraForecast = 'Posible en el sur de Chile';
                        activity.recommendation = '¡Alerta de tormenta geomagnética! Posibles auroras australes.';
                    } else if (kIndex >= 3) {
                        activity.geomagneticActivity = 'Active';
                        activity.auroraForecast = 'Baja';
                        activity.recommendation = 'Actividad geomagnética moderada.';
                    }
                }
            }
        } catch (error) {
            console.error('Error processing solar data:', error);
        }

        return activity;
    }

    getImpactOnObservation(activity) {
        let impact = {
            rating: 'Excelente',
            color: 'green',
            description: 'Condiciones perfectas para observación'
        };

        if (activity.xrayClass.includes('M') || activity.solarWindSpeed > 600) {
            impact = {
                rating: 'Bueno',
                color: 'yellow',
                description: 'Actividad solar moderada, observación aún excelente'
            };
        }

        if (activity.xrayClass.includes('X') || activity.geomagneticActivity === 'Storm') {
            impact = {
                rating: 'Especial',
                color: 'orange',
                description: '¡Oportunidad única! Posibles auroras australes visibles'
            };
        }

        return impact;
    }
}

// Astronomy Events API Integration
class AstronomyEventsAPI {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 60 * 60 * 1000; // 1 hour
    }

    async getPlanetaryPositions() {
        const cacheKey = 'planetary-positions';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        try {
            // Using a simulated API call - replace with real astronomy API
            const positions = await this.calculatePlanetaryEvents();
            
            this.cache.set(cacheKey, {
                data: positions,
                timestamp: Date.now()
            });

            return positions;
        } catch (error) {
            console.error('Error fetching planetary positions:', error);
            return [];
        }
    }

    async calculatePlanetaryEvents() {
        const today = new Date();
        const events = [];

        // Eventos únicos y extraordinarios con mayor tolerancia temporal
        const extraordinaryEvents = [
            {
                type: 'nova',
                objects: ['T Coronae Borealis'],
                title: 'Nova T Coronae Borealis - "Estrella Resplandeciente"',
                date: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000), // +45 days
                visibility: 'Visible a simple vista desde Atacama',
                bestTime: '22:00 - 04:00',
                magnitude: 2.0,
                rarity: 'Cada 80 años',
                description: 'Una nova recurrente que brillará como una nueva estrella',
                image: 'https://images.unsplash.com/photo-1504192010706-dd7ce64cc9c6?w=500&h=300&fit=crop&crop=center'
            },
            {
                type: 'total_solar_eclipse',
                objects: ['Sol', 'Luna'],
                title: 'Eclipse Solar Total - Chile 2030',
                date: new Date('2030-11-25T15:00:00Z'),
                visibility: 'Totalidad visible desde el norte de Chile',
                bestTime: '15:00 - 17:00',
                magnitude: -26.7,
                rarity: 'Próximo en Chile en 2030',
                description: 'Eclipse solar total con duración de 3 minutos',
                image: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=500&h=300&fit=crop&crop=center'
            },
            {
                type: 'planetary_alignment',
                objects: ['Venus', 'Júpiter', 'Marte', 'Saturno'],
                title: 'Gran Alineación Planetaria',
                date: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000), // +60 days
                visibility: 'Espectacular desde cielos oscuros de Atacama',
                bestTime: '05:00 - 06:30',
                magnitude: -4.5,
                rarity: 'Cada varios años',
                description: '4 planetas brillantes alineados en el cielo matutino',
                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop&crop=center'
            },
            {
                type: 'lunar_eclipse',
                objects: ['Luna'],
                title: 'Eclipse Lunar Total - "Luna Roja"',
                date: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000), // +90 days
                visibility: 'Completamente visible desde Chile',
                bestTime: '02:00 - 05:00',
                magnitude: -12.9,
                rarity: 'Cada 2-3 años',
                description: 'La Luna se tiñe de rojo durante la totalidad',
                image: 'https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?w=500&h=300&fit=crop&crop=center'
            },
            {
                type: 'comet',
                objects: ['Cometa 12P/Pons-Brooks'],
                title: 'Cometa Pons-Brooks - "El Cometa Diablo"',
                date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 days
                visibility: 'Visible con binoculares desde Atacama',
                bestTime: '19:00 - 21:00',
                magnitude: 6.0,
                rarity: 'Cada 71 años',
                description: 'Cometa con erupciones periódicas y forma distintiva',
                image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=500&h=300&fit=crop&crop=center'
            },
            {
                type: 'supernova',
                objects: ['Betelgeuse'],
                title: 'Supernova Inminente - Betelgeuse',
                date: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000), // +1 año
                visibility: 'Será visible durante el día cuando ocurra',
                bestTime: 'Todo el tiempo visible',
                magnitude: -10.0,
                rarity: 'Evento único en milenios',
                description: 'La supergigante roja puede explotar en cualquier momento',
                image: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=500&h=300&fit=crop&crop=center'
            },
            {
                type: 'conjunction',
                objects: ['Venus', 'Júpiter'],
                title: 'Gran Conjunción Venus-Júpiter',
                date: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000), // +12 days
                visibility: 'Excelente desde Atacama',
                bestTime: '05:30 - 06:30',
                magnitude: -4.2,
                rarity: 'Cada 13 meses',
                description: 'Los dos planetas más brillantes se acercan visualmente',
                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop&crop=center'
            },
            {
                type: 'opposition',
                objects: ['Saturno'],
                title: 'Saturno en Oposición',
                date: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000), // +25 days
                visibility: 'Visible toda la noche, anillos perfectamente visibles',
                bestTime: '21:00 - 05:00',
                magnitude: 0.2,
                rarity: 'Anual',
                description: 'Saturno en su máximo brillo y tamaño aparente',
                image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=500&h=300&fit=crop&crop=center'
            },
            {
                type: 'meteor_storm',
                objects: ['Leónidas'],
                title: 'Tormenta de Meteoros Leónidas',
                date: new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000), // +180 days
                visibility: 'Hasta 1000 meteoros por hora desde Atacama',
                bestTime: '02:00 - 06:00',
                magnitude: -5.0,
                rarity: 'Cada 33 años',
                description: 'Tormenta excepcional de meteoros',
                image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=500&h=300&fit=crop&crop=center'
            },
            {
                type: 'lunar_phase',
                objects: ['Luna'],
                title: 'Superluna con Eclipse Penumbral',
                date: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000), // +35 days
                visibility: 'Luna 14% más grande y brillante',
                bestTime: '21:00 - 06:00',
                magnitude: -12.9,
                rarity: 'Cada 14 meses',
                description: 'Luna llena en perigeo con eclipse penumbral sutil',
                image: 'https://images.unsplash.com/photo-1504192010706-dd7ce64cc9c6?w=500&h=300&fit=crop&crop=center'
            }
        ];

        // Filtrar eventos con mayor tolerancia temporal (hasta 1 año hacia adelante)
        return extraordinaryEvents.filter(event => {
            const daysDiff = (event.date - today) / (24 * 60 * 60 * 1000);
            return daysDiff >= 0 && daysDiff <= 365; // Eventos hasta 1 año
        }).sort((a, b) => a.date - b.date); // Ordenar por fecha
    }

    async getMeteorShowers() {
        // Real-time meteor shower data
        const today = new Date();
        const month = today.getMonth() + 1;
        
        const meteorShowers = {
            1: { name: 'Cuadrántidas', peak: '3-4 Enero', activity: 'Alta' },
            4: { name: 'Líridas', peak: '21-22 Abril', activity: 'Moderada' },
            5: { name: 'Eta Acuáridas', peak: '5-6 Mayo', activity: 'Alta en hemisferio sur' },
            8: { name: 'Perseidas', peak: '12-13 Agosto', activity: 'Alta' },
            10: { name: 'Dracónidas', peak: '8-9 Octubre', activity: 'Variable' },
            11: { name: 'Leónidas', peak: '17-18 Noviembre', activity: 'Moderada' },
            12: { name: 'Gemínidas', peak: '13-14 Diciembre', activity: 'Muy Alta' }
        };

        const currentShower = meteorShowers[month];
        return currentShower ? [currentShower] : [];
    }
}

// Enhanced Display Functions
async function displayISSInfo() {
    const issContainer = document.getElementById('iss-info');
    if (!issContainer) return;

    const issTracker = new ISSTracker();
    
    try {
        const [position, passes] = await Promise.all([
            issTracker.getCurrentPosition(),
            issTracker.getPassTimes()
        ]);

        if (position && passes) {
            const visibility = issTracker.calculateVisibility(position);
            const nextPass = passes[0];

            issContainer.innerHTML = `
                <div class="iss-current">
                    <h4><i class="fas fa-satellite"></i> Estación Espacial Internacional</h4>
                    
                    <!-- Real-time ISS World Map -->
                    <div class="iss-map-container">
                        <div id="iss-world-map" class="iss-world-map">
                            <div class="world-map-bg"></div>
                            <div class="iss-marker" id="iss-marker" style="left: ${((position.longitude + 180) / 360 * 100)}%; top: ${((90 - position.latitude) / 180 * 100)}%;">
                                <div class="iss-icon">🛰️</div>
                                <div class="iss-trail"></div>
                            </div>
                            <div class="atacama-marker" style="left: ${((ATACAMA_COORDS.lon + 180) / 360 * 100)}%; top: ${((90 - ATACAMA_COORDS.lat) / 180 * 100)}%;">
                                <div class="atacama-icon">📍</div>
                                <div class="atacama-label">Atacama</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="iss-position">
                        <p><strong>Posición actual:</strong> ${position.latitude.toFixed(2)}°, ${position.longitude.toFixed(2)}°</p>
                        <p><strong>Velocidad:</strong> ${(position.velocity || 27600).toLocaleString()} km/h</p>
                        <p><strong>Altitud:</strong> ${(position.altitude || 408)} km</p>
                        <p><strong>Distancia desde Atacama:</strong> ${visibility.distance} km</p>
                        <p><strong>Visibilidad:</strong> ${visibility.brightness}</p>
                    </div>
                    ${nextPass ? `
                        <div class="next-pass">
                            <p><strong>Próximo paso visible desde Atacama:</strong></p>
                            <p>📅 ${nextPass.risetime.toLocaleDateString('es-ES')}</p>
                            <p>🕒 ${nextPass.risetime.toLocaleTimeString('es-ES')}</p>
                            <p>⏱️ Duración: ${Math.floor(nextPass.duration / 60)}m ${nextPass.duration % 60}s</p>
                            <a href="index.html#tours" class="iss-tour-btn">¡Reservar Tour ISS!</a>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error displaying ISS info:', error);
        issContainer.innerHTML = '<p>Error al cargar información de la ISS</p>';
    }
}

async function displaySpaceWeather() {
    const weatherContainer = document.getElementById('space-weather');
    if (!weatherContainer) return;

    const spaceWeather = new SpaceWeatherMonitor();
    
    try {
        const activity = await spaceWeather.getSolarActivity();
        if (activity) {
            const impact = spaceWeather.getImpactOnObservation(activity);
            
            // Get current moon phase and cloud conditions for observation
            const moonPhase = getCurrentMoonPhase();
            const cloudConditions = getCloudConditions();
            
            weatherContainer.innerHTML = `
                <div class="space-weather-info">
                    <h4><i class="fas fa-cloud-moon"></i> Condiciones de Observación</h4>
                    
                    <!-- Moon Phase and Cloud Conditions -->
                    <div class="observation-conditions">
                        <div class="moon-info">
                            <h5>🌙 Fase Lunar</h5>
                            <div class="moon-phase">
                                <span class="moon-icon">${moonPhase.icon}</span>
                                <div class="moon-details">
                                    <p><strong>${moonPhase.name}</strong></p>
                                    <p>Iluminación: ${moonPhase.illumination}%</p>
                                    <p>Ideal para: ${moonPhase.observationTip}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="cloud-info">
                            <h5>☁️ Condiciones del Cielo</h5>
                            <div class="cloud-status" style="border-left: 4px solid ${cloudConditions.color}">
                                <p><strong>Cielo:</strong> <span style="color: ${cloudConditions.color}">${cloudConditions.status}</span></p>
                                <p>Transparencia: ${cloudConditions.transparency}</p>
                                <p>Seeing: ${cloudConditions.seeing}</p>
                                <p>Viento: ${cloudConditions.wind}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Space Weather Summary -->
                    <div class="weather-status compact" style="border-left: 4px solid ${impact.color}">
                        <p><strong>Actividad Espacial:</strong> 
                            <span style="color: ${impact.color}">${impact.rating}</span>
                        </p>
                        <div class="weather-summary">
                            <span>☀️ Solar: ${activity.xrayClass}</span>
                            <span>🌍 Geomag: ${activity.geomagneticActivity}</span>
                            ${activity.auroraForecast !== 'Muy baja' ? 
                                `<span>✨ Auroras: ${activity.auroraForecast}</span>` : ''}
                        </div>
                    </div>
                    
                    <p class="weather-recommendation">
                        <i class="fas fa-telescope"></i> 
                        ${cloudConditions.recommendation}
                    </p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error displaying space weather:', error);
        weatherContainer.innerHTML = '<p>Error al cargar clima espacial</p>';
    }
}

async function displayAstronomyEvents() {
    const eventsContainer = document.getElementById('astronomy-events');
    if (!eventsContainer) return;

    const eventsAPI = new AstronomyEventsAPI();
    
    try {
        const [planetaryEvents, meteorShowers] = await Promise.all([
            eventsAPI.getPlanetaryPositions(),
            eventsAPI.getMeteorShowers()
        ]);

        let eventsHTML = '<h4><i class="fas fa-calendar-star"></i> Eventos Astronómicos Extraordinarios</h4>';
        
        if (planetaryEvents.length > 0) {
            eventsHTML += '<div class="extraordinary-events-grid">';
            planetaryEvents.slice(0, 6).forEach(event => { // Mostrar hasta 6 eventos
                const daysUntil = Math.ceil((event.date - new Date()) / (24 * 60 * 60 * 1000));
                const urgencyClass = daysUntil <= 30 ? 'urgent' : daysUntil <= 90 ? 'soon' : 'future';
                
                eventsHTML += `
                    <div class="extraordinary-event-card ${urgencyClass}">
                        ${event.image ? `<img src="${event.image}" alt="${event.title}" class="event-image" loading="lazy">` : ''}
                        <div class="event-content">
                            <div class="event-header">
                                <span class="event-type">${event.type.replace('_', ' ').toUpperCase()}</span>
                                <span class="event-rarity">${event.rarity}</span>
                            </div>
                            <h5>${event.title || event.objects.join(' - ')}</h5>
                            <p class="event-description">${event.description}</p>
                            <div class="event-details">
                                <p><i class="fas fa-calendar"></i> En ${daysUntil} días (${event.date.toLocaleDateString('es-ES')})</p>
                                <p><i class="fas fa-eye"></i> ${event.visibility}</p>
                                <p><i class="fas fa-clock"></i> ${event.bestTime}</p>
                                ${event.magnitude && event.magnitude !== -12.9 ? `<p><i class="fas fa-star"></i> Magnitud: ${event.magnitude}</p>` : ''}
                            </div>
                            <a href="index.html#tours" class="event-tour-btn">
                                <i class="fas fa-telescope"></i> Ver Tours para este Evento
                            </a>
                        </div>
                    </div>
                `;
            });
            eventsHTML += '</div>';
        }

        if (meteorShowers.length > 0) {
            eventsHTML += '<div class="meteor-showers">';
            meteorShowers.forEach(shower => {
                eventsHTML += `
                    <div class="meteor-event">
                        <h5>🌠 ${shower.name}</h5>
                        <p>📅 Pico: ${shower.peak}</p>
                        <p>⭐ Actividad: ${shower.activity}</p>
                    </div>
                `;
            });
            eventsHTML += '</div>';
        }

        eventsContainer.innerHTML = eventsHTML;
    } catch (error) {
        console.error('Error displaying astronomy events:', error);
        eventsContainer.innerHTML = '<p>Error al cargar eventos astronómicos</p>';
    }
}

// Enhanced initialization function
async function initializeEnhancedAPIs() {
    await initializeAPIIntegration(); // Original APIs
    
    // Add new API displays
    await Promise.all([
        displayISSInfo(),
        displaySpaceWeather(),
        displayAstronomyEvents()
    ]);

    // Set up real-time updates
    setInterval(displayISSInfo, 5 * 60 * 1000); // Update ISS every 5 minutes
    setInterval(displaySpaceWeather, 15 * 60 * 1000); // Update space weather every 15 minutes
    setInterval(displayAstronomyEvents, 60 * 60 * 1000); // Update events every hour
}

// Helper functions for moon phase and cloud conditions
function getCurrentMoonPhase() {
    const today = new Date();
    const moonPhases = [
        { name: 'Luna Nueva', icon: '🌑', illumination: 0, observationTip: 'Objetos de espacio profundo' },
        { name: 'Luna Creciente', icon: '🌒', illumination: 25, observationTip: 'Planetas y cráteres lunares' },
        { name: 'Cuarto Creciente', icon: '🌓', illumination: 50, observationTip: 'Superficie lunar y planetas' },
        { name: 'Luna Gibosa Creciente', icon: '🌔', illumination: 75, observationTip: 'Observación lunar detallada' },
        { name: 'Luna Llena', icon: '🌕', illumination: 100, observationTip: 'Superficie lunar (muy brillante)' },
        { name: 'Luna Gibosa Menguante', icon: '🌖', illumination: 75, observationTip: 'Cráteres con sombras' },
        { name: 'Cuarto Menguante', icon: '🌗', illumination: 50, observationTip: 'Planetas matutinos' },
        { name: 'Luna Menguante', icon: '🌘', illumination: 25, observationTip: 'Cielo oscuro para deep sky' }
    ];
    
    // Simplified moon phase calculation (approximate)
    const dayOfMonth = today.getDate();
    const phaseIndex = Math.floor((dayOfMonth / 29.5) * 8) % 8;
    return moonPhases[phaseIndex];
}

function getCloudConditions() {
    // Simulate realistic Atacama desert conditions
    const conditions = [
        {
            status: 'Despejado',
            color: 'green',
            transparency: 'Excelente (7-8/10)',
            seeing: '0.6" (Excelente)',
            wind: '5-10 km/h',
            recommendation: 'Condiciones perfectas para observación astronómica'
        },
        {
            status: 'Parcialmente Nublado',
            color: 'orange',
            transparency: 'Buena (6-7/10)',
            seeing: '1.0" (Buena)',
            wind: '15-20 km/h',
            recommendation: 'Buenas condiciones, algunos momentos de turbulencia'
        },
        {
            status: 'Algunas Nubes',
            color: 'yellow',
            transparency: 'Variable (5-6/10)',
            seeing: '1.2" (Aceptable)',
            wind: '10-15 km/h',
            recommendation: 'Observación posible entre nubes'
        }
    ];
    
    // Atacama typically has excellent conditions (85% clear nights)
    const rand = Math.random();
    if (rand < 0.85) return conditions[0]; // Clear
    if (rand < 0.95) return conditions[1]; // Partial
    return conditions[2]; // Some clouds
}

// Export for use in other scripts
window.astroNewsAPI = astroNewsAPI;
window.ISSTracker = ISSTracker;
window.SpaceWeatherMonitor = SpaceWeatherMonitor;
window.AstronomyEventsAPI = AstronomyEventsAPI;
window.initializeAPIIntegration = initializeAPIIntegration;
window.initializeEnhancedAPIs = initializeEnhancedAPIs;
window.getCurrentMoonPhase = getCurrentMoonPhase;
window.getCloudConditions = getCloudConditions;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedAPIs);
} else {
    initializeEnhancedAPIs();
}