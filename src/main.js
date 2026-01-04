// Hard Wordle - Main Entry Point (Vue 3)
import { createApp } from 'vue';
import App from './App.vue';

// Import game modules
const Dictionary = require('./Dictionary');
const GameController = require('./GameController');

/**
 * Initialize the Hard Wordle application
 * Loads the word dictionary and sets up the game
 */
async function initializeApp() {
  try {
    console.log('Hard Wordle - Loading dictionary...');
    
    // Detect environment
    const isProduction = detectProductionEnvironment();
    console.log(`Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
    
    // Choose dictionary file based on environment
    const dictionaryFile = isProduction ? '/words.json' : '/words_uncommon.json';
    console.log(`Loading dictionary from: ${dictionaryFile}`);
    
    // Load word dictionary
    const response = await fetch(dictionaryFile);
    
    if (!response.ok) {
      // If uncommon words file fails in development, fall back to main dictionary
      if (!isProduction && dictionaryFile === '/words_uncommon.json') {
        console.warn('Uncommon words dictionary not found, falling back to main dictionary');
        return loadMainDictionary();
      }
      throw new Error(`Failed to load dictionary: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate dictionary data
    if (!data.words || !Array.isArray(data.words)) {
      throw new Error('Invalid dictionary format: expected "words" array');
    }
    
    if (data.words.length === 0) {
      throw new Error('Dictionary is empty');
    }
    
    console.log(`Dictionary loaded: ${data.words.length} words`);
    
    // Initialize Dictionary instance
    const dictionary = new Dictionary(data.words);
    
    // Initialize GameController with Dictionary
    const gameController = new GameController(dictionary);
    
    // Create and mount Vue app
    const app = createApp(App, {
      gameController
    });
    
    app.mount('#app');
    
    console.log('Hard Wordle - Ready to play!');
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    // Display user-friendly error message
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div id="game-container">
          <div class="message-area error">
            Failed to load game: ${error.message}. Please refresh the page to try again.
          </div>
        </div>
      `;
    }
  }
}

/**
 * Fallback function to load main dictionary
 */
async function loadMainDictionary() {
  const response = await fetch('/words.json');
  
  if (!response.ok) {
    throw new Error(`Failed to load main dictionary: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.words || !Array.isArray(data.words)) {
    throw new Error('Invalid dictionary format: expected "words" array');
  }
  
  console.log(`Main dictionary loaded: ${data.words.length} words`);
  
  const dictionary = new Dictionary(data.words);
  const gameController = new GameController(dictionary);
  
  const app = createApp(App, {
    gameController
  });
  
  app.mount('#app');
  
  console.log('Hard Wordle - Ready to play!');
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
