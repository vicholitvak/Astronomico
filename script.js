// ===== TOURS ASTRONÓMICOS ATACAMA - JAVASCRIPT =====
// Main JavaScript functionality for astronomical tours website - v5.5

// ===== TYPEWRITER EFFECT =====
function initTypewriter() {
    // Typewriter is disabled for CLS prevention
    // Text loads immediately to prevent layout shifts
    return;
    
    let index = 0;
    textElement.textContent = ''; // Clear any existing text
    
    function typeChar() {
        if (index < text.length) {
            textElement.textContent += text.charAt(index);
            index++;
            setTimeout(typeChar, 60);
        } else {
            setTimeout(() => {
                if (cursorElement) cursorElement.style.display = 'none';
            }, 2000);
        }
    }
    
    setTimeout(typeChar, 800);
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initLanguageToggle();
    // Defer testimonial loading to avoid blocking LCP
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => initTestimonialSlider(), { timeout: 3000 });
    } else {
        setTimeout(initTestimonialSlider, 1500);
    }
    initBookingForm();
    initSmoothScrolling();
    initScrollEffects();
    initDatePicker();
    initQuickBooking();
    initAnimations();
    initTypewriter();
    lowerPriorityForLazyImages();

    // Defer telescope gallery initialization until section is near viewport
    const telescopeSection = document.querySelector('#telescopio');
    if (telescopeSection && 'IntersectionObserver' in window) {
        const telObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    initTelescopeGallery();
                    obs.disconnect();
                }
            });
        }, { rootMargin: '200px 0px' });
        telObserver.observe(telescopeSection);
    } else {
        // Fallback
        setTimeout(() => initTelescopeGallery(), 300);
    }
});

// Lower network/decoding priority for non-critical images
function lowerPriorityForLazyImages() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(img => {
        if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async');
        if (!img.getAttribute('fetchpriority')) img.setAttribute('fetchpriority', 'low');
    });
}

