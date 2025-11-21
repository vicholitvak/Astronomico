// ============================================
// INTEGRACIÓN PADDLE - RECOMENDADA PARA CHILE
// Setup: 1 día | Sin riesgo | 5% comisión
// ============================================

/**
 * PASOS PREVIOS:
 * 1. Crear cuenta en https://paddle.com (gratis)
 * 2. Verificar identidad con RUT chileno
 * 3. Crear productos en Paddle Dashboard
 * 4. Obtener tu Vendor ID
 */

class PaddlePaymentSystem {
    constructor() {
        this.vendorId = process.env.PADDLE_VENDOR_ID || 'TU_VENDOR_ID';
        this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
        this.isInitialized = false;

        // Tasas de cambio (actualizar semanalmente)
        this.exchangeRates = {
            CLP_TO_USD: 0.0011,
            USD_TO_CLP: 910
        };

        // IDs de productos en Paddle (configurar en dashboard)
        this.products = {
            regular: 'PRODUCT_ID_1',      // Tour Regular
            astrophoto: 'PRODUCT_ID_2',   // Astrofotografía
            private: 'PRODUCT_ID_3'       // Tour Privado
        };
    }

    // Inicializar Paddle SDK
    async initialize() {
        if (this.isInitialized) return true;

        return new Promise((resolve, reject) => {
            // Cargar SDK de Paddle
            const script = document.createElement('script');
            script.src = 'https://cdn.paddle.com/paddle/paddle.js';
            script.async = true;

            script.onload = () => {
                // Configurar Paddle
                if (this.environment === 'production') {
                    Paddle.Environment.set('production');
                } else {
                    Paddle.Environment.set('sandbox');
                }

                Paddle.Setup({ vendor: parseInt(this.vendorId) });

                this.isInitialized = true;
                console.log('✅ Paddle inicializado correctamente');
                resolve(true);
            };

            script.onerror = () => {
                console.error('❌ Error cargando Paddle SDK');
                reject(false);
            };

            document.head.appendChild(script);
        });
    }

