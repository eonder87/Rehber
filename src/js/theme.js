/**
 * Theme Management Utilities
 * Handles Dark/Light mode synchronization across Iframes and Parent.
 */

const THEME_KEY = 'theme';

// Apply current theme to a given DOM node (body)
function applyThemeToNode(node, isLight) {
    if (isLight) {
        node.classList.add('light-mode');
    } else {
        node.classList.remove('light-mode');
    }
}

// Initialize Theme on Page Load
function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const isLight = saved === 'light';

    applyThemeToNode(document.body, isLight);

    // Sync Parent if we are inside an iframe
    try {
        if (window.parent && window.parent !== window) {
            applyThemeToNode(window.parent.document.body, isLight);

            // Also try to find other frames? No, usually parent sync is enough if parent also runs init.
        }
    } catch (e) {
        // Cross-origin might block, but here it's same origin
        console.warn('Theme sync failed:', e);
    }
}

// Toggle Theme (Global function)
window.toggleGlobalTheme = function () {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    return isLight;
};

// Auto-sync on Storage Change (for multi-tab/iframe sync)
window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY) {
        applyThemeToNode(document.body, e.newValue === 'light');
    }
});

// Run on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}
