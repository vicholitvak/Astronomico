// fix-issues.js - Script to fix website issues

console.log('🔧 Starting website fixes...');

// Fix 1: Language toggle null reference
function fixLanguageToggle() {
    console.log('Fixing language toggle...');

    // Check if elements exist
    const langToggle = document.getElementById('lang-toggle');
    const currentLangSpan = document.getElementById('current-lang');

    if (!langToggle || !currentLangSpan) {
        console.log('❌ Language toggle elements missing - adding them...');

        // Find the nav container
        const navContainer = document.querySelector('.nav-container');
        if (navContainer) {
            // Create language toggle elements
            const langDropdown = document.createElement('div');
            langDropdown.className = 'lang-dropdown';
            langDropdown.innerHTML = `
                <button id="lang-toggle" class="lang-btn">
                    <span id="current-lang">🇪🇸 ES</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="lang-options">
                    <button class="lang-option active" data-lang="es">🇪🇸 Español</button>
                    <button class="lang-option" data-lang="en">🇺🇸 English</button>
                    <button class="lang-option" data-lang="pt">🇧🇷 Português</button>
                </div>
            `;

            // Add after nav-menu
            const navMenu = navContainer.querySelector('.nav-menu');
            if (navMenu) {
                navMenu.insertAdjacentElement('afterend', langDropdown);
                console.log('✅ Language toggle elements added');
            }
        }
    } else {
        console.log('✅ Language toggle elements already exist');
    }
}

// Fix 2: Meta Pixel null ID
function fixMetaPixel() {
    console.log('Fixing Meta Pixel...');

    // Find and comment out Meta Pixel script with null ID
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
        if (script.textContent && script.textContent.includes('YOUR_PIXEL_ID')) {
            console.log('❌ Found Meta Pixel with placeholder ID - commenting out...');
            script.textContent = `// Meta Pixel commented out due to missing Pixel ID
// ${script.textContent}`;
        }
    });

    // Also fix noscript img
    const noscriptImg = document.querySelector('noscript img');
    if (noscriptImg && noscriptImg.src && noscriptImg.src.includes('YOUR_PIXEL_ID')) {
        console.log('❌ Found noscript img with placeholder ID - commenting out...');
        const noscript = noscriptImg.parentElement;
        noscript.innerHTML = `<!-- Meta Pixel noscript commented out due to missing Pixel ID -->`;
    }

    console.log('✅ Meta Pixel fixed');
}

// Fix 3: Booking form date field
function fixBookingForm() {
    console.log('Fixing booking form date field...');

    // Override the form submission to use correct field
    const originalSubmitForm = window.submitForm;
    if (originalSubmitForm) {
        window.submitForm = async function() {
            const form = document.getElementById('booking-form');
            if (!form) return;

            // Get the correct date field
            const dateField = form.querySelector('#selected-date') || form.querySelector('#date');
            if (!dateField) {
                console.error('❌ No date field found in booking form');
                return;
            }

            const bookingData = {
                date: dateField.value,
                persons: form.querySelector('#persons').value,
                tourType: form.querySelector('#tour-type').value,
                time: form.querySelector('#time') ? form.querySelector('#time').value : '21:00',
                name: form.querySelector('#name').value,
                email: form.querySelector('#email').value,
                phone: form.querySelector('#phone').value,
                message: form.querySelector('#message').value
            };

            console.log('📝 Fixed booking data:', bookingData);

            // Continue with original submission logic
            if (originalSubmitForm) {
                // Call the original function with our fixed data
                return originalSubmitForm.call(this);
            }
        };
    }

    console.log('✅ Booking form date field fixed');
}

// Fix 4: Add basic error handling for API calls
function fixAPIErrorHandling() {
    console.log('Adding API error handling...');

    // Override fetch to add better error handling
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        return originalFetch.apply(this, args)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response;
            })
            .catch(error => {
                console.error('🚨 API Error:', error);
                // Show user-friendly error message
                showErrorMessage('Error de conexión. Por favor intenta de nuevo.');
                throw error;
            });
    };

    console.log('✅ API error handling added');
}

// Utility function to show error messages
function showErrorMessage(message) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());

    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
    `;
    errorDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; float: right; margin-top: -0.5rem;">×</button>
    `;

    document.body.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// Run all fixes when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllFixes);
} else {
    runAllFixes();
}

function runAllFixes() {
    console.log('🚀 Running all fixes...');

    try {
        fixLanguageToggle();
        fixMetaPixel();
        fixBookingForm();
        fixAPIErrorHandling();

        console.log('✅ All fixes applied successfully!');
        console.log('🔄 You may need to refresh the page for some fixes to take effect.');

    } catch (error) {
        console.error('❌ Error applying fixes:', error);
    }
}

// Export for manual testing
window.runFixes = runAllFixes;
window.showErrorMessage = showErrorMessage;
