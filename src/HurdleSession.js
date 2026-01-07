/**
 * HurdleSession module
 * Represents a complete hurdle session with tracking data
 */

/**
 * HurdleSession class
 * Tracks overall session state including completed hurdles and scoring
 */
class HurdleSession {
  /**
   * Create a HurdleSession instance
   */
  constructor() {
    this.sessionId = this._generateUniqueId();
    this.startTime = new Date();
    this.endTime = null;
    this.currentHurdleNumber = 1;
    this.completedHurdles = [];
    this.totalScore = 0;
    this.endReason = null; // 'failure' | 'manual-stop'
    this.finalHurdleAnswer = null;
  }

  /**
   * Generate a unique session ID
   * @returns {string} Unique session identifier
   * @private
   */
  _generateUniqueId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get the session ID
   * @returns {string} The unique session identifier
   */
  getSessionId() {
    return this.sessionId;
  }

  /**
   * Get the session start time
   * @returns {Date} When the session started
   */
  getStartTime() {
    return this.startTime;
  }

  /**
   * Get the session end time
   * @returns {Date|null} When the session ended, or null if still active
   */
  getEndTime() {
    return this.endTime;
  }

  /**
   * Get the current hurdle number
   * @returns {number} The current hurdle number (1-based)
   */
  getCurrentHurdleNumber() {
    return this.currentHurdleNumber;
  }

  /**
   * Set the current hurdle number
   * @param {number} hurdleNumber - The hurdle number to set
   */
  setCurrentHurdleNumber(hurdleNumber) {
    if (typeof hurdleNumber !== 'number' || hurdleNumber < 1) {
      throw new Error('Hurdle number must be a positive number');
    }
    this.currentHurdleNumber = hurdleNumber;
  }

  /**
   * Get all completed hurdles
   * @returns {CompletedHurdle[]} Array of completed hurdles
   */
  getCompletedHurdles() {
    return [...this.completedHurdles]; // Return copy to prevent external modification
  }

  /**
   * Add a completed hurdle to the session
   * @param {CompletedHurdle} completedHurdle - The completed hurdle to add
   */
  addCompletedHurdle(completedHurdle) {
    if (!completedHurdle) {
      throw new Error('Completed hurdle cannot be null or undefined');
    }
    this.completedHurdles.push(completedHurdle);
    this.totalScore += completedHurdle.getScore();
  }

  /**
   * Get the total score for the session
   * @returns {number} The cumulative score from all completed hurdles
   */
  getTotalScore() {
    return this.totalScore;
  }

  /**
   * Get the count of completed hurdles
   * @returns {number} Number of hurdles completed in this session
   */
  getCompletedHurdlesCount() {
    return this.completedHurdles.length;
  }

  /**
   * End the session
   * @param {string} reason - The reason for ending ('failure' | 'manual-stop')
   * @param {string} [finalHurdleAnswer] - The correct answer for the final hurdle if failed
   */
  endSession(reason, finalHurdleAnswer = null) {
    if (reason !== 'failure' && reason !== 'manual-stop') {
      throw new Error('End reason must be either "failure" or "manual-stop"');
    }
    
    this.endTime = new Date();
    this.endReason = reason;
    this.finalHurdleAnswer = finalHurdleAnswer;
  }

  /**
   * Get the reason the session ended
   * @returns {string|null} The end reason, or null if session is still active
   */
  getEndReason() {
    return this.endReason;
  }

  /**
   * Get the final hurdle answer (if session ended due to failure)
   * @returns {string|null} The correct answer for the failed hurdle, or null
   */
  getFinalHurdleAnswer() {
    return this.finalHurdleAnswer;
  }

  /**
   * Check if the session is active
   * @returns {boolean} True if session is still active, false if ended
   */
  isActive() {
    return this.endTime === null;
  }

  /**
   * Reset the session to initial state
   */
  reset() {
    this.sessionId = this._generateUniqueId();
    this.startTime = new Date();
    this.endTime = null;
    this.currentHurdleNumber = 1;
    this.completedHurdles = [];
    this.totalScore = 0;
    this.endReason = null;
    this.finalHurdleAnswer = null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HurdleSession;
}

// ES6 export for modern bundlers
export default HurdleSession;