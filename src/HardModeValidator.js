/**
 * HardModeValidator module for Hurdle
 * Validates guesses according to Wordle hard mode rules
 */

class HardModeValidator {
  constructor() {
    this.knownCorrectPositions = new Map(); // position -> letter
    this.knownIncludedLetters = new Set(); // letters that must be included
    this.knownExcludedLetters = new Set(); // letters that are not in the word
  }

  /**
   * Update the validator with feedback from a guess
   * @param {string} guess - The guess that was made
   * @param {Array} feedback - Array of feedback objects with {letter, status}
   */
  updateFromFeedback(guess, feedback) {
    for (let i = 0; i < feedback.length; i++) {
      const { letter, status } = feedback[i];
      const lowerLetter = letter.toLowerCase();

      switch (status) {
        case 'correct':
          // Letter is in correct position
          this.knownCorrectPositions.set(i, lowerLetter);
          this.knownIncludedLetters.add(lowerLetter);
          break;
        
        case 'present':
          // Letter is in word but wrong position
          this.knownIncludedLetters.add(lowerLetter);
          break;
        
        case 'absent':
          // Letter is not in word (unless it's already known to be included)
          if (!this.knownIncludedLetters.has(lowerLetter)) {
            this.knownExcludedLetters.add(lowerLetter);
          }
          break;
      }
    }
  }

  /**
   * Validate a guess against hard mode rules
   * @param {string} guess - The guess to validate
   * @returns {Object} Validation result with {isValid, error}
   */
  validateGuess(guess) {
    const lowerGuess = guess.toLowerCase();
    
    // Check if all known correct positions are maintained
    for (const [position, letter] of this.knownCorrectPositions) {
      if (lowerGuess[position] !== letter) {
        return {
          isValid: false,
          error: `${position + 1}${this.getOrdinalSuffix(position + 1)} letter must be ${letter.toUpperCase()}`
        };
      }
    }

    // Check if all known included letters are present
    for (const letter of this.knownIncludedLetters) {
      if (!lowerGuess.includes(letter)) {
        return {
          isValid: false,
          error: `Guess must contain ${letter.toUpperCase()}`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Get ordinal suffix for position numbers (1st, 2nd, 3rd, etc.)
   * @param {number} num - The number
   * @returns {string} The ordinal suffix
   */
  getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    
    if (j === 1 && k !== 11) {
      return 'st';
    }
    if (j === 2 && k !== 12) {
      return 'nd';
    }
    if (j === 3 && k !== 13) {
      return 'rd';
    }
    return 'th';
  }

  /**
   * Reset the validator for a new game
   */
  reset() {
    this.knownCorrectPositions.clear();
    this.knownIncludedLetters.clear();
    this.knownExcludedLetters.clear();
  }

  /**
   * Get current hard mode constraints for debugging
   * @returns {Object} Current constraints
   */
  getConstraints() {
    return {
      correctPositions: Object.fromEntries(this.knownCorrectPositions),
      includedLetters: Array.from(this.knownIncludedLetters),
      excludedLetters: Array.from(this.knownExcludedLetters)
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HardModeValidator;
}

export default HardModeValidator;