    // Mostrar modal de pago mejorado
    showPaymentModal(tourType, price, tourName) {
        const modalHTML = `
            <div id="paddle-modal" class="payment-modal">
                <div class="modal-content">
                    <button class="modal-close" onclick="closePaddleModal()">&times;</button>

                    <div class="modal-header">
                        <h2>✨ Completa tu Reserva</h2>
                        <p class="subtitle">Pago 100% seguro con Paddle</p>
                    </div>

                    <!-- Información del tour -->
                    <div class="tour-summary">
                        <h3>${tourName}</h3>
                        <div class="price-badge">
                            <span class="price-clp">$${parseInt(price).toLocaleString('es-CL')} CLP</span>
                            <span class="price-usd">~$${this.convertToUSD(price).toFixed(2)} USD</span>
                        </div>
                    </div>

                    <!-- Selector de método de pago -->
                    <div class="payment-method-tabs">
                        <button class="tab-btn active" data-method="international">
                            🌍 Pago Internacional
                        </button>
                        <button class="tab-btn" data-method="chile">
                            🇨🇱 Pago Chile
                        </button>
                    </div>

                    <!-- Formulario de reserva -->
                    <form id="paddle-booking-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Fecha del Tour *</label>
                                <input type="date" name="date" required min="${this.getMinDate()}">
                            </div>

                            <div class="form-group">
                                <label>Personas *</label>
                                <select name="persons" id="persons-select" required>
                                    <option value="">Seleccionar</option>
                                    ${this.generatePersonOptions(tourType)}
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Nombre Completo *</label>
                            <input type="text" name="name" required placeholder="Tu nombre">
                        </div>

                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" name="email" required placeholder="tu@email.com">
                        </div>

                        <div class="form-group">
                            <label>WhatsApp *</label>
                            <input type="tel" name="phone" required placeholder="+56 9 xxxx xxxx">
                        </div>

                        <div class="form-group">
                            <label>Alojamiento (opcional)</label>
                            <input type="text" name="accommodation" placeholder="Hotel/Hostal">
                        </div>

                        <!-- Resumen de precio dinámico -->
                        <div class="price-summary" id="price-summary">
                            <div class="price-row">
                                <span>Subtotal:</span>
                                <span id="subtotal">-</span>
                            </div>
                            <div class="price-row fee">
                                <span>Comisión Paddle (5%):</span>
                                <span id="fee">-</span>
                            </div>
                            <div class="price-row total">
                                <span>Total a Pagar:</span>
                                <span id="total">-</span>
                            </div>
                        </div>

                        <!-- Botones de pago -->
                        <div class="payment-buttons" id="payment-buttons">
                            <!-- Tab Internacional -->
                            <div class="tab-content active" data-tab="international">
                                <button type="button" class="btn btn-paddle" id="btn-paddle">
                                    <svg class="paddle-icon" viewBox="0 0 200 200" width="24" height="24">
                                        <rect fill="#6837FC" width="200" height="200" rx="20"/>
                                        <path fill="white" d="M60,60h80v20H60V60z M60,100h80v20H60V100z M60,140h50v20H60V140z"/>
                                    </svg>
                                    Pagar con Tarjeta Internacional
                                </button>
                                <div class="accepted-cards">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" alt="MC">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" alt="Amex">
                                </div>
                            </div>

                            <!-- Tab Chile -->
                            <div class="tab-content" data-tab="chile">
                                <button type="button" class="btn btn-mercadopago" id="btn-mercadopago">
                                    <img src="https://http2.mlstatic.com/storage/logos-api-admin/4b977ef0-5d83-11ec-ae75-df2bef173be2-m.svg" alt="MP">
                                    Pagar con Mercado Pago
                                </button>
                            </div>
                        </div>

                        <!-- Badges de seguridad -->
                        <div class="security-badges">
                            <div class="badge">
                                <i class="fas fa-lock"></i>
                                <span>Pago Seguro SSL</span>
                            </div>
                            <div class="badge">
                                <i class="fas fa-shield-alt"></i>
                                <span>PCI Compliant</span>
                            </div>
                            <div class="badge">
                                <i class="fas fa-undo"></i>
                                <span>Reembolso Fácil</span>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Insertar modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Configurar event listeners
        this.setupModalEventListeners(tourType, price, tourName);
    }

    // Configurar event listeners del modal
    setupModalEventListeners(tourType, basePrice, tourName) {
        // Tabs de método de pago
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const method = btn.dataset.method;

                // Actualizar tabs
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Actualizar contenido
                tabContents.forEach(content => content.classList.remove('active'));
                document.querySelector(`[data-tab="${method}"]`).classList.add('active');
            });
        });

        // Actualizar precio cuando cambian personas
        const personsSelect = document.getElementById('persons-select');
        personsSelect.addEventListener('change', () => {
            this.updatePriceDisplay(tourType, basePrice);
        });

        // Botón Paddle
        document.getElementById('btn-paddle').addEventListener('click', (e) => {
            e.preventDefault();
            const form = document.getElementById('paddle-booking-form');
            if (form.checkValidity()) {
                this.openPaddleCheckout(tourType, basePrice, tourName);
            } else {
                form.reportValidity();
            }
        });

        // Botón Mercado Pago
        document.getElementById('btn-mercadopago').addEventListener('click', (e) => {
            e.preventDefault();
            const form = document.getElementById('paddle-booking-form');
            if (form.checkValidity()) {
                this.processMercadoPago();
            } else {
                form.reportValidity();
            }
        });

        // Actualizar precio inicial
        this.updatePriceDisplay(tourType, basePrice);
    }

    // Abrir checkout de Paddle
    async openPaddleCheckout(tourType, basePrice, tourName) {
        const form = document.getElementById('paddle-booking-form');
        const formData = new FormData(form);
        const persons = parseInt(formData.get('persons'));

        // Calcular precio en USD
        const priceUSD = this.convertToUSD(basePrice);
        const totalUSD = tourType === 'private' ? priceUSD : priceUSD * persons;

        // Metadata del tour
        const passthrough = {
            tourType: tourType,
            tourDate: formData.get('date'),
            persons: persons,
            customerName: formData.get('name'),
            customerPhone: formData.get('phone'),
            accommodation: formData.get('accommodation') || 'N/A'
        };

        // Configurar checkout de Paddle
        Paddle.Checkout.open({
            product: this.products[tourType],
            title: tourName,
            message: `${persons} persona(s) - ${formData.get('date')}`,
            email: formData.get('email'),
            country: 'CL',
            passthrough: JSON.stringify(passthrough),
            successCallback: (data) => {
                console.log('✅ Pago exitoso:', data);
                this.handlePaymentSuccess(data);
            },
            closeCallback: () => {
                console.log('Modal de pago cerrado');
            }
        });
    }

    // Manejar pago exitoso
    async handlePaymentSuccess(paddleData) {
        // Guardar en base de datos
        await this.saveBookingToDatabase(paddleData);

        // Redirigir a página de éxito
        window.location.href = `/payment-success.html?order=${paddleData.checkout.id}`;
    }

    // Guardar reserva en base de datos
    async saveBookingToDatabase(paddleData) {
        const passthrough = JSON.parse(paddleData.checkout.passthrough);

        const bookingData = {
            payment_id: paddleData.checkout.id,
            payment_method: 'paddle',
            tour_type: passthrough.tourType,
            tour_date: passthrough.tourDate,
            persons: passthrough.persons,
            customer_name: passthrough.customerName,
            customer_email: paddleData.user.email,
            customer_phone: passthrough.customerPhone,
            accommodation: passthrough.accommodation,
            amount: paddleData.checkout.prices.customer.total,
            currency: paddleData.checkout.prices.customer.currency,
            status: 'confirmed',
            created_at: new Date().toISOString()
        };

        try {
            const response = await fetch('/api/save-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            if (response.ok) {
                console.log('✅ Reserva guardada en base de datos');
            }
        } catch (error) {
            console.error('❌ Error guardando reserva:', error);
        }
    }

    // Actualizar display de precio
    updatePriceDisplay(tourType, basePrice) {
        const persons = parseInt(document.getElementById('persons-select').value) || 0;

        if (persons === 0) {
            document.getElementById('subtotal').textContent = '-';
            document.getElementById('fee').textContent = '-';
            document.getElementById('total').textContent = '-';
            return;
        }

        const subtotal = tourType === 'private' ? basePrice : basePrice * persons;
        const fee = Math.ceil(subtotal * 0.05); // 5% de Paddle
        const total = subtotal + fee;

        const subtotalUSD = this.convertToUSD(subtotal);
        const feeUSD = this.convertToUSD(fee);
        const totalUSD = this.convertToUSD(total);

        document.getElementById('subtotal').innerHTML = `
            $${subtotal.toLocaleString('es-CL')} CLP
            <small>(~$${subtotalUSD.toFixed(2)} USD)</small>
        `;
        document.getElementById('fee').innerHTML = `
            $${fee.toLocaleString('es-CL')} CLP
            <small>(~$${feeUSD.toFixed(2)} USD)</small>
        `;
        document.getElementById('total').innerHTML = `
            $${total.toLocaleString('es-CL')} CLP
            <small>(~$${totalUSD.toFixed(2)} USD)</small>
        `;
    }

    // Utilidades
    convertToUSD(amountCLP) {
        return Math.ceil(amountCLP * this.exchangeRates.CLP_TO_USD * 100) / 100;
    }

    getMinDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    generatePersonOptions(tourType) {
        const max = tourType === 'private' ? 4 : 16;
        let options = '';
        for (let i = 1; i <= max; i++) {
            options += `<option value="${i}">${i} persona${i > 1 ? 's' : ''}</option>`;
        }
        return options;
    }

    processMercadoPago() {
        // Usar tu implementación existente de Mercado Pago
        const form = document.getElementById('paddle-booking-form');
        processMercadoPagoCheckout(form);
    }
}

// Función para cerrar modal
window.closePaddleModal = function() {
    const modal = document.getElementById('paddle-modal');
    if (modal) modal.remove();
};

// Inicializar sistema de pagos
document.addEventListener('DOMContentLoaded', async () => {
    const paddleSystem = new PaddlePaymentSystem();
    await paddleSystem.initialize();

    // Reemplazar listeners de botones existentes
    document.querySelectorAll('.btn-mercadopago').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const tourType = this.dataset.tour;
            const price = parseInt(this.dataset.price);
            const tourName = this.dataset.tourName;

            paddleSystem.showPaymentModal(tourType, price, tourName);
        });
    });
});

// Exportar para uso
window.PaddlePaymentSystem = PaddlePaymentSystem;