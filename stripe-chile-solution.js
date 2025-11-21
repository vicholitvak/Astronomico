// ============================================
// SOLUCIÓN STRIPE PARA CHILE
// Implementación usando Stripe Atlas o alternativas
// ============================================

/**
 * OPCIÓN 1: STRIPE DIRECTO (Requiere Stripe Atlas)
 * Pasos previos necesarios:
 * 1. Registrarte en https://stripe.com/atlas
 * 2. Pagar $500 USD y esperar aprobación
 * 3. Obtener tu Stripe Secret Key y Publishable Key
 */

class StripeChileSolution {
    constructor() {
        // Configuración según tu situación
        this.config = {
            // OPCIÓN A: Si tienes Stripe Atlas
            stripeAtlas: {
                publishableKey: 'pk_live_xxxxx', // Reemplazar con tu key
                secretKey: 'sk_live_xxxxx', // Para el backend
                currency: 'USD', // Stripe Atlas opera en USD
            },

            // OPCIÓN B: Usando Paddle como intermediario
            paddle: {
                vendorId: 'xxxxx', // Tu Paddle vendor ID
                environment: 'production',
            },

            // Tasas de cambio (actualizar diariamente)
            exchangeRates: {
                CLP_TO_USD: 0.0011, // 1 CLP = 0.0011 USD aprox
                USD_TO_CLP: 910,    // 1 USD = 910 CLP aprox
            }
        };

        this.selectedMethod = null;
    }

    // ===========================================
    // OPCIÓN 1: STRIPE DIRECTO (con Atlas)
    // ===========================================

    async initializeStripe() {
        // Verificar si tienes Stripe configurado
        if (!this.config.stripeAtlas.publishableKey.includes('xxxxx')) {
            this.stripe = Stripe(this.config.stripeAtlas.publishableKey);
            console.log('Stripe inicializado correctamente');
            return true;
        } else {
            console.warn('Stripe no configurado - necesitas Stripe Atlas primero');
            return false;
        }
    }

