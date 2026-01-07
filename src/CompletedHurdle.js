/**
 * CompletedHurdle module
 * Represents an individual completed hurdle with scoring information
 */

/**
 * CompletedHurdle class
 * Tracks data for a single completed hurdle including score and performance metrics
 */
class CompletedHurdle {
  /**
   * Create a CompletedHurdle instance
   * @param {number} hurdleNumber - The hurdle number (1-based)
   * @param {string} targetWord - The target word that was guessed
   * @param {number} guessCount - Number of guesses used to solve (1-4)
   * @param {number} score - Points earned for this hurdle
   * @param {Guess[]} guesses - Array of Guess objects made for this hurdle
   */
  constructor(hurdleNumber, targetWord, guessCount, score, guesses) {
    // Validate inputs
    if (typeof hurdleNumber !== 'number' || hurdleNumber < 1) {
      throw new Error('Hurdle number must be a positive number');
    }
    
    if (typeof targetWord !== 'string' || targetWord.length !== 5) {
      throw new Error('Target word must be a 5-letter string');
    }
    
    if (typeof guessCount !== 'number' || guessCount < 1 || guessCount > 4) {
      throw new Error('Guess count must be between 1 and 4');
    }
    
    if (typeof score !== 'number' || score < 0) {
      throw new Error('Score must be a non-negative number');
    }
    
    if (!Array.isArray(guesses)) {
      throw new Error('Guesses must be an array');
    }
    
    if (guesses.length !== guessCount) {
      throw new Error('Guesses array length must match guess count');
    }
    
    this.hurdleNumber = hurdleNumber;
    this.targetWord = targetWord.toLowerCase();
    this.guessCount = guessCount;
    this.score = score;
    this.guesses = [...guesses]; // Create copy to prevent external modification
    this.completedAt = new Date();
    this.guessMultiplier = this._calculateGuessMultiplier(guessCount);
  }

  /**
   * Calculate the guess multiplier based on number of guesses
   * @param {number} guessCount - Number of guesses used
   * @returns {number} The multiplier value
   * @private
   */
  _calculateGuessMultiplier(guessCount) {
    switch (guessCount) {
      case 1: return 1.75;
      case 2: return 1.5;
      case 3: return 1.25;
      case 4: return 1.0;
      default:
        throw new Error('Invalid guess count for multiplier calculation');
    }
  }

  /**
   * Get the hurdle number
   * @returns {number} The hurdle number (1-based)
   */
  getHurdleNumber() {
    return this.hurdleNumber;
  }

  /**
   * Get the target word
   * @returns {string} The target word that was solved
   */
  getTargetWord() {
    return this.targetWord;
  }

  /**
   * Get the number of guesses used
   * @returns {number} Number of guesses used to solve (1-4)
   */
  getGuessCount() {
    return this.guessCount;
  }

  /**
   * Get the score earned for this hurdle
   * @returns {number} Points earned for this hurdle
   */
  getScore() {
    return this.score;
  }

  /**
   * Get all guesses made for this hurdle
   * @returns {Guess[]} Array of Guess objects (copy to prevent modification)
   */
  getGuesses() {
    return [...this.guesses];
  }

  /**
   * Get the completion timestamp
   * @returns {Date} When this hurdle was completed
   */
  getCompletedAt() {
    return this.completedAt;
  }

  /**
   * Get the guess multiplier used for scoring
   * @returns {number} The multiplier applied based on guess count
   */
  getGuessMultiplier() {
    return this.guessMultiplier;
  }

  /**
   * Get a summary of this completed hurdle
   * @returns {Object} Summary object with key metrics
   */
  getSummary() {
    return {
      hurdleNumber: this.hurdleNumber,
      targetWord: this.targetWord,
      guessCount: this.guessCount,
      score: this.score,
      guessMultiplier: this.guessMultiplier,
      completedAt: this.completedAt
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompletedHurdle;
}

// ES6 export for modern bundlers
export default CompletedHurdle;