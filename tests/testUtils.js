/**
 * Test utilities for Vue component testing with Hurdle Mode support
 */

// Import Vue test utilities
const { mount } = require('@vue/test-utils');
const { nextTick } = require('vue');

// Import business logic modules
const Dictionary = require('../src/Dictionary');
const GameController = require('../src/GameController');
const HurdleController = require('../src/HurdleController');

// Import Vue component
const App = require('../src/App.vue').default;

/**
 * Create a test dictionary with a small set of known words
 */
function createTestDictionary() {
  const testWords = [
    'APPLE', 'BREAD', 'CRANE', 'DANCE', 'EAGLE',
    'FLAME', 'GRAPE', 'HOUSE', 'IMAGE', 'JUICE',
    'KNIFE', 'LEMON', 'MOUSE', 'NURSE', 'OCEAN',
    'PIANO', 'QUEEN', 'RIVER', 'SNAKE', 'TIGER',
    'UNCLE', 'VOICE', 'WATER', 'XERUS', 'YOUTH', 'ZEBRA'
  ];
  return new Dictionary(testWords);
}

/**
 * Create a hurdle controller with test dictionary
 */
function createTestHurdleController() {
  const dictionary = createTestDictionary();
  return new HurdleController(dictionary);
}

/**
 * Mount App component with test hurdle controller
 */
async function mountAppWithHurdleController(options = {}) {
  const dictionary = createTestDictionary();
  const gameController = new GameController(dictionary);
  const hurdleController = new HurdleController(dictionary);
  
  // Initialize the hurdle controller
  await hurdleController.startHurdleMode();
  
  const defaultProps = {
    gameController,
    dictionary
  };
  
  const mountOptions = {
    props: { ...defaultProps, ...options.props },
    ...options
  };
  
  const wrapper = mount(App, mountOptions);
  
  // Wait for component to mount and initialize
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    wrapper,
    gameController,
    hurdleController,
    dictionary
  };
}

/**
 * Mount App component with test game controller (legacy support)
 */
async function mountAppWithTestController(options = {}) {
  // For backward compatibility, redirect to hurdle controller
  return await mountAppWithHurdleController(options);
}

/**
 * Wait for Vue's nextTick and any additional async operations
 */
