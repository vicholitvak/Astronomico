// ===== TOURS ASTRONÓMICOS ATACAMA - JAVASCRIPT =====
// Main JavaScript functionality for astronomical tours website - v5.5

// ===== TYPEWRITER EFFECT =====
function initTypewriter() {
    const textElement = document.getElementById('typewriter-text');
    const cursorElement = document.getElementById('cursor');
    const text = 'Atacama Dark Skies - El Cielo Más Puro del Mundo en San Pedro de Atacama';
    
    console.log('✍️ Starting typewriter...');
    console.log('Text element:', textElement);
    console.log('Cursor element:', cursorElement);
    
    if (!textElement) {
        console.error('❌ Typewriter text element not found!');
        return;
    }
    
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
    initTestimonialSlider();
    initBookingForm();
    initSmoothScrolling();
    initScrollEffects();
    initDatePicker();
    initQuickBooking();
    initAnimations();
    initTypewriter();
    
    // Initialize telescope gallery with a slight delay to ensure DOM is ready
    setTimeout(() => {
        initTelescopeGallery();
    }, 100);
});

// ===== NAVIGATION FUNCTIONALITY =====
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const header = document.querySelector('.header');

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    });

    // Header scroll effect
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Hide/show header on scroll
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });

    // Highlight active nav item based on scroll position
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY + 200;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`a[href="#${sectionId}"]`);

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) navLink.classList.add('active');
            }
        });
    });
}

