// Mercado Pago Checkout Integration
console.log('[MP DEBUG] Script loaded at:', new Date().toLocaleTimeString());

document.addEventListener('DOMContentLoaded', function() {
    console.log('[MP DEBUG] DOM Content Loaded at:', new Date().toLocaleTimeString());
    console.log('[MP DEBUG] Mercado Pago checkout script initialized');

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

        console.log('[MP DEBUG] Payment URL detected with params:', {
            tourType, date, persons, email, name
        });

        // Obtener precio según tipo de tour
        let price, tourName;
        if (tourType === 'regular') {
            price = '30000';
            tourName = 'Tour Astronómico Regular';
        } else if (tourType === 'astro') {
            price = '120000';
            tourName = 'Tour Astrofotografía';
        } else if (tourType === 'private') {
            price = '200000';
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
            }, 500); // Pequeño delay para asegurar que todo esté cargado
        }
    }

    // Get all Mercado Pago payment buttons
    const mpButtons = document.querySelectorAll('.btn-mercadopago');
    console.log('[MP DEBUG] Found MP buttons:', mpButtons.length);
    console.log('[MP DEBUG] Button details:', Array.from(mpButtons).map(b => ({
        tour: b.getAttribute('data-tour'),
        visible: b.offsetParent !== null,
        disabled: b.disabled
    })));

    if (mpButtons.length === 0) {
        console.error('[MP DEBUG] NO BUTTONS FOUND! Checking HTML...');
    }

    mpButtons.forEach((button, index) => {
        console.log(`[MP DEBUG] Adding click listener to button ${index + 1}`);

        button.addEventListener('click', function(e) {
            console.log(`[MP DEBUG] BUTTON ${index + 1} CLICKED!`);
            e.preventDefault();
            e.stopPropagation();

            const tourType = this.getAttribute('data-tour');
            const price = this.getAttribute('data-price');
            const tourName = this.getAttribute('data-tour-name');

            console.log('[MP DEBUG] Button click data:', {
                tourType,
                price,
                tourName
            });

            // Show modal to collect customer info
            try {
                showBookingModal(tourType, price, tourName);
                console.log('[MP DEBUG] Modal function called successfully');
            } catch (error) {
                console.error('[MP DEBUG] Error calling modal:', error);
            }
        });

        console.log(`[MP DEBUG] Listener added to button ${index + 1}`);
    });

    console.log('[MP DEBUG] All event listeners attached');
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

        console.log('[MP DEBUG] Pre-filled modal with:', prefilledData);
    }, 100);
}

