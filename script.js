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
    initAnimations();
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
            'Testimonios': 'Testimonios',
            'Reservas': 'Reservas',
            'Contacto': 'Contacto',
            'Reserva Ahora': 'Reserva Ahora',
            'hero-title': 'Descubre el Cielo Más Puro del Mundo en San Pedro de Atacama',
            'hero-subtitle': 'Tours astronómicos guiados por expertos: observación de estrellas, constelaciones y fenómenos celestes.',
            'btn-reserve': 'Reserva Tu Tour',
            'btn-see-tours': 'Ver Tours'
        },
        en: {
            'Inicio': 'Home',
            'Sobre Nosotros': 'About Us',
            'Tours': 'Tours',
            'Testimonios': 'Testimonials',
            'Reservas': 'Bookings',
            'Contacto': 'Contact',
            'Reserva Ahora': 'Book Now',
            'hero-title': 'Discover the Purest Sky in the World in San Pedro de Atacama',
            'hero-subtitle': 'Expert-guided astronomical tours: star gazing, constellations and celestial phenomena.',
            'btn-reserve': 'Book Your Tour',
            'btn-see-tours': 'See Tours'
        }
    };

    let currentLang = 'es';

    langToggle.addEventListener('click', function() {
        currentLang = currentLang === 'es' ? 'en' : 'es';
        currentLangSpan.textContent = currentLang.toUpperCase();
        
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

        // Store language preference
        localStorage.setItem('preferred-language', currentLang);
    });

    // Load saved language preference
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang && savedLang !== 'es') {
        langToggle.click();
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

    function submitForm() {
        const submitButton = form.querySelector('.btn-submit');
        const originalText = submitButton.innerHTML;
        
        // Show loading state
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        submitButton.disabled = true;

        // Simulate form submission (replace with actual form submission)
        setTimeout(() => {
            // Hide form and show success message
            form.style.display = 'none';
            formSuccess.classList.add('show');
            
            // Scroll to success message
            formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Reset form after 5 seconds (for demo purposes)
            setTimeout(() => {
                form.reset();
                form.style.display = 'block';
                formSuccess.classList.remove('show');
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }, 5000);
        }, 2000);
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

// ===== DATE PICKER ENHANCEMENT =====
function initDatePicker() {
    const dateInput = document.getElementById('date');
    if (!dateInput) return;

    // Disable past dates and weekends if needed
    dateInput.addEventListener('input', function() {
        const selectedDate = new Date(this.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            this.value = '';
            alert('Por favor selecciona una fecha futura');
        }
    });

    // Add calendar icon click functionality
    const dateGroup = dateInput.closest('.form-group');
    const calendarIcon = document.createElement('i');
    calendarIcon.className = 'fas fa-calendar-alt date-icon';
    calendarIcon.style.position = 'absolute';
    calendarIcon.style.right = '12px';
    calendarIcon.style.top = '50%';
    calendarIcon.style.transform = 'translateY(-50%)';
    calendarIcon.style.color = 'var(--primary-color)';
    calendarIcon.style.cursor = 'pointer';
    calendarIcon.style.pointerEvents = 'none';

    dateGroup.style.position = 'relative';
    dateGroup.appendChild(calendarIcon);
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
        debounce,
        throttle
    };
}