/**
 * Astronomical Integration System
 * Main controller for all astronomical features
 */

class AstronomicalIntegration {
    constructor() {
        this.newsSystem = null;
        this.eventsManager = null;
        this.fontAwesomeLoader = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('🚀 Initializing Astronomical Integration System...');

            // Initialize Font Awesome first
            this.fontAwesomeLoader = new FontAwesomeLoader();
            await this.fontAwesomeLoader.initialize();

            // Initialize News System
            this.newsSystem = new AstronomicalNewsSystem();
            await this.newsSystem.initialize();

            // Initialize Events Manager
            this.eventsManager = new AstronomicalEventsManager();
            await this.eventsManager.initialize();

            // Setup UI interactions
            this.setupEventListeners();

            // Update all displays
            await this.updateAllDisplays();

            this.initialized = true;
            console.log('✅ Astronomical Integration System initialized successfully');

        } catch (error) {
            console.error('❌ Error initializing Astronomical Integration:', error);
            this.showErrorMessage('Error al inicializar el sistema astronómico');
        }
    }

    async updateAllDisplays() {
        try {
            // Update current event status
            await this.updateCurrentEvent();

            // Update next major event
            await this.updateNextEvent();

            // Update today's events
            await this.updateTodaysEvents();

            // Update moon phase
            await this.updateMoonPhase();

            // Update observatories
            await this.updateObservatories();

            // Update 3I-Atlas data
            await this.updateAtlasData();

            // Update news
            await this.updateNews();

        } catch (error) {
            console.error('Error updating displays:', error);
        }
    }

    async updateCurrentEvent() {
        const currentEventElement = document.getElementById('current-event');
        if (!currentEventElement) return;

        try {
            const currentEvent = this.eventsManager.getCurrentEvent();
            if (currentEvent) {
                currentEventElement.innerHTML = `
                    <i class="fas fa-${this.getEventIcon(currentEvent.type)}"></i>
                    <strong>${currentEvent.title}</strong> - ${currentEvent.description}
                `;
                currentEventElement.style.background = 'rgba(0, 212, 255, 0.1)';
                currentEventElement.style.borderColor = '#00d4ff';
            } else {
                currentEventElement.innerHTML = `
                    <i class="fas fa-moon"></i>
                    Cielo despejado - Condiciones óptimas para observación
                `;
                currentEventElement.style.background = 'rgba(46, 204, 113, 0.1)';
                currentEventElement.style.borderColor = '#2ecc71';
            }
        } catch (error) {
            console.error('Error updating current event:', error);
        }
    }

    async updateNextEvent() {
        const nextEventElement = document.getElementById('next-event');
        if (!nextEventElement) return;

        try {
            const nextEvent = this.eventsManager.getNextMajorEvent();
            if (nextEvent) {
                const daysUntil = Math.ceil((nextEvent.date - new Date()) / (1000 * 60 * 60 * 24));
                nextEventElement.innerHTML = `
                    <i class="fas fa-calendar-star"></i>
                    <strong>Próximo:</strong> ${nextEvent.title} en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}
                `;
            } else {
                nextEventElement.innerHTML = `
                    <i class="fas fa-calendar-star"></i>
                    No hay eventos mayores programados próximamente
                `;
            }
        } catch (error) {
            console.error('Error updating next event:', error);
        }
    }

    async updateTodaysEvents() {
        const todaysEventsElement = document.getElementById('todays-events-list');
        if (!todaysEventsElement) return;

        try {
            const todaysEvents = this.eventsManager.getTodaysEvents();
            if (todaysEvents && todaysEvents.length > 0) {
                todaysEventsElement.innerHTML = todaysEvents.map(event => `
                    <div class="event-status" style="margin-bottom: 10px; background: rgba(52, 152, 219, 0.1); border-color: #3498db;">
                        <i class="fas fa-${this.getEventIcon(event.type)}"></i>
                        <strong>${event.title}</strong> - ${event.description}
                    </div>
                `).join('');
            } else {
                todaysEventsElement.innerHTML = `
                    <div class="event-status" style="background: rgba(149, 165, 166, 0.1); border-color: #95a5a6;">
                        <i class="fas fa-check-circle"></i>
                        No hay eventos astronómicos especiales hoy
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error updating today\'s events:', error);
        }
    }

    async updateMoonPhase() {
        const moonPhaseElement = document.getElementById('moon-phase');
        if (!moonPhaseElement) return;

        try {
            const moonPhase = this.eventsManager.getCurrentMoonPhase();
            moonPhaseElement.textContent = moonPhase.phase;
        } catch (error) {
            console.error('Error updating moon phase:', error);
        }
    }

    async updateObservatories() {
        const observatoriesGrid = document.getElementById('observatories-grid');
        if (!observatoriesGrid) return;

        try {
            const observatories = await this.newsSystem.loadObservatoriesData();
            if (observatories && observatories.length > 0) {
                observatoriesGrid.innerHTML = observatories.map(obs => `
                    <div class="observatory-card">
                        <div class="observatory-image">
                            <img src="${obs.image || 'images/telescope-placeholder.jpg'}" alt="${obs.name}" onerror="this.src='images/telescope-placeholder.jpg'">
                        </div>
                        <div class="observatory-info">
                            <h3>${obs.name}</h3>
                            <p class="observatory-location"><i class="fas fa-map-marker-alt"></i> ${obs.location}</p>
                            <p class="observatory-description">${obs.description}</p>
                            <div class="observatory-details">
                                <span class="detail-item"><i class="fas fa-mountain"></i> ${obs.altitude}m</span>
                                <span class="detail-item"><i class="fas fa-telescope"></i> ${obs.telescopes || 'Múltiple'}</span>
                            </div>
                            <a href="${obs.website}" target="_blank" class="observatory-link">
                                <i class="fas fa-external-link-alt"></i> Visitar Sitio Web
                            </a>
                        </div>
                    </div>
                `).join('');

                // Update stats
                this.updateObservatoryStats(observatories);
            }
        } catch (error) {
            console.error('Error updating observatories:', error);
            observatoriesGrid.innerHTML = `
                <div class="observatory-card">
                    <div class="observatory-image">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="observatory-info">
                        <h3>Error al cargar observatorios</h3>
                        <p>Inténtalo de nuevo más tarde</p>
                    </div>
                </div>
            `;
        }
    }

    updateObservatoryStats(observatories) {
        const totalObs = document.getElementById('total-observatories');
        const totalTel = document.getElementById('total-telescopes');
        const avgAlt = document.getElementById('total-altitude');

        if (totalObs) totalObs.textContent = observatories.length;
        if (totalTel) totalTel.textContent = observatories.reduce((sum, obs) => sum + (obs.telescopes || 1), 0);
        if (avgAlt) {
            const avg = Math.round(observatories.reduce((sum, obs) => sum + obs.altitude, 0) / observatories.length);
            avgAlt.textContent = `${avg}m`;
        }
    }

    async updateAtlasData() {
        try {
            // Update galaxies mapped
            const galaxiesElement = document.getElementById('galaxies-mapped');
            if (galaxiesElement) {
                galaxiesElement.textContent = '85M+';
            }

            // Update survey progress
            const progressElement = document.getElementById('survey-progress');
            if (progressElement) {
                progressElement.textContent = '85%';
            }

            // Update data volume
            const dataElement = document.getElementById('data-volume');
            if (dataElement) {
                dataElement.textContent = '2.1 PB';
            }

            // Update discoveries
            const discoveriesElement = document.getElementById('atlas-discoveries');
            if (discoveriesElement) {
                discoveriesElement.innerHTML = `
                    <div class="discovery-item">
                        <i class="fas fa-star"></i>
                        <span>Descubrimiento de galaxias ultra-difusas</span>
                    </div>
                    <div class="discovery-item">
                        <i class="fas fa-atom"></i>
                        <span>Mapeo de distribución de materia oscura</span>
                    </div>
                    <div class="discovery-item">
                        <i class="fas fa-galactic-republic"></i>
                        <span>Análisis de evolución galáctica a gran escala</span>
                    </div>
                `;
            }

            // Update live data stream
            const liveDataElement = document.getElementById('live-data-stream');
            if (liveDataElement) {
                liveDataElement.innerHTML = `
                    <div class="data-stream-item">
                        <i class="fas fa-satellite"></i>
                        <span>VISTA operativo - Capturando imágenes infrarrojas</span>
                    </div>
                    <div class="data-stream-item">
                        <i class="fas fa-database"></i>
                        <span>Procesando 2.1 petabytes de datos astronómicos</span>
                    </div>
                    <div class="data-stream-item">
                        <i class="fas fa-chart-line"></i>
                        <span>85% del survey completado - 15% restante en proceso</span>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error updating Atlas data:', error);
        }
    }

    async updateNews() {
        try {
            const featuredNews = document.getElementById('featured-news');
            const newsGrid = document.getElementById('news-grid');

            if (featuredNews) {
                const featured = await this.newsSystem.loadFeaturedNews();
                if (featured) {
                    featuredNews.innerHTML = `
                        <div class="featured-card">
                            <div class="featured-image">
                                <img src="${featured.image}" alt="${featured.title}" onerror="this.src='images/news-placeholder.jpg'">
                            </div>
                            <div class="featured-content">
                                <h3>${featured.title}</h3>
                                <p>${featured.summary}</p>
                                <div class="news-meta">
                                    <span><i class="fas fa-calendar"></i> ${new Date(featured.publishedAt).toLocaleDateString()}</span>
                                    <span><i class="fas fa-newspaper"></i> ${featured.source}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }

            if (newsGrid) {
                const news = await this.newsSystem.loadSpaceNews();
                if (news && news.length > 0) {
                    newsGrid.innerHTML = news.slice(0, 6).map(item => `
                        <div class="news-card">
                            <div class="news-image">
                                <img src="${item.image || 'images/news-placeholder.jpg'}" alt="${item.title}" onerror="this.src='images/news-placeholder.jpg'">
                            </div>
                            <div class="news-content">
                                <h4>${item.title}</h4>
                                <p>${item.summary}</p>
                                <div class="news-meta">
                                    <span><i class="fas fa-calendar"></i> ${new Date(item.publishedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Error updating news:', error);
        }
    }

    setupEventListeners() {
        // News filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.filterNews(e.target.dataset.filter);
            });
        });

        // Load more news button
        const loadMoreBtn = document.getElementById('load-more-news');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreNews();
            });
        }

        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    async filterNews(filter) {
        // Implementation for news filtering
        console.log('Filtering news by:', filter);
        // This would filter the news based on category
    }

    async loadMoreNews() {
        const loadMoreBtn = document.getElementById('load-more-news');
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
            loadMoreBtn.disabled = true;

            // Simulate loading more news
            setTimeout(() => {
                loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Cargar Más Noticias';
                loadMoreBtn.disabled = false;
                // Here you would actually load more news
            }, 2000);
        }
    }

    getEventIcon(type) {
        const icons = {
            'meteor': 'meteor',
            'eclipse': 'sun',
            'conjunction': 'star',
            'moon': 'moon',
            'planet': 'globe',
            'default': 'star'
        };
        return icons[type] || icons.default;
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.astronomicalIntegration = new AstronomicalIntegration();
    window.astronomicalIntegration.initialize();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AstronomicalIntegration;
}