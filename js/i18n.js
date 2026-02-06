/* ============================================
   ATACAMA DARK SKY — i18n System
   Language detection, toggle, apply translations
   ============================================ */

(function () {
  'use strict';

  const SUPPORTED_LANGS = ['es', 'en', 'pt'];
  const DEFAULT_LANG = 'es';

  /** Detect language from localStorage > URL param > browser */
  function detectLanguage() {
    // 1. localStorage
    const stored = localStorage.getItem('preferred-language');
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;

    // 2. URL param ?lang=xx
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && SUPPORTED_LANGS.includes(urlLang)) return urlLang;

    // 3. Browser language
    const browserLang = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
    if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;

    return DEFAULT_LANG;
  }

  /** Apply translations to all [data-i18n] elements */
  function applyTranslations(lang) {
    if (typeof translationsV2 === 'undefined') return;

    const strings = translationsV2[lang] || translationsV2[DEFAULT_LANG];
    if (!strings) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const value = getNestedValue(strings, key);
      if (value !== undefined) {
        // Support innerHTML for keys ending with _html
        if (key.endsWith('_html')) {
          el.innerHTML = value;
        } else {
          el.textContent = value;
        }
      }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const value = getNestedValue(strings, key);
      if (value !== undefined) el.placeholder = value;
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Update lang toggle button text
    const langBtn = document.querySelector('.lang-toggle-btn span');
    if (langBtn) langBtn.textContent = lang.toUpperCase();

    // Mark active option in dropdown
    document.querySelectorAll('.lang-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.lang === lang);
    });
  }

  /** Get nested object value by dot-notation key */
  function getNestedValue(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  }

  /** Set language and persist */
  function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    localStorage.setItem('preferred-language', lang);
    applyTranslations(lang);

    // Re-render calendar if it exists
    if (typeof renderCalendar === 'function') {
      renderCalendar();
    }
  }

  /** Initialize language dropdown */
  function initLangToggle() {
    const toggle = document.querySelector('.lang-toggle');
    const btn = document.querySelector('.lang-toggle-btn');
    if (!toggle || !btn) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      toggle.classList.remove('open');
    });

    document.querySelectorAll('.lang-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const lang = opt.dataset.lang;
        setLanguage(lang);
        toggle.classList.remove('open');
      });
    });
  }

  /** Expose globally */
  window.adsI18n = {
    detectLanguage,
    setLanguage,
    applyTranslations,
    getCurrentLang: () => localStorage.getItem('preferred-language') || detectLanguage()
  };

  /** Auto-init on DOMContentLoaded */
  document.addEventListener('DOMContentLoaded', () => {
    const lang = detectLanguage();
    localStorage.setItem('preferred-language', lang);
    applyTranslations(lang);
    initLangToggle();
  });
})();