// ===== LANGUAGE TOGGLE =====
function initLanguageToggle() {
    const langToggle = document.getElementById('lang-toggle');
    const currentLangSpan = document.getElementById('current-lang');
    
    const translations = {
        es: {
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
            'hero-subtitle': 'Tours astronómicos guiados por expertos: observación de estrellas, constelaciones y fenómenos celestes del espacio profundo.',
            'btn-reserve': 'Reserva Tu Tour',
            'btn-see-tours': 'Ver Tours',
            
            // Features Section
            'Cielos Únicos': 'Cielos Únicos',
            'Guías Expertos': 'Guías Expertos',
            'Ubicación Perfecta': 'Ubicación Perfecta',
            'Equipos Profesionales': 'Equipos Profesionales',
            
            // Tours
            'Nuestros Tours Astronómicos': 'Nuestros Tours Astronómicos',
            'Experiencias únicas bajo el cielo más claro del mundo': 'Experiencias únicas bajo el cielo más claro del mundo',
            'Tour Astronómico Completo': 'Tour Astronómico Completo',
            'Tour Privado': 'Tour Privado', 
            'Tour Fotográfico': 'Tour Fotográfico',
            'Viajes de Estudio': 'Viajes de Estudio',
            'Eventos Corporativos': 'Eventos Corporativos',
            'Reservar Tour': 'Reservar Tour',
            'Solicitar Cotización': 'Solicitar Cotización',
            'Más Popular': 'Más Popular',
            
            // Tour descriptions
            'Experiencia completa: observación a ojo desnudo con puntero láser, telescopio inteligente Unistellar eVscope, cóctel bajo las estrellas y sesión de fotos.': 'Experiencia completa: observación a ojo desnudo con puntero láser, telescopio inteligente Unistellar eVscope, cóctel bajo las estrellas y sesión de fotos.',
            'Experiencia personalizada para grupos pequeños. Itinerario flexible adaptado a tus intereses específicos en astronomía.': 'Experiencia personalizada para grupos pequeños. Itinerario flexible adaptado a tus intereses específicos en astronomía.',
            'Especializado en astrofotografía con equipos profesionales. Aprende técnicas avanzadas y captura imágenes espectaculares del cosmos.': 'Especializado en astrofotografía con equipos profesionales. Aprende técnicas avanzadas y captura imágenes espectaculares del cosmos.',
            'Programas educativos especializados para colegios, universidades e institutos. Contenido adaptado según nivel académico con material didáctico incluido.': 'Programas educativos especializados para colegios, universidades e institutos. Contenido adaptado según nivel académico con material didáctico incluido.',
            'Team building bajo las estrellas. Fortalece vínculos empresariales con experiencias astronómicas únicas diseñadas para fortalecer equipos.': 'Team building bajo las estrellas. Fortalece vínculos empresariales con experiencias astronómicas únicas diseñadas para fortalecer equipos.',
            
            // Includes
            'Incluye:': 'Incluye:',
            
            // Telescope Section
            'Nuestro Telescopio Unistellar eVscope': 'Nuestro Telescopio Unistellar eVscope',
            'Galería del Espacio Profundo': 'Galería del Espacio Profundo',
            
            // Booking Form
            'Reserva Tu Experiencia Astronómica': 'Reserva Tu Experiencia Astronómica',
            'Selecciona tu tour': 'Selecciona tu tour',
            'Nombre completo': 'Nombre completo',
            'Email': 'Email',
            'Teléfono': 'Teléfono',
            'Número de personas': 'Número de personas',
            'Comentarios adicionales': 'Comentarios adicionales',
            'Enviar Reserva': 'Enviar Reserva',
            
            // Footer
            'Síguenos': 'Síguenos',
            'Enlaces Rápidos': 'Enlaces Rápidos',
            'Información de Contacto': 'Información de Contacto'
        },
        
        en: {
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
            'hero-subtitle': 'Expert-guided astronomical tours: star gazing, constellations and deep space phenomena.',
            'btn-reserve': 'Book Your Tour',
            'btn-see-tours': 'See Tours',
            
            // Features Section
            'Cielos Únicos': 'Unique Skies',
            'Guías Expertos': 'Expert Guides', 
            'Ubicación Perfecta': 'Perfect Location',
            'Equipos Profesionales': 'Professional Equipment',
            
            // Tours
            'Nuestros Tours Astronómicos': 'Our Astronomical Tours',
            'Experiencias únicas bajo el cielo más claro del mundo': 'Unique experiences under the clearest sky in the world',
            'Tour Astronómico Completo': 'Complete Astronomical Tour',
            'Tour Privado': 'Private Tour',
            'Tour Fotográfico': 'Photography Tour',
            'Viajes de Estudio': 'Study Trips',
            'Eventos Corporativos': 'Corporate Events',
            'Reservar Tour': 'Book Tour',
            'Solicitar Cotización': 'Request Quote',
            'Más Popular': 'Most Popular',
            
            // Tour descriptions
            'Experiencia completa: observación a ojo desnudo con puntero láser, telescopio inteligente Unistellar eVscope, cóctel bajo las estrellas y sesión de fotos.': 'Complete experience: naked-eye observation with laser pointer, Unistellar eVscope smart telescope, cocktails under the stars and photo session.',
            'Experiencia personalizada para grupos pequeños. Itinerario flexible adaptado a tus intereses específicos en astronomía.': 'Personalized experience for small groups. Flexible itinerary adapted to your specific interests in astronomy.',
            'Especializado en astrofotografía con equipos profesionales. Aprende técnicas avanzadas y captura imágenes espectaculares del cosmos.': 'Specialized in astrophotography with professional equipment. Learn advanced techniques and capture spectacular images of the cosmos.',
            'Programas educativos especializados para colegios, universidades e institutos. Contenido adaptado según nivel académico con material didáctico incluido.': 'Specialized educational programs for schools, universities and institutes. Content adapted to academic level with didactic material included.',
            'Team building bajo las estrellas. Fortalece vínculos empresariales con experiencias astronómicas únicas diseñadas para fortalecer equipos.': 'Team building under the stars. Strengthen business bonds with unique astronomical experiences designed to strengthen teams.',
            
            // Includes
            'Incluye:': 'Includes:',
            
            // Telescope Section
            'Nuestro Telescopio Unistellar eVscope': 'Our Unistellar eVscope Telescope',
            'Galería del Espacio Profundo': 'Deep Space Gallery',
            
            // Booking Form
            'Reserva Tu Experiencia Astronómica': 'Book Your Astronomical Experience',
            'Selecciona tu tour': 'Select your tour',
            'Nombre completo': 'Full name',
            'Email': 'Email',
            'Teléfono': 'Phone',
            'Número de personas': 'Number of people',
            'Comentarios adicionales': 'Additional comments',
            'Enviar Reserva': 'Send Booking',
            
            // Footer
            'Síguenos': 'Follow Us',
            'Enlaces Rápidos': 'Quick Links',
            'Información de Contacto': 'Contact Information'
        },
        
        pt: {
            // Navigation
            'Inicio': 'Início',
            'Sobre Nosotros': 'Sobre Nós',
            'Tours': 'Tours',
            'Telescopio': 'Telescópio', 
            'Reservas': 'Reservas',
            'Contacto': 'Contato',
            'Reserva Ahora': 'Reserve Agora',
            
            // Hero Section
            'hero-title': ['Atacama Dark Skies', 'O Céu Mais Puro do Mundo', 'em San Pedro de Atacama'],
            'hero-subtitle': 'Tours astronômicos guiados por especialistas: observação de estrelas, constelações e fenômenos do espaço profundo.',
            'btn-reserve': 'Reserve Seu Tour',
            'btn-see-tours': 'Ver Tours',
            
            // Features Section
            'Cielos Únicos': 'Céus Únicos',
            'Guías Expertos': 'Guias Especialistas',
            'Ubicación Perfecta': 'Localização Perfeita', 
            'Equipos Profesionales': 'Equipamentos Profissionais',
            
            // Tours
            'Nuestros Tours Astronómicos': 'Nossos Tours Astronômicos',
            'Experiencias únicas bajo el cielo más claro del mundo': 'Experiências únicas sob o céu mais claro do mundo',
            'Tour Astronómico Completo': 'Tour Astronômico Completo',
            'Tour Privado': 'Tour Privado',
            'Tour Fotográfico': 'Tour Fotográfico',
            'Viajes de Estudio': 'Viagens de Estudo',
            'Eventos Corporativos': 'Eventos Corporativos',
            'Reservar Tour': 'Reservar Tour',
            'Solicitar Cotización': 'Solicitar Orçamento',
            'Más Popular': 'Mais Popular',
            
            // Tour descriptions
            'Experiencia completa: observación a ojo desnudo con puntero láser, telescopio inteligente Unistellar eVscope, cóctel bajo las estrellas y sesión de fotos.': 'Experiência completa: observação a olho nu com ponteiro laser, telescópio inteligente Unistellar eVscope, coquetel sob as estrelas e sessão de fotos.',
            'Experiencia personalizada para grupos pequeños. Itinerario flexible adaptado a tus intereses específicos en astronomía.': 'Experiência personalizada para pequenos grupos. Itinerário flexível adaptado aos seus interesses específicos em astronomia.',
            'Especializado en astrofotografía con equipos profesionales. Aprende técnicas avanzadas y captura imágenes espectaculares del cosmos.': 'Especializado em astrofotografia com equipamentos profissionais. Aprenda técnicas avançadas e capture imagens espetaculares do cosmos.',
            'Programas educativos especializados para colegios, universidades e institutos. Contenido adaptado según nivel académico con material didáctico incluido.': 'Programas educacionais especializados para escolas, universidades e institutos. Conteúdo adaptado ao nível acadêmico com material didático incluído.',
            'Team building bajo las estrellas. Fortalece vínculos empresariales con experiencias astronómicas únicas diseñadas para fortalecer equipos.': 'Team building sob as estrelas. Fortaleça vínculos empresariais com experiências astronômicas únicas projetadas para fortalecer equipes.',
            
            // Includes
            'Incluye:': 'Inclui:',
            
            // Telescope Section
            'Nuestro Telescopio Unistellar eVscope': 'Nosso Telescópio Unistellar eVscope',
            'Galería del Espacio Profundo': 'Galeria do Espaço Profundo',
            
            // Booking Form
            'Reserva Tu Experiencia Astronómica': 'Reserve Sua Experiência Astronômica',
            'Selecciona tu tour': 'Selecione seu tour',
            'Nombre completo': 'Nome completo',
            'Email': 'Email',
            'Teléfono': 'Telefone',
            'Número de personas': 'Número de pessoas',
            'Comentarios adicionales': 'Comentários adicionais',
            'Enviar Reserva': 'Enviar Reserva',
            
            // Footer
            'Síguenos': 'Siga-nos',
            'Enlaces Rápidos': 'Links Rápidos',
            'Información de Contacto': 'Informações de Contato'
        }
    };

    let currentLang = 'es';
    const langDropdown = document.getElementById('lang-dropdown');
    const langOptions = document.querySelectorAll('.lang-option');

    // Language mapping for flags and display
    const languageMap = {
        'es': { flag: '🇪🇸', name: 'ES' },
        'en': { flag: '🇺🇸', name: 'EN' }, 
        'pt': { flag: '🇧🇷', name: 'PT' }
    };

    // Toggle dropdown
    langToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        langDropdown.classList.toggle('show');
        updateActiveOption();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        langDropdown.classList.remove('show');
    });

    // Handle language selection
    langOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const selectedLang = this.getAttribute('data-lang');
            
            if (selectedLang !== currentLang) {
                setLanguage(selectedLang);
            }
            
            langDropdown.classList.remove('show');
        });
    });

    // Update active option styling
    function updateActiveOption() {
        langOptions.forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-lang') === currentLang) {
                option.classList.add('active');
            }
        });
    }

    // Set language function
    function setLanguage(lang) {
        currentLang = lang;
        currentLangSpan.textContent = languageMap[lang].name;
        
        // Update navigation texts
        Object.keys(translations[currentLang]).forEach(key => {
            const elements = document.querySelectorAll(`[data-translate="${key}"]`);
            elements.forEach(el => {
                el.textContent = translations[currentLang][key];
            });
        });
        
        // Update common elements by text matching
        function translateElementsContaining(textToFind, translationKey) {
            const allElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, span, button, label');
            allElements.forEach(el => {
                const elementText = el.textContent.trim();
                if ((elementText === textToFind || elementText.includes(textToFind)) && translations[currentLang][translationKey]) {
                    // For exact matches or partial matches (for longer descriptions)
                    if (elementText === textToFind || elementText.length > 100) {
                        el.textContent = translations[currentLang][translationKey];
                    }
                }
            });
        }
        
        // Special function for tour descriptions
        function translateTourDescriptions() {
            // Tour descriptions by selector
            const tourDescriptions = [
                {
                    selector: '.tour-card:nth-child(1) .tour-content p',
                    key: 'Experiencia completa: observación a ojo desnudo con puntero láser, telescopio inteligente Unistellar eVscope, cóctel bajo las estrellas y sesión de fotos.'
                },
                {
                    selector: '.tour-card:nth-child(2) .tour-content p',
                    key: 'Experiencia personalizada para grupos pequeños. Itinerario flexible adaptado a tus intereses específicos en astronomía.'
                },
                {
                    selector: '.tour-card:nth-child(3) .tour-content p',
                    key: 'Especializado en astrofotografía con equipos profesionales. Aprende técnicas avanzadas y captura imágenes espectaculares del cosmos.'
                },
                {
                    selector: '.tour-card:nth-child(4) .tour-content p',
                    key: 'Programas educativos especializados para colegios, universidades e institutos. Contenido adaptado según nivel académico con material didáctico incluido.'
                },
                {
                    selector: '.tour-card:nth-child(5) .tour-content p',
                    key: 'Team building bajo las estrellas. Fortalece vínculos empresariales con experiencias astronómicas únicas diseñadas para fortalecer equipos.'
                }
            ];
            
            tourDescriptions.forEach(desc => {
                const element = document.querySelector(desc.selector);
                if (element && translations[currentLang][desc.key]) {
                    element.textContent = translations[currentLang][desc.key];
                }
            });
        }
        
        // Apply translations to common elements
        const elementsToTranslate = [
            ['Cielos Únicos', 'Cielos Únicos'],
            ['Guías Expertos', 'Guías Expertos'],
            ['Ubicación Perfecta', 'Ubicación Perfecta'], 
            ['Equipos Profesionales', 'Equipos Profesionales'],
            ['Nuestros Tours Astronómicos', 'Nuestros Tours Astronómicos'],
            ['Experiencias únicas bajo el cielo más claro del mundo', 'Experiencias únicas bajo el cielo más claro del mundo'],
            ['Tour Astronómico Completo', 'Tour Astronómico Completo'],
            ['Tour Privado', 'Tour Privado'],
            ['Tour Fotográfico', 'Tour Fotográfico'],
            ['Viajes de Estudio', 'Viajes de Estudio'],
            ['Eventos Corporativos', 'Eventos Corporativos'],
            ['Reservar Tour', 'Reservar Tour'],
            ['Solicitar Cotización', 'Solicitar Cotización'],
            ['Más Popular', 'Más Popular'],
            ['Experiencia completa: observación a ojo desnudo con puntero láser, telescopio inteligente Unistellar eVscope, cóctel bajo las estrellas y sesión de fotos.', 'Experiencia completa: observación a ojo desnudo con puntero láser, telescopio inteligente Unistellar eVscope, cóctel bajo las estrellas y sesión de fotos.'],
            ['Experiencia personalizada para grupos pequeños. Itinerario flexible adaptado a tus intereses específicos en astronomía.', 'Experiencia personalizada para grupos pequeños. Itinerario flexible adaptado a tus intereses específicos en astronomía.'],
            ['Especializado en astrofotografía con equipos profesionales. Aprende técnicas avanzadas y captura imágenes espectaculares del cosmos.', 'Especializado en astrofotografía con equipos profesionales. Aprende técnicas avanzadas y captura imágenes espectaculares del cosmos.'],
            ['Programas educativos especializados para colegios, universidades e institutos. Contenido adaptado según nivel académico con material didáctico incluido.', 'Programas educativos especializados para colegios, universidades e institutos. Contenido adaptado según nivel académico con material didáctico incluido.'],
            ['Team building bajo las estrellas. Fortalece vínculos empresariales con experiencias astronómicas únicas diseñadas para fortalecer equipos.', 'Team building bajo las estrellas. Fortalece vínculos empresariales con experiencias astronómicas únicas diseñadas para fortalecer equipos.'],
            ['Incluye:', 'Incluye:'],
            ['Nuestro Telescopio Unistellar eVscope', 'Nuestro Telescopio Unistellar eVscope'],
            ['Galería del Espacio Profundo', 'Galería del Espacio Profundo'],
            ['Reserva Tu Experiencia Astronómica', 'Reserva Tu Experiencia Astronómica'],
            ['Selecciona tu tour', 'Selecciona tu tour'],
            ['Nombre completo', 'Nombre completo'],
            ['Email', 'Email'],
            ['Teléfono', 'Teléfono'],
            ['Número de personas', 'Número de personas'],
            ['Comentarios adicionales', 'Comentarios adicionales'],
            ['Enviar Reserva', 'Enviar Reserva'],
            ['Síguenos', 'Síguenos'],
            ['Enlaces Rápidos', 'Enlaces Rápidos'],
            ['Información de Contacto', 'Información de Contacto']
        ];
        
        elementsToTranslate.forEach(([text, key]) => {
            translateElementsContaining(text, key);
        });
        
        // Translate tour descriptions specifically
        translateTourDescriptions();
        
        // Translate section headers
        const sectionHeader = document.querySelector('#tours .section-header h2');
        const sectionSubtitle = document.querySelector('#tours .section-header .section-subtitle');
        
        if (sectionHeader && translations[currentLang]['Nuestros Tours Astronómicos']) {
            sectionHeader.textContent = translations[currentLang]['Nuestros Tours Astronómicos'];
        }
        if (sectionSubtitle && translations[currentLang]['Experiencias únicas bajo el cielo más claro del mundo']) {
            sectionSubtitle.textContent = translations[currentLang]['Experiencias únicas bajo el cielo más claro del mundo'];
        }

        // Update specific elements
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const btnReserve = document.querySelector('.hero-buttons .btn-primary');
        const btnSee = document.querySelector('.hero-buttons .btn-secondary');

        // Update hero title lines with letter structure
        if (heroTitle) {
            const titleLines = translations[currentLang]['hero-title'];
            const titleLineElements = heroTitle.querySelectorAll('.title-line');
            
            if (titleLines && Array.isArray(titleLines)) {
                titleLineElements.forEach((lineElement, index) => {
                    if (titleLines[index]) {
                        const text = titleLines[index];
                        lineElement.innerHTML = '';
                        
                        // Recreate letter structure for gradient
                        text.split('').forEach((char) => {
                            const span = document.createElement('span');
                            span.textContent = char === ' ' ? '\u00A0' : char;
                            span.style.display = 'inline-block';
                            span.style.opacity = '1';
                            span.style.transform = 'translateY(0)';
                            lineElement.appendChild(span);
                        });
                    }
                });
            }
        }
        
        if (heroSubtitle) heroSubtitle.textContent = translations[currentLang]['hero-subtitle'];
        if (btnReserve) btnReserve.textContent = translations[currentLang]['btn-reserve'];
        if (btnSee) btnSee.textContent = translations[currentLang]['btn-see-tours'];

        // Update calendar language if it exists
        updateCalendarLanguage(lang);

        // Store language preference
        localStorage.setItem('preferred-language', currentLang);
        
        // Update active option
        updateActiveOption();
    }

    // Load saved language preference
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang && translations[savedLang]) {
        setLanguage(savedLang);
    }

    // Update calendar language function
    function updateCalendarLanguage(lang) {
        // This will be called when calendar exists
        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }
    }
}

