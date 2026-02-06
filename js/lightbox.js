/* ============================================
   ATACAMA DARK SKY — Lightbox Component
   ============================================ */

(function () {
  'use strict';

  let lightboxEl = null;
  let images = [];
  let currentIndex = 0;

  function createLightbox() {
    if (lightboxEl) return;

    lightboxEl = document.createElement('div');
    lightboxEl.className = 'lightbox';
    lightboxEl.innerHTML = `
      <div class="lightbox-overlay"></div>
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <button class="lightbox-prev" aria-label="Previous">&#8249;</button>
      <div class="lightbox-content">
        <img src="" alt="" />
      </div>
      <button class="lightbox-next" aria-label="Next">&#8250;</button>
    `;

    document.body.appendChild(lightboxEl);

    // Events
    lightboxEl.querySelector('.lightbox-overlay').addEventListener('click', close);
    lightboxEl.querySelector('.lightbox-close').addEventListener('click', close);
    lightboxEl.querySelector('.lightbox-prev').addEventListener('click', prev);
    lightboxEl.querySelector('.lightbox-next').addEventListener('click', next);

    document.addEventListener('keydown', (e) => {
      if (!lightboxEl.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });
  }

  function open(imgArray, index) {
    createLightbox();
    images = imgArray;
    currentIndex = index || 0;
    showImage();
    lightboxEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!lightboxEl) return;
    lightboxEl.classList.remove('active');
    document.body.style.overflow = '';
  }

  function prev() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showImage();
  }

  function next() {
    currentIndex = (currentIndex + 1) % images.length;
    showImage();
  }

  function showImage() {
    const img = lightboxEl.querySelector('.lightbox-content img');
    const data = images[currentIndex];
    img.src = typeof data === 'string' ? data : data.src;
    img.alt = typeof data === 'string' ? '' : (data.alt || '');
  }

  // Expose globally
  window.adsLightbox = { open, close };

  // CSS injection
  const style = document.createElement('style');
  style.textContent = `
    .lightbox {
      position: fixed; inset: 0; z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; visibility: hidden;
      transition: opacity 300ms ease, visibility 300ms ease;
    }
    .lightbox.active { opacity: 1; visibility: visible; }
    .lightbox-overlay {
      position: absolute; inset: 0;
      background: rgba(10, 10, 20, 0.95);
    }
    .lightbox-content {
      position: relative; z-index: 1;
      max-width: 90vw; max-height: 85vh;
    }
    .lightbox-content img {
      max-width: 90vw; max-height: 85vh;
      object-fit: contain; border-radius: 2px;
    }
    .lightbox-close {
      position: absolute; top: 20px; right: 24px; z-index: 2;
      background: none; border: none; color: #f0ece2;
      font-size: 2.5rem; cursor: pointer; line-height: 1;
      transition: color 200ms;
    }
    .lightbox-close:hover { color: #c9a96e; }
    .lightbox-prev, .lightbox-next {
      position: absolute; top: 50%; z-index: 2;
      transform: translateY(-50%);
      background: none; border: none; color: #f0ece2;
      font-size: 3rem; cursor: pointer; padding: 16px;
      transition: color 200ms;
    }
    .lightbox-prev { left: 12px; }
    .lightbox-next { right: 12px; }
    .lightbox-prev:hover, .lightbox-next:hover { color: #c9a96e; }
    @media (max-width: 767px) {
      .lightbox-prev, .lightbox-next { font-size: 2rem; padding: 8px; }
      .lightbox-close { font-size: 2rem; top: 12px; right: 16px; }
    }
  `;
  document.head.appendChild(style);
})();
