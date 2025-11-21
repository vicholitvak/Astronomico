// ============================================
// INTEGRACIÓN STRIPE + GOOGLE PAY
// Para pagos internacionales
// ============================================

class InternationalPaymentHandler {
    constructor() {
        this.stripe = null;
        this.paymentRequest = null;
    }

    // Inicializar Stripe y Google Pay
    async initialize() {
        // Tu clave pública de Stripe (obtener de dashboard.stripe.com)
        this.stripe = Stripe('pk_live_XXXXXX'); // Reemplazar con tu clave

        // Detectar país del usuario automáticamente
        const userCountry = await this.detectUserCountry();

        // Configurar Payment Request (base para Google Pay)
        this.paymentRequest = this.stripe.paymentRequest({
            country: 'CL',
            currency: userCountry === 'CL' ? 'clp' : 'usd',
            total: {
                label: 'Tour Astronómico Atacama',
                amount: 0, // Se actualiza dinámicamente
            },
            requestPayerName: true,
            requestPayerEmail: true,
            requestPayerPhone: true,
        });

        // Verificar si Google Pay está disponible
        const result = await this.paymentRequest.canMakePayment();
        if (result && result.googlePay) {
            console.log('Google Pay está disponible');
            return true;
        }
        return false;
    }

    // Detectar país del usuario
    async detectUserCountry() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return data.country_code || 'US';
        } catch {
            return 'US'; // Default
        }
    }

    // Calcular precio con conversión de moneda
    calculatePrice(basePrice, tourType, persons, currency) {
        const CLP_TO_USD_RATE = 0.0011; // Actualizar según tasa actual

        let subtotal;
        if (tourType === 'private') {
            subtotal = basePrice;
        } else {
            subtotal = basePrice * persons;
        }

        // Convertir a USD si es necesario
        if (currency === 'usd') {
            subtotal = Math.ceil(subtotal * CLP_TO_USD_RATE);
        }

        // Comisión de Stripe (2.9% + 0.30 USD)
        const stripeFee = currency === 'usd'
            ? (subtotal * 0.029) + 0.30
            : subtotal * 0.029;

        const total = subtotal + Math.ceil(stripeFee);

        return {
            subtotal,
            fee: Math.ceil(stripeFee),
            total,
            currency
        };
    }

    // Procesar pago con Google Pay
    async processGooglePay(tourData) {
        const { tourType, persons, date, price } = tourData;
        const userCountry = await this.detectUserCountry();
        const currency = userCountry === 'CL' ? 'clp' : 'usd';

        // Calcular precio total
        const pricing = this.calculatePrice(price, tourType, persons, currency);

        // Actualizar monto en Payment Request
        this.paymentRequest.update({
            currency: pricing.currency,
            total: {
                label: 'Total a Pagar',
                amount: pricing.total * 100, // Stripe usa centavos
            },
        });

        // Mostrar Google Pay
        this.paymentRequest.on('paymentmethod', async (ev) => {
            try {
                // Crear Payment Intent en tu servidor
                const response = await fetch('/api/stripe-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: pricing.total * 100,
                        currency: pricing.currency,
                        paymentMethodId: ev.paymentMethod.id,
                        tourData: tourData,
                        customerInfo: {
                            name: ev.payerName,
                            email: ev.payerEmail,
                            phone: ev.payerPhone,
                        }
                    }),
                });

                const { clientSecret, error } = await response.json();

                if (error) {
                    ev.complete('fail');
                    throw new Error(error);
                }

                // Confirmar pago
                const { paymentIntent } = await this.stripe.confirmCardPayment(
                    clientSecret,
                    { payment_method: ev.paymentMethod.id },
                    { handleActions: false }
                );

                if (paymentIntent.status === 'succeeded') {
                    ev.complete('success');
                    window.location.href = '/payment-success.html';
                } else {
                    ev.complete('fail');
                }
            } catch (error) {
                console.error('Error:', error);
                ev.complete('fail');
                alert('Error al procesar el pago');
            }
        });

        // Mostrar botón de Google Pay
        this.paymentRequest.show();
    }
}

