/**
 * GameConfig module for Hurdle
 * Manages user configuration settings for the game
 */

class GameConfig {
  constructor() {
    this.instanceId = Math.random().toString(36).substr(2, 9);
    this.storageKey = 'hurdle-game-config';
    this.defaultConfig = {
      maxGuesses: 4,
      difficulty: 'medium', // easy, medium, hard
      showDefinitions: true,
      hardMode: false
    };
    
    console.log(`GameConfig constructor [${this.instanceId}] - default config:`, this.defaultConfig);
    
    // Load existing config or use defaults
    this.config = this.loadConfig();
    
    console.log(`GameConfig constructor [${this.instanceId}] - loaded config:`, this.config);
  }

  /**
   * Load configuration from localStorage
   * @returns {Object} Configuration object
   */
  loadConfig() {
    console.log('Loading config from localStorage...');
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        console.log('Raw localStorage value:', stored);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('Parsed localStorage config:', parsed);
          
          // Merge with defaults to ensure all properties exist
          const merged = { ...this.defaultConfig, ...parsed };
          console.log('Merged config (defaults + stored):', merged);
          return merged;
        } else {
          console.log('No stored config found, using defaults');
        }
      } else {
        console.log('localStorage not available');
      }
    } catch (error) {
      console.warn('Failed to load game config from localStorage:', error);
    }
    
    console.log('Returning default config:', this.defaultConfig);
    return { ...this.defaultConfig };
  }

  /**
   * Save configuration to localStorage
   */
  saveConfig() {
    console.log('Saving config to localStorage:', this.config);
    try {
      if (typeof localStorage !== 'undefined') {
        const jsonString = JSON.stringify(this.config);
        console.log('JSON string to save:', jsonString);
        localStorage.setItem(this.storageKey, jsonString);
        
        // Verify it was saved
        const verification = localStorage.getItem(this.storageKey);
        console.log('Verification - saved value:', verification);
      } else {
        console.warn('localStorage not available for saving');
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
    const hardMode = this.config.hardMode;
    console.log(`[${this.instanceId}] Getting hard mode: ${hardMode}`);
    return hardMode;
  }

  /**
   * Set whether hard mode is enabled
   * @param {boolean} enabled - Whether to enable hard mode
   */
  setHardMode(enabled) {
    console.log(`[${this.instanceId}] Setting hard mode to: ${enabled}`);
    this.config.hardMode = Boolean(enabled);
    this.saveConfig();
    console.log(`[${this.instanceId}] Hard mode after save: ${this.config.hardMode}`);
    
    // Verify it was saved to localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        const parsed = JSON.parse(stored);
        console.log(`[${this.instanceId}] Hard mode in localStorage: ${parsed.hardMode}`);
      }
    } catch (error) {
      console.warn('Failed to verify localStorage save:', error);
    }
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
    console.log(`[${this.instanceId}] Resetting to defaults`);
    this.config = { ...this.defaultConfig };
    this.saveConfig();
    console.log(`[${this.instanceId}] Config after reset:`, this.config);
  }

  /**
   * Clear localStorage (for debugging)
   */
  clearStorage() {
    console.log(`[${this.instanceId}] Clearing localStorage`);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.storageKey);
        console.log(`[${this.instanceId}] localStorage cleared`);
      }
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
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