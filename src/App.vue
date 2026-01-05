<template>
  <div id="game-container">
    <header>
      <h1>Hurdle</h1>
    </header>
    
    <div id="game-board">
      <div v-for="(row, index) in boardRows" :key="index" class="guess-row">
        <div 
          v-for="(tile, tileIndex) in row" 
          :key="tileIndex"
          :class="['letter-tile', tile.status, { active: tile.active }]"
        >
          {{ tile.letter }}
        </div>
      </div>
    </div>
    
    <!-- Input is now handled through the on-screen keyboard and direct typing -->
    
    <div id="keyboard">
      <div v-for="(row, index) in keyboardLayout" :key="index" class="keyboard-row">
        <button
          v-for="key in row"
          :key="key"
          :class="['key', { wide: key === 'ENTER' || key === 'BACKSPACE' }, keyboardState[key]]"
          :data-key="key"
          :disabled="!isInitialized"
          @click="handleKeyPress(key)"
        >
          {{ key === 'BACKSPACE' ? '⌫' : key }}
        </button>
      </div>
    </div>
    
    <div v-if="message" :class="['message-area', messageType]" id="message-area">
      {{ message }}
    </div>
    
    <div v-if="definition" id="definition-area">
      <div class="word-title">{{ definition.word }}</div>
      <div v-for="(def, index) in definition.definitions" :key="index" class="definition-item">
        <div class="definition-text">
          <em>{{ def.partOfSpeech }}</em> - {{ def.text }}
        </div>
      </div>
    </div>
    
    <button @click="handleNewGame" id="new-game-btn">New Game</button>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

