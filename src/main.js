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
    
    // Load word dictionary from words.json
    const response = await fetch('/words.json');
    
    if (!response.ok) {
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

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}
