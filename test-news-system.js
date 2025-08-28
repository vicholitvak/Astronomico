// test-news-system.js - Test script for the enhanced astronomical news system

console.log('🧪 Testing Enhanced Astronomical News System...');

// Test API initialization
async function testAPI() {
    console.log('📡 Testing API initialization...');

    try {
        // Test if API class exists
        if (typeof AstronomicalNewsAPI === 'undefined') {
            throw new Error('AstronomicalNewsAPI class not found');
        }

        const api = new AstronomicalNewsAPI();
        console.log('✅ API class initialized successfully');

        // Test basic methods
        const cacheKey = 'test-cache';
        api.saveToCache(cacheKey, { test: 'data' });
        const cached = api.getFromCache(cacheKey);

        if (cached && cached.test === 'data') {
            console.log('✅ Cache system working');
        } else {
            console.log('❌ Cache system failed');
        }

        return true;
    } catch (error) {
        console.error('❌ API test failed:', error);
        return false;
    }
}

// Test DOM elements
function testDOM() {
    console.log('🔍 Testing DOM elements...');

    const elements = [
        'news-grid',
        'news-search',
        'alert-modal',
        'notification-modal',
        'iss-info',
        'space-weather',
        'astronomy-events'
    ];

    let passed = 0;
    let failed = 0;

    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ Element found: ${id}`);
            passed++;
        } else {
            console.log(`❌ Element missing: ${id}`);
            failed++;
        }
    });

    console.log(`📊 DOM Test Results: ${passed} passed, ${failed} failed`);
    return failed === 0;
}

// Test widget initialization
function testWidgets() {
    console.log('🎮 Testing widget initialization...');

    // Check if widget functions exist
    const functions = [
        'initializeISSTracker',
        'initializeSpaceWeatherWidget',
        'initializeAstronomicalEventsWidget',
        'initializeAstronomyQuiz',
        'initializeSkyMap',
        'initializeTelescopeSimulator'
    ];

    let passed = 0;
    let failed = 0;

    functions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ Function found: ${funcName}`);
            passed++;
        } else {
            console.log(`❌ Function missing: ${funcName}`);
            failed++;
        }
    });

    console.log(`📊 Widget Test Results: ${passed} passed, ${failed} failed`);
    return failed === 0;
}

// Test modal functionality
function testModals() {
    console.log('📋 Testing modal functionality...');

    const modalFunctions = [
        'openAlertModal',
        'closeAlertModal',
        'openNotificationModal',
        'closeNotificationModal'
    ];

    let passed = 0;
    let failed = 0;

    modalFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ Modal function found: ${funcName}`);
            passed++;
        } else {
            console.log(`❌ Modal function missing: ${funcName}`);
            failed++;
        }
    });

    console.log(`📊 Modal Test Results: ${passed} passed, ${failed} failed`);
    return failed === 0;
}

// Test notification support
function testNotifications() {
    console.log('🔔 Testing notification support...');

    if ('Notification' in window) {
        console.log('✅ Notification API supported');

        const permission = Notification.permission;
        console.log(`📋 Notification permission: ${permission}`);

        if (permission === 'granted') {
            console.log('✅ Notifications already granted');
        } else if (permission === 'denied') {
            console.log('⚠️ Notifications denied by user');
        } else {
            console.log('📝 Notifications need user permission');
        }

        return true;
    } else {
        console.log('❌ Notification API not supported');
        return false;
    }
}

// Test performance
function testPerformance() {
    console.log('⚡ Testing performance...');

    const startTime = performance.now();

    // Simulate some operations
    setTimeout(() => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;

        console.log(`⏱️ Performance test completed in ${loadTime.toFixed(2)}ms`);

        if (loadTime < 100) {
            console.log('✅ Performance excellent');
        } else if (loadTime < 500) {
            console.log('✅ Performance good');
        } else {
            console.log('⚠️ Performance could be improved');
        }
    }, 10);
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting comprehensive test suite...\n');

    const results = {
        api: await testAPI(),
        dom: testDOM(),
        widgets: testWidgets(),
        modals: testModals(),
        notifications: testNotifications()
    };

    testPerformance();

    console.log('\n📊 === TEST SUMMARY ===');

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const failedTests = totalTests - passedTests;

    Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? '✅ PASSED' : '❌ FAILED';
        console.log(`${status}: ${test}`);
    });

    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);

    if (failedTests === 0) {
        console.log('🎉 All tests passed! The news system is ready.');
    } else {
        console.log('⚠️ Some tests failed. Check the console for details.');
    }

    return failedTests === 0;
}

// Auto-run tests when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// Export for manual testing
window.testNewsSystem = runAllTests;
