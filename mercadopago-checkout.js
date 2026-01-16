// Mercado Pago Checkout Integration

// Helper function to get translations
function t(key) {
    const lang = localStorage.getItem('preferredLanguage') || 'es';
    if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    // Fallback to Spanish if key not found
    if (typeof translations !== 'undefined' && translations['es'] && translations['es'][key]) {
        return translations['es'][key];
    }
    return key;
}

document.addEventListener('DOMContentLoaded', function() {
    // Check for payment parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');

    // Si viene con action=pay, abrir modal automáticamente
    if (action === 'pay') {
        const tourType = urlParams.get('tour');
        const date = urlParams.get('date');
        const persons = urlParams.get('persons');
        const email = urlParams.get('email');
        const name = urlParams.get('name');

        // Obtener precio según tipo de tour
        let price, tourName;
        if (tourType === 'regular') {
            price = '30000';
            tourName = 'Tour Astronómico Regular';
        } else if (tourType === 'astro') {
            price = '120000';
            tourName = 'Tour Astrofotografía';
        } else if (tourType === 'private') {
            price = '145000';
            tourName = 'Tour Privado VIP';
        }

        if (price && tourName) {
            // Abrir modal con datos pre-cargados
            setTimeout(() => {
                showBookingModalWithData(tourType, price, tourName, {
                    date: date,
                    persons: persons,
                    email: email,
                    name: name
                });
            }, 500);
        }
    }

    // Get all Mercado Pago payment buttons
    const mpButtons = document.querySelectorAll('.btn-mercadopago');

    mpButtons.forEach((button) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const tourType = this.getAttribute('data-tour');
            const price = this.getAttribute('data-price');
            const tourName = this.getAttribute('data-tour-name');

            // Show modal to collect customer info
            showBookingModal(tourType, price, tourName);
        });
    });
});

// Nueva función para abrir modal con datos pre-cargados
function showBookingModalWithData(tourType, price, tourName, prefilledData = {}) {
    showBookingModal(tourType, price, tourName);

    // Esperar a que el modal esté renderizado y luego pre-llenar los campos
    setTimeout(() => {
        if (prefilledData.date) {
            const dateInput = document.getElementById('mp-date');
            if (dateInput) dateInput.value = prefilledData.date;
        }

        if (prefilledData.persons) {
            const personsSelect = document.getElementById('mp-persons');
            if (personsSelect) {
                personsSelect.value = prefilledData.persons;
                // Trigger change event to update price
                personsSelect.dispatchEvent(new Event('change'));
            }
        }

        if (prefilledData.name) {
            const nameInput = document.getElementById('mp-name');
            if (nameInput) nameInput.value = prefilledData.name;
        }

        if (prefilledData.email) {
            const emailInput = document.getElementById('mp-email');
            if (emailInput) emailInput.value = prefilledData.email;
        }
    }, 100);
}

