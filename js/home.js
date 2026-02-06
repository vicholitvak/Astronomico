/* ============================================
   ATACAMA DARK SKY — Home Page JS
   Parallax effect, number counter animation,
   astrophoto grid lightbox wiring
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initParallax();
  initCounters();
  initAstroGrid();
});

/* ---- Parallax on story images (desktop only) ---- */
function initParallax() {
  if (window.innerWidth < 1024) return;

  const images = document.querySelectorAll('.story-image');
  if (!images.length) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        images.forEach(img => {
          const rect = img.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const offset = (center - window.innerHeight / 2) * 0.06;
          const inner = img.querySelector('img');
          if (inner) {
            inner.style.transform = `translateY(${offset}px) scale(1.05)`;
          }
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ---- Animated counters ---- */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = el.getAttribute('data-count');
  const hasPlus = target.includes('+');
  const numericTarget = parseInt(target.replace(/[^0-9]/g, ''), 10);
  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * numericTarget);

    let display = current.toLocaleString();
    if (hasPlus) display += '+';
    el.textContent = display;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* ---- Astrophoto grid → lightbox ---- */
function initAstroGrid() {
  const items = document.querySelectorAll('.astro-grid-item');
  if (!items.length || typeof window.adsLightbox === 'undefined') return;

  const images = Array.from(items).map(item => {
    const img = item.querySelector('img');
    return {
      src: img.getAttribute('data-full') || img.src,
      alt: img.alt
    };
  });

  items.forEach((item, index) => {
    item.addEventListener('click', () => {
      window.adsLightbox.open(images, index);
    });
  });
}
