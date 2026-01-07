<template>
  <v-dialog
    v-model="isOpen"
    fullscreen
    transition="dialog-bottom-transition"
    persistent
  >
    <v-card class="d-flex flex-column" style="height: 100vh;">
      <v-toolbar color="primary" dark>
        <v-toolbar-title>Game Settings</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="flex-grow-1 overflow-y-auto pa-4">
        <!-- Game Active Warning -->
        <v-alert
          v-if="gameActive"
          type="warning"
          variant="tonal"
          class="mb-4"
          density="compact"
        >
          <v-alert-title>Game In Progress</v-alert-title>
          Settings cannot be changed during active gameplay.
        </v-alert>

        <v-container class="pa-0">
          <!-- Max Guesses Setting -->
          <v-card :disabled="gameActive" variant="outlined" class="mb-4">
            <v-card-item>
              <v-card-title class="text-h6 pb-2">Number of Guesses</v-card-title>
              <v-card-subtitle class="pb-3">Choose how many attempts you get per word</v-card-subtitle>
              <v-radio-group v-model="maxGuesses" :disabled="gameActive" inline density="compact">
                <v-radio
                  v-for="option in guessOptions"
                  :key="option"
                  :label="`${option}`"
                  :value="option"
                  density="compact"
                ></v-radio>
              </v-radio-group>
            </v-card-item>
          </v-card>

          <!-- Difficulty Setting -->
          <v-card :disabled="gameActive" variant="outlined" class="mb-4">
            <v-card-item>
              <v-card-title class="text-h6 pb-2">Difficulty Level</v-card-title>
              <v-card-subtitle class="pb-3">Controls word rarity</v-card-subtitle>
              <v-radio-group v-model="difficulty" :disabled="gameActive" density="compact">
                <v-radio
                  v-for="option in difficultyOptions"
                  :key="option.value"
                  :value="option.value"
                  density="compact"
                >
                  <template v-slot:label>
                    <div>
                      <div class="font-weight-medium">{{ option.label }}</div>
                      <div class="text-caption text-medium-emphasis">{{ option.description }}</div>
                    </div>
                  </template>
                </v-radio>
              </v-radio-group>
            </v-card-item>
          </v-card>

          <!-- Toggles Row -->
          <v-row class="mb-4">
            <v-col cols="12" sm="6">
              <v-card :disabled="gameActive" variant="outlined" class="h-100">
                <v-card-item>
                  <v-card-title class="text-h6 pb-2">Definitions</v-card-title>
                  <v-card-subtitle class="pb-3">Show word meanings</v-card-subtitle>
                  <v-switch
                    v-model="showDefinitions"
                    :disabled="gameActive"
                    label="Show definitions"
                    color="primary"
                    density="compact"
                    hide-details
                  ></v-switch>
                </v-card-item>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card :disabled="gameActive" variant="outlined" class="h-100">
                <v-card-item>
                  <v-card-title class="text-h6 pb-2">Hard Mode</v-card-title>
                  <v-card-subtitle class="pb-3">Use revealed hints</v-card-subtitle>
                  <v-switch
                    v-model="hardMode"
                    :disabled="gameActive"
                    label="Enable hard mode"
                    color="error"
                    density="compact"
                    hide-details
                  ></v-switch>
                </v-card-item>
              </v-card>
            </v-col>
          </v-row>

          <!-- Reset Settings -->
          <v-card :disabled="gameActive" variant="outlined" class="mb-4">
            <v-card-item>
              <v-card-title class="text-h6 pb-2">Reset Settings</v-card-title>
              <v-card-subtitle class="pb-3">Restore defaults</v-card-subtitle>
              <v-btn
                @click="resetSettings"
                :disabled="gameActive"
                color="error"
                variant="outlined"
                size="small"
              >
                Reset to Defaults
              </v-btn>
            </v-card-item>
          </v-card>

          <!-- Extra padding at bottom -->
          <div style="height: 80px;"></div>
        </v-container>
      </v-card-text>

      <!-- Fixed Footer with Save Button -->
      <v-card-actions class="flex-shrink-0 pa-4 bg-surface" style="border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));">
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

/* Ensure proper flexbox layout */
.v-card {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.v-card-text {
  flex: 1 1 auto;
  overflow-y: auto;
}

.v-card-actions {
  flex: 0 0 auto;
  background-color: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .v-dialog {
    margin: 0;
  }
  
  .v-card-text {
    padding: 8px !important;
  }
  
  .v-container {
    padding: 0;
  }
  
  .v-card-actions {
    padding: 12px !important;
  }
  
  .v-card.mb-4 {
    margin-bottom: 12px !important;
  }
  
  .v-card-item {
    padding: 12px !important;
  }
  
  .v-card-title {
    font-size: 1rem !important;
    padding-bottom: 4px !important;
  }
  
  .v-card-subtitle {
    font-size: 0.8rem !important;
    padding-bottom: 8px !important;
  }
  
  .v-radio .v-label {
    font-size: 0.85rem !important;
  }
  
  .v-switch .v-label {
    font-size: 0.85rem !important;
  }
  
  .v-btn {
    font-size: 0.8rem !important;
  }
  
  .v-alert {
    margin-bottom: 12px !important;
  }
  
  .v-alert-title {
    font-size: 0.9rem !important;
  }
}

@media (max-width: 480px) {
  .v-card-text {
    padding: 6px !important;
  }
  
  .v-card-actions {
    padding: 8px !important;
  }
  
  .v-card.mb-4 {
    margin-bottom: 8px !important;
  }
  
  .v-card-item {
    padding: 8px !important;
  }
  
  .v-card-title {
    font-size: 0.9rem !important;
    padding-bottom: 2px !important;
  }
  
  .v-card-subtitle {
    font-size: 0.75rem !important;
    padding-bottom: 6px !important;
  }
  
  .v-radio .v-label {
    font-size: 0.8rem !important;
  }
  
  .v-switch .v-label {
    font-size: 0.8rem !important;
  }
  
  .v-btn {
    font-size: 0.75rem !important;
  }
  
  .v-row {
    margin-bottom: 8px !important;
  }
}
</style>