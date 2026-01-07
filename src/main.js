// Hurdle - Main Entry Point (Vue 3 with Vuetify)
import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';

// Import game modules using ES6 imports for better compatibility
import Dictionary from './Dictionary.js';
import GameController from './GameController.js';

/**
 * Initialize the Hurdle application
 * Sets up the game using WordsAPI for all word operations
 */
async function initializeApp() {
  try {
    console.log('Hurdle - Starting initialization...');
    
    // Add user agent detection for debugging
    if (typeof navigator !== 'undefined') {
      console.log('User Agent:', navigator.userAgent);
      console.log('Platform:', navigator.platform);
    }
    
    // Detect environment
    const isProduction = detectProductionEnvironment();
    const isTestEnvironment = detectTestEnvironment();
    console.log(`Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
    console.log(`Test environment: ${isTestEnvironment}`);
    
    console.log('Using WordsAPI for all word operations (no local dictionary files)');
    
    // Initialize Dictionary instance without word list - uses WordsAPI exclusively
    console.log('Creating Dictionary instance (WordsAPI mode)...');
    const dictionary = new Dictionary();
    
    // Test WordsAPI connectivity
    console.log('Testing WordsAPI connectivity...');
    const testWord = 'house';
    const isConnected = await dictionary.isValidWord(testWord);
    console.log(`WordsAPI connectivity test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
    
    if (!isConnected && !isTestEnvironment) {
      throw new Error('WordsAPI is not accessible. Please check your internet connection.');
    }
    
    // Initialize GameController with Dictionary - used by HurdleController
    console.log('Creating GameController instance...');
    const gameController = new GameController(dictionary);
    
    // Create and mount Vue app with hurdle components
    console.log('Creating Vue app...');
    const app = createApp(App, {
      gameController,
      dictionary
    });
    
    console.log('Adding Vuetify plugin...');
    app.use(vuetify);
    
    console.log('Mounting Vue app...');
    app.mount('#app');
    
    console.log('Hurdle - Ready to play!');
    
  } catch (error) {
    console.error('Failed to initialize hurdle application:', error);
    console.error('Error stack:', error.stack);
    
    // Display user-friendly error message
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div style="padding: 20px; text-align: center; color: white; background-color: #121213; font-family: Arial, sans-serif;">
          <h2 style="color: #d32f2f; margin-bottom: 15px;">Failed to Start Game</h2>
          <p style="margin-bottom: 10px;">Error: ${error.message}</p>
          <p style="font-size: 0.9rem; color: #818384; margin-bottom: 15px;">
            This game requires an internet connection to access the WordsAPI service.
          </p>
          <button onclick="window.location.reload()" style="
            background-color: #538d4e; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 4px; 
            cursor: pointer;
            font-size: 1rem;
          ">
            Retry
          </button>
        </div>
      `;
    }
  }
}

/**
 * Detect if we're running in a test environment
 * @returns {boolean} True if running in test environment
 */
function detectTestEnvironment() {
  // Check for Jest test environment
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    return true;
  }
  
  // Check for Jest globals
  if (typeof global !== 'undefined' && global.expect && global.test) {
    return true;
  }
  
  // Check for other test indicators
  if (typeof window !== 'undefined' && window.__karma__) {
    return true;
  }
  
  // Check URL parameters for test mode
  if (typeof window !== 'undefined' && window.location) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === 'true') {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect if we're running in production environment
 * @returns {boolean} True if running in production
 */
function detectProductionEnvironment() {
  // Check if we're in browser and not on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || 
                       hostname === '127.0.0.1' || 
                       hostname.startsWith('192.168.') ||
                       hostname.startsWith('10.') ||
                       hostname.endsWith('.local');
    
    // Production if not localhost and not file:// protocol
    return !isLocalhost && window.location.protocol !== 'file:';
  }
  
  // Default to development if we can't determine
  return false;
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}

// Add global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Add global error handler
window.addEventListener('error', function(event) {
  console.error('Global error:', event.error);
});
