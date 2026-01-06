<template>
  <div class="config-page">
    <div class="config-container">
      <div class="config-header">
        <h2>Game Settings</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <div class="config-content">
        <!-- Game Active Warning -->
        <div v-if="gameActive" class="game-active-warning">
          <div class="warning-icon">⚠️</div>
          <div class="warning-text">
            <h3>Game In Progress</h3>
            <p>Settings cannot be changed during active gameplay. Finish your current game or start a new one to modify settings.</p>
          </div>
        </div>

        <!-- Max Guesses Setting -->
        <div class="config-section" :class="{ disabled: gameActive }">
          <h3>Number of Guesses</h3>
          <p class="config-description">Choose how many attempts you get to guess each word.</p>
          <div class="config-options">
            <label 
              v-for="option in guessOptions" 
              :key="option"
              class="config-option"
              :class="{ active: maxGuesses === option, disabled: gameActive }"
            >
              <input 
                type="radio" 
                :value="option" 
                v-model="maxGuesses"
                :disabled="gameActive"
                @change="updateMaxGuesses"
              />
              <span class="option-text">{{ option }} guesses</span>
            </label>
          </div>
        </div>

        <!-- Difficulty Setting -->
        <div class="config-section" :class="{ disabled: gameActive }">
          <h3>Difficulty Level</h3>
          <p class="config-description">Controls how common or rare the target words are.</p>
          <div class="config-options">
            <label 
              v-for="option in difficultyOptions" 
              :key="option.value"
              class="config-option"
              :class="{ active: difficulty === option.value, disabled: gameActive }"
            >
              <input 
                type="radio" 
                :value="option.value" 
                v-model="difficulty"
                :disabled="gameActive"
                @change="updateDifficulty"
              />
              <div class="option-content">
                <span class="option-text">{{ option.label }}</span>
                <span class="option-description">{{ option.description }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Show Definitions Setting -->
        <div class="config-section" :class="{ disabled: gameActive }">
          <h3>Word Definitions</h3>
          <p class="config-description">Choose whether to show word definitions after completing each word.</p>
          <div class="config-toggle">
            <label class="toggle-label" :class="{ disabled: gameActive }">
              <input 
                type="checkbox" 
                v-model="showDefinitions"
                :disabled="gameActive"
                @change="updateShowDefinitions"
              />
              <span class="toggle-slider" :class="{ disabled: gameActive }"></span>
              <span class="toggle-text">Show word definitions</span>
            </label>
          </div>
        </div>

        <!-- Hard Mode Setting -->
        <div class="config-section" :class="{ disabled: gameActive }">
          <h3>Hard Mode</h3>
          <p class="config-description">Any revealed hints must be used in subsequent guesses. Makes the game significantly more challenging.</p>
          <div class="config-toggle">
            <label class="toggle-label" :class="{ disabled: gameActive }">
              <input 
                type="checkbox" 
                v-model="hardMode"
                :disabled="gameActive"
                @change="updateHardMode"
              />
              <span class="toggle-slider" :class="{ disabled: gameActive }"></span>
              <span class="toggle-text">Enable hard mode</span>
            </label>
          </div>
        </div>

        <!-- Reset Settings -->
        <div class="config-section" :class="{ disabled: gameActive }">
          <h3>Reset Settings</h3>
          <p class="config-description">Restore all settings to their default values.</p>
          <button 
            @click="resetSettings" 
            class="reset-btn"
            :disabled="gameActive"
            :class="{ disabled: gameActive }"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      <div class="config-footer">
        <button @click="$emit('close')" class="save-btn">
          Save & Close
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import GameConfig from './GameConfig.js';

export default {
  name: 'ConfigPage',
  props: {
    gameActive: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'configChanged'],
  setup(props, { emit }) {
    const gameConfig = new GameConfig();
    
    // Reactive data
    const maxGuesses = ref(4);
    const difficulty = ref('medium');
    const showDefinitions = ref(true);
    const hardMode = ref(false);
    
    // Options
    const guessOptions = [3, 4, 5, 6];
    const difficultyOptions = [
      {
        value: 'easy',
        label: 'Easy',
        description: 'Common words'
      },
      {
        value: 'medium',
        label: 'Medium',
        description: 'Moderate words'
      },
      {
        value: 'hard',
        label: 'Hard',
        description: 'Rare words'
      }
    ];

    // Load current settings
    const loadSettings = () => {
      const settings = gameConfig.getAllSettings();
      maxGuesses.value = settings.maxGuesses;
      difficulty.value = settings.difficulty;
      showDefinitions.value = settings.showDefinitions;
      hardMode.value = settings.hardMode;
    };

    // Update methods
    const updateMaxGuesses = () => {
      gameConfig.setMaxGuesses(maxGuesses.value);
      emit('configChanged', 'maxGuesses', maxGuesses.value);
    };

    const updateDifficulty = () => {
      gameConfig.setDifficulty(difficulty.value);
      emit('configChanged', 'difficulty', difficulty.value);
    };

    const updateShowDefinitions = () => {
      gameConfig.setShowDefinitions(showDefinitions.value);
      emit('configChanged', 'showDefinitions', showDefinitions.value);
    };

    const updateHardMode = () => {
      gameConfig.setHardMode(hardMode.value);
      emit('configChanged', 'hardMode', hardMode.value);
    };

    const resetSettings = () => {
      gameConfig.resetToDefaults();
      loadSettings(); // This will update all reactive values including hardMode
      emit('configChanged', 'reset', null);
    };

    // Initialize
    onMounted(() => {
      loadSettings();
    });

    return {
      maxGuesses,
      difficulty,
      showDefinitions,
      hardMode,
      guessOptions,
      difficultyOptions,
      updateMaxGuesses,
      updateDifficulty,
      updateShowDefinitions,
      updateHardMode,
      resetSettings
    };
  }
};
</script>

<style scoped>
.config-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.config-container {
  background-color: #1a1a1b;
  border-radius: 8px;
  border: 1px solid #3a3a3c;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #3a3a3c;
}

.config-header h2 {
  color: #ffffff;
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: #818384;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #3a3a3c;
  color: #ffffff;
}

.config-content {
  padding: 20px;
}

/* Game Active Warning */
.game-active-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background-color: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 24px;
}

