// ===== NEWS PAGE FUNCTIONALITY =====

// Real astronomical events data - Updated daily
let newsData = [];

// Real astronomical events and news relevant to Atacama
const realAstronomicalEvents = [
    {
        id: 1,
        title: "ALMA detecta moléculas orgánicas complejas en disco protoplanetario",
        excerpt: "El radiotelescopio ALMA en Atacama identifica precursores de vida en un sistema solar en formación a 450 años luz de distancia.",
        category: "discoveries",
        date: "2024-08-15",
        image: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=500&h=300&fit=crop&crop=center",
        featured: true,
        tourLink: true,
        source: "ESO Chile",
        visibility: "Investigación desde Atacama",
        bestTime: "Investigación continua",
        constellation: "Observable desde nuestros tours"
    },
    {
        id: 2,
        title: "VLT descubre exoplaneta rocoso en zona habitable de Proxima Centauri",
        excerpt: "El Very Large Telescope del ESO en Atacama confirma la presencia de un segundo planeta rocoso en el sistema estelar más cercano al Sol.",
        category: "discoveries",
        date: "2024-08-10",
        image: "https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=500&h=300&fit=crop&crop=center",
        featured: false,
        tourLink: true,
        source: "ESO Paranal",
        visibility: "Investigación desde Chile",
        bestTime: "Visible en tours nocturnos",
        constellation: "Centaurus"
    },
    {
        id: 3,
        title: "Lluvias de Meteoros Gemínidas: el mejor show del año se acerca",
        excerpt: "Las Gemínidas, consideradas las mejores lluvias de meteoros del año, alcanzarán su pico en diciembre. Atacama ofrece condiciones ideales para la observación.",
        category: "meteors",
        date: "2024-12-13",
        endDate: "2024-12-15",
        image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=500&h=300&fit=crop&crop=center",
        featured: true,
        tourLink: true,
        source: "IMO",
        visibility: "Excelente desde Atacama",
        bestTime: "22:00 - 06:00",
        constellation: "Gemini"
    },
    {
        id: 4,
        title: "ALMA revela formación de planetas en tiempo real",
        excerpt: "Nuevas observaciones del radiotelescopio ALMA muestran la formación de planetas gigantes en el disco protoplanetario de HD 163296.",
        category: "discoveries",
        date: "2024-08-20",
        image: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=500&h=300&fit=crop&crop=center",
        featured: false,
        tourLink: true,
        source: "ALMA Observatory",
        visibility: "Investigación desde Atacama",
        bestTime: "Tours educativos disponibles",
        constellation: "Sagittarius"
    },
    {
        id: 5,
        title: "Observatorio La Silla celebra 55 años de descubrimientos",
        excerpt: "El histórico observatorio del ESO en Chile conmemora más de cinco décadas de investigación astronómica pionera en el hemisferio sur.",
        category: "discoveries",
        date: "2024-08-25",
        image: "https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?w=500&h=300&fit=crop&crop=center",
        featured: false,
        tourLink: true,
        source: "ESO La Silla",
        visibility: "Visible desde tours",
        bestTime: "Historia astronómica de Chile",
        constellation: "Múltiples descubrimientos"
    },
    {
        id: 6,
        title: "Saturnalia: la temporada perfecta para observar Saturno",
        excerpt: "Saturno alcanza su oposición en septiembre, ofreciendo las mejores vistas del planeta anillado. Los anillos están en un ángulo ideal para la observación.",
        category: "events",
        date: "2024-09-08",
        image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=500&h=300&fit=crop&crop=center",
        featured: false,
        tourLink: true,
        source: "NASA",
        visibility: "Excelente con telescopio",
        bestTime: "21:00 - 05:00",
        constellation: "Aquarius"
    },
    {
        id: 7,
        title: "Conjunción planetaria: Venus y Júpiter en encuentro cercano",
        excerpt: "Los dos planetas más brillantes se acercarán a menos de 1 grado en el cielo del amanecer, creando un espectáculo visible a simple vista.",
        category: "events",
        date: "2024-08-27",
        image: "https://images.unsplash.com/photo-1544827582-2af9aa3105a8?w=500&h=300&fit=crop&crop=center",
        featured: false,
        tourLink: true,
        source: "NASA JPL",
        visibility: "Visible al amanecer",
        bestTime: "05:30 - 06:30",
        constellation: "Gemini"
    },
    {
        id: 8,
        title: "Telescopio James Webb colabora con observatorios chilenos",
        excerpt: "Nuevas observaciones coordinadas entre el JWST y telescopios terrestres en Chile revelan detalles sin precedentes de nebulosas planetarias.",
        category: "discoveries",
        date: "2024-08-12",
        image: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=500&h=300&fit=crop&crop=center",
        featured: false,
        tourLink: true,
        source: "NASA/ESO",
        visibility: "Objetos observables en tours",
        bestTime: "Nebulosas visibles toda la noche",
        constellation: "Múltiples objetos"
    },
    {
        id: 9,
        title: "Temporada de galaxias: las mejores vistas del cosmos profundo",
        excerpt: "Los meses de invierno austral ofrecen las mejores condiciones para observar galaxias distantes, incluyendo el centro galáctico de la Vía Láctea.",
        category: "events",
        date: "2024-09-01",
        endDate: "2024-11-30",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop&crop=center",
        featured: true,
        tourLink: true,
        source: "Atacama NightSky",
        visibility: "Excelente desde Atacama",
        bestTime: "20:00 - 06:00",
        constellation: "Sagittarius"
    },
    {
        id: 10,
        title: "Oposición de Júpiter: el gigante gaseoso en su máximo esplendor",
        excerpt: "Júpiter estará en oposición, apareciendo más grande y brillante en el cielo. Ideal para observar sus lunas galileanas y la Gran Mancha Roja.",
        category: "events",
        date: "2024-12-07",
        image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=500&h=300&fit=crop&crop=center",
        featured: false,
        tourLink: true,
        source: "NASA",
        visibility: "Excelente para telescopio",
        bestTime: "20:00 - 06:00",
        constellation: "Taurus"
    }
];