// ===== TESTIMONIAL SLIDER =====
function initTestimonialSlider() {
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const navDots = document.querySelectorAll('.nav-dot');
    
    // Exit if no testimonials found
    if (testimonialCards.length === 0 || navDots.length === 0) {
        return;
    }
    
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        // Hide all cards
        testimonialCards.forEach(card => card.classList.remove('active'));
        navDots.forEach(dot => dot.classList.remove('active'));

        // Show selected card
        if (testimonialCards[index]) {
            testimonialCards[index].classList.add('active');
            navDots[index].classList.add('active');
        }
        
        currentSlide = index;
    }

    function nextSlide() {
        const nextIndex = (currentSlide + 1) % testimonialCards.length;
        showSlide(nextIndex);
    }

    function startSlideshow() {
        slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }

    function stopSlideshow() {
        clearInterval(slideInterval);
    }

    // Initialize first slide
    showSlide(0);
    startSlideshow();

    // Add click handlers to navigation dots
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            showSlide(index);
            stopSlideshow();
            setTimeout(startSlideshow, 8000); // Restart auto-play after 8 seconds
        });
    });

    // Pause slideshow on hover
    const testimonialsSection = document.querySelector('.testimonials-slider');
    if (testimonialsSection) {
        testimonialsSection.addEventListener('mouseenter', stopSlideshow);
        testimonialsSection.addEventListener('mouseleave', startSlideshow);
    }

    // Touch/swipe support for mobile
    let startX = 0;
    let endX = 0;

    if (testimonialsSection) {
        testimonialsSection.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
        });

        testimonialsSection.addEventListener('touchend', function(e) {
            endX = e.changedTouches[0].clientX;
            handleSwipe();
        });
    }

    function handleSwipe() {
        const threshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > threshold) {
            stopSlideshow();
            if (diff > 0) {
                // Swipe left - next slide
                nextSlide();
            } else {
                // Swipe right - previous slide
                const prevIndex = currentSlide === 0 ? testimonialCards.length - 1 : currentSlide - 1;
                showSlide(prevIndex);
            }
            setTimeout(startSlideshow, 8000);
        }
    }
}

