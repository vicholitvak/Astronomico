// Wise Bank Transfer Payment Option
// Provides EUR and USD bank transfer details for international customers

const WISE_ACCOUNTS = {
    EUR: {
        currency: 'EUR',
        name: 'Vicente Litvak Montero',
        iban: 'BE43 9057 7072 2601',
        swift: 'TRWIBEB1XXX',
        bankName: 'Wise',
        bankAddress: 'Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium',
        note: 'Can receive EUR and other currencies via SEPA'
    },
    USD: {
        currency: 'USD',
        name: 'Vicente Litvak Montero',
        accountNumber: '211551414378',
        accountType: 'Checking',
        routingNumber: '101019628',
        swift: 'TRWIUS35XXX',
        bankName: 'Wise US Inc',
        bankAddress: '108 W 13th St, Wilmington, DE, 19801, United States',
        note: 'For US domestic and international transfers'
    }
};

// Exchange rates (approximate - updated periodically)
const EXCHANGE_RATES = {
    CLP_TO_EUR: 0.00095,  // 1 CLP ≈ 0.00095 EUR
    CLP_TO_USD: 0.00105   // 1 CLP ≈ 0.00105 USD
};

function initWisePayment() {
    // Add click handlers to Wise payment buttons
    document.querySelectorAll('.btn-wise').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const tourType = this.getAttribute('data-tour');
            const price = this.getAttribute('data-price');
            const tourName = this.getAttribute('data-tour-name');

            showWisePaymentModal(tourType, price, tourName);
        });
    });
}