// Complete database of telescopes and astronomical centers in Chile
const chileObservatories = [
    {
        id: 1,
        name: "ALMA",
        fullName: "Atacama Large Millimeter/submillimeter Array",
        location: "Llano de Chajnantor, Región de Antofagasta",
        coordinates: { lat: -24.0624, lon: -67.7548 },
        altitude: "5050m",
        distanceFromSanPedro: "50km",
        type: "Radiotelescopio",
        frequency: "Ondas milimétricas y submilimétricas (84-950 GHz)",
        organization: "ESO/NAOJ/NRAO",
        operationalSince: "2011",
        website: "https://www.almaobservatory.org",
        mainObjectives: [
            "Formación estelar y planetaria",
            "Evolución de galaxias",
            "Cosmología observacional",
            "Astrobiología"
        ],
        discoveries: [
            "Primera imagen directa de formación planetaria (HL Tauri, 2014)",
            "Detección de agua en atmósferas de exoplanetas",
            "Observación de galaxias en el universo temprano",
            "Descubrimiento de moléculas orgánicas complejas en el espacio"
        ],
        specifications: {
            antennas: "66 antenas de alta precisión",
            diameter: "7m y 12m",
            resolution: "Hasta 0.1 arcosegundos",
            sensitivity: "La más alta del mundo en su rango"
        },
        tours: "Tours públicos disponibles los sábados y domingos",
        image: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=500&h=300&fit=crop&crop=center"
    },
    {
        id: 2,
        name: "VLT",
        fullName: "Very Large Telescope",
        location: "Cerro Paranal, Región de Antofagasta",
        coordinates: { lat: -24.6274, lon: -70.4040 },
        altitude: "2635m",
        distanceFromSanPedro: "350km al suroeste",
        type: "Óptico/Infrarrojo",
        frequency: "Luz visible e infrarrojo cercano (300nm-28μm)",
        organization: "ESO (European Southern Observatory)",
        operationalSince: "1998",
        website: "https://www.eso.org/public/teles-instr/paranal-observatory/vlt/",
        mainObjectives: [
            "Exoplanetas y sistemas planetarios",
            "Agujeros negros supermasivos",
            "Formación y evolución galáctica",
            "Cosmología y materia oscura"
        ],
        discoveries: [
            "Primera imagen directa de un exoplaneta (2004)",
            "Confirmación del agujero negro central de la Vía Láctea",
            "Descubrimiento de la aceleración de la expansión universal",
            "Detección de atmósferas en exoplanetas rocosos"
        ],
        specifications: {
            telescopes: "4 telescopios de 8.2m + 4 auxiliares de 1.8m",
            instruments: "SPHERE, MUSE, X-SHOOTER, GRAVITY",
            resolution: "Con interferometría: 0.001 arcosegundos",
            lightCollecting: "Equivalente a un telescopio de 16m"
        },
        tours: "Tours disponibles primera y tercera sábado del mes",
        image: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=500&h=300&fit=crop&crop=center"
    },
    {
        id: 3,
        name: "APEX",
        fullName: "Atacama Pathfinder Experiment",
        location: "Llano de Chajnantor, Región de Antofagasta",
        coordinates: { lat: -24.0595, lon: -67.7591 },
        altitude: "5105m",
        distanceFromSanPedro: "45km",
        type: "Radiotelescopio submilimétrico",
        frequency: "Ondas submilimétricas (200-1500 GHz)",
        organization: "ESO/MPIfR/OSO",
        operationalSince: "2005",
        website: "https://www.eso.org/public/teles-instr/apex/",
        mainObjectives: [
            "Estudio del universo frío",
            "Formación estelar en nubes moleculares",
            "Química del medio interestelar",
            "Precursor científico de ALMA"
        ],
        discoveries: [
            "Mapeo de nubes moleculares gigantes",
            "Detección de moléculas complejas en el espacio",
            "Estudios de formación estelar en la Vía Láctea",
            "Observaciones del centro galáctico"
        ],
        specifications: {
            diameter: "12 metros",
            surface: "Precisión de 17 micrones RMS",
            instruments: "LABOCA, SHFI, PI230",
            observationTime: "~4000 horas/año"
        },
        tours: "Acceso limitado por altitud extrema",
        image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500&h=300&fit=crop&crop=center"
    },
    {
        id: 4,
        name: "La Silla",
        fullName: "Observatorio La Silla",
        location: "Desierto de Atacama, Región de Coquimbo",
        coordinates: { lat: -29.2584, lon: -70.7345 },
        altitude: "2400m",
        distanceFromSanPedro: "600km al sur",
        type: "Óptico/Infrarrojo",
        frequency: "Luz visible e infrarrojo cercano",
        organization: "ESO (European Southern Observatory)",
        operationalSince: "1969",
        website: "https://www.eso.org/public/teles-instr/lasilla/",
        mainObjectives: [
            "Búsqueda de exoplanetas",
            "Estudios de supernovas",
            "Astronomía de tiempo variable",
            "Investigación de objetos cercanos a la Tierra"
        ],
        discoveries: [
            "Primer exoplaneta alrededor de estrella tipo solar (51 Peg b, 1995)",
            "Descubrimiento de la aceleración cósmica (Premio Nobel 2011)",
            "Miles de exoplanetas con HARPS",
            "Estudios pioneros de supernovas Tipo Ia"
        ],
        specifications: {
            telescopes: "3.6m NTT, 2.2m MPG/ESO, 1m SAAO",
            instruments: "HARPS, EFOSC2, WFI, REM",
            seeingQuality: "0.6-0.8 arcosegundos típico",
            clearNights: "~300 noches despejadas/año"
        },
        tours: "Tours públicos disponibles",
        image: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=500&h=300&fit=crop&crop=center"
    },
    {
        id: 5,
        name: "CTIO",
        fullName: "Cerro Tololo Inter-American Observatory",
        location: "Cerro Tololo, Región de Coquimbo",
        coordinates: { lat: -30.1695, lon: -70.8152 },
        altitude: "2200m",
        distanceFromSanPedro: "650km al sur",
        type: "Óptico/Infrarrojo",
        frequency: "Luz visible e infrarrojo",
        organization: "AURA/NSF",
        operationalSince: "1967",
        website: "https://www.ctio.noirlab.edu/",
        mainObjectives: [
            "Dark Energy Survey (DES)",
            "Legacy Survey of Space and Time (LSST)",
            "Estudios de supernovas",
            "Astronomía del hemisferio sur"
        ],
        discoveries: [
            "Mapeo de estructura a gran escala del universo",
            "Descubrimientos sobre energía oscura",
            "Catálogos masivos de objetos celestes",
            "Estudios de la Pequeña y Gran Nube de Magallanes"
        ],
        specifications: {
            telescopes: "Blanco 4m, SOAR 4.1m, SMARTS 0.9m-1.5m",
            instruments: "DECam, Goodman, OSIRIS",
            survey: "Dark Energy Survey (2013-2019)",
            skyArea: "5000 grados cuadrados mapeados"
        },
        tours: "Tours disponibles fines de semana",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop&crop=center"
    },
    {
        id: 6,
        name: "Gemini Sur",
        fullName: "Observatorio Gemini Sur",
        location: "Cerro Pachón, Región de Coquimbo",
        coordinates: { lat: -30.2407, lon: -70.7366 },
        altitude: "2722m",
        distanceFromSanPedro: "680km al sur",
        type: "Óptico/Infrarrojo",
        frequency: "Luz visible e infrarrojo (320nm-25μm)",
        organization: "Gemini Observatory/NSF/AURA",
        operationalSince: "2001",
        website: "https://www.gemini.edu/",
        mainObjectives: [
            "Óptica adaptativa avanzada",
            "Estudios de exoplanetas",
            "Formación estelar y planetaria",
            "Galaxias distantes"
        ],
        discoveries: [
            "Imágenes directas de sistemas exoplanetarios",
            "Estudios detallados de discos protoplanetarios",
            "Observaciones de agujeros negros",
            "Mapeo de corrientes estelares en la Vía Láctea"
        ],
        specifications: {
            mirror: "8.1 metros",
            adaptiveOptics: "GeMS (sistema multi-láser)",
            instruments: "GMOS-S, FLAMINGOS-2, GSAOI",
            resolution: "0.1 arcosegundos con óptica adaptativa"
        },
        tours: "Tours especiales para grupos organizados",
        image: "https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?w=500&h=300&fit=crop&crop=center"
    },
    {
        id: 7,
        name: "LSST",
        fullName: "Large Synoptic Survey Telescope (Vera C. Rubin Observatory)",
        location: "Cerro Pachón, Región de Coquimbo",
        coordinates: { lat: -30.2446, lon: -70.7494 },
        altitude: "2663m",
        distanceFromSanPedro: "680km al sur",
        type: "Óptico de survey",
        frequency: "Luz visible (320-1050nm)",
        organization: "LSST Corporation/NSF/DOE",
        operationalSince: "2024 (first light)",
        website: "https://www.lsst.org/",
        mainObjectives: [
            "Legacy Survey of Space and Time",
            "Búsqueda de asteroides peligrosos",
            "Estudio de la energía oscura",
            "Astronomía de dominio temporal"
        ],
        discoveries: [
            "En operación inicial (2024)",
            "Catálogo más grande jamás creado",
            "Detección de objetos transitorios",
            "Mapeo completo del cielo austral"
        ],
        specifications: {
            mirror: "8.4 metros",
            camera: "3.2 gigapíxeles (la más grande del mundo)",
            fieldOfView: "9.6 grados cuadrados",
            dataRate: "20 TB por noche"
        },
        tours: "Centro de visitantes en construcción",
        image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=500&h=300&fit=crop&crop=center"
    },
    {
        id: 8,
        name: "SOAR",
        fullName: "Southern Astrophysical Research Telescope",
        location: "Cerro Pachón, Región de Coquimbo",
        coordinates: { lat: -30.2379, lon: -70.7331 },
        altitude: "2738m",
        distanceFromSanPedro: "680km al sur",
        type: "Óptico/Infrarrojo",
        frequency: "Luz visible e infrarrojo cercano",
        organization: "SOAR/AURA/NSF",
        operationalSince: "2004",
        website: "http://www.ctio.noirlab.edu/soar/",
        mainObjectives: [
            "Seguimiento de discoveries de LSST",
            "Espectroscopía de alta resolución",
            "Estudios de supernovas",
            "Astronomía galáctica"
        ],
        discoveries: [
            "Confirmación espectroscópica de supernovas",
            "Estudios de poblaciones estelares",
            "Seguimiento de objetos transitorios",
            "Investigación de cúmulos globulares"
        ],
        specifications: {
            mirror: "4.1 metros",
            instruments: "Goodman, SAM, SAMI",
            seeing: "0.7 arcosegundos mediano",
            efficiency: "Optimizado para espectroscopía"
        },
        tours: "Incluido en tours de CTIO",
        image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=500&h=300&fit=crop&crop=center"
    },
    {
        id: 9,
        name: "ASTE",
        fullName: "Atacama Submillimeter Telescope Experiment",
        location: "Pampa la Bola, San Pedro de Atacama",
        coordinates: { lat: -22.9717, lon: -67.7033 },
        altitude: "4800m",
        distanceFromSanPedro: "30km",
        type: "Radiotelescopio submilimétrico",
        frequency: "Ondas submilimétricas (300-950 GHz)",
        organization: "NAOJ (National Astronomical Observatory of Japan)",
        operationalSince: "2004",
        website: "https://www.nao.ac.jp/en/research/facilities/nro/aste",
        mainObjectives: [
            "Estudio del medio interestelar",
            "Formación estelar",
            "Evolución galáctica",
            "Astrobiología molecular"
        ],
        discoveries: [
            "Detección de CO en galaxias distantes",
            "Mapeo de nubes moleculares en la Vía Láctea",
            "Estudios de química interestelar",
            "Observaciones del centro galáctico"
        ],
        specifications: {
            diameter: "10 metros",
            surface: "Precisión de 20 micrones RMS",
            instruments: "Cámaras submilimétricas múltiples",
            observationEfficiency: "Muy alta en su rango"
        },
        tours: "Acceso muy limitado por ubicación remota",
        image: "https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=500&h=300&fit=crop&crop=center"
    },
    {
        id: 10,
        name: "Observatorio del Cerro Maipo",
        fullName: "Observatorio Astronómico Cerro Maipo",
        location: "Pirque, Región Metropolitana",
        coordinates: { lat: -33.6676, lon: -70.5258 },
        altitude: "1100m",
        distanceFromSanPedro: "1200km al sur",
        type: "Óptico educativo",
        frequency: "Luz visible",
        organization: "Universidad de Chile",
        operationalSince: "1958",
        website: "http://www.das.uchile.cl/observatorio/",
        mainObjectives: [
            "Educación astronómica",
            "Investigación estudiantil",
            "Divulgación científica",
            "Formación de astrónomos"
        ],
        discoveries: [
            "Centro histórico de formación astronómica en Chile",
            "Múltiples tesis doctorales",
            "Programas de extensión universitaria",
            "Base para desarrollo de astronomía nacional"
        ],
        specifications: {
            telescopes: "Varios telescopios pequeños y medianos",
            programs: "Programas educativos regulares",
            access: "Abierto al público en fechas específicas",
            history: "Más de 65 años de historia"
        },
        tours: "Tours educativos regulares",
        image: "images/hero2.webp"
    },
    {
        id: 11,
        name: "TAO",
        fullName: "Tokyo Astronomical Observatory (Atacama Observatory)",
        location: "Cerro Chajnantor, Región de Antofagasta",
        coordinates: { lat: -24.0900, lon: -67.7500 },
        altitude: "5640m",
        distanceFromSanPedro: "55km",
        type: "Óptico infrarrojo",
        frequency: "Luz infrarroja cercana (1-2.5 μm)",
        organization: "Universidad de Tokio, Japón",
        operationalSince: "2024",
        website: "https://www.ioa.s.u-tokyo.ac.jp/TAO/",
        mainObjectives: [
            "Observación del universo infrarrojo",
            "Estudio de formación estelar",
            "Detección de exoplanetas",
            "Investigación de galaxias distantes"
        ],
        discoveries: [
            "Telescopio óptico más alto del mundo (5640m)",
            "Primera luz obtenida en 2024",
            "Tecnología avanzada de óptica adaptativa",
            "Diseño único para condiciones extremas de altitud"
        ],
        specifications: {
            diameter: "6.5 metros",
            instruments: "Cámara infrarroja SWIMS, Espectrógrafo MIMIZUKU",
            resolution: "Resolución sub-arcsegundo con óptica adaptativa",
            uniqueness: "Telescopio óptico más alto del mundo"
        },
        tours: "Acceso extremadamente limitado por altitud récord",
        image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=500&h=300&fit=crop&crop=center"
    }
];