// ===== BOOKING FORM =====
function initBookingForm() {
    const form = document.getElementById('booking-form');
    const formSuccess = document.getElementById('form-success');

    if (!form) return;

    // Form validation
    const requiredFields = form.querySelectorAll('[required]');
    
    function validateField(field) {
        const value = field.value.trim();
        const fieldGroup = field.closest('.form-group');
        let isValid = true;

        // Remove existing error styling
        field.classList.remove('error');
        const existingError = fieldGroup.querySelector('.field-error');
        if (existingError) existingError.remove();

        // Check if field is empty
        if (!value) {
            isValid = false;
            showFieldError(field, 'Este campo es obligatorio');
        } else {
            // Specific validations
            switch (field.type) {
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        isValid = false;
                        showFieldError(field, 'Ingrese un email válido');
                    }
                    break;
                case 'tel':
                    const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/;
                    if (!phoneRegex.test(value)) {
                        isValid = false;
                        showFieldError(field, 'Ingrese un teléfono válido');
                    }
                    break;
                case 'date':
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedDate < today) {
                        isValid = false;
                        showFieldError(field, 'La fecha debe ser posterior a hoy');
                    }
                    break;
            }
        }

        return isValid;
    }

    function showFieldError(field, message) {
        field.classList.add('error');
        const fieldGroup = field.closest('.form-group');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ff6b6b';
        errorDiv.style.fontSize = '0.8rem';
        errorDiv.style.marginTop = '0.25rem';
        fieldGroup.appendChild(errorDiv);
    }

    // Real-time validation
    requiredFields.forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.classList.contains('error')) {
                validateField(field);
            }
        });
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let isFormValid = true;
        
        // Validate all required fields
        requiredFields.forEach(field => {
            if (!validateField(field)) {
                isFormValid = false;
            }
        });

        // Check terms checkbox
        const termsCheckbox = document.getElementById('terms');
        if (termsCheckbox && !termsCheckbox.checked) {
            isFormValid = false;
            showFieldError(termsCheckbox, 'Debe aceptar los términos y condiciones');
        }

        if (isFormValid) {
            submitForm();
        } else {
            // Scroll to first error
            const firstError = form.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
        }
    });

    async function submitForm() {
        const submitButton = form.querySelector('.btn-submit');
        const originalText = submitButton.innerHTML;
        
        // Show loading state
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        submitButton.disabled = true;

        try {
            // Collect form data
            const bookingData = {
                date: form.querySelector('#date').value,
                persons: form.querySelector('#persons').value,
                tourType: form.querySelector('#tour-type').value,
                time: form.querySelector('#time').value,
                name: form.querySelector('#name').value,
                email: form.querySelector('#email').value,
                phone: form.querySelector('#phone').value,
                message: form.querySelector('#message').value
            };

            console.log('📝 Sending booking data:', bookingData);

            // Send to our Vercel API
            const response = await fetch('/api/booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Booking successful:', result.bookingId);
                
                // Show custom success page
                showBookingSuccess({
                    bookingId: result.bookingId,
                    ...bookingData
                });
                
            } else {
                throw new Error(result.error || 'Error procesando la reserva');
            }
            
        } catch (error) {
            console.error('❌ Booking error:', error);
            
            // Show error message
            showBookingError(error.message);
            
            // Restore button
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    // Show success message with booking details
    function showBookingSuccess(booking) {
        const successHtml = `
            <div class="booking-success-overlay">
                <div class="booking-success-modal">
                    <div class="success-header">
                        <i class="fas fa-check-circle"></i>
                        <h2>¡Reserva Confirmada!</h2>
                        <p>Tu reserva ha sido enviada exitosamente</p>
                    </div>
                    
                    <div class="booking-details">
                        <h3>Detalles de tu reserva:</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="label">ID de Reserva:</span>
                                <span class="value">${booking.bookingId}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Fecha:</span>
                                <span class="value">${formatDate(booking.date)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Horario:</span>
                                <span class="value">${booking.time}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Personas:</span>
                                <span class="value">${booking.persons}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Tour:</span>
                                <span class="value">${formatTourType(booking.tourType)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="next-steps">
                        <h3>Próximos pasos:</h3>
                        <ol>
                            <li>📧 Recibirás un email de confirmación en breves minutos</li>
                            <li>📱 Te contactaremos dentro de 24 horas para confirmar disponibilidad</li>
                            <li>💳 Coordinaremos detalles de pago y punto de encuentro</li>
                            <li>🔔 Te recordaremos 24 horas antes del tour</li>
                        </ol>
                    </div>
                    
                    <div class="success-actions">
                        <a href="https://wa.me/56950558761?text=Hola! Tengo una consulta sobre mi reserva ${booking.bookingId}" 
                           target="_blank" class="btn btn-success">
                            <i class="fab fa-whatsapp"></i>
                            Contactar por WhatsApp
                        </a>
                        <button onclick="closeBookingSuccess()" class="btn btn-secondary">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', successHtml);
        document.body.style.overflow = 'hidden';
    }

    // Helper functions
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CL', {
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        });
    }

    function formatTourType(type) {
        const types = {
            'regular': 'Tour Regular (Grupo)',
            'private': 'Tour Privado',
            'astrophoto': 'Tour Astrofotográfico'
        };
        return types[type] || type;
    }

    function showBookingError(message) {
        const errorModal = `
            <div class="booking-error-overlay">
                <div class="booking-error-modal">
                    <div class="error-header">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h2>Error en la Reserva</h2>
                        <p>${message}</p>
                    </div>
                    <div class="error-actions">
                        <a href="https://wa.me/56950558761?text=Hola! Tuve un problema al hacer una reserva en el sitio web" 
                           target="_blank" class="btn btn-primary">
                            <i class="fab fa-whatsapp"></i>
                            Contactar por WhatsApp
                        </a>
                        <button onclick="closeBookingError()" class="btn btn-secondary">
                            Intentar de Nuevo
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorModal);
    }

    // Global functions for closing modals
    window.closeBookingSuccess = function() {
        const overlay = document.querySelector('.booking-success-overlay');
        if (overlay) {
            overlay.remove();
            document.body.style.overflow = 'auto';
            
            // Reset form
            form.reset();
            form.style.display = 'block';
            formSuccess.classList.remove('show');
            
            const submitButton = form.querySelector('.btn-submit');
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    };

    window.closeBookingError = function() {
        const overlay = document.querySelector('.booking-error-overlay');
        if (overlay) {
            overlay.remove();
        }
    };

    // Auto-fill current date + 1 day as minimum
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];
        dateInput.min = minDate;
    }
}

