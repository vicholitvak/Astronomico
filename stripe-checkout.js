/**
 * Stripe Checkout Integration for Atacama NightSky
 * Handles payment processing for tour bookings
 */

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Stripe (Publishable Key will be set from env variable)
    // Note: This key should be replaced with your actual Stripe publishable key
    const stripePublicKey = 'pk_test_REPLACE_WITH_YOUR_KEY'; // TODO: Replace with actual key

    // Only initialize if key is set
    if (!stripePublicKey || stripePublicKey.includes('REPLACE')) {
        console.warn('⚠️ Stripe publishable key not configured. Payment buttons will show a message.');
    }

    const stripe = window.Stripe ? window.Stripe(stripePublicKey) : null;

    // Get all Stripe payment buttons
    const stripeButtons = document.querySelectorAll('.btn-stripe');

    stripeButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();

            // Check if Stripe is initialized
            if (!stripe) {
                alert('Sistema de pagos no configurado aún. Por favor, usa "Reservar Después" para agendar tu tour.');
                return;
            }

            // Get tour data from button attributes
            const tourType = this.dataset.tour;
            const tourPrice = this.dataset.price;
            const tourName = this.dataset.tourName;

            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            this.disabled = true;

            // Open simple form modal to get customer info
            showCheckoutForm(tourType, tourPrice, tourName, stripe, this, originalText);
        });
    });
});

/**
 * Show checkout form modal to collect customer information
 */
function showCheckoutForm(tourType, tourPrice, tourName, stripe, button, originalButtonText) {
    // Create modal HTML
    const modalHTML = `
        <div id="checkout-modal" class="checkout-modal">
            <div class="checkout-modal-content">
                <span class="close-modal">&times;</span>
                <h2>💳 Finalizar Reserva - ${tourName}</h2>
                <p class="modal-subtitle">Complete sus datos para proceder al pago seguro con Stripe</p>

                <form id="stripe-checkout-form">
                    <div class="form-group">
                        <label for="checkout-name">Nombre Completo *</label>
                        <input type="text" id="checkout-name" name="name" required placeholder="Juan Pérez">
                    </div>

                    <div class="form-group">
                        <label for="checkout-email">Email *</label>
                        <input type="email" id="checkout-email" name="email" required placeholder="juan@example.com">
                    </div>

                    <div class="form-group">
                        <label for="checkout-phone">Teléfono / WhatsApp *</label>
                        <input type="tel" id="checkout-phone" name="phone" required placeholder="+56 9 1234 5678">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="checkout-date">Fecha del Tour *</label>
                            <input type="date" id="checkout-date" name="date" required>
                        </div>

                        <div class="form-group">
                            <label for="checkout-persons">Personas *</label>
                            <select id="checkout-persons" name="persons" required>
                                <option value="1">1 persona</option>
                                <option value="2">2 personas</option>
                                <option value="3">3 personas</option>
                                <option value="4">4 personas</option>
                                <option value="5">5 personas</option>
                                <option value="6">6 personas</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="checkout-accommodation">Hostal o Dirección de Alojamiento (Opcional)</label>
                        <input type="text" id="checkout-accommodation" name="accommodation" placeholder="Ej: Hostel Luna Atacama, Hotel Tierra Atacama, Calle Caracoles #123">
                        <small class="form-help">Ayúdanos a planificar mejor la logística del tour</small>
                    </div>

                    <div class="form-group">
                        <label for="checkout-message">Mensaje o Solicitudes Especiales (Opcional)</label>
                        <textarea id="checkout-message" name="message" rows="3" placeholder="Ej: Necesito transporte desde el hotel, soy principiante en astronomía, etc."></textarea>
                    </div>

                    <div class="price-summary">
                        <div class="summary-row">
                            <span>Precio por persona:</span>
                            <span class="price-value">$${parseInt(tourPrice).toLocaleString('es-CL')} CLP</span>
                        </div>
                        <div class="summary-row total-row">
                            <span><strong>Total a pagar:</strong></span>
                            <span class="total-price" id="total-price">$${parseInt(tourPrice).toLocaleString('es-CL')} CLP</span>
                        </div>
                        <p class="payment-note">
                            <i class="fas fa-shield-alt"></i> Pago seguro procesado por Stripe. Aceptamos todas las tarjetas de crédito y débito.
                        </p>
                    </div>

                    <div class="modal-buttons">
                        <button type="button" class="btn btn-secondary-outline cancel-checkout">Cancelar</button>
                        <button type="submit" class="btn btn-stripe">
                            <i class="fas fa-lock"></i> Pagar con Stripe
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal elements
    const modal = document.getElementById('checkout-modal');
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = modal.querySelector('.cancel-checkout');
    const form = document.getElementById('stripe-checkout-form');
    const personsSelect = document.getElementById('checkout-persons');
    const totalPriceEl = document.getElementById('total-price');

    // Update total price when persons change
    personsSelect.addEventListener('change', function() {
        const persons = parseInt(this.value);
        const unitPrice = parseInt(tourPrice);
        const total = unitPrice * persons;
        totalPriceEl.textContent = `$${total.toLocaleString('es-CL')} CLP`;
    });

    // Close modal handlers
    closeBtn.onclick = () => closeModal();
    cancelBtn.onclick = () => closeModal();
    window.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    function closeModal() {
        modal.remove();
        button.innerHTML = originalButtonText;
        button.disabled = false;
    }

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get form data
        const formData = new FormData(form);
        const data = {
            tourType,
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            date: formData.get('date'),
            persons: formData.get('persons'),
            accommodation: formData.get('accommodation') || '',
            message: formData.get('message') || ''
        };

        // Show loading on submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalSubmitText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando sesión de pago...';
        submitBtn.disabled = true;

        try {
            // Call backend to create checkout session
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            // Redirect to Stripe Checkout
            const {error} = await stripe.redirectToCheckout({
                sessionId: result.sessionId
            });

            if (error) {
                throw new Error(error.message);
            }

        } catch (error) {
            console.error('Checkout error:', error);
            alert(`Error al procesar el pago: ${error.message}\n\nPor favor intenta nuevamente o usa "Reservar Después".`);
            submitBtn.innerHTML = originalSubmitText;
            submitBtn.disabled = false;
        }
    });
}
