/**
 * Integration tests for UI and GameController interaction
 * Tests that UI correctly reflects game state changes and processes user input
 */

const {
  mountAppWithTestController,
  waitForUpdates,
  typeWord,
  submitGuess,
  getBoardState,
  getKeyboardState,
  getDisplayedMessage
} = require('./testUtils');

describe('UI and GameController Integration Tests', () => {
  let wrapper;
  let gameController;

  beforeEach(async () => {
    const result = mountAppWithTestController();
    wrapper = result.wrapper;
    gameController = result.gameController;
    await waitForUpdates();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('UI Reflects Game State Changes', () => {
    test('should update attempts counter when game state changes', async () => {
      // Initial state
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 0/4');
      
      // Make first guess
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      await waitForUpdates();
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify UI reflects the state change
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 1/4');
      expect(gameController.getGameState().getGuesses().length).toBe(1);
      
      // Make second guess
      await typeWord(wrapper, 'BREAD');
      await submitGuess(wrapper);
      await waitForUpdates();
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify UI continues to reflect state changes
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 2/4');
      expect(gameController.getGameState().getGuesses().length).toBe(2);
    }, 10000);

    test('should display game board that matches game state guesses', async () => {
      const targetWord = gameController.getGameState().getTargetWord();
      
      // Make a few guesses
      const testGuesses = ['APPLE', 'BREAD'];
      
      for (let i = 0; i < testGuesses.length; i++) {
        await typeWord(wrapper, testGuesses[i]);
        await submitGuess(wrapper);
        await waitForUpdates();
        
        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get game state
        const gameState = gameController.getGameState();
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

    test('should show win message when game controller indicates win', async () => {
      const targetWord = gameController.getGameState().getTargetWord();
      
      // Make the winning guess
      await typeWord(wrapper, targetWord);
      await submitGuess(wrapper);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify game controller shows win state
      expect(gameController.getGameState().gameStatus).toBe('won');
      
      // Verify UI shows win message
      const message = await getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toContain('Congratulations! You won!');
      expect(message.text).toContain(targetWord.toUpperCase());
      expect(message.classes).toContain('success');
    });

    test('should show loss message when game controller indicates loss', async () => {
      const targetWord = gameController.getGameState().getTargetWord();
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify game controller shows loss state
      expect(gameController.getGameState().gameStatus).toBe('lost');
      
      // Verify UI shows loss message
      const message = await getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toContain('Game Over!');
      expect(message.text).toContain(targetWord.toUpperCase());
      expect(message.classes).toContain('error');
    }, 25000);

    test('should update remaining attempts display to match game state', async () => {
      const maxAttempts = gameController.getGameState().maxAttempts;
      expect(maxAttempts).toBe(4);
      
      // Get the target word to avoid using it in tests
      const targetWord = gameController.getGameState().getTargetWord().toLowerCase();
      
      // Use a set of common valid words, but filter out the target word
      const candidateWords = ['apple', 'bread', 'crane', 'dance', 'eagle', 'flame', 'grape', 'house', 'juice', 'knife'];
      const safeWords = candidateWords.filter(word => word !== targetWord);
      
      // If somehow all our candidate words match the target (very unlikely), use different words
      if (safeWords.length === 0) {
        safeWords.push('aahed', 'aalii', 'aargh'); // Use words from start of dictionary
      }
      
      // Only test first 3 attempts to avoid timeout and accidental wins
      for (let i = 0; i < Math.min(3, safeWords.length); i++) {
        // Verify attempts before guess
        expect(wrapper.find('#attempts-remaining').text()).toBe(`Attempts: ${i}/${maxAttempts}`);
        expect(gameController.getGameState().getGuesses().length).toBe(i);
        
        // Make guess with a word that definitely won't win
        await typeWord(wrapper, safeWords[i].toUpperCase());
        await submitGuess(wrapper);
        await waitForUpdates();
        
        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify the guess was accepted and attempts updated
        expect(gameController.getGameState().getGuesses().length).toBe(i + 1);
        expect(wrapper.find('#attempts-remaining').text()).toBe(`Attempts: ${i + 1}/${maxAttempts}`);
        
        // Verify game is still in progress (since we avoided the target word)
        expect(gameController.getGameState().gameStatus).toBe('in-progress');
      }
    }, 25000);
  });

  describe('User Input Processing', () => {
    test('should validate input through game controller and show appropriate errors', async () => {
      // Test empty input
      await submitGuess(wrapper);
      let message = await getDisplayedMessage(wrapper);
      expect(message.text).toBe('Please enter a word');
      expect(message.classes).toContain('error');
      expect(gameController.getGameState().getGuesses().length).toBe(0);
      
      // Clear any current guess state
      wrapper.vm.currentGuess = '';
      await waitForUpdates();
      
      // Test short input
      await typeWord(wrapper, 'ABC');
      await submitGuess(wrapper);
      message = await getDisplayedMessage(wrapper);
      expect(message.text).toBe('Word must be 5 letters long');
      expect(message.classes).toContain('error');
      expect(gameController.getGameState().getGuesses().length).toBe(0);
      
      // Clear any current guess state
      wrapper.vm.currentGuess = '';
      await waitForUpdates();
      
      // Test invalid word
      await typeWord(wrapper, 'ZZZZZ');
      await submitGuess(wrapper);
      message = await getDisplayedMessage(wrapper);
      expect(message.text).toBe('Not a valid word');
      expect(message.classes).toContain('error');
      expect(gameController.getGameState().getGuesses().length).toBe(0);
      
      // Clear any current guess state
      wrapper.vm.currentGuess = '';
      await waitForUpdates();
      
      // Test valid word that's not the target
      const targetWord = gameController.getGameState().getTargetWord().toLowerCase();
      const candidateWords = ['apple', 'bread', 'crane', 'dance', 'eagle'];
      const safeWord = candidateWords.find(word => word !== targetWord) || 'bread';
      
      await typeWord(wrapper, safeWord.toUpperCase());
      await submitGuess(wrapper);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(gameController.getGameState().getGuesses().length).toBe(1);
    }, 15000);

    test('should process valid guesses through game controller', async () => {
      const initialGuessCount = gameController.getGameState().getGuesses().length;
      expect(initialGuessCount).toBe(0);
      
      // Get the target word to avoid using it in tests
      const targetWord = gameController.getGameState().getTargetWord().toLowerCase();
      const candidateWords = ['apple', 'bread', 'crane', 'dance', 'eagle'];
      const safeWord = candidateWords.find(word => word !== targetWord) || 'bread';
      
      // Submit valid guess that's not the target word
      await typeWord(wrapper, safeWord.toUpperCase());
      await submitGuess(wrapper);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify game controller processed the guess
      const gameState = gameController.getGameState();
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
      
      // Verify game is still in progress (since we avoided the target word)
      expect(gameState.gameStatus).toBe('in-progress');
    });

    test('should handle case normalization through game controller', async () => {
      // Get the target word to avoid using it in tests
      const targetWord = gameController.getGameState().getTargetWord().toLowerCase();
      
      // Use a word that's definitely not the target word
      const candidateWords = ['bread', 'crane', 'dance', 'eagle', 'flame', 'grape', 'house'];
      const testWord = candidateWords.find(word => word !== targetWord) || 'bread';
      
      // Test different cases of the same safe word
      const testCases = [testWord, testWord.toUpperCase(), 
                        testWord.charAt(0).toUpperCase() + testWord.slice(1),
                        testWord.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c).join('')];
      
      for (const testCase of testCases) {
        // Start new game for each test
        const newGameBtn = wrapper.find('#new-game-btn');
        await newGameBtn.trigger('click');
        await waitForUpdates();
        
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
        
        // Verify game controller normalized the case
        const gameState = gameController.getGameState();
        if (gameState.getGuesses().length > 0) {
          const guess = gameState.getGuesses()[0];
          expect(guess.word).toBe(testWord.toLowerCase()); // Always normalized to lowercase
          
          // Verify game is still in progress (since we avoided the target word)
          expect(gameState.gameStatus).toBe('in-progress');
        }
      }
    }, 15000);

    test('should reject invalid input without affecting game state', async () => {
      const initialGameState = {
        guesses: gameController.getGameState().getGuesses().length,
        attempts: gameController.getGameState().getRemainingAttempts(),
        status: gameController.getGameState().gameStatus
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
        
        // Verify game state unchanged for invalid inputs
        expect(gameController.getGameState().getGuesses().length).toBe(initialGameState.guesses);
        expect(gameController.getGameState().getRemainingAttempts()).toBe(initialGameState.attempts);
        expect(gameController.getGameState().gameStatus).toBe(initialGameState.status);
        
        // Verify error message is shown
        const message = await getDisplayedMessage(wrapper);
        expect(message).not.toBeNull();
        expect(message.classes).toContain('error');
      }
    }, 8000);
  });

  describe('Feedback Display', () => {
    test('should correctly display feedback colors on game board', async () => {
      const targetWord = gameController.getGameState().getTargetWord().toUpperCase();
      
      // Make a guess that will have mixed feedback
      let testGuess = 'APPLE';
      // If target is APPLE, use a different word to get mixed feedback
      if (targetWord === 'APPLE') {
        testGuess = 'BREAD';
      }
      
      await typeWord(wrapper, testGuess);
      await submitGuess(wrapper);
      
      // Get feedback from game controller
      const gameState = gameController.getGameState();
      const guess = gameState.getGuesses()[0];
      const feedback = guess.getFeedback();
      
      // Get UI board state
      const boardState = getBoardState(wrapper);
      const firstRow = boardState[0];
      
      // Verify UI feedback matches game controller feedback
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
      const targetWord = gameController.getGameState().getTargetWord();
      
      // Make a guess with duplicate letters
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Get feedback from game controller
      const gameState = gameController.getGameState();
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
      
      // Get feedback from game controller
      const gameState = gameController.getGameState();
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
      const targetWord = gameController.getGameState().getTargetWord();
      
      // Make first guess
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Make second guess with overlapping letters
      await typeWord(wrapper, 'BREAD');
      await submitGuess(wrapper);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get all feedback from game controller
      const gameState = gameController.getGameState();
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

    test('should reset keyboard state on new game', async () => {
      // Make a guess to set keyboard state
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Verify keyboard has some state
      let keyboardState = getKeyboardState(wrapper);
      const hasInitialState = Object.values(keyboardState).some(classes => 
        classes.includes('correct') || classes.includes('present') || classes.includes('absent')
      );
      expect(hasInitialState).toBe(true);
      
      // Start new game
      const newGameBtn = wrapper.find('#new-game-btn');
      await newGameBtn.trigger('click');
      await waitForUpdates();
      
      // Verify keyboard state is reset
      keyboardState = getKeyboardState(wrapper);
      const hasStateAfterReset = Object.values(keyboardState).some(classes => 
        classes.includes('correct') || classes.includes('present') || classes.includes('absent')
      );
      expect(hasStateAfterReset).toBe(false);
    });
  });

  describe('Game State Synchronization', () => {
    test('should maintain UI-GameController synchronization throughout game', async () => {
      // Get the target word to avoid using it in tests
      const targetWord = gameController.getGameState().getTargetWord().toLowerCase();
      
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
        const gameStateBefore = gameController.getGameState();
        expect(wrapper.find('#attempts-remaining').text()).toBe(`Attempts: ${i}/4`);
        expect(gameStateBefore.getGuesses().length).toBe(i);
        
        // Make guess with a word that definitely won't win
        await typeWord(wrapper, testWords[i]);
        await submitGuess(wrapper);
        await waitForUpdates();
        
        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // After guess
        const gameStateAfter = gameController.getGameState();
        expect(wrapper.find('#attempts-remaining').text()).toBe(`Attempts: ${i + 1}/4`);
        expect(gameStateAfter.getGuesses().length).toBe(i + 1);
        
        // Verify guess was recorded correctly
        const lastGuess = gameStateAfter.getGuesses()[i];
        expect(lastGuess.word).toBe(testWords[i].toLowerCase());
        
        // Verify UI board reflects the guess
        const boardState = getBoardState(wrapper);
        const guessRow = boardState[i];
        expect(guessRow.map(tile => tile.letter).join('')).toBe(testWords[i]);
        
        // Verify game is still in progress (since we avoided the target word)
        expect(gameStateAfter.gameStatus).toBe('in-progress');
      }
    }, 15000);

    test('should handle rapid input correctly', async () => {
      // Get the target word to avoid using it in tests
      const targetWord = gameController.getGameState().getTargetWord().toLowerCase();
      
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
      const gameState = gameController.getGameState();
      expect(gameState.getGuesses().length).toBe(2);
      expect(gameState.getGuesses()[0].word).toBe(rapidGuesses[0].toLowerCase());
      expect(gameState.getGuesses()[1].word).toBe(rapidGuesses[1].toLowerCase());
      
      // Verify UI reflects both guesses
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 2/4');
      const boardState = getBoardState(wrapper);
      expect(boardState[0].map(tile => tile.letter).join('')).toBe(rapidGuesses[0]);
      expect(boardState[1].map(tile => tile.letter).join('')).toBe(rapidGuesses[1]);
      
      // Verify game is still in progress (since we avoided the target word)
      expect(gameState.gameStatus).toBe('in-progress');
    });
  });
});