// ===== SMOOTH SCROLLING =====
function initSmoothScrolling() {
    // Handle anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Back to top functionality
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 500) {
                backToTop.style.opacity = '1';
                backToTop.style.visibility = 'visible';
            } else {
                backToTop.style.opacity = '0';
                backToTop.style.visibility = 'hidden';
            }
        });
    }
}

// ===== SCROLL EFFECTS =====
function initScrollEffects() {
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.tour-card, .feature, .info-card, .contact-item');
    animateElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });

    // Parallax effect for hero background (disable on mobile for performance)
    if (window.innerWidth > 768) {
        window.addEventListener('scroll', function() {
            const scrolled = window.scrollY;
            const heroBackground = document.querySelector('.hero-background');
            if (heroBackground) {
                const speed = scrolled * 0.5;
                heroBackground.style.transform = `translateY(${speed}px)`;
            }
        });
    }
}

// ===== FULLCALENDAR WITH MOON PHASES =====
// Nota: El calendario ahora se inicializa inline en index.html para mejor compatibilidad
function initDatePicker() {
    // El calendario se maneja en el script inline del HTML
    return;

    // Moon phase calculation algorithm
    function getMoonPhase(date) {
        // Base new moon: January 6, 2000, 18:14 UTC
        const baseNewMoon = new Date(2000, 0, 6, 18, 14);
        const lunarCycle = 29.53058867; // days
        
        const daysDifference = (date - baseNewMoon) / (1000 * 60 * 60 * 24);
        const cyclePosition = daysDifference % lunarCycle;
        const normalizedPosition = (cyclePosition + lunarCycle) % lunarCycle;
        
        // Calculate phase (0-7, representing 8 main phases)
        const phaseNumber = Math.round(normalizedPosition / lunarCycle * 8) % 8;
        
        const phases = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
        const phaseNames = ['Nueva', 'Creciente', 'Cuarto Creciente', 'Gibosa Creciente', 'Llena', 'Gibosa Menguante', 'Cuarto Menguante', 'Menguante'];
        
        return {
            icon: phases[phaseNumber],
            name: phaseNames[phaseNumber],
            isFullMoon: phaseNumber === 4, // Full moon
            isNearFullMoon: phaseNumber >= 3 && phaseNumber <= 5 // 3 days around full moon
        };
    }

    // Check if date is available for tours (not during full moon ±3 days)
    function isDateAvailable(date) {
        const moonPhase = getMoonPhase(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        // Not available if in the past or near full moon
        return date >= today && !moonPhase.isNearFullMoon;
    }

    // Generate tour events for available dates
    function generateTourEvents() {
        const events = [];
        const today = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 12); // Generate events for next 12 months
        
        const tourTimes = ['20:00', '20:30', '21:00', '21:30', '22:00'];
        
        for (let date = new Date(today); date <= endDate; date.setDate(date.getDate() + 1)) {
            if (isDateAvailable(new Date(date))) {
                tourTimes.forEach(time => {
                    const eventDate = new Date(date);
                    const [hours, minutes] = time.split(':');
                    eventDate.setHours(parseInt(hours), parseInt(minutes));
                    
                    events.push({
                        title: `Tour ${time}`,
                        start: eventDate.toISOString(),
                        classNames: ['tour-available'],
                        extendedProps: {
                            tourTime: time,
                            available: true
                        }
                    });
                });
            }
        }
        
        return events;
    }

    // Initialize FullCalendar
    const calendar = new FullCalendar.Calendar(fullCalendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        firstDay: 1, // Monday
        height: 'auto',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek'
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            list: 'Lista'
        },
        events: generateTourEvents(),
        
        // Custom day cell rendering with moon phases
        dayCellDidMount: function(info) {
            const moonPhase = getMoonPhase(info.date);
            
            // Add moon phase icon
            const moonIcon = document.createElement('div');
            moonIcon.className = 'moon-phase';
            moonIcon.textContent = moonPhase.icon;
            moonIcon.title = `Luna ${moonPhase.name}`;
            info.el.appendChild(moonIcon);
            
            // Style unavailable days
            if (!isDateAvailable(info.date)) {
                info.el.classList.add('unavailable-day');
            }
        },
        
        // Handle date/event clicks
        dateClick: function(info) {
            if (!isDateAvailable(info.date)) {
                alert('Esta fecha no está disponible para tours debido a la luna llena. Por favor selecciona otra fecha.');
                return;
            }
            
            showTimeSelection(info.date);
        },
        
        eventClick: function(info) {
            const date = info.event.start;
            const time = info.event.extendedProps.tourTime;
            selectDateTime(date, time);
        },
        
        // Responsive settings
        windowResizeDelay: 100
    });

    // Show time selection modal/dropdown
    function showTimeSelection(date) {
        const availableTimes = ['20:00', '20:30', '21:00', '21:30', '22:00'];
        const selectedDateDisplay = document.getElementById('selected-date-display');
        
        const dateStr = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Create time selection interface
        const timeButtons = availableTimes.map(time => 
            `<button type="button" class="time-option" data-time="${time}">${time} hrs</button>`
        ).join('');
        
        selectedDateDisplay.innerHTML = `
            <div class="date-selection">
                <h5>📅 ${dateStr}</h5>
                <p>Selecciona el horario de tu tour:</p>
                <div class="time-options">
                    ${timeButtons}
                </div>
            </div>
        `;
        selectedDateDisplay.classList.add('has-date');
        
        // Add event listeners to time buttons
        document.querySelectorAll('.time-option').forEach(button => {
            button.addEventListener('click', function() {
                const time = this.getAttribute('data-time');
                selectDateTime(date, time);
            });
        });
    }
    
    // Select final date and time
    function selectDateTime(date, time) {
        const selectedDateInput = document.getElementById('selected-date');
        const selectedTimeInput = document.getElementById('selected-time');
        const selectedDateDisplay = document.getElementById('selected-date-display');
        
        const dateStr = date.toISOString().split('T')[0];
        selectedDateInput.value = dateStr;
        selectedTimeInput.value = time;
        
        const displayDate = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        selectedDateDisplay.innerHTML = `
            <div class="selected-datetime">
                <i class="fas fa-check-circle"></i>
                <h5>¡Fecha y hora seleccionadas!</h5>
                <p><strong>📅 ${displayDate}</strong></p>
                <p><strong>🕐 ${time} hrs</strong></p>
                <small>Puedes cambiar la selección haciendo clic en otra fecha</small>
            </div>
        `;
        selectedDateDisplay.classList.add('has-date');
    }
    
    // Render the calendar
    calendar.render();
    
    // Store calendar reference globally for potential updates
    window.astronomyCalendar = calendar;
}

