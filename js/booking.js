/* ============================================
   ATACAMA DARK SKY — Booking Form
   Validation + submission to /api/booking-api
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('booking-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const successEl = document.getElementById('booking-success');
    const errorEl = document.getElementById('booking-error');
    const submitBtn = form.querySelector('.btn-submit');

    // Reset messages
    if (successEl) successEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';

    // Gather data
    const data = {
      date: form.querySelector('#selected-date')?.value,
      persons: form.querySelector('#persons')?.value,
      tourType: form.querySelector('#tour-type')?.value,
      name: form.querySelector('#name')?.value?.trim(),
      email: form.querySelector('#email')?.value?.trim(),
      phone: form.querySelector('#phone')?.value?.trim(),
      accommodation: form.querySelector('#accommodation')?.value?.trim() || '',
      message: form.querySelector('#message')?.value?.trim() || '',
      source: 'web',
      language: localStorage.getItem('preferred-language') || 'es'
    };

    // Validate required fields
    const lang = data.language;
    const errors = [];
    if (!data.date) errors.push(lang === 'en' ? 'Please select a date' : lang === 'pt' ? 'Selecione uma data' : 'Selecciona una fecha');
    if (!data.persons) errors.push(lang === 'en' ? 'Select number of guests' : lang === 'pt' ? 'Selecione quantidade' : 'Selecciona cantidad de personas');
    if (!data.tourType) errors.push(lang === 'en' ? 'Select experience type' : lang === 'pt' ? 'Selecione tipo' : 'Selecciona tipo de experiencia');
    if (!data.name) errors.push(lang === 'en' ? 'Enter your name' : lang === 'pt' ? 'Digite seu nome' : 'Ingresa tu nombre');
    if (!data.email) errors.push(lang === 'en' ? 'Enter your email' : lang === 'pt' ? 'Digite seu email' : 'Ingresa tu email');
    if (!data.phone) errors.push(lang === 'en' ? 'Enter your phone' : lang === 'pt' ? 'Digite seu telefone' : 'Ingresa tu telefono');

    if (errors.length) {
      if (errorEl) {
        errorEl.textContent = errors[0];
        errorEl.style.display = 'block';
      }
      return;
    }

    // Submit
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = lang === 'en' ? 'Sending...' : lang === 'pt' ? 'Enviando...' : 'Enviando...';
    }

    try {
      const response = await fetch('/api/booking-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (successEl) {
          successEl.textContent = lang === 'en'
            ? 'Booking sent! We will confirm within 24 hours.'
            : lang === 'pt'
            ? 'Reserva enviada! Confirmaremos em 24 horas.'
            : 'Reserva enviada! Te confirmaremos en 24 horas.';
          successEl.style.display = 'block';
        }
        form.reset();
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = lang === 'en'
          ? 'Error sending booking. Please try again or contact us via WhatsApp.'
          : lang === 'pt'
          ? 'Erro ao enviar reserva. Tente novamente ou fale conosco pelo WhatsApp.'
          : 'Error al enviar la reserva. Intenta nuevamente o contactanos por WhatsApp.';
        errorEl.style.display = 'block';
      }
      console.error('Booking error:', err);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        const submitText = lang === 'en' ? 'Send Booking' : lang === 'pt' ? 'Enviar Reserva' : 'Enviar Reserva';
        submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> <span>${submitText}</span>`;
      }
    }
  });
});