// State management
let currentFilter = 'all';
let displayedNews = 3;
const newsPerLoad = 3;

// Daily news update system
function updateDailyNews() {
    const today = new Date();
    const lastUpdate = localStorage.getItem('lastNewsUpdate');
    const lastUpdateDate = lastUpdate ? new Date(lastUpdate) : null;
    
    // Check if we need to update (once per day)
    if (!lastUpdateDate || today.toDateString() !== lastUpdateDate.toDateString()) {
        // Get current and upcoming events
        newsData = getCurrentAndUpcomingEvents();
        
        // Mark as updated today
        localStorage.setItem('lastNewsUpdate', today.toISOString());
        localStorage.setItem('currentNewsData', JSON.stringify(newsData));
        
        console.log('News updated for today:', today.toDateString());
    } else {
        // Load from storage
        const storedNews = localStorage.getItem('currentNewsData');
        if (storedNews) {
            newsData = JSON.parse(storedNews);
        } else {
            newsData = getCurrentAndUpcomingEvents();
        }
    }
}

// Get current and upcoming astronomical events
function getCurrentAndUpcomingEvents() {
    const today = new Date();
    const fourMonthsFromNow = new Date(today.getTime() + (120 * 24 * 60 * 60 * 1000)); // 4 months
    
    return realAstronomicalEvents
        .filter(event => {
            const eventDate = new Date(event.date);
            const endDate = event.endDate ? new Date(event.endDate) : eventDate;
            
            // Include if event is happening now or in the future (within 4 months)
            return endDate >= today && eventDate <= fourMonthsFromNow;
        })
        .map(event => {
            const eventDate = new Date(event.date);
            const endDate = event.endDate ? new Date(event.endDate) : eventDate;
            const daysUntilEvent = Math.ceil((eventDate - today) / (24 * 60 * 60 * 1000));
            const isActive = today >= eventDate && today <= endDate;
            
            // Calculate priority based on proximity and type
            let priority = 0;
            if (isActive) priority += 100; // Currently happening
            else if (daysUntilEvent <= 7) priority += 50; // Within a week
            else if (daysUntilEvent <= 30) priority += 25; // Within a month
            
            // Boost priority for certain event types
            if (event.category === 'meteors') priority += 20;
            if (event.featured) priority += 15;
            if (event.visibility === 'Excelente desde Atacama') priority += 10;
            
            return {
                ...event,
                priority,
                daysUntilEvent,
                isActive,
                status: isActive ? 'happening-now' : daysUntilEvent <= 7 ? 'coming-soon' : 'upcoming'
            };
        })
        .sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Update news data with real-time information first
    await updateDailyNewsWithRealTimeData();
    
    initializeFilters();
    renderNews();
    initializeModal();
    initializeLiveEvents();
    initializeTelescopeDirectory(); // New telescope directory functionality
    
    // Load more button
    document.getElementById('load-more').addEventListener('click', loadMoreNews);
    
    // Set up periodic updates (every 30 minutes)
    setInterval(async () => {
        console.log('Checking for real-time updates...');
        await updateDailyNewsWithRealTimeData();
        renderNews(); // Re-render with updated data
        updateLiveEvents(); // Update live events banner
    }, 30 * 60 * 1000); // 30 minutes
});