// ===== QUICK BOOKING OPTIONS =====
function initQuickBooking() {
    const calendlyOption = document.getElementById('calendly-option');
    
    if (calendlyOption) {
        calendlyOption.addEventListener('click', function() {
            // Replace with your actual Calendly URL
            const calendlyUrl = 'https://calendly.com/tu-usuario/tour-astronomico'; // Cambiar por tu URL real
            
            // Open Calendly in a new window/tab
            window.open(calendlyUrl, '_blank', 'width=800,height=700');
            
            // Alternatively, you can embed Calendly inline:
            // showCalendlyModal();
        });
    }
}

// Optional: Calendly inline modal
function showCalendlyModal() {
    // Create modal backdrop
    const modal = document.createElement('div');
    modal.className = 'calendly-modal';
    modal.innerHTML = `
        <div class="calendly-modal-content">
            <div class="calendly-header">
                <h3>Reserva tu Tour Astronómico</h3>
                <button class="calendly-close" aria-label="Cerrar">×</button>
            </div>
            <div class="calendly-embed">
                <iframe src="https://calendly.com/tu-usuario/tour-astronomico" 
                        width="100%" height="500" frameborder="0" 
                        title="Reservar Tour Astronómico">
                </iframe>
            </div>
            <div class="calendly-footer">
                <p>¿Problemas con la reserva? <a href="https://wa.me/56935134669" target="_blank">Contáctanos por WhatsApp</a></p>
            </div>
        </div>
    `;
    
    // Add styles for modal
    const style = document.createElement('style');
    style.textContent = `
        .calendly-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            padding: var(--spacing-sm);
        }
        
        .calendly-modal-content {
            background: var(--bg-secondary);
            border-radius: var(--border-radius-lg);
            max-width: 900px;
            width: 100%;
            max-height: 90vh;
            overflow: hidden;
            border: 1px solid var(--primary-color);
        }
        
        .calendly-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-md);
            background: var(--bg-tertiary);
            border-bottom: 1px solid var(--primary-color);
        }
        
        .calendly-close {
            background: none;
            border: none;
            color: var(--text-primary);
            font-size: 2rem;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        }
        
        .calendly-embed {
            height: 500px;
        }
        
        .calendly-footer {
            padding: var(--spacing-sm);
            text-align: center;
            background: var(--bg-tertiary);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .calendly-footer a {
            color: var(--primary-color);
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.calendly-close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        }
    });
}

// ===== ANIMATIONS =====
function initAnimations() {
    // Add CSS for scroll animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(50px);
            transition: all 0.6s ease-out;
        }
        
        .animate-on-scroll.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .tour-card.animate-on-scroll:nth-child(1) { transition-delay: 0.1s; }
        .tour-card.animate-on-scroll:nth-child(2) { transition-delay: 0.2s; }
        .tour-card.animate-on-scroll:nth-child(3) { transition-delay: 0.3s; }
        .tour-card.animate-on-scroll:nth-child(4) { transition-delay: 0.4s; }
        
        .feature.animate-on-scroll:nth-child(1) { transition-delay: 0.1s; }
        .feature.animate-on-scroll:nth-child(2) { transition-delay: 0.2s; }
        .feature.animate-on-scroll:nth-child(3) { transition-delay: 0.3s; }
        
        .field-error {
            animation: slideInError 0.3s ease-out;
        }
        
        @keyframes slideInError {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .form-group input.error,
        .form-group select.error,
        .form-group textarea.error {
            border-color: #ff6b6b;
            box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
        }
        
        .no-scroll {
            overflow: hidden;
        }
        
        .header.scrolled {
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(15px);
        }
    `;
    document.head.appendChild(style);

    // Typing effect for hero title (optional enhancement)
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && window.innerWidth > 768) {
        const originalText = heroTitle.textContent;
        heroTitle.textContent = '';
        heroTitle.style.borderRight = '2px solid var(--primary-color)';
        
        let i = 0;
        function typeWriter() {
            if (i < originalText.length) {
                heroTitle.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            } else {
                // Remove cursor after typing is complete
                setTimeout(() => {
                    heroTitle.style.borderRight = 'none';
                }, 1000);
            }
        }
        
        // Start typing effect after page load
        setTimeout(typeWriter, 1000);
    }
}

