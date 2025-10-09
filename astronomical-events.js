// Astronomical Events and Calendar System
class AstronomicalEventsManager {
    constructor() {
        this.events = [];
        this.currentDate = new Date();
        this.astronomicalCalendar = this.generateAstronomicalCalendar();
    }

    // Generate comprehensive astronomical calendar for 2025
    generateAstronomicalCalendar() {
        return [
            // Lunar Events
            { date: '2025-01-14', title: 'Luna Nueva', type: 'lunar', description: 'Fase lunar donde el Sol, Tierra y Luna están alineados', icon: '🌑' },
            { date: '2025-01-29', title: 'Luna Llena', type: 'lunar', description: 'Luna completamente iluminada por el Sol', icon: '🌕' },
            { date: '2025-02-12', title: 'Luna Nueva', type: 'lunar', description: 'Comienzo de nuevo ciclo lunar', icon: '🌑' },
            { date: '2025-02-27', title: 'Luna Llena', type: 'lunar', description: 'Luna de nieve - segunda luna llena del invierno', icon: '🌕' },
            { date: '2025-03-14', title: 'Luna Nueva', type: 'lunar', description: 'Luna nueva de marzo', icon: '🌑' },
            { date: '2025-03-29', title: 'Luna Llena', type: 'lunar', description: 'Luna de gusano - aparece cuando salen los gusanos', icon: '🌕' },

            // Seasonal Events
            { date: '2025-03-20', title: 'Equinoccio de Otoño (Sur)', type: 'seasonal', description: 'El Sol cruza el ecuador celeste hacia el sur', icon: '☀️' },
            { date: '2025-06-21', title: 'Solsticio de Invierno (Sur)', type: 'seasonal', description: 'Día más corto del año en el hemisferio sur', icon: '❄️' },
            { date: '2025-09-22', title: 'Equinoccio de Primavera (Sur)', type: 'seasonal', description: 'El Sol cruza el ecuador celeste hacia el norte', icon: '🌸' },
            { date: '2025-12-21', title: 'Solsticio de Verano (Sur)', type: 'seasonal', description: 'Día más largo del año en el hemisferio sur', icon: '☀️' },

            // Planetary Events
            { date: '2025-01-17', title: 'Conjunción Venus-Júpiter', type: 'planetary', description: 'Venus y Júpiter aparecen muy cerca en el cielo', icon: '⭐' },
            { date: '2025-03-14', title: 'Oposición de Marte', type: 'planetary', description: 'Marte en su punto más cercano a la Tierra', icon: '🔴' },
            { date: '2025-05-18', title: 'Conjunción Mercurio-Venus', type: 'planetary', description: 'Mercurio y Venus en conjunción cercana', icon: '💫' },
            { date: '2025-08-29', title: 'Oposición de Saturno', type: 'planetary', description: 'Saturno visible toda la noche', icon: '🪐' },

            // Meteor Showers
            { date: '2025-01-03', title: 'Cuadrántidas', type: 'meteor', description: 'Lluvia de meteoros con hasta 120 meteoros por hora', icon: '☄️' },
            { date: '2025-04-22', title: 'Líridas', type: 'meteor', description: 'Lluvia de meteoros de la constelación Lira', icon: '☄️' },
            { date: '2025-05-05', title: 'Eta Acuáridas', type: 'meteor', description: 'Lluvia de meteoros del cometa Halley', icon: '☄️' },
            { date: '2025-07-28', title: 'Delta Acuáridas', type: 'meteor', description: 'Lluvia de meteoros de la constelación Acuario', icon: '☄️' },
            { date: '2025-08-12', title: 'Perseidas', type: 'meteor', description: 'Las lágrimas de San Lorenzo - hasta 100 meteoros/hora', icon: '☄️' },
            { date: '2025-10-21', title: 'Oriónidas', type: 'meteor', description: 'Lluvia de meteoros de la constelación Orión', icon: '☄️' },
            { date: '2025-11-17', title: 'Leónidas', type: 'meteor', description: 'Lluvia de meteoros de la constelación Leo', icon: '☄️' },
            { date: '2025-12-14', title: 'Gemínidas', type: 'meteor', description: 'Mejor lluvia de meteoros del año - hasta 120 meteoros/hora', icon: '☄️' },

            // Solar Events
            { date: '2025-03-29', title: 'Eclipse Solar Parcial', type: 'solar', description: 'Eclipse solar visible parcialmente desde Chile', icon: '☀️' },
            { date: '2025-09-21', title: 'Eclipse Solar Anular', type: 'solar', description: 'Eclipse solar anular visible desde el sur de Chile', icon: '☀️' },

            // Special Astronomical Events
            { date: '2025-04-08', title: 'Paso de Mercurio', type: 'special', description: 'Mercurio pasa frente al Sol', icon: '☿️' },
            { date: '2025-03-25', title: 'Luna Rosa', type: 'special', description: 'Luna llena de marzo - también llamada Luna de gusano', icon: '🌸' },
            { date: '2025-05-26', title: 'Luna de Flor', type: 'special', description: 'Luna llena de mayo - flores en primavera', icon: '🌺' },
            { date: '2025-06-24', title: 'Luna de Fresa', type: 'special', description: 'Luna llena de junio - temporada de fresas', icon: '🍓' }
        ];
    }

