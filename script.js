// ===== TOURS ASTRONÓMICOS ATACAMA - JAVASCRIPT =====
// Main JavaScript functionality for astronomical tours website

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
    initTelescopeGallery();
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
            'Inicio': 'Inicio',
            'Sobre Nosotros': 'Sobre Nosotros',
            'Tours': 'Tours',
            'Telescopio': 'Telescopio',
            'Reservas': 'Reservas',
            'Contacto': 'Contacto',
            'Reserva Ahora': 'Reserva Ahora',
            'hero-title': 'Descubre A Dark Sky - El Cielo Más Puro del Mundo en San Pedro de Atacama',
            'hero-subtitle': 'Tours astronómicos guiados por expertos: observación de estrellas, constelaciones y fenómenos celestes.',
            'btn-reserve': 'Reserva Tu Tour',
            'btn-see-tours': 'Ver Tours'
        },
        en: {
            'Inicio': 'Home',
            'Sobre Nosotros': 'About Us',
            'Tours': 'Tours',
            'Telescopio': 'Telescope',
            'Reservas': 'Bookings',
            'Contacto': 'Contact',
            'Reserva Ahora': 'Book Now',
            'hero-title': 'Discover A Dark Sky - The Purest Sky in the World in San Pedro de Atacama',
            'hero-subtitle': 'Expert-guided astronomical tours: star gazing, constellations and celestial phenomena.',
            'btn-reserve': 'Book Your Tour',
            'btn-see-tours': 'See Tours'
        },
        pt: {
            'Inicio': 'Início',
            'Sobre Nosotros': 'Sobre Nós',
            'Tours': 'Tours',
            'Telescopio': 'Telescópio',
            'Reservas': 'Reservas',
            'Contacto': 'Contato',
            'Reserva Ahora': 'Reserve Agora',
            'hero-title': 'Descubra A Dark Sky - O Céu Mais Puro do Mundo em San Pedro de Atacama',
            'hero-subtitle': 'Tours astronômicos guiados por especialistas: observação de estrelas, constelações e fenômenos celestiais.',
            'btn-reserve': 'Reserve Seu Tour',
            'btn-see-tours': 'Ver Tours'
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

        // Update specific elements
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const btnReserve = document.querySelector('.hero-buttons .btn-primary');
        const btnSee = document.querySelector('.hero-buttons .btn-secondary');

        if (heroTitle) heroTitle.textContent = translations[currentLang]['hero-title'];
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

    testimonialsSection.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
    });

    testimonialsSection.addEventListener('touchend', function(e) {
        endX = e.changedTouches[0].clientX;
        handleSwipe();
    });

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
            // Preparar datos del formulario
            const formData = new FormData(form);
            
            // Procesar reserva con Google Calendar
            if (typeof processBookingWithCalendar === 'function') {
                await processBookingWithCalendar(formData);
            } else {
                // Fallback si Google Calendar no está disponible
                showBookingSuccessWithWarning({
                    date: formData.get('date'),
                    time: formData.get('time'),
                    persons: formData.get('persons')
                }, 'Google Calendar API no disponible', localStorage.getItem('preferred-language') || 'es');
            }
            
            // Hide form and show success message
            form.style.display = 'none';
            formSuccess.classList.add('show');
            
            // Scroll to success message
            formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Reset form after 10 seconds
            setTimeout(() => {
                form.reset();
                form.style.display = 'block';
                formSuccess.classList.remove('show');
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }, 10000);
            
        } catch (error) {
            console.error('Error processing booking:', error);
            
            // Show error message
            alert('Hubo un error procesando tu reserva. Por favor inténtalo de nuevo o contáctanos directamente por WhatsApp.');
            
            // Restore button
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

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
    console.log('Initializing telescope gallery...');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const modal = document.getElementById('galleryModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.querySelector('.close-modal');
    const prevBtn = document.getElementById('prevImage');
    const nextBtn = document.getElementById('nextImage');
    
    // Carousel elements
    const carouselTrack = document.getElementById('carouselTrack');
    const carouselPrev = document.getElementById('carouselPrev');
    const carouselNext = document.getElementById('carouselNext');
    const indicators = document.querySelectorAll('.indicator');
    
    console.log('Gallery items found:', galleryItems.length);
    console.log('Modal found:', modal ? 'Yes' : 'No');
    console.log('Carousel elements found:', carouselTrack ? 'Yes' : 'No');
    
    if (galleryItems.length === 0) {
        console.warn('No gallery items found - telescope gallery not initialized');
        return;
    }
    
    // Carousel variables
    let currentSlide = 0;
    const totalSlides = 2; // We have 2 slides
    
    let currentImageIndex = 0;
    const imagesSources = [];
    
    // Collect all image sources
    galleryItems.forEach((item, index) => {
        const img = item.querySelector('img');
        imagesSources.push(img.src);
        
        // Add click event to open modal
        item.addEventListener('click', () => {
            console.log('Gallery item clicked, index:', index);
            currentImageIndex = index;
            showModal();
        });
        
        // Add keyboard support
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                currentImageIndex = index;
                showModal();
            }
        });
        
        // Make items focusable
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `Ver imagen ${index + 1} del telescopio`);
    });
    
    function showModal() {
        console.log('showModal called, currentImageIndex:', currentImageIndex);
        console.log('Image source:', imagesSources[currentImageIndex]);
        
        if (!modal || !modalImage) {
            console.error('Modal or modalImage not found');
            return;
        }
        
        modal.classList.add('active');
        modalImage.src = imagesSources[currentImageIndex];
        modalImage.alt = `Imagen ${currentImageIndex + 1} del telescopio Unistellar`;
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Focus the modal for screen readers
        modal.focus();
        console.log('Modal opened');
    }
    
    function hideModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    function showPreviousImage() {
        currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : imagesSources.length - 1;
        modalImage.src = imagesSources[currentImageIndex];
        modalImage.alt = `Imagen ${currentImageIndex + 1} del telescopio Unistellar`;
    }
    
    function showNextImage() {
        currentImageIndex = currentImageIndex < imagesSources.length - 1 ? currentImageIndex + 1 : 0;
        modalImage.src = imagesSources[currentImageIndex];
        modalImage.alt = `Imagen ${currentImageIndex + 1} del telescopio Unistellar`;
    }
    
    // Modal event listeners
    if (closeModal) {
        closeModal.addEventListener('click', hideModal);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', showPreviousImage);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', showNextImage);
    }
    
    // Close modal when clicking outside the image
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('active')) {
            switch(e.key) {
                case 'Escape':
                    hideModal();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    showPreviousImage();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    showNextImage();
                    break;
            }
        }
    });
    
    // Touch/swipe support for mobile
    let startX = null;
    
    modalImage.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });
    
    modalImage.addEventListener('touchend', (e) => {
        if (!startX) return;
        
        const endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;
        
        if (Math.abs(diffX) > 50) { // Minimum swipe distance
            if (diffX > 0) {
                showNextImage(); // Swipe left - next image
            } else {
                showPreviousImage(); // Swipe right - previous image
            }
        }
        
        startX = null;
    });
    
    // ===== CAROUSEL FUNCTIONALITY =====
    function updateCarousel() {
        if (carouselTrack) {
            const translateX = -currentSlide * 50; // Each slide is 50% width
            carouselTrack.style.transform = `translateX(${translateX}%)`;
            
            // Update indicators
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === currentSlide);
            });
            
            console.log('Carousel updated to slide:', currentSlide);
        }
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }
    
    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateCarousel();
    }
    
    // Carousel event listeners
    if (carouselNext) {
        carouselNext.addEventListener('click', nextSlide);
    }
    
    if (carouselPrev) {
        carouselPrev.addEventListener('click', prevSlide);
    }
    
    // Indicator clicks
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
        });
    });
    
    // Auto-slide every 8 seconds
    setInterval(nextSlide, 8000);
    
    // Initialize carousel
    updateCarousel();
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

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initNavigation,
        initLanguageToggle,
        initTestimonialSlider,
        initBookingForm,
        initSmoothScrolling,
        initTelescopeGallery,
        debounce,
        throttle
    };
}