// ===== NAVIGATION FUNCTIONALITY =====
function initNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');
    const header = document.querySelector('.header');

    // Mobile menu toggle
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            menuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });
    }

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (menuToggle && navMenu) {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    });

    // Header scroll effect without layout reads
    let lastScrollY = 0;
    let ticking = false;
    
    function updateHeader() {
        const currentScrollY = window.pageYOffset;
        
        if (header) {
            if (currentScrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        
        lastScrollY = currentScrollY;
        ticking = false;
    }
    
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', onScroll, { passive: true });

    // Highlight active nav via IntersectionObserver (no forced layout)
    const sections = document.querySelectorAll('section[id]');
    const navLinkMap = new Map(
        [...sections].map(s => [s.id, document.querySelector(`a[href="#${s.id}"]`)])
    );
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.id;
            const link = navLinkMap.get(id);
            if (!link) return;
            if (entry.isIntersecting) {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => observer.observe(s));
}

// ===== LANGUAGE TOGGLE =====
function initLanguageToggle() {
    const langToggle = document.getElementById('lang-toggle');
    const currentLangSpan = document.getElementById('current-lang');

    // Exit if elements don't exist (prevent null reference errors)
    if (!langToggle || !currentLangSpan) {
        console.log('Language toggle elements not found, skipping initialization');
        return;
    }

    // Get navigation links for translation
    const navLinks = document.querySelectorAll('.nav-links a');

    const translations = {
        es: {
            // Page meta
            'page-title': 'Tours Astronómicos San Pedro de Atacama | Observación de Estrellas | Atacama Dark Sky',
            'meta-description': 'Tours astronómicos en San Pedro de Atacama con telescopio inteligente. Observación de estrellas, astrofotografía y experiencias únicas en el cielo más claro del mundo.',
            
            // Navigation
            'Inicio': 'Inicio',
            'Sobre Nosotros': 'Sobre Nosotros', 
            'Tours': 'Tours',
            'Telescopio': 'Telescopio',
            'Reservas': 'Reservas',
            'Contacto': 'Contacto',
            'Reserva Ahora': 'Reserva Ahora',
            
            // Hero Section
            'hero-title': ['Atacama Dark Skies', 'El Cielo Más Puro del Mundo', 'en San Pedro de Atacama'],
            'hero-subtitle': 'Tours astronómicos en San Pedro de Atacama con telescopio inteligente. Observación de estrellas, astrofotografía y experiencias únicas bajo el cielo más oscuro del mundo.',
            'btn-reserve': 'Reserva Tu Tour',
            'btn-see-tours': 'Ver Tours',
            
            // About Section
            'about-title': 'Vicente Litvak',
            'about-subtitle': 'Sobre mí',
            'about-paragraphs': [
                'Con más de 6 años guiando tours astronómicos en el Desierto de Atacama, he tenido el privilegio de compartir con miles de personas la magia del universo desde los cielos más puros del mundo.',
                'Mi pasión por la astronomía comenzó desde pequeño, y hoy combino conocimiento científico con tecnología de vanguardia para crear experiencias inolvidables bajo las estrellas.',
                'Utilizamos telescopios inteligentes de última generación que permiten capturar nebulosas, galaxias y cúmulos estelares a color en una definición impresionante que podrás llevarte en forma de foto digital en tu celular.'
            ],
            
            // Tours Section
            'Nuestros Tours Astronómicos': 'Nuestros Tours Astronómicos',
            'Experiencias únicas bajo el cielo más claro del mundo': 'Experiencias únicas bajo el cielo más claro del mundo',
            'tour-1-title': 'Tour Astronómico Regular',
            'tour-1-desc': 'Observación a ojo desnudo con puntero láser para identificar constelaciones y planetas visibles e introducir los objetos del espacio profundo. Luego exploramos esas nebulosas y cúmulos estelares con telescopio. Termina con un cóctel mirando las estrellas mientras compartes con turistas de todo el mundo.',
            'tour-2-title': 'Tour de Astrofotografía Especializado',
            'tour-2-desc': 'Aprende técnicas profesionales de astrofotografía con equipos especializados en distintas locaciones alrededor de San Pedro de Atacama.',
            'tour-3-title': 'Tour Privado VIP',
            'tour-3-desc': 'Experiencia exclusiva totalmente personalizada para ti y tu grupo con horario flexible y telescopio dedicado.',
            'Reservar Tour': 'Reservar Tour',
            'Más Popular': 'Más Popular',
            'Incluye:': 'Incluye:',
            
            // Testimonials
            'testimonials-title': 'Lo que dicen nuestros visitantes',
            
            // Contact Section
            'contact-title': 'Contáctanos',
            'contact-form-title': 'Envíanos un mensaje',
            'placeholder-tu-nombre': 'Tu nombre',
            'placeholder-tu-email': 'Tu email',
            'placeholder-tu-teléfono': 'Tu teléfono',
            'placeholder-tu-mensaje': 'Tu mensaje',
            'label-calendar': 'Selecciona Fecha y Hora',
            
            // Footer
            'footer-atacama-nightsky': 'Atacama NightSky',
            'footer-enlaces-rápidos': 'Enlaces Rápidos',
            'footer-servicios': 'Servicios',
            'footer-tour-regular': 'Tour Regular',
            'footer-tour-privado-vip': 'Tour Privado VIP',
            'footer-astrofotografía': 'Astrofotografía',
            'footer-reservas': 'Reservas'
        },
        en: {
            // Page meta
            'page-title': 'Stargazing Tours San Pedro de Atacama | Atacama Dark Sky',
            'meta-description': 'Atacama NightSky: Guided tours with smart telescope in the clearest desert in the world. Capture nebulae and galaxies in color. Star observation, astrophotography and unique experiences.',
            
            // Navigation
            'Inicio': 'Home',
            'Sobre Nosotros': 'About Us',
            'Tours': 'Tours',
            'Telescopio': 'Telescope',
            'Reservas': 'Bookings',
            'Contacto': 'Contact',
            'Reserva Ahora': 'Book Now',

            // Hero Section
            'hero-title': ['Atacama Dark Skies', 'The Purest Sky in the World', 'in San Pedro de Atacama'],
            'hero-subtitle': 'Stargazing tours in San Pedro de Atacama with smart telescope. Star observation, astrophotography and unique experiences under the darkest sky on Earth.',
            'btn-reserve': 'Book Your Tour',
            'btn-see-tours': 'View Tours',

            // About Section
            'about-title': 'Vicente Litvak',
            'about-subtitle': 'About Me',
            'about-paragraphs': [
                'With more than 6 years guiding astronomical tours in the Atacama Desert, I have had the privilege of sharing with thousands of people the magic of the universe from the purest skies in the world.',
                'My passion for astronomy began as a child, and today I combine scientific knowledge with cutting-edge technology to create unforgettable experiences under the stars.',
                'We use next-generation smart telescopes that allow capturing nebulae, galaxies and star clusters in color with impressive definition that you can take with you as a digital photo on your phone.'
            ],
            
            // Tours Section
            'Nuestros Tours Astronómicos': 'Our Astronomical Tours',
            'Experiencias únicas bajo el cielo más claro del mundo': 'Unique experiences under the clearest sky in the world',
            'tour-1-title': 'Regular Astronomical Tour',
            'tour-1-desc': 'Naked eye observation with laser pointer to identify constellations and visible planets, introducing deep space objects. Then we explore those nebulae and star clusters through the telescope. Ends with a cocktail gazing at the stars while sharing with tourists from around the world.',
            'tour-2-title': 'Specialized Astrophotography Tour',
            'tour-2-desc': 'Learn professional astrophotography techniques with specialized equipment in different locations around San Pedro de Atacama.',
            'tour-3-title': 'Private VIP Tour',
            'tour-3-desc': 'Totally personalized exclusive experience for you and your group with flexible schedule and dedicated telescope.',
            'Reservar Tour': 'Book Tour',
            'Más Popular': 'Most Popular',
            'Incluye:': 'Includes:',
            
            // Testimonials
            'testimonials-title': 'What Our Visitors Say',
            
            // Contact Section
            'contact-title': 'Contact Us',
            'contact-form-title': 'Send Us a Message',
            'placeholder-tu-nombre': 'Your name',
            'placeholder-tu-email': 'Your email',
            'placeholder-tu-teléfono': 'Your phone',
            'placeholder-tu-mensaje': 'Your message',
            'label-calendar': 'Select Date and Time',
            
            // Footer
            'footer-atacama-nightsky': 'Atacama NightSky',
            'footer-enlaces-rápidos': 'Quick Links',
            'footer-servicios': 'Services',
            'footer-tour-regular': 'Regular Tour',
            'footer-tour-privado-vip': 'Private VIP Tour',
            'footer-astrofotografía': 'Astrophotography',
            'footer-reservas': 'Bookings'
        },
        pt: {
            // Page meta
            'page-title': 'Passeios Astronômicos San Pedro de Atacama | Observação de Estrelas | Atacama Dark Sky',
            'meta-description': 'Atacama NightSky: Passeios guiados com telescópio inteligente no deserto mais claro do mundo. Capture nebulosas e galáxias em cores. Observação de estrelas, astrofotografia e experiências únicas.',
            
            // Navigation
            'Inicio': 'Início',
            'Sobre Nosotros': 'Sobre Nós',
            'Tours': 'Passeios',
            'Telescopio': 'Telescópio',
            'Reservas': 'Reservas',
            'Contacto': 'Contato',
            'Reserva Ahora': 'Reserve Agora',

            // Hero Section
            'hero-title': ['Atacama Dark Skies', 'O Céu Mais Puro do Mundo', 'em San Pedro de Atacama'],
            'hero-subtitle': 'Passeios astronômicos em San Pedro de Atacama com telescópio inteligente. Observação de estrelas, astrofotografia e experiências únicas sob o céu mais escuro do mundo.',
            'btn-reserve': 'Reserve Seu Passeio',
            'btn-see-tours': 'Ver Passeios',

            // About Section
            'about-title': 'Vicente Litvak',
            'about-subtitle': 'Sobre Mim',
            'about-paragraphs': [
                'Com mais de 6 anos guiando passeios astronômicos no Deserto de Atacama, tive o privilégio de compartilhar com milhares de pessoas a magia do universo desde os céus mais puros do mundo.',
                'Minha paixão pela astronomia começou desde pequeno, e hoje combino conhecimento científico com tecnologia de ponta para criar experiências inesquecíveis sob as estrelas.',
                'Utilizamos telescópios inteligentes de última geração que permitem capturar nebulosas, galáxias e aglomerados estelares em cores com uma definição impressionante que você poderá levar em forma de foto digital no seu celular.'
            ],
            
            // Tours Section
            'Nuestros Tours Astronómicos': 'Nossos Passeios Astronômicos',
            'Experiencias únicas bajo el cielo más claro del mundo': 'Experiências únicas sob o céu mais claro do mundo',
            'tour-1-title': 'Passeio Astronômico Regular',
            'tour-1-desc': 'Observação a olho nu com ponteiro laser para identificar constelações e planetas visíveis, introduzindo os objetos do espaço profundo. Depois exploramos essas nebulosas e aglomerados estelares através do telescópio. Termina com um coquetel olhando as estrelas enquanto compartilha com turistas de todo o mundo.',
            'tour-2-title': 'Passeio de Astrofotografia Especializado',
            'tour-2-desc': 'Aprenda técnicas profissionais de astrofotografia com equipamentos especializados em diferentes locais ao redor de San Pedro de Atacama.',
            'tour-3-title': 'Passeio Privado VIP',
            'tour-3-desc': 'Experiência exclusiva totalmente personalizada para você e seu grupo com horário flexível e telescópio dedicado.',
            'Reservar Tour': 'Reservar Passeio',
            'Más Popular': 'Mais Popular',
            'Incluye:': 'Inclui:',
            
            // Testimonials
            'testimonials-title': 'O Que Nossos Visitantes Dizem',
            
            // Contact Section
            'contact-title': 'Entre em Contato',
            'contact-form-title': 'Envie-nos uma Mensagem',
            'placeholder-tu-nombre': 'Seu nome',
            'placeholder-tu-email': 'Seu email',
            'placeholder-tu-teléfono': 'Seu telefone',
            'placeholder-tu-mensaje': 'Sua mensagem',
            'label-calendar': 'Selecione Data e Hora',
            
            // Footer
            'footer-atacama-nightsky': 'Atacama NightSky',
            'footer-enlaces-rápidos': 'Links Rápidos',
            'footer-servicios': 'Serviços',
            'footer-tour-regular': 'Passeio Regular',
            'footer-tour-privado-vip': 'Passeio Privado VIP',
            'footer-astrofotografía': 'Astrofotografia',
            'footer-reservas': 'Reservas'
        },
    };
    
    // Initialize to current language
    let currentLang = document.documentElement.lang || 'es';
    currentLangSpan.textContent = currentLang.toUpperCase();
    
    // data-i18n translations mapping
    const i18n = {
        es: {
            'nav.home': 'Inicio',
            'nav.about': 'Sobre Nosotros',
            'nav.tours': 'Tours',
            'nav.telescope': 'Telescopio',
            'nav.booking': 'Reservas',
            'nav.contact': 'Contacto',
            'hero.cta': 'Reserva Ahora',
            'hero.title1': 'Atacama Dark Skies',
            'hero.title2': 'El cielo más puro del mundo',
            'hero.title3': 'En San Pedro de Atacama',
            'hero.subtitle': 'Tours astronómicos en San Pedro de Atacama con telescopio inteligente. Observación de estrellas, astrofotografía y experiencias únicas bajo el cielo más oscuro del mundo.',
            'hero.btn_book': 'Reserva Tu Tour',
            'hero.btn_tours': 'Ver Tours',
            'about.title': 'Vicente Litvak',
            'about.subtitle': 'Sobre mi',
            'about.p1': 'Mi pasión por la astronomía comenzó observando las estrellas desde niño, pero fue aquí en San Pedro de Atacama donde todo cobró sentido. <strong>Vine a conectarme con el universo, y en el proceso de descubrirlo, me descubrí a mí mismo.</strong>',
            'about.p2': 'El desierto tiene esa magia: te desnuda de lo superficial y te enfrenta con lo esencial. Bajo este cielo, el más limpio del planeta, entendí que mi propósito no era solo observar las estrellas, sino ser un puente entre el cosmos y las personas. <em>Compartir el universo se convirtió en mi forma de vida.</em>',
            'about.p3': 'Cada noche, cuando alguien mira por primera vez los anillos de Saturno o una galaxia a millones de años luz, veo en sus ojos el mismo asombro que me transformó a mí. No uso telescopios solo para magnificar el cielo—los uso para magnificar la consciencia de que somos polvo de estrellas contemplándose a sí mismo.',
            'about.p4': 'Mi invitación es simple: ven a mirar las estrellas, pero prepárate para encontrarte. Porque cuando entiendes que cada átomo de tu cuerpo se forjó en el corazón de una estrella, <strong>el universo deja de ser algo que observas y se convierte en algo que eres.</strong>',
            'tours.title': 'Nuestros Tours Astronómicos',
            'tours.subtitle': 'Experiencias únicas bajo el cielo más claro del mundo',
            'tours.regular.badge': 'Más Popular',
            'tours.regular.title': 'Tour Astronómico Regular',
            'tours.regular.desc1': '<strong>Una noche para entender el universo, no solo mirarlo.</strong> Comenzamos con una charla astronómica bajo el cielo más limpio del planeta. Con un puntero láser te guío por constelaciones y te cuento las historias detrás de cada una.',
            'tours.regular.desc2': 'Después del cóctel bajo las estrellas, pasamos a los telescopios: uno <strong>óptico para planetas</strong> —los anillos de Saturno, los cráteres de la Luna— y otro <strong>digital para nebulosas y galaxias</strong> a millones de años luz, con colores que no creerás. Terminamos con una <strong>sesión de fotos</strong> para que te lleves el recuerdo de esta noche.',
            'tours.regular.btn': 'Reservar',
            'tours.photo.title': 'Tour de Astrofotografía Especializado',
            'tours.photo.desc1': '<strong>La foto que siempre quisiste: tú bajo la Vía Láctea en el desierto más seco del mundo.</strong> Te llevo a locaciones que solo conocemos los locales — formaciones rocosas ancestrales, paisajes que parecen de otro planeta. Cielo Bortle 1-2, sin contaminación lumínica.',
            'tours.photo.desc2': 'Trabajamos juntos en tu cámara: configuración, composición, técnicas de larga exposición. Te enseño a capturar la Vía Láctea, hacer retratos nocturnos con luz pintada, y sacar el máximo a tu equipo. Si no tienes cámara profesional, no hay problema — con un buen celular también logramos resultados que te van a sorprender.',
            'tours.photo.btn': 'Reservar',
            'tours.private.title': 'Tour Privado VIP',
            'tours.private.desc1': '<strong>Algunos momentos merecen tener el universo como único testigo.</strong> Una propuesta de matrimonio, un aniversario, o simplemente querer la experiencia completa sin compartirla con extraños. Solo tú, tu grupo, y el cielo más limpio del planeta.',
            'tours.private.desc2': 'Incluye todo lo del tour regular —charla con láser, telescopios, fotos— pero con atención exclusiva y el ritmo que ustedes quieran. Vino chileno bajo Saturno (navegado en invierno), más tiempo en lo que más les interese, ubicación privada. <strong>Disponible en 2 horarios:</strong> si el primer turno está ocupado, puedes reservar el segundo (00:00). <strong>El desierto es suyo por una noche.</strong>',
            'tours.private.btn': 'Reservar',
            'tours.includes': 'Incluye:',
            'testimonials.title': 'Lo que dicen nuestros viajeros',
            'testimonials.subtitle': 'Historias reales bajo las estrellas',
            'contact.title': 'Contacto y Ubicación',
            'booking.title': 'Reserva Tu Experiencia Astronómica',
            'booking.subtitle': 'Selecciona tu fecha, completa tus datos y te confirmaremos en 24 horas',
            'booking.selectDate': 'Selecciona tu Fecha *',
            'booking.selectDateMsg': '👆 Selecciona una fecha en el calendario para continuar',
            'booking.yourData': 'Datos de tu Reserva',
            'booking.persons': 'Número de Personas *',
            'booking.selectQuantity': 'Selecciona cantidad',
            'booking.tourType': 'Tipo de Tour *',
            'booking.selectTour': 'Selecciona tipo de tour',
            'booking.tourRegular': 'Tour Regular (Grupo)',
            'booking.tourPrivate': 'Tour Privado (Solo tu grupo)',
            'booking.tourAstro': 'Tour Astrofotográfico (Especializado)',
            'booking.name': 'Nombre Completo *',
            'booking.email': 'Email *',
            'booking.phone': 'Teléfono / WhatsApp *',
            'booking.accommodation': 'Hotel / Hospedaje',
            'booking.message': 'Mensaje o solicitud especial',
            'booking.submit': 'Confirmar Reserva',
            'footer.desc': 'Descubre el universo en el cielo más claro del mundo. Experiencias astronómicas inolvidables en San Pedro de Atacama.',
            'info.availability': 'Disponible',
            'info.full': 'Agotado',
            'info.selected': 'Seleccionado'
        },
        en: {
            'nav.home': 'Home',
            'nav.about': 'About Us',
            'nav.tours': 'Tours',
            'nav.telescope': 'Telescope',
            'nav.booking': 'Bookings',
            'nav.contact': 'Contact',
            'hero.cta': 'Book Now',
            'hero.title1': 'Atacama Dark Skies',
            'hero.title2': 'The Purest Sky in the World',
            'hero.title3': 'In San Pedro de Atacama',
            'hero.subtitle': 'Stargazing tours in San Pedro de Atacama with smart telescope. Star observation, astrophotography and unique experiences under the darkest sky on Earth.',
            'hero.btn_book': 'Book Your Tour',
            'hero.btn_tours': 'View Tours',
            'about.title': 'Vicente Litvak',
            'about.subtitle': 'About Me',
            'about.p1': 'I am Vicente Litvak, passionate astronomical guide with over 6 years of experience in the Atacama Desert.',
            'about.p2': 'My passion for astronomy began observing the stars as a child. Today I combine scientific knowledge with cutting-edge technology.',
            'about.p3': 'Each tour is unique because we use next-generation smart telescopes.',
            'about.p4': 'I have guided more than 3,000 visitors from around the world.',
            'about.quote': '"Every night under the Atacama stars reminds me why I chose this path"',
            'tours.title': 'Our Astronomical Tours',
            'tours.subtitle': 'Unique experiences under the clearest sky in the world',
            'tours.regular.badge': 'Most Popular',
            'tours.regular.title': 'Regular Astronomical Tour',
            'tours.regular.desc1': 'Immerse yourself in the universe with our most popular experience.',
            'tours.regular.desc2': 'Then we explore those nebulae and star clusters through the telescope.',
            'tours.regular.btn': 'Book',
            'tours.photo.title': 'Specialized Astrophotography Tour',
            'tours.photo.desc1': 'Designed for photographers and enthusiasts who want to capture the majesty of the cosmos.',
            'tours.photo.desc2': 'Learn professional astrophotography techniques with specialized equipment.',
            'tours.photo.btn': 'Book',
            'tours.private.title': 'Private VIP Tour',
            'tours.private.desc1': 'The most exclusive and personalized astronomical experience.',
            'tours.private.desc2': 'Perfect for couples, families or groups seeking an intimate experience.',
            'tours.private.btn': 'Book',
            'tours.includes': 'Includes:',
            'testimonials.title': 'What Our Travelers Say',
            'testimonials.subtitle': 'Real stories under the stars',
            'contact.title': 'Contact and Location',
            'booking.title': 'Book Your Astronomical Experience',
            'booking.subtitle': 'Select your date, complete your details and we will confirm within 24 hours',
            'booking.selectDate': 'Select Your Date *',
            'booking.selectDateMsg': '👆 Select a date on the calendar to continue',
            'booking.yourData': 'Your Booking Details',
            'booking.persons': 'Number of People *',
            'booking.selectQuantity': 'Select quantity',
            'booking.tourType': 'Tour Type *',
            'booking.selectTour': 'Select tour type',
            'booking.tourRegular': 'Regular Tour (Group)',
            'booking.tourPrivate': 'Private Tour (Your group only)',
            'booking.tourAstro': 'Astrophotography Tour (Specialized)',
            'booking.name': 'Full Name *',
            'booking.email': 'Email *',
            'booking.phone': 'Phone / WhatsApp *',
            'booking.accommodation': 'Hotel / Accommodation',
            'booking.message': 'Message or special request',
            'booking.submit': 'Confirm Booking',
            'footer.desc': 'Discover the universe under the clearest sky in the world. Unforgettable astronomical experiences in San Pedro de Atacama.',
            'info.availability': 'Available',
            'info.full': 'Sold Out',
            'info.selected': 'Selected'
        },
        pt: {
            'nav.home': 'Início',
            'nav.about': 'Sobre Nós',
            'nav.tours': 'Tours',
            'nav.telescope': 'Telescópio',
            'nav.booking': 'Reservas',
            'nav.contact': 'Contato',
            'hero.cta': 'Reserve Agora',
            'hero.title1': 'Atacama Dark Skies',
            'hero.title2': 'O céu mais puro do mundo',
            'hero.title3': 'Em San Pedro de Atacama',
            'hero.subtitle': 'Passeios astronômicos em San Pedro de Atacama com telescópio inteligente. Observação de estrelas, astrofotografia e experiências únicas sob o céu mais escuro do mundo.',
            'hero.btn_book': 'Reserve Seu Tour',
            'hero.btn_tours': 'Ver Tours',
            'about.title': 'Vicente Litvak',
            'about.subtitle': 'Sobre Mim',
            'about.p1': 'Sou Vicente Litvak, guia astronômico apaixonado com mais de 6 anos de experiência no Deserto de Atacama.',
            'about.p2': 'Minha paixão pela astronomia começou observando as estrelas quando criança. Hoje combino conhecimento científico com tecnologia de ponta.',
            'about.p3': 'Cada tour é único porque usamos telescópios inteligentes de última geração.',
            'about.p4': 'Já guiei mais de 3.000 visitantes de todo o mundo.',
            'about.quote': '"Cada noite sob as estrelas de Atacama me lembra por que escolhi este caminho"',
            'tours.title': 'Nossos Tours Astronômicos',
            'tours.subtitle': 'Experiências únicas sob o céu mais limpo do mundo',
            'tours.regular.badge': 'Mais Popular',
            'tours.regular.title': 'Tour Astronômico Regular',
            'tours.regular.desc1': 'Mergulhe no universo com nossa experiência mais popular.',
            'tours.regular.desc2': 'Depois exploramos essas nebulosas e aglomerados estelares através do telescópio.',
            'tours.regular.btn': 'Reservar',
            'tours.photo.title': 'Tour de Astrofotografia Especializado',
            'tours.photo.desc1': 'Projetado para fotógrafos e entusiastas que desejam capturar a majestade do cosmos.',
            'tours.photo.desc2': 'Aprenda técnicas profissionais de astrofotografia com equipamentos especializados.',
            'tours.photo.btn': 'Reservar',
            'tours.private.title': 'Tour Privado VIP',
            'tours.private.desc1': 'A experiência astronômica mais exclusiva e personalizada.',
            'tours.private.desc2': 'Perfeito para casais, famílias ou grupos que buscam uma experiência íntima.',
            'tours.private.btn': 'Reservar',
            'tours.includes': 'Inclui:',
            'testimonials.title': 'O Que Nossos Viajantes Dizem',
            'testimonials.subtitle': 'Histórias reais sob as estrelas',
            'contact.title': 'Contato e Localização',
            'booking.title': 'Reserve Sua Experiência Astronômica',
            'booking.subtitle': 'Selecione sua data, preencha seus dados e confirmaremos em 24 horas',
            'booking.selectDate': 'Selecione Sua Data *',
            'booking.selectDateMsg': '👆 Selecione uma data no calendário para continuar',
            'booking.yourData': 'Dados da Sua Reserva',
            'booking.persons': 'Número de Pessoas *',
            'booking.selectQuantity': 'Selecione quantidade',
            'booking.tourType': 'Tipo de Tour *',
            'booking.selectTour': 'Selecione tipo de tour',
            'booking.tourRegular': 'Tour Regular (Grupo)',
            'booking.tourPrivate': 'Tour Privado (Só seu grupo)',
            'booking.tourAstro': 'Tour de Astrofotografia (Especializado)',
            'booking.name': 'Nome Completo *',
            'booking.email': 'Email *',
            'booking.phone': 'Telefone / WhatsApp *',
            'booking.accommodation': 'Hotel / Hospedagem',
            'booking.message': 'Mensagem ou pedido especial',
            'booking.submit': 'Confirmar Reserva',
            'footer.desc': 'Descubra o universo sob o céu mais limpo do mundo. Experiências astronômicas inesquecíveis em San Pedro de Atacama.',
            'info.availability': 'Disponível',
            'info.full': 'Esgotado',
            'info.selected': 'Selecionado'
        }
    };

    function updateContent(lang) {
        // Update page meta tags
        document.title = translations[lang]['page-title'];
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', translations[lang]['meta-description']);
        }

        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (i18n[lang] && i18n[lang][key]) {
                element.innerHTML = i18n[lang][key];
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        console.log('Language changed to:', lang);
    }
    
    langToggle.addEventListener('click', function() {
        currentLang = currentLang === 'es' ? 'en' : currentLang === 'en' ? 'pt' : 'es';
        currentLangSpan.textContent = currentLang.toUpperCase();
        updateContent(currentLang);
    });
    
    // Initial content update
    updateContent(currentLang);
}

// ===== TESTIMONIAL SLIDER =====
function initTestimonialSlider() {
    // Load reviews from API first
    loadReviewsForTestimonials();
}

async function loadReviewsForTestimonials() {
    const slider = document.getElementById('testimonialSlider');
    const summaryDiv = document.getElementById('reviewsRatingSummary');

    try {
        // Fetch approved reviews
        const response = await fetch('/api/reviews?status=approved&limit=10');
        const data = await response.json();

        // Fetch stats
        const statsResponse = await fetch('/api/reviews?stats=true');
        const stats = await statsResponse.json();

        if (data.reviews && data.reviews.length > 0) {
            // Render reviews
            renderTestimonials(slider, data.reviews);

            // Show rating summary
            if (stats.average_rating && stats.total_approved > 0) {
                const avgRating = parseFloat(stats.average_rating).toFixed(1);
                summaryDiv.innerHTML = `
                    <div class="rating-stars">${generateStars(Math.round(stats.average_rating))}</div>
                    <span class="rating-text">${avgRating} / 5 basado en ${stats.total_approved} reseñas verificadas</span>
                `;
                summaryDiv.style.display = 'flex';

                // Update hero trust indicators
                const heroReviewCount = document.getElementById('heroReviewCount');
                const heroStars = document.getElementById('heroStars');
                if (heroReviewCount) {
                    const reviewText = stats.total_approved === 1 ? 'reseña' : 'reseñas';
                    heroReviewCount.textContent = `${stats.total_approved} ${reviewText}`;
                }
                if (heroStars && avgRating) {
                    // Generate star rating for hero
                    const fullStars = Math.floor(avgRating);
                    let starsHtml = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
                    heroStars.innerHTML = starsHtml;
                }
            }

            // Initialize slider functionality
            initSliderControls();
        } else {
            // Fallback to static testimonials
            renderFallbackTestimonials(slider);
            initSliderControls();
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        renderFallbackTestimonials(slider);
        initSliderControls();
    }
}

function generateStars(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
        stars += i < rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return stars;
}

function renderTestimonials(container, reviews) {
    container.innerHTML = reviews.map((review, index) => `
        <div class="testimonial-slide${index === 0 ? ' active' : ''}">
            <div class="testimonial-content">
                <div class="stars">${generateStars(review.overall_rating)}</div>
                <blockquote>"${review.comment || 'Excelente experiencia astronómica en Atacama.'}"</blockquote>
                <div class="testimonial-author">
                    <div class="author-info">
                        <h4>${review.reviewer_name}</h4>
                        <span>${review.reviewer_country || 'Cliente verificado'}</span>
                        <span class="review-tour-type">${getTourTypeName(review.tour_type)}</span>
                        ${review.source === 'getyourguide' ? '<span class="review-source-badge" title="Reseña verificada en GetYourGuide">✓ GetYourGuide</span>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getTourTypeName(tourType) {
    const types = {
        'regular': '🔭 Tour Regular',
        'private': '✨ Tour Privado',
        'astrophoto': '📷 Astrofotografía'
    };
    return types[tourType] || '🔭 Tour';
}

function renderFallbackTestimonials(container) {
    container.innerHTML = `
        <div class="testimonial-slide active">
            <div class="testimonial-content">
                <div class="stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                <blockquote>"Increíble experiencia. Vicente nos llevó a un lugar alejado, sin contaminación lumínica. Vimos la Nebulosa de Orión en colores que jamás imaginé."</blockquote>
                <div class="testimonial-author">
                    <div class="author-info">
                        <h4>Andrea M. y familia</h4>
                        <span>Buenos Aires, Argentina</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="testimonial-slide">
            <div class="testimonial-content">
                <div class="stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                <blockquote>"He hecho tours astronómicos en Hawái, Islas Canarias y Nueva Zelanda. Este fue lejos el mejor."</blockquote>
                <div class="testimonial-author">
                    <div class="author-info">
                        <h4>Marcus & Emma</h4>
                        <span>Ámsterdam, Países Bajos</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="testimonial-slide">
            <div class="testimonial-content">
                <div class="stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                <blockquote>"Pedí matrimonio bajo las estrellas de Atacama. Vicente organizó todo perfecto. Un recuerdo para siempre."</blockquote>
                <div class="testimonial-author">
                    <div class="author-info">
                        <h4>Felipe G.</h4>
                        <span>Ciudad de México, México</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initSliderControls() {
    const slides = document.querySelectorAll('.testimonial-slide');
    const prevBtn = document.querySelector('.testimonial-prev');
    const nextBtn = document.querySelector('.testimonial-next');
    let currentIndex = 0;

    if (slides.length === 0) return;

    function showSlide(index) {
        slides.forEach((slide, idx) => {
            slide.style.transform = `translateX(${(idx - index) * 100}%)`;
            // Toggle active class for visibility (CSS uses opacity/visibility)
            if (idx === index) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(currentIndex);
    }

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    // Auto-slide every 8 seconds
    setInterval(nextSlide, 8000);

    // Initial display
    showSlide(currentIndex);
}

// ===== BOOKING FORM =====
function initBookingForm() {
    const bookingForm = document.getElementById('booking-form');
    const dateInput = document.getElementById('fecha');
    const timeInput = document.getElementById('hora');
    const nameInput = document.getElementById('nombre');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('telefono');
    const messageInput = document.getElementById('mensaje');
    const submitBtn = document.getElementById('submit-btn');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    
    // Initialize date picker with blocked dates
    if (flatpickr) {
        // Load blocked dates and initialize picker
        fetch('/api/admin-data?type=blocked')
            .then(res => res.json())
            .then(data => {
                const blockedDates = data.success ? data.data.map(d => d.blocked_date.split('T')[0]) : [];

                flatpickr(dateInput, {
                    enableTime: false,
                    dateFormat: 'Y-m-d',
                    minDate: 'today',
                    locale: {
                        firstDayOfWeek: 1
                    },
                    disable: blockedDates,
                    onDayCreate: function(dObj, dStr, fp, dayElem) {
                        const dateStr = dayElem.dateObj.toISOString().split('T')[0];
                        if (blockedDates.includes(dateStr)) {
                            dayElem.classList.add('blocked-date');
                            dayElem.title = 'Fecha no disponible';
                        }
                    }
                });
            })
            .catch(() => {
                // Fallback without blocked dates
                flatpickr(dateInput, {
                    enableTime: false,
                    dateFormat: 'Y-m-d',
                    minDate: 'today',
                    locale: { firstDayOfWeek: 1 }
                });
            });
    }
    
    // Form submission handler
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Simple client-side validation
        if (!nameInput.value || !emailInput.value || !phoneInput.value || !messageInput.value) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Por favor, completa todos los campos.';
            return;
        } else {
            errorMessage.style.display = 'none';
        }
        
        // Simulate successful submission
        successMessage.style.display = 'block';
        successMessage.textContent = '¡Reserva enviada con éxito!';
        
        // Reset form fields
        bookingForm.reset();
        
        // Close form after 3 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    });
}

// ===== SMOOTH SCROLLING =====
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== SCROLL EFFECTS =====
function initScrollEffects() {
    const sections = document.querySelectorAll('section[data-scroll]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const section = entry.target;
                const effect = section.getAttribute('data-scroll');
                
                section.classList.add('animate');
                
                // Remove class after animation ends (for re-triggering)
                section.addEventListener('animationend', () => {
                    section.classList.remove('animate');
                }, { once: true });
            }
        });
    }, { threshold: 0.1 });
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

// ===== DATE PICKER =====
function initDatePicker() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    
    dateInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.setAttribute('type', 'date');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.setAttribute('type', 'text');
            }
        });
    });
}