.warning-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-text h3 {
  color: #ffc107;
  margin: 0 0 8px 0;
  font-size: 1rem;
}

.warning-text p {
  color: #ffffff;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.config-section {
  margin-bottom: 30px;
  transition: opacity 0.2s;
}

.config-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.config-section h3 {
  color: #ffffff;
  margin: 0 0 8px 0;
  font-size: 1.2rem;
}

.config-description {
  color: #818384;
  margin: 0 0 15px 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.config-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-option {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 2px solid #3a3a3c;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #121213;
}

.config-option:hover:not(.disabled) {
  border-color: #565758;
}

.config-option.active:not(.disabled) {
  border-color: #538d4e;
  background-color: rgba(83, 141, 78, 0.1);
}

.config-option.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.config-option input[type="radio"] {
  margin-right: 12px;
  accent-color: #538d4e;
}

.config-option input[type="radio"]:disabled {
  cursor: not-allowed;
}

.option-content {
  display: flex;
  flex-direction: column;
}

.option-text {
  color: #ffffff;
  font-weight: 500;
}

.option-description {
  color: #818384;
  font-size: 0.85rem;
  margin-top: 2px;
}

.config-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 12px;
  border: 2px solid #3a3a3c;
  border-radius: 6px;
  transition: all 0.2s;
  background-color: #121213;
  width: 100%;
}

.toggle-label:hover:not(.disabled) {
  border-color: #565758;
}

.toggle-label.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.toggle-label input[type="checkbox"] {
  display: none;
}

.toggle-slider {
  width: 44px;
  height: 24px;
  background-color: #3a3a3c;
  border-radius: 12px;
  position: relative;
  transition: background-color 0.2s;
  margin-right: 12px;
}

.toggle-slider.disabled {
  opacity: 0.6;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ffffff;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider:not(.disabled) {
  background-color: #538d4e;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider::after {
  transform: translateX(20px);
}

.toggle-text {
  color: #ffffff;
  font-weight: 500;
}

.reset-btn {
  background-color: #b91c1c;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.reset-btn:hover:not(.disabled) {
  background-color: #dc2626;
}

.reset-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: #6b7280;
}

.config-footer {
  padding: 20px;
  border-top: 1px solid #3a3a3c;
  text-align: center;
}