function showBookingModal(tourType, price, tourName) {
    // Create modal HTML
    const modalHTML = `
        <div id="mp-booking-modal" class="modal-overlay">
            <div class="modal-content">
                <button class="modal-close" onclick="closeBookingModal()">&times;</button>
                <h2>🌟 Asegura tu Cupo Ahora</h2>
                <p class="modal-subtitle">Completa el pago para confirmar tu reserva instantáneamente</p>
                <div class="secure-payment-badge">
                    <i class="fas fa-shield-alt"></i>
                    <span>Pago 100% Seguro con Mercado Pago</span>
                </div>

                <form id="mp-booking-form">
                    <div class="form-group">
                        <label for="mp-date">Fecha del Tour *</label>
                        <input type="date" id="mp-date" name="date" required min="${getMinDate()}">
                    </div>

                    <div class="form-group">
                        <label for="mp-persons">Número de Personas *</label>
                        <select id="mp-persons" name="persons" required>
                            <option value="">Selecciona cantidad</option>
                            ${generatePersonOptions(tourType)}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="mp-name">Nombre Completo (Persona 1) *</label>
                        <input type="text" id="mp-name" name="name" required placeholder="Tu nombre completo">
                        <small style="color: #9ca3af; font-size: 0.875rem; margin-top: 0.25rem; display: block;">
                            Este es quien hace la reserva
                        </small>
                    </div>

                    <!-- Campos dinámicos para acompañantes -->
                    <div id="companions-container" style="display: none;">
                        <div class="companions-header" style="margin: 1.5rem 0 1rem 0; padding: 0.75rem; background: rgba(99, 102, 241, 0.1); border-radius: 8px; border-left: 3px solid #6366f1;">
                            <h4 style="margin: 0; color: #6366f1; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-users"></i>
                                Nombres de Acompañantes
                            </h4>
                            <small style="color: #6b7280; display: block; margin-top: 0.25rem;">
                                Necesitamos esta información para la lista de la agencia
                            </small>
                        </div>
                        <div id="companions-fields"></div>
                    </div>

                    <div class="form-group">
                        <label for="mp-email">Email *</label>
                        <input type="email" id="mp-email" name="email" required placeholder="tu@email.com">
                    </div>

                    <div class="form-group">
                        <label for="mp-phone">Teléfono/WhatsApp *</label>
                        <input type="tel" id="mp-phone" name="phone" required placeholder="+56 9 1234 5678">
                    </div>

                    <div class="form-group">
                        <label for="mp-accommodation">Alojamiento (Opcional)</label>
                        <input type="text" id="mp-accommodation" name="accommodation" placeholder="Nombre de tu hotel/hostal">
                    </div>

                    <div class="form-group">
                        <label for="mp-message">Mensaje Adicional</label>
                        <textarea id="mp-message" name="message" rows="3" placeholder="¿Algún requerimiento especial?"></textarea>
                    </div>

                    <input type="hidden" name="tourType" value="${tourType}">
                    <input type="hidden" name="price" value="${price}">
                    <input type="hidden" name="tourName" value="${tourName}">

                    <div class="price-summary">
                        <p><strong>Tour:</strong> ${tourName}</p>
                        <p id="base-price"><strong>${tourType === 'private' ? 'Precio fijo (1-6 personas)' : 'Precio por persona'}:</strong> $${parseInt(price).toLocaleString('es-CL')} CLP</p>
                        <p id="subtotal-price" style="display:none;"><strong>Subtotal:</strong> $0 CLP</p>
                        <p id="total-price"><strong>Total a Pagar:</strong> $0 CLP</p>
                    </div>

                    <button type="submit" class="btn btn-mercadopago btn-submit">
                        <i class="fas fa-lock"></i> Pagar y Asegurar mi Cupo
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
    console.log('[MP DEBUG] Scroll position:', scrollPosition);

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('[MP DEBUG] Modal HTML inserted');

    // Verificar que el modal existe
    const modal = document.getElementById('mp-booking-modal');
    console.log('[MP DEBUG] Modal element:', modal);
    console.log('[MP DEBUG] Modal display:', modal ? window.getComputedStyle(modal).display : 'N/A');
    console.log('[MP DEBUG] Modal visibility:', modal ? window.getComputedStyle(modal).visibility : 'N/A');
    console.log('[MP DEBUG] Modal position:', modal ? window.getComputedStyle(modal).position : 'N/A');
    console.log('[MP DEBUG] Modal z-index:', modal ? window.getComputedStyle(modal).zIndex : 'N/A');

    // Asegurar que el modal sea visible y esté en la posición correcta
    if (modal) {
        // Forzar estilos inline para asegurar que se apliquen
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 99999 !important;
            background: rgba(0, 0, 0, 0.85) !important;
            backdrop-filter: blur(8px);
            visibility: visible !important;
            opacity: 1 !important;
        `;
        console.log('[MP DEBUG] Inline styles applied to modal');

        // Verificar estilos después de aplicarlos
        console.log('[MP DEBUG] After inline - Position:', window.getComputedStyle(modal).position);
        console.log('[MP DEBUG] After inline - Z-index:', window.getComputedStyle(modal).zIndex);
    }

    // Bloquear scroll del body y mantener posición
    document.body.classList.add('modal-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';

    console.log('[MP DEBUG] Body styles applied');

    // Add event listeners
    const form = document.getElementById('mp-booking-form');
    const personsSelect = document.getElementById('mp-persons');

    // Update total price when persons change
    personsSelect.addEventListener('change', function() {
        const persons = parseInt(this.value) || 0;
        const basePrice = parseInt(price);

        let total;
        if (tourType === 'private') {
            // Tour privado: precio fijo sin importar personas (1-6)
            total = basePrice;
        } else {
            // Tours regular y astrofoto: precio por persona
            total = basePrice * persons;
        }

        // Show/hide breakdown
        if (persons > 0) {
            if (tourType !== 'private') {
                document.getElementById('subtotal-price').style.display = 'block';
                document.getElementById('subtotal-price').innerHTML =
                    `<strong>Subtotal (${persons} ${persons > 1 ? 'personas' : 'persona'}):</strong> $${total.toLocaleString('es-CL')} CLP`;
            }
            document.getElementById('total-price').innerHTML =
                `<strong>Total a Pagar:</strong> $${total.toLocaleString('es-CL')} CLP`;
        } else {
            document.getElementById('subtotal-price').style.display = 'none';
            document.getElementById('total-price').innerHTML =
                `<strong>Total a Pagar:</strong> $0 CLP`;
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
                const missingText = missingNames.map(n => `Persona ${n}`).join(', ');
                alert(`⚠️ Por favor completa los nombres de todos los participantes:\n\n${missingText}\n\nNecesitamos esta información para la lista de la agencia.`);

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
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirigiendo a Mercado Pago...';

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

        console.log('Creating Mercado Pago preference:', data);
        console.log('Participant names:', allNames);

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
        console.log('Preference created:', result);

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
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Redirigiendo a pago seguro...';
            window.location.href = result.init_point;
        } else {
            throw new Error('No se recibió URL de pago');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al procesar el pago: ' + error.message + '\n\nPor favor intenta nuevamente o contáctanos por WhatsApp.');
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
        options += `<option value="${i}">${i} persona${i > 1 ? 's' : ''}</option>`;
    }

    if (tourType !== 'private') {
        options += '<option value="16+">Más de 16 personas (contactar)</option>';
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
        fieldsHTML += `
            <div class="form-group companion-field" style="animation: slideIn 0.3s ease-out;">
                <label for="companion-${i}">
                    <i class="fas fa-user" style="color: #6366f1; margin-right: 0.5rem;"></i>
                    Nombre Completo (Persona ${i}) *
                </label>
                <input
                    type="text"
                    id="companion-${i}"
                    name="companion_${i}"
                    required
                    placeholder="Nombre completo del acompañante ${i - 1}"
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