// ===== QUICK BOOKING =====
function initQuickBooking() {
    const quickBookBtn = document.getElementById('quick-book-btn');
    const quickBookForm = document.getElementById('quick-booking-form');
    const quickBookSuccess = document.getElementById('quick-booking-success');
    
    quickBookBtn.addEventListener('click', function() {
        quickBookForm.scrollIntoView({ behavior: 'smooth' });
    });
    
    quickBookForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Simulate successful quick booking
        quickBookSuccess.style.display = 'block';
        
        // Reset form fields
        quickBookForm.reset();
        
        // Close success message after 3 seconds
        setTimeout(() => {
            quickBookSuccess.style.display = 'none';
        }, 3000);
    });
}

// ===== ANIMATIONS =====
function initAnimations() {
    // Add any additional animations here
}

// ===== TELESCOPE GALLERY =====
function initTelescopeGallery() {
    const gallery = document.querySelector('.telescope-gallery');
    const images = gallery.querySelectorAll('img');
    let currentIndex = 0;
    
    function showImage(index) {
        images.forEach((img, idx) => {
            img.style.display = idx === index ? 'block' : 'none';
        });
    }
    
    function nextImage() {
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
    }
    
    function prevImage() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage(currentIndex);
    }
    
    // Initial display
    showImage(currentIndex);
    
    // Auto-slide every 5 seconds
    setInterval(nextImage, 5000);
}

