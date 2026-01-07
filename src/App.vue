<template>
  <v-app>
    <v-main>
      <v-container fluid class="game-container pa-2">
        <!-- Header -->
        <v-row justify="center" class="mb-4">
          <v-col cols="12" class="text-center">
            <div class="header-top d-flex align-center justify-space-between">
              <div class="d-flex ga-2">
                <v-btn
                  icon
                  @click="showConfigPage = true"
                  :disabled="isGameActive"
                  :title="isGameActive ? 'Settings disabled during gameplay' : 'Settings'"
                  class="config-btn"
                >
                  <v-icon>mdi-cog</v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="showRulesPage = true"
                  :title="'Game Rules & Scoring'"
                  class="rules-btn"
                >
                  <v-icon>mdi-help-circle</v-icon>
                </v-btn>
              </div>
              
              <h1 class="text-h3 font-weight-bold">Hurdle</h1>
              
              <div class="header-spacer" style="width: 96px;"></div>
            </div>
            
            <!-- Progress Display -->
            <div class="hurdle-progress mt-2">
              <div class="hurdle-info d-flex flex-wrap justify-center align-center ga-2">
                <v-chip color="primary" variant="outlined" size="small" class="hurdle-number">
                  Hurdle {{ hurdleNumber }}
                </v-chip>
                <v-chip color="success" variant="outlined" size="small">
                  Completed: {{ completedHurdlesCount }}
                </v-chip>
                <v-chip color="warning" variant="outlined" size="small" class="current-score">
                  Score: {{ totalScore }}
                </v-chip>
                <v-chip 
                  v-if="hardMode" 
                  color="error" 
                  variant="outlined" 
                  size="small"
                >
                  HARD MODE
                </v-chip>
              </div>
            </div>
          </v-col>
        </v-row>
        <!-- Game Board -->
        <v-row justify="center" class="mb-4">
          <v-col cols="12" sm="10" md="8" lg="6" xl="4">
            <div id="game-board" class="game-board">
              <v-row 
                v-for="(row, index) in boardRows" 
                :key="`row-${index}-${gameStateVersion}`"
                class="guess-row ma-0 mb-2"
                no-gutters
                justify="center"
              >
                <v-col 
                  v-for="(tile, tileIndex) in row" 
                  :key="`tile-${index}-${tileIndex}-${tile.letter}-${gameStateVersion}`"
                  cols="2"
                  class="pa-1"
                  style="max-width: 70px;"
                >
                  <v-card
                    :class="['letter-tile', tile.status, { active: tile.active }]"
                    :color="getTileColor(tile.status)"
                    variant="outlined"
                    class="d-flex align-center justify-center tile-square"
                  >
                    <span class="tile-letter text-h4 font-weight-bold">{{ tile.letter }}</span>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
        <!-- Keyboard -->
        <v-row justify="center" class="mb-4">
          <v-col cols="12" sm="10" md="8" lg="6" xl="4">
            <div class="keyboard">
              <v-row 
                v-for="(row, index) in keyboardLayout" 
                :key="index" 
                class="keyboard-row ma-0 mb-2"
                justify="center"
                no-gutters
              >
                <v-col
                  v-for="key in row"
                  :key="key"
                  class="pa-1"
                  :style="getKeyColumnStyle(key, row.length)"
                >
                  <v-btn
                    :class="['key', keyboardState[key]]"
                    :color="getKeyColor(keyboardState[key])"
                    :disabled="!isInitialized"
                    @click="handleKeyPress(key)"
                    :height="getKeyHeight()"
                    block
                    variant="elevated"
                    :size="getKeySize(key)"
                  >
                    <span class="key-text">{{ key === 'BACKSPACE' ? '⌫' : key }}</span>
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
        <!-- Message Area -->
        <v-row v-if="message" justify="center" class="mb-4">
          <v-col cols="12" sm="10" md="8" lg="6" xl="4">
            <v-alert
              :type="getAlertType(messageType)"
              :color="getAlertColor(messageType)"
              variant="tonal"
              class="text-center message-alert"
            >
              {{ message }}
            </v-alert>
          </v-col>
        </v-row>

        <!-- Hurdle Score Display -->
        <v-row v-if="lastHurdleScore > 0" justify="center" class="mb-4">
          <v-col cols="12" sm="10" md="8" lg="6" xl="4">
            <v-alert
              type="success"
              color="success"
              variant="tonal"
              class="text-center"
            >
              +{{ lastHurdleScore }} points for Hurdle {{ lastCompletedHurdleNumber }}!
            </v-alert>
          </v-col>
        </v-row>
        <!-- Word Definition -->
        <v-row v-if="definition && gameConfig.getShowDefinitions() && configVersion >= 0" justify="center" class="mb-4">
          <v-col cols="12" sm="10" md="8" lg="6" xl="4">
            <v-card>
              <v-card-title class="text-h6 font-weight-bold text-center">
                {{ definition.word.toUpperCase() }}
              </v-card-title>
              <v-card-text>
                <div v-for="(def, index) in definition.definitions" :key="index" class="mb-2">
                  <v-chip size="small" color="primary" variant="outlined" class="mr-2">
                    {{ def.partOfSpeech }}
                  </v-chip>
                  <span>{{ def.text }}</span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- New Game Button -->
        <v-row justify="center" class="mb-4">
          <v-col cols="12" sm="10" md="8" lg="6" xl="4">
            <v-btn
              @click="handleNewGame"
              color="primary"
              size="large"
              block
              variant="elevated"
            >
              New Game
            </v-btn>
          </v-col>
        </v-row>
        <!-- Game End Summary -->
        <v-row v-if="hurdleGameEnded" justify="center" class="mb-4">
          <v-col cols="12" sm="10" md="8" lg="6" xl="4">
            <v-card>
              <v-card-title class="text-h5 text-center">
                Game Complete!
              </v-card-title>
              <v-card-text>
                <v-row class="text-center">
                  <v-col cols="6">
                    <div class="text-h6 font-weight-bold">{{ completedHurdlesCount }}</div>
                    <div class="text-caption">Hurdles Completed</div>
                  </v-col>
                  <v-col cols="6">
                    <div class="text-h6 font-weight-bold">{{ totalScore }}</div>
                    <div class="text-caption">Final Score</div>
                  </v-col>
                </v-row>
                
                <!-- Solved Words Access -->
                <div v-if="solvedWords.length > 0" class="mt-4">
                  <v-divider class="mb-3"></v-divider>
                  <h4 class="text-h6 mb-3">Words You Solved:</h4>
                  <div class="d-flex flex-wrap ga-2">
                    <v-chip
                      v-for="word in solvedWords"
                      :key="word"
                      @click="viewWordDefinition(word)"
                      :color="selectedWordForDefinition === word ? 'primary' : 'default'"
                      :variant="selectedWordForDefinition === word ? 'elevated' : 'outlined'"
                      clickable
                    >
                      {{ word.toUpperCase() }}
                    </v-chip>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Word Definition Viewer for Solved Words -->
        <v-row v-if="selectedWordDefinition" justify="center" class="mb-4">
          <v-col cols="12" sm="10" md="8" lg="6" xl="4">
            <v-card>
              <v-card-title class="d-flex justify-space-between align-center">
                <span class="text-h6">{{ selectedWordDefinition.word.toUpperCase() }}</span>
                <v-btn
                  @click="closeWordDefinition"
                  icon
                  size="small"
                  variant="text"
                >
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-title>
              <v-card-text>
                <div v-for="(def, index) in selectedWordDefinition.definitions" :key="index" class="mb-2">
                  <v-chip size="small" color="primary" variant="outlined" class="mr-2">
                    {{ def.partOfSpeech }}
                  </v-chip>
                  <span>{{ def.text }}</span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Configuration Page -->
    <ConfigPage 
      v-if="showConfigPage"
      :gameActive="isGameActive"
      @close="showConfigPage = false"
      @configChanged="handleConfigChange"
    />

    <!-- Game Rules Page -->
    <GameRulesPage 
      v-if="showRulesPage"
      @close="showRulesPage = false"
    />
  </v-app>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import FeedbackGenerator from './FeedbackGenerator.js';
