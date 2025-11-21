// ============================================
// SOLUCIÓN PAYPAL + GOOGLE PAY PARA CHILE
// Implementación completa para aceptar pagos internacionales
// ============================================

/**
 * CONFIGURACIÓN REQUERIDA:
 * 1. Crear cuenta PayPal Business en Chile
 * 2. Obtener Client ID desde: https://developer.paypal.com/
 * 3. Configurar webhooks para notificaciones
 */

class PayPalInternationalPayments {
    constructor() {
        this.paypalLoaded = false;
        this.exchangeRates = {
            USD_TO_CLP: 900, // Actualizar con tasa actual
            EUR_TO_CLP: 950,
        };
    }

    // Inicializar PayPal SDK
    async initialize() {
        if (this.paypalLoaded) return;

        // Cargar PayPal SDK dinámicamente
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.PAYPAL_CLIENT_ID}&currency=USD&components=buttons,googlepay&enable-funding=card`;
        script.async = true;

        return new Promise((resolve, reject) => {
            script.onload = () => {
                this.paypalLoaded = true;
                console.log('PayPal SDK cargado correctamente');
                this.setupGooglePay();
                resolve();
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    // Configurar Google Pay a través de PayPal
    setupGooglePay() {
        if (!window.paypal || !window.paypal.Googlepay) {
            console.log('Google Pay no disponible');
            return false;
        }

        const googlePayConfig = {
            allowedPaymentMethods: [{
                type: 'CARD',
                parameters: {
                    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                    allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX', 'DISCOVER']
                },
                tokenizationSpecification: {
                    type: 'PAYMENT_GATEWAY',
                    parameters: {
                        gateway: 'paypal',
                        gatewayMerchantId: process.env.PAYPAL_MERCHANT_ID
                    }
                }
            }]
        };

        return googlePayConfig;
    }

    // Detectar mejor método de pago para el usuario
    async detectBestPaymentMethod() {
        try {
            // Detectar ubicación del usuario
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            const country = data.country_code;

            // Recomendar método según país
            if (country === 'CL') {
                return {
                    primary: 'mercadopago',
                    alternative: 'paypal',
                    currency: 'CLP'
                };
            } else if (['US', 'CA', 'GB', 'AU', 'NZ'].includes(country)) {
                return {
                    primary: 'googlepay',
                    alternative: 'paypal',
                    currency: 'USD'
                };
            } else {
                return {
                    primary: 'paypal',
                    alternative: 'card',
                    currency: 'USD'
                };
            }
        } catch (error) {
            return {
                primary: 'paypal',
                alternative: 'card',
                currency: 'USD'
            };
        }
    }

    // Renderizar botones de pago
    renderPaymentButtons(containerId, orderData) {
        const container = document.getElementById(containerId);

        // Limpiar contenedor
        container.innerHTML = '';

        // Crear tabs para métodos de pago
        const tabsHTML = `
            <div class="payment-tabs">
                <div class="tab-buttons">
                    <button class="tab-btn active" data-tab="international">
                        <i class="fab fa-paypal"></i> Pago Internacional
                    </button>
                    <button class="tab-btn" data-tab="chile">
                        <i class="fas fa-credit-card"></i> Pago Chile
                    </button>
                </div>

                <!-- Tab Internacional (PayPal + Google Pay) -->
                <div class="tab-content active" id="tab-international">
                    <div class="payment-notice">
                        <i class="fas fa-globe"></i>
                        <span>Acepta tarjetas internacionales y Google Pay</span>
                    </div>
                    <div id="paypal-button-container"></div>
                    <div id="google-pay-button-container"></div>
                </div>

                <!-- Tab Chile (Mercado Pago) -->
                <div class="tab-content" id="tab-chile">
                    <div class="payment-notice">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Para clientes con medios de pago chilenos</span>
                    </div>
                    <button class="btn btn-mercadopago" onclick="processMercadoPagoCheckout()">
                        <img src="https://http2.mlstatic.com/storage/logos-api-admin/4b977ef0-5d83-11ec-ae75-df2bef173be2-m.svg" alt="MP">
                        Pagar con Mercado Pago
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = tabsHTML;

        // Manejar tabs
        this.setupTabs();

        // Renderizar botones PayPal
        this.renderPayPalButtons('paypal-button-container', orderData);