// ===== LANGUAGE SYSTEM =====

// Set language function
function setLanguage(lang) {
    if (!translations[lang]) {
        console.error('Language not found:', lang);
        return;
    }

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Update meta tags
    const titleTag = document.querySelector('title');
    if (titleTag) {
        titleTag.textContent = translations[lang]['page-title'] || 'Tours Astronómicos San Pedro de Atacama | Atacama Dark Sky';
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.content = translations[lang]['meta-description'] || 'Atacama NightSky: Tours guiados con telescopio inteligente en el desierto más claro del mundo.';
    }

    // Update navigation
    updateNavigation(lang);

    // Update hero section
    updateHeroSection(lang);

    // Update about section
    updateAboutSection(lang);

    // Update tours section
    updateToursSection(lang);

    // Update testimonials
    updateTestimonials(lang);

    // Update contact section
    updateContactSection(lang);

    // Update footer
    updateFooter(lang);

    // Update current language indicator
    const currentLangEl = document.getElementById('current-lang');
    if (currentLangEl) {
        currentLangEl.textContent = lang.toUpperCase();
    }

    // Save preference
    localStorage.setItem('preferred-language', lang);

    // Re-render calendar with new language
    if (typeof renderCalendar === 'function') {
        renderCalendar();
    }

    console.log('Language changed to:', lang);
}