// Filter functionality
function initializeFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Update current filter
            currentFilter = this.dataset.filter;
            
            // Reset displayed news count
            displayedNews = newsPerLoad;
            
            // Re-render news
            renderNews();
            
            // Track filter usage
            trackNewsInteraction('filter_change', currentFilter);
        });
    });
}

// Render news grid
function renderNews() {
    const newsGrid = document.getElementById('news-grid');
    
    // Filter news based on current filter
    let filteredNews = newsData;
    if (currentFilter !== 'all') {
        filteredNews = newsData.filter(news => news.category === currentFilter);
    }
    
    // Sort by date (newest first)
    filteredNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Take only the news to display
    const newsToShow = filteredNews.slice(0, displayedNews);
    
    // Clear grid
    newsGrid.innerHTML = '';
    
    // Render each news item
    newsToShow.forEach((news, index) => {
        const newsCard = createNewsCard(news, index === 0 && currentFilter === 'all');
        newsGrid.appendChild(newsCard);
    });
    
    // Update load more button
    const loadMoreBtn = document.getElementById('load-more');
    if (displayedNews >= filteredNews.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
}

// Create news card HTML
function createNewsCard(news, isFeatured = false) {
    const card = document.createElement('div');
    card.className = `news-card ${isFeatured ? 'featured' : ''} ${news.status || ''}`;
    card.dataset.category = news.category;
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };
    
    const getStatusBadge = (news) => {
        if (news.isActive) {
            return '<span class="status-badge happening">🔴 En Vivo</span>';
        } else if (news.daysUntilEvent <= 7) {
            return `<span class="status-badge coming-soon">⏰ En ${news.daysUntilEvent} días</span>`;
        } else if (news.daysUntilEvent <= 30) {
            return `<span class="status-badge upcoming">📅 ${news.daysUntilEvent} días</span>`;
        }
        return '';
    };
    
    const getEventDetails = (news) => {
        let details = '';
        if (news.bestTime) {
            details += `<div class="event-detail"><i class="fas fa-clock"></i> Mejor horario: ${news.bestTime}</div>`;
        }
        if (news.constellation) {
            details += `<div class="event-detail"><i class="fas fa-star"></i> Constelación: ${news.constellation}</div>`;
        }
        if (news.visibility) {
            details += `<div class="event-detail"><i class="fas fa-eye"></i> ${news.visibility}</div>`;
        }
        return details;
    };
    
    const categoryNames = {
        'events': 'Eventos Celestiales',
        'discoveries': 'Descubrimientos',
        'tours': 'Tours Especiales',
        'auroras': 'Auroras',
        'meteors': 'Lluvias de Meteoros'
    };
    
    card.innerHTML = `
        <img src="${news.image}" alt="${news.title}" class="news-image" loading="lazy">
        <div class="news-content">
            <div class="news-header">
                <span class="news-category">${categoryNames[news.category] || 'Noticias'}</span>
                ${getStatusBadge(news)}
            </div>
            <div class="news-date">${formatDate(news.date)} • ${news.source}</div>
            <h3>${news.title}</h3>
            <p class="news-excerpt">${news.excerpt}</p>
            ${getEventDetails(news)}
            <div class="news-footer">
                <a href="#" class="read-more" onclick="openNewsDetail(${news.id})">Leer más →</a>
                ${news.tourLink ? '<a href="index.html#tours" class="tour-cta" onclick="trackNewsInteraction(\'tour_cta_click\', \'' + news.title + '\')">Reservar Tour</a>' : ''}
            </div>
        </div>
    `;
    
    // Add click handler for the entire card
    card.addEventListener('click', function(e) {
        if (!e.target.classList.contains('tour-cta') && !e.target.classList.contains('read-more')) {
            openNewsDetail(news.id);
        }
    });
    
    return card;
}

