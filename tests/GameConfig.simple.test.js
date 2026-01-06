/**
 * Simple tests for GameConfig module (without localStorage mocking)
 */

const GameConfig = require('../src/GameConfig');

describe('GameConfig Core Functionality', () => {
  let gameConfig;

  beforeEach(() => {
    gameConfig = new GameConfig();
  });

  describe('maxGuesses configuration', () => {
    it('should set and get valid guess counts', () => {
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
    it('should set and get valid difficulty levels', () => {
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
    it('should set and get show definitions flag', () => {
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

  describe('getAllSettings', () => {
    it('should return complete configuration object', () => {
      const settings = gameConfig.getAllSettings();
      expect(settings).toHaveProperty('maxGuesses');
      expect(settings).toHaveProperty('difficulty');
      expect(settings).toHaveProperty('showDefinitions');
    });
  });

  describe('resetToDefaults', () => {
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

  describe('getDifficultyDisplayName', () => {
    it('should return correct display names', () => {
      expect(GameConfig.getDifficultyDisplayName('easy')).toBe('Easy (Common Words)');
      expect(GameConfig.getDifficultyDisplayName('medium')).toBe('Medium (Moderate Words)');
      expect(GameConfig.getDifficultyDisplayName('hard')).toBe('Hard (Rare Words)');
      expect(GameConfig.getDifficultyDisplayName('invalid')).toBe('Unknown');
    });
  });
});