        // Renderizar Google Pay si está disponible
        this.renderGooglePayButton('google-pay-button-container', orderData);
    }

    // Configurar tabs de métodos de pago
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;

                // Actualizar botones
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Actualizar contenido
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(`tab-${tabId}`).classList.add('active');
            });
        });
    }

    // Renderizar botones PayPal
    renderPayPalButtons(containerId, orderData) {
        if (!window.paypal) return;

        paypal.Buttons({
            style: {
                shape: 'rect',
                color: 'gold',
                layout: 'vertical',
                label: 'paypal',
            },

            // Crear orden
            createOrder: async (data, actions) => {
                // Calcular precio en USD
                const priceInUSD = this.convertToUSD(orderData.amount, orderData.currency);

                return actions.order.create({
                    purchase_units: [{
                        description: orderData.description,
                        amount: {
                            currency_code: 'USD',
                            value: priceInUSD.toFixed(2),
                            breakdown: {
                                item_total: {
                                    currency_code: 'USD',
                                    value: priceInUSD.toFixed(2)
                                }
                            }
                        },
                        items: [{
                            name: orderData.tourName,
                            unit_amount: {
                                currency_code: 'USD',
                                value: (priceInUSD / orderData.persons).toFixed(2)
                            },
                            quantity: orderData.persons
                        }]
                    }],
                    application_context: {
                        brand_name: 'Atacama Dark Sky Tours',
                        locale: 'es-CL',
                        shipping_preference: 'NO_SHIPPING'
                    }
                });
            },

            // Aprobar pago
            onApprove: async (data, actions) => {
                const order = await actions.order.capture();
                console.log('Pago completado:', order);

                // Guardar en base de datos
                await this.saveBooking(order, orderData);

                // Redirigir a página de éxito
                window.location.href = `/payment-success.html?order=${order.id}`;
            },

            // Manejar errores
            onError: (err) => {
                console.error('Error en PayPal:', err);
                alert('Hubo un error procesando el pago. Por favor intenta nuevamente.');
            }
        }).render(`#${containerId}`);
    }

    // Renderizar botón Google Pay
    async renderGooglePayButton(containerId, orderData) {
        const container = document.getElementById(containerId);

        // Verificar si Google Pay está disponible
        const paymentsClient = new google.payments.api.PaymentsClient({
            environment: 'PRODUCTION' // Cambiar a 'TEST' para pruebas
        });

        const isReadyToPayRequest = {
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [this.setupGooglePay()]
        };

        try {
            const response = await paymentsClient.isReadyToPay(isReadyToPayRequest);
            if (!response.result) {
                console.log('Google Pay no disponible');
                return;
            }

            // Crear botón de Google Pay
            const button = paymentsClient.createButton({
                onClick: () => this.processGooglePayPayment(orderData),
                buttonColor: 'black',
                buttonType: 'long',
                buttonLocale: 'es'
            });

            container.appendChild(button);
        } catch (error) {
            console.log('Error verificando Google Pay:', error);
        }
    }

    // Procesar pago con Google Pay
    async processGooglePayPayment(orderData) {
        const paymentsClient = new google.payments.api.PaymentsClient({
            environment: 'PRODUCTION',
            paymentDataCallbacks: {
                onPaymentAuthorized: this.onPaymentAuthorized.bind(this)
            }
        });

        const priceInUSD = this.convertToUSD(orderData.amount, orderData.currency);

        const paymentDataRequest = {
            apiVersion: 2,
            apiVersionMinor: 0,
            merchantInfo: {
                merchantId: process.env.GOOGLE_MERCHANT_ID,
                merchantName: 'Atacama Dark Sky Tours'
            },
            allowedPaymentMethods: [this.setupGooglePay()],
            transactionInfo: {
                totalPriceStatus: 'FINAL',
                totalPrice: priceInUSD.toFixed(2),
                currencyCode: 'USD',
                countryCode: 'CL'
            }
        };

        try {
            const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
            // Procesar con PayPal
            await this.processWithPayPal(paymentData, orderData);
        } catch (error) {
            console.error('Error en Google Pay:', error);
        }
    }

    // Convertir a USD
    convertToUSD(amount, currency) {
        if (currency === 'USD') return amount;
        if (currency === 'CLP') return amount / this.exchangeRates.USD_TO_CLP;
        if (currency === 'EUR') return amount / this.exchangeRates.EUR_TO_CLP * this.exchangeRates.USD_TO_CLP;
        return amount;
    }

    // Guardar reserva en base de datos
    async saveBooking(paypalOrder, bookingData) {
        const response = await fetch('/api/save-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paypalOrderId: paypalOrder.id,
                customerEmail: paypalOrder.payer.email_address,
                customerName: paypalOrder.payer.name.given_name + ' ' + paypalOrder.payer.name.surname,
                tourType: bookingData.tourType,
                tourDate: bookingData.date,
                persons: bookingData.persons,
                amount: paypalOrder.purchase_units[0].amount.value,
                currency: 'USD',
                status: 'confirmed',
                paymentMethod: 'paypal'
            })
        });

        return response.json();
    }
}