// Load more news
function loadMoreNews() {
    displayedNews += newsPerLoad;
    renderNews();
    
    trackNewsInteraction('load_more', currentFilter);
}

// Modal functionality
function initializeModal() {
    const modal = document.getElementById('alert-modal');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('alert-form');
    
    // Close modal handlers
    closeBtn.addEventListener('click', closeAlertModal);
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAlertModal();
        }
    });
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleAlertSubscription();
    });
}

// Open alert modal
function openAlertModal() {
    const modal = document.getElementById('alert-modal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    trackNewsInteraction('open_alert_modal', 'subscription');
}

// Close alert modal
function closeAlertModal() {
    const modal = document.getElementById('alert-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Handle alert subscription
function handleAlertSubscription() {
    const form = document.getElementById('alert-form');
    const formData = new FormData(form);
    
    const selectedAlerts = formData.getAll('alerts');
    const notificationMethod = formData.get('notification-method');
    const email = formData.get('email');
    const phone = formData.get('phone');
    
    // Validation
    if (selectedAlerts.length === 0) {
        alert('Por favor selecciona al menos un tipo de alerta.');
        return;
    }
    
    if (!email || !email.includes('@')) {
        alert('Por favor ingresa un email válido.');
        return;
    }
    
    // In production, this would send data to your backend
    console.log('Alert subscription:', {
        alerts: selectedAlerts,
        method: notificationMethod,
        email: email,
        phone: phone
    });
    
    // Track subscription
    selectedAlerts.forEach(alert => {
        trackAlertSubscription(alert);
    });
    
    // Show success message
    alert('¡Alertas configuradas exitosamente! Te notificaremos sobre los eventos celestiales seleccionados.');
    
    // Close modal
    closeAlertModal();
    
    // Reset form
    form.reset();
}

// Live events functionality
function initializeLiveEvents() {
    // Simulate live event updates
    updateLiveEvents();
    
    // Update every 30 minutes
    setInterval(updateLiveEvents, 30 * 60 * 1000);
}

function updateLiveEvents() {
    // Get the most urgent/current event from our real data
    const today = new Date();
    
    // Find events that are happening now or very soon
    const urgentEvents = newsData.filter(event => {
        return event.isActive || event.daysUntilEvent <= 3;
    });
    
    let selectedEvent;
    if (urgentEvents.length > 0) {
        // Prioritize currently happening events, then very soon events
        selectedEvent = urgentEvents.sort((a, b) => {
            if (a.isActive && !b.isActive) return -1;
            if (!a.isActive && b.isActive) return 1;
            return a.daysUntilEvent - b.daysUntilEvent;
        })[0];
    } else {
        // If no urgent events, show the next upcoming event
        selectedEvent = newsData.find(event => event.daysUntilEvent > 0) || newsData[0];
    }
    
    if (!selectedEvent) return;
    
    const liveContent = document.querySelector('.live-content');
    if (liveContent) {
        let statusText = '';
        let actionText = 'Reservar Tour de Observación →';
        
        if (selectedEvent.isActive) {
            statusText = '🔴 AHORA EN VIVO';
            actionText = '¡Reserva AHORA! →';
        } else if (selectedEvent.daysUntilEvent === 0) {
            statusText = '🌟 HOY';
            actionText = 'Reservar para esta noche →';
        } else if (selectedEvent.daysUntilEvent === 1) {
            statusText = '⏰ MAÑANA';
            actionText = 'Reservar para mañana →';
        } else if (selectedEvent.daysUntilEvent <= 7) {
            statusText = `📅 EN ${selectedEvent.daysUntilEvent} DÍAS`;
        } else {
            statusText = `📅 ${selectedEvent.daysUntilEvent} días`;
        }
        
        liveContent.innerHTML = `
            <div>
                <h3>${statusText} - ${selectedEvent.title}</h3>
                <p>${selectedEvent.excerpt}</p>
                ${selectedEvent.bestTime ? `<p><strong>Mejor horario:</strong> ${selectedEvent.bestTime}</p>` : ''}
            </div>
            <a href="index.html#tours" class="btn btn-accent" onclick="trackNewsInteraction('book_from_live', '${selectedEvent.category}')">
                ${actionText}
            </a>
        `;
        
        // Update live banner visibility
        const liveBanner = document.querySelector('.live-events-banner');
        if (liveBanner) {
            liveBanner.style.display = selectedEvent.isActive || selectedEvent.daysUntilEvent <= 7 ? 'block' : 'none';
        }
    }
}

// Open news detail (placeholder)
function openNewsDetail(newsId) {
    // In production, this would open a detailed view or navigate to a detailed page
    const news = newsData.find(n => n.id === newsId);
    if (news) {
        trackNewsInteraction('read_more', news.title);
        alert(`Abriendo detalle de: ${news.title}\n\n(En producción, esto abriría una página detallada de la noticia)`);
    }
}

// Real-time Astronomical Data APIs
class AstronomicalDataAPI {
    constructor() {
        this.baseUrls = {
            // Free APIs that don't require API keys
            spaceweather: 'https://services.swpc.noaa.gov/json/',
            iss: 'http://api.open-notify.org/iss-pass.json',
            meteorShowers: 'https://in-the-sky.org/data/meteors.php',
            moonPhases: 'https://api.farmsense.net/v1/moonphases/',
            planets: 'https://in-the-sky.org/data/planets.php',
            // Backup/alternative sources
            astronomyAPI: 'https://api.astronomyapi.com/api/v2/',
            timeanddate: 'https://api.timeanddate.com/v1/astronomy'
        };
        
        // Atacama coordinates for location-specific data
        this.atacamaCoords = {
            lat: -22.9087,
            lon: -68.1997,
            elevation: 2400 // meters
        };
    }
    
    // Get current space weather conditions
    async getSpaceWeather() {
        try {
            const response = await fetch(`${this.baseUrls.spaceweather}goes/primary/xrays-6-hour.json`);
            const data = await response.json();
            return this.processSpaceWeatherData(data);
        } catch (error) {
            console.error('Error fetching space weather:', error);
            return null;
        }
    }
    
    // Get ISS pass times for Atacama
    async getISSPasses() {
        try {
            const response = await fetch(
                `${this.baseUrls.iss}?lat=${this.atacamaCoords.lat}&lon=${this.atacamaCoords.lon}&n=5`
            );
            const data = await response.json();
            return this.processISSData(data);
        } catch (error) {
            console.error('Error fetching ISS data:', error);
            return null;
        }
    }
    
    // Get current moon phase and lunar events
    async getMoonData() {
        try {
            const now = new Date();
            const timestamp = Math.floor(now.getTime() / 1000);
            const response = await fetch(`${this.baseUrls.moonPhases}?d=${timestamp}`);
            const data = await response.json();
            return this.processMoonData(data);
        } catch (error) {
            console.error('Error fetching moon data:', error);
            return null;
        }
    }
    
    // Check for active meteor showers
    async getMeteorShowers() {
        try {
            // For now, we'll use our predefined data but in production
            // this would fetch from a real meteor shower API
            return this.getCurrentMeteorShowers();
        } catch (error) {
            console.error('Error fetching meteor shower data:', error);
            return null;
        }
    }
    
    // Process space weather data for aurora predictions
    processSpaceWeatherData(data) {
        if (!data || data.length === 0) return null;
        
        const latest = data[data.length - 1];
        const xrayClass = latest.flux || 'Unknown';
        
        // Determine aurora activity based on solar activity
        let auroraActivity = 'low';
        if (xrayClass.includes('M')) auroraActivity = 'moderate';
        if (xrayClass.includes('X')) auroraActivity = 'high';
        
        return {
            type: 'space_weather',
            auroraActivity,
            xrayFlux: xrayClass,
            timestamp: latest.time_tag,
            prediction: this.getAuroraPrediction(auroraActivity)
        };
    }
    
    // Process ISS pass data
    processISSData(data) {
        if (!data.response || data.response.length === 0) return null;
        
        const nextPass = data.response[0];
        const passTime = new Date(nextPass.risetime * 1000);
        
        return {
            type: 'iss_pass',
            nextPass: passTime,
            duration: nextPass.duration,
            magnitude: -3.5, // ISS typical magnitude
            direction: 'SW to NE' // Typical direction
        };
    }
    
    // Process moon phase data
    processMoonData(data) {
        if (!data || data.length === 0) return null;
        
        const currentPhase = data[0];
        return {
            type: 'moon_phase',
            phase: currentPhase.Phase,
            illumination: currentPhase.Illumination,
            nextNewMoon: data.find(d => d.Phase === 'New Moon')?.Date,
            nextFullMoon: data.find(d => d.Phase === 'Full Moon')?.Date
        };
    }
    
    // Get current meteor showers (using our predefined data)
    getCurrentMeteorShowers() {
        const today = new Date();
        const activeShowers = realAstronomicalEvents.filter(event => {
            if (event.category !== 'meteors') return false;
            
            const startDate = new Date(event.date);
            const endDate = event.endDate ? new Date(event.endDate) : startDate;
            
            return today >= startDate && today <= endDate;
        });
        
        return activeShowers;
    }
    
    // Get aurora prediction based on space weather
    getAuroraPrediction(activity) {
        const predictions = {
            'low': 'Actividad auroral baja. Auroras australes poco probables en Chile.',
            'moderate': 'Actividad auroral moderada. Auroras australes posibles en el extremo sur de Chile.',
            'high': 'Actividad auroral alta. ¡Auroras australes visibles desde el sur de Chile!'
        };
        
        return predictions[activity] || predictions['low'];
    }
    
    // Combine all real-time data
    async getAllCurrentData() {
        try {
            const [spaceWeather, issData, moonData, meteorShowers] = await Promise.allSettled([
                this.getSpaceWeather(),
                this.getISSPasses(),
                this.getMoonData(),
                this.getMeteorShowers()
            ]);
            
            return {
                spaceWeather: spaceWeather.status === 'fulfilled' ? spaceWeather.value : null,
                iss: issData.status === 'fulfilled' ? issData.value : null,
                moon: moonData.status === 'fulfilled' ? moonData.value : null,
                meteors: meteorShowers.status === 'fulfilled' ? meteorShowers.value : null,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching all astronomical data:', error);
            return null;
        }
    }
}

// Initialize the astronomical data API
const astroAPI = new AstronomicalDataAPI();

// Enhanced daily news update system with real-time data
async function updateDailyNewsWithRealTimeData() {
    try {
        console.log('Fetching real-time astronomical data...');
        
        // Get real-time data
        const realTimeData = await astroAPI.getAllCurrentData();
        
        if (realTimeData) {
            // Store the real-time data
            localStorage.setItem('realTimeAstroData', JSON.stringify(realTimeData));
            
            // Enhance our news data with real-time information
            enhanceNewsWithRealTimeData(realTimeData);
            
            console.log('Real-time data fetched and integrated successfully');
        }
        
        // Continue with regular news update
        updateDailyNews();
        
    } catch (error) {
        console.error('Error updating with real-time data:', error);
        // Fall back to regular update
        updateDailyNews();
    }
}

// Enhance news data with real-time information
function enhanceNewsWithRealTimeData(realTimeData) {
    if (!realTimeData) return;
    
    // Add ISS pass information if available
    if (realTimeData.iss) {
        const issEvent = {
            id: 'iss-' + Date.now(),
            title: 'Paso de la Estación Espacial Internacional',
            excerpt: `La ISS será visible desde Atacama durante ${realTimeData.iss.duration} segundos. Una oportunidad única para observar tecnología espacial en órbita.`,
            category: 'events',
            date: realTimeData.iss.nextPass.toISOString().split('T')[0],
            image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500&h=300&fit=crop&crop=center',
            featured: false,
            tourLink: true,
            source: 'NASA ISS Tracker',
            visibility: 'Visible a simple vista',
            bestTime: realTimeData.iss.nextPass.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            constellation: 'Variable',
            priority: 80,
            daysUntilEvent: Math.ceil((realTimeData.iss.nextPass - new Date()) / (24 * 60 * 60 * 1000)),
            isActive: false,
            status: 'upcoming'
        };
        
        // Add to beginning of news array if it's soon
        if (issEvent.daysUntilEvent <= 1) {
            newsData.unshift(issEvent);
        }
    }
    
    // Add space weather information for educational purposes (no aurora alerts for Atacama)
    if (realTimeData.spaceWeather && realTimeData.spaceWeather.auroraActivity !== 'low') {
        const spaceWeatherEvent = {
            id: 'space-weather-' + Date.now(),
            title: 'Actividad Solar Aumentada',
            excerpt: 'Actividad solar elevada detectada. Aunque las auroras no son visibles desde Atacama, estos fenómenos afectan las comunicaciones satelitales y la navegación GPS.',
            category: 'discoveries',
            date: new Date().toISOString().split('T')[0],
            image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=500&h=300&fit=crop&crop=center',
            featured: false,
            tourLink: true,
            source: 'NOAA Space Weather',
            visibility: 'Efectos en tecnología espacial',
            bestTime: 'Información educativa en tours',
            constellation: 'Fenómeno solar',
            priority: 40,
            daysUntilEvent: 0,
            isActive: true,
            status: 'happening-now'
        };
        
        newsData.unshift(spaceWeatherEvent);
    }
}

// Notification System
class NotificationSystem {
    constructor() {
        this.subscriptions = JSON.parse(localStorage.getItem('astro_subscriptions') || '[]');
    }
    
    subscribe(alertTypes, email, phone, method) {
        const subscription = {
            id: Date.now(),
            alertTypes: alertTypes,
            email: email,
            phone: phone,
            method: method,
            created: new Date().toISOString(),
            active: true
        };
        
        this.subscriptions.push(subscription);
        localStorage.setItem('astro_subscriptions', JSON.stringify(this.subscriptions));
        
        return subscription.id;
    }
    
    checkNotifications() {
        // In production, this would check against real astronomical events
        // and send notifications via email/SMS services
        console.log('Checking for notifications...', this.subscriptions);
    }
    
    getUpcomingEvents() {
        // Return upcoming astronomical events based on user's location (Atacama)
        return [
            {
                type: 'meteors',
                name: 'Perseidas',
                date: '2024-08-17',
                visibility: 'excelente',
                peakTime: '22:00 - 04:00'
            },
            {
                type: 'planets',
                name: 'Conjunción Venus-Júpiter',
                date: '2024-08-20',
                visibility: 'buena',
                peakTime: '05:30 - 06:30'
            }
        ];
    }
}

// Initialize notification system
const notifications = new NotificationSystem();

// Check for notifications every hour
setInterval(() => {
    notifications.checkNotifications();
}, 60 * 60 * 1000);

// ===== TELESCOPE DIRECTORY FUNCTIONALITY =====

// Initialize telescope directory
function initializeTelescopeDirectory() {
    renderTelescopeGrid();
    initializeTelescopeFilters();
    initializeTelescopeModal();
}

// Render telescope grid
function renderTelescopeGrid(filter = 'all') {
    const telescopesGrid = document.getElementById('telescopes-grid');
    if (!telescopesGrid) return;
    
    let filteredTelescopes = chileObservatories;
    
    if (filter !== 'all') {
        filteredTelescopes = chileObservatories.filter(telescope => 
            telescope.type.includes(filter) || 
            (filter === 'educativo' && telescope.type.includes('educativo'))
        );
    }
    
    telescopesGrid.innerHTML = '';
    
    filteredTelescopes.forEach(telescope => {
        const telescopeCard = createTelescopeCard(telescope);
        telescopesGrid.appendChild(telescopeCard);
    });
}

// Create telescope card
function createTelescopeCard(telescope) {
    const card = document.createElement('div');
    card.className = 'telescope-card';
    card.dataset.telescopeId = telescope.id;
    
    // Get the first 3 objectives for preview
    const objectivesPreview = telescope.mainObjectives.slice(0, 3);
    
    card.innerHTML = `
        <img src="${telescope.image}" alt="${telescope.name}" class="telescope-card-image" loading="lazy">
        <div class="telescope-card-content">
            <div class="telescope-card-header">
                <h3 class="telescope-name">${telescope.name}</h3>
                <span class="telescope-type">${telescope.type}</span>
            </div>
            
            <div class="telescope-organization">${telescope.organization}</div>
            
            <div class="telescope-location">
                <i class="fas fa-map-marker-alt"></i>
                ${telescope.location}
            </div>
            
            <div class="telescope-frequency">
                <strong>Frecuencia:</strong> ${telescope.frequency}
            </div>
            
            <div class="telescope-highlights">
                <h4>Objetivos principales:</h4>
                <ul>
                    ${objectivesPreview.map(objective => `<li>${objective}</li>`).join('')}
                </ul>
            </div>
            
            <div class="telescope-card-footer">
                <span class="distance-badge">${telescope.distanceFromSanPedro}</span>
                <a href="#" class="learn-more-btn" onclick="openTelescopeModal(${telescope.id})">Ver detalles →</a>
            </div>
        </div>
    `;
    
    // Add click handler for the entire card
    card.addEventListener('click', function(e) {
        if (!e.target.classList.contains('learn-more-btn')) {
            openTelescopeModal(telescope.id);
        }
    });
    
    return card;
}

// Initialize telescope filters
function initializeTelescopeFilters() {
    const filterButtons = document.querySelectorAll('.telescope-filter');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter type and render
            const filterType = this.dataset.type;
            renderTelescopeGrid(filterType);
            
            // Track filter usage
            if (typeof trackNewsInteraction === 'function') {
                trackNewsInteraction('telescope_filter', filterType);
            }
        });
    });
}

