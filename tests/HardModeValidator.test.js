/**
 * Tests for HardModeValidator
 */

const HardModeValidator = require('../src/HardModeValidator');

describe('HardModeValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new HardModeValidator();
  });

  describe('updateFromFeedback', () => {
    test('should track correct positions', () => {
      const feedback = [
        { letter: 'c', status: 'correct' },
        { letter: 'r', status: 'present' },
        { letter: 'a', status: 'correct' },
        { letter: 'n', status: 'absent' },
        { letter: 'e', status: 'absent' }
      ];

      validator.updateFromFeedback('crane', feedback);

      const constraints = validator.getConstraints();
      expect(constraints.correctPositions).toEqual({ 0: 'c', 2: 'a' });
      expect(constraints.includedLetters).toContain('c');
      expect(constraints.includedLetters).toContain('r');
      expect(constraints.includedLetters).toContain('a');
      expect(constraints.excludedLetters).toContain('n');
      expect(constraints.excludedLetters).toContain('e');
    });

    test('should not exclude letters that are known to be included', () => {
      // First guess: R is present (yellow)
      validator.updateFromFeedback('crane', [
        { letter: 'c', status: 'absent' },
        { letter: 'r', status: 'present' },
        { letter: 'a', status: 'absent' },
        { letter: 'n', status: 'absent' },
        { letter: 'e', status: 'absent' }
      ]);

      // Second guess: R is absent in this position but we know it's in the word
      validator.updateFromFeedback('storm', [
        { letter: 's', status: 'absent' },
        { letter: 't', status: 'absent' },
        { letter: 'o', status: 'absent' },
        { letter: 'r', status: 'absent' },
        { letter: 'm', status: 'absent' }
      ]);

      const constraints = validator.getConstraints();
      expect(constraints.includedLetters).toContain('r');
      expect(constraints.excludedLetters).not.toContain('r');
    });
  });

  describe('validateGuess', () => {
    test('should require correct letters in correct positions', () => {
      // Setup: C is correct in position 0, A is correct in position 2
      validator.updateFromFeedback('crane', [
        { letter: 'c', status: 'correct' },
        { letter: 'r', status: 'present' },
        { letter: 'a', status: 'correct' },
        { letter: 'n', status: 'absent' },
        { letter: 'e', status: 'absent' }
      ]);

      // Valid guess: maintains correct positions and includes R
      const validResult = validator.validateGuess('chart');
      expect(validResult.isValid).toBe(true);

      // Invalid guess: wrong letter in position 0
      const invalidResult1 = validator.validateGuess('smart');
      expect(invalidResult1.isValid).toBe(false);
      expect(invalidResult1.error).toContain('1st letter must be C');

      // Invalid guess: wrong letter in position 2
      const invalidResult2 = validator.validateGuess('crest');
      expect(invalidResult2.isValid).toBe(false);
      expect(invalidResult2.error).toContain('3rd letter must be A');
    });

    test('should require included letters to be present', () => {
      // Setup: R is in the word but not in position 1
      validator.updateFromFeedback('crane', [
        { letter: 'c', status: 'absent' },
        { letter: 'r', status: 'present' },
        { letter: 'a', status: 'absent' },
        { letter: 'n', status: 'absent' },
        { letter: 'e', status: 'absent' }
      ]);

      // Valid guess: includes R
      const validResult = validator.validateGuess('storm');
      expect(validResult.isValid).toBe(true);

      // Invalid guess: doesn't include R
      const invalidResult = validator.validateGuess('light');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('Guess must contain R');
    });

    test('should handle multiple constraints', () => {
      // Setup: C correct in pos 0, R present somewhere, A correct in pos 2
      validator.updateFromFeedback('crane', [
        { letter: 'c', status: 'correct' },
        { letter: 'r', status: 'present' },
        { letter: 'a', status: 'correct' },
        { letter: 'n', status: 'absent' },
        { letter: 'e', status: 'absent' }
      ]);

      // Valid guess: C in pos 0, A in pos 2, R included
      const validResult = validator.validateGuess('chart');
      expect(validResult.isValid).toBe(true);

      // Invalid: missing R
      const invalidResult1 = validator.validateGuess('clamp');
      expect(invalidResult1.isValid).toBe(false);
      expect(invalidResult1.error).toContain('Guess must contain R');

      // Invalid: wrong position for C
      const invalidResult2 = validator.validateGuess('sharp');
      expect(invalidResult2.isValid).toBe(false);
      expect(invalidResult2.error).toContain('1st letter must be C');
    });
  });

  describe('getOrdinalSuffix', () => {
    test('should return correct ordinal suffixes', () => {
      expect(validator.getOrdinalSuffix(1)).toBe('st');
      expect(validator.getOrdinalSuffix(2)).toBe('nd');
      expect(validator.getOrdinalSuffix(3)).toBe('rd');
      expect(validator.getOrdinalSuffix(4)).toBe('th');
      expect(validator.getOrdinalSuffix(11)).toBe('th');
      expect(validator.getOrdinalSuffix(12)).toBe('th');
      expect(validator.getOrdinalSuffix(13)).toBe('th');
      expect(validator.getOrdinalSuffix(21)).toBe('st');
      expect(validator.getOrdinalSuffix(22)).toBe('nd');
      expect(validator.getOrdinalSuffix(23)).toBe('rd');
    });
  });

  describe('reset', () => {
    test('should clear all constraints', () => {
      // Setup some constraints
      validator.updateFromFeedback('crane', [
        { letter: 'c', status: 'correct' },
        { letter: 'r', status: 'present' },
        { letter: 'a', status: 'correct' },
        { letter: 'n', status: 'absent' },
        { letter: 'e', status: 'absent' }
      ]);

      // Verify constraints exist
      let constraints = validator.getConstraints();
      expect(Object.keys(constraints.correctPositions)).toHaveLength(2);
      expect(constraints.includedLetters).toHaveLength(3);
      expect(constraints.excludedLetters).toHaveLength(2);

      // Reset and verify constraints are cleared
      validator.reset();
      constraints = validator.getConstraints();
      expect(Object.keys(constraints.correctPositions)).toHaveLength(0);
      expect(constraints.includedLetters).toHaveLength(0);
      expect(constraints.excludedLetters).toHaveLength(0);
    });
  });
});