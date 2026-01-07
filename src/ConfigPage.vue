<template>
  <v-dialog
    v-model="isOpen"
    fullscreen
    transition="dialog-bottom-transition"
    persistent
  >
    <v-card>
      <v-toolbar color="primary" dark>
        <v-toolbar-title>Game Settings</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <!-- Game Active Warning -->
        <v-alert
          v-if="gameActive"
          type="warning"
          variant="tonal"
          class="mb-6"
        >
          <v-alert-title>Game In Progress</v-alert-title>
          Settings cannot be changed during active gameplay. Finish your current game or start a new one to modify settings.
        </v-alert>

        <v-container>
          <!-- Max Guesses Setting -->
          <v-row class="mb-6">
            <v-col cols="12">
              <v-card :disabled="gameActive" variant="outlined">
                <v-card-title class="text-h6">Number of Guesses</v-card-title>
                <v-card-subtitle>Choose how many attempts you get to guess each word.</v-card-subtitle>
                <v-card-text>
                  <v-radio-group v-model="maxGuesses" :disabled="gameActive" inline>
                    <v-radio
                      v-for="option in guessOptions"
                      :key="option"
                      :label="`${option} guesses`"
                      :value="option"
                    ></v-radio>
                  </v-radio-group>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Difficulty Setting -->
          <v-row class="mb-6">
            <v-col cols="12">
              <v-card :disabled="gameActive" variant="outlined">
                <v-card-title class="text-h6">Difficulty Level</v-card-title>
                <v-card-subtitle>Controls how common or rare the target words are.</v-card-subtitle>
                <v-card-text>
                  <v-radio-group v-model="difficulty" :disabled="gameActive">
                    <v-radio
                      v-for="option in difficultyOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      <template v-slot:label>
                        <div>
                          <div class="font-weight-medium">{{ option.label }}</div>
                          <div class="text-caption text-medium-emphasis">{{ option.description }}</div>
                        </div>
                      </template>
                    </v-radio>
                  </v-radio-group>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Show Definitions Setting -->
          <v-row class="mb-6">
            <v-col cols="12">
              <v-card :disabled="gameActive" variant="outlined">
                <v-card-title class="text-h6">Word Definitions</v-card-title>
                <v-card-subtitle>Choose whether to show word definitions after completing each word.</v-card-subtitle>
                <v-card-text>
                  <v-switch
                    v-model="showDefinitions"
                    :disabled="gameActive"
                    label="Show word definitions"
                    color="primary"
                    inset
                  ></v-switch>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Hard Mode Setting -->
          <v-row class="mb-6">
            <v-col cols="12">
              <v-card :disabled="gameActive" variant="outlined">
                <v-card-title class="text-h6">Hard Mode</v-card-title>
                <v-card-subtitle>Any revealed hints must be used in subsequent guesses. Makes the game significantly more challenging.</v-card-subtitle>
                <v-card-text>
                  <v-switch
                    v-model="hardMode"
                    :disabled="gameActive"
                    label="Enable hard mode"
                    color="error"
                    inset
                  ></v-switch>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Reset Settings -->
          <v-row class="mb-6">
            <v-col cols="12">
              <v-card :disabled="gameActive" variant="outlined">
                <v-card-title class="text-h6">Reset Settings</v-card-title>
                <v-card-subtitle>Restore all settings to their default values.</v-card-subtitle>
                <v-card-text>
                  <v-btn
                    @click="resetSettings"
                    :disabled="gameActive"
                    color="error"
                    variant="outlined"
                  >
                    Reset to Defaults
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          @click="saveSettings"
          color="primary"
          size="large"
          variant="elevated"
          block
        >
          Save & Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
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
    
    // Reactive data - these are local state, not immediately saved
    const maxGuesses = ref(4);
    const difficulty = ref('medium');
    const showDefinitions = ref(true);
    const hardMode = ref(false);
    
    // Dialog visibility
    const isOpen = computed(() => true);
    
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

    // Load current settings from GameConfig into local state
    const loadSettings = () => {
      const settings = gameConfig.getAllSettings();
      maxGuesses.value = settings.maxGuesses;
      difficulty.value = settings.difficulty;
      showDefinitions.value = settings.showDefinitions;
      hardMode.value = settings.hardMode;
    };

    // Save all settings to GameConfig and emit changes
    const saveSettings = () => {
      // Apply all settings at once
      gameConfig.setMaxGuesses(maxGuesses.value);
      gameConfig.setDifficulty(difficulty.value);
      gameConfig.setShowDefinitions(showDefinitions.value);
      gameConfig.setHardMode(hardMode.value);
      
      // Emit single config changed event with all settings
      emit('configChanged', 'all', {
        maxGuesses: maxGuesses.value,
        difficulty: difficulty.value,
        showDefinitions: showDefinitions.value,
        hardMode: hardMode.value
      });
      
      // Close the config page
      emit('close');
    };

    const resetSettings = () => {
      // Reset to defaults in local state
      const defaults = {
        maxGuesses: 4,
        difficulty: 'medium',
        showDefinitions: true,
        hardMode: false
      };
      
      maxGuesses.value = defaults.maxGuesses;
      difficulty.value = defaults.difficulty;
      showDefinitions.value = defaults.showDefinitions;
      hardMode.value = defaults.hardMode;
      
      // Apply the reset to GameConfig
      gameConfig.resetToDefaults();
      
      // Emit config changed event
      emit('configChanged', 'reset', defaults);
    };

    // Initialize
    onMounted(() => {
      loadSettings();
    });

    return {
      isOpen,
      maxGuesses,
      difficulty,
      showDefinitions,
      hardMode,
      guessOptions,
      difficultyOptions,
      saveSettings,
      resetSettings
    };
  }
};
</script>

<style scoped>
.v-card.v-card--disabled {
  opacity: 0.6;
}

.v-radio-group--inline .v-radio {
  margin-right: 16px;
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .v-dialog {
    margin: 0;
  }
  
  .v-card-text {
    padding: 16px !important;
  }
  
  .v-container {
    padding: 0;
  }
}
</style>