async function waitForUpdates() {
  await nextTick();
  // Add longer delay for async operations including animations
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Simulate typing a word character by character
 */
async function typeWord(wrapper, word) {
  for (const char of word.toUpperCase()) {
    const keyButton = wrapper.find(`[data-key="${char}"]`);
    if (keyButton.exists()) {
      await keyButton.trigger('click');
      await waitForUpdates();
    }
  }
}

/**
 * Simulate pressing Enter to submit a guess
 */
async function submitGuess(wrapper) {
  const enterButton = wrapper.find('[data-key="ENTER"]');
  if (enterButton.exists()) {
    await enterButton.trigger('click');
    // Wait longer for async submission and animations
    await new Promise(resolve => setTimeout(resolve, 2000));
    await nextTick();
  }
}

/**
 * Simulate pressing Backspace
 */
async function pressBackspace(wrapper) {
  const backspaceButton = wrapper.find('[data-key="BACKSPACE"]');
  if (backspaceButton.exists()) {
    await backspaceButton.trigger('click');
    await waitForUpdates();
  }
}

/**
 * Get the current state of the game board as a 2D array
 */
function getBoardState(wrapper) {
  const rows = wrapper.findAll('.guess-row');
  return rows.map(row => {
    const tiles = row.findAll('.letter-tile');
    return tiles.map(tile => ({
      letter: tile.text().trim(),
      classes: tile.classes()
    }));
  });
}

/**
 * Get the current keyboard state
 */
function getKeyboardState(wrapper) {
  const keys = wrapper.findAll('.key');
  const state = {};
  
  keys.forEach(key => {
    const keyText = key.text().trim();
    if (keyText && keyText !== '⌫' && keyText !== 'ENTER' && keyText !== 'BACKSPACE') {
      state[keyText] = key.classes();
    }
  });
  
  return state;
}

/**
 * Check if a message is displayed
 */
async function getDisplayedMessage(wrapper) {
  // Force update and wait for Vue reactivity
  await wrapper.vm.$nextTick();
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const messageArea = wrapper.find('#message-area');
  if (messageArea.exists()) {
    const text = messageArea.text().trim();
    if (text) {
      return {
        text: text,
        classes: messageArea.classes()
      };
    }
  }
  
  // Also check for any element with message content
  const allElements = wrapper.findAll('*');
  for (const element of allElements) {
    const text = element.text().trim();
    if (text.includes('Congratulations') || text.includes('Game ended')) {
      return {
        text: text,
        classes: element.classes()
      };
    }
  }
  
  return null;
}

/**
 * Simulate a complete hurdle to completion state
 */
async function playHurdleToCompletion(wrapper, hurdleController, targetWord = null) {
  // If no target word provided, get it from the current game state
  if (!targetWord) {
    const currentGameController = hurdleController.getCurrentGameController();
    const gameState = currentGameController?.getGameState();
    if (gameState) {
      targetWord = gameState.getTargetWord();
    } else {
      throw new Error('No game state available and no target word provided');
    }
  }
  
  // Clear any existing input first
  wrapper.vm.currentGuess = '';
  await waitForUpdates();
  
  // Type the target word
  await typeWord(wrapper, targetWord);
  await waitForUpdates();
  
  // Submit the guess
  await submitGuess(wrapper);
  
  // Wait for hurdle completion processing and transition setup
  await new Promise(resolve => setTimeout(resolve, 3000));
}

/**
 * Simulate a complete hurdle to failure state
 */
async function playHurdleToFailure(wrapper, hurdleController) {
  const currentGameController = hurdleController.getCurrentGameController();
  const targetWord = currentGameController.getGameState().getTargetWord();
  const testWords = ['APPLE', 'BREAD', 'CRANE', 'DANCE', 'EAGLE', 'FLAME'];
  
  // Make 4 wrong guesses (avoid the target word and duplicates)
  const usedWords = new Set();
  let guessCount = 0;
  
  for (let i = 0; i < testWords.length && guessCount < 4; i++) {
    let guessWord = testWords[i];
    
    // Make sure we don't accidentally guess the target word or repeat a word
    if (guessWord === targetWord.toUpperCase() || usedWords.has(guessWord)) {
      continue;
    }
    
    usedWords.add(guessWord);
    await typeWord(wrapper, guessWord);
    await submitGuess(wrapper);
    await waitForUpdates();
    guessCount++;
  }
  
  // Additional wait for final async operations
  await new Promise(resolve => setTimeout(resolve, 1000));
}

/**
 * Create a mock feedback array for a word
 */
function createMockFeedback(word, status = 'correct') {
  return word.split('').map(letter => ({
    letter: letter.toLowerCase(),
    status: status
  }));
}

/**
 * Create a mock Guess object with proper feedback
 */
function createMockGuess(word, status = 'correct') {
  const Guess = require('../src/Guess');
  const feedback = createMockFeedback(word, status);
  return new Guess(word, feedback);
}

module.exports = {
  createTestDictionary,
  createTestGameController: createTestHurdleController, // Redirect to hurdle controller
  createTestHurdleController,
  mountAppWithTestController,
  mountAppWithHurdleController,
  waitForUpdates,
  typeWord,
  submitGuess,
  pressBackspace,
  getBoardState,
  getKeyboardState,
  getDisplayedMessage,
  playGameToWin: playHurdleToCompletion, // Redirect to hurdle completion
  playGameToLoss: playHurdleToFailure, // Redirect to hurdle failure
  playHurdleToCompletion,
  playHurdleToFailure,
  createMockFeedback,
  createMockGuess
};