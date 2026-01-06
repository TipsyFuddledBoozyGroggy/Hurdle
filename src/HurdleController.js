/**
 * HurdleController module
 * Orchestrates hurdle chains, manages transitions, and coordinates scoring
 */

// Import required modules
const GameController = require('./GameController');
const HurdleState = require('./HurdleState');
const HurdleSession = require('./HurdleSession');
const CompletedHurdle = require('./CompletedHurdle');
const ScoreCalculator = require('./ScoreCalculator');

/**
 * HurdleTransition type definition
 * @typedef {Object} HurdleTransition
 * @property {CompletedHurdle} completedHurdle - The hurdle that was just completed
 * @property {number} nextHurdleNumber - The number of the next hurdle
 * @property {boolean} shouldContinue - Whether the game should continue
 * @property {Object} animationData - Data for UI animations
 * @property {boolean} animationData.clearBoard - Whether to clear the board
 * @property {string} animationData.autoGuess - The auto-guess word for next hurdle
 * @property {number} animationData.showScore - The score to display
 */

/**
 * HurdleController class
 * Manages the hurdle chain, coordinates with GameController, and handles scoring
 */
class HurdleController {
  /**
   * Create a HurdleController instance
   * @param {Dictionary} dictionary - The Dictionary instance for word validation and selection
   */
  constructor(dictionary) {
    if (!dictionary) {
      throw new Error('Dictionary is required');
    }
    
    this.dictionary = dictionary;
    this.currentGameController = null;
    this.hurdleState = new HurdleState();
    this.session = null;
    this.previousAnswer = null; // Track previous hurdle answer for word uniqueness
  }

  /**
   * Start a new hurdle mode session
   * Initializes Hurdle 1 with a random word and resets all state
   * @param {number} maxGuesses - Maximum number of guesses allowed (default: 4)
   * @param {Object} frequencyRange - Optional frequency range for word selection
   * @param {boolean} hardMode - Whether hard mode is enabled (default: false)
   * @returns {Promise<HurdleSession>} The new hurdle session
   */
  async startHurdleMode(maxGuesses = 4, frequencyRange = null, hardMode = false) {
    // Reset all state for new session
    this.hurdleState.reset();
    this.session = new HurdleSession();
    this.previousAnswer = null;
    
    // Store configuration for this session
    this.sessionConfig = {
      maxGuesses,
      frequencyRange,
      hardMode
    };
    
    // Start the first hurdle
    this.currentGameController = new GameController(this.dictionary, hardMode);
    const gameState = await this.currentGameController.startNewGame(maxGuesses, frequencyRange);
    
    // Ensure the configured number of attempts are available
    if (gameState.getRemainingAttempts() !== maxGuesses) {
      throw new Error(`First hurdle must have exactly ${maxGuesses} attempts available`);
    }
    
    // Store the target word to ensure next hurdle is different
    this.previousAnswer = gameState.getTargetWord();
    
    return this.session;
  }

  /**
   * Process the completion of a hurdle
   * Calculates score, creates CompletedHurdle, and prepares for transition
   * @param {GameState} gameState - The completed game state
   * @returns {Promise<HurdleTransition>} Transition data for the next hurdle
   */
  async processHurdleCompletion(gameState) {
    if (!gameState) {
      throw new Error('Game state is required');
    }
    
    if (gameState.getGameStatus() !== 'won') {
      throw new Error('Can only process completed (won) hurdles');
    }
    
    const currentHurdleNumber = this.hurdleState.getCurrentHurdleNumber();
    const guesses = gameState.getGuesses();
    const guessCount = guesses.length;
    const targetWord = gameState.getTargetWord();
    
    // Calculate score using the scoring formula
    const score = ScoreCalculator.calculateHurdleScore(currentHurdleNumber, guessCount);
    
    // Create completed hurdle record
    const completedHurdle = new CompletedHurdle(
      currentHurdleNumber,
      targetWord,
      guessCount,
      score,
      guesses
    );
    
    // Add to hurdle state and session
    this.hurdleState.addCompletedHurdle(completedHurdle);
    this.session.addCompletedHurdle(completedHurdle);
    
    // Increment hurdle number for next hurdle (Requirement 2.5)
    this.hurdleState.incrementHurdleNumber();
    this.session.setCurrentHurdleNumber(this.hurdleState.getCurrentHurdleNumber());
    
    // Prepare transition data
    const transition = {
      completedHurdle: completedHurdle,
      nextHurdleNumber: this.hurdleState.getCurrentHurdleNumber(),
      shouldContinue: true,
      animationData: {
        clearBoard: true,
        autoGuess: targetWord, // Previous answer becomes auto-guess
        showScore: score
      }
    };
    
    return transition;
  }

