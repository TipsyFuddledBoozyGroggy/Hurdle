/**
 * HurdleState module
 * Manages the overall state of a hurdle session
 */

/**
 * HurdleState class
 * Tracks current hurdle number, completed hurdles count, total score, and completed hurdles list
 */
class HurdleState {
  /**
   * Create a HurdleState instance
   * Initializes with hurdle number 1, zero completed hurdles, and zero score
   */
  constructor() {
    this.currentHurdleNumber = 1;
    this.completedHurdlesCount = 0;
    this.totalScore = 0;
    this.completedHurdles = [];
    this.solvedWords = []; // Track all solved words for definition access
  }

  /**
   * Get the current hurdle number
   * @returns {number} The current hurdle number (1-based)
   */
  getCurrentHurdleNumber() {
    return this.currentHurdleNumber;
  }

  /**
   * Get the count of completed hurdles
   * @returns {number} Number of hurdles completed in this session
   */
  getCompletedHurdlesCount() {
    return this.completedHurdlesCount;
  }

  /**
   * Get the total accumulated score
   * @returns {number} Total score from all completed hurdles
   */
  getTotalScore() {
    return this.totalScore;
  }

  /**
   * Get all completed hurdles
   * @returns {CompletedHurdle[]} Array of completed hurdles (copy to prevent modification)
   */
  getCompletedHurdles() {
    return [...this.completedHurdles];
  }

  /**
   * Get all solved words from completed hurdles
   * @returns {string[]} Array of solved words (copy to prevent modification)
   */
  getSolvedWords() {
    return [...this.solvedWords];
  }

  /**
   * Add a completed hurdle to the session
   * Updates completed count and total score
   * @param {CompletedHurdle} hurdle - The completed hurdle to add
   */
  addCompletedHurdle(hurdle) {
    if (!hurdle) {
      throw new Error('Hurdle cannot be null or undefined');
    }

    // Validate that the hurdle number matches expected sequence
    if (hurdle.getHurdleNumber() !== this.currentHurdleNumber) {
      throw new Error(`Expected hurdle number ${this.currentHurdleNumber}, but got ${hurdle.getHurdleNumber()}`);
    }

    // Create state backup before modification
    const stateBackup = this.createStateBackup();

    try {
      this.completedHurdles.push(hurdle);
      this.completedHurdlesCount++;
      this.totalScore += hurdle.getScore();
      
      // Add the solved word to the list (Requirement 8.5)
      this.solvedWords.push(hurdle.getTargetWord());

      // Validate state after modification
      if (!this.validateState()) {
        console.warn('State corruption detected after adding hurdle, attempting recovery...');
        const recoveryResult = this.detectAndRecoverFromCorruption();
        
        if (!recoveryResult.success) {
          // If recovery fails, restore from backup
          console.error('Recovery failed, restoring from backup');
          this.restoreFromBackup(stateBackup);
          throw new Error('Failed to add hurdle due to state corruption');
        }
      }

    } catch (error) {
      // Restore from backup on any error
      this.restoreFromBackup(stateBackup);
      throw error;
    }
  }

  /**
   * Increment the current hurdle number
   * Should be called when transitioning to the next hurdle
   */
  incrementHurdleNumber() {
    this.currentHurdleNumber++;
  }

  /**
   * Reset the hurdle state to initial values
   * Clears all progress and resets to starting state
   */
  reset() {
    this.currentHurdleNumber = 1;
    this.completedHurdlesCount = 0;
    this.totalScore = 0;
    this.completedHurdles = [];
    this.solvedWords = [];
  }

  /**
   * Get a summary of the current session state
   * @returns {Object} Summary object with current state metrics
   */
  getSessionSummary() {
    return {
      currentHurdleNumber: this.currentHurdleNumber,
      completedHurdlesCount: this.completedHurdlesCount,
      totalScore: this.totalScore,
      completedHurdles: this.completedHurdles.length,
      solvedWords: this.solvedWords.length
    };
  }