// Update navigation function
function updateNavigation(lang) {
    const navItems = document.querySelectorAll('.nav-link');
    navItems.forEach(link => {
        const text = link.textContent.trim();
        if (translations[lang][text]) {
            link.textContent = translations[lang][text];
        }
    });

    // Update CTA button
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        const ctaText = ctaButton.textContent.trim();
        if (translations[lang][ctaText]) {
            ctaButton.textContent = translations[lang][ctaText];
        }
    }
}

// Update hero section
function updateHeroSection(lang) {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && translations[lang]['hero-title']) {
        const titleLines = heroTitle.querySelectorAll('.title-line');
        if (titleLines.length >= 3 && Array.isArray(translations[lang]['hero-title'])) {
            titleLines[0].textContent = translations[lang]['hero-title'][0];
            titleLines[1].textContent = translations[lang]['hero-title'][1];
            titleLines[2].textContent = translations[lang]['hero-title'][2];
        }
    }

    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle && translations[lang]['hero-subtitle']) {
        heroSubtitle.textContent = translations[lang]['hero-subtitle'];
    }

    const heroButtons = document.querySelectorAll('.hero-buttons .btn');
    heroButtons.forEach(btn => {
        const btnText = btn.textContent.trim();
        if (translations[lang][btnText]) {
            btn.textContent = translations[lang][btnText];
        }
    });
}