// ===== UTILITY FUNCTIONS =====

// Debounce function for performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// WhatsApp click tracking (optional analytics)
function trackWhatsAppClick() {
    // Add analytics tracking here if needed
    console.log('WhatsApp button clicked');
}

// Tour card click tracking
document.querySelectorAll('.btn-tour').forEach(button => {
    button.addEventListener('click', function() {
        const tourCard = this.closest('.tour-card');
        const tourName = tourCard.querySelector('h3').textContent;
        console.log(`Tour selected: ${tourName}`);
        // Add analytics tracking here
    });
});

// Form field analytics (optional)
document.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('focus', function() {
        console.log(`Field focused: ${this.id || this.name}`);
        // Add analytics tracking here
    });
});

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    // Optionally send error reports to analytics
});

// ===== PERFORMANCE MONITORING =====
window.addEventListener('load', function() {
    // Monitor page load performance
    if ('performance' in window) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`Page load time: ${loadTime}ms`);
        
        // Log if load time is too slow
        if (loadTime > 3000) {
            console.warn('Page load time is slower than recommended (>3s)');
        }
    }
});

// ===== TELESCOPE GALLERY =====
function initTelescopeGallery() {
    console.log('🔭 Initializing telescope gallery...');
    
    // Check if mobile
    const isMobile = window.innerWidth <= 768;
    
    // Setup global functions for carousel
    window.currentTelescopeSlide = 0;
    window.totalTelescopeSlides = isMobile ? 11 : 2; // 11 individual images on mobile, 2 slides on desktop
    
    window.updateTelescopeCarousel = function() {
        const track = document.getElementById('carouselTrack');
        const indicators = document.querySelectorAll('.indicator');
        const isMobileNow = window.innerWidth <= 768;
        
        if (track) {
            const allImages = track.querySelectorAll('.gallery-item');
            
            if (isMobileNow) {
                // Mobile: Show one image at a time using CSS classes
                allImages.forEach((img, index) => {
                    img.classList.remove('mobile-active');
                    if (index === window.currentTelescopeSlide) {
                        img.classList.add('mobile-active');
                    }
                });
                track.style.transform = 'translateX(0)';
                
                // Debug: Log which image should be visible
                console.log(`📱 Mobile: Showing image ${window.currentTelescopeSlide + 1} of ${allImages.length}`);
                
            } else {
                // Desktop: Original carousel behavior - reset mobile classes
                allImages.forEach(img => {
                    img.classList.remove('mobile-active');
                    img.style.display = '';
                });
                const translateX = -window.currentTelescopeSlide * 50;
                track.style.transform = `translateX(${translateX}%)`;
                
                console.log(`🖥️ Desktop: Slide ${window.currentTelescopeSlide + 1}`);
            }
        }
        
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === window.currentTelescopeSlide);
        });
    };
    
    window.telescopeCarouselNext = function() {
        console.log('➡️ Next slide clicked - INLINE');
        const isMobileNow = window.innerWidth <= 768;
        window.totalTelescopeSlides = isMobileNow ? 11 : 2;
        window.currentTelescopeSlide = (window.currentTelescopeSlide + 1) % window.totalTelescopeSlides;
        window.updateTelescopeCarousel();
    };
    
    window.telescopeCarouselPrev = function() {
        console.log('⬅️ Previous slide clicked - INLINE');
        const isMobileNow = window.innerWidth <= 768;
        window.totalTelescopeSlides = isMobileNow ? 11 : 2;
        window.currentTelescopeSlide = (window.currentTelescopeSlide - 1 + window.totalTelescopeSlides) % window.totalTelescopeSlides;
        window.updateTelescopeCarousel();
    };
    
    // Setup global functions for modal
    window.openGalleryModal = function(imageSrc) {
        console.log('🔍 Opening modal with image:', imageSrc);
        const modal = document.getElementById('galleryModal');
        const modalImage = document.getElementById('modalImage');
        
        if (modal && modalImage) {
            modalImage.src = imageSrc;
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };
    
    window.closeGalleryModal = function() {
        console.log('❌ Closing modal');
        const modal = document.getElementById('galleryModal');
        
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
    
    // Add keyboard support for closing modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.closeGalleryModal();
        }
    });
    
    // Wait for all elements to be ready
    setTimeout(() => {
        setupCarousel();
        setupModal();
        
        // Force initial update after elements are ready
        setTimeout(() => {
            window.updateTelescopeCarousel(); // Initialize
            
            // Force show first image on mobile
            const isMobileNow = window.innerWidth <= 768;
            if (isMobileNow) {
                const track = document.getElementById('carouselTrack');
                if (track) {
                    const firstImage = track.querySelector('.gallery-item');
                    if (firstImage) {
                        firstImage.classList.add('mobile-active');
                        console.log('✅ Forced first image visible on mobile');
                    }
                }
            }
        }, 100);
        
        // Handle window resize for responsive carousel
        window.addEventListener('resize', debounce(() => {
            const isMobileNow = window.innerWidth <= 768;
            window.totalTelescopeSlides = isMobileNow ? 11 : 2;
            window.currentTelescopeSlide = 0; // Reset to first slide
            window.updateTelescopeCarousel();
        }, 250));
    }, 200);
}