.save-btn {
  background-color: #538d4e;
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.save-btn:hover {
  background-color: #6aaa64;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .config-page {
    padding: 0;
    align-items: stretch;
    justify-content: stretch;
  }
  
  .config-container {
    max-height: 100vh;
    height: 100vh;
    width: 100vw;
    max-width: 100vw;
    margin: 0;
    border-radius: 0;
    border: none;
    display: flex;
    flex-direction: column;
  }
  
  .config-header {
    padding: 20px 15px 15px 15px;
    flex-shrink: 0;
    text-align: center;
    position: relative;
  }
  
  .config-header h2 {
    font-size: 1.4rem;
    margin: 0;
  }
  
  .close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    padding: 8px;
  }
  
  .config-content {
    padding: 15px;
    flex: 1;
    overflow-y: auto;
  }
  
  .config-footer {
    padding: 15px;
    flex-shrink: 0;
    border-top: 1px solid #3a3a3c;
    background-color: #1a1a1b;
  }
  
  .save-btn {
    width: 100%;
    padding: 15px 20px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .config-container {
    height: 100vh;
    width: 100vw;
    max-width: 100vw;
    border-radius: 0;
    border: none;
  }
  
  .config-header {
    padding: 15px;
    text-align: center;
  }
  
  .config-header h2 {
    font-size: 1.3rem;
  }
  
  .close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 8px;
  }
  
  .config-content {
    padding: 12px;
  }
  
  .config-footer {
    padding: 12px;
  }
  
  .save-btn {
    width: 100%;
    padding: 14px 18px;
    font-size: 0.95rem;
  }
}

/* Landscape mobile optimization for config */
@media (max-width: 900px) and (orientation: landscape) {
  .config-container {
    height: 100vh;
    width: 100vw;
    max-width: 100vw;
    border-radius: 0;
    border: none;
  }
  
  .config-header {
    padding: 8px 15px;
    text-align: center;
  }
  
  .config-header h2 {
    font-size: 1.2rem;
  }
  
  .close-btn {
    position: absolute;
    top: 8px;
    right: 15px;
  }
  
  .config-content {
    padding: 8px 15px;
  }
  
  .config-footer {
    padding: 8px 15px;
  }
  
  .save-btn {
    width: 100%;
    padding: 12px 20px;
    font-size: 0.9rem;
  }
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #3a3a3c;
}

.config-header h2 {
  color: #ffffff;
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: #818384;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #3a3a3c;
  color: #ffffff;
}

.config-content {
  padding: 20px;
}

/* Game Active Warning */
.game-active-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background-color: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 24px;
}

.warning-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-text h3 {
  color: #ffc107;
  margin: 0 0 8px 0;
  font-size: 1rem;
}

.warning-text p {
  color: #ffffff;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.config-section {
  margin-bottom: 30px;
  transition: opacity 0.2s;
}

.config-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.config-section h3 {
  color: #ffffff;
  margin: 0 0 8px 0;
  font-size: 1.2rem;
}

.config-description {
  color: #818384;
  margin: 0 0 15px 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.config-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-option {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 2px solid #3a3a3c;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #121213;
}

.config-option:hover:not(.disabled) {
  border-color: #565758;
}

.config-option.active:not(.disabled) {
  border-color: #538d4e;
  background-color: rgba(83, 141, 78, 0.1);
}

.config-option.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.config-option input[type="radio"] {
  margin-right: 12px;
  accent-color: #538d4e;
}

.config-option input[type="radio"]:disabled {
  cursor: not-allowed;
}

.option-content {
  display: flex;
  flex-direction: column;
}

.option-text {
  color: #ffffff;
  font-weight: 500;
}

.option-description {
  color: #818384;
  font-size: 0.85rem;
  margin-top: 2px;
}

.config-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 12px;
  border: 2px solid #3a3a3c;
  border-radius: 6px;
  transition: all 0.2s;
  background-color: #121213;
  width: 100%;
}

.toggle-label:hover:not(.disabled) {
  border-color: #565758;
}

.toggle-label.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.toggle-label input[type="checkbox"] {
  display: none;
}

.toggle-slider {
  width: 44px;
  height: 24px;
  background-color: #3a3a3c;
  border-radius: 12px;
  position: relative;
  transition: background-color 0.2s;
  margin-right: 12px;
}

.toggle-slider.disabled {
  opacity: 0.6;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ffffff;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider:not(.disabled) {
  background-color: #538d4e;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider::after {
  transform: translateX(20px);
}

.toggle-text {
  color: #ffffff;
  font-weight: 500;
}

.reset-btn {
  background-color: #b91c1c;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.reset-btn:hover:not(.disabled) {
  background-color: #dc2626;
}

.reset-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: #6b7280;
}

.config-footer {
  padding: 20px;
  border-top: 1px solid #3a3a3c;
  text-align: center;
}

