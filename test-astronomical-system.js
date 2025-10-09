/**
 * Test Script for Astronomical System
 * Verifies all components are working correctly
 */

class AstronomicalSystemTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    async runAllTests() {
        console.log('🧪 Iniciando pruebas del Sistema Astronómico...\n');

        // Test Font Awesome Loader
        await this.testFontAwesomeLoader();

        // Test News System
        await this.testNewsSystem();

        // Test Events Manager
        await this.testEventsManager();

        // Test Integration System
        await this.testIntegrationSystem();

        // Test DOM Elements
        await this.testDOMElements();

        this.printResults();
    }

    async testFontAwesomeLoader() {
        console.log('🔤 Probando Font Awesome Loader...');
        try {
            if (typeof FontAwesomeLoader !== 'undefined') {
                const loader = new FontAwesomeLoader();
                await loader.initialize();
                this.pass('Font Awesome Loader inicializado correctamente');
            } else {
                this.fail('Font Awesome Loader no está definido');
            }
        } catch (error) {
            this.fail('Error en Font Awesome Loader: ' + error.message);
        }
    }

    async testNewsSystem() {
        console.log('📰 Probando Sistema de Noticias...');
        try {
            if (typeof AstronomicalNewsSystem !== 'undefined') {
                const newsSystem = new AstronomicalNewsSystem();
                await newsSystem.initialize();
                this.pass('Sistema de Noticias inicializado correctamente');

                // Test NASA API
                const nasaImage = await newsSystem.loadNASAImage();
                if (nasaImage) {
                    this.pass('NASA APOD API funcionando');
                } else {
                    this.fail('NASA APOD API no devolvió datos');
                }

                // Test Space News API
                const spaceNews = await newsSystem.loadSpaceNews();
                if (spaceNews && spaceNews.length > 0) {
                    this.pass('Spaceflight News API funcionando');
                } else {
                    this.fail('Spaceflight News API no devolvió datos');
                }

                // Test Observatories Data
                const observatories = await newsSystem.loadObservatoriesData();
                if (observatories && observatories.length > 0) {
                    this.pass('Datos de observatorios cargados correctamente');
                } else {
                    this.fail('Datos de observatorios no disponibles');
                }
            } else {
                this.fail('AstronomicalNewsSystem no está definido');
            }
        } catch (error) {
            this.fail('Error en Sistema de Noticias: ' + error.message);
        }
    }

    async testEventsManager() {
        console.log('📅 Probando Gestor de Eventos...');
        try {
            if (typeof AstronomicalEventsManager !== 'undefined') {
                const eventsManager = new AstronomicalEventsManager();
                await eventsManager.initialize();
                this.pass('Gestor de Eventos inicializado correctamente');

                // Test current event
                const currentEvent = eventsManager.getCurrentEvent();
                if (currentEvent) {
                    this.pass('Evento actual obtenido correctamente');
                } else {
                    this.warn('No hay evento actual (puede ser normal)');
                }

                // Test next event
                const nextEvent = eventsManager.getNextMajorEvent();
                if (nextEvent) {
                    this.pass('Próximo evento mayor obtenido correctamente');
                } else {
                    this.fail('No se pudo obtener el próximo evento mayor');
                }

                // Test today's events
                const todaysEvents = eventsManager.getTodaysEvents();
                if (Array.isArray(todaysEvents)) {
                    this.pass('Eventos del día obtenidos correctamente');
                } else {
                    this.fail('Error obteniendo eventos del día');
                }

                // Test moon phase
                const moonPhase = eventsManager.getCurrentMoonPhase();
                if (moonPhase) {
                    this.pass('Fase lunar obtenida correctamente');
                } else {
                    this.fail('Error obteniendo fase lunar');
                }
            } else {
                this.fail('AstronomicalEventsManager no está definido');
            }
        } catch (error) {
            this.fail('Error en Gestor de Eventos: ' + error.message);
        }
    }

    async testIntegrationSystem() {
        console.log('🔗 Probando Sistema de Integración...');
        try {
            if (typeof AstronomicalIntegration !== 'undefined') {
                const integration = new AstronomicalIntegration();
                await integration.initialize();
                this.pass('Sistema de Integración inicializado correctamente');

                // Test if all displays can be updated
                await integration.updateAllDisplays();
                this.pass('Todas las pantallas actualizadas correctamente');
            } else {
                this.fail('AstronomicalIntegration no está definido');
            }
        } catch (error) {
            this.fail('Error en Sistema de Integración: ' + error.message);
        }
    }

    async testDOMElements() {
        console.log('🌐 Probando Elementos DOM...');
        try {
            // Test main sections exist
            const sections = [
                'hero', 'eventos', 'observatorios', '3i-atlas', 'noticias'
            ];

            sections.forEach(sectionId => {
                const element = document.getElementById(sectionId);
                if (element) {
                    this.pass(`Sección ${sectionId} encontrada`);
                } else {
                    this.fail(`Sección ${sectionId} no encontrada`);
                }
            });

            // Test key interactive elements
            const interactiveElements = [
                'current-event', 'next-event', 'observatories-grid',
                'featured-news', 'news-grid', 'load-more-news'
            ];

            interactiveElements.forEach(elementId => {
                const element = document.getElementById(elementId);
                if (element) {
                    this.pass(`Elemento interactivo ${elementId} encontrado`);
                } else {
                    this.fail(`Elemento interactivo ${elementId} no encontrado`);
                }
            });

        } catch (error) {
            this.fail('Error probando elementos DOM: ' + error.message);
        }
    }

    pass(message) {
        this.results.passed++;
        this.results.tests.push({ status: 'PASS', message });
        console.log('✅ ' + message);
    }

    fail(message) {
        this.results.failed++;
        this.results.tests.push({ status: 'FAIL', message });
        console.log('❌ ' + message);
    }

    warn(message) {
        this.results.tests.push({ status: 'WARN', message });
        console.log('⚠️ ' + message);
    }

    printResults() {
        console.log('\n📊 Resultados de las Pruebas:');
        console.log('=' .repeat(50));
        console.log(`✅ Pruebas Pasadas: ${this.results.passed}`);
        console.log(`❌ Pruebas Fallidas: ${this.results.failed}`);
        console.log(`📈 Tasa de Éxito: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);

        if (this.results.failed === 0) {
            console.log('\n🎉 ¡Todas las pruebas pasaron! El sistema está funcionando correctamente.');
        } else {
            console.log('\n⚠️ Algunas pruebas fallaron. Revisa los errores arriba.');
        }

        console.log('\n📋 Resumen Detallado:');
        this.results.tests.forEach((test, index) => {
            console.log(`${index + 1}. [${test.status}] ${test.message}`);
        });
    }
}

// Auto-run tests when script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const tester = new AstronomicalSystemTester();
        tester.runAllTests();
    });
} else {
    const tester = new AstronomicalSystemTester();
    tester.runAllTests();
}

// Export for manual testing
window.AstronomicalSystemTester = AstronomicalSystemTester;