function setupCarousel() {
    const carouselTrack = document.getElementById('carouselTrack');
    const carouselPrev = document.getElementById('carouselPrev');
    const carouselNext = document.getElementById('carouselNext');
    const indicators = document.querySelectorAll('.indicator');
    
    console.log('🎠 Setting up carousel...');
    console.log('Track:', carouselTrack ? '✅' : '❌');
    console.log('Prev button:', carouselPrev ? '✅' : '❌');
    console.log('Next button:', carouselNext ? '✅' : '❌');
    console.log('Indicators:', indicators.length);
    
    if (!carouselTrack) {
        console.error('❌ Carousel track not found!');
        return;
    }
    
    let currentSlide = 0;
    const totalSlides = 2;
    
    function updateCarousel() {
        const translateX = -currentSlide * 50;
        carouselTrack.style.transform = `translateX(${translateX}%)`;
        console.log('🎠 Carousel moved to slide:', currentSlide);
        
        // Update indicators
        indicators.forEach((indicator, index) => {
            if (indicator) {
                indicator.classList.toggle('active', index === currentSlide);
            }
        });
    }
    
    function nextSlide() {
        console.log('➡️ Next slide clicked');
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }
    
    function prevSlide() {
        console.log('⬅️ Previous slide clicked');
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateCarousel();
    }
    
    // Add event listeners
    if (carouselNext) {
        carouselNext.onclick = nextSlide;
        console.log('✅ Next button click handler added');
    }
    
    if (carouselPrev) {
        carouselPrev.onclick = prevSlide;
        console.log('✅ Previous button click handler added');
    }
    
    // Indicator clicks
    indicators.forEach((indicator, index) => {
        if (indicator) {
            indicator.onclick = () => {
                console.log('🔘 Indicator', index, 'clicked');
                currentSlide = index;
                updateCarousel();
            };
        }
    });
    
    // Initialize
    updateCarousel();
    console.log('🎠 Carousel initialized successfully');
}

function setupModal() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const modal = document.getElementById('galleryModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.querySelector('.close-modal');
    
    console.log('🔍 Setting up modal...');
    console.log('Gallery items:', galleryItems.length);
    console.log('Modal:', modal ? '✅' : '❌');
    console.log('Modal image:', modalImage ? '✅' : '❌');
    console.log('Close button:', closeModal ? '✅' : '❌');
    
    if (!modal || !modalImage || galleryItems.length === 0) {
        console.error('❌ Modal elements not found!');
        return;
    }
    
    let currentImageIndex = 0;
    const imagesSources = [];
    
    // Collect image sources
    galleryItems.forEach((item, index) => {
        const img = item.querySelector('img');
        if (img) {
            imagesSources.push(img.src);
            
            // Add click event
            item.onclick = () => {
                console.log('🖼️ Image', index, 'clicked');
                currentImageIndex = index;
                showModal();
            };
        }
    });
    
    function showModal() {
        console.log('🔍 Opening modal for image:', currentImageIndex);
        modal.classList.add('active');
        modalImage.src = imagesSources[currentImageIndex];
        document.body.style.overflow = 'hidden';
    }
    
    function hideModal() {
        console.log('❌ Closing modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Close modal events
    if (closeModal) {
        closeModal.onclick = hideModal;
    }
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            hideModal();
        }
    };
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('active') && e.key === 'Escape') {
            hideModal();
        }
    });
    
    console.log('🔍 Modal initialized with', imagesSources.length, 'images');
}


// ===== SERVICE WORKER REGISTRATION (for PWA capabilities) =====
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}

// Function moved to the top of the file

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initNavigation,
        initLanguageToggle,
        initTestimonialSlider,
        initBookingForm,
        initSmoothScrolling,
        initTelescopeGallery,
        initTypewriter,
        debounce,
        throttle
    };
}