// ============================================
// IMPLEMENTACIÓN EN TU SITIO
// ============================================

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', async () => {
    const paymentHandler = new PayPalInternationalPayments();
    await paymentHandler.initialize();

    // Detectar mejor método para el usuario
    const bestMethod = await paymentHandler.detectBestPaymentMethod();
    console.log('Método recomendado:', bestMethod);

    // Actualizar UI según ubicación
    if (bestMethod.primary === 'mercadopago') {
        // Usuario en Chile: mostrar Mercado Pago primero
        document.querySelector('[data-tab="chile"]').click();
    }
});

// Función mejorada para mostrar modal con múltiples métodos
function showMultiPaymentModal(tourType, price, tourName) {
    const modalHTML = `
        <div id="payment-modal" class="modal-overlay">
            <div class="modal-content">
                <button class="modal-close" onclick="closePaymentModal()">&times;</button>

                <h2>✨ Complete su Reserva</h2>

                <!-- Información del tour -->
                <div class="tour-info">
                    <h3>${tourName}</h3>
                    <p class="price">Precio: $${parseInt(price).toLocaleString('es-CL')} CLP</p>
                </div>

                <!-- Formulario de datos -->
                <form id="booking-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Fecha del Tour *</label>
                            <input type="date" name="date" required min="${getTomorrowDate()}">
                        </div>
                        <div class="form-group">
                            <label>Personas *</label>
                            <select name="persons" required>
                                ${generatePersonsOptions(tourType)}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Nombre Completo *</label>
                        <input type="text" name="name" required>
                    </div>

                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" required>
                    </div>

                    <div class="form-group">
                        <label>WhatsApp *</label>
                        <input type="tel" name="phone" required placeholder="+56 9 xxxx xxxx">
                    </div>

                    <!-- Contenedor para botones de pago -->
                    <div id="payment-buttons-container"></div>
                </form>

                <!-- Badges de seguridad -->
                <div class="security-badges">
                    <img src="/images/ssl-badge.png" alt="SSL Secure">
                    <img src="/images/paypal-badge.png" alt="PayPal Verified">
                    <img src="/images/mercadopago-badge.png" alt="MercadoPago">
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Renderizar botones de pago cuando el formulario esté completo
    const form = document.getElementById('booking-form');
    form.addEventListener('input', () => {
        if (form.checkValidity()) {
            const paymentHandler = new PayPalInternationalPayments();
            const formData = new FormData(form);

            paymentHandler.renderPaymentButtons('payment-buttons-container', {
                tourType: tourType,
                tourName: tourName,
                amount: parseInt(price) * parseInt(formData.get('persons')),
                currency: 'CLP',
                persons: parseInt(formData.get('persons')),
                date: formData.get('date'),
                description: `${tourName} - ${formData.get('date')}`
            });
        }
    });
}

// CSS necesario para los nuevos elementos
const styles = `
<style>
.payment-tabs {
    margin: 20px 0;
}

.tab-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 2px solid #e0e0e0;
}

.tab-btn {
    padding: 12px 20px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: #666;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 3px solid transparent;
    transition: all 0.3s;
}

.tab-btn:hover {
    color: #333;
}

.tab-btn.active {
    color: #0070f3;
    border-bottom-color: #0070f3;
}

.tab-content {
    display: none;
    animation: fadeIn 0.3s;
}

.tab-content.active {
    display: block;
}

.payment-notice {
    background: #f0f8ff;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #0066cc;
}

.btn-mercadopago {
    width: 100%;
    padding: 16px;
    background: #009ee3;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: background 0.3s;
}

.btn-mercadopago:hover {
    background: #0086c9;
}

.btn-mercadopago img {
    height: 24px;
}

.security-badges {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
}

.security-badges img {
    height: 40px;
    opacity: 0.7;
}

#google-pay-button-container {
    margin-top: 10px;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Responsive */
@media (max-width: 768px) {
    .tab-buttons {
        flex-direction: column;
    }

    .tab-btn {
        width: 100%;
        justify-content: center;
    }
}
</style>
`;