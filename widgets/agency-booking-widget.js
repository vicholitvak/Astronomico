/**
 * Agency Booking Widget
 * Widget embebible para sitios de agencias (WordPress, etc.)
 *
 * USO:
 * <div id="booking-widget" data-agency="inti-para"></div>
 * <script src="https://atacamadarksky.cl/widgets/agency-booking-widget.js"></script>
 */

(function() {
  'use strict';

  const API_BASE = 'https://atacamadarksky.cl/api';

  // Configuración por defecto
  const defaultConfig = {
    primaryColor: '#dc2626',
    secondaryColor: '#1e293b',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
    locale: 'es-CL',
    currency: 'CLP'
  };

  // Estilos del widget
  const styles = `
    .abw-container {
      font-family: var(--abw-font, 'Segoe UI', Roboto, sans-serif);
      max-width: 100%;
      margin: 0 auto;
    }

    .abw-products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      padding: 20px 0;
    }

    .abw-product-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .abw-product-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .abw-product-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .abw-product-content {
      padding: 20px;
    }

    .abw-product-category {
      display: inline-block;
      padding: 4px 10px;
      background: var(--abw-primary, #dc2626);
      color: white;
      border-radius: 20px;
      font-size: 12px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    .abw-product-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 10px 0;
    }

    .abw-product-description {
      color: #64748b;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 15px;
    }

    .abw-product-meta {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
      color: #64748b;
      font-size: 13px;
    }

    .abw-product-meta span {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .abw-product-price {
      font-size: 24px;
      font-weight: 700;
      color: var(--abw-primary, #dc2626);
    }

    .abw-product-price-label {
      font-size: 12px;
      color: #94a3b8;
    }

    .abw-btn {
      display: inline-block;
      width: 100%;
      padding: 12px 20px;
      background: var(--abw-primary, #dc2626);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      transition: background 0.3s;
      margin-top: 15px;
    }

    .abw-btn:hover {
      background: var(--abw-primary-dark, #b91c1c);
      filter: brightness(0.9);
    }

    /* Modal de reserva */
    .abw-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      z-index: 10000;
      align-items: center;
      justify-content: center;
    }

    .abw-modal.active {
      display: flex;
    }

    .abw-modal-content {
      background: white;
      border-radius: 16px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      padding: 30px;
    }

    .abw-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .abw-modal-title {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .abw-modal-close {
      background: none;
      border: none;
      font-size: 28px;
      cursor: pointer;
      color: #64748b;
      padding: 0;
      line-height: 1;
    }

    .abw-form-group {
      margin-bottom: 15px;
    }

    .abw-form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #374151;
    }

    .abw-form-group input,
    .abw-form-group select,
    .abw-form-group textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 16px;
      box-sizing: border-box;
    }

    .abw-form-group input:focus,
    .abw-form-group select:focus,
    .abw-form-group textarea:focus {
      outline: none;
      border-color: var(--abw-primary, #dc2626);
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .abw-form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .abw-total-section {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }

    .abw-total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .abw-total-final {
      font-size: 24px;
      font-weight: 700;
      color: var(--abw-primary, #dc2626);
    }

    .abw-success-message {
      text-align: center;
      padding: 30px;
    }

    .abw-success-icon {
      font-size: 60px;
      color: #22c55e;
      margin-bottom: 15px;
    }

    .abw-loading {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }

    .abw-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top-color: var(--abw-primary, #dc2626);
      border-radius: 50%;
      animation: abw-spin 1s linear infinite;
      margin: 0 auto 15px;
    }

    @keyframes abw-spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 640px) {
      .abw-form-row {
        grid-template-columns: 1fr;
      }
      .abw-products-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  // Clase principal del widget
  class AgencyBookingWidget {
    constructor(container) {
      this.container = container;
      this.agencyId = container.dataset.agency;
      this.config = { ...defaultConfig };
      this.products = [];
      this.selectedProduct = null;

      if (!this.agencyId) {
        console.error('Agency Booking Widget: data-agency attribute is required');
        return;
      }

      this.init();
    }

    async init() {
      this.injectStyles();
      this.render();
      await this.loadAgency();
      await this.loadProducts();
    }

    injectStyles() {
      if (!document.getElementById('abw-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'abw-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
      }
    }

    render() {
      this.container.innerHTML = `
        <div class="abw-container">
          <div class="abw-products-grid" id="abw-products">
            <div class="abw-loading">
              <div class="abw-spinner"></div>
              <p>Cargando tours...</p>
            </div>
          </div>
        </div>
        <div class="abw-modal" id="abw-modal">
          <div class="abw-modal-content" id="abw-modal-content"></div>
        </div>
      `;
    }

    async loadAgency() {
      try {
        const response = await fetch(`${API_BASE}/agencies/${this.agencyId}`);
        const data = await response.json();

        if (data.success && data.agency) {
          this.config.primaryColor = data.agency.primary_color || this.config.primaryColor;
          this.container.style.setProperty('--abw-primary', this.config.primaryColor);
        }
      } catch (error) {
        console.error('Error loading agency:', error);
      }
    }

    async loadProducts() {
      try {
        const response = await fetch(`${API_BASE}/agencies/${this.agencyId}/products`);
        const data = await response.json();

        if (data.success) {
          this.products = data.products;
          this.renderProducts();
        }
      } catch (error) {
        console.error('Error loading products:', error);
        this.container.querySelector('#abw-products').innerHTML = `
          <p style="color: #ef4444; text-align: center;">Error al cargar los tours. Intente nuevamente.</p>
        `;
      }
    }

    renderProducts() {
      const grid = this.container.querySelector('#abw-products');

      if (this.products.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #64748b;">No hay tours disponibles.</p>';
        return;
      }

      grid.innerHTML = this.products.map(product => `
        <div class="abw-product-card">
          <img
            class="abw-product-image"
            src="${product.main_image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400'}"
            alt="${product.name}"
          >
          <div class="abw-product-content">
            <span class="abw-product-category">${this.getCategoryLabel(product.category)}</span>
            <h3 class="abw-product-title">${product.name}</h3>
            <p class="abw-product-description">${product.short_description || product.description?.substring(0, 100) + '...'}</p>
            <div class="abw-product-meta">
              <span>⏱ ${this.formatDuration(product.duration_minutes)}</span>
              <span>👥 Máx ${product.max_capacity} personas</span>
            </div>
            <div class="abw-product-price">
              ${this.formatPrice(product.price_adult)}
              <span class="abw-product-price-label">por persona</span>
            </div>
            <button class="abw-btn" onclick="window.abwOpenBooking('${product.product_code}')">
              Reservar Ahora
            </button>
          </div>
        </div>
      `).join('');
    }

    openBooking(productCode) {
      this.selectedProduct = this.products.find(p => p.product_code === productCode);
      if (!this.selectedProduct) return;

      const modal = this.container.querySelector('#abw-modal');
      const content = this.container.querySelector('#abw-modal-content');

      // Generate available times options
      const times = this.selectedProduct.available_times || ['09:00'];
      const timeOptions = times.map(t => `<option value="${t}">${t}</option>`).join('');

      // Tomorrow's date as minimum
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const minDate = tomorrow.toISOString().split('T')[0];

      content.innerHTML = `
        <div class="abw-modal-header">
          <h3 class="abw-modal-title">${this.selectedProduct.name}</h3>
          <button class="abw-modal-close" onclick="window.abwCloseModal()">&times;</button>
        </div>
        <form id="abw-booking-form" onsubmit="window.abwSubmitBooking(event)">
          <div class="abw-form-row">
            <div class="abw-form-group">
              <label>Fecha *</label>
              <input type="date" name="date" required min="${minDate}">
            </div>
            <div class="abw-form-group">
              <label>Horario *</label>
              <select name="time" required>
                ${timeOptions}
              </select>
            </div>
          </div>
          <div class="abw-form-group">
            <label>Cantidad de Personas *</label>
            <select name="persons" required onchange="window.abwUpdateTotal()">
              ${Array.from({length: this.selectedProduct.max_capacity}, (_, i) => i + 1)
                .map(n => `<option value="${n}">${n} ${n === 1 ? 'persona' : 'personas'}</option>`)
                .join('')}
            </select>
          </div>
          <div class="abw-form-group">
            <label>Nombre Completo *</label>
            <input type="text" name="name" required placeholder="Juan Pérez">
          </div>
          <div class="abw-form-row">
            <div class="abw-form-group">
              <label>Email *</label>
              <input type="email" name="email" required placeholder="juan@email.com">
            </div>
            <div class="abw-form-group">
              <label>Teléfono *</label>
              <input type="tel" name="phone" required placeholder="+56 9 1234 5678">
            </div>
          </div>
          <div class="abw-form-group">
            <label>Hotel/Alojamiento</label>
            <input type="text" name="accommodation" placeholder="Nombre de su hotel">
          </div>
          <div class="abw-form-group">
            <label>Comentarios</label>
            <textarea name="message" rows="2" placeholder="Algún requerimiento especial..."></textarea>
          </div>

          <div class="abw-total-section">
            <div class="abw-total-row">
              <span>Precio por persona:</span>
              <span>${this.formatPrice(this.selectedProduct.price_adult)}</span>
            </div>
            <div class="abw-total-row">
              <span>Personas:</span>
              <span id="abw-persons-count">1</span>
            </div>
            <div class="abw-total-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
              <span style="font-weight: 600;">TOTAL:</span>
              <span class="abw-total-final" id="abw-total">${this.formatPrice(this.selectedProduct.price_adult)}</span>
            </div>
          </div>

          <button type="submit" class="abw-btn">Confirmar Reserva</button>
        </form>
      `;

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    closeModal() {
      const modal = this.container.querySelector('#abw-modal');
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    updateTotal() {
      const form = this.container.querySelector('#abw-booking-form');
      const persons = parseInt(form.persons.value) || 1;
      const total = persons * parseFloat(this.selectedProduct.price_adult);

      this.container.querySelector('#abw-persons-count').textContent = persons;
      this.container.querySelector('#abw-total').textContent = this.formatPrice(total);
    }

    async submitBooking(event) {
      event.preventDefault();

      const form = event.target;
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Procesando...';

      const formData = new FormData(form);
      const bookingData = {
        product_code: this.selectedProduct.product_code,
        date: formData.get('date'),
        time: formData.get('time'),
        persons: parseInt(formData.get('persons')),
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        accommodation: formData.get('accommodation'),
        message: formData.get('message')
      };

      try {
        const response = await fetch(`${API_BASE}/agencies/${this.agencyId}/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        if (result.success) {
          const content = this.container.querySelector('#abw-modal-content');
          content.innerHTML = `
            <div class="abw-success-message">
              <div class="abw-success-icon">✓</div>
              <h3 style="margin: 0 0 10px;">¡Reserva Creada!</h3>
              <p style="color: #64748b; margin-bottom: 20px;">
                Tu reserva #${result.booking_id} ha sido registrada.<br>
                Te contactaremos pronto para confirmar el pago.
              </p>
              <p style="font-size: 24px; font-weight: 700; color: var(--abw-primary);">
                Total: ${this.formatPrice(result.total_amount)}
              </p>
              <button class="abw-btn" onclick="window.abwCloseModal()">Cerrar</button>
            </div>
          `;
        } else {
          alert('Error: ' + (result.error || 'No se pudo crear la reserva'));
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      } catch (error) {
        console.error('Booking error:', error);
        alert('Error de conexión. Por favor intente nuevamente.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }

    // Helpers
    formatPrice(amount) {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
      }).format(amount);
    }

    formatDuration(minutes) {
      if (!minutes) return 'Variable';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours === 0) return `${mins} min`;
      if (mins === 0) return `${hours}h`;
      return `${hours}h ${mins}min`;
    }

    getCategoryLabel(category) {
      const labels = {
        'adventure': 'Aventura',
        'nature': 'Naturaleza',
        'cultural': 'Cultural',
        'wellness': 'Bienestar',
        'day-tour': 'Tour de Día'
      };
      return labels[category] || category || 'Tour';
    }
  }

  // Initialize all widgets on page
  function initWidgets() {
    const containers = document.querySelectorAll('[data-agency]');
    containers.forEach(container => {
      if (!container._abwInstance) {
        container._abwInstance = new AgencyBookingWidget(container);
      }
    });
  }

  // Global functions for event handlers
  window.abwOpenBooking = function(productCode) {
    const container = document.querySelector('[data-agency]');
    if (container && container._abwInstance) {
      container._abwInstance.openBooking(productCode);
    }
  };

  window.abwCloseModal = function() {
    const container = document.querySelector('[data-agency]');
    if (container && container._abwInstance) {
      container._abwInstance.closeModal();
    }
  };

  window.abwUpdateTotal = function() {
    const container = document.querySelector('[data-agency]');
    if (container && container._abwInstance) {
      container._abwInstance.updateTotal();
    }
  };

  window.abwSubmitBooking = function(event) {
    const container = document.querySelector('[data-agency]');
    if (container && container._abwInstance) {
      container._abwInstance.submitBooking(event);
    }
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
  } else {
    initWidgets();
  }

})();