  /**
   * Validate the internal state consistency
   * Ensures completed hurdles count matches array length and score is correct
   * @returns {boolean} True if state is consistent
   */
  validateState() {
    // Check completed hurdles count matches array length
    if (this.completedHurdlesCount !== this.completedHurdles.length) {
      return false;
    }

    // Check total score matches sum of individual hurdle scores
    const calculatedScore = this.completedHurdles.reduce((sum, hurdle) => sum + hurdle.getScore(), 0);
    if (this.totalScore !== calculatedScore) {
      return false;
    }

    // Check hurdle numbers are sequential starting from 1
    for (let i = 0; i < this.completedHurdles.length; i++) {
      if (this.completedHurdles[i].getHurdleNumber() !== i + 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Detect and recover from state corruption
   * Attempts to fix inconsistencies in the hurdle state
   * @returns {Object} Recovery result with success status and actions taken
   */
  detectAndRecoverFromCorruption() {
    const recoveryResult = {
      success: false,
      corruptionDetected: false,
      actionsPerformed: [],
      errors: []
    };

    try {
      // Check for corruption
      if (this.validateState()) {
        recoveryResult.success = true;
        return recoveryResult;
      }

      recoveryResult.corruptionDetected = true;
      console.warn('State corruption detected, attempting recovery...');

      // Recovery Action 1: Fix completed hurdles count mismatch
      if (this.completedHurdlesCount !== this.completedHurdles.length) {
        const oldCount = this.completedHurdlesCount;
        this.completedHurdlesCount = this.completedHurdles.length;
        recoveryResult.actionsPerformed.push(`Fixed completed hurdles count: ${oldCount} → ${this.completedHurdlesCount}`);
        console.log(`Recovered: Fixed completed hurdles count from ${oldCount} to ${this.completedHurdlesCount}`);
      }

      // Recovery Action 2: Recalculate total score from completed hurdles
      const calculatedScore = this.completedHurdles.reduce((sum, hurdle) => {
        try {
          return sum + hurdle.getScore();
        } catch (error) {
          recoveryResult.errors.push(`Invalid hurdle score: ${error.message}`);
          return sum;
        }
      }, 0);

      if (this.totalScore !== calculatedScore) {
        const oldScore = this.totalScore;
        this.totalScore = calculatedScore;
        recoveryResult.actionsPerformed.push(`Recalculated total score: ${oldScore} → ${this.totalScore}`);
        console.log(`Recovered: Recalculated total score from ${oldScore} to ${this.totalScore}`);
      }

      // Recovery Action 3: Fix hurdle number sequence
      let hurdleNumberFixed = false;
      for (let i = 0; i < this.completedHurdles.length; i++) {
        const expectedNumber = i + 1;
        const actualNumber = this.completedHurdles[i].getHurdleNumber();
        if (actualNumber !== expectedNumber) {
          // This is more complex to fix as it involves modifying hurdle objects
          // For now, we'll log the issue and continue
          recoveryResult.errors.push(`Hurdle ${i} has number ${actualNumber}, expected ${expectedNumber}`);
          hurdleNumberFixed = true;
        }
      }

      if (hurdleNumberFixed) {
        recoveryResult.actionsPerformed.push('Detected hurdle number sequence issues (manual review needed)');
      }

      // Recovery Action 4: Validate current hurdle number
      const expectedCurrentHurdle = this.completedHurdles.length + 1;
      if (this.currentHurdleNumber !== expectedCurrentHurdle) {
        const oldNumber = this.currentHurdleNumber;
        this.currentHurdleNumber = expectedCurrentHurdle;
        recoveryResult.actionsPerformed.push(`Fixed current hurdle number: ${oldNumber} → ${this.currentHurdleNumber}`);
        console.log(`Recovered: Fixed current hurdle number from ${oldNumber} to ${this.currentHurdleNumber}`);
      }

      // Recovery Action 5: Validate solved words list
      const expectedSolvedWords = this.completedHurdles.map(hurdle => hurdle.getTargetWord());
      if (this.solvedWords.length !== expectedSolvedWords.length) {
        this.solvedWords = [...expectedSolvedWords];
        recoveryResult.actionsPerformed.push(`Rebuilt solved words list (${this.solvedWords.length} words)`);
        console.log(`Recovered: Rebuilt solved words list with ${this.solvedWords.length} words`);
      }

      // Final validation
      if (this.validateState()) {
        recoveryResult.success = true;
        console.log('State corruption recovery successful');
      } else {
        recoveryResult.errors.push('Recovery failed - state still invalid');
        console.error('State corruption recovery failed');
      }

    } catch (error) {
      recoveryResult.errors.push(`Recovery process failed: ${error.message}`);
      console.error('Error during state corruption recovery:', error);
    }

    return recoveryResult;
  }

  /**
   * Create a backup of the current state for recovery purposes
   * @returns {Object} State backup object
   */
  createStateBackup() {
    return {
      currentHurdleNumber: this.currentHurdleNumber,
      completedHurdlesCount: this.completedHurdlesCount,
      totalScore: this.totalScore,
      completedHurdles: this.completedHurdles.map(hurdle => ({
        hurdleNumber: hurdle.getHurdleNumber(),
        targetWord: hurdle.getTargetWord(),
        guessCount: hurdle.getGuessCount(),
        score: hurdle.getScore()
      })),
      solvedWords: [...this.solvedWords],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Restore state from a backup (emergency recovery)
   * @param {Object} backup - State backup object
   * @returns {boolean} True if restore was successful
   */
  restoreFromBackup(backup) {
    try {
      if (!backup || typeof backup !== 'object') {
        throw new Error('Invalid backup object');
      }

      // Validate backup structure
      const requiredFields = ['currentHurdleNumber', 'completedHurdlesCount', 'totalScore', 'completedHurdles', 'solvedWords'];
      for (const field of requiredFields) {
        if (!(field in backup)) {
          throw new Error(`Backup missing required field: ${field}`);
        }
      }

      // Restore basic state
      this.currentHurdleNumber = backup.currentHurdleNumber;
      this.completedHurdlesCount = backup.completedHurdlesCount;
      this.totalScore = backup.totalScore;
      this.solvedWords = [...backup.solvedWords];

      // Note: We can't fully restore CompletedHurdle objects from backup
      // This is an emergency recovery that restores basic state only
      console.log(`Emergency state restore from backup (${backup.timestamp})`);
      return true;

    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HurdleState;
}

// ES6 export for modern bundlers
export default HurdleState;