  /**
   * Start the next hurdle with auto-guess logic
   * Creates new GameController, selects different word, and applies auto-guess
   * @param {string} previousAnswer - The answer from the previous hurdle (becomes auto-guess)
   * @returns {Promise<GameState>} The new game state with auto-guess applied
   */
  async startNextHurdle(previousAnswer) {
    if (!previousAnswer || typeof previousAnswer !== 'string') {
      throw new Error('Previous answer is required for auto-guess');
    }
    
    // Select a new target word that is different from the previous answer (Requirement 2.2, 6.5)
    const newTargetWord = await this._selectDifferentWord(previousAnswer);
    
    // Create new GameController with the selected word
    const hardMode = this.sessionConfig?.hardMode || false;
    this.currentGameController = new GameController(this.dictionary, hardMode);
    
    // Start new game with session configuration
    const maxGuesses = this.sessionConfig?.maxGuesses || 4;
    const frequencyRange = this.sessionConfig?.frequencyRange || null;
    
    // Start new game - we need to override the target word selection
    // Since GameController.startNewGame() selects a random word, we need to create GameState directly
    const GameState = require('./GameState');
    const newGameState = new GameState(newTargetWord, maxGuesses);
    this.currentGameController.gameState = newGameState;
    
    // Apply auto-guess immediately (Requirement 2.3, 2.4)
    const guessResult = await this.currentGameController.submitGuess(previousAnswer);
    
    if (!guessResult.success) {
      throw new Error(`Auto-guess failed: ${guessResult.error}`);
    }
    
    // Verify auto-guess counts as Guess #1 (Requirement 2.4)
    const remainingAttempts = newGameState.getRemainingAttempts();
    if (remainingAttempts !== maxGuesses - 1) {
      throw new Error(`Auto-guess should leave exactly ${maxGuesses - 1} remaining attempts`);
    }
    
    // Update previous answer for next iteration
    this.previousAnswer = newTargetWord;
    
    // Handle edge case: auto-guess immediately solves the hurdle (Requirement 6.1, 6.2)
    if (guessResult.gameStatus === 'won') {
      // This will be handled by the calling code through processHurdleCompletion
      // The auto-guess counts as a 1-guess completion for scoring
    }
    
    return newGameState;
  }

  /**
   * Select a word that is different from the previous hurdle's answer
   * Implements retry logic with fallback strategies
   * @param {string} previousWord - The word to avoid selecting
   * @returns {Promise<string>} A different 5-letter word
   * @private
   */
  async _selectDifferentWord(previousWord) {
    const maxAttempts = 10;
    let attempts = 0;
    let newWord;
    
    // Get frequency range from session config
    const frequencyRange = this.sessionConfig?.frequencyRange || null;
    
    // Try to get a different word with retry logic
    do {
      try {
        newWord = await this.dictionary.getRandomWord(frequencyRange);
        attempts++;
      } catch (error) {
        console.warn(`Word selection attempt ${attempts} failed:`, error.message);
        attempts++;
        
        // If API fails, try fallback immediately
        if (attempts >= 3) {
          break;
        }
      }
    } while (newWord === previousWord && attempts < maxAttempts);
    
    // If we still have the same word after max attempts, implement fallback
    if (newWord === previousWord || !newWord) {
      // Fallback strategy: try to find any different word from dictionary
      newWord = await this._findDifferentWordFallback(previousWord);
    }
    
    return newWord;
  }