function showWisePaymentModal(tourType, priceCLP, tourName) {
    const priceNum = parseInt(priceCLP);
    const priceEUR = Math.ceil(priceNum * EXCHANGE_RATES.CLP_TO_EUR);
    const priceUSD = Math.ceil(priceNum * EXCHANGE_RATES.CLP_TO_USD);

    const lang = localStorage.getItem('preferredLanguage') || 'es';

    // Multi-language support
    const texts = {
        es: {
            title: 'Pagar por Transferencia',
            subtitle: 'Menores comisiones para pagos internacionales',
            perPerson: '/persona',
            recipient: 'Beneficiario',
            bank: 'Banco',
            bankAddress: 'Dirección',
            important: 'Importante',
            step1: 'Incluye tu <strong>nombre y fecha del tour</strong> en la referencia',
            step2: 'Envíanos el <strong>comprobante</strong> por WhatsApp',
            step3: 'Confirmaremos tu reserva en máximo 24 horas',
            whatsappBtn: 'Enviar Comprobante por WhatsApp',
            whatsappMsg: `Hola! Hice una transferencia para el ${tourName}. [Adjuntar comprobante]`,
            note: 'Wise cobra comisiones mínimas. Tu reserva queda asegurada al recibir el pago.'
        },
        en: {
            title: 'Pay by Bank Transfer',
            subtitle: 'Lower fees for international payments',
            perPerson: '/person',
            recipient: 'Recipient Name',
            bank: 'Bank',
            bankAddress: 'Bank Address',
            important: 'Important',
            step1: 'Include your <strong>name and tour date</strong> in the transfer reference',
            step2: 'Send us the <strong>transfer receipt</strong> via WhatsApp',
            step3: 'We\'ll confirm your booking within 24 hours',
            whatsappBtn: 'Send Receipt via WhatsApp',
            whatsappMsg: `Hi! I made a bank transfer for the ${tourName}. [Attach receipt]`,
            note: 'Wise charges minimal transfer fees. Your booking is secured once we receive the payment.'
        },
        pt: {
            title: 'Pagar por Transferência',
            subtitle: 'Taxas menores para pagamentos internacionais',
            perPerson: '/pessoa',
            recipient: 'Beneficiário',
            bank: 'Banco',
            bankAddress: 'Endereço',
            important: 'Importante',
            step1: 'Inclua seu <strong>nome e data do tour</strong> na referência',
            step2: 'Envie o <strong>comprovante</strong> via WhatsApp',
            step3: 'Confirmaremos sua reserva em no máximo 24 horas',
            whatsappBtn: 'Enviar Comprovante por WhatsApp',
            whatsappMsg: `Olá! Fiz uma transferência para o ${tourName}. [Anexar comprovante]`,
            note: 'Wise cobra taxas mínimas. Sua reserva fica garantida ao recebermos o pagamento.'
        }
    };

    const t = texts[lang] || texts.es;

    const modalHTML = `
        <div id="wise-payment-modal" class="modal-overlay">
            <div class="modal-content wise-modal">
                <button class="modal-close" onclick="closeWiseModal()">&times;</button>

                <div class="wise-header">
                    <img src="https://wise.com/public-resources/assets/logos/wise/brand_logo.svg" alt="Wise" class="wise-logo">
                    <h2>${t.title}</h2>
                    <p class="wise-subtitle">${t.subtitle}</p>
                </div>

                <div class="booking-summary">
                    <h3>${tourName}</h3>
                    <div class="price-options">
                        <div class="price-tag price-clp">
                            <span class="currency">CLP</span>
                            <span class="amount">$${priceNum.toLocaleString('es-CL')}</span>
                            <span class="per-person">${t.perPerson}</span>
                        </div>
                        <div class="price-tag price-eur">
                            <span class="currency">EUR</span>
                            <span class="amount">€${priceEUR}</span>
                            <span class="per-person">${t.perPerson}</span>
                        </div>
                        <div class="price-tag price-usd">
                            <span class="currency">USD</span>
                            <span class="amount">$${priceUSD}</span>
                            <span class="per-person">${t.perPerson}</span>
                        </div>
                    </div>
                </div>

                <div class="currency-tabs">
                    <button class="tab-btn active" onclick="switchWiseTab('EUR')">
                        <span class="flag">🇪🇺</span> EUR (SEPA)
                    </button>
                    <button class="tab-btn" onclick="switchWiseTab('USD')">
                        <span class="flag">🇺🇸</span> USD
                    </button>
                </div>

                <div id="wise-eur-details" class="bank-details active">
                    <div class="detail-row">
                        <span class="label">${t.recipient}</span>
                        <span class="value copyable" onclick="copyToClipboard('${WISE_ACCOUNTS.EUR.name}')">${WISE_ACCOUNTS.EUR.name} <i class="fas fa-copy"></i></span>
                    </div>
                    <div class="detail-row">
                        <span class="label">IBAN</span>
                        <span class="value copyable" onclick="copyToClipboard('${WISE_ACCOUNTS.EUR.iban.replace(/\s/g, '')}')">${WISE_ACCOUNTS.EUR.iban} <i class="fas fa-copy"></i></span>
                    </div>
                    <div class="detail-row">
                        <span class="label">BIC/SWIFT</span>
                        <span class="value copyable" onclick="copyToClipboard('${WISE_ACCOUNTS.EUR.swift}')">${WISE_ACCOUNTS.EUR.swift} <i class="fas fa-copy"></i></span>
                    </div>
                    <div class="detail-row">
                        <span class="label">${t.bank}</span>
                        <span class="value">${WISE_ACCOUNTS.EUR.bankName}</span>
                    </div>
                    <div class="detail-row small">
                        <span class="label">${t.bankAddress}</span>
                        <span class="value">${WISE_ACCOUNTS.EUR.bankAddress}</span>
                    </div>
                </div>

                <div id="wise-usd-details" class="bank-details">
                    <div class="detail-row">
                        <span class="label">${t.recipient}</span>
                        <span class="value copyable" onclick="copyToClipboard('${WISE_ACCOUNTS.USD.name}')">${WISE_ACCOUNTS.USD.name} <i class="fas fa-copy"></i></span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Account Number</span>
                        <span class="value copyable" onclick="copyToClipboard('${WISE_ACCOUNTS.USD.accountNumber}')">${WISE_ACCOUNTS.USD.accountNumber} <i class="fas fa-copy"></i></span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Routing Number</span>
                        <span class="value copyable" onclick="copyToClipboard('${WISE_ACCOUNTS.USD.routingNumber}')">${WISE_ACCOUNTS.USD.routingNumber} <i class="fas fa-copy"></i></span>
                    </div>
                    <div class="detail-row">
                        <span class="label">BIC/SWIFT</span>
                        <span class="value copyable" onclick="copyToClipboard('${WISE_ACCOUNTS.USD.swift}')">${WISE_ACCOUNTS.USD.swift} <i class="fas fa-copy"></i></span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Account Type</span>
                        <span class="value">${WISE_ACCOUNTS.USD.accountType}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">${t.bank}</span>
                        <span class="value">${WISE_ACCOUNTS.USD.bankName}</span>
                    </div>
                </div>

                <div class="wise-instructions">
                    <h4><i class="fas fa-info-circle"></i> ${t.important}</h4>
                    <ol>
                        <li>${t.step1}</li>
                        <li>${t.step2}</li>
                        <li>${t.step3}</li>
                    </ol>
                </div>

                <a href="https://wa.me/56935134669?text=${encodeURIComponent(t.whatsappMsg)}"
                   class="btn btn-whatsapp" target="_blank">
                    <i class="fab fa-whatsapp"></i> ${t.whatsappBtn}
                </a>

                <p class="wise-note">
                    <i class="fas fa-shield-alt"></i>
                    ${t.note}
                </p>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('wise-payment-modal');
    if (existingModal) existingModal.remove();

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Apply styles
    const modal = document.getElementById('wise-payment-modal');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        padding: 1rem;
        overflow-y: auto;
    `;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function switchWiseTab(currency) {
    // Update tabs
    document.querySelectorAll('.currency-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.tab-btn').classList.add('active');

    // Update content
    document.querySelectorAll('.bank-details').forEach(details => {
        details.classList.remove('active');
    });
    document.getElementById(`wise-${currency.toLowerCase()}-details`).classList.add('active');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show brief feedback
        const el = event.target.closest('.copyable');
        const originalText = el.innerHTML;
        el.innerHTML = '<i class="fas fa-check"></i> Copied!';
        el.style.color = '#00c853';
        setTimeout(() => {
            el.innerHTML = originalText;
            el.style.color = '';
        }, 1500);
    });
}

function closeWiseModal() {
    const modal = document.getElementById('wise-payment-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Close on ESC or click outside
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeWiseModal();
});

document.addEventListener('click', (e) => {
    const modal = document.getElementById('wise-payment-modal');
    if (modal && e.target === modal) closeWiseModal();
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initWisePayment);