// ============================================
// INTEGRACIÓN EN TU MODAL EXISTENTE
// ============================================

function showEnhancedBookingModal(tourType, price, tourName) {
    const modalHTML = `
        <div id="mp-booking-modal" class="modal-overlay">
            <div class="modal-content">
                <button class="modal-close" onclick="closeBookingModal()">&times;</button>
                <h2>🌟 Asegura tu Cupo Ahora</h2>

                <!-- Selector de método de pago -->
                <div class="payment-method-selector">
                    <h3>Selecciona tu método de pago:</h3>

                    <div class="payment-options">
                        <!-- Opción Mercado Pago (Chile) -->
                        <label class="payment-option">
                            <input type="radio" name="paymentMethod" value="mercadopago" checked>
                            <div class="payment-card">
                                <img src="https://http2.mlstatic.com/storage/logos-api-admin/4b977ef0-5d83-11ec-ae75-df2bef173be2-m.svg" alt="Mercado Pago">
                                <span class="payment-name">Mercado Pago</span>
                                <span class="payment-desc">Para clientes en Chile</span>
                                <span class="payment-fee">Comisión: 5.94%</span>
                            </div>
                        </label>

                        <!-- Opción Google Pay (Internacional) -->
                        <label class="payment-option">
                            <input type="radio" name="paymentMethod" value="googlepay">
                            <div class="payment-card">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay">
                                <span class="payment-name">Google Pay</span>
                                <span class="payment-desc">Tarjetas internacionales</span>
                                <span class="payment-fee">Comisión: 2.9%</span>
                                <div class="accepted-cards">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" alt="Mastercard">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" alt="Amex">
                                </div>
                            </div>
                        </label>

                        <!-- Opción Wise (Transferencia) -->
                        <label class="payment-option">
                            <input type="radio" name="paymentMethod" value="wise">
                            <div class="payment-card">
                                <img src="https://wise.com/public-resources/assets/logos/wise-logo.svg" alt="Wise">
                                <span class="payment-name">Wise Transfer</span>
                                <span class="payment-desc">Transferencia bancaria internacional</span>
                                <span class="payment-fee">Comisión: ~1%</span>
                                <span class="payment-note">⏱️ Procesamiento: 1-2 días</span>
                            </div>
                        </label>
                    </div>
                </div>

                <form id="mp-booking-form">
                    <!-- Campos del formulario existente... -->
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

                    <!-- Selector de moneda (se muestra solo para pagos internacionales) -->
                    <div class="form-group" id="currency-selector" style="display:none;">
                        <label for="mp-currency">Moneda de pago</label>
                        <select id="mp-currency" name="currency">
                            <option value="clp">CLP - Pesos Chilenos</option>
                            <option value="usd">USD - Dólares</option>
                            <option value="eur">EUR - Euros</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="mp-name">Nombre Completo *</label>
                        <input type="text" id="mp-name" name="name" required>
                    </div>

                    <div class="form-group">
                        <label for="mp-email">Email *</label>
                        <input type="email" id="mp-email" name="email" required>
                    </div>

                    <div class="form-group">
                        <label for="mp-phone">Teléfono/WhatsApp *</label>
                        <input type="tel" id="mp-phone" name="phone" required>
                    </div>

                    <!-- Resumen de precio dinámico -->
                    <div class="price-summary">
                        <p><strong>Tour:</strong> ${tourName}</p>
                        <p id="total-price"><strong>Total:</strong> Calculando...</p>
                        <p id="payment-info" class="payment-info"></p>
                    </div>

                    <button type="submit" class="btn btn-submit" id="payment-button">
                        <i class="fas fa-lock"></i> Continuar con el Pago
                    </button>
                </form>
            </div>
        </div>
    `;

    // Insertar modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Manejar cambio de método de pago
    document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const method = e.target.value;
            const currencySelector = document.getElementById('currency-selector');
            const paymentInfo = document.getElementById('payment-info');
            const submitButton = document.getElementById('payment-button');

            if (method === 'googlepay' || method === 'wise') {
                currencySelector.style.display = 'block';

                if (method === 'wise') {
                    paymentInfo.innerHTML = '⏱️ Tu reserva quedará pendiente hasta confirmar la transferencia';
                    submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Solicitar Reserva';
                } else {
                    paymentInfo.innerHTML = '✅ Pago instantáneo con tarjeta';
                    submitButton.innerHTML = '<i class="fas fa-lock"></i> Pagar con Google Pay';
                }
            } else {
                currencySelector.style.display = 'none';
                paymentInfo.innerHTML = '';
                submitButton.innerHTML = '<i class="fas fa-lock"></i> Pagar con Mercado Pago';
            }

            updatePriceDisplay();
        });
    });

    // Actualizar precio cuando cambien personas o moneda
    document.getElementById('mp-persons').addEventListener('change', updatePriceDisplay);
    document.getElementById('mp-currency').addEventListener('change', updatePriceDisplay);

    // Manejar envío del formulario
    document.getElementById('mp-booking-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const formData = new FormData(e.target);

        switch(paymentMethod) {
            case 'mercadopago':
                await processMercadoPagoCheckout(e.target);
                break;
            case 'googlepay':
                const paymentHandler = new InternationalPaymentHandler();
                await paymentHandler.initialize();
                await paymentHandler.processGooglePay({
                    tourType,
                    persons: formData.get('persons'),
                    date: formData.get('date'),
                    price: parseInt(price)
                });
                break;
            case 'wise':
                await processWiseTransfer(formData);
                break;
        }
    });
}

