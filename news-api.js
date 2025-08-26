// news-api.js - API Integration for Astronomical News

// Configuration
const API_CONFIG = {
    NASA_API_KEY: '1gPAcDBilTktC9mIIyZNEhidrFHZJYgbQa5YMR94',
    SPACEFLIGHT_NEWS_API: 'https://api.spaceflightnewsapi.net/v4',
    ARXIV_API: 'https://export.arxiv.org/api/query',
    NASA_APOD_API: 'https://api.nasa.gov/planetary/apod',
    ISS_API: 'http://api.open-notify.org',
    SPACE_WEATHER_API: 'https://services.swpc.noaa.gov/json',
    ASTRONOMY_API: 'https://api.astronomyapi.com/api/v2'
};

// Atacama coordinates for location-specific data
const ATACAMA_COORDS = {
    lat: -22.9087,
    lon: -68.1997,
    elevation: 2400
};

// News API Integration Class
class AstronomicalNewsAPI {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
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
                events: item.events || []
            }));

            this.saveToCache(cacheKey, formattedNews);
            return formattedNews;
        } catch (error) {
            console.error('Error fetching Spaceflight News:', error);
            return [];
        }
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
                thumbnail_url: data.thumbnail_url || data.url
            };

            this.saveToCache(cacheKey, formattedApod);
            return formattedApod;
        } catch (error) {
            console.error('Error fetching NASA APOD:', error);
            return null;
        }
    }

    // Fetch latest astronomy papers from arXiv
    async fetchArxivPapers(category = 'astro-ph', maxResults = 10) {
        const cacheKey = `arxiv-${category}-${maxResults}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const query = `search_query=cat:${category}&sortBy=submittedDate&sortOrder=descending&max_results=${maxResults}`;
            const response = await fetch(`${API_CONFIG.ARXIV_API}?${query}`);
            
            if (!response.ok) throw new Error('Failed to fetch arXiv papers');
            
            const text = await response.text();
            const papers = this.parseArxivXML(text);
            
            this.saveToCache(cacheKey, papers);
            return papers;
        } catch (error) {
            console.error('Error fetching arXiv papers:', error);
            return [];
        }
    }

    // Parse arXiv XML response
    parseArxivXML(xmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const entries = xmlDoc.getElementsByTagName('entry');
        const papers = [];

        for (let entry of entries) {
            try {
                const getTextContent = (tagName) => {
                    const element = entry.getElementsByTagName(tagName)[0];
                    return element ? element.textContent : '';
                };

                const getAuthors = () => {
                    const authors = entry.getElementsByTagName('author');
                    return Array.from(authors).map(author => 
                        author.getElementsByTagName('name')[0]?.textContent || ''
                    ).filter(name => name);
                };

                const id = getTextContent('id');
                const arxivId = id ? id.split('/abs/')[1] : '';

                papers.push({
                    id: `arxiv-${arxivId}`,
                    arxiv_id: arxivId,
                    title: getTextContent('title').replace(/\n/g, ' ').trim(),
                    summary: getTextContent('summary').replace(/\n/g, ' ').trim(),
                    authors: getAuthors(),
                    published: getTextContent('published'),
                    updated: getTextContent('updated'),
                    pdf_url: id ? id.replace('/abs/', '/pdf/') + '.pdf' : '',
                    abs_url: id,
                    category: getTextContent('arxiv:primary_category')
                });
            } catch (e) {
                console.error('Error parsing arXiv entry:', e);
            }
        }

        return papers;
    }

    // Categorize news based on keywords
    categorizeNews(item) {
        const title = (item.title || '').toLowerCase();
        const summary = (item.summary || '').toLowerCase();
        const combined = title + ' ' + summary;

        if (combined.includes('meteor') || combined.includes('perseids') || combined.includes('geminids')) {
            return 'meteors';
        } else if (combined.includes('discover') || combined.includes('found') || combined.includes('detect')) {
            return 'discoveries';
        } else if (combined.includes('launch') || combined.includes('mission') || combined.includes('rocket')) {
            return 'missions';
        } else if (combined.includes('planet') || combined.includes('conjunc') || combined.includes('eclipse')) {
            return 'events';
        } else {
            return 'general';
        }
    }

    // Combine all news sources
    async fetchAllNews() {
        try {
            const [spaceflightNews, apod, arxivPapers] = await Promise.allSettled([
                this.fetchSpaceflightNews(15),
                this.fetchNASAApod(),
                this.fetchArxivPapers('astro-ph', 10)
            ]);

            const allNews = {
                spaceflight: spaceflightNews.status === 'fulfilled' ? spaceflightNews.value : [],
                apod: apod.status === 'fulfilled' ? apod.value : null,
                papers: arxivPapers.status === 'fulfilled' ? arxivPapers.value : [],
                timestamp: new Date().toISOString()
            };

            return allNews;
        } catch (error) {
            console.error('Error fetching all news:', error);
            return {
                spaceflight: [],
                apod: null,
                papers: [],
                timestamp: new Date().toISOString()
            };
        }
    }
}

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
            const response = await fetch(`${API_CONFIG.ISS_API}/iss-now.json`);
            const data = await response.json();
            
            const position = {
                timestamp: data.timestamp,
                latitude: parseFloat(data.iss_position.latitude),
                longitude: parseFloat(data.iss_position.longitude),
                velocity: 27600, // km/h approximate
                altitude: 408 // km approximate
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
                `${API_CONFIG.ISS_API}/iss-pass.json?lat=${ATACAMA_COORDS.lat}&lon=${ATACAMA_COORDS.lon}&n=5`
            );
            const data = await response.json();
            
            const passes = data.response.map(pass => ({
                risetime: new Date(pass.risetime * 1000),
                duration: pass.duration,
                magnitude: -3.9, // ISS typical brightness
                direction: 'Variable'
            }));

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
            const [xrayData, solarWindData, geomagneticData] = await Promise.allSettled([
                fetch(`${API_CONFIG.SPACE_WEATHER_API}/goes/primary/xrays-6-hour.json`),
                fetch(`${API_CONFIG.SPACE_WEATHER_API}/solar-wind/mag-7-day.json`),
                fetch(`${API_CONFIG.SPACE_WEATHER_API}/planetary_k_index_1m.json`)
            ]);

            const activity = await this.processSolarData(xrayData, solarWindData, geomagneticData);
            
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

        // Simulated upcoming astronomical events for Atacama
        const upcomingEvents = [
            {
                type: 'conjunction',
                objects: ['Venus', 'Júpiter'],
                date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
                visibility: 'Excelente desde Atacama',
                bestTime: '05:30 - 06:30',
                magnitude: -4.2
            },
            {
                type: 'opposition',
                objects: ['Saturno'],
                date: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // +15 days
                visibility: 'Visible toda la noche',
                bestTime: '21:00 - 05:00',
                magnitude: 0.2
            },
            {
                type: 'lunar_phase',
                objects: ['Luna'],
                phase: 'Luna Nueva',
                date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days
                visibility: 'Perfecta para deep sky',
                bestTime: 'Toda la noche'
            }
        ];

        return upcomingEvents.filter(event => event.date > today);
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
                    <div class="iss-position">
                        <p><strong>Posición actual:</strong> ${position.latitude.toFixed(2)}°, ${position.longitude.toFixed(2)}°</p>
                        <p><strong>Distancia desde Atacama:</strong> ${visibility.distance} km</p>
                        <p><strong>Estado:</strong> ${visibility.brightness}</p>
                    </div>
                    ${nextPass ? `
                        <div class="next-pass">
                            <p><strong>Próximo paso visible:</strong></p>
                            <p>📅 ${nextPass.risetime.toLocaleDateString('es-ES')}</p>
                            <p>🕒 ${nextPass.risetime.toLocaleTimeString('es-ES')}</p>
                            <p>⏱️ Duración: ${Math.floor(nextPass.duration / 60)}m ${nextPass.duration % 60}s</p>
                            <a href="index.html#tours" class="iss-tour-btn">¡Observar con nosotros!</a>
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
            
            weatherContainer.innerHTML = `
                <div class="space-weather-info">
                    <h4><i class="fas fa-sun"></i> Clima Espacial</h4>
                    <div class="weather-status" style="border-left: 4px solid ${impact.color}">
                        <p><strong>Condiciones para observación:</strong> 
                            <span style="color: ${impact.color}">${impact.rating}</span>
                        </p>
                        <p>${impact.description}</p>
                        <div class="weather-details">
                            <p>☀️ Actividad solar: Clase ${activity.xrayClass}</p>
                            <p>🌪️ Viento solar: ${activity.solarWindSpeed} km/s</p>
                            <p>🌍 Actividad geomagnética: ${activity.geomagneticActivity}</p>
                            ${activity.auroraForecast !== 'Muy baja' ? 
                                `<p>✨ Auroras australes: ${activity.auroraForecast}</p>` : ''}
                        </div>
                    </div>
                    <p class="weather-recommendation">${activity.recommendation}</p>
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

        let eventsHTML = '<h4><i class="fas fa-calendar-star"></i> Próximos Eventos Astronómicos</h4>';
        
        if (planetaryEvents.length > 0) {
            eventsHTML += '<div class="planetary-events">';
            planetaryEvents.slice(0, 3).forEach(event => {
                const daysUntil = Math.ceil((event.date - new Date()) / (24 * 60 * 60 * 1000));
                eventsHTML += `
                    <div class="event-item">
                        <h5>${event.objects.join(' - ')} (${event.type})</h5>
                        <p>📅 En ${daysUntil} días (${event.date.toLocaleDateString('es-ES')})</p>
                        <p>🔍 ${event.visibility}</p>
                        <p>🕐 ${event.bestTime}</p>
                        ${event.magnitude ? `<p>✨ Magnitud: ${event.magnitude}</p>` : ''}
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

// Export for use in other scripts
window.astroNewsAPI = astroNewsAPI;
window.ISSTracker = ISSTracker;
window.SpaceWeatherMonitor = SpaceWeatherMonitor;
window.AstronomyEventsAPI = AstronomyEventsAPI;
window.initializeAPIIntegration = initializeAPIIntegration;
window.initializeEnhancedAPIs = initializeEnhancedAPIs;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedAPIs);
} else {
    initializeEnhancedAPIs();
}