    // Crear checkout session con Stripe
    async createStripeCheckout(bookingData) {
        const { tourType, tourName, persons, date, price, customerEmail } = bookingData;

        // Convertir precio de CLP a USD
        const priceUSD = Math.ceil(price * this.config.exchangeRates.CLP_TO_USD * 100) / 100;
        const totalUSD = tourType === 'private' ? priceUSD : priceUSD * persons;

        try {
            // Llamar a tu API backend para crear sesión
            const response = await fetch('/api/stripe-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: totalUSD,
                    tourName,
                    tourType,
                    persons,
                    date,
                    customerEmail,
                    successUrl: 'https://atacamadarksky.cl/payment-success',
                    cancelUrl: 'https://atacamadarksky.cl/payment-cancelled'
                })
            });

            const { sessionId } = await response.json();

            // Redirigir a Stripe Checkout
            const { error } = await this.stripe.redirectToCheckout({ sessionId });

            if (error) {
                console.error('Error:', error);
                alert('Error al procesar el pago');
            }
        } catch (error) {
            console.error('Error creating checkout:', error);
            this.fallbackToPaddle(bookingData);
        }
    }

    // ===========================================
    // OPCIÓN 2: PADDLE (Alternativa sin Atlas)
    // ===========================================

    async initializePaddle() {
        // Cargar Paddle SDK
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.paddle.com/paddle/paddle.js';
            script.onload = () => {
                if (this.config.paddle.vendorId !== 'xxxxx') {
                    Paddle.Setup({
                        vendor: parseInt(this.config.paddle.vendorId)
                    });
                    console.log('Paddle inicializado como alternativa');
                    resolve(true);
                } else {
                    console.warn('Paddle no configurado');
                    resolve(false);
                }
            };
            document.head.appendChild(script);
        });
    }

    // Procesar pago con Paddle
    async processPaddlePayment(bookingData) {
        const { tourType, tourName, persons, date, price, customerEmail, customerName } = bookingData;

        // Convertir a USD
        const priceUSD = Math.ceil(price * this.config.exchangeRates.CLP_TO_USD * 100) / 100;
        const totalUSD = tourType === 'private' ? priceUSD : priceUSD * persons;

        Paddle.Checkout.open({
            product: 12345, // ID de tu producto en Paddle
            title: tourName,
            message: `Reserva para ${persons} persona(s) - ${date}`,
            price: totalUSD,
            currency: 'USD',
            email: customerEmail,
            passthrough: JSON.stringify({
                tourType,
                date,
                persons,
                customerName
            }),
            successCallback: (data) => {
                console.log('Pago exitoso:', data);
                window.location.href = '/payment-success.html';
            },
            closeCallback: () => {
                console.log('Checkout cerrado');
            }
        });
    }

    // ===========================================
    // OPCIÓN 3: HYBRID - Detectar mejor método
    // ===========================================

    async setupBestPaymentMethod() {
        // Intentar Stripe primero
        const stripeAvailable = await this.initializeStripe();

        if (stripeAvailable) {
            this.selectedMethod = 'stripe';
            console.log('Usando Stripe (tienes Atlas configurado)');
        } else {
            // Fallback a Paddle
            const paddleAvailable = await this.initializePaddle();
            if (paddleAvailable) {
                this.selectedMethod = 'paddle';
                console.log('Usando Paddle como alternativa');
            } else {
                this.selectedMethod = 'manual';
                console.log('Usando transferencia manual');
            }
        }

        return this.selectedMethod;
    }

    // Fallback a Paddle si Stripe falla
    fallbackToPaddle(bookingData) {
        console.log('Stripe no disponible, cambiando a Paddle...');
        this.processPaddlePayment(bookingData);
    }

    // ===========================================
    // UI MEJORADA CON MÚLTIPLES OPCIONES
    // ===========================================

    renderPaymentModal(tourType, price, tourName) {
        const modalHTML = `
            <div id="payment-modal" class="modal">
                <div class="modal-content">
                    <h2>🌟 Completa tu Reserva</h2>

                    <!-- Alerta para usuarios internacionales -->
                    <div class="international-notice">
                        <i class="fas fa-globe"></i>
                        <span>Aceptamos pagos internacionales en USD</span>
                    </div>

                    <!-- Formulario de reserva -->
                    <form id="booking-form">
                        <div class="form-group">
                            <label>Fecha del Tour *</label>
                            <input type="date" name="date" required>
                        </div>

                        <div class="form-group">
                            <label>Número de Personas *</label>
                            <select name="persons" required>
                                ${this.generatePersonOptions(tourType)}
                            </select>
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
                            <input type="tel" name="phone" required>
                        </div>

                        <!-- Mostrar precio en ambas monedas -->
                        <div class="price-display">
                            <div class="price-clp">
                                <span class="label">Precio en CLP:</span>
                                <span class="amount" id="price-clp">$0</span>
                            </div>
                            <div class="price-usd">
                                <span class="label">Precio en USD:</span>
                                <span class="amount" id="price-usd">$0</span>
                            </div>
                            <div class="exchange-rate">
                                <small>Tasa: 1 USD = ${this.config.exchangeRates.USD_TO_CLP} CLP</small>
                            </div>
                        </div>

                        <!-- Botones de pago según disponibilidad -->
                        <div class="payment-buttons">
                            ${this.renderPaymentButtons()}
                        </div>
                    </form>

                    <!-- Información de seguridad -->
                    <div class="security-info">
                        <i class="fas fa-lock"></i>
                        <span>Pago 100% seguro con encriptación SSL</span>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.attachEventListeners(tourType, price, tourName);
    }

    renderPaymentButtons() {
        let buttons = '';

        // Botón para Mercado Pago (siempre disponible para Chile)
        buttons += `
            <button type="button" class="btn btn-mercadopago" onclick="payWithMercadoPago()">
                <img src="/images/mercadopago-logo.svg" alt="MP">
                Pagar con Mercado Pago (Chile)
            </button>
        `;

        // Botón según método internacional disponible
        if (this.selectedMethod === 'stripe') {
            buttons += `
                <button type="button" class="btn btn-stripe" onclick="payWithStripe()">
                    <i class="fab fa-stripe"></i>
                    Pagar con Tarjeta Internacional
                </button>
            `;
        } else if (this.selectedMethod === 'paddle') {
            buttons += `
                <button type="button" class="btn btn-paddle" onclick="payWithPaddle()">
                    <i class="fas fa-credit-card"></i>
                    Pagar con Tarjeta (via Paddle)
                </button>
            `;
        } else {
            buttons += `
                <button type="button" class="btn btn-transfer" onclick="requestBankTransfer()">
                    <i class="fas fa-university"></i>
                    Solicitar Transferencia Bancaria
                </button>
            `;
        }

        return buttons;
    }

    // Manejar eventos del formulario
    attachEventListeners(tourType, basePrice, tourName) {
        const form = document.getElementById('booking-form');
        const personsSelect = form.querySelector('[name="persons"]');

        // Actualizar precios cuando cambian las personas
        const updatePrices = () => {
            const persons = parseInt(personsSelect.value) || 0;
            let totalCLP = tourType === 'private' ? basePrice : basePrice * persons;
            let totalUSD = totalCLP * this.config.exchangeRates.CLP_TO_USD;

            document.getElementById('price-clp').textContent =
                `$${totalCLP.toLocaleString('es-CL')} CLP`;
            document.getElementById('price-usd').textContent =
                `$${totalUSD.toFixed(2)} USD`;
        };

        personsSelect.addEventListener('change', updatePrices);
        updatePrices(); // Actualizar al cargar

        // Manejar envío del formulario
        window.payWithStripe = async () => {
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            await this.createStripeCheckout({
                tourType,
                tourName,
                price: basePrice,
                persons: formData.get('persons'),
                date: formData.get('date'),
                customerEmail: formData.get('email'),
                customerName: formData.get('name')
            });
        };

        window.payWithPaddle = async () => {
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            await this.processPaddlePayment({
                tourType,
                tourName,
                price: basePrice,
                persons: formData.get('persons'),
                date: formData.get('date'),
                customerEmail: formData.get('email'),
                customerName: formData.get('name')
            });
        };

        window.payWithMercadoPago = () => {
            // Tu implementación actual de Mercado Pago
            processMercadoPagoCheckout(form);
        };
    }

    generatePersonOptions(tourType) {
        const max = tourType === 'private' ? 4 : 16;
        let options = '<option value="">Seleccionar</option>';
        for (let i = 1; i <= max; i++) {
            options += `<option value="${i}">${i} persona${i > 1 ? 's' : ''}</option>`;
        }
        return options;
    }
}

// ===========================================
// BACKEND API PARA STRIPE (api/stripe-checkout.js)
// ===========================================

const stripeBackendCode = `
// api/stripe-checkout.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, tourName, tourType, persons, date, customerEmail, successUrl, cancelUrl } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: tourName,
                        description: \`Tour para \${persons} personas - \${date}\`,
                        metadata: {
                            tourType,
                            date,
                            persons
                        }
                    },
                    unit_price: Math.round(amount * 100), // Stripe usa centavos
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: customerEmail,
            metadata: {
                tourType,
                date,
                persons
            },
            payment_intent_data: {
                description: \`\${tourName} - \${date}\`,
            }
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: error.message });
    }
}
`;

// ===========================================
// INICIALIZACIÓN
// ===========================================

document.addEventListener('DOMContentLoaded', async () => {
    const paymentHandler = new StripeChileSolution();

    // Detectar y configurar mejor método de pago
    const method = await paymentHandler.setupBestPaymentMethod();

    console.log(`Sistema de pagos configurado: ${method}`);

    // Agregar listener a botones de pago
    document.querySelectorAll('.btn-mercadopago').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const tourType = this.dataset.tour;
            const price = parseInt(this.dataset.price);
            const tourName = this.dataset.tourName;

            paymentHandler.renderPaymentModal(tourType, price, tourName);
        });
    });
});