function showBookingModal(tourType, price, tourName) {
    // Create modal HTML with translations
    const modalHTML = `
        <div id="mp-booking-modal" class="modal-overlay">
            <div class="modal-content">
                <button class="modal-close" onclick="closeBookingModal()">&times;</button>
                <h2>${t('checkout.title')}</h2>
                <p class="modal-subtitle">${t('checkout.subtitle')}</p>
                <div class="secure-payment-badge">
                    <i class="fas fa-shield-alt"></i>
                    <span>${t('checkout.secureBadge')}</span>
                </div>

                <form id="mp-booking-form">
                    <div class="form-group">
                        <label for="mp-date">${t('checkout.dateLabel')}</label>
                        <input type="date" id="mp-date" name="date" required min="${getMinDate()}">
                    </div>

                    <div class="form-group">
                        <label for="mp-persons">${t('checkout.personsLabel')}</label>
                        <select id="mp-persons" name="persons" required>
                            <option value="">${t('checkout.selectQuantity')}</option>
                            ${generatePersonOptions(tourType)}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="mp-name">${t('checkout.nameLabel')}</label>
                        <input type="text" id="mp-name" name="name" required placeholder="${t('checkout.namePlaceholder')}">
                        <small style="color: #9ca3af; font-size: 0.875rem; margin-top: 0.25rem; display: block;">
                            ${t('checkout.nameHelp')}
                        </small>
                    </div>

                    <!-- Campos dinámicos para acompañantes -->
                    <div id="companions-container" style="display: none;">
                        <div class="companions-header" style="margin: 1.5rem 0 1rem 0; padding: 0.75rem; background: rgba(99, 102, 241, 0.1); border-radius: 8px; border-left: 3px solid #6366f1;">
                            <h4 style="margin: 0; color: #6366f1; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-users"></i>
                                ${t('checkout.companionsTitle')}
                            </h4>
                            <small style="color: #6b7280; display: block; margin-top: 0.25rem;">
                                ${t('checkout.companionsHelp')}
                            </small>
                        </div>
                        <div id="companions-fields"></div>
                    </div>

                    <div class="form-group">
                        <label for="mp-email">${t('checkout.emailLabel')}</label>
                        <input type="email" id="mp-email" name="email" required placeholder="${t('checkout.emailPlaceholder')}">
                    </div>

                    <div class="form-group">
                        <label for="mp-phone">${t('checkout.phoneLabel')}</label>
                        <input type="tel" id="mp-phone" name="phone" required placeholder="${t('checkout.phonePlaceholder')}">
                    </div>

                    <div class="form-group">
                        <label for="mp-accommodation">${t('checkout.accommodationLabel')}</label>
                        <input type="text" id="mp-accommodation" name="accommodation" placeholder="${t('checkout.accommodationPlaceholder')}">
                    </div>

                    <div class="form-group">
                        <label for="mp-message">${t('checkout.messageLabel')}</label>
                        <textarea id="mp-message" name="message" rows="3" placeholder="${t('checkout.messagePlaceholder')}"></textarea>
                    </div>

                    <input type="hidden" name="tourType" value="${tourType}">
                    <input type="hidden" name="price" value="${price}">
                    <input type="hidden" name="tourName" value="${tourName}">

                    <div class="price-summary">
                        <p><strong>${t('checkout.tour')}</strong> ${tourName}</p>
                        <p id="base-price"><strong>${tourType === 'private' ? t('checkout.fixedPrice') : t('checkout.pricePerPerson')}</strong> $${parseInt(price).toLocaleString('es-CL')} CLP</p>
                        <p id="subtotal-price" style="display:none;"><strong>${t('checkout.subtotal')}:</strong> $0 CLP</p>
                        <p id="mp-fee" style="display:none; color: #6b7280; font-size: 0.9rem;"><strong>${t('checkout.mpFee')}</strong> $0 CLP</p>
                        <p id="total-price"><strong>${t('checkout.totalToPay')}</strong> $0 CLP</p>
                    </div>

                    <button type="submit" class="btn btn-mercadopago btn-submit">
                        <i class="fas fa-lock"></i> ${t('checkout.payButton')}
                    </button>
                </form>
            </div>
        </div>
    `;

    // Remove any existing modal first
    const existingModal = document.getElementById('mp-booking-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Guardar la posición actual del scroll
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('mp-booking-modal');

    // Asegurar que el modal sea visible y esté en la posición correcta
    if (modal) {
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            align-items: flex-start !important;
            justify-content: center !important;
            z-index: 99999 !important;
            background: rgba(0, 0, 0, 0.85) !important;
            backdrop-filter: blur(8px);
            visibility: visible !important;
            opacity: 1 !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            padding: 2rem 1rem !important;
            box-sizing: border-box !important;
        `;

        // Aplicar estilos al modal-content para asegurar que sea scrolleable
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.cssText = `
                max-height: none !important;
                height: auto !important;
                overflow: visible !important;
                margin: 0 auto 2rem auto !important;
                flex-shrink: 0 !important;
                width: 100% !important;
                max-width: 600px !important;
                position: relative !important;
            `;
        }
    }

    // Bloquear scroll del body y mantener posición
    document.body.classList.add('modal-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';

    // Add event listeners
    const form = document.getElementById('mp-booking-form');
    const personsSelect = document.getElementById('mp-persons');

    // Update total price when persons change
    personsSelect.addEventListener('change', function() {
        const persons = parseInt(this.value) || 0;
        const basePrice = parseInt(price);
        const MP_COMMISSION_RATE = 0.0464; // 4.64% = 3.9% + IVA

        let subtotal;
        if (tourType === 'private') {
            // Tour privado: precio fijo sin importar personas (1-6)
            subtotal = basePrice;
        } else {
            // Tours regular y astrofoto: precio por persona
            subtotal = basePrice * persons;
        }

        // Calcular tarifa de MercadoPago
        const totalWithFee = Math.round(subtotal / (1 - MP_COMMISSION_RATE));
        const mpFee = totalWithFee - subtotal;

        // Show/hide breakdown
        if (persons > 0) {
            if (tourType !== 'private') {
                const personText = persons > 1 ? t('checkout.persons') : t('checkout.person');
                document.getElementById('subtotal-price').style.display = 'block';
                document.getElementById('subtotal-price').innerHTML =
                    `<strong>${t('checkout.subtotal')} (${persons} ${personText}):</strong> $${subtotal.toLocaleString('es-CL')} CLP`;
            }
            // Mostrar tarifa de MercadoPago
            document.getElementById('mp-fee').style.display = 'block';
            document.getElementById('mp-fee').innerHTML =
                `<strong>${t('checkout.mpFee')}</strong> $${mpFee.toLocaleString('es-CL')} CLP`;
            document.getElementById('total-price').innerHTML =
                `<strong>${t('checkout.totalToPay')}</strong> $${totalWithFee.toLocaleString('es-CL')} CLP`;
        } else {
            document.getElementById('subtotal-price').style.display = 'none';
            document.getElementById('mp-fee').style.display = 'none';
            document.getElementById('total-price').innerHTML =
                `<strong>${t('checkout.totalToPay')}</strong> $0 CLP`;
        }

        // Generar campos dinámicos para acompañantes
        generateCompanionFields(persons);
    });

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validación adicional de nombres de acompañantes
        const personsCount = parseInt(personsSelect.value) || 0;
        if (personsCount > 1) {
            const missingNames = [];
            for (let i = 2; i <= personsCount; i++) {
                const companionInput = document.getElementById(`companion-${i}`);
                if (!companionInput || !companionInput.value.trim()) {
                    missingNames.push(i);
                }
            }

            if (missingNames.length > 0) {
                const lang = localStorage.getItem('preferredLanguage') || 'es';
                const personLabel = lang === 'en' ? 'Person' : (lang === 'pt' ? 'Pessoa' : 'Persona');
                const missingText = missingNames.map(n => `${personLabel} ${n}`).join(', ');
                alert(`⚠️ ${t('checkout.fillAllNames')}\n\n${missingText}\n\n${t('checkout.needForAgency')}`);

                // Hacer scroll al primer campo faltante
                const firstMissing = document.getElementById(`companion-${missingNames[0]}`);
                if (firstMissing) {
                    firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstMissing.focus();
                }
                return;
            }
        }

        await processMercadoPagoCheckout(form);
    });
}

async function processMercadoPagoCheckout(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('checkout.redirecting')}`;

    try {
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Recopilar todos los nombres de los participantes (quien reserva + acompañantes)
        const allNames = [data.name]; // Empezar con quien hace la reserva
        const totalPersons = parseInt(data.persons) || 1;

        // Agregar nombres de acompañantes si hay más de 1 persona
        for (let i = 2; i <= totalPersons; i++) {
            const companionName = data[`companion_${i}`];
            if (companionName && companionName.trim()) {
                allNames.push(companionName.trim());
            }
        }

        // Agregar el array de nombres al objeto data
        data.participant_names = allNames;
        data.total_participants = allNames.length;

        // Call our API to create the preference
        const response = await fetch('/api/create-preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear la preferencia de pago');
        }

        const result = await response.json();

        // Redirect to Mercado Pago checkout
        if (result.init_point) {
            // Track begin_checkout event in GA4
            if (typeof gtag === 'function') {
                gtag('event', 'begin_checkout', {
                    currency: 'CLP',
                    value: parseInt(data.price) || 30000,
                    items: [{
                        item_name: data.tourName || 'Tour Astronómico',
                        item_category: data.tourType || 'regular',
                        quantity: parseInt(data.persons) || 1,
                        price: parseInt(data.price) || 30000
                    }]
                });
                gtag('event', 'generate_lead', {
                    currency: 'CLP',
                    value: parseInt(data.price) || 30000
                });
            }
            submitBtn.innerHTML = `<i class="fas fa-check"></i> ${t('checkout.redirectingSecure')}`;
            window.location.href = result.init_point;
        } else {
            throw new Error('No se recibió URL de pago');
        }

    } catch (error) {
        console.error('Error:', error);
        alert(`❌ ${t('checkout.errorProcessing')} ${error.message}\n\n${t('checkout.tryAgain')}`);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function closeBookingModal() {
    const modal = document.getElementById('mp-booking-modal');
    if (modal) {
        // Obtener la posición guardada antes de remover el modal
        const scrollY = document.body.style.top;
        const scrollPosition = parseInt(scrollY || '0') * -1;

        modal.remove();

        // Restaurar scroll del body
        document.body.classList.remove('modal-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';

        // Restaurar posición del scroll
        window.scrollTo(0, scrollPosition);
    }
}

function getMinDate() {
    // Permitir reservas para el mismo día (tours nocturnos)
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function generatePersonOptions(tourType) {
    let options = '';
    const maxPersons = tourType === 'private' ? 4 : 16;

    for (let i = 1; i <= maxPersons; i++) {
        const personText = i > 1 ? t('checkout.persons') : t('checkout.person');
        options += `<option value="${i}">${i} ${personText}</option>`;
    }

    if (tourType !== 'private') {
        options += `<option value="16+">${t('checkout.moreThan16')}</option>`;
    }

    return options;
}

function generateCompanionFields(totalPersons) {
    const container = document.getElementById('companions-container');
    const fieldsDiv = document.getElementById('companions-fields');

    if (!container || !fieldsDiv) return;

    // Si es 1 persona o menos, ocultar completamente la sección
    if (totalPersons <= 1) {
        container.style.display = 'none';
        fieldsDiv.innerHTML = '';
        return;
    }

    // Mostrar la sección de acompañantes
    container.style.display = 'block';

    // Generar campos para personas 2 en adelante (persona 1 es quien reserva)
    let fieldsHTML = '';
    for (let i = 2; i <= totalPersons; i++) {
        const labelText = t('checkout.companionLabel').replace('{n}', i);
        const placeholderText = t('checkout.companionPlaceholder').replace('{n}', i - 1);
        fieldsHTML += `
            <div class="form-group companion-field" style="animation: slideIn 0.3s ease-out;">
                <label for="companion-${i}">
                    <i class="fas fa-user" style="color: #6366f1; margin-right: 0.5rem;"></i>
                    ${labelText}
                </label>
                <input
                    type="text"
                    id="companion-${i}"
                    name="companion_${i}"
                    required
                    placeholder="${placeholderText}"
                    style="transition: border-color 0.2s ease;"
                >
            </div>
        `;
    }

    fieldsDiv.innerHTML = fieldsHTML;

    // Agregar animación CSS si no existe
    if (!document.getElementById('companion-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'companion-animation-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .companion-field input:focus {
                border-color: #6366f1 !important;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('mp-booking-modal');
    if (modal && e.target === modal) {
        closeBookingModal();
    }
});

// Close modal with ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeBookingModal();
    }
});
