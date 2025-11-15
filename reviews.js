/**
 * Reviews System - Frontend
 * Handles display and submission of customer reviews
 */

// ============================================================================
// DISPLAY REVIEWS
// ============================================================================

/**
 * Load and display reviews on the page
 */
async function loadReviews(tourType = null, limit = 10) {
  try {
    const params = new URLSearchParams({
      status: 'approved',
      limit: limit.toString(),
      offset: '0'
    });

    if (tourType) {
      params.append('tour_type', tourType);
    }

    const response = await fetch(`/api/reviews?${params.toString()}`);
    const data = await response.json();

    if (data.reviews && data.reviews.length > 0) {
      displayReviews(data.reviews);
      displayReviewStats(tourType);
    } else {
      showNoReviews();
    }

  } catch (error) {
    console.error('Error loading reviews:', error);
    showReviewsError();
  }
}

/**
 * Display reviews in the DOM
 */
function displayReviews(reviews) {
  const container = document.getElementById('reviews-container');
  if (!container) return;

  container.innerHTML = reviews.map(review => `
    <div class="review-card" data-review-id="${review.review_id}">
      <div class="review-header">
        <div class="review-author">
          <div class="review-avatar">
            ${review.reviewer_name.charAt(0).toUpperCase()}
          </div>
          <div class="review-author-info">
            <h4 class="review-author-name">${escapeHtml(review.reviewer_name)}</h4>
            ${review.reviewer_country ? `<p class="review-country">
              <i class="fas fa-map-marker-alt"></i> ${escapeHtml(review.reviewer_country)}
            </p>` : ''}
          </div>
        </div>
        <div class="review-rating">
          ${renderStars(review.overall_rating)}
          <span class="review-rating-number">${review.overall_rating}/5</span>
        </div>
      </div>

      ${review.title ? `<h3 class="review-title">${escapeHtml(review.title)}</h3>` : ''}

      <p class="review-comment">${escapeHtml(review.comment || '')}</p>

      ${review.guide_rating || review.equipment_rating || review.location_rating || review.value_rating ? `
        <div class="review-detailed-ratings">
          ${review.guide_rating ? `<div class="rating-item">
            <span>Guía:</span> ${renderStars(review.guide_rating, true)}
          </div>` : ''}
          ${review.equipment_rating ? `<div class="rating-item">
            <span>Equipo:</span> ${renderStars(review.equipment_rating, true)}
          </div>` : ''}
          ${review.location_rating ? `<div class="rating-item">
            <span>Ubicación:</span> ${renderStars(review.location_rating, true)}
          </div>` : ''}
          ${review.value_rating ? `<div class="rating-item">
            <span>Relación calidad-precio:</span> ${renderStars(review.value_rating, true)}
          </div>` : ''}
        </div>
      ` : ''}

      <div class="review-footer">
        <div class="review-meta">
          <span class="review-date">
            <i class="far fa-calendar"></i> ${formatDate(review.tour_date)}
          </span>
          <span class="review-tour-type">
            <i class="fas fa-star"></i> ${getTourTypeName(review.tour_type)}
          </span>
        </div>
        <button class="btn-helpful ${review.helpful_count > 0 ? 'has-votes' : ''}"
                onclick="markReviewHelpful('${review.review_id}', this)">
          <i class="far fa-thumbs-up"></i>
          Útil ${review.helpful_count > 0 ? `(${review.helpful_count})` : ''}
        </button>
      </div>

      ${review.owner_response ? `
        <div class="owner-response">
          <div class="response-header">
            <i class="fas fa-reply"></i>
            <strong>Respuesta de Atacama DarkSky:</strong>
          </div>
          <p>${escapeHtml(review.owner_response)}</p>
          <span class="response-date">${formatDate(review.response_date)}</span>
        </div>
      ` : ''}
    </div>
  `).join('');
}

/**
 * Load and display review statistics
 */
async function displayReviewStats(tourType = null) {
  try {
    const params = new URLSearchParams({ stats: 'true' });
    if (tourType) {
      params.append('tour_type', tourType);
    }

    const response = await fetch(`/api/reviews?${params.toString()}`);
    const stats = await response.json();

    const statsContainer = document.getElementById('review-stats');
    if (!statsContainer) return;

    const ratingDist = stats.rating_distribution || {};

    statsContainer.innerHTML = `
      <div class="review-stats-summary">
        <div class="average-rating">
          <div class="rating-number">${stats.average_rating || '0.0'}</div>
          ${renderStars(Math.round(stats.average_rating || 0))}
          <p class="rating-count">Basado en ${stats.total_approved || 0} reseñas</p>
        </div>

        <div class="rating-distribution">
          ${[5, 4, 3, 2, 1].map(star => {
            const count = ratingDist[`${star}_star${star > 1 ? 's' : ''}`] || 0;
            const percentage = stats.total_approved > 0
              ? (count / stats.total_approved * 100).toFixed(0)
              : 0;

            return `
              <div class="rating-bar">
                <span class="star-label">${star} <i class="fas fa-star"></i></span>
                <div class="bar-container">
                  <div class="bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="count">${count}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

  } catch (error) {
    console.error('Error loading review stats:', error);
  }
}