// Update about section
function updateAboutSection(lang) {
    const aboutTitle = document.querySelector('#nosotros .section-header h2');
    if (aboutTitle && translations[lang]['about-title']) {
        aboutTitle.textContent = translations[lang]['about-title'];
    }

    const aboutSubtitle = document.querySelector('#nosotros .section-subtitle');
    if (aboutSubtitle && translations[lang]['about-subtitle']) {
        aboutSubtitle.textContent = translations[lang]['about-subtitle'];
    }

    const aboutParagraphs = document.querySelectorAll('#nosotros .about-text p');
    if (aboutParagraphs.length >= 3 && translations[lang]['about-paragraphs']) {
        aboutParagraphs[0].textContent = translations[lang]['about-paragraphs'][0];
        aboutParagraphs[1].textContent = translations[lang]['about-paragraphs'][1];
        aboutParagraphs[2].textContent = translations[lang]['about-paragraphs'][2];
    }
}

// Update tours section
function updateToursSection(lang) {
    const toursTitle = document.querySelector('#tours .section-header h2');
    if (toursTitle && translations[lang]['Nuestros Tours Astronómicos']) {
        toursTitle.textContent = translations[lang]['Nuestros Tours Astronómicos'];
    }

    const toursSubtitle = document.querySelector('#tours .section-subtitle');
    if (toursSubtitle && translations[lang]['Experiencias únicas bajo el cielo más claro del mundo']) {
        toursSubtitle.textContent = translations[lang]['Experiencias únicas bajo el cielo más claro del mundo'];
    }

    // Update tour cards
    const tourCards = document.querySelectorAll('.tour-card');
    tourCards.forEach((card, index) => {
        const cardTitle = card.querySelector('h3');
        const cardDesc = card.querySelector('p');
        const cardButton = card.querySelector('.btn-tour');

        if (cardTitle && translations[lang][`tour-${index + 1}-title`]) {
            cardTitle.textContent = translations[lang][`tour-${index + 1}-title`];
        }

        if (cardDesc && translations[lang][`tour-${index + 1}-desc`]) {
            cardDesc.textContent = translations[lang][`tour-${index + 1}-desc`];
        }

        if (cardButton && translations[lang]['Reservar Tour']) {
            cardButton.textContent = translations[lang]['Reservar Tour'];
        }
    });
}

