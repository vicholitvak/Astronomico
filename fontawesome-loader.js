// Font Awesome Loader - Ensures icons load properly
(function() {
    'use strict';

    // Check if Font Awesome is already loaded
    function isFontAwesomeLoaded() {
        var testElement = document.createElement('i');
        testElement.className = 'fas fa-test-icon';
        testElement.style.position = 'absolute';
        testElement.style.left = '-9999px';
        document.body.appendChild(testElement);

        var computedStyle = window.getComputedStyle(testElement);
        var fontFamily = computedStyle.getPropertyValue('font-family');

        document.body.removeChild(testElement);

        return fontFamily && fontFamily.indexOf('Font Awesome') !== -1;
    }

    // Load Font Awesome if not loaded
    function loadFontAwesome() {
        if (isFontAwesomeLoaded()) {
            console.log('✅ Font Awesome already loaded');
            return;
        }

        console.log('🔄 Loading Font Awesome...');

        // Create link element for Font Awesome CSS
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
        link.integrity = 'sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==';
        link.crossOrigin = 'anonymous';

        // Add to head
        document.head.appendChild(link);

        // Fallback CDN
        link.onerror = function() {
            console.log('⚠️ Primary CDN failed, trying fallback...');
            var fallbackLink = document.createElement('link');
            fallbackLink.rel = 'stylesheet';
            fallbackLink.href = 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css';
            document.head.appendChild(fallbackLink);
        };

        // Check again after loading
        link.onload = function() {
            setTimeout(function() {
                if (isFontAwesomeLoaded()) {
                    console.log('✅ Font Awesome loaded successfully');
                    // Force re-render of icons
                    var icons = document.querySelectorAll('i[class*="fa-"]');
                    icons.forEach(function(icon) {
                        icon.style.display = 'none';
                        setTimeout(function() {
                            icon.style.display = '';
                        }, 10);
                    });
                } else {
                    console.error('❌ Font Awesome failed to load');
                }
            }, 100);
        };
    }

    // Force specific icon rendering
    function fixSpecificIcons() {
        var iconMap = {
            'fa-whatsapp': '\uf232',
            'fa-facebook': '\uf39e',
            'fa-phone': '\uf095',
            'fa-envelope': '\uf0e0',
            'fa-map-marker-alt': '\uf3c5',
            'fa-calendar-alt': '\uf073',
            'fa-star': '\uf005',
            'fa-moon': '\uf186',
            'fa-telescope': '\uf1e6',
            'fa-camera': '\uf030'
        };

        Object.keys(iconMap).forEach(function(className) {
            var icons = document.querySelectorAll('.' + className);
            icons.forEach(function(icon) {
                if (window.getComputedStyle(icon).content === 'none' || icon.textContent === '') {
                    icon.setAttribute('data-content', iconMap[className]);
                }
            });
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadFontAwesome();
            setTimeout(fixSpecificIcons, 500);
        });
    } else {
        loadFontAwesome();
        setTimeout(fixSpecificIcons, 500);
    }

    // Also run on window load as backup
    window.addEventListener('load', function() {
        setTimeout(function() {
            loadFontAwesome();
            fixSpecificIcons();
        }, 1000);
    });

})();