// ===========================================
// ESTILOS CSS NECESARIOS
// ===========================================

const styles = `
<style>
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.modal-content {
    background: white;
    padding: 30px;
    border-radius: 15px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.international-notice {
    background: #e3f2fd;
    color: #1565c0;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.price-display {
    background: #f5f5f5;
    padding: 15px;
    border-radius: 10px;
    margin: 20px 0;
}

.price-display .price-clp,
.price-display .price-usd {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    font-size: 18px;
}

.price-display .amount {
    font-weight: bold;
    color: #2e7d32;
}

.exchange-rate {
    text-align: center;
    color: #666;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed #ccc;
}

.payment-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
}

.btn {
    padding: 15px 20px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.3s;
}

.btn-stripe {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-stripe:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-paddle {
    background: #4a90e2;
    color: white;
}

.btn-mercadopago {
    background: #009ee3;
    color: white;
}

.btn-mercadopago img {
    height: 20px;
}

.btn-transfer {
    background: #757575;
    color: white;
}

.security-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 20px;
    color: #666;
    font-size: 14px;
}

.security-info i {
    color: #4caf50;
}

/* Responsive */
@media (max-width: 480px) {
    .modal-content {
        padding: 20px;
    }

    .price-display {
        font-size: 16px;
    }
}
</style>
`;

// Exportar para uso
export default StripeChileSolution;