  /**
   * Fallback strategy to find a different word when random selection fails
   * @param {string} previousWord - The word to avoid
   * @returns {Promise<string>} A different word
   * @private
   */
  async _findDifferentWordFallback(previousWord) {
    // Strategy 1: Try multiple random selections with error handling
    for (let i = 0; i < 5; i++) {
      try {
        const candidateWord = await this.dictionary.getRandomWord();
        if (candidateWord && candidateWord !== previousWord) {
          console.log(`Fallback strategy 1 succeeded: found "${candidateWord}"`);
          return candidateWord;
        }
      } catch (error) {
        console.warn(`Fallback attempt ${i + 1} failed:`, error.message);
        continue;
      }
    }
    
    // Strategy 2: Use synchronous local dictionary if available
    if (this.dictionary.wordArray && this.dictionary.wordArray.length > 0) {
      const availableWords = this.dictionary.wordArray.filter(word => word !== previousWord);
      if (availableWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        const fallbackWord = availableWords[randomIndex];
        console.log(`Fallback strategy 2 succeeded: found "${fallbackWord}" from local dictionary`);
        return fallbackWord;
      }
    }
    
    // Strategy 3: Emergency fallback - use a hardcoded different word
    const emergencyWords = ['ABOUT', 'AFTER', 'AGAIN', 'BELOW', 'COULD', 'EVERY', 'FIRST', 'FOUND', 'GREAT', 'GROUP'];
    const emergencyOptions = emergencyWords.filter(word => word !== previousWord.toUpperCase());
    
    if (emergencyOptions.length > 0) {
      const emergencyWord = emergencyOptions[0].toLowerCase();
      console.warn(`Using emergency fallback word: "${emergencyWord}"`);
      return emergencyWord;
    }
    
    // Strategy 4: Last resort - return any valid word (graceful degradation)
    // This handles the edge case mentioned in Requirement 6.3
    console.error('All fallback strategies failed, using last resort');
    try {
      return await this.dictionary.getRandomWord();
    } catch (error) {
      // Absolute last resort - return a hardcoded word
      console.error('Complete dictionary failure, using hardcoded fallback');
      return 'words'; // This should never happen, but prevents complete failure
    }
  }

  /**
   * Get the current hurdle state
   * @returns {HurdleState} The current hurdle state
   */
  getHurdleState() {
    return this.hurdleState;
  }

  /**
   * Get the current game controller
   * @returns {GameController|null} The current game controller, or null if no game active
   */
  getCurrentGameController() {
    return this.currentGameController;
  }

  /**
   * Get the current session
   * @returns {HurdleSession|null} The current session, or null if no session active
   */
  getSession() {
    return this.session;
  }

  /**
   * Calculate the final score for the current session
   * @returns {number} The total final score
   */
  calculateFinalScore() {
    if (!this.session) {
      return 0;
    }
    
    return ScoreCalculator.calculateFinalScore(this.hurdleState.getCompletedHurdles());
  }

  /**
   * End the current hurdle mode session
   * @param {string} reason - The reason for ending ('failure' | 'manual-stop')
   * @param {string} [finalHurdleAnswer] - The correct answer if ended due to failure
   * @returns {HurdleSession} The completed session
   */
  endHurdleMode(reason, finalHurdleAnswer = null) {
    if (!this.session) {
      throw new Error('No active session to end');
    }
    
    this.session.endSession(reason, finalHurdleAnswer);
    
    // Clean up current game controller
    this.currentGameController = null;
    
    return this.session;
  }

  /**
   * Check if there is an active hurdle mode session
   * @returns {boolean} True if session is active
   */
  isActive() {
    return this.session ? this.session.isActive() : false;
  }

  /**
   * Reset the controller to initial state
   * Clears all session data and state
   */
  reset() {
    this.currentGameController = null;
    this.hurdleState.reset();
    this.session = null;
    this.previousAnswer = null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HurdleController;
}