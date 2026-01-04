/**
 * Tests for GameController class
 */

const GameController = require('../src/GameController');
const Dictionary = require('../src/Dictionary');

describe('GameController', () => {
  let dictionary;
  let gameController;

  beforeEach(() => {
    // Create a dictionary with test words
    const testWords = ['apple', 'bread', 'crane', 'delta', 'eagle'];
    dictionary = new Dictionary(testWords);
    gameController = new GameController(dictionary);
  });

  describe('constructor', () => {
    test('should create a GameController with a dictionary', () => {
      expect(gameController).toBeDefined();
      expect(gameController.dictionary).toBe(dictionary);
    });

    test('should throw error if dictionary is not provided', () => {
      expect(() => new GameController()).toThrow('Dictionary is required');
    });
  });

  describe('startNewGame', () => {
    test('should start a new game with a valid target word', async () => {
      const gameState = await gameController.startNewGame();
      
      expect(gameState).toBeDefined();
      expect(gameState.getTargetWord()).toHaveLength(5);
      expect(await dictionary.isValidWord(gameState.getTargetWord())).toBe(true);
      expect(gameState.getGuesses()).toHaveLength(0);
      expect(gameState.getRemainingAttempts()).toBe(4);
      expect(gameState.getGameStatus()).toBe('in-progress');
    });

    test('should reset game state when starting a new game', async () => {
      // Start first game and make a guess
      await gameController.startNewGame();
      await gameController.submitGuess('apple');
      
      // Start new game
      const newGameState = await gameController.startNewGame();
      
      expect(newGameState.getGuesses()).toHaveLength(0);
      expect(newGameState.getRemainingAttempts()).toBe(4);
      expect(newGameState.getGameStatus()).toBe('in-progress');
    });
  });

  describe('submitGuess', () => {
    beforeEach(async () => {
      await gameController.startNewGame();
    });

    test('should reject guess if no game has been started', async () => {
      const controller = new GameController(dictionary);
      const result = await controller.submitGuess('apple');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No game in progress. Start a new game first.');
    });

    test('should accept valid 5-letter word from dictionary', async () => {
      const result = await gameController.submitGuess('apple');
      
      expect(result.success).toBe(true);
      expect(result.guess).toBeDefined();
      expect(result.guess.getWord()).toBe('apple');
      expect(result.gameStatus).toBeDefined();
    });

    test('should reject word that is not 5 letters', async () => {
      const result = await gameController.submitGuess('cat');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Word must be exactly 5 letters');
      expect(gameController.getGameState().getGuesses()).toHaveLength(0);
    });

    test('should reject word not in dictionary', async () => {
      const result = await gameController.submitGuess('zzzzz');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not a valid word');
      expect(gameController.getGameState().getGuesses()).toHaveLength(0);
    });

    test('should reject empty string', async () => {
      const result = await gameController.submitGuess('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Word must be exactly 5 letters');
    });

    test('should normalize case when submitting guess', async () => {
      // Start a new game to ensure clean state
      await gameController.startNewGame();
      
      // Get the target word to avoid accidentally winning
      const targetWord = gameController.getGameState().getTargetWord();
      
      // Choose test words that won't accidentally win the game
      const testWords = ['APPLE', 'BREAD', 'CRANE'];
      const safeWords = testWords.filter(word => word.toLowerCase() !== targetWord);
      
      // Test case normalization with the first safe word
      const result1 = await gameController.submitGuess(safeWords[0]);
      expect(result1.success).toBe(true);
      expect(result1.guess.getWord()).toBe(safeWords[0].toLowerCase());
      
      // Test mixed case with the second safe word
      const mixedCaseWord = safeWords[1];
      const result2 = await gameController.submitGuess(mixedCaseWord.charAt(0) + mixedCaseWord.slice(1).toLowerCase());
      expect(result2.success).toBe(true);
      expect(result2.guess.getWord()).toBe(mixedCaseWord.toLowerCase());
    });

    test('should reject guess when game is already over', async () => {
      // Set up a game where we know the target
      const testDict = new Dictionary(['apple']);
      const testController = new GameController(testDict);
      await testController.startNewGame();
      
      // Win the game
      await testController.submitGuess('apple');
      
      // Try to submit another guess
      const result = await testController.submitGuess('apple');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Game is over. Start a new game!');
    });

    test('should update game status to won when correct word is guessed', async () => {
      // Set up a game where we know the target
      const testDict = new Dictionary(['apple']);
      const testController = new GameController(testDict);
      await testController.startNewGame();
      
      const result = await testController.submitGuess('apple');
      
      expect(result.success).toBe(true);
      expect(result.gameStatus).toBe('won');
    });

    test('should decrement remaining attempts on valid guess', async () => {
      const initialAttempts = gameController.getGameState().getRemainingAttempts();
      
      await gameController.submitGuess('apple');
      
      expect(gameController.getGameState().getRemainingAttempts()).toBe(initialAttempts - 1);
    });

    test('should not decrement attempts on invalid guess', async () => {
      const initialAttempts = gameController.getGameState().getRemainingAttempts();
      
      await gameController.submitGuess('zzzzz');
      
      expect(gameController.getGameState().getRemainingAttempts()).toBe(initialAttempts);
    });
  });

  describe('getGameState', () => {
    test('should return null if no game has been started', () => {
      expect(gameController.getGameState()).toBeNull();
    });

    test('should return current game state after game starts', async () => {
      const gameState = await gameController.startNewGame();
      
      expect(gameController.getGameState()).toBe(gameState);
    });

    test('should return updated game state after guesses', async () => {
      await gameController.startNewGame();
      await gameController.submitGuess('apple');
      
      const gameState = gameController.getGameState();
      expect(gameState.getGuesses()).toHaveLength(1);
    });
  });

  describe('Property-Based Tests', () => {
    const fc = require('fast-check');

    /**
     * Feature: hard-wordle, Property 3: State isolation between games
     * Validates: Requirements 1.4
     * 
     * For any game state with previous guesses, starting a new game must result 
     * in a fresh state with no previous guesses and a different target word.
     */
    test('Property 3: State isolation between games - new games have fresh state', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of valid dictionary words for testing
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 10, maxLength: 20 }
          ),
          // Generate number of guesses to make in first game (1-5)
          fc.integer({ min: 1, max: 5 }),
          async (words, numGuesses) => {
            fc.pre(words.length >= 10);
            
            const testDict = new Dictionary(words);
            const controller = new GameController(testDict);
            
            // Start first game and make some guesses
            const firstGameState = await controller.startNewGame();
            const firstTargetWord = firstGameState.getTargetWord();
            
            for (let i = 0; i < numGuesses && i < words.length; i++) {
              // Make sure we don't win the game
              if (words[i] !== firstTargetWord && controller.getGameState().getGameStatus() === 'in-progress') {
                await controller.submitGuess(words[i]);
              }
            }
            
            const firstGameGuessCount = controller.getGameState().getGuesses().length;
            
            // Start a new game
            const secondGameState = await controller.startNewGame();
            const secondTargetWord = secondGameState.getTargetWord();
            
            // New game must have zero guesses
            expect(secondGameState.getGuesses()).toHaveLength(0);
            
            // New game must have full attempts
            expect(secondGameState.getRemainingAttempts()).toBe(4);
            
            // New game must be in-progress
            expect(secondGameState.getGameStatus()).toBe('in-progress');
            
            // Target word should be valid (5 letters and in dictionary)
            expect(secondTargetWord).toHaveLength(5);
            expect(testDict.isValidWordSync(secondTargetWord)).toBe(true);
            
            // Note: We can't guarantee different target words due to randomness,
            // but we can verify state isolation regardless
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: hard-wordle, Property 4: Length validation
     * Validates: Requirements 2.1
     * 
     * For any string input, the system must accept it as a valid guess 
     * only if it is exactly 5 characters long.
     */
    test('Property 4: Length validation - only 5-letter strings are accepted', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate strings of various lengths
          fc.string({ minLength: 0, maxLength: 10 }),
          async (input) => {
            const testDict = new Dictionary(['apple', 'bread', 'crane', 'delta', 'eagle']);
            const controller = new GameController(testDict);
            await controller.startNewGame();
            
            const result = await controller.submitGuess(input);
            
            // If the input is not exactly 5 letters, it must be rejected
            if (input.length !== 5) {
              expect(result.success).toBe(false);
              expect(result.error).toBe('Word must be exactly 5 letters');
              
              // Game state should not change
              expect(controller.getGameState().getGuesses()).toHaveLength(0);
              expect(controller.getGameState().getRemainingAttempts()).toBe(4);
            }
            // If it is 5 letters, validation depends on dictionary
            else {
              // We just verify that length validation passed
              // (it may still fail dictionary validation)
              if (!result.success && result.error) {
                expect(result.error).not.toBe('Word must be exactly 5 letters');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: hard-wordle, Property 6: Invalid guess preservation
     * Validates: Requirements 2.3
     * 
     * For any invalid guess (wrong length or not in dictionary), submitting it 
     * must not change the number of remaining attempts or add it to the guess history.
     */
    test('Property 6: Invalid guess preservation - invalid guesses do not affect game state', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a valid dictionary
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 5, maxLength: 20 }
          ),
          // Generate an invalid guess (either wrong length or not in dictionary)
          fc.oneof(
            // Wrong length strings
            fc.string({ minLength: 0, maxLength: 4 }),
            fc.string({ minLength: 6, maxLength: 10 }),
            // 5-letter string that's unlikely to be in dictionary
            fc.constant('zzzzz')
          ),
          async (words, invalidGuess) => {
            fc.pre(words.length >= 5);
            
            const testDict = new Dictionary(words);
            const controller = new GameController(testDict);
            await controller.startNewGame();
            
            // Record initial state
            const initialGuessCount = controller.getGameState().getGuesses().length;
            const initialRemainingAttempts = controller.getGameState().getRemainingAttempts();
            const initialStatus = controller.getGameState().getGameStatus();
            
            // Submit invalid guess
            const result = await controller.submitGuess(invalidGuess);
            
            // Verify it was rejected
            expect(result.success).toBe(false);
            
            // Verify game state unchanged
            expect(controller.getGameState().getGuesses()).toHaveLength(initialGuessCount);
            expect(controller.getGameState().getRemainingAttempts()).toBe(initialRemainingAttempts);
            expect(controller.getGameState().getGameStatus()).toBe(initialStatus);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: hard-wordle, Property 8: Case normalization
     * Validates: Requirements 2.5
     * 
     * For any valid word, submitting it in different cases (uppercase, lowercase, mixed) 
     * must produce identical feedback results.
     */
    test('Property 8: Case normalization - case variations produce identical feedback', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a dictionary with known words
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 5, maxLength: 20 }
          ),
          async (words) => {
            fc.pre(words.length >= 5);
            
            const testDict = new Dictionary(words);
            
            // Pick a word from the dictionary to use as guess
            const guessWord = words[Math.floor(Math.random() * words.length)];
            
            // Create three controllers with the same target word
            const targetWord = words[0];
            
            // Test lowercase
            const controller1 = new GameController(testDict);
            controller1.gameState = new (require('../src/GameState'))(targetWord, 4);
            const result1 = await controller1.submitGuess(guessWord.toLowerCase());
            
            // Test uppercase
            const controller2 = new GameController(testDict);
            controller2.gameState = new (require('../src/GameState'))(targetWord, 4);
            const result2 = await controller2.submitGuess(guessWord.toUpperCase());
            
            // Test mixed case
            const mixedCase = guessWord.split('').map((c, i) => 
              i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
            ).join('');
            const controller3 = new GameController(testDict);
            controller3.gameState = new (require('../src/GameState'))(targetWord, 4);
            const result3 = await controller3.submitGuess(mixedCase);
            
            // All should succeed
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            expect(result3.success).toBe(true);
            
            // All should produce identical feedback
            const feedback1 = result1.guess.getFeedback();
            const feedback2 = result2.guess.getFeedback();
            const feedback3 = result3.guess.getFeedback();
            
            expect(feedback1).toEqual(feedback2);
            expect(feedback1).toEqual(feedback3);
            
            // All normalized words should be lowercase
            expect(result1.guess.getWord()).toBe(guessWord.toLowerCase());
            expect(result2.guess.getWord()).toBe(guessWord.toLowerCase());
            expect(result3.guess.getWord()).toBe(guessWord.toLowerCase());
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: hard-wordle, Property 12: Win condition
     * Validates: Requirements 5.1
     * 
     * For any game state where a guess exactly matches the target word, 
     * the game status must be 'won' and no further guesses must be accepted.
     */
    test('Property 12: Win condition - matching target word wins the game', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a dictionary
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 5, maxLength: 20 }
          ),
          async (words) => {
            fc.pre(words.length >= 5);
            
            const testDict = new Dictionary(words);
            const controller = new GameController(testDict);
            
            // Start a game
            const gameState = await controller.startNewGame();
            const targetWord = gameState.getTargetWord();
            
            // Submit the target word as a guess
            const result = await controller.submitGuess(targetWord);
            
            // The guess must succeed
            expect(result.success).toBe(true);
            
            // The game status must be 'won'
            expect(result.gameStatus).toBe('won');
            expect(controller.getGameState().getGameStatus()).toBe('won');
            expect(controller.getGameState().isGameOver()).toBe(true);
            
            // Try to submit another guess
            const anotherWord = words.find(w => w !== targetWord) || 'apple';
            const result2 = await controller.submitGuess(anotherWord);
            
            // The second guess must be rejected
            expect(result2.success).toBe(false);
            expect(result2.error).toBe('Game is over. Start a new game!');
            
            // Game state should still have only one guess
            expect(controller.getGameState().getGuesses()).toHaveLength(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: hard-wordle, Property 13: Loss condition
     * Validates: Requirements 5.2
     * 
     * For any game state where six guesses have been made without matching 
     * the target word, the game status must be 'lost'.
     */
    test('Property 13: Loss condition - four wrong guesses loses the game', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a dictionary with at least 5 words
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 5, maxLength: 20 }
          ),
          async (words) => {
            fc.pre(words.length >= 5);
            
            const testDict = new Dictionary(words);
            const controller = new GameController(testDict);
            
            // Start a game
            const gameState = await controller.startNewGame();
            const targetWord = gameState.getTargetWord();
            
            // Get 4 words that are not the target
            const wrongWords = words.filter(w => w !== targetWord).slice(0, 4);
            
            // Need at least 4 wrong words
            fc.pre(wrongWords.length >= 4);
            
            // Submit 4 wrong guesses
            for (let i = 0; i < 4; i++) {
              const result = await controller.submitGuess(wrongWords[i]);
              
              // Each guess should succeed (valid word)
              expect(result.success).toBe(true);
              
              // Check status after each guess
              if (i < 3) {
                // Game should still be in progress
                expect(result.gameStatus).toBe('in-progress');
              } else {
                // After 4th guess, game should be lost
                expect(result.gameStatus).toBe('lost');
              }
            }
            
            // Final verification
            expect(controller.getGameState().getGameStatus()).toBe('lost');
            expect(controller.getGameState().isGameOver()).toBe(true);
            expect(controller.getGameState().getGuesses()).toHaveLength(4);
            expect(controller.getGameState().getRemainingAttempts()).toBe(0);
            
            // Try to submit another guess
            const result = await controller.submitGuess(wrongWords[0]);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Game is over. Start a new game!');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: hard-wordle, Property 14: Game status accuracy
     * Validates: Requirements 5.3
     * 
     * For any game state, the game status must accurately reflect whether 
     * the game is 'in-progress', 'won', or 'lost' based on the guesses and target word.
     */
    test('Property 14: Game status accuracy - status reflects game state correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a dictionary
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 5, maxLength: 20 }
          ),
          // Generate number of guesses to make (0-4)
          fc.integer({ min: 0, max: 4 }),
          // Generate whether to win the game
          fc.boolean(),
          async (words, numGuesses, shouldWin) => {
            fc.pre(words.length >= 5);
            
            const testDict = new Dictionary(words);
            const controller = new GameController(testDict);
            
            // Start a game
            const gameState = await controller.startNewGame();
            const targetWord = gameState.getTargetWord();
            
            // Get words for guessing
            const wrongWords = words.filter(w => w !== targetWord);
            
            let actualGuesses = 0;
            let wonGame = false;
            
            // Make guesses
            for (let i = 0; i < numGuesses && actualGuesses < 4; i++) {
              if (shouldWin && i === numGuesses - 1) {
                // Win on the last guess
                await controller.submitGuess(targetWord);
                wonGame = true;
                actualGuesses++;
                break;
              } else if (wrongWords[i]) {
                // Make a wrong guess
                await controller.submitGuess(wrongWords[i]);
                actualGuesses++;
              }
            }
            
            // Verify status accuracy
            const finalStatus = controller.getGameState().getGameStatus();
            
            if (wonGame) {
              // If we guessed the target word, status must be 'won'
              expect(finalStatus).toBe('won');
              expect(controller.getGameState().isGameOver()).toBe(true);
            } else if (actualGuesses >= 4) {
              // If we made 4 guesses without winning, status must be 'lost'
              expect(finalStatus).toBe('lost');
              expect(controller.getGameState().isGameOver()).toBe(true);
            } else {
              // Otherwise, status must be 'in-progress'
              expect(finalStatus).toBe('in-progress');
              expect(controller.getGameState().isGameOver()).toBe(false);
            }
            
            // Verify guess count matches
            expect(controller.getGameState().getGuesses()).toHaveLength(actualGuesses);
            
            // Verify remaining attempts
            expect(controller.getGameState().getRemainingAttempts()).toBe(4 - actualGuesses);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
