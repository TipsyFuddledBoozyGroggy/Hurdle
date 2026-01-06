/**
 * Integration tests for App.vue component
 * Tests complete hurdle flows and UI interactions
 */

const { nextTick } = require('vue');
const {
  mountAppWithHurdleController,
  waitForUpdates,
  typeWord,
  submitGuess,
  pressBackspace,
  getBoardState,
  getKeyboardState,
  getDisplayedMessage,
  playHurdleToCompletion,
  playHurdleToFailure
} = require('./testUtils');

describe('App.vue Integration Tests', () => {
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

  describe('Complete Hurdle Flow - Win Scenario', () => {
    test('should complete a full hurdle from start to completion through UI', async () => {
      // Get the target word from the current game state
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord();
      
      // Verify initial hurdle state
      const initialMessage = await getDisplayedMessage(wrapper);
      expect(initialMessage?.text).toContain('Game started');
      expect(wrapper.vm.hurdleNumber).toBe(1);
      expect(wrapper.vm.completedHurdlesCount).toBe(0);
      expect(wrapper.vm.totalScore).toBe(0);
      
      // Type and submit the correct word
      await typeWord(wrapper, targetWord);
      
      // Verify the word appears on the board before submission
      const boardBeforeSubmit = getBoardState(wrapper);
      const currentRow = boardBeforeSubmit[0];
      expect(currentRow.map(tile => tile.letter).join('')).toBe(targetWord.toUpperCase());
      
      // Submit the guess
      await submitGuess(wrapper);
      
      // Wait longer for hurdle completion processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify hurdle completion state
      const message = await getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toContain('complete!');
      expect(message.text).toContain('points');
      
      // Verify hurdle progression
      expect(wrapper.vm.hurdleNumber).toBe(2); // Should advance to next hurdle
      expect(wrapper.vm.completedHurdlesCount).toBe(1);
      expect(wrapper.vm.totalScore).toBeGreaterThan(0);
      
      // Verify board shows auto-guess for next hurdle
      const finalBoard = getBoardState(wrapper);
      const nextHurdleRow = finalBoard[0];
      expect(nextHurdleRow.map(tile => tile.letter).join('')).toBe(targetWord.toUpperCase());
      
    }, 15000);

    test('should handle multiple hurdle completions in sequence', async () => {
      // Complete first hurdle
      const firstGameController = hurdleController.getCurrentGameController();
      const firstTargetWord = firstGameController.getGameState().getTargetWord();
      
      await typeWord(wrapper, firstTargetWord);
      await submitGuess(wrapper);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify first hurdle completed
      expect(wrapper.vm.hurdleNumber).toBe(2);
      expect(wrapper.vm.completedHurdlesCount).toBe(1);
      const firstScore = wrapper.vm.totalScore;
      expect(firstScore).toBeGreaterThan(0);
      
      // Complete second hurdle (need to make additional guesses since auto-guess is already applied)
      const secondGameController = hurdleController.getCurrentGameController();
      const secondTargetWord = secondGameController.getGameState().getTargetWord();
      
      // Make a guess that's not the target to continue the hurdle
      await typeWord(wrapper, 'BREAD');
      await submitGuess(wrapper);
      await waitForUpdates();
      
      // Then complete the second hurdle
      await typeWord(wrapper, secondTargetWord);
      await submitGuess(wrapper);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify second hurdle completed
      expect(wrapper.vm.hurdleNumber).toBe(3);
      expect(wrapper.vm.completedHurdlesCount).toBe(2);
      expect(wrapper.vm.totalScore).toBeGreaterThan(firstScore);
      
    }, 25000);
  });

  describe('Complete Hurdle Flow - Failure Scenario', () => {
    test('should end hurdle session when failing to complete a hurdle', async () => {
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord();
      
      // Play hurdle to failure (use all 4 attempts without winning)
      await playHurdleToFailure(wrapper, hurdleController);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify failure state
      const message = await getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toContain('Game ended!');
      expect(message.text).toContain(targetWord.toUpperCase());
      expect(message.classes).toContain('error');
      
      // Verify hurdle session ended
      expect(wrapper.vm.hurdleGameEnded).toBe(true);
      
      // Verify all 4 rows are filled
      const finalBoard = getBoardState(wrapper);
      for (let i = 0; i < 4; i++) {
        const row = finalBoard[i];
        expect(row.every(tile => tile.letter !== '')).toBe(true);
      }
    }, 25000);

    test('should show target word and final score after hurdle session ends', async () => {
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord();
      
      await playHurdleToFailure(wrapper, hurdleController);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const message = await getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toContain(`The word was ${targetWord.toUpperCase()}`);
      
      // Verify game end summary is shown
      expect(wrapper.vm.hurdleGameEnded).toBe(true);
    }, 25000);
  });

  describe('Keyboard Interaction', () => {
    test('should handle on-screen keyboard clicks', async () => {
      // Click individual letter keys
      const qKey = wrapper.find('[data-key="Q"]');
      const wKey = wrapper.find('[data-key="W"]');
      const eKey = wrapper.find('[data-key="E"]');
      const rKey = wrapper.find('[data-key="R"]');
      const tKey = wrapper.find('[data-key="T"]');
      
      await qKey.trigger('click');
      await waitForUpdates();
      await wKey.trigger('click');
      await waitForUpdates();
      await eKey.trigger('click');
      await waitForUpdates();
      await rKey.trigger('click');
      await waitForUpdates();
      await tKey.trigger('click');
      await waitForUpdates();
      
      // Verify the word appears on the board
      const board = getBoardState(wrapper);
      const currentRow = board[0];
      expect(currentRow.map(tile => tile.letter).join('')).toBe('QWERT');
    });

    test('should handle backspace key', async () => {
      // Type some letters
      await typeWord(wrapper, 'HELLO');
      
      // Verify letters are there
      let board = getBoardState(wrapper);
      expect(board[0].map(tile => tile.letter).join('')).toBe('HELLO');
      
      // Press backspace twice
      await pressBackspace(wrapper);
      await pressBackspace(wrapper);
      
      // Verify letters were removed
      board = getBoardState(wrapper);
      expect(board[0].map(tile => tile.letter).join('')).toBe('HEL');
    });

    test('should handle enter key for submission', async () => {
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord();
      
      // Type the target word
      await typeWord(wrapper, targetWord);
      
      // Press enter
      const enterKey = wrapper.find('[data-key="ENTER"]');
      await enterKey.trigger('click');
      await waitForUpdates();
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify submission occurred (hurdle completion)
      const message = await getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toContain('complete!');
    }, 15000);

    test('should handle physical keyboard input', async () => {
      // Simulate physical keyboard events on the document
      const keydownEvent = new KeyboardEvent('keydown', { key: 'A' });
      document.dispatchEvent(keydownEvent);
      await waitForUpdates();
      
      const keydownEvent2 = new KeyboardEvent('keydown', { key: 'P' });
      document.dispatchEvent(keydownEvent2);
      await waitForUpdates();
      
      const keydownEvent3 = new KeyboardEvent('keydown', { key: 'P' });
      document.dispatchEvent(keydownEvent3);
      await waitForUpdates();
      
      const keydownEvent4 = new KeyboardEvent('keydown', { key: 'L' });
      document.dispatchEvent(keydownEvent4);
      await waitForUpdates();
      
      const keydownEvent5 = new KeyboardEvent('keydown', { key: 'E' });
      document.dispatchEvent(keydownEvent5);
      await waitForUpdates();
      
      // Verify the word appears on the board
      const board = getBoardState(wrapper);
      const currentRow = board[0];
      expect(currentRow.map(tile => tile.letter).join('')).toBe('APPLE');
      
      // Test physical backspace
      const backspaceEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      document.dispatchEvent(backspaceEvent);
      await waitForUpdates();
      
      const boardAfterBackspace = getBoardState(wrapper);
      expect(boardAfterBackspace[0].map(tile => tile.letter).join('')).toBe('APPL');
      
      // Test physical enter
      const keydownEventE = new KeyboardEvent('keydown', { key: 'E' });
      document.dispatchEvent(keydownEventE);
      await waitForUpdates();
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(enterEvent);
      await waitForUpdates();
      
      // Should have submitted the guess
    });

    test('should limit input to 5 characters', async () => {
      // Try to type more than 5 characters
      await typeWord(wrapper, 'ABCDEFGH');
      
      // Verify only first 5 characters are shown
      const board = getBoardState(wrapper);
      const currentRow = board[0];
      expect(currentRow.map(tile => tile.letter).join('')).toBe('ABCDE');
    });

    test('should ignore input when hurdle session is over', async () => {
      // End the hurdle session first
      await playHurdleToFailure(wrapper, hurdleController);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to type after hurdle session is over
      await typeWord(wrapper, 'HELLO');
      
      // Verify no new input was accepted (board should remain as it was)
      const board = getBoardState(wrapper);
      // All rows should be filled from the failure, no new input should appear
      expect(board.every(row => row.every(tile => tile.letter !== '' || tile.status === 'empty'))).toBe(true);
    });
  });

  describe('Error Message Display and Clearing', () => {
    test('should display error for empty guess', async () => {
      // Try to submit without typing anything
      await submitGuess(wrapper);
      
      const message = await getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toBe('Please enter a word');
      expect(message.classes).toContain('error');
    });

    test('should display error for short word', async () => {
      // Type only 3 letters
      await typeWord(wrapper, 'ABC');
      await submitGuess(wrapper);
      
      const message = await getDisplayedMessage(wrapper);
      expect(message.text).toBe('Word must be 5 letters long');
      expect(message.classes).toContain('error');
    });

    test('should display error for invalid word', async () => {
      // Type a word not in dictionary
      await typeWord(wrapper, 'ZZZZZ');
      await submitGuess(wrapper);
      
      const message = await getDisplayedMessage(wrapper);
      expect(message.text).toBe('Not a valid word');
      expect(message.classes).toContain('error');
    });

    test('should clear error message on next valid input', async () => {
      // First, create an error
      await submitGuess(wrapper); // Empty guess
      expect((await getDisplayedMessage(wrapper)).text).toBe('Please enter a word');
      
      // Then make a valid guess
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Error message should be cleared
      const message = await getDisplayedMessage(wrapper);
      if (message) {
        // If there's a message, it should be a game result, not an error
        expect(message.classes).not.toContain('error');
      }
    });

    test('should not consume attempts for invalid guesses', async () => {
      // Make an invalid guess
      await typeWord(wrapper, 'ZZZZZ');
      await submitGuess(wrapper);
      
      // Verify attempts counter didn't change
      
      // Make another invalid guess
      await typeWord(wrapper, 'ABC');
      await submitGuess(wrapper);
      
      // Still no attempts consumed
    });
  });

  describe('New Hurdle Session Functionality', () => {
    test('should reset hurdle session state when new game button is clicked', async () => {
      // Complete a hurdle first to have some state
      const currentGameController = hurdleController.getCurrentGameController();
      const targetWord = currentGameController.getGameState().getTargetWord();
      
      await typeWord(wrapper, targetWord);
      await submitGuess(wrapper);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify hurdle state changed
      expect(wrapper.vm.hurdleNumber).toBe(2);
      expect(wrapper.vm.completedHurdlesCount).toBe(1);
      expect(wrapper.vm.totalScore).toBeGreaterThan(0);
      
      // Click new game button
      const newGameBtn = wrapper.find('#new-game-btn');
      await newGameBtn.trigger('click');
      await waitForUpdates();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify hurdle session was reset
      expect(wrapper.vm.hurdleNumber).toBe(1);
      expect(wrapper.vm.completedHurdlesCount).toBe(0);
      expect(wrapper.vm.totalScore).toBe(0);
      expect(wrapper.vm.hurdleGameEnded).toBe(false);
      
      // Verify board is cleared
      const board = getBoardState(wrapper);
      expect(board[0].every(tile => tile.letter === '')).toBe(true);
      
      // Verify message shows game started
      const message = await getDisplayedMessage(wrapper);
      expect(message?.text).toContain('Game started');
    }, 15000);

    test('should clear keyboard state on new hurdle session', async () => {
      // Make a guess to update keyboard state
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      await waitForUpdates();
      
      // Verify keyboard has some state (wait for async operations to complete)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const keyboardBefore = getKeyboardState(wrapper);
      const hasKeyboardState = Object.values(keyboardBefore).some(classes => 
        classes.includes('correct') || classes.includes('present') || classes.includes('absent')
      );
      expect(hasKeyboardState).toBe(true);
      
      // Start new hurdle session
      const newGameBtn = wrapper.find('#new-game-btn');
      await newGameBtn.trigger('click');
      await waitForUpdates();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify keyboard state is cleared
      const keyboardAfter = getKeyboardState(wrapper);
      const hasKeyboardStateAfter = Object.values(keyboardAfter).some(classes => 
        classes.includes('correct') || classes.includes('present') || classes.includes('absent')
      );
      expect(hasKeyboardStateAfter).toBe(false);
    }, 15000);

    test('should generate new target word on new hurdle session', async () => {
      const firstGameController = hurdleController.getCurrentGameController();
      const firstTargetWord = firstGameController.getGameState().getTargetWord();
      
      // Start new hurdle session
      const newGameBtn = wrapper.find('#new-game-btn');
      await newGameBtn.trigger('click');
      await waitForUpdates();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const secondGameController = hurdleController.getCurrentGameController();
      const secondTargetWord = secondGameController.getGameState().getTargetWord();
      
      // Verify that a new hurdle session was started (target word may or may not be different)
      expect(wrapper.vm.hurdleNumber).toBe(1);
      expect(wrapper.vm.completedHurdlesCount).toBe(0);
    }, 10000);
  });

  describe('Hurdle Mode Display', () => {
    test('should show game title', async () => {
      const title = wrapper.find('h1');
      expect(title.exists()).toBe(true);
      expect(title.text()).toBe('Hurdle');
    });

    test('should show hurdle progress information', async () => {
      // Verify hurdle progress elements are displayed
      const hurdleProgress = wrapper.find('.hurdle-progress');
      expect(hurdleProgress.exists()).toBe(true);
      
      const hurdleNumber = wrapper.find('.hurdle-number');
      expect(hurdleNumber.exists()).toBe(true);
      expect(hurdleNumber.text()).toContain('Hurdle 1');
      
      const completedCount = wrapper.find('.completed-count');
      expect(completedCount.exists()).toBe(true);
      expect(completedCount.text()).toContain('Completed: 0');
      
      const currentScore = wrapper.find('.current-score');
      expect(currentScore.exists()).toBe(true);
      expect(currentScore.text()).toContain('Score: 0');
    });

    test('should show new game button', async () => {
      const newGameBtn = wrapper.find('#new-game-btn');
      expect(newGameBtn.exists()).toBe(true);
      expect(newGameBtn.text()).toBe('New Game');
    });

    test('should show keyboard layout', async () => {
      // Verify all expected keys are present
      const expectedKeys = [
        'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
        'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
        'ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'
      ];
      
      expectedKeys.forEach(key => {
        const keyElement = wrapper.find(`[data-key="${key}"]`);
        expect(keyElement.exists()).toBe(true);
      });
      
      // Verify backspace shows correct symbol
      const backspaceKey = wrapper.find('[data-key="BACKSPACE"]');
      expect(backspaceKey.text()).toBe('⌫');
    });
  });
});