// Función para actualizar display de precio
function updatePriceDisplay() {
    const persons = parseInt(document.getElementById('mp-persons').value) || 0;
    const currency = document.getElementById('mp-currency').value || 'clp';
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    if (persons > 0) {
        // Calcular precio según método de pago
        // Implementar lógica de conversión y comisiones
        const total = calculateTotalPrice(persons, currency, paymentMethod);
        document.getElementById('total-price').innerHTML =
            `<strong>Total:</strong> ${formatPrice(total, currency)}`;
    }
}

// Estilos CSS adicionales necesarios
const additionalStyles = `
<style>
.payment-method-selector {
    margin: 20px 0;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 10px;
}

.payment-options {
    display: grid;
    gap: 15px;
    margin-top: 15px;
}

.payment-option {
    cursor: pointer;
}

.payment-card {
    display: flex;
    align-items: center;
    padding: 15px;
    border: 2px solid #ddd;
    border-radius: 8px;
    background: white;
    transition: all 0.3s;
}

.payment-option input[type="radio"] {
    display: none;
}

.payment-option input[type="radio"]:checked + .payment-card {
    border-color: #4CAF50;
    background: #f0f8ff;
}

.payment-card img {
    width: 40px;
    height: auto;
    margin-right: 15px;
}

.payment-name {
    font-weight: bold;
    flex: 1;
}

.payment-desc {
    color: #666;
    font-size: 0.9em;
    margin: 0 10px;
}

.payment-fee {
    color: #28a745;
    font-size: 0.85em;
}

.payment-note {
    display: block;
    color: #ff9800;
    font-size: 0.85em;
    margin-top: 5px;
}

.accepted-cards {
    display: flex;
    gap: 5px;
    margin-left: 10px;
}

.accepted-cards img {
    width: 30px;
    height: auto;
}

#currency-selector {
    background: #fff3cd;
    padding: 10px;
    border-radius: 5px;
}

.payment-info {
    background: #d4edda;
    color: #155724;
    padding: 10px;
    border-radius: 5px;
    margin: 10px 0;
    text-align: center;
}
</style>
`;