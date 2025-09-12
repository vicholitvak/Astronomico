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
    initTestimonialSlider();
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
    
    const translations = {
        es: {
            // Page meta
            'page-title': 'Atacama NightSky | Tours Astronómicos en San Pedro de Atacama',
            'meta-description': 'Atacama NightSky: Tours guiados con telescopio Unistellar en el desierto más claro del mundo. Observación de estrellas, astrofotografía y experiencias únicas.',
            
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
            
            // About Section
            'about-title': 'Vicente Litvak',
            'about-subtitle': 'Sobre mí',
            'about-paragraphs': [
                'Con más de 5 años guiando tours astronómicos en el Desierto de Atacama, he tenido el privilegio de compartir con miles de personas la magia de los cielos más puros del mundo.',
                'Mi pasión por la astronomía comenzó desde pequeño, y hoy combino conocimiento científico con tecnología de vanguardia para crear experiencias inolvidables bajo las estrellas.',
                'Utilizo telescopios Unistellar eVscope de última generación que permiten capturar y observar objetos del espacio profundo en tiempo real, transformando cada tour en una ventana hacia el universo.'
            ],
            
            // Tours Section
            'Nuestros Tours Astronómicos': 'Nuestros Tours Astronómicos',
            'Experiencias únicas bajo el cielo más claro del mundo': 'Experiencias únicas bajo el cielo más claro del mundo',
            'tour-1-title': 'Tour Astronómico Regular',
            'tour-1-desc': 'Observación a ojo desnudo con puntero láser, charla sobre el universo, observación por telescopio inteligente, cóctel bajo las estrellas y sesión de fotos.',
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
            'page-title': 'Atacama NightSky | Astronomical Tours in San Pedro de Atacama',
            'meta-description': 'Atacama NightSky: Guided tours with Unistellar telescope in the clearest desert in the world. Star observation, astrophotography and unique experiences.',
            
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
            'hero-subtitle': 'Expert-guided astronomical tours: star observation, constellations and deep space celestial phenomena.',
            'btn-reserve': 'Book Your Tour',
            'btn-see-tours': 'View Tours',

            // About Section
            'about-title': 'Vicente Litvak',
            'about-subtitle': 'About Me',
            'about-paragraphs': [
                'With more than 5 years guiding astronomical tours in the Atacama Desert, I have had the privilege of sharing with thousands of people the magic of the purest skies in the world.',
                'My passion for astronomy began as a child, and today I combine scientific knowledge with cutting-edge technology to create unforgettable experiences under the stars.',
                'I use next-generation Unistellar eVscope telescopes that allow capturing and observing deep space objects in real time, transforming each tour into a window to the universe.'
            ],
            
            // Tours Section
            'Nuestros Tours Astronómicos': 'Our Astronomical Tours',
            'Experiencias únicas bajo el cielo más claro del mundo': 'Unique experiences under the clearest sky in the world',
            'tour-1-title': 'Regular Astronomical Tour',
            'tour-1-desc': 'Naked eye observation with laser pointer, talk about the universe, observation through smart telescope, cocktail under the stars and photo session.',
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
            'page-title': 'Atacama NightSky | Passeios Astronômicos em San Pedro de Atacama',
            'meta-description': 'Atacama NightSky: Passeios guiados com telescópio Unistellar no deserto mais claro do mundo. Observação de estrelas, astrofotografia e experiências únicas.',
            
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
            'hero-subtitle': 'Passeios astronômicos guiados por especialistas: observação de estrelas, constelações e fenômenos celestes do espaço profundo.',
            'btn-reserve': 'Reserve Seu Passeio',
            'btn-see-tours': 'Ver Passeios',

            // About Section
            'about-title': 'Vicente Litvak',
            'about-subtitle': 'Sobre Mim',
            'about-paragraphs': [
                'Com mais de 5 anos guiando passeios astronômicos no Deserto de Atacama, tive o privilégio de compartilhar com milhares de pessoas a magia dos céus mais puros do mundo.',
                'Minha paixão pela astronomia começou desde pequeno, e hoje combino conhecimento científico com tecnologia de ponta para criar experiências inesquecíveis sob as estrelas.',
                'Utilizo telescópios Unistellar eVscope de última geração que permitem capturar e observar objetos do espaço profundo em tempo real, transformando cada passeio em uma janela para o universo.'
            ],
            
            // Tours Section
            'Nuestros Tours Astronómicos': 'Nossos Passeios Astronômicos',
            'Experiencias únicas bajo el cielo más claro del mundo': 'Experiências únicas sob o céu mais claro do mundo',
            'tour-1-title': 'Passeio Astronômico Regular',
            'tour-1-desc': 'Observação a olho nu com ponteiro laser, palestra sobre o universo, observação por telescópio inteligente, coquetel sob as estrelas e sessão de fotos.',
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
    
    function updateContent(lang) {
        // Update page meta tags
        document.title = translations[lang]['page-title'];
        document.querySelector('meta[name="description"]').setAttribute('content', translations[lang]['meta-description']);
        
        // Navigation
        navLinks.forEach(link => {
            const key = link.textContent.trim();
            if (translations[lang][key]) {
                link.textContent = translations[lang][key];
            }
        });
        
        // Hero Section
        document.querySelector('.hero-title').innerHTML = translations[lang]['hero-title'].map((line, idx) => 
            `<span class="line" style="display: ${idx === 0 ? 'block' : 'none'};">${line}</span>`
        ).join('');
        document.querySelector('.hero-subtitle').textContent = translations[lang]['hero-subtitle'];
        
        // About Section
        document.querySelector('.about-title').textContent = translations[lang]['about-title'];
        document.querySelector('.about-subtitle').textContent = translations[lang]['about-subtitle'];
        const aboutParagraphs = document.querySelectorAll('.about-paragraph');
        aboutParagraphs.forEach((p, idx) => {
            p.textContent = translations[lang]['about-paragraphs'][idx];
        });
        
        // Tours Section
        document.querySelector('.tours-title').textContent = translations[lang]['Nuestros Tours Astronómicos'];
        document.querySelector('.tours-subtitle').textContent = translations[lang]['Experiencias únicas bajo el cielo más claro del mundo'];
        const tourElements = document.querySelectorAll('.tour');
        tourElements.forEach((tour, idx) => {
            tour.querySelector('.tour-title').textContent = translations[lang][`tour-${idx+1}-title`];
            tour.querySelector('.tour-desc').textContent = translations[lang][`tour-${idx+1}-desc`];
        });
        
        // Testimonials
        document.querySelector('.testimonials-title').textContent = translations[lang]['testimonials-title'];
        
        // Contact Section
        document.querySelector('.contact-title').textContent = translations[lang]['contact-title'];
        document.querySelector('.contact-form-title').textContent = translations[lang]['contact-form-title'];
        document.querySelector('label[for="nombre"]').textContent = translations[lang]['placeholder-tu-nombre'];
        document.querySelector('label[for="email"]').textContent = translations[lang]['placeholder-tu-email'];
        document.querySelector('label[for="telefono"]').textContent = translations[lang]['placeholder-tu-teléfono'];
        document.querySelector('label[for="mensaje"]').textContent = translations[lang]['placeholder-tu-mensaje'];
        document.querySelector('label[for="fecha-hora"]').textContent = translations[lang]['label-calendar'];
        
        // Footer
        document.querySelector('.footer-atacama-nightsky').textContent = translations[lang]['footer-atacama-nightsky'];
        document.querySelector('.footer-enlaces-rápidos').textContent = translations[lang]['footer-enlaces-rápidos'];
        document.querySelector('.footer-servicios').textContent = translations[lang]['footer-servicios'];
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
    const slider = document.querySelector('.testimonial-slider');
    const slides = document.querySelectorAll('.testimonial-slide');
    const prevBtn = document.querySelector('.testimonial-prev');
    const nextBtn = document.querySelector('.testimonial-next');
    let currentIndex = 0;
    
    function showSlide(index) {
        slides.forEach((slide, idx) => {
            slide.style.transform = `translateX(${(idx - index) * 100}%)`;
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
    
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
    
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
    
    // Initialize date picker
    if (flatpickr) {
        flatpickr(dateInput, {
            enableTime: false,
            dateFormat: 'Y-m-d',
            minDate: 'today',
            locale: {
                firstDayOfWeek: 1 // Start week on Monday
            }
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
        titleTag.textContent = translations[lang]['page-title'] || 'Atacama NightSky | Tours Astronómicos en San Pedro de Atacama';
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.content = translations[lang]['meta-description'] || 'Atacama NightSky: Tours guiados con telescopio Unistellar en el desierto más claro del mundo.';
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
});

// ====== END OF CODE ======