/**
 * Mark review as helpful
 */
async function markReviewHelpful(reviewId, button) {
  try {
    // Check if already voted (from localStorage)
    const votedReviews = JSON.parse(localStorage.getItem('votedReviews') || '[]');
    if (votedReviews.includes(reviewId)) {
      showNotification('Ya has marcado esta reseña como útil', 'info');
      return;
    }

    button.disabled = true;

    const response = await fetch('/api/review-helpful', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ review_id: reviewId })
    });

    const result = await response.json();

    if (result.success) {
      // Update localStorage
      votedReviews.push(reviewId);
      localStorage.setItem('votedReviews', JSON.stringify(votedReviews));

      // Update button
      const countMatch = button.textContent.match(/\((\d+)\)/);
      const currentCount = countMatch ? parseInt(countMatch[1]) : 0;
      const newCount = currentCount + 1;

      button.innerHTML = `<i class="far fa-thumbs-up"></i> Útil (${newCount})`;
      button.classList.add('has-votes', 'voted');

      showNotification('¡Gracias por tu voto!', 'success');
    } else {
      showNotification(result.message || 'Ya has marcado esta reseña como útil', 'info');
      button.disabled = false;
    }

  } catch (error) {
    console.error('Error marking review as helpful:', error);
    showNotification('Error al votar. Intenta nuevamente.', 'error');
    button.disabled = false;
  }
}

// ============================================================================
// SUBMIT REVIEW
// ============================================================================

/**
 * Show review submission form
 */
