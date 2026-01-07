// Hurdle - Main Entry Point (Vue 3 with Vuetify)
import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';

// Import game modules using ES6 imports for better compatibility
import Dictionary from './Dictionary.js';
import GameController from './GameController.js';

/**
 * Initialize the Hurdle application
 * Loads the word dictionary and sets up the game
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
    console.log(`Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
    
    // Choose dictionary file based on environment
    const dictionaryFile = isProduction ? '/words.json' : '/words_uncommon.json';
    console.log(`Loading dictionary from: ${dictionaryFile}`);
    
    // Load word dictionary with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(dictionaryFile, {
      signal: controller.signal,
      cache: 'no-cache' // Prevent caching issues on mobile
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // If uncommon words file fails in development, fall back to main dictionary
      if (!isProduction && dictionaryFile === '/words_uncommon.json') {
        console.warn('Uncommon words dictionary not found, falling back to main dictionary');
        return loadMainDictionary();
      }
      throw new Error(`Failed to load dictionary: ${response.status} ${response.statusText}`);
    }
    
    console.log('Dictionary response received, parsing JSON...');
    const data = await response.json();
    
    // Validate dictionary data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid dictionary format: not a valid JSON object');
    }
    
    if (!data.words || !Array.isArray(data.words)) {
      throw new Error('Invalid dictionary format: expected "words" array');
    }
    
    if (data.words.length === 0) {
      throw new Error('Dictionary is empty');
    }
    
    console.log(`Dictionary loaded: ${data.words.length} words`);
    
    // Initialize Dictionary instance - always available
    console.log('Creating Dictionary instance...');
    const dictionary = new Dictionary(data.words);
    
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
            This may be due to network issues or browser compatibility.
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
 * Fallback function to load main dictionary
 */
async function loadMainDictionary() {
  console.log('Loading main dictionary as fallback...');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  const response = await fetch('/words.json', {
    signal: controller.signal,
    cache: 'no-cache'
  });
  
  clearTimeout(timeoutId);
  
  if (!response.ok) {
    throw new Error(`Failed to load main dictionary: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data || !data.words || !Array.isArray(data.words)) {
    throw new Error('Invalid dictionary format: expected "words" array');
  }
  
  console.log(`Main dictionary loaded: ${data.words.length} words`);
  
  // Initialize Dictionary and GameController
  const dictionary = new Dictionary(data.words);
  const gameController = new GameController(dictionary);
  
  const app = createApp(App, {
    gameController,
    dictionary
  });
  
  app.use(vuetify);
  app.mount('#app');
  
  console.log('Hurdle - Ready to play!');
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
