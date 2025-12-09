<template>
  <div id="game-container">
    <header>
      <h1>Hard Wordle</h1>
      <div id="attempts-remaining">Attempts: {{ attemptsUsed }}/{{ maxAttempts }}</div>
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
    
    <div id="input-section">
      <input 
        v-model="currentGuess" 
        @keydown.enter="handleGuessSubmit"
        @keydown="handleKeydown"
        id="guess-input" 
        type="text" 
        maxlength="5" 
        placeholder="Enter your guess"
        :disabled="isGameOver"
        ref="guessInput"
      />
      <button @click="handleGuessSubmit" id="submit-btn" :disabled="isGameOver">Submit</button>
    </div>
    
    <div id="keyboard">
      <div v-for="(row, index) in keyboardLayout" :key="index" class="keyboard-row">
        <button
          v-for="key in row"
          :key="key"
          :class="['key', { wide: key === 'ENTER' || key === 'BACKSPACE' }, keyboardState[key]]"
          :data-key="key"
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
      <div class="definition-text">
        <em>{{ definition.partOfSpeech }}</em> - {{ definition.text }}
      </div>
    </div>
    
    <button @click="handleNewGame" id="new-game-btn">New Game</button>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue';

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
    const guessInput = ref(null);
    
    const keyboardLayout = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];
    
    const gameState = computed(() => props.gameController.getGameState());
    const isGameOver = computed(() => gameState.value?.isGameOver() || false);
    const maxAttempts = computed(() => gameState.value?.maxAttempts || 6);
    const attemptsUsed = computed(() => gameState.value?.getGuesses().length || 0);
    
    const boardRows = computed(() => {
      if (!gameState.value) return [];
      
      const guesses = gameState.value.getGuesses();
      const rows = [];
      
      // Add completed guess rows
      guesses.forEach(guess => {
        const feedback = guess.getFeedback();
        const row = feedback.map(letterFeedback => ({
          letter: letterFeedback.letter.toUpperCase(),
          status: letterFeedback.status,
          active: false
        }));
        rows.push(row);
      });
      
      // Add current guess row (if game not over)
      if (!isGameOver.value && rows.length < maxAttempts.value) {
        const currentRow = [];
        for (let i = 0; i < 5; i++) {
          currentRow.push({
            letter: i < currentGuess.value.length ? currentGuess.value[i].toUpperCase() : '',
            status: 'empty',
            active: i < currentGuess.value.length
          });
        }
        rows.push(currentRow);
      }
      
      // Fill remaining empty rows
      while (rows.length < maxAttempts.value) {
        const emptyRow = Array(5).fill(null).map(() => ({
          letter: '',
          status: 'empty',
          active: false
        }));
        rows.push(emptyRow);
      }
      
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
      if (isGameOver.value) return;
      
      if (key === 'ENTER') {
        handleGuessSubmit();
      } else if (key === 'BACKSPACE') {
        if (currentGuess.value.length > 0) {
          currentGuess.value = currentGuess.value.slice(0, -1);
        }
      } else if (currentGuess.value.length < 5) {
        currentGuess.value += key;
      }
      
      nextTick(() => {
        guessInput.value?.focus();
      });
    };
    
    const handleKeydown = (event) => {
      if (isGameOver.value) return;
      
      const key = event.key.toUpperCase();
      
      if (key === 'BACKSPACE' && currentGuess.value.length > 0) {
        // Let default behavior handle it
      } else if (/^[A-Z]$/.test(key) && currentGuess.value.length >= 5) {
        event.preventDefault();
      }
    };
    
    const handleGuessSubmit = () => {
      if (isGameOver.value) return;
      
      const input = currentGuess.value.trim();
      
      showMessage('', '');
      
      if (!input) {
        showMessage('Please enter a word', 'error');
        return;
      }
      
      const result = props.gameController.submitGuess(input);
      
      if (!result.success) {
        showMessage(result.error, 'error');
        return;
      }
      
      currentGuess.value = '';
      
      if (result.guess) {
        updateKeyboardState(result.guess);
      }
      
      if (result.gameStatus === 'won') {
        showGameOver(true);
      } else if (result.gameStatus === 'lost') {
        showGameOver(false);
      } else {
        nextTick(() => {
          guessInput.value?.focus();
        });
      }
    };
    
    const showGameOver = async (won) => {
      const targetWord = gameState.value.getTargetWord().toUpperCase();
      
      if (won) {
        showMessage(`Congratulations! You won! The word was ${targetWord}`, 'success');
      } else {
        showMessage(`Game Over! The word was ${targetWord}`, 'error');
      }
      
      await fetchWordDefinition(targetWord);
    };
    
    const fetchWordDefinition = async (word) => {
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
        
        if (!response.ok) {
          throw new Error('Definition not found');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0 && data[0].meanings && data[0].meanings.length > 0) {
          const meaning = data[0].meanings[0];
          definition.value = {
            word: word,
            partOfSpeech: meaning.partOfSpeech,
            text: meaning.definitions[0].definition
          };
        } else {
          definition.value = {
            word: word,
            partOfSpeech: '',
            text: 'Definition not available'
          };
        }
      } catch (error) {
        console.error('Error fetching definition:', error);
        definition.value = {
          word: word,
          partOfSpeech: '',
          text: 'Definition not available'
        };
      }
    };
    
    const handleNewGame = () => {
      props.gameController.startNewGame();
      currentGuess.value = '';
      showMessage('', '');
      definition.value = null;
      resetKeyboardState();
      
      nextTick(() => {
        guessInput.value?.focus();
      });
    };
    
    onMounted(() => {
      handleNewGame();
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
      maxAttempts,
      attemptsUsed,
      guessInput,
      handleKeyPress,
      handleKeydown,
      handleGuessSubmit,
      handleNewGame
    };
  }
};
</script>

<style src="../public/styles.css"></style>
