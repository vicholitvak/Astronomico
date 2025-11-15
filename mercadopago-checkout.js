// Mercado Pago Checkout Integration
console.log('[MP DEBUG] Script loaded at:', new Date().toLocaleTimeString());

document.addEventListener('DOMContentLoaded', function() {
    console.log('[MP DEBUG] DOM Content Loaded at:', new Date().toLocaleTimeString());
    console.log('[MP DEBUG] Mercado Pago checkout script initialized');

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
                            ${generatePersonOptions()}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="mp-name">Nombre Completo *</label>
                        <input type="text" id="mp-name" name="name" required placeholder="Tu nombre completo">
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
                        <p><strong>Precio por persona:</strong> $${parseInt(price).toLocaleString('es-CL')} CLP</p>
                        <p id="total-price"><strong>Total:</strong> $0 CLP</p>
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
        const total = persons * parseInt(price);
        document.getElementById('total-price').innerHTML =
            `<strong>Total:</strong> $${total.toLocaleString('es-CL')} CLP`;
    });

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
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

        console.log('Creating Mercado Pago preference:', data);

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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

function generatePersonOptions() {
    let options = '';
    for (let i = 1; i <= 16; i++) {
        options += `<option value="${i}">${i} persona${i > 1 ? 's' : ''}</option>`;
    }
    options += '<option value="16+">Más de 16 personas (contactar)</option>';
    return options;
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
