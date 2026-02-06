// Gallery Scripts — Lightbox, Sharing, Lazy Loading
// Atacama Dark Sky Tour Galleries

(function () {
  'use strict';

  // ==========================================
  // Lazy Loading with IntersectionObserver
  // ==========================================
  function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    if (!images.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            if (img.dataset.srcset) img.srcset = img.dataset.srcset;
            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });

      images.forEach(function (img) { observer.observe(img); });
    } else {
      // Fallback: load all immediately
      images.forEach(function (img) {
        img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      });
    }
  }

  // ==========================================
  // Lightbox
  // ==========================================
  var currentIndex = 0;
  var photos = [];

  function initLightbox() {
    var lightbox = document.getElementById('galleryLightbox');
    if (!lightbox) return;

    var items = document.querySelectorAll('.photo-item[data-full]');
    photos = Array.from(items).map(function (item) {
      return {
        full: item.dataset.full,
        jpg: item.dataset.jpg
      };
    });

    items.forEach(function (item, index) {
      item.addEventListener('click', function () {
        openLightbox(index);
      });
    });

    // Close button
    var closeBtn = lightbox.querySelector('.lightbox-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeLightbox);
    }

    // Background click
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    // Nav buttons
    var prevBtn = lightbox.querySelector('.lightbox-prev');
    var nextBtn = lightbox.querySelector('.lightbox-next');
    if (prevBtn) prevBtn.addEventListener('click', function (e) { e.stopPropagation(); showPrev(); });
    if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); showNext(); });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    });

    // Swipe support for mobile
    var touchStartX = 0;
    lightbox.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', function (e) {
      var diff = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) showPrev();
        else showNext();
      }
    }, { passive: true });
  }

  function openLightbox(index) {
    currentIndex = index;
    var lightbox = document.getElementById('galleryLightbox');
    updateLightboxImage();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    var lightbox = document.getElementById('galleryLightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + photos.length) % photos.length;
    updateLightboxImage();
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % photos.length;
    updateLightboxImage();
  }

  function updateLightboxImage() {
    var img = document.getElementById('lightboxImage');
    var counter = document.getElementById('lightboxCounter');
    var downloadBtn = document.getElementById('lightboxDownload');

    if (img && photos[currentIndex]) {
      img.src = photos[currentIndex].full;
      img.alt = 'Photo ' + (currentIndex + 1);
    }
    if (counter) {
      counter.textContent = (currentIndex + 1) + ' / ' + photos.length;
    }
    if (downloadBtn && photos[currentIndex]) {
      downloadBtn.href = photos[currentIndex].jpg;
      downloadBtn.download = 'atacama-darksky-' + (currentIndex + 1) + '.jpg';
    }
  }

  // ==========================================
  // Social Sharing
  // ==========================================
  function initSharing() {
    var copyBtn = document.querySelector('.share-btn.copy-link');
    if (copyBtn) {
      copyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var url = window.location.href;
        navigator.clipboard.writeText(url).then(function () {
          var feedback = document.getElementById('copyFeedback');
          if (feedback) {
            feedback.style.display = 'block';
            setTimeout(function () { feedback.style.display = 'none'; }, 2000);
          }
          copyBtn.textContent = 'Copied!';
          setTimeout(function () {
            copyBtn.innerHTML = '<span class="share-icon">&#128279;</span> Copy Link';
          }, 2000);
        });
      });
    }
  }

  // ==========================================
  // ZIP Download (JSZip, Phase 4)
  // ==========================================
  function initDownloadAll() {
    var btn = document.getElementById('downloadAllBtn');
    if (!btn) return;

    btn.addEventListener('click', async function (e) {
      e.preventDefault();
      btn.disabled = true;
      btn.textContent = 'Preparing download...';

      try {
        // Dynamically load JSZip
        if (!window.JSZip) {
          var script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          document.head.appendChild(script);
          await new Promise(function (resolve, reject) {
            script.onload = resolve;
            script.onerror = reject;
          });
        }

        var zip = new JSZip();
        var folder = zip.folder('atacama-darksky-photos');

        for (var i = 0; i < photos.length; i++) {
          btn.textContent = 'Downloading ' + (i + 1) + '/' + photos.length + '...';
          var response = await fetch(photos[i].jpg);
          var blob = await response.blob();
          folder.file('photo-' + String(i + 1).padStart(3, '0') + '.jpg', blob);
        }

        btn.textContent = 'Creating ZIP...';
        var content = await zip.generateAsync({ type: 'blob' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'atacama-darksky-photos.zip';
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (err) {
        console.error('Download failed:', err);
        alert('Download failed. Please try downloading photos individually.');
      }

      btn.disabled = false;
      btn.innerHTML = '<span>&#128230;</span> Download All Photos';
    });
  }

  // ==========================================
  // Initialize on DOM ready
  // ==========================================
  document.addEventListener('DOMContentLoaded', function () {
    initLazyLoading();
    initLightbox();
    initSharing();
    initDownloadAll();
  });
})();
