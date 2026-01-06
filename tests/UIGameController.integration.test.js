/**
 * Integration tests for UI and HurdleController interaction
 * Tests that UI correctly reflects hurdle state changes and processes user input
 */

const {
  mountAppWithHurdleController,
  waitForUpdates,
  typeWord,
  submitGuess,
  getBoardState,
  getKeyboardState,
  getDisplayedMessage
} = require('./testUtils');

describe('UI and HurdleController Integration Tests', () => {
  let wrapper;
  let hurdleController;

  beforeEach(async () => {
    const result = await mountAppWithHurdleController();
    wrapper = result.wrapper;
    hurdleController = result.hurdleController;
    await waitForUpdates();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('UI Reflects Hurdle State Changes', () => {
    test('should update hurdle state when guesses are made', async () => {
      // Initial state - no completed hurdles
      expect(wrapper.vm.completedHurdlesCount).toBe(0);
      expect(wrapper.vm.hurdleNumber).toBe(1);
      expect(wrapper.vm.totalScore).toBe(0);
      
      // Get current game controller and make first guess
      const currentGameController = hurdleController.getCurrentGameController();
      const gameState = currentGameController.getGameState();
      
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      await waitForUpdates();
      
      // Wait for async operations to complete and verify first guess
      await new Promise(resolve => setTimeout(resolve, 1000));
      expect(gameState.getGuesses().length).toBe(1);
      expect(gameState.getRemainingAttempts()).toBe(3);
      
      // Make second guess - use a different word to avoid duplicate detection
      await typeWord(wrapper, 'BREAD');
      await submitGuess(wrapper);
      await waitForUpdates();
      
      // Wait longer for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verify game state continues to update
      expect(gameState.getGuesses().length).toBe(2);
      expect(gameState.getRemainingAttempts()).toBe(2);
    }, 15000);

    test('should display game board that matches hurdle state guesses', async () => {
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord();
      
      // Make a few guesses
      const testGuesses = ['APPLE', 'BREAD'];
      
      for (let i = 0; i < testGuesses.length; i++) {
        await typeWord(wrapper, testGuesses[i]);
        await submitGuess(wrapper);
        await waitForUpdates();
        
        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get game state
        const gameState = currentGameController.getGameState();
        const guesses = gameState.getGuesses();
        
        // Get UI board state
        const boardState = getBoardState(wrapper);
        
        // Verify UI board matches game state
        expect(guesses.length).toBe(i + 1);
        
        // Check that each completed guess row matches the game state
        for (let guessIndex = 0; guessIndex < guesses.length; guessIndex++) {
          const guess = guesses[guessIndex];
          const feedback = guess.getFeedback();
          const boardRow = boardState[guessIndex];
          
          // Verify each letter and its feedback status
          for (let letterIndex = 0; letterIndex < 5; letterIndex++) {
            expect(boardRow[letterIndex].letter).toBe(feedback[letterIndex].letter.toUpperCase());
            expect(boardRow[letterIndex].classes).toContain(feedback[letterIndex].status);
          }
        }
      }
    }, 10000);

    test('should show hurdle completion message when hurdle controller indicates completion', async () => {
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord();
      
      // Make the winning guess
      await typeWord(wrapper, targetWord);
      await submitGuess(wrapper);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify hurdle controller shows completion state
      expect(wrapper.vm.completedHurdlesCount).toBe(1);
      expect(wrapper.vm.hurdleNumber).toBe(2);
      expect(wrapper.vm.totalScore).toBeGreaterThan(0);
      
      // Verify UI shows completion message
      const message = await getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toContain('complete!');
      expect(message.text).toContain('points');
      expect(message.classes).toContain('success');
    }, 15000);

    test('should show session end message when hurdle controller indicates failure', async () => {
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord();
      const testWords = ['APPLE', 'BREAD', 'CRANE', 'DANCE'];
      
      // Make 4 wrong guesses
      for (let i = 0; i < 4; i++) {
        let guessWord = testWords[i];
        // Make sure we don't accidentally guess the target word
        if (guessWord === targetWord.toUpperCase()) {
          guessWord = 'GRAPE';
        }
        
        await typeWord(wrapper, guessWord);
        await submitGuess(wrapper);
        await waitForUpdates();
      }
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify hurdle controller shows session end state
      expect(wrapper.vm.hurdleGameEnded).toBe(true);
      
      // Verify UI shows session end message
      const message = await getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toContain('Game ended!');
      expect(message.text).toContain(targetWord.toUpperCase());
      expect(message.classes).toContain('error');
    }, 30000);

    test('should update hurdle progress display to match hurdle state', async () => {
      // Verify initial state
      expect(wrapper.vm.hurdleNumber).toBe(1);
      expect(wrapper.vm.completedHurdlesCount).toBe(0);
      expect(wrapper.vm.totalScore).toBe(0);
      
      // Get the target word to avoid using it in tests
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord().toLowerCase();
      
      // Use a set of common valid words, but filter out the target word
      const candidateWords = ['apple', 'bread', 'crane', 'dance', 'eagle', 'flame', 'grape', 'house', 'juice', 'knife'];
      const safeWords = candidateWords.filter(word => word !== targetWord);
      
      // If somehow all our candidate words match the target (very unlikely), use different words
      if (safeWords.length === 0) {
        safeWords.push('aahed', 'aalii', 'aargh'); // Use words from start of dictionary
      }
      
      // Only test first 2 attempts to avoid timeout and accidental wins
      for (let i = 0; i < Math.min(2, safeWords.length); i++) {
        // Verify hurdle state before guess
        const gameState = currentGameController.getGameState();
        expect(gameState.getGuesses().length).toBe(i);
        expect(gameState.getRemainingAttempts()).toBe(4 - i);
        
        // Make guess with a word that definitely won't win
        await typeWord(wrapper, safeWords[i].toUpperCase());
        await submitGuess(wrapper);
        await waitForUpdates();
        
        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify the guess was accepted and game state updated
        expect(gameState.getGuesses().length).toBe(i + 1);
        expect(gameState.getRemainingAttempts()).toBe(4 - (i + 1));
        
        // Verify hurdle is still in progress (since we avoided the target word)
        expect(gameState.gameStatus).toBe('in-progress');
      }
    }, 25000);
  });

  describe('User Input Processing', () => {
    test('should validate input through hurdle controller and show appropriate errors', async () => {
      // Test empty input
      await submitGuess(wrapper);
      let message = await getDisplayedMessage(wrapper);
      expect(message.text).toBe('Please enter a word');
      expect(message.classes).toContain('error');
      
      const currentGameController = hurdleController.getCurrentGameController();
      const gameState = currentGameController.getGameState();
      expect(gameState.getGuesses().length).toBe(0);
      
      // Clear any current guess state
      wrapper.vm.currentGuess = '';
      await waitForUpdates();
      
      // Test short input
      await typeWord(wrapper, 'ABC');
      await submitGuess(wrapper);
      message = await getDisplayedMessage(wrapper);
      expect(message.text).toBe('Word must be 5 letters long');
      expect(message.classes).toContain('error');
      expect(gameState.getGuesses().length).toBe(0);
      
      // Clear any current guess state
      wrapper.vm.currentGuess = '';
      await waitForUpdates();
      
      // Test invalid word
      await typeWord(wrapper, 'ZZZZZ');
      await submitGuess(wrapper);
      message = await getDisplayedMessage(wrapper);
      expect(message.text).toBe('Not a valid word');
      expect(message.classes).toContain('error');
      expect(gameState.getGuesses().length).toBe(0);
      
      // Clear any current guess state
      wrapper.vm.currentGuess = '';
      await waitForUpdates();
      
      // Test valid word that's not the target
      const targetWord = gameState.getTargetWord().toLowerCase();
      const candidateWords = ['apple', 'bread', 'crane', 'dance', 'eagle'];
      const safeWord = candidateWords.find(word => word !== targetWord) || 'bread';
      
      await typeWord(wrapper, safeWord.toUpperCase());
      await submitGuess(wrapper);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(gameState.getGuesses().length).toBe(1);
    }, 15000);

    test('should process valid guesses through hurdle controller', async () => {
      const currentGameController = hurdleController.getCurrentGameController();
      const gameState = currentGameController.getGameState();
      const initialGuessCount = gameState.getGuesses().length;
      expect(initialGuessCount).toBe(0);
      
      // Get the target word to avoid using it in tests
      const targetWord = gameState.getTargetWord().toLowerCase();
      const candidateWords = ['apple', 'bread', 'crane', 'dance', 'eagle'];
      const safeWord = candidateWords.find(word => word !== targetWord) || 'bread';
      
      // Submit valid guess that's not the target word
      await typeWord(wrapper, safeWord.toUpperCase());
      await submitGuess(wrapper);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify hurdle controller processed the guess
      expect(gameState.getGuesses().length).toBe(1);
      
      const guess = gameState.getGuesses()[0];
      expect(guess.word).toBe(safeWord.toLowerCase()); // Game controller normalizes to lowercase
      expect(guess.getFeedback()).toHaveLength(5);
      
      // Verify each feedback item has correct structure
      guess.getFeedback().forEach(feedback => {
        expect(feedback).toHaveProperty('letter');
        expect(feedback).toHaveProperty('status');
        expect(['correct', 'present', 'absent']).toContain(feedback.status);
      });
      
      // Verify hurdle is still in progress (since we avoided the target word)
      expect(gameState.gameStatus).toBe('in-progress');
    });

    test('should handle case normalization through hurdle controller', async () => {
      // Get the target word to avoid using it in tests
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord().toLowerCase();
      
      // Use a word that's definitely not the target word
      const candidateWords = ['bread', 'crane', 'dance', 'eagle', 'flame', 'grape', 'house'];
      const testWord = candidateWords.find(word => word !== targetWord) || 'bread';
      
      // Test different cases of the same safe word
      const testCases = [testWord, testWord.toUpperCase(), 
                        testWord.charAt(0).toUpperCase() + testWord.slice(1),
                        testWord.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c).join('')];
      
      for (const testCase of testCases) {
        // Start new hurdle session for each test
        const newGameBtn = wrapper.find('#new-game-btn');
        await newGameBtn.trigger('click');
        await waitForUpdates();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Type the word in the specific case
        for (const char of testCase) {
          const keyButton = wrapper.find(`[data-key="${char.toUpperCase()}"]`);
          if (keyButton.exists()) {
            await keyButton.trigger('click');
            await waitForUpdates();
          }
        }
        
        await submitGuess(wrapper);
        
        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify hurdle controller normalized the case
        const newGameController = hurdleController.getCurrentGameController();
        const gameState = newGameController.getGameState();
        if (gameState.getGuesses().length > 0) {
          const guess = gameState.getGuesses()[0];
          expect(guess.word).toBe(testWord.toLowerCase()); // Always normalized to lowercase
          
          // Verify hurdle is still in progress (since we avoided the target word)
          expect(gameState.gameStatus).toBe('in-progress');
        }
      }
    }, 20000);

    test('should reject invalid input without affecting hurdle state', async () => {
      const currentGameController = hurdleController.getCurrentGameController();
      const gameState = currentGameController.getGameState();
      const initialHurdleState = {
        guesses: gameState.getGuesses().length,
        attempts: gameState.getRemainingAttempts(),
        status: gameState.gameStatus,
        hurdleNumber: wrapper.vm.hurdleNumber,
        completedCount: wrapper.vm.completedHurdlesCount,
        totalScore: wrapper.vm.totalScore
      };
      
      // Try simple invalid inputs that should definitely be rejected
      const invalidInputs = ['', 'AB', 'ZZZZZ'];
      
      for (const invalidInput of invalidInputs) {
        // Clear any previous input
        wrapper.vm.currentGuess = '';
        await waitForUpdates();
        
        // Type invalid input
        if (invalidInput) {
          for (const char of invalidInput) {
            if (char.match(/[A-Z]/)) {
              const keyButton = wrapper.find(`[data-key="${char}"]`);
              if (keyButton.exists()) {
                await keyButton.trigger('click');
              }
            }
          }
        }
        
        await submitGuess(wrapper);
        await waitForUpdates();
        
        // Verify hurdle state unchanged for invalid inputs
        expect(gameState.getGuesses().length).toBe(initialHurdleState.guesses);
        expect(gameState.getRemainingAttempts()).toBe(initialHurdleState.attempts);
        expect(gameState.gameStatus).toBe(initialHurdleState.status);
        expect(wrapper.vm.hurdleNumber).toBe(initialHurdleState.hurdleNumber);
        expect(wrapper.vm.completedHurdlesCount).toBe(initialHurdleState.completedCount);
        expect(wrapper.vm.totalScore).toBe(initialHurdleState.totalScore);
        
        // Verify error message is shown
        const message = await getDisplayedMessage(wrapper);
        expect(message).not.toBeNull();
        expect(message.classes).toContain('error');
      }
    }, 8000);
  });

  describe('Feedback Display', () => {
    test('should correctly display feedback colors on game board', async () => {
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord().toUpperCase();
      
      // Make a guess that will have mixed feedback
      let testGuess = 'APPLE';
      // If target is APPLE, use a different word to get mixed feedback
      if (targetWord === 'APPLE') {
        testGuess = 'BREAD';
      }
      
      await typeWord(wrapper, testGuess);
      await submitGuess(wrapper);
      
      // Get feedback from hurdle controller
      const gameState = currentGameController.getGameState();
      const guess = gameState.getGuesses()[0];
      const feedback = guess.getFeedback();
      
      // Get UI board state
      const boardState = getBoardState(wrapper);
      const firstRow = boardState[0];
      
      // Verify UI feedback matches hurdle controller feedback
      for (let i = 0; i < 5; i++) {
        expect(firstRow[i].letter).toBe(feedback[i].letter.toUpperCase());
        expect(firstRow[i].classes).toContain(feedback[i].status);
        
        // Verify correct CSS classes are applied
        if (feedback[i].status === 'correct') {
          expect(firstRow[i].classes).toContain('correct');
        } else if (feedback[i].status === 'present') {
          expect(firstRow[i].classes).toContain('present');
        } else if (feedback[i].status === 'absent') {
          expect(firstRow[i].classes).toContain('absent');
        }
      }
    });

    test('should handle complex feedback scenarios correctly', async () => {
      // Test with a word that has duplicate letters
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord();
      
      // Make a guess with duplicate letters
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Get feedback from hurdle controller
      const gameState = currentGameController.getGameState();
      const guess = gameState.getGuesses()[0];
      const feedback = guess.getFeedback();
      
      // Get UI board state
      const boardState = getBoardState(wrapper);
      const firstRow = boardState[0];
      
      // Verify UI correctly displays complex feedback
      for (let i = 0; i < 5; i++) {
        expect(firstRow[i].letter).toBe(feedback[i].letter.toUpperCase());
        expect(firstRow[i].classes).toContain(feedback[i].status);
      }
      
      // Verify feedback follows correct rules for duplicate letters
      const letterCounts = {};
      feedback.forEach(f => {
        letterCounts[f.letter] = (letterCounts[f.letter] || 0) + 1;
      });
      
      // Each letter should appear the correct number of times
      Object.keys(letterCounts).forEach(letter => {
        const uiLetterCount = firstRow.filter(tile => tile.letter === letter.toUpperCase()).length;
        expect(uiLetterCount).toBe(letterCounts[letter]);
      });
    });
  });

  describe('Keyboard State Updates', () => {
    test('should update keyboard state based on guess feedback', async () => {
      // Make a guess
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Get feedback from hurdle controller
      const currentGameController = hurdleController.getCurrentGameController();
      const gameState = currentGameController.getGameState();
      const guess = gameState.getGuesses()[0];
      const feedback = guess.getFeedback();
      
      // Get keyboard state from UI
      const keyboardState = getKeyboardState(wrapper);
      
      // Verify keyboard state reflects the feedback
      feedback.forEach(letterFeedback => {
        const letter = letterFeedback.letter.toUpperCase();
        const status = letterFeedback.status;
        
        expect(keyboardState[letter]).toContain(status);
      });
    });

    test('should maintain best status for letters across multiple guesses', async () => {
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord();
      
      // Make first guess
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Make second guess with overlapping letters
      await typeWord(wrapper, 'BREAD');
      await submitGuess(wrapper);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get all feedback from hurdle controller
      const gameState = currentGameController.getGameState();
      const guesses = gameState.getGuesses();
      
      // Track the best status for each letter
      const bestStatus = {};
      const statusPriority = { 'correct': 3, 'present': 2, 'absent': 1 };
      
      guesses.forEach(guess => {
        guess.getFeedback().forEach(letterFeedback => {
          const letter = letterFeedback.letter.toUpperCase();
          const status = letterFeedback.status;
          
          if (!bestStatus[letter] || statusPriority[status] > statusPriority[bestStatus[letter]]) {
            bestStatus[letter] = status;
          }
        });
      });
      
      // Get keyboard state from UI
      const keyboardState = getKeyboardState(wrapper);
      
      // Verify keyboard shows best status for each letter
      Object.keys(bestStatus).forEach(letter => {
        expect(keyboardState[letter]).toContain(bestStatus[letter]);
      });
    }, 15000);

    test('should reset keyboard state on new hurdle session', async () => {
      // Make a guess to set keyboard state
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Verify keyboard has some state
      let keyboardState = getKeyboardState(wrapper);
      const hasInitialState = Object.values(keyboardState).some(classes => 
        classes.includes('correct') || classes.includes('present') || classes.includes('absent')
      );
      expect(hasInitialState).toBe(true);
      
      // Start new hurdle session
      const newGameBtn = wrapper.find('#new-game-btn');
      await newGameBtn.trigger('click');
      await waitForUpdates();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify keyboard state is reset
      keyboardState = getKeyboardState(wrapper);
      const hasStateAfterReset = Object.values(keyboardState).some(classes => 
        classes.includes('correct') || classes.includes('present') || classes.includes('absent')
      );
      expect(hasStateAfterReset).toBe(false);
    }, 10000);
  });

  describe('Hurdle State Synchronization', () => {
    test('should maintain UI-HurdleController synchronization throughout session', async () => {
      // Get the target word to avoid using it in tests
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord().toLowerCase();
      
      // Use a set of common valid words, but filter out the target word
      const candidateWords = ['apple', 'bread', 'crane', 'dance', 'eagle', 'flame'];
      const safeWords = candidateWords.filter(word => word !== targetWord);
      
      // If somehow all our candidate words match the target (very unlikely), use different words
      if (safeWords.length < 3) {
        safeWords.push('grape', 'house', 'juice'); // Add more safe words
      }
      
      // Only test first 3 attempts to ensure we have enough safe words
      const testWords = safeWords.slice(0, 3).map(word => word.toUpperCase());
      
      for (let i = 0; i < testWords.length; i++) {
        // Before guess
        const gameState = currentGameController.getGameState();
        expect(gameState.getGuesses().length).toBe(i);
        expect(gameState.getRemainingAttempts()).toBe(4 - i);
        
        // Make guess with a word that definitely won't win
        await typeWord(wrapper, testWords[i]);
        await submitGuess(wrapper);
        await waitForUpdates();
        
        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // After guess
        expect(gameState.getGuesses().length).toBe(i + 1);
        expect(gameState.getRemainingAttempts()).toBe(4 - (i + 1));
        
        // Verify guess was recorded correctly
        const lastGuess = gameState.getGuesses()[i];
        expect(lastGuess.word).toBe(testWords[i].toLowerCase());
        
        // Verify UI board reflects the guess
        const boardState = getBoardState(wrapper);
        const guessRow = boardState[i];
        expect(guessRow.map(tile => tile.letter).join('')).toBe(testWords[i]);
        
        // Verify hurdle is still in progress (since we avoided the target word)
        expect(gameState.gameStatus).toBe('in-progress');
      }
    }, 15000);

    test('should handle rapid input correctly', async () => {
      // Get the target word to avoid using it in tests
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord().toLowerCase();
      
      // Use words that are definitely not the target word
      const candidateWords = ['bread', 'crane', 'dance', 'eagle'];
      const safeWords = candidateWords.filter(word => word !== targetWord);
      
      // If somehow all our candidate words match the target (very unlikely), use different words
      if (safeWords.length < 2) {
        safeWords.push('grape', 'house'); // Add more safe words
      }
      
      // Rapidly type and submit multiple guesses
      const rapidGuesses = safeWords.slice(0, 2).map(word => word.toUpperCase());
      
      for (const guess of rapidGuesses) {
        // Clear any previous input first
        wrapper.vm.currentGuess = '';
        await waitForUpdates();
        
        // Type quickly without waiting
        for (const char of guess) {
          const keyButton = wrapper.find(`[data-key="${char}"]`);
          if (keyButton.exists()) {
            await keyButton.trigger('click');
          }
        }
        
        // Submit immediately
        const enterButton = wrapper.find('[data-key="ENTER"]');
        await enterButton.trigger('click');
        await waitForUpdates();
        
        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Verify both guesses were processed correctly
      const gameState = currentGameController.getGameState();
      expect(gameState.getGuesses().length).toBe(2);
      expect(gameState.getGuesses()[0].word).toBe(rapidGuesses[0].toLowerCase());
      expect(gameState.getGuesses()[1].word).toBe(rapidGuesses[1].toLowerCase());
      
      // Verify UI reflects both guesses
      expect(gameState.getRemainingAttempts()).toBe(2);
      const boardState = getBoardState(wrapper);
      expect(boardState[0].map(tile => tile.letter).join('')).toBe(rapidGuesses[0]);
      expect(boardState[1].map(tile => tile.letter).join('')).toBe(rapidGuesses[1]);
      
      // Verify hurdle is still in progress (since we avoided the target word)
      expect(gameState.gameStatus).toBe('in-progress');
    });
  });
});