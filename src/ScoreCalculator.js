/**
 * ScoreCalculator module
 * Implements scoring formula and multiplier logic
 */

/**
 * ScoreCalculator class
 * Static utility class for calculating scores
 */
class ScoreCalculator {
  /**
   * Calculate the score for a completed hurdle
   * Formula: hurdle_number × 100 × guess_multiplier
   * @param {number} hurdleNumber - The hurdle number (1-based)
   * @param {number} guessCount - Number of guesses used (1-4)
   * @returns {number} The calculated score for the hurdle
   */
  static calculateHurdleScore(hurdleNumber, guessCount) {
    // Validate inputs
    if (typeof hurdleNumber !== 'number' || hurdleNumber < 1) {
      throw new Error('Hurdle number must be a positive number');
    }
    
    if (typeof guessCount !== 'number' || guessCount < 1 || guessCount > 4) {
      throw new Error('Guess count must be between 1 and 4');
    }
    
    const baseScore = hurdleNumber * 100;
    const multiplier = this.getGuessMultiplier(guessCount);
    
    return Math.round(baseScore * multiplier);
  }

  /**
   * Get the guess multiplier based on number of guesses used
   * @param {number} guessCount - Number of guesses used (1-4)
   * @returns {number} The multiplier value
   */
  static getGuessMultiplier(guessCount) {
    switch (guessCount) {
      case 1: return 1.75;
      case 2: return 1.5;
      case 3: return 1.25;
      case 4: return 1.0;
      default:
        throw new Error('Invalid guess count: must be between 1 and 4');
    }
  }

  /**
   * Calculate the final score from an array of completed hurdles
   * @param {CompletedHurdle[]} completedHurdles - Array of completed hurdles
   * @returns {number} The total final score
   */
  static calculateFinalScore(completedHurdles) {
    if (!Array.isArray(completedHurdles)) {
      throw new Error('Completed hurdles must be an array');
    }
    
    // Handle empty array (zero hurdles completed)
    if (completedHurdles.length === 0) {
      return 0;
    }
    
    return completedHurdles.reduce((totalScore, hurdle) => {
      if (!hurdle || typeof hurdle.getScore !== 'function') {
        throw new Error('Invalid hurdle object in array');
      }
      return totalScore + hurdle.getScore();
    }, 0);
  }

  /**
   * Validate that a calculated score matches the expected formula
   * Used for testing and validation purposes
   * @param {number} hurdleNumber - The hurdle number
   * @param {number} guessCount - Number of guesses used
   * @param {number} actualScore - The score to validate
   * @returns {boolean} True if the score matches the expected calculation
   */
  static validateScore(hurdleNumber, guessCount, actualScore) {
    try {
      const expectedScore = this.calculateHurdleScore(hurdleNumber, guessCount);
      return expectedScore === actualScore;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get scoring breakdown for display purposes
   * @param {number} hurdleNumber - The hurdle number
   * @param {number} guessCount - Number of guesses used
   * @returns {Object} Breakdown of score calculation
   */
  static getScoreBreakdown(hurdleNumber, guessCount) {
    const baseScore = hurdleNumber * 100;
    const multiplier = this.getGuessMultiplier(guessCount);
    const finalScore = this.calculateHurdleScore(hurdleNumber, guessCount);
    
    return {
      hurdleNumber,
      guessCount,
      baseScore,
      multiplier,
      finalScore,
      formula: `${hurdleNumber} × 100 × ${multiplier} = ${finalScore}`
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScoreCalculator;
}

// ES6 export for modern bundlers
export default ScoreCalculator;