function showReviewForm(bookingId, tourType, tourDate) {
  const modalHTML = `
    <div id="review-modal" class="review-modal">
      <div class="review-modal-content">
        <span class="close-modal" onclick="closeReviewModal()">&times;</span>
        <h2><i class="fas fa-star"></i> Comparte tu Experiencia</h2>
        <p class="modal-subtitle">Tu opinión nos ayuda a mejorar y ayuda a otros viajeros</p>

        <form id="review-form" onsubmit="submitReview(event)">
          <input type="hidden" name="booking_id" value="${bookingId}">

          <!-- Overall Rating -->
          <div class="form-group">
            <label>Calificación General *</label>
            <div class="star-rating-input" data-rating="0">
              ${[1, 2, 3, 4, 5].map(star => `
                <i class="far fa-star" data-star="${star}"
                   onmouseover="hoverStars(${star}, this.parentElement)"
                   onmouseout="resetStars(this.parentElement)"
                   onclick="setRating(${star}, this.parentElement, 'overall_rating')"></i>
              `).join('')}
            </div>
            <input type="hidden" name="overall_rating" required>
          </div>

          <!-- Detailed Ratings -->
          <div class="detailed-ratings-section">
            <h3>Calificaciones Detalladas (Opcional)</h3>

            <div class="form-group">
              <label>Guía</label>
              <div class="star-rating-input small" data-rating="0">
                ${[1, 2, 3, 4, 5].map(star => `
                  <i class="far fa-star" data-star="${star}"
                     onmouseover="hoverStars(${star}, this.parentElement)"
                     onmouseout="resetStars(this.parentElement)"
                     onclick="setRating(${star}, this.parentElement, 'guide_rating')"></i>
                `).join('')}
              </div>
              <input type="hidden" name="guide_rating">
            </div>

            <div class="form-group">
              <label>Equipo y Telescopios</label>
              <div class="star-rating-input small" data-rating="0">
                ${[1, 2, 3, 4, 5].map(star => `
                  <i class="far fa-star" data-star="${star}"
                     onmouseover="hoverStars(${star}, this.parentElement)"
                     onmouseout="resetStars(this.parentElement)"
                     onclick="setRating(${star}, this.parentElement, 'equipment_rating')"></i>
                `).join('')}
              </div>
              <input type="hidden" name="equipment_rating">
            </div>

            <div class="form-group">
              <label>Ubicación</label>
              <div class="star-rating-input small" data-rating="0">
                ${[1, 2, 3, 4, 5].map(star => `
                  <i class="far fa-star" data-star="${star}"
                     onmouseover="hoverStars(${star}, this.parentElement)"
                     onmouseout="resetStars(this.parentElement)"
                     onclick="setRating(${star}, this.parentElement, 'location_rating')"></i>
                `).join('')}
              </div>
              <input type="hidden" name="location_rating">
            </div>

            <div class="form-group">
              <label>Relación Calidad-Precio</label>
              <div class="star-rating-input small" data-rating="0">
                ${[1, 2, 3, 4, 5].map(star => `
                  <i class="far fa-star" data-star="${star}"
                     onmouseover="hoverStars(${star}, this.parentElement)"
                     onmouseout="resetStars(this.parentElement)"
                     onclick="setRating(${star}, this.parentElement, 'value_rating')"></i>
                `).join('')}
              </div>
              <input type="hidden" name="value_rating">
            </div>
          </div>

          <!-- Title -->
          <div class="form-group">
            <label for="review-title">Título de tu Reseña</label>
            <input type="text" id="review-title" name="title"
                   placeholder="Ej: Experiencia inolvidable bajo las estrellas"
                   maxlength="200">
          </div>

          <!-- Comment -->
          <div class="form-group">
            <label for="review-comment">Tu Opinión *</label>
            <textarea id="review-comment" name="comment" required rows="5"
                      placeholder="Cuéntanos sobre tu experiencia... ¿Qué fue lo que más te gustó? ¿Qué aprendiste? ¿Recomendarías este tour?"></textarea>
          </div>

          <!-- Reviewer Info -->
          <div class="form-row">
            <div class="form-group">
              <label for="reviewer-name">Tu Nombre *</label>
              <input type="text" id="reviewer-name" name="reviewer_name" required>
            </div>

            <div class="form-group">
              <label for="reviewer-email">Email *</label>
              <input type="email" id="reviewer-email" name="reviewer_email" required>
            </div>
          </div>

          <div class="form-group">
            <label for="reviewer-country">País</label>
            <input type="text" id="reviewer-country" name="reviewer_country"
                   placeholder="Ej: Chile, Argentina, USA">
          </div>

          <!-- Language -->
          <div class="form-group">
            <label for="review-language">Idioma de la Reseña</label>
            <select id="review-language" name="language">
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <!-- Submit -->
          <div class="modal-buttons">
            <button type="button" class="btn btn-secondary-outline" onclick="closeReviewModal()">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-paper-plane"></i> Enviar Reseña
            </button>
          </div>

          <p class="form-note">
            <i class="fas fa-info-circle"></i>
            Tu reseña será revisada antes de publicarse. Esto suele tomar menos de 24 horas.
          </p>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Submit review form
 */
async function submitReview(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Validation
  if (!data.overall_rating || data.overall_rating === '0') {
    showNotification('Por favor selecciona una calificación general', 'error');
    return;
  }

  // Clean empty optional ratings
  ['guide_rating', 'equipment_rating', 'location_rating', 'value_rating'].forEach(field => {
    if (!data[field] || data[field] === '0') {
      delete data[field];
    } else {
      data[field] = parseInt(data[field]);
    }
  });

  // Convert ratings to integers
  data.overall_rating = parseInt(data.overall_rating);

  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
  submitButton.disabled = true;

  try {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      showNotification('¡Gracias por tu reseña! La revisaremos pronto.', 'success');
      closeReviewModal();

      // Optionally redirect or refresh reviews
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      throw new Error(result.error || 'Error al enviar la reseña');
    }

  } catch (error) {
    console.error('Error submitting review:', error);
    showNotification(error.message || 'Error al enviar la reseña. Intenta nuevamente.', 'error');
    submitButton.innerHTML = originalText;
    submitButton.disabled = false;
  }
}

/**
 * Close review modal
 */
function closeReviewModal() {
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.remove();
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Render star rating
 */
function renderStars(rating, small = false) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(`<i class="fas fa-star ${small ? 'small' : ''}"></i>`);
    } else {
      stars.push(`<i class="far fa-star ${small ? 'small' : ''}"></i>`);
    }
  }
  return `<div class="stars">${stars.join('')}</div>`;
}

/**
 * Interactive star rating handlers
 */
function hoverStars(rating, container) {
  const stars = container.querySelectorAll('i');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.remove('far');
      star.classList.add('fas');
    } else {
      star.classList.remove('fas');
      star.classList.add('far');
    }
  });
}

function resetStars(container) {
  const currentRating = parseInt(container.dataset.rating) || 0;
  hoverStars(currentRating, container);
}

function setRating(rating, container, fieldName) {
  container.dataset.rating = rating;
  hoverStars(rating, container);

  const form = container.closest('form');
  const hiddenInput = form.querySelector(`input[name="${fieldName}"]`);
  if (hiddenInput) {
    hiddenInput.value = rating;
  }
}

/**
 * Get tour type display name
 */
function getTourTypeName(tourType) {
  const names = {
    'regular': 'Tour Regular',
    'private': 'Tour Privado VIP',
    'astrophoto': 'Astrofotografía'
  };
  return names[tourType] || tourType;
}

/**
 * Format date
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show no reviews message
 */
function showNoReviews() {
  const container = document.getElementById('reviews-container');
  if (container) {
    container.innerHTML = `
      <div class="no-reviews">
        <i class="fas fa-star-half-alt"></i>
        <h3>Aún no hay reseñas</h3>
        <p>Sé el primero en compartir tu experiencia</p>
      </div>
    `;
  }
}

/**
 * Show reviews error
 */
function showReviewsError() {
  const container = document.getElementById('reviews-container');
  if (container) {
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error al cargar las reseñas. Por favor intenta nuevamente.</p>
      </div>
    `;
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // You can customize this based on your notification system
  // For now, simple alert
  alert(message);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Auto-load reviews when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a page with reviews
  if (document.getElementById('reviews-container')) {
    loadReviews();
  }
});
