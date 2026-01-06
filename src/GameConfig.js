/**
 * GameConfig module for Hurdle
 * Manages user configuration settings for the game
 */

class GameConfig {
  constructor() {
    this.storageKey = 'hurdle-game-config';
    this.defaultConfig = {
      maxGuesses: 4,
      difficulty: 'medium', // easy, medium, hard
      showDefinitions: true,
      hardMode: false
    };
    
    // Load existing config or use defaults
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from localStorage
   * @returns {Object} Configuration object
   */
  loadConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Merge with defaults to ensure all properties exist
          return { ...this.defaultConfig, ...parsed };
        }
      }
    } catch (error) {
      console.warn('Failed to load game config from localStorage:', error);
    }
    
    return { ...this.defaultConfig };
  }

  /**
   * Save configuration to localStorage
   */
  saveConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.config));
      }
    } catch (error) {
      console.warn('Failed to save game config to localStorage:', error);
    }
  }

  /**
   * Get the maximum number of guesses allowed
   * @returns {number} Number of guesses (3, 4, 5, or 6)
   */
  getMaxGuesses() {
    return this.config.maxGuesses;
  }

  /**
   * Set the maximum number of guesses allowed
   * @param {number} guesses - Number of guesses (3, 4, 5, or 6)
   */
  setMaxGuesses(guesses) {
    if ([3, 4, 5, 6].includes(guesses)) {
      this.config.maxGuesses = guesses;
      this.saveConfig();
    } else {
      throw new Error('Max guesses must be 3, 4, 5, or 6');
    }
  }

  /**
   * Get the difficulty level
   * @returns {string} Difficulty level ('easy', 'medium', 'hard')
   */
  getDifficulty() {
    return this.config.difficulty;
  }

  /**
   * Set the difficulty level
   * @param {string} difficulty - Difficulty level ('easy', 'medium', 'hard')
   */
  setDifficulty(difficulty) {
    if (['easy', 'medium', 'hard'].includes(difficulty)) {
      this.config.difficulty = difficulty;
      this.saveConfig();
    } else {
      throw new Error('Difficulty must be easy, medium, or hard');
    }
  }

  /**
   * Get frequency range for WordsAPI based on difficulty
   * @returns {Object} Object with min and max frequency values
   */
  getFrequencyRange() {
    switch (this.config.difficulty) {
      case 'easy':
        return { min: 5.5, max: 7.0 };
      case 'medium':
        return { min: 4.0, max: 5.49 };
      case 'hard':
        return { min: 0, max: 4.0 };
      default:
        return { min: 4.0, max: 5.49 }; // Default to medium
    }
  }

  /**
   * Get whether to show word definitions
   * @returns {boolean} True if definitions should be shown
   */
  getShowDefinitions() {
    return this.config.showDefinitions;
  }

  /**
   * Set whether to show word definitions
   * @param {boolean} show - Whether to show definitions
   */
  setShowDefinitions(show) {
    this.config.showDefinitions = Boolean(show);
    this.saveConfig();
  }

  /**
   * Get whether hard mode is enabled
   * @returns {boolean} True if hard mode is enabled
   */
  getHardMode() {
    return this.config.hardMode;
  }

  /**
   * Set whether hard mode is enabled
   * @param {boolean} enabled - Whether to enable hard mode
   */
  setHardMode(enabled) {
    this.config.hardMode = Boolean(enabled);
    this.saveConfig();
  }

  /**
   * Get all configuration settings
   * @returns {Object} Complete configuration object
   */
  getAllSettings() {
    return { ...this.config };
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults() {
    this.config = { ...this.defaultConfig };
    this.saveConfig();
  }

  /**
   * Get difficulty display name
   * @param {string} difficulty - Difficulty level
   * @returns {string} Display name for difficulty
   */
  static getDifficultyDisplayName(difficulty) {
    switch (difficulty) {
      case 'easy':
        return 'Easy (Common Words)';
      case 'medium':
        return 'Medium (Moderate Words)';
      case 'hard':
        return 'Hard (Rare Words)';
      default:
        return 'Unknown';
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameConfig;
}

export default GameConfig;