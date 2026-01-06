/**
 * GameController module for Hurdle
 * Orchestrates game flow and enforces game rules
 */

// Import required modules
const GameState = require('./GameState');
const FeedbackGenerator = require('./FeedbackGenerator');
const Guess = require('./Guess');
const HardModeValidator = require('./HardModeValidator');

/**
 * GuessResult type definition
 * @typedef {Object} GuessResult
 * @property {boolean} success - Whether the guess was successful
 * @property {string} [error] - Error message if guess was unsuccessful
 * @property {Guess} [guess] - The Guess object if successful
 * @property {'in-progress'|'won'|'lost'} gameStatus - Current game status
 */

/**
 * GameController class
 * Manages game lifecycle, validates guesses, and coordinates game components
 */
class GameController {
  /**
   * Create a GameController instance
   * @param {Dictionary} dictionary - The Dictionary instance for word validation
   * @param {boolean} hardMode - Whether hard mode is enabled (default: false)
   */
  constructor(dictionary, hardMode = false) {
    if (!dictionary) {
      throw new Error('Dictionary is required');
    }
    
    this.dictionary = dictionary;
    this.gameState = null;
    this.hardMode = hardMode;
    this.hardModeValidator = hardMode ? new HardModeValidator() : null;
  }

  /**
   * Start a new game
   * Selects a random target word and initializes game state
   * @param {number} maxGuesses - Maximum number of guesses allowed (default: 4)
   * @param {Object} frequencyRange - Optional frequency range for word selection
   * @returns {Promise<GameState>} The new game state
   */
  async startNewGame(maxGuesses = 4, frequencyRange = null) {
    const targetWord = await this.dictionary.getRandomWord(frequencyRange);
    this.gameState = new GameState(targetWord, maxGuesses);
    
    // Reset hard mode validator if enabled
    if (this.hardModeValidator) {
      this.hardModeValidator.reset();
    }
    
    return this.gameState;
  }

  /**
   * Submit a guess
   * Validates the guess and updates game state if valid
   * @param {string} word - The word to guess
   * @returns {Promise<GuessResult>} Result of the guess attempt
   */
  async submitGuess(word) {
    // Check if game has been started
    if (!this.gameState) {
      return {
        success: false,
        error: 'No game in progress. Start a new game first.',
        gameStatus: 'in-progress'
      };
    }

    // Check if game is already over
    if (this.gameState.isGameOver()) {
      return {
        success: false,
        error: 'Game is over. Start a new game!',
        gameStatus: this.gameState.getGameStatus()
      };
    }

    // Validate input type
    if (typeof word !== 'string') {
      return {
        success: false,
        error: 'Please enter a word',
        gameStatus: this.gameState.getGameStatus()
      };
    }

    // Normalize to lowercase for validation
    const normalizedWord = word.toLowerCase();

    // Validate length (Requirement 2.1)
    if (normalizedWord.length !== 5) {
      return {
        success: false,
        error: 'Word must be exactly 5 letters',
        gameStatus: this.gameState.getGameStatus()
      };
    }

    // Validate word exists in dictionary (Requirement 2.2) - now async
    const isValid = await this.dictionary.isValidWord(normalizedWord);
    if (!isValid) {
      return {
        success: false,
        error: 'Not a valid word',
        gameStatus: this.gameState.getGameStatus()
      };
    }

    // Check for duplicate guess
    const previousGuesses = this.gameState.getGuesses();
    const isDuplicate = previousGuesses.some(guess => guess.getWord() === normalizedWord);
    if (isDuplicate) {
      return {
        success: false,
        error: 'You have already guessed this word',
        gameStatus: this.gameState.getGameStatus()
      };
    }

    // Validate against hard mode rules if enabled
    if (this.hardModeValidator) {
      const hardModeValidation = this.hardModeValidator.validateGuess(normalizedWord);
      if (!hardModeValidation.isValid) {
        return {
          success: false,
          error: hardModeValidation.error,
          gameStatus: this.gameState.getGameStatus()
        };
      }
    }

    // Generate feedback for the guess
    const feedback = FeedbackGenerator.generateFeedback(
      normalizedWord,
      this.gameState.getTargetWord()
    );

    // Create Guess object
    const guess = new Guess(normalizedWord, feedback);

    // Update hard mode validator with the feedback if enabled
    if (this.hardModeValidator) {
      this.hardModeValidator.updateFromFeedback(normalizedWord, feedback);
    }

    // Add guess to game state (this will update game status if needed)
    this.gameState.addGuess(guess);

    // Return success result
    return {
      success: true,
      guess: guess,
      gameStatus: this.gameState.getGameStatus()
    };
  }

  /**
   * Get the current game state
   * @returns {GameState|null} The current game state, or null if no game started
   */
  getGameState() {
    return this.gameState;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameController;
}
