/**
 * Tests for GameConfig module
 */

const GameConfig = require('../src/GameConfig');

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('GameConfig', () => {
  let gameConfig;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Ensure localStorage returns null by default (no existing config)
    localStorageMock.getItem.mockReturnValue(null);
    // Reset any module cache to ensure fresh instances
    jest.resetModules();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      // Explicitly ensure localStorage returns null for this test
      localStorageMock.getItem.mockReturnValue(null);
      const config = new GameConfig();
      expect(config.getMaxGuesses()).toBe(4);
      expect(config.getDifficulty()).toBe('medium');
      expect(config.getShowDefinitions()).toBe(true);
      expect(config.getHardMode()).toBe(false);
    });

    it('should load existing configuration from localStorage', () => {
      const existingConfig = {
        maxGuesses: 6,
        difficulty: 'hard',
        showDefinitions: false,
        hardMode: true
      };
      
      // Mock localStorage to return the existing config for this test only
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingConfig));
      
      const config = new GameConfig();
      expect(config.getMaxGuesses()).toBe(6);
      expect(config.getDifficulty()).toBe('hard');
      expect(config.getShowDefinitions()).toBe(false);
      expect(config.getHardMode()).toBe(true);
    });
  });

  describe('maxGuesses configuration', () => {
    beforeEach(() => {
      gameConfig = new GameConfig();
    });

    it('should set valid guess counts', () => {
      [3, 4, 5, 6].forEach(guesses => {
        gameConfig.setMaxGuesses(guesses);
        expect(gameConfig.getMaxGuesses()).toBe(guesses);
      });
    });

    it('should throw error for invalid guess counts', () => {
      [1, 2, 7, 8, 0, -1].forEach(guesses => {
        expect(() => gameConfig.setMaxGuesses(guesses)).toThrow('Max guesses must be 3, 4, 5, or 6');
      });
    });
  });

  describe('difficulty configuration', () => {
    beforeEach(() => {
      gameConfig = new GameConfig();
    });

    it('should set valid difficulty levels', () => {
      ['easy', 'medium', 'hard'].forEach(difficulty => {
        gameConfig.setDifficulty(difficulty);
        expect(gameConfig.getDifficulty()).toBe(difficulty);
      });
    });

    it('should throw error for invalid difficulty levels', () => {
      ['invalid', 'extreme', ''].forEach(difficulty => {
        expect(() => gameConfig.setDifficulty(difficulty)).toThrow('Difficulty must be easy, medium, or hard');
      });
    });

    it('should return correct frequency ranges', () => {
      gameConfig.setDifficulty('easy');
      expect(gameConfig.getFrequencyRange()).toEqual({ min: 5.5, max: 7.0 });

      gameConfig.setDifficulty('medium');
      expect(gameConfig.getFrequencyRange()).toEqual({ min: 4.0, max: 5.49 });

      gameConfig.setDifficulty('hard');
      expect(gameConfig.getFrequencyRange()).toEqual({ min: 0, max: 4.0 });
    });
  });

  describe('showDefinitions configuration', () => {
    beforeEach(() => {
      gameConfig = new GameConfig();
    });

    it('should set show definitions flag', () => {
      gameConfig.setShowDefinitions(true);
      expect(gameConfig.getShowDefinitions()).toBe(true);

      gameConfig.setShowDefinitions(false);
      expect(gameConfig.getShowDefinitions()).toBe(false);
    });

    it('should convert values to boolean', () => {
      gameConfig.setShowDefinitions('true');
      expect(gameConfig.getShowDefinitions()).toBe(true);

      gameConfig.setShowDefinitions(0);
      expect(gameConfig.getShowDefinitions()).toBe(false);

      gameConfig.setShowDefinitions(1);
      expect(gameConfig.getShowDefinitions()).toBe(true);
    });
  });

  describe('hardMode configuration', () => {
    beforeEach(() => {
      gameConfig = new GameConfig();
    });

    it('should set hard mode flag', () => {
      gameConfig.setHardMode(true);
      expect(gameConfig.getHardMode()).toBe(true);
      
      gameConfig.setHardMode(false);
      expect(gameConfig.getHardMode()).toBe(false);
    });

    it('should convert values to boolean', () => {
      gameConfig.setHardMode('true');
      expect(gameConfig.getHardMode()).toBe(true);
      
      gameConfig.setHardMode(0);
      expect(gameConfig.getHardMode()).toBe(false);
      
      gameConfig.setHardMode(1);
      expect(gameConfig.getHardMode()).toBe(true);
    });

    it('should default to false', () => {
      // Create a fresh instance to test default value
      const testConfig = new GameConfig();
      expect(testConfig.getHardMode()).toBe(false);
    });
  });

  describe('persistence', () => {
    beforeEach(() => {
      gameConfig = new GameConfig();
    });

    it('should save configuration to localStorage', () => {
      // Create a fresh instance for this test
      const testConfig = new GameConfig();
      testConfig.setMaxGuesses(5);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'hurdle-game-config',
        JSON.stringify({
          maxGuesses: 5,
          difficulty: 'medium',
          showDefinitions: true,
          hardMode: false
        })
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw error
      expect(() => gameConfig.setMaxGuesses(5)).not.toThrow();
    });
  });

  describe('resetToDefaults', () => {
    beforeEach(() => {
      gameConfig = new GameConfig();
    });

    it('should reset all settings to default values', () => {
      gameConfig.setMaxGuesses(6);
      gameConfig.setDifficulty('hard');
      gameConfig.setShowDefinitions(false);

      gameConfig.resetToDefaults();

      expect(gameConfig.getMaxGuesses()).toBe(4);
      expect(gameConfig.getDifficulty()).toBe('medium');
      expect(gameConfig.getShowDefinitions()).toBe(true);
    });
  });

  describe('getAllSettings', () => {
    beforeEach(() => {
      gameConfig = new GameConfig();
    });

    it('should return complete configuration object', () => {
      const settings = gameConfig.getAllSettings();
      expect(settings).toEqual({
        maxGuesses: 4,
        difficulty: 'medium',
        showDefinitions: true,
        hardMode: false
      });
    });
  });

  describe('getDifficultyDisplayName', () => {
    it('should return correct display names', () => {
      expect(GameConfig.getDifficultyDisplayName('easy')).toBe('Easy (Common Words)');
      expect(GameConfig.getDifficultyDisplayName('medium')).toBe('Medium (Moderate Words)');
      expect(GameConfig.getDifficultyDisplayName('hard')).toBe('Hard (Rare Words)');
      expect(GameConfig.getDifficultyDisplayName('invalid')).toBe('Unknown');
    });
  });
});