// Update testimonials
function updateTestimonials(lang) {
    const testimonialsTitle = document.querySelector('#testimonios h2');
    if (testimonialsTitle && translations[lang]['testimonials-title']) {
        testimonialsTitle.textContent = translations[lang]['testimonials-title'];
    }
}

// Update contact section
function updateContactSection(lang) {
    const contactTitle = document.querySelector('#contacto h2');
    if (contactTitle && translations[lang]['contact-title']) {
        contactTitle.textContent = translations[lang]['contact-title'];
    }

    const contactFormTitle = document.querySelector('#contacto .contact-form h3');
    if (contactFormTitle && translations[lang]['contact-form-title']) {
        contactFormTitle.textContent = translations[lang]['contact-form-title'];
    }

    // Update form labels and placeholders
    const formInputs = document.querySelectorAll('#contact-form input, #contact-form textarea, #contact-form select');
    formInputs.forEach(input => {
        const placeholder = input.placeholder;
        const label = input.previousElementSibling;

        if (placeholder && translations[lang][`placeholder-${placeholder.toLowerCase().replace(/\s+/g, '-')}`]) {
            input.placeholder = translations[lang][`placeholder-${placeholder.toLowerCase().replace(/\s+/g, '-')}`];
        }

        if (label && label.tagName === 'LABEL' && translations[lang][`label-${label.textContent.toLowerCase().replace(/\s+/g, '-')}`]) {
            label.textContent = translations[lang][`label-${label.textContent.toLowerCase().replace(/\s+/g, '-')}`];
        }
    });
}