    // Get events for a specific date range
    getEventsInRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        return this.astronomicalCalendar.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= start && eventDate <= end;
        });
    }

    // Get upcoming events (next 30 days)
    getUpcomingEvents(days = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return this.getEventsInRange(this.currentDate, futureDate);
    }

    // Get events for current month
    getCurrentMonthEvents() {
        const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);

        return this.getEventsInRange(startOfMonth, endOfMonth);
    }

    // Get events by type
    getEventsByType(type) {
        return this.astronomicalCalendar.filter(event => event.type === type);
    }

    // Get next major event
    getNextMajorEvent() {
        const upcomingEvents = this.getUpcomingEvents(90);
        return upcomingEvents.length > 0 ? upcomingEvents[0] : null;
    }

    // Check if there's an event today
    getTodaysEvents() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.getEventsInRange(today, tomorrow);
    }

    // Get moon phase for a specific date
    getMoonPhase(date = new Date()) {
        // Simplified moon phase calculation
        const moonCycle = 29.53; // days
        const newMoon2025 = new Date('2025-01-14'); // Known new moon date

        const daysSinceNewMoon = Math.floor((date - newMoon2025) / (1000 * 60 * 60 * 24));
        const phasePosition = (daysSinceNewMoon % moonCycle) / moonCycle;

        const phases = [
            { name: 'Luna Nueva', emoji: '🌑', illumination: 0 },
            { name: 'Luna Creciente', emoji: '🌒', illumination: 25 },
            { name: 'Cuarto Creciente', emoji: '🌓', illumination: 50 },
            { name: 'Luna Gibosa Creciente', emoji: '🌔', illumination: 75 },
            { name: 'Luna Llena', emoji: '🌕', illumination: 100 },
            { name: 'Luna Gibosa Menguante', emoji: '🌖', illumination: 75 },
            { name: 'Cuarto Menguante', emoji: '🌗', illumination: 50 },
            { name: 'Luna Menguante', emoji: '🌘', illumination: 25 }
        ];

        const phaseIndex = Math.floor(phasePosition * 8) % 8;
        return phases[phaseIndex];
    }

    // Calculate astronomical seeing conditions
    calculateSeeingConditions(weatherData) {
        if (!weatherData) return 'unknown';

        const { temperature, humidity, windSpeed, cloudCover } = weatherData;

        // Simplified seeing calculation based on weather conditions
        let seeing = 1.0; // arcseconds

        // Temperature effect (colder = better seeing)
        if (temperature < 0) seeing *= 0.8;
        else if (temperature > 10) seeing *= 1.2;

        // Humidity effect (lower = better seeing)
        if (humidity < 20) seeing *= 0.9;
        else if (humidity > 40) seeing *= 1.3;

        // Wind effect (moderate wind = better seeing)
        if (windSpeed < 5) seeing *= 1.1;
        else if (windSpeed > 15) seeing *= 1.2;
        else seeing *= 0.95;

        // Cloud cover effect
        if (cloudCover > 50) seeing *= 2.0;

        return Math.max(0.3, Math.min(3.0, seeing)).toFixed(1);
    }

    // Get astronomical visibility rating
    getVisibilityRating(seeing) {
        const seeingValue = parseFloat(seeing);

        if (seeingValue <= 0.8) return { rating: 'Excelente', color: '#00D4FF', description: 'Condiciones óptimas para observación' };
        if (seeingValue <= 1.2) return { rating: 'Muy Bueno', color: '#00CC00', description: 'Excelentes condiciones' };
        if (seeingValue <= 1.8) return { rating: 'Bueno', color: '#FFCC00', description: 'Buenas condiciones' };
        if (seeingValue <= 2.5) return { rating: 'Regular', color: '#FF6600', description: 'Condiciones aceptables' };
        return { rating: 'Limitado', color: '#FF0000', description: 'Condiciones difíciles' };
    }

    // Format event for display
    formatEventForDisplay(event) {
        const eventDate = new Date(event.date);
        return {
            ...event,
            formattedDate: eventDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            daysUntil: Math.ceil((eventDate - this.currentDate) / (1000 * 60 * 60 * 24)),
            isToday: eventDate.toDateString() === this.currentDate.toDateString(),
            isPast: eventDate < this.currentDate
        };
    }

    // Get events summary for dashboard
    getEventsSummary() {
        const upcoming = this.getUpcomingEvents(30);
        const todays = this.getTodaysEvents();
        const nextMajor = this.getNextMajorEvent();

        return {
            totalUpcoming: upcoming.length,
            todaysEvents: todays.length,
            nextEvent: nextMajor ? this.formatEventForDisplay(nextMajor) : null,
            eventsByType: {
                lunar: this.getEventsByType('lunar').length,
                planetary: this.getEventsByType('planetary').length,
                meteor: this.getEventsByType('meteor').length,
                solar: this.getEventsByType('solar').length,
                seasonal: this.getEventsByType('seasonal').length
            }
        };
    }
}

// Global instance
const astronomicalEventsManager = new AstronomicalEventsManager();

// Export for use in other scripts
window.AstronomicalEventsManager = AstronomicalEventsManager;
window.astronomicalEventsManager = astronomicalEventsManager;