export default {
  name: 'App',
  props: {
    gameController: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const currentGuess = ref('');
    const message = ref('');
    const messageType = ref('');
    const definition = ref(null);
    const keyboardState = ref({});
    const isInitialized = ref(false);
    const gameStateVersion = ref(0); // Force reactivity trigger
    const animatingRowIndex = ref(-1); // Track which row is currently animating

    
    const keyboardLayout = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];
    
    const gameState = computed(() => {
      // Access gameStateVersion to trigger reactivity
      gameStateVersion.value;
      return props.gameController?.getGameState() || null;
    });
    const isGameOver = computed(() => gameState.value?.isGameOver() || false);
    
    const boardRows = computed(() => {
      console.log('Computing boardRows... currentGuess:', currentGuess.value, 'gameState exists:', !!gameState.value);
      
      if (!gameState.value) {
        console.log('No gameState, creating empty grid');
        // Create empty grid with current guess in first row if typing
        const rows = [];
        for (let rowIndex = 0; rowIndex < 4; rowIndex++) {
          const row = [];
          for (let colIndex = 0; colIndex < 5; colIndex++) {
            const isCurrentRow = rowIndex === 0;
            const hasLetter = isCurrentRow && colIndex < currentGuess.value.length;
            row.push({
              letter: hasLetter ? currentGuess.value[colIndex].toUpperCase() : '',
              status: hasLetter ? 'filled' : 'empty',
              active: hasLetter
            });
          }
          rows.push(row);
        }
        return rows;
      }
      
      const guesses = gameState.value?.getGuesses() || [];
      const rows = [];
      console.log('Current guesses:', guesses.length);
      
      // Add completed guess rows with feedback
      guesses.forEach((guess, guessIndex) => {
        const feedback = guess.getFeedback();
        const isCurrentlyAnimating = animatingRowIndex.value === guessIndex;
        const row = feedback.map(letterFeedback => ({
          letter: letterFeedback.letter.toUpperCase(),
          status: isCurrentlyAnimating ? 'filled' : letterFeedback.status, // Don't show colors while animating
          active: false
        }));
        rows.push(row);
        console.log(`Added completed guess ${guessIndex + 1}:`, row.map(t => `${t.letter}(${t.status})`).join(' '));
      });
      
      // Add current guess row (if game not over and we haven't used all attempts)
      if (!isGameOver.value && rows.length < 4) {
        const currentRow = [];
        for (let i = 0; i < 5; i++) {
          const hasLetter = i < currentGuess.value.length;
          currentRow.push({
            letter: hasLetter ? currentGuess.value[i].toUpperCase() : '',
            status: hasLetter ? 'filled' : 'empty',
            active: hasLetter
          });
        }
        rows.push(currentRow);
        console.log('Added current guess row:', currentRow.map(t => t.letter || '_').join(''));
      }
      
      // Fill remaining empty rows
      while (rows.length < 4) {
        const emptyRow = Array(5).fill(null).map(() => ({
          letter: '',
          status: 'empty',
          active: false
        }));
        rows.push(emptyRow);
      }
      
      console.log(`Final board: ${rows.length} rows, ${guesses.length} completed guesses`);
      return rows;
    });
    
    const showMessage = (msg, type) => {
      message.value = msg;
      messageType.value = type;
    };
    
    const updateKeyboardState = (guess) => {
      const feedback = guess.getFeedback();
      
      feedback.forEach(letterFeedback => {
        const letter = letterFeedback.letter.toUpperCase();
        const status = letterFeedback.status;
        
        const currentStatus = keyboardState.value[letter];
        
        if (!currentStatus) {
          keyboardState.value[letter] = status;
        } else if (status === 'correct') {
          keyboardState.value[letter] = 'correct';
        } else if (status === 'present' && currentStatus !== 'correct') {
          keyboardState.value[letter] = 'present';
        }
      });
    };
    
    const resetKeyboardState = () => {
      keyboardState.value = {};
    };
    
    const handleKeyPress = (key) => {
      console.log('Key pressed:', key);
      if (!isInitialized.value || isGameOver.value || !props.gameController) return;
      
      if (key === 'ENTER') {
        console.log('Enter pressed, submitting guess:', currentGuess.value);
        handleGuessSubmit();
      } else if (key === 'BACKSPACE') {
        if (currentGuess.value.length > 0) {
          console.log('Backspace pressed, removing letter');
          currentGuess.value = currentGuess.value.slice(0, -1);
        }
        // Clear error messages when user starts editing
        if (message.value && messageType.value === 'error') {
          showMessage('', '');
        }
      } else if (currentGuess.value.length < 5) {
        console.log('Adding letter:', key);
        currentGuess.value += key;
        // Clear error messages when user starts typing
        if (message.value && messageType.value === 'error') {
          showMessage('', '');
        }
      }
      console.log('Current guess after key press:', currentGuess.value);
    };
    
    const handleGlobalKeydown = (event) => {
      if (isGameOver.value || !props.gameController) return;
      
      const key = event.key.toUpperCase();
      console.log('Global key pressed:', key);
      
      if (key === 'ENTER') {
        event.preventDefault();
        handleGuessSubmit();
      } else if (key === 'BACKSPACE') {
        event.preventDefault();
        if (currentGuess.value.length > 0) {
          currentGuess.value = currentGuess.value.slice(0, -1);
        }
        // Clear error messages when user starts editing
        if (message.value && messageType.value === 'error') {
          showMessage('', '');
        }
      } else if (/^[A-Z]$/.test(key)) {
        event.preventDefault();
        if (currentGuess.value.length < 5) {
          currentGuess.value += key;
        }
        // Clear error messages when user starts typing
        if (message.value && messageType.value === 'error') {
          showMessage('', '');
        }
      }
    };
    
    const handleGuessSubmit = async () => {
      if (isGameOver.value || !props.gameController) return;
      
      const input = currentGuess.value.trim();
      console.log('Submitting guess:', input);
      
      showMessage('', '');
      
      if (!input) {
        showMessage('Please enter a word', 'error');
        return;
      }
      
      if (input.length !== 5) {
        showMessage('Word must be 5 letters long', 'error');
        return;
      }
      
      console.log('Game state before submission:', gameState.value ? gameState.value.getGuesses()?.length : 'no game state');
      
      const result = await props.gameController.submitGuess(input);
      console.log('Submission result:', result);
      
      if (!result.success) {
        showMessage(result.error, 'error');
        return;
      }
      
      console.log('Game state after submission:', gameState.value ? gameState.value.getGuesses()?.length : 'no game state');
      
      // Force Vue to re-evaluate computed properties
      gameStateVersion.value++;
      
      // Clear current guess immediately to prevent display issues
      const submittedGuess = currentGuess.value;
      currentGuess.value = '';
      
      // Animate tile flip after clearing current guess
      if (result.guess) {
        await animateTileFlip(result.guess);
        updateKeyboardState(result.guess);
        console.log('Updated keyboard state for guess');
      }
      
      if (result.gameStatus === 'won') {
        showGameOver(true);
      } else if (result.gameStatus === 'lost') {
        showGameOver(false);
      } else {
        showMessage('', '');
        console.log('Game continues, next guess ready');
      }
    };
    
    const animateTileFlip = async (guess) => {
      const feedback = guess.getFeedback();
      const currentRowIndex = gameState.value?.getGuesses()?.length - 1 || 0;
      
      // Mark this row as animating to prevent status classes from showing
      animatingRowIndex.value = currentRowIndex;
      
      // Add flip animation to each tile with a delay
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const tile = document.querySelector(`.guess-row:nth-child(${currentRowIndex + 1}) .letter-tile:nth-child(${i + 1})`);
          if (tile) {
            tile.classList.add('flipping');
            // Add the status class halfway through the flip (at 90 degrees)
            setTimeout(() => {
              tile.classList.add(feedback[i].status);
            }, 330); // Halfway through the 0.66s animation
            // Remove flipping class when animation completes
            setTimeout(() => {
              tile.classList.remove('flipping');
            }, 660); // Full flip animation duration (0.66s)
          }
        }, i * 100); // Stagger the animations
      }
      
      // Wait for all animations to complete (last tile starts at 400ms + 660ms animation = 1060ms)
      await new Promise(resolve => setTimeout(resolve, 1060));
      
      // Clear animating state - no need to force re-render since colors are already applied
      animatingRowIndex.value = -1;
    };
    
    const showGameOver = async (won) => {
      const targetWord = gameState.value?.getTargetWord()?.toUpperCase() || 'UNKNOWN';
      
      if (won) {
        showMessage(`Congratulations! You won! The word was ${targetWord}`, 'success');
      } else {
        showMessage(`Game Over! The word was ${targetWord}`, 'error');
      }
      
      await fetchWordDefinition(targetWord);
    };
    
    const fetchWordDefinition = async (word) => {
      try {
        // Check if fetch is available (browser environment)
        if (typeof fetch === 'undefined') {
          // In Node.js environment (tests), skip API call
          definition.value = {
            word: word,
            definitions: [{
              partOfSpeech: 'noun',
              text: 'Definition not available in test environment'
            }]
          };
          return;
        }
        
        // Use WordsAPI for word definitions
        const response = await fetch(`https://wordsapiv1.p.rapidapi.com/words/${word.toLowerCase()}`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': 'e31ec18bc2mshcaa71bab98451fdp1490f9jsncceac7ee395b', // Your WordsAPI key
            'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
          }
        });
        
        // Handle 403 Forbidden (API key issues) gracefully
        if (response.status === 403) {
          definition.value = {
            word: word,
            definitions: [{
              partOfSpeech: 'uncommon word',
              text: 'This is a rare or technical English word. Definition not available with demo API key.'
            }]
          };
          return;
        }
        
        if (!response.ok) {
          // Don't throw error, just handle gracefully
          definition.value = {
            word: word,
            definitions: [{
              partOfSpeech: 'uncommon word',
              text: 'This is a rare or technical English word. Definition not available from WordsAPI.'
            }]
          };
          return;
        }
        
        const data = await response.json();
        
        // WordsAPI structure: { results: [{ definition, partOfSpeech }] }
        if (data && data.results && data.results.length > 0) {
          // Collect definitions that have typeOf (common concepts) and filter out instanceOf (proper nouns)
          const validDefinitions = data.results
            .filter(result => result.typeOf && !result.instanceOf)
            .map(result => ({
              partOfSpeech: result.partOfSpeech || 'word',
              text: result.definition || 'Definition not available'
            }));
          
          // If no valid definitions found, show all definitions as fallback
          const definitions = validDefinitions.length > 0 ? validDefinitions : 
            data.results.map(result => ({
              partOfSpeech: result.partOfSpeech || 'word',
              text: result.definition || 'Definition not available'
            }));
          
          definition.value = {
            word: word,
            definitions: definitions
          };
          
          console.log(`Found ${definitions.length} definition(s) for "${word}":`, definitions);
        } else {
          definition.value = {
            word: word,
            definitions: [{
              partOfSpeech: 'uncommon word',
              text: 'This is a rare or technical English word. Definition not available from WordsAPI.'
            }]
          };
        }
      } catch (error) {
        // Silently handle errors for uncommon words - don't log to console
        definition.value = {
          word: word,
          definitions: [{
            partOfSpeech: 'uncommon word',
            text: 'This is a rare or technical English word. Definition not available from WordsAPI.'
          }]
        };
      }
    };
    
    const handleNewGame = async () => {
      console.log('Starting new game...');
      if (!props.gameController) {
        console.error('Game controller not available');
        return;
      }
      
      showMessage('Loading new game...', 'info');
      
      try {
        await props.gameController.startNewGame();
        currentGuess.value = '';
        showMessage('', '');
        definition.value = null;
        resetKeyboardState();
        isInitialized.value = true;
        animatingRowIndex.value = -1; // Reset animation state
        gameStateVersion.value++; // Force reactivity update
        console.log('New game started, gameState:', gameState.value);
      } catch (error) {
        console.error('Failed to start new game:', error);
        showMessage('Failed to load new game. Please try again.', 'error');
      }
    };
    
    onMounted(async () => {
      console.log('Component mounted, initializing game...');
      if (props.gameController) {
        await handleNewGame();
      } else {
        console.error('Game controller not available on mount');
      }
      // Add global keyboard event listener
      document.addEventListener('keydown', handleGlobalKeydown);
    });
    
    // Clean up event listener when component unmounts
    onUnmounted(() => {
      document.removeEventListener('keydown', handleGlobalKeydown);
    });
    
    return {
      currentGuess,
      message,
      messageType,
      definition,
      keyboardState,
      keyboardLayout,
      boardRows,
      isGameOver,
      isInitialized,
      handleKeyPress,
      handleGlobalKeydown,
      handleGuessSubmit,
      handleNewGame
    };
  }
};
</script>

<style src="../public/styles.css"></style>