// Update footer
function updateFooter(lang) {
    const footerSections = document.querySelectorAll('.footer-section h3');
    footerSections.forEach(section => {
        const text = section.textContent.trim();
        if (translations[lang][`footer-${text.toLowerCase().replace(/\s+/g, '-')}`]) {
            section.textContent = translations[lang][`footer-${text.toLowerCase().replace(/\s+/g, '-')}`];
        }
    });
}

// Add event listeners for language dropdown
document.addEventListener('DOMContentLoaded', function() {
    const langToggle = document.getElementById('lang-toggle');
    const langDropdown = document.getElementById('lang-dropdown');
    const langOptions = document.querySelectorAll('.lang-option');

    if (langToggle && langDropdown) {
        // Toggle dropdown on button click
        langToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            langDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!langToggle.contains(e.target)) {
                langDropdown.classList.remove('show');
            }
        });

        // Handle language selection
        langOptions.forEach(option => {
            option.addEventListener('click', function() {
                const selectedLang = this.getAttribute('data-lang');
                setLanguage(selectedLang);
                langDropdown.classList.remove('show');
            });
        });
    }

    // Load saved language preference
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang && translations[savedLang]) {
        setLanguage(savedLang);
    }

    // Defer dynamic testimonials to avoid blocking LCP
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => loadDynamicTestimonials(), { timeout: 4000 });
    } else {
        setTimeout(loadDynamicTestimonials, 2000);
    }
});

// ===== DYNAMIC TESTIMONIALS =====
async function loadDynamicTestimonials() {
    try {
        const response = await fetch('/api/reviews?status=approved&featured=true&limit=6');
        if (!response.ok) return;

        const data = await response.json();
        if (!data.reviews || data.reviews.length === 0) return;

        const slider = document.querySelector('.testimonial-slider');
        if (!slider) return;

        // Clear existing static slides
        slider.innerHTML = '';

        // Add dynamic reviews
        data.reviews.forEach((review, index) => {
            const stars = '★'.repeat(review.overall_rating) + '☆'.repeat(5 - review.overall_rating);
            const slide = document.createElement('div');
            slide.className = index === 0 ? 'testimonial-slide active' : 'testimonial-slide';
            const tourTypes = { 'regular': '🔭 Tour Regular', 'private': '✨ Tour Privado', 'astrophoto': '📷 Astrofotografía' };
            slide.innerHTML = `
                <div class="testimonial-content">
                    <div class="stars" style="color: #fbbf24; font-size: 1.2rem; margin-bottom: 1rem;">
                        ${stars}
                    </div>
                    <blockquote>"${escapeHtml(review.comment || review.title || 'Excelente experiencia')}"</blockquote>
                    <div class="testimonial-author">
                        <div class="author-info">
                            <h4>${escapeHtml(review.reviewer_name)}</h4>
                            <span>${escapeHtml(review.reviewer_country || '')}</span>
                            <span class="review-tour-type">${tourTypes[review.tour_type] || '🔭 Tour'}</span>
                            ${review.source === 'getyourguide' ? '<span class="review-source-badge" title="Reseña verificada en GetYourGuide">✓ GetYourGuide</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
            slider.appendChild(slide);
        });

        // Initialize slider controls (not full reload)
        initSliderControls();
    } catch (error) {
        console.log('Using static testimonials');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ====== END OF CODE ======