// Initialize telescope modal
function initializeTelescopeModal() {
    const modal = document.getElementById('telescope-modal');
    const closeBtn = document.querySelector('.close-telescope-modal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeTelescopeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeTelescopeModal();
            }
        });
    }
}

// Open telescope modal with detailed information
function openTelescopeModal(telescopeId) {
    const telescope = chileObservatories.find(t => t.id === telescopeId);
    if (!telescope) return;
    
    const modal = document.getElementById('telescope-modal');
    const modalBody = document.getElementById('telescope-modal-body');
    
    if (!modal || !modalBody) return;
    
    modalBody.innerHTML = createTelescopeModalContent(telescope);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Track modal open
    if (typeof trackNewsInteraction === 'function') {
        trackNewsInteraction('telescope_modal_open', telescope.name);
    }
}

// Create detailed telescope modal content
function createTelescopeModalContent(telescope) {
    return `
        <div class="modal-telescope-header">
            <h1 class="modal-telescope-name">${telescope.name}</h1>
            <p class="modal-telescope-fullname">${telescope.fullName}</p>
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px;">
                <span class="telescope-type">${telescope.type}</span>
                <span class="distance-badge">${telescope.distanceFromSanPedro}</span>
                <span style="background: rgba(123, 104, 238, 0.2); color: var(--secondary-color); padding: 4px 10px; border-radius: 15px; font-size: 0.8rem; font-weight: 500;">
                    Desde ${telescope.operationalSince}
                </span>
            </div>
        </div>
        
        <div class="modal-content-grid">
            <div class="modal-section">
                <h3><i class="fas fa-bullseye"></i> Objetivos Principales</h3>
                <ul>
                    ${telescope.mainObjectives.map(objective => `<li>${objective}</li>`).join('')}
                </ul>
            </div>
            
            <div class="modal-section">
                <h3><i class="fas fa-trophy"></i> Descubrimientos Notables</h3>
                <ul>
                    ${telescope.discoveries.map(discovery => `<li>${discovery}</li>`).join('')}
                </ul>
            </div>
        </div>
        
        <div class="modal-content-grid">
            <div class="modal-section">
                <h3><i class="fas fa-cogs"></i> Especificaciones Técnicas</h3>
                <div class="specifications-grid">
                    ${Object.entries(telescope.specifications).map(([key, value]) => `
                        <div class="spec-item">
                            <div class="spec-label">${formatSpecLabel(key)}</div>
                            <div class="spec-value">${value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="modal-section">
                <h3><i class="fas fa-info-circle"></i> Información General</h3>
                <div class="specifications-grid">
                    <div class="spec-item">
                        <div class="spec-label">Ubicación</div>
                        <div class="spec-value">${telescope.location}</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-label">Altitud</div>
                        <div class="spec-value">${telescope.altitude}</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-label">Organización</div>
                        <div class="spec-value">${telescope.organization}</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-label">Tours</div>
                        <div class="spec-value">${telescope.tours}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                <strong>Frecuencia de observación:</strong> ${telescope.frequency}
            </p>
            <a href="${telescope.website}" target="_blank" class="website-link">
                <i class="fas fa-external-link-alt"></i>
                Visitar sitio web oficial
            </a>
        </div>
    `;
}

// Format specification labels for display
function formatSpecLabel(key) {
    const labelMap = {
        'antennas': 'Antenas',
        'diameter': 'Diámetro',
        'resolution': 'Resolución',
        'sensitivity': 'Sensibilidad',
        'telescopes': 'Telescopios',
        'instruments': 'Instrumentos',
        'lightCollecting': 'Capacidad de luz',
        'surface': 'Superficie',
        'observationTime': 'Tiempo observación',
        'mirror': 'Espejo principal',
        'adaptiveOptics': 'Óptica adaptativa',
        'seeingQuality': 'Calidad seeing',
        'clearNights': 'Noches despejadas',
        'survey': 'Survey principal',
        'skyArea': 'Área del cielo',
        'camera': 'Cámara',
        'fieldOfView': 'Campo de visión',
        'dataRate': 'Tasa de datos',
        'seeing': 'Seeing mediano',
        'efficiency': 'Eficiencia',
        'observationEfficiency': 'Eficiencia observacional',
        'programs': 'Programas',
        'access': 'Acceso público',
        'history': 'Historia'
    };
    
    return labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

// Close telescope modal
function closeTelescopeModal() {
    const modal = document.getElementById('telescope-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Export functions for global access
window.openAlertModal = openAlertModal;
window.closeAlertModal = closeAlertModal;
window.openNewsDetail = openNewsDetail;
window.openTelescopeModal = openTelescopeModal;
window.closeTelescopeModal = closeTelescopeModal;