import GameConfig from './GameConfig.js';
import ConfigPage from './ConfigPage.vue';
import GameRulesPage from './GameRulesPage.vue';
import { WORDS_API_CONFIG } from './config.js';

export default {
  name: 'App',
  components: {
    ConfigPage,
    GameRulesPage
  },
  props: {
    gameController: {
      type: Object,
      required: true
    },
    dictionary: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const gameConfig = new GameConfig();
    const showConfigPage = ref(false);
    const showRulesPage = ref(false);
    const configVersion = ref(0); // Force reactivity for config changes
    const maxGuesses = ref(gameConfig.getMaxGuesses()); // Reactive max guesses
    const hardMode = ref(gameConfig.getHardMode()); // Reactive hard mode
    
    const currentGuess = ref('');
    const message = ref('');
    const messageType = ref('');
    const definition = ref(null);
    const keyboardState = ref({});
    const isInitialized = ref(false);
    const gameStateVersion = ref(0); // Force reactivity trigger
    const animatingRowIndex = ref(-1); // Track which row is currently animating

    // Game State
    const hurdleController = ref(null);
    const hurdleNumber = ref(1);
    const completedHurdlesCount = ref(0);
    const totalScore = ref(0);
    const lastHurdleScore = ref(0);
    const lastCompletedHurdleNumber = ref(0);
    const hurdleGameEnded = ref(false);
    const isTransitioning = ref(false);
    
    // Word Definition State (Requirement 8.2, 8.3)
    const solvedWords = ref([]);
    const selectedWordForDefinition = ref(null);
    const selectedWordDefinition = ref(null);

    
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
    
    // Game state tracking
    const isGameActive = computed(() => {
      if (!gameState.value) return false;
      
      const status = gameState.value.getGameStatus();
      const hasGuesses = gameState.value.getGuesses().length > 0;
      
      // Game is active if it's in progress and has at least one guess
      return status === 'in-progress' && hasGuesses;
    });
    
    const boardRows = computed(() => {
      // Use reactive maxGuesses instead of calling gameConfig.getMaxGuesses()
      const maxGuessesValue = maxGuesses.value;
      
      console.log('=== BOARD ROWS DEBUG ===');
      console.log('maxGuessesValue:', maxGuessesValue);
      console.log('gameState exists:', !!gameState.value);
      console.log('isGameOver:', isGameOver.value);
      console.log('currentGuess.value:', currentGuess.value);
      
      if (!gameState.value) {
        console.log('No game state - creating empty grid');
        // Create empty grid with current guess in first row if typing
        const rows = [];
        for (let rowIndex = 0; rowIndex < maxGuessesValue; rowIndex++) {
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
        console.log('Returning empty grid rows:', rows.length);
        console.log('=== END BOARD ROWS DEBUG ===');
        return rows;
      }
      
      const guesses = gameState.value?.getGuesses() || [];
      const rows = [];
      
      console.log('Number of guesses:', guesses.length);
      
      // Add completed guess rows with feedback
      guesses.forEach((guess, guessIndex) => {
        const feedback = guess.getFeedback();
        const isCurrentlyAnimating = animatingRowIndex.value === guessIndex;
        const row = feedback.map(letterFeedback => ({
          letter: letterFeedback.letter.toUpperCase(),
          status: isCurrentlyAnimating ? 'filled' : letterFeedback.status, // Hide colors during animation
          active: false
        }));
        rows.push(row);
      });
      
      console.log('Rows after adding guesses:', rows.length);
      console.log('Should add current guess row?', !isGameOver.value && rows.length < maxGuessesValue);
      
      // Add current guess row (if game not over and we haven't used all attempts)
      if (!isGameOver.value && rows.length < maxGuessesValue) {
        console.log('Adding current guess row with currentGuess:', currentGuess.value);
        const currentRow = [];
        for (let i = 0; i < 5; i++) {
          const hasLetter = i < currentGuess.value.length;
          const tileData = {
            letter: hasLetter ? currentGuess.value[i].toUpperCase() : '',
            status: hasLetter ? 'filled' : 'empty',
            active: hasLetter
          };
          currentRow.push(tileData);
          if (i === 0) {
            console.log('First tile data:', tileData);
          }
        }
        rows.push(currentRow);
        console.log('Current row added:', currentRow);
      } else {
        console.log('NOT adding current guess row');
      }
      
      // Fill remaining empty rows up to maxGuessesValue
      while (rows.length < maxGuessesValue) {
        const emptyRow = Array(5).fill(null).map(() => ({
          letter: '',
          status: 'empty',
          active: false
        }));
        rows.push(emptyRow);
      }
      
      console.log('Final rows count:', rows.length);
      console.log('=== END BOARD ROWS DEBUG ===');
      
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

    const filterInappropriateContent = (definitions) => {
      // List of inappropriate content patterns to filter out
      const inappropriatePatterns = [
        /\(ethnic slur\)/i,
        /\(racial slur\)/i,
        /\(offensive\)/i,
        /\(derogatory\)/i,
        /\(slur\)/i
      ];
      
      return definitions.filter(def => {
        // Check if the definition text contains any inappropriate patterns
        const hasInappropriateContent = inappropriatePatterns.some(pattern => 
          pattern.test(def.text)
        );
        
        return !hasInappropriateContent;
      });
    };

    const updateKeyboardStateForHurdle = (autoGuess, targetWord) => {
      // Reset keyboard state first
      resetKeyboardState();
      
      // Update keyboard based on the auto-guess feedback
      if (autoGuess && targetWord) {
        const feedback = FeedbackGenerator.generateFeedback(autoGuess.toLowerCase(), targetWord.toLowerCase());
        
        for (let i = 0; i < autoGuess.length; i++) {
          const letter = autoGuess[i].toLowerCase();
          const status = feedback[i].status;
          
          // Update keyboard state with the feedback from auto-guess
          if (!keyboardState.value[letter] || 
              (keyboardState.value[letter] !== 'correct' && status === 'correct') ||
              (keyboardState.value[letter] === 'absent' && status === 'present')) {
            keyboardState.value[letter] = status;
          }
        }
      }
    };
    
    const handleKeyPress = (key) => {
      console.log('=== KEY PRESS DEBUG ===');
      console.log('Key pressed:', key);
      console.log('isInitialized:', isInitialized.value);
      console.log('isGameOver:', isGameOver.value);
      console.log('gameController exists:', !!props.gameController);
      console.log('gameState exists:', !!gameState.value);
      console.log('gameState status:', gameState.value?.getGameStatus());
      console.log('current guess length:', currentGuess.value.length);
      console.log('=== END DEBUG ===');
      
      if (!isInitialized.value || isGameOver.value || !props.gameController) return;
      
      if (key === 'ENTER') {
        handleGuessSubmit();
      } else if (key === 'BACKSPACE') {
        if (currentGuess.value.length > 0) {
          currentGuess.value = currentGuess.value.slice(0, -1);
        }
        // Clear error messages when user starts editing
        if (message.value && messageType.value === 'error') {
          showMessage('', '');
        }
      } else if (currentGuess.value.length < 5) {
        currentGuess.value += key;
        console.log('Added letter, new currentGuess:', currentGuess.value);
        // Clear error messages when user starts typing
        if (message.value && messageType.value === 'error') {
          showMessage('', '');
        }
      }
    };
    
    const handleGlobalKeydown = (event) => {
      console.log('=== GLOBAL KEYDOWN DEBUG ===');
      console.log('Global keydown event captured:', event.key);
      console.log('isGameOver:', isGameOver.value);
      console.log('gameController exists:', !!props.gameController);
      console.log('=== END GLOBAL KEYDOWN DEBUG ===');
      
      if (isGameOver.value || !props.gameController) return;
      
      const key = event.key.toUpperCase();
      
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
        console.log('Letter key detected:', key);
        console.log('Current guess before:', currentGuess.value);
        console.log('Current guess length:', currentGuess.value.length);
        
        if (currentGuess.value.length < 5) {
          currentGuess.value += key;
          console.log('Letter added! New currentGuess:', currentGuess.value);
        } else {
          console.log('Cannot add letter - already at max length');
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
      
      showMessage('', '');
      
      if (!input) {
        showMessage('Please enter a word', 'error');
        return;
      }
      
      if (input.length !== 5) {
        showMessage('Word must be 5 letters long', 'error');
        return;
      }
      
      const result = await props.gameController.submitGuess(input);
      
      if (!result.success) {
        showMessage(result.error, 'error');
        return;
      }
      
      // Force Vue to re-evaluate computed properties
      gameStateVersion.value++;
      
      // Clear current guess immediately to prevent display issues
      const submittedGuess = currentGuess.value;
      currentGuess.value = '';
      
      // Animate tile flip after clearing current guess
      if (result.guess) {
        await animateTileFlip(result.guess);
        // Only update keyboard state if this isn't a winning guess that will trigger hurdle transition
        if (result.gameStatus !== 'won') {
          updateKeyboardState(result.guess);
        }
      }
      
      if (result.gameStatus === 'won') {
        showGameOver(true);
      } else if (result.gameStatus === 'lost') {
        showGameOver(false);
      } else {
        showMessage('', '');
      }
    };
    
    const animateTileFlip = async (guess) => {
      const feedback = guess.getFeedback();
      const currentRowIndex = gameState.value?.getGuesses()?.length - 1 || 0;
      
      // Mark this row as animating to prevent status classes from showing
      animatingRowIndex.value = currentRowIndex;
      
      // Animation timeout handling
      const animationTimeout = 3000; // 3 second timeout
      let animationCompleted = false;
      
      // Set up timeout to prevent hanging animations
      const timeoutId = setTimeout(() => {
        if (!animationCompleted) {
          console.warn('Tile flip animation timed out, forcing completion');
          animatingRowIndex.value = -1;
          
          // Force apply status classes immediately
          const tiles = document.querySelectorAll(`.guess-row:nth-child(${currentRowIndex + 1}) .letter-tile`);
          tiles.forEach((tile, index) => {
            if (tile && feedback[index]) {
              tile.classList.remove('flipping');
              tile.style.backgroundColor = '';
              tile.style.borderColor = '';
              tile.classList.add(feedback[index].status);
            }
          });
        }
      }, animationTimeout);
      
      try {
        // Get all tiles in the current row
        const rowSelector = `.guess-row:nth-child(${currentRowIndex + 1})`;
        const row = document.querySelector(rowSelector);
        
        if (!row) {
          console.warn('Row not found for animation');
          animatingRowIndex.value = -1;
          return;
        }
        
        const tiles = row.querySelectorAll('.letter-tile');
        
        if (tiles.length === 0) {
          console.warn('No tiles found for animation');
          animatingRowIndex.value = -1;
          return;
        }
        
        // Add flip animation to each tile with a delay
        tiles.forEach((tile, i) => {
          setTimeout(() => {
            if (tile && feedback[i]) {
              console.log(`Starting flip for tile ${i} at ${Date.now()}`);
              
              // Capture the current border color (should be white from guessed letter)
              const currentBorderColor = window.getComputedStyle(tile).borderColor;
              console.log(`Preserving border color: ${currentBorderColor} for tile ${i}`);
              
              // Start with neutral background but preserve the current border
              tile.classList.remove('correct', 'present', 'absent', 'filled');
              tile.classList.add('flipping');
              
              // Force neutral background and preserve the white border
              tile.style.backgroundColor = '#121213';
              tile.style.borderColor = currentBorderColor; // Keep the white border
              
              // Add the status class halfway through THIS tile's flip (at 90 degrees)
              setTimeout(() => {
                if (feedback[i]) {
                  console.log(`Adding color ${feedback[i].status} to tile ${i} at ${Date.now()}`);
                  // Remove only the background color inline style first
                  tile.style.backgroundColor = '';
                  // Add status class which will provide the new background color
                  tile.classList.add(feedback[i].status);
                  // Delay removing border until after the flip is complete to maintain white border longer
                  setTimeout(() => {
                    // Now remove the border inline style to let status class border take effect
                    tile.style.borderColor = '';
                  }, 200); // 200ms delay to keep white border visible longer during flip
                }
              }, 330); // 330ms after THIS tile starts flipping
              
              // Remove flipping class when THIS tile's animation completes
              setTimeout(() => {
                console.log(`Completing flip for tile ${i} at ${Date.now()}`);
                tile.classList.remove('flipping');
              }, 660); // 660ms after THIS tile starts flipping
            }
          }, i * 100); // Each tile starts 100ms after the previous one
        });
        
        // Wait for all animations to complete properly
        // Last tile starts at 400ms (4 * 100ms) + 660ms animation = 1060ms total
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        animationCompleted = true;
        clearTimeout(timeoutId);
        
        // Clear animating state
        animatingRowIndex.value = -1;
        
      } catch (error) {
        console.error('Error during tile flip animation:', error);
        animationCompleted = true;
        clearTimeout(timeoutId);
        animatingRowIndex.value = -1;
      }
    };
    
    const showGameOver = async (won) => {
      const targetWord = gameState.value?.getTargetWord()?.toUpperCase() || 'UNKNOWN';
      
      if (won) {
        // Add celebration animations for correct word
        await triggerCelebrationAnimation();
        
        // Handle hurdle completion
        await handleHurdleCompletion(gameState.value);
      } else {
        // Handle hurdle failure
        await handleHurdleFailure();
      }
    };

    const triggerCelebrationAnimation = async () => {
      try {
        // Get the winning row (last completed guess)
        const guesses = gameState.value?.getGuesses() || [];
        if (guesses.length === 0) return;
        
        const winningRowIndex = guesses.length - 1;
        const winningRow = document.querySelector(`.guess-row:nth-child(${winningRowIndex + 1})`);
        
        if (!winningRow) {
          console.warn('Winning row not found for celebration animation');
          return;
        }
        
        const tiles = winningRow.querySelectorAll('.letter-tile.correct');
        
        if (tiles.length === 0) {
          console.warn('No correct tiles found for celebration animation');
          return;
        }
        
        // Add celebration class to the winning row
        winningRow.classList.add('celebrating');
        
        // Add celebration animation to each correct tile with staggered timing
        tiles.forEach((tile, index) => {
          setTimeout(() => {
            tile.classList.add('celebrating');
            
            // Create confetti particles around the tile
            createConfettiParticles(tile);
          }, index * 100); // Stagger by 100ms per tile
        });
        
        // Create success message animation
        const messageArea = document.querySelector('.message-alert');
        if (messageArea) {
          messageArea.classList.add('success-message');
        }
        
        // Wait for animations to complete
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Clean up animation classes
        winningRow.classList.remove('celebrating');
        tiles.forEach(tile => {
          tile.classList.remove('celebrating');
        });
        
        if (messageArea) {
          messageArea.classList.remove('success-message');
        }
        
        // Remove any remaining confetti particles
        const particles = document.querySelectorAll('.celebration-particle');
        particles.forEach(particle => particle.remove());
        
      } catch (error) {
        console.error('Error during celebration animation:', error);
        // Don't let animation errors break the game flow
      }
    };

    const createConfettiParticles = (tile) => {
      try {
        const rect = tile.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create 8 particles around the tile
        for (let i = 0; i < 8; i++) {
          const particle = document.createElement('div');
          particle.className = 'celebration-particle';
          
          // Position particle at tile center
          particle.style.position = 'fixed';
          particle.style.left = centerX + 'px';
          particle.style.top = centerY + 'px';
          particle.style.zIndex = '9999';
          
          // Random direction and distance
          const angle = (i / 8) * 2 * Math.PI;
          const distance = 50 + Math.random() * 30;
          const endX = centerX + Math.cos(angle) * distance;
          const endY = centerY + Math.sin(angle) * distance - 50; // Upward bias
          
          // Set CSS custom properties for animation
          particle.style.setProperty('--end-x', endX + 'px');
          particle.style.setProperty('--end-y', endY + 'px');
          
          document.body.appendChild(particle);
          
          // Remove particle after animation
          setTimeout(() => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          }, 1500);
        }
      } catch (error) {
        console.error('Error creating confetti particles:', error);
      }
    };
    
    const fetchWordDefinition = async (word) => {
      // Check if definitions should be shown
      if (!gameConfig.getShowDefinitions()) {
        definition.value = null;
        return;
      }
      
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
            'X-RapidAPI-Key': WORDS_API_CONFIG.API_KEY, // Your WordsAPI key
            'X-RapidAPI-Host': WORDS_API_CONFIG.HOST
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
          let definitions = validDefinitions.length > 0 ? validDefinitions : 
            data.results.map(result => ({
              partOfSpeech: result.partOfSpeech || 'word',
              text: result.definition || 'Definition not available'
            }));
          
          // Filter out inappropriate content
          definitions = filterInappropriateContent(definitions);
          
          // If all definitions were filtered out, provide a safe fallback
          if (definitions.length === 0) {
            definitions = [{
              partOfSpeech: 'word',
              text: 'Definition not available due to content restrictions.'
            }];
          }
          
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
    
    const initializeHurdleController = async () => {
      if (!hurdleController.value && props.dictionary) {
        const HurdleController = (await import('./HurdleController.js')).default;
        hurdleController.value = new HurdleController(props.dictionary);
      }
    };

    const handleNewGame = async () => {
      if (!props.gameController) {
        console.error('Game controller not available');
        return;
      }
      
      showMessage('Loading new game...', 'info');
      
      try {
        // Always start the game
        if (!props.dictionary) {
          showMessage('Dictionary not available', 'error');
          return;
        }

        // Ensure hurdle controller is initialized
        await initializeHurdleController();
        
        await startHurdleMode();
      } catch (error) {
        console.error('Failed to start new game:', error);
        showMessage('Failed to load new game. Please try again.', 'error');
      }
    };

    const startHurdleMode = async () => {
      if (!hurdleController.value) return;
      
      try {
        // Start hurdle mode session with configuration
        // Use reactive values that are updated immediately in handleConfigChange
        const maxGuessesValue = maxGuesses.value;
        
        // Force fresh config reload to ensure we get the latest settings from localStorage
        console.log('Reloading config from localStorage before starting game...');
        gameConfig.config = gameConfig.loadConfig();
        
        // Get fresh frequency range from config after reload
        const currentDifficulty = gameConfig.getDifficulty();
        const frequencyRange = gameConfig.getFrequencyRange();
        const hardModeValue = hardMode.value; // Use reactive value
        
        console.log('=== STARTING HURDLE MODE DEBUG ===');
        console.log('- Current difficulty from config:', currentDifficulty);
        console.log('- Max guesses:', maxGuessesValue);
        console.log('- Frequency range from config:', frequencyRange);
        console.log('- Expected frequency for', currentDifficulty + ':', 
          currentDifficulty === 'easy' ? '{ min: 5.5, max: 7.0 }' :
          currentDifficulty === 'medium' ? '{ min: 4.0, max: 5.49 }' :
          currentDifficulty === 'hard' ? '{ min: 0, max: 4.0 }' : 'unknown');
        console.log('- Hard mode (reactive):', hardModeValue);
        console.log('- Hard mode (from config):', gameConfig.getHardMode());
        console.log('- Show definitions:', gameConfig.getShowDefinitions());
        console.log('=== END DEBUG ===');
        
        const session = await hurdleController.value.startHurdleMode(maxGuessesValue, frequencyRange, hardModeValue);
        
        // Update UI state
        hurdleGameEnded.value = false;
        updateHurdleUI();
        
        // Start first hurdle with configuration settings
        const gameController = hurdleController.value.getCurrentGameController();
        if (gameController) {
          // Update the current game controller reference
          Object.setPrototypeOf(props.gameController, Object.getPrototypeOf(gameController));
          Object.assign(props.gameController, gameController);
        }
        
        // Reset UI state
        currentGuess.value = '';
        showMessage('', '');
        definition.value = null;
        resetKeyboardState();
        lastHurdleScore.value = 0;
        lastCompletedHurdleNumber.value = 0;
        
        // Clear word definition state
        solvedWords.value = [];
        selectedWordForDefinition.value = null;
        selectedWordDefinition.value = null;
        
        isInitialized.value = true;
        animatingRowIndex.value = -1;
        gameStateVersion.value++;
        
        showMessage(`Game started! Complete hurdles to build your score. (${maxGuessesValue} guesses, ${gameConfig.getDifficulty()} difficulty)`, 'info');
        setTimeout(() => showMessage('', ''), 4000);
        
      } catch (error) {
        console.error('Failed to start game:', error);
        showMessage('Failed to start game. Please try again.', 'error');
      }
    };

    const updateHurdleUI = () => {
      if (!hurdleController.value) {
        console.warn('Hurdle controller not available for UI update');
        return;
      }
      
      try {
        const hurdleState = hurdleController.value.getHurdleState();
        
        // Validate hurdle state before updating UI
        if (!hurdleState.validateState()) {
          console.warn('Hurdle state validation failed, attempting recovery...');
          const recoveryResult = hurdleState.detectAndRecoverFromCorruption();
          
          if (!recoveryResult.success) {
            console.error('Failed to recover hurdle state, UI may be inconsistent');
            showMessage('Warning: Game state inconsistency detected', 'error');
            return;
          } else {
            console.log('Hurdle state recovered successfully');
            if (recoveryResult.actionsPerformed.length > 0) {
              console.log('Recovery actions:', recoveryResult.actionsPerformed);
            }
          }
        }
        
        const previousScore = totalScore.value;
        
        // Update UI state with validation
        const newHurdleNumber = hurdleState.getCurrentHurdleNumber();
        const newCompletedCount = hurdleState.getCompletedHurdlesCount();
        const newTotalScore = hurdleState.getTotalScore();
        const newSolvedWords = hurdleState.getSolvedWords();
        
        // Validate the new values before applying
        if (typeof newHurdleNumber !== 'number' || newHurdleNumber < 1) {
          console.error('Invalid hurdle number:', newHurdleNumber);
          return;
        }
        
        if (typeof newCompletedCount !== 'number' || newCompletedCount < 0) {
          console.error('Invalid completed count:', newCompletedCount);
          return;
        }
        
        if (typeof newTotalScore !== 'number' || newTotalScore < 0) {
          console.error('Invalid total score:', newTotalScore);
          return;
        }
        
        if (!Array.isArray(newSolvedWords)) {
          console.error('Invalid solved words array:', newSolvedWords);
          return;
        }
        
        // Apply updates
        hurdleNumber.value = newHurdleNumber;
        completedHurdlesCount.value = newCompletedCount;
        totalScore.value = newTotalScore;
        solvedWords.value = [...newSolvedWords]; // Create copy to prevent mutation
        
        // Animate score update if score changed
        if (totalScore.value !== previousScore) {
          animateScoreUpdate();
        }
        
        // Force Vue reactivity update
        gameStateVersion.value++;
        
      } catch (error) {
        console.error('Error updating hurdle UI:', error);
        showMessage('Error updating game display', 'error');
      }
    };

    const animateScoreUpdate = () => {
      try {
        const scoreElement = document.querySelector('.current-score');
        if (!scoreElement) {
          console.warn('Score element not found, skipping animation');
          return;
        }
        
        scoreElement.classList.add('score-updated');
        
        // Remove animation class after animation completes with timeout
        const timeoutId = setTimeout(() => {
          try {
            scoreElement.classList.remove('score-updated');
          } catch (error) {
            console.warn('Error removing score animation class:', error);
          }
        }, 600);
        
        // Store timeout ID for potential cleanup (but don't use onUnmounted here)
        // The timeout will clean up automatically when it completes
        
      } catch (error) {
        console.error('Error during score animation:', error);
      }
    };

    const handleHurdleCompletion = async (gameState) => {
      if (!hurdleController.value) {
        console.error('Hurdle completion called without active controller');
        return;
      }
      
      const maxRetries = 2;
      let retryCount = 0;
      
      while (retryCount <= maxRetries) {
        try {
          // Validate game state
          if (!gameState || typeof gameState.getGameStatus !== 'function') {
            throw new Error('Invalid game state provided to hurdle completion');
          }
          
          if (gameState.getGameStatus() !== 'won') {
            throw new Error('Hurdle completion called for non-won game state');
          }
          
          // Process hurdle completion with state validation
          const transition = await hurdleController.value.processHurdleCompletion(gameState);
          
          if (!transition || !transition.completedHurdle) {
            throw new Error('Invalid transition data returned from hurdle completion');
          }
          
          // Update UI with score
          lastHurdleScore.value = transition.completedHurdle.getScore();
          lastCompletedHurdleNumber.value = transition.completedHurdle.getHurdleNumber();
          
          // Update hurdle UI with error handling
          try {
            updateHurdleUI();
          } catch (uiError) {
            console.error('UI update failed during hurdle completion:', uiError);
            // Continue with completion process despite UI error
          }
          
          // Show score notification with animation
          showMessage(`Hurdle ${lastCompletedHurdleNumber.value} complete! +${lastHurdleScore.value} points`, 'success');
          
          // Provide option to view definition of completed word (Requirement 8.1)
          const completedWord = transition.completedHurdle.getTargetWord();
          setTimeout(() => {
            showMessage(`Hurdle ${lastCompletedHurdleNumber.value} complete! +${lastHurdleScore.value} points. Click "${completedWord.toUpperCase()}" below to see definition.`, 'success');
          }, 2000);
          
          // Execute hurdle transition animation sequence
          await executeHurdleTransitionAnimation(transition);
          
          // Success - break out of retry loop
          break;
          
        } catch (error) {
          console.error(`Hurdle completion attempt ${retryCount + 1} failed:`, error);
          
          if (retryCount < maxRetries) {
            retryCount++;
            showMessage(`Processing hurdle failed, retrying... (${retryCount}/${maxRetries})`, 'error');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
          } else {
            // All retries exhausted
            console.error('All hurdle completion attempts failed, ending session');
            showMessage('Error processing hurdle completion. Ending session.', 'error');
            await handleHurdleFailure();
            break;
          }
        }
      }
    };

    const executeHurdleTransitionAnimation = async (transition) => {
      const maxRetries = 2;
      let retryCount = 0;
      
      while (retryCount <= maxRetries) {
        try {
          // Step 1: Start next hurdle first to get the correct target word
          let nextGameState;
          try {
            nextGameState = await hurdleController.value.startNextHurdle(transition.animationData.autoGuess);
          } catch (error) {
            console.error('Failed to start next hurdle:', error);
            
            if (retryCount < maxRetries) {
              console.log(`Retrying hurdle transition (attempt ${retryCount + 1}/${maxRetries + 1})`);
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
              continue;
            } else {
              throw new Error(`Failed to start next hurdle after ${maxRetries + 1} attempts: ${error.message}`);
            }
          }
          
          // Step 2: Get the next target word for proper feedback generation
          const gameController = hurdleController.value.getCurrentGameController();
          const nextTargetWord = gameController?.getGameState()?.getTargetWord();
          
          // Step 3: Single unified hurdle transition animation with correct target word (Requirement 3.1, 3.2)
          await animateHurdleTransition(transition.animationData.autoGuess, nextTargetWord);
          
          // Step 4: Update game controller reference with validation
          if (!gameController) {
            throw new Error('Game controller not available after hurdle start');
          }
          
          // Validate game state before proceeding
          if (!nextGameState || typeof nextGameState.getGameStatus !== 'function') {
            throw new Error('Invalid game state returned from next hurdle');
          }
          
          Object.setPrototypeOf(props.gameController, Object.getPrototypeOf(gameController));
          Object.assign(props.gameController, gameController);
          
          // Step 5: Update hurdle number with animation (Requirement 3.4)
          await animateHurdleNumberUpdate();
          
          // Step 6: Clear score notification and show transition message
          lastHurdleScore.value = 0;
          showMessage(`Starting Hurdle ${hurdleNumber.value}...`, 'info');
          setTimeout(() => showMessage('', ''), 2000);
          
          // Step 7: Force UI update with validation (Requirement 3.5)
          try {
            updateHurdleUI();
            gameStateVersion.value++;
            
            // Ensure input is enabled after transition
            isInitialized.value = true;
            
            console.log('=== POST-TRANSITION DEBUG ===');
            console.log('isInitialized set to:', isInitialized.value);
            console.log('gameController exists:', !!gameController);
            console.log('gameState exists:', !!nextGameState);
            console.log('gameState status:', nextGameState?.getGameStatus());
            console.log('gameState isGameOver:', nextGameState?.isGameOver());
            console.log('remaining attempts:', nextGameState?.getRemainingAttempts());
            console.log('currentGuess after transition:', currentGuess.value);
            console.log('=== END POST-TRANSITION DEBUG ===');
            
          } catch (uiError) {
            console.error('UI update failed during transition:', uiError);
            // Continue anyway - UI issues shouldn't break gameplay
          }
          
          // Step 8: Check if auto-guess immediately won the next hurdle
          if (nextGameState.getGameStatus() === 'won') {
            // Handle immediate win from auto-guess
            setTimeout(() => handleHurdleCompletion(nextGameState), 1000);
          }
          
          // Success - break out of retry loop
          break;
          
        } catch (error) {
          console.error(`Hurdle transition attempt ${retryCount + 1} failed:`, error);
          
          if (retryCount < maxRetries) {
            retryCount++;
            showMessage(`Transition failed, retrying... (${retryCount}/${maxRetries})`, 'error');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
          } else {
            // All retries exhausted
            console.error('All hurdle transition attempts failed, ending session');
            showMessage('Failed to continue hurdle chain. Ending session.', 'error');
            await handleHurdleFailure();
            break;
          }
        }
      }
    };

    const animateHurdleTransition = async (autoGuess, nextTargetWord) => {
      // Get the game board and auto-guess feedback
      const gameBoard = document.querySelector('#game-board');
      if (!gameBoard) {
        console.warn('Game board not found, skipping transition animation');
        return;
      }
      
      const rows = gameBoard.querySelectorAll('.guess-row');
      if (rows.length === 0) {
        console.warn('No rows found, skipping transition animation');
        return;
      }
      
      // Clear current guess immediately to prevent Vue from overwriting our animation
      currentGuess.value = '';
      
      // Generate feedback for the auto-guess using the provided next target word
      let autoGuessFeedback = [];
      
      if (autoGuess && nextTargetWord) {
        autoGuessFeedback = FeedbackGenerator.generateFeedback(autoGuess.toLowerCase(), nextTargetWord.toLowerCase());
      }
      
      // Animation timeout handling
      const animationTimeout = 3000; // 3 second timeout
      let animationCompleted = false;
      
      // Set up timeout to prevent hanging animations
      const timeoutId = setTimeout(() => {
        if (!animationCompleted) {
          console.warn('Hurdle transition animation timed out, forcing completion');
          // Force complete all animations
          rows.forEach((row, rowIndex) => {
            const tiles = row.querySelectorAll('.letter-tile');
            tiles.forEach((tile, tileIndex) => {
              tile.classList.remove('flipping');
              // Clear all status classes first
              tile.classList.remove('correct', 'present', 'absent', 'filled', 'empty', 'active');
              
              if (rowIndex === 0 && autoGuess && tileIndex < autoGuess.length) {
                // First row: apply auto-guess
                tile.textContent = autoGuess[tileIndex].toUpperCase();
                if (autoGuessFeedback[tileIndex]) {
                  tile.classList.add(autoGuessFeedback[tileIndex].status);
                }
              } else {
                // Other rows: clear
                tile.textContent = '';
                tile.classList.add('empty');
              }
            });
          });
          
          // Reset keyboard state on timeout too
          resetKeyboardState();
          if (autoGuess && autoGuessFeedback.length > 0) {
            autoGuessFeedback.forEach((feedback, index) => {
              const letter = autoGuess[index].toUpperCase();
              keyboardState.value[letter] = feedback.status;
            });
          }
        }
      }, animationTimeout);
      
      try {
        // Reset keyboard state first and prevent Vue from restoring it
        resetKeyboardState();
        console.log('Keyboard state reset for hurdle transition');
        
        // Clear current guess to prevent Vue interference
        currentGuess.value = '';
        
        // Force Vue to update the DOM with cleared state
        await nextTick();
        
        // Clear all existing CSS classes from all tiles before starting animation
        rows.forEach((row, rowIndex) => {
          const tiles = row.querySelectorAll('.letter-tile');
          tiles.forEach((tile, tileIndex) => {
            // Remove all possible status classes immediately
            tile.classList.remove('correct', 'present', 'absent', 'filled', 'empty', 'active');
            // Set to neutral state
            tile.classList.add('filled');
          });
        });
        
        // Start the unified flip animation for all tiles simultaneously
        const allTiles = [];
        rows.forEach((row, rowIndex) => {
          const tiles = row.querySelectorAll('.letter-tile');
          tiles.forEach((tile, tileIndex) => {
            allTiles.push({ tile, rowIndex, tileIndex });
            
            // Start flip animation immediately for all tiles
            tile.classList.add('flipping');
            
            // Halfway through the flip (330ms), apply the changes
            setTimeout(() => {
              if (rowIndex === 0 && autoGuess && tileIndex < autoGuess.length) {
                // First row: Replace with auto-guess letter and apply feedback
                tile.textContent = autoGuess[tileIndex].toUpperCase();
                tile.classList.remove('correct', 'present', 'absent', 'filled', 'empty', 'active');
                if (autoGuessFeedback[tileIndex]) {
                  tile.classList.add(autoGuessFeedback[tileIndex].status);
                }
              } else {
                // All other rows and tiles: Clear and make empty
                tile.textContent = '';
                tile.classList.remove('correct', 'present', 'absent', 'filled', 'active');
                tile.classList.add('empty');
              }
            }, 330); // Halfway through the 0.66s flip animation
            
            // Remove flipping class when animation completes
            setTimeout(() => {
              tile.classList.remove('flipping');
            }, 660); // Full flip animation duration
          });
        });
        
        // Wait for all flip animations to complete
        await new Promise(resolve => setTimeout(resolve, 700)); // Slightly longer than animation duration
        
        animationCompleted = true;
        clearTimeout(timeoutId);
        
        // Update keyboard state with auto-guess feedback (this should be the only keyboard state)
        if (autoGuess && autoGuessFeedback.length > 0) {
          // Ensure keyboard is completely reset first
          resetKeyboardState();
          console.log(`Setting keyboard state for auto-guess "${autoGuess}" against target "${nextTargetWord}"`);
          
          autoGuessFeedback.forEach((feedback, index) => {
            const letter = autoGuess[index].toUpperCase();
            const status = feedback.status;
            
            console.log(`Setting keyboard: ${letter} = ${status}`);
            // Apply only the auto-guess feedback to keyboard
            keyboardState.value[letter] = status;
          });
          
          console.log('Final keyboard state:', keyboardState.value);
        } else {
          console.log('No auto-guess provided, keyboard remains empty');
        }
        
        // Force Vue to re-render after animation completes to sync with DOM changes
        gameStateVersion.value++;
        
      } catch (error) {
        console.error('Error during hurdle transition animation:', error);
        animationCompleted = true;
        clearTimeout(timeoutId);
        
        // Force complete on error
        rows.forEach((row, rowIndex) => {
          const tiles = row.querySelectorAll('.letter-tile');
          tiles.forEach((tile, tileIndex) => {
            tile.classList.remove('flipping');
            // Clear all status classes first
            tile.classList.remove('correct', 'present', 'absent', 'filled', 'empty', 'active');
            
            if (rowIndex === 0 && autoGuess && tileIndex < autoGuess.length) {
              // First row: apply auto-guess
              tile.textContent = autoGuess[tileIndex].toUpperCase();
              if (autoGuessFeedback[tileIndex]) {
                tile.classList.add(autoGuessFeedback[tileIndex].status);
              }
            } else {
              // Other rows: clear
              tile.textContent = '';
              tile.classList.add('empty');
            }
          });
        });
        
        // Reset keyboard state on error too
        resetKeyboardState();
        if (autoGuess && autoGuessFeedback.length > 0) {
          autoGuessFeedback.forEach((feedback, index) => {
            const letter = autoGuess[index].toUpperCase();
            keyboardState.value[letter] = feedback.status;
          });
        }
        
        // Force Vue to re-render after error
        gameStateVersion.value++;
      }
    };

    const animateHurdleNumberUpdate = async () => {
      const hurdleNumberElement = document.querySelector('.hurdle-number');
      if (!hurdleNumberElement) {
        console.warn('Hurdle number element not found, skipping animation');
        return;
      }
      
      // Animation timeout handling
      const animationTimeout = 1000; // 1 second timeout
      let animationCompleted = false;
      
      // Set up timeout to prevent hanging animations
      const timeoutId = setTimeout(() => {
        if (!animationCompleted) {
          console.warn('Hurdle number update animation timed out, forcing completion');
          hurdleNumberElement.classList.remove('updating');
        }
      }, animationTimeout);
      
      try {
        // Add update animation
        hurdleNumberElement.classList.add('updating');
        
        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        animationCompleted = true;
        clearTimeout(timeoutId);
        
        // Remove animation class
        hurdleNumberElement.classList.remove('updating');
        
      } catch (error) {
        console.error('Error during hurdle number animation:', error);
        animationCompleted = true;
        clearTimeout(timeoutId);
        hurdleNumberElement.classList.remove('updating');
      }
    };

    const handleHurdleFailure = async () => {
      if (!hurdleController.value) return;
      
      try {
        const currentGameState = hurdleController.value.getCurrentGameController()?.getGameState();
        const targetWord = currentGameState?.getTargetWord()?.toUpperCase() || 'UNKNOWN';
        
        // End game session
        hurdleController.value.endHurdleMode('failure', targetWord);
        
        // Update UI
        hurdleGameEnded.value = true;
        updateHurdleUI(); // This will update solvedWords for access to all completed words
        
        // Show game over message with word
        showMessage(`Game Over! The word was "${targetWord}"`, 'error');
        
        // Show word definition
        await fetchWordDefinition(targetWord);
        
      } catch (error) {
        console.error('Failed to handle hurdle failure:', error);
        showMessage('Error ending hurdle session', 'error');
      }
    };

    // Word Definition Methods (Requirement 8.1, 8.3, 8.4)
    const viewWordDefinition = async (word) => {
      selectedWordForDefinition.value = word;
      try {
        const definition = await fetchWordDefinitionData(word);
        selectedWordDefinition.value = definition;
      } catch (error) {
        console.error('Failed to fetch word definition:', error);
        selectedWordDefinition.value = {
          word: word,
          definitions: [{
            partOfSpeech: 'word',
            text: 'Definition could not be loaded at this time.'
          }]
        };
      }
    };

    const closeWordDefinition = () => {
      selectedWordForDefinition.value = null;
      selectedWordDefinition.value = null;
    };

    // Vuetify helper methods
    const getTileColor = (status) => {
      // Return undefined to let CSS handle the colors via class-based styling
      // This prevents Vuetify's color system from conflicting with our custom colors
      return undefined;
    };

    const getKeyColor = (status) => {
      switch (status) {
        case 'correct': return 'success';
        case 'present': return 'warning';
        case 'absent': return 'grey-darken-3';
        default: return 'grey-darken-1';
      }
    };

    const getAlertType = (messageType) => {
      switch (messageType) {
        case 'error': return 'error';
        case 'success': return 'success';
        case 'info': return 'info';
        default: return 'info';
      }
    };

    const getAlertColor = (messageType) => {
      switch (messageType) {
        case 'error': return 'error';
        case 'success': return 'success';
        case 'info': return 'info';
        default: return 'primary';
      }
    };

    // Responsive keyboard helper methods
    const getKeyColumnStyle = (key, rowLength) => {
      const isWideKey = key === 'ENTER' || key === 'BACKSPACE';
      
      if (isWideKey) {
        return { 
          'flex': '0 0 auto', 
          'max-width': '80px', 
          'min-width': '60px',
          'width': '70px'
        };
      }
      
      // For regular keys, use equal distribution
      return { 
        'flex': '1 1 0',
        'max-width': '50px',
        'min-width': '30px'
      };
    };

    const getKeyHeight = () => {
      // Responsive key height based on screen size
      if (typeof window !== 'undefined') {
        if (window.innerWidth <= 600) return 40;
        if (window.innerWidth <= 959) return 44;
        if (window.innerWidth <= 1279) return 48;
        return 52;
      }
      return 48;
    };

    const getKeySize = (key) => {
      const isWideKey = key === 'ENTER' || key === 'BACKSPACE';
      if (typeof window !== 'undefined') {
        if (window.innerWidth <= 600) {
          return isWideKey ? 'x-small' : 'small';
        }
        if (window.innerWidth <= 959) {
          return isWideKey ? 'small' : 'default';
        }
      }
      return isWideKey ? 'small' : 'default';
    };

    const fetchWordDefinitionData = async (word) => {
      try {
        // Check if fetch is available (browser environment)
        if (typeof fetch === 'undefined') {
          // In Node.js environment (tests), skip API call
          return {
            word: word,
            definitions: [{
              partOfSpeech: 'noun',
              text: 'Definition not available in test environment'
            }]
          };
        }
        
        // Use WordsAPI for word definitions
        const response = await fetch(`https://wordsapiv1.p.rapidapi.com/words/${word.toLowerCase()}`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': WORDS_API_CONFIG.API_KEY, // Your WordsAPI key
            'X-RapidAPI-Host': WORDS_API_CONFIG.HOST
          }
        });
        
        // Handle 403 Forbidden (API key issues) gracefully
        if (response.status === 403) {
          return {
            word: word,
            definitions: [{
              partOfSpeech: 'uncommon word',
              text: 'This is a rare or technical English word. Definition not available with demo API key.'
            }]
          };
        }
        
        if (!response.ok) {
          // Don't throw error, just handle gracefully
          return {
            word: word,
            definitions: [{
              partOfSpeech: 'uncommon word',
              text: 'This is a rare or technical English word. Definition not available from WordsAPI.'
            }]
          };
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
          let definitions = validDefinitions.length > 0 ? validDefinitions : 
            data.results.map(result => ({
              partOfSpeech: result.partOfSpeech || 'word',
              text: result.definition || 'Definition not available'
            }));
          
          // Filter out inappropriate content
          definitions = filterInappropriateContent(definitions);
          
          // If all definitions were filtered out, provide a safe fallback
          if (definitions.length === 0) {
            definitions = [{
              partOfSpeech: 'word',
              text: 'Definition not available due to content restrictions.'
            }];
          }
          
          return {
            word: word,
            definitions: definitions
          };
        } else {
          return {
            word: word,
            definitions: [{
              partOfSpeech: 'uncommon word',
              text: 'This is a rare or technical English word. Definition not available from WordsAPI.'
            }]
          };
        }
      } catch (error) {
        // Silently handle errors for uncommon words
        return {
          word: word,
          definitions: [{
            partOfSpeech: 'uncommon word',
            text: 'This is a rare or technical English word. Definition not available from WordsAPI.'
          }]
        };
      }
    };
    
    // Configuration change handler
    const handleConfigChange = (setting, value) => {
      console.log(`Configuration changed: ${setting} = ${value}`);
      
      // Force reload config from localStorage to get fresh settings
      gameConfig.config = gameConfig.loadConfig();
      
      // Handle batch update of all settings
      if (setting === 'all') {
        // Update all reactive values from the settings object
        maxGuesses.value = value.maxGuesses;
        hardMode.value = value.hardMode; // Update reactive hard mode
        
        // Log all the settings being applied
        console.log('Applying all settings:', value);
        console.log('Hard mode setting:', value.hardMode);
        console.log('Show definitions setting:', value.showDefinitions);
        console.log('Difficulty setting:', value.difficulty);
        
        // Verify the config was updated
        console.log('Config after reload - difficulty:', gameConfig.getDifficulty());
        console.log('Config after reload - frequency range:', gameConfig.getFrequencyRange());
        
        // Force UI update for all settings
        configVersion.value++;
        
        showMessage('Settings saved. Restarting game...', 'info');
      } else if (setting === 'maxGuesses') {
        // Update reactive values immediately for instant UI feedback
        maxGuesses.value = value;
        showMessage('Settings saved. Restarting game...', 'info');
      } else if (setting === 'reset') {
        // Update all reactive values when reset
        maxGuesses.value = gameConfig.getMaxGuesses();
        hardMode.value = gameConfig.getHardMode(); // Update reactive hard mode
        // Force UI update for all settings
        configVersion.value++;
        showMessage('Settings reset to defaults. Restarting game...', 'info');
      } else if (setting === 'hardMode') {
        hardMode.value = value; // Update reactive hard mode
        const hardModeStatus = value ? 'enabled' : 'disabled';
        showMessage(`Hard mode ${hardModeStatus}. Restarting game...`, 'info');
      } else {
        showMessage('Settings saved. Restarting game...', 'info');
      }
      
      // Force immediate update of reactive properties
      configVersion.value++;
      gameStateVersion.value++;
      
      // For immediate visual feedback, update the board right away
      nextTick(() => {
        // Force Vue to re-render the board with new configuration
        configVersion.value++;
      });
      
      // Automatically restart the game with new settings after a short delay
      setTimeout(async () => {
        try {
          await handleNewGame();
        } catch (error) {
          console.error('Failed to restart game with new settings:', error);
          showMessage('Failed to apply new settings. Please start a new game manually.', 'error');
        }
      }, 1000);
    };
    
    onMounted(async () => {
      // Add global keyboard event listener
      console.log('=== MOUNTING DEBUG ===');
      console.log('Adding global keydown event listener');
      document.addEventListener('keydown', handleGlobalKeydown);
      console.log('Event listener added successfully');
      console.log('=== END MOUNTING DEBUG ===');
      
      // Always initialize controller and start game
      if (props.gameController && props.dictionary) {
        try {
          // Initialize hurdle controller immediately on mount
          await initializeHurdleController();
          
          // Automatically start game
          await startHurdleMode();
        } catch (error) {
          console.error('Failed to initialize game on mount:', error);
          showMessage('Failed to initialize game. Please try again.', 'error');
        }
      } else {
        console.error('Game controller or dictionary not available on mount');
        showMessage('Game initialization failed. Missing required components.', 'error');
      }
    });
    
    // Clean up event listener when component unmounts
    onUnmounted(() => {
      document.removeEventListener('keydown', handleGlobalKeydown);
    });
    
    // Watch for definition changes to manage body class
    watch(
      () => definition.value && gameConfig.getShowDefinitions() && configVersion.value >= 0,
      (hasDefinitions) => {
        if (hasDefinitions) {
          document.body.classList.add('has-definitions');
        } else {
          document.body.classList.remove('has-definitions');
        }
      },
      { immediate: true }
    );
    
    // Debug watcher for currentGuess changes
    watch(
      () => currentGuess.value,
      (newValue, oldValue) => {
        console.log('=== CURRENT GUESS WATCHER ===');
        console.log('currentGuess changed from:', oldValue, 'to:', newValue);
        console.log('=== END CURRENT GUESS WATCHER ===');
      }
    );
    
    return {
      gameConfig,
      showConfigPage,
      showRulesPage,
      configVersion,
      maxGuesses,
      hardMode, // Add reactive hard mode property
      currentGuess,
      message,
      messageType,
      definition,
      keyboardState,
      keyboardLayout,
      boardRows,
      isGameOver,
      isGameActive,
      isInitialized,
      gameStateVersion, // Add gameStateVersion for template keys
      // Game Properties
      hurdleNumber,
      completedHurdlesCount,
      totalScore,
      lastHurdleScore,
      lastCompletedHurdleNumber,
      hurdleGameEnded,
      // Word Definition Properties
      solvedWords,
      selectedWordForDefinition,
      selectedWordDefinition,
      // Methods
      handleKeyPress,
      handleGlobalKeydown,
      handleGuessSubmit,
      handleNewGame,
      handleConfigChange,
      // Word Definition Methods
      viewWordDefinition,
      closeWordDefinition,
      // Vuetify Helper Methods
      getTileColor,
      getKeyColor,
      getAlertType,
      getAlertColor,
      // Responsive Helper Methods
      getKeyColumnStyle,
      getKeyHeight,
      getKeySize
    };
  }
};
</script>

<style scoped>
.game-container {
  max-width: 100%;
  margin: 0 auto;
}

/* Game Board Styles */
.game-board {
  max-width: 350px;
  margin: 0 auto;
}

.tile-square {
  aspect-ratio: 1;
  min-height: 60px;
  max-height: 70px;
  transition: all 0.3s ease;
  font-family: 'Roboto', sans-serif;
}

.tile-letter {
  color: white !important;
  text-shadow: none;
  font-weight: 700 !important;
}

/* Tile animations */
.letter-tile.flipping {
  animation: flip 0.66s ease-in-out !important;
  transition: none !important;
}

@keyframes flip {
  0% { 
    transform: rotateX(0deg); 
  }
  50% { 
    transform: rotateX(90deg); 
  }
  100% { 
    transform: rotateX(0deg); 
  }
}

.letter-tile.active {
  animation: pulse 0.3s ease;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Celebration animations for correct words */
.letter-tile.correct.celebrating {
  animation: celebrate 0.8s ease-in-out;
}

@keyframes celebrate {
  0% { 
    transform: scale(1) rotateZ(0deg);
    box-shadow: 0 0 0 rgba(83, 141, 78, 0.5);
  }
  25% { 
    transform: scale(1.1) rotateZ(-5deg);
    box-shadow: 0 0 20px rgba(83, 141, 78, 0.8);
  }
  50% { 
    transform: scale(1.15) rotateZ(5deg);
    box-shadow: 0 0 30px rgba(83, 141, 78, 1);
  }
  75% { 
    transform: scale(1.1) rotateZ(-2deg);
    box-shadow: 0 0 20px rgba(83, 141, 78, 0.8);
  }
  100% { 
    transform: scale(1) rotateZ(0deg);
    box-shadow: 0 0 10px rgba(83, 141, 78, 0.6);
  }
}

/* Row celebration animation */
.guess-row.celebrating {
  animation: rowCelebrate 1s ease-in-out;
}

@keyframes rowCelebrate {
  0% { 
    transform: translateY(0);
  }
  20% { 
    transform: translateY(-5px);
  }
  40% { 
    transform: translateY(0);
  }
  60% { 
    transform: translateY(-3px);
  }
  80% { 
    transform: translateY(0);
  }
  100% { 
    transform: translateY(0);
  }
}

/* Confetti-like particle effect */
.celebration-particle {
  position: fixed;
  width: 8px;
  height: 8px;
  background: linear-gradient(45deg, #538d4e, #6aaa64);
  border-radius: 50%;
  pointer-events: none;
  animation: confetti 1.5s ease-out forwards;
  z-index: 9999;
}

@keyframes confetti {
  0% {
    transform: translateX(0) translateY(0) rotateZ(0deg) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateX(calc(var(--end-x, 0px) - var(--start-x, 0px))) 
               translateY(calc(var(--end-y, 0px) - var(--start-y, 0px))) 
               rotateZ(360deg) scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: translateX(calc(var(--end-x, 0px) - var(--start-x, 0px))) 
               translateY(calc(var(--end-y, 0px) - var(--start-y, 0px) - 100px)) 
               rotateZ(720deg) scale(0.5);
    opacity: 0;
  }
}

/* Success message animation */
.success-message {
  animation: successPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes successPop {
  0% {
    transform: scale(0.3) translateY(20px);
    opacity: 0;
  }
  50% {
    transform: scale(1.05) translateY(-5px);
    opacity: 0.8;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* Keyboard Styles */
.keyboard {
  max-width: 350px;
  margin: 0 auto;
}

.key {
  font-family: 'Roboto', sans-serif;
  text-transform: uppercase;
  font-weight: 500;
  min-height: 48px;
}

.key-text {
  font-size: 0.875rem;
  font-weight: 600;
}

/* Message Area */
.message-alert {
  max-width: 40ch;
  margin: 0 auto;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Header Styles */
.header-spacer {
  width: 96px;
}

.new-game-header-btn {
  min-width: 80px !important;
  font-size: 0.8rem !important;
  font-weight: 500 !important;
}

/* Custom Vuetify overrides */
.v-card.letter-tile {
  border: 2px solid #3a3a3c !important;
}

.v-card.letter-tile.active {
  border-color: #818384 !important;
}

/* Responsive Design */
@media (min-width: 960px) {
  /* Desktop styles */
  .game-container {
    padding: 24px !important;
  }
  
  .game-board {
    max-width: 400px;
  }
  
  .keyboard {
    max-width: 400px;
  }
  
  .tile-square {
    min-height: 70px;
    max-height: 80px;
  }
  
  .tile-letter {
    font-size: 2rem !important;
  }
  
  .key {
    min-height: 52px;
  }
  
  .key-text {
    font-size: 1rem;
  }
}

@media (min-width: 1280px) {
  /* Large desktop styles */
  .game-container {
    padding: 32px !important;
  }
  
  .game-board {
    max-width: 450px;
  }
  
  .keyboard {
    max-width: 450px;
  }
  
  .tile-square {
    min-height: 75px;
    max-height: 85px;
  }
  
  .tile-letter {
    font-size: 2.25rem !important;
  }
  
  .key {
    min-height: 56px;
  }
  
  .key-text {
    font-size: 1.1rem;
  }
}

@media (max-width: 959px) {
  /* Tablet styles */
  .game-container {
    padding: 16px !important;
  }
  
  .tile-square {
    min-height: 55px;
    max-height: 65px;
  }
  
  .tile-letter {
    font-size: 1.5rem !important;
  }
  
  .key {
    min-height: 44px;
  }
  
  .key-text {
    font-size: 0.8rem;
  }
}

@media (max-width: 600px) {
  /* Mobile styles */
  .game-container {
    padding: 8px !important;
  }
  
  .tile-square {
    min-height: 50px;
    max-height: 60px;
  }
  
  .tile-letter {
    font-size: 1.25rem !important;
  }
  
  .key {
    min-height: 40px;
  }
  
  .key-text {
    font-size: 0.75rem;
  }
  
  .header-spacer {
    width: 96px;
  }
}

/* Color overrides for better contrast */
.v-card.letter-tile.correct {
  background-color: #538d4e !important;
  border-color: #538d4e !important;
}

.v-card.letter-tile.present {
  background-color: #b59f3b !important;
  border-color: #b59f3b !important;
}

.v-card.letter-tile.absent {
  background-color: #3a3a3c !important;
  border-color: #3a3a3c !important;
}

.v-card.letter-tile.filled {
  background-color: #121213 !important;
  border-color: #565758 !important;
}

.v-card.letter-tile.active {
  background-color: #121213 !important;
  border-color: #818384 !important;
}

.v-card.letter-tile.empty {
  background-color: transparent !important;
  border-color: #3a3a3c !important;
}

/* Default tile state */
.v-card.letter-tile {
  background-color: transparent !important;
  border-color: #3a3a3c !important;
}
</style>