.save-btn {
  background-color: #538d4e;
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.save-btn:hover {
  background-color: #6aaa64;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .config-page {
    padding: 0;
    align-items: stretch;
    justify-content: stretch;
  }
  
  .config-page > div {
    max-height: 100vh;
    height: 100vh;
    width: 100vw;
    max-width: 100vw;
    margin: 0;
    border-radius: 0;
    border: none;
    display: flex;
    flex-direction: column;
  }
  
  .config-header {
    padding: 20px 15px 15px 15px;
    flex-shrink: 0;
    text-align: center;
    position: relative;
  }
  
  .config-header h2 {
    font-size: 1.4rem;
    margin: 0;
  }
  
  .close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    padding: 8px;
  }
  
  .config-content {
    padding: 15px;
    flex: 1;
    overflow-y: auto;
  }
  
  .config-footer {
    padding: 15px;
    flex-shrink: 0;
    border-top: 1px solid #3a3a3c;
    background-color: #1a1a1b;
  }
  
  .save-btn {
    width: 100%;
    padding: 15px 20px;
    font-size: 1rem;
  }
  
  .game-active-warning {
    padding: 12px;
    margin-bottom: 20px;
  }
  
  .warning-text h3 {
    font-size: 0.9rem;
  }
  
  .warning-text p {
    font-size: 0.8rem;
  }
  
  .config-section {
    margin-bottom: 25px;
  }
  
  .config-section h3 {
    font-size: 1.1rem;
  }
  
  .config-description {
    font-size: 0.85rem;
  }
  
  .config-option {
    padding: 12px;
  }
  
  .option-text {
    font-size: 0.9rem;
  }
  
  .option-description {
    font-size: 0.8rem;
  }
  
  .toggle-label {
    padding: 12px;
  }
  
  .toggle-text {
    font-size: 0.9rem;
  }
  
  .reset-btn {
    padding: 10px 18px;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .config-page {
    padding: 0;
  }
  
  .config-page > div {
    height: 100vh;
    width: 100vw;
    max-width: 100vw;
    border-radius: 0;
    border: none;
  }
  
  .config-header {
    padding: 15px;
    text-align: center;
  }
  
  .config-header h2 {
    font-size: 1.3rem;
  }
  
  .close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 8px;
  }
  
  .config-content {
    padding: 12px;
  }
  
  .config-footer {
    padding: 12px;
  }
  
  .save-btn {
    width: 100%;
    padding: 14px 18px;
    font-size: 0.95rem;
  }
  
  .game-active-warning {
    padding: 10px;
    margin-bottom: 16px;
  }
  
  .warning-text h3 {
    font-size: 0.85rem;
  }
  
  .warning-text p {
    font-size: 0.75rem;
  }
  
  .config-section {
    margin-bottom: 20px;
  }
  
  .config-section h3 {
    font-size: 1rem;
  }
  
  .config-description {
    font-size: 0.8rem;
    margin-bottom: 12px;
  }
  
  .config-option {
    padding: 10px;
  }
  
  .option-text {
    font-size: 0.85rem;
  }
  
  .option-description {
    font-size: 0.75rem;
  }
  
  .toggle-label {
    padding: 10px;
  }
  
  .toggle-slider {
    width: 40px;
    height: 22px;
    margin-right: 10px;
  }
  
  .toggle-slider::after {
    width: 18px;
    height: 18px;
  }
  
  .toggle-label input[type="checkbox"]:checked + .toggle-slider::after {
    transform: translateX(18px);
  }
  
  .toggle-text {
    font-size: 0.85rem;
  }
  
  .reset-btn {
    padding: 8px 16px;
    font-size: 0.8rem;
  }
}

/* Landscape mobile optimization for config */
@media (max-width: 900px) and (orientation: landscape) {
  .config-page {
    padding: 0;
  }
  
  .config-page > div {
    height: 100vh;
    width: 100vw;
    max-width: 100vw;
    border-radius: 0;
    border: none;
  }
  
  .config-header {
    padding: 8px 15px;
    text-align: center;
  }
  
  .config-header h2 {
    font-size: 1.2rem;
  }
  
  .close-btn {
    position: absolute;
    top: 8px;
    right: 15px;
  }
  
  .config-content {
    padding: 8px 15px;
  }
  
  .config-footer {
    padding: 8px 15px;
  }
  
  .save-btn {
    width: 100%;
    padding: 12px 20px;
    font-size: 0.9rem;
  }
  
  .config-section {
    margin-bottom: 12px;
  }
  
  .game-active-warning {
    padding: 6px;
    margin-bottom: 10px;
  }
  
  .config-option {
    padding: 8px;
  }
  
  .toggle-label {
    padding: 8px;
  }
}
</style>