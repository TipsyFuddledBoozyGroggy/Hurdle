<template>
  <v-dialog
    v-model="isOpen"
    fullscreen
    transition="dialog-bottom-transition"
    persistent
  >
    <v-card class="config-page">
      <!-- Header -->
      <v-app-bar color="surface" flat>
        <v-btn 
          icon 
          @click="$emit('close')" 
          class="ml-2"
          style="touch-action: manipulation; user-select: none;"
        >
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-app-bar-title class="text-h6 font-weight-medium">Settings</v-app-bar-title>
        <v-spacer></v-spacer>
        <v-btn 
          @click="saveSettings" 
          color="primary" 
          variant="text"
          :disabled="gameActive"
          class="mr-2"
        >
          Save
        </v-btn>
      </v-app-bar>

      <!-- Content -->
      <v-main class="config-content">
        <v-container class="py-6" style="max-width: 600px;">
          <!-- Game Active Warning -->
          <v-alert
            v-if="gameActive"
            type="info"
            variant="tonal"
            class="mb-6"
            icon="mdi-information"
          >
            Complete your current game to change settings
          </v-alert>

          <!-- Settings List -->
          <v-list class="bg-transparent">
            <!-- Guesses Setting -->
            <v-list-item class="px-0 mb-4">
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal" size="40">
                  <v-icon>mdi-numeric</v-icon>
                </v-avatar>
              </template>
              
              <v-list-item-title class="text-h6 mb-1">Guesses</v-list-item-title>
              <v-list-item-subtitle class="mb-3">Number of attempts per word</v-list-item-subtitle>
              
              <v-chip-group 
                v-model="maxGuessesIndex" 
                :disabled="gameActive"
                selected-class="text-primary"
                mandatory
              >
                <v-chip
                  v-for="(option, index) in guessOptions"
                  :key="option"
                  :value="index"
                  variant="outlined"
                  filter
                >
                  {{ option }}
                </v-chip>
              </v-chip-group>
            </v-list-item>

            <v-divider class="my-4"></v-divider>

            <!-- Difficulty Setting -->
            <v-list-item class="px-0 mb-4">
              <template v-slot:prepend>
                <v-avatar color="warning" variant="tonal" size="40">
                  <v-icon>mdi-target</v-icon>
                </v-avatar>
              </template>
              
              <v-list-item-title class="text-h6 mb-1">Difficulty</v-list-item-title>
              <v-list-item-subtitle class="mb-3">Word rarity level</v-list-item-subtitle>
              
              <v-chip-group 
                v-model="difficultyIndex" 
                :disabled="gameActive"
                selected-class="text-warning"
                mandatory
              >
                <v-chip
                  v-for="(option, index) in difficultyOptions"
                  :key="option.value"
                  :value="index"
                  variant="outlined"
                  filter
                >
                  {{ option.label }}
                </v-chip>
              </v-chip-group>
            </v-list-item>

            <v-divider class="my-4"></v-divider>

            <!-- Definitions Toggle -->
            <v-list-item class="px-0 mb-4">
              <template v-slot:prepend>
                <v-avatar color="info" variant="tonal" size="40">
                  <v-icon>mdi-book-open-variant</v-icon>
                </v-avatar>
              </template>
              
              <div class="flex-grow-1">
                <v-list-item-title class="text-h6 mb-1">Word Definitions</v-list-item-title>
                <v-list-item-subtitle>Show meanings after each word</v-list-item-subtitle>
              </div>
              
              <template v-slot:append>
                <v-switch
                  v-model="showDefinitions"
                  :disabled="gameActive"
                  color="info"
                  hide-details
                  inset
                ></v-switch>
              </template>
            </v-list-item>

            <v-divider class="my-4"></v-divider>

            <!-- Hard Mode Toggle -->
            <v-list-item class="px-0 mb-4">
              <template v-slot:prepend>
                <v-avatar color="error" variant="tonal" size="40">
                  <v-icon>mdi-fire</v-icon>
                </v-avatar>
              </template>
              
              <div class="flex-grow-1">
                <v-list-item-title class="text-h6 mb-1">Hard Mode</v-list-item-title>
                <v-list-item-subtitle>Must use revealed hints</v-list-item-subtitle>
              </div>
              
              <template v-slot:append>
                <v-switch
                  v-model="hardMode"
                  :disabled="gameActive"
                  color="error"
                  hide-details
                  inset
                ></v-switch>
              </template>
            </v-list-item>

            <v-divider class="my-6"></v-divider>

            <!-- Reset Section -->
            <v-list-item class="px-0">
              <template v-slot:prepend>
                <v-avatar color="grey" variant="tonal" size="40">
                  <v-icon>mdi-restore</v-icon>
                </v-avatar>
              </template>
              
              <div class="flex-grow-1">
                <v-list-item-title class="text-h6 mb-1">Reset Settings</v-list-item-title>
                <v-list-item-subtitle>Restore all defaults</v-list-item-subtitle>
              </div>
              
              <template v-slot:append>
                <v-btn
                  @click="resetSettings"
                  :disabled="gameActive"
                  color="grey"
                  variant="outlined"
                  size="small"
                >
                  Reset
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-container>
      </v-main>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
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

    // Computed properties for chip selection
    const maxGuessesIndex = computed({
      get: () => guessOptions.indexOf(maxGuesses.value),
      set: (index) => {
        if (index >= 0 && index < guessOptions.length) {
          maxGuesses.value = guessOptions[index];
        }
      }
    });

    const difficultyIndex = computed({
      get: () => difficultyOptions.findIndex(opt => opt.value === difficulty.value),
      set: (index) => {
        if (index >= 0 && index < difficultyOptions.length) {
          difficulty.value = difficultyOptions[index].value;
        }
      }
    });

    // Load current settings from GameConfig into local state
    const loadSettings = () => {
      const settings = gameConfig.getAllSettings();
      console.log('Loading settings from GameConfig:', settings);
      
      maxGuesses.value = settings.maxGuesses;
      difficulty.value = settings.difficulty;
      showDefinitions.value = settings.showDefinitions;
      hardMode.value = settings.hardMode;
      
      console.log('Local state after loading:');
      console.log('- Hard mode:', hardMode.value);
      console.log('- Show definitions:', showDefinitions.value);
      console.log('- Difficulty:', difficulty.value);
    };

    // Save all settings to GameConfig and emit changes
    const saveSettings = () => {
      console.log('Saving settings:');
      console.log('- Max guesses:', maxGuesses.value);
      console.log('- Difficulty:', difficulty.value);
      console.log('- Show definitions:', showDefinitions.value);
      console.log('- Hard mode:', hardMode.value);
      
      // Apply all settings at once
      gameConfig.setMaxGuesses(maxGuesses.value);
      gameConfig.setDifficulty(difficulty.value);
      gameConfig.setShowDefinitions(showDefinitions.value);
      gameConfig.setHardMode(hardMode.value);
      
      // Verify settings were saved
      console.log('Settings after save:');
      console.log('- Hard mode from config:', gameConfig.getHardMode());
      console.log('- Show definitions from config:', gameConfig.getShowDefinitions());
      console.log('- Difficulty from config:', gameConfig.getDifficulty());
      
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
      maxGuessesIndex,
      difficultyIndex,
      saveSettings,
      resetSettings
    };
  }
};
</script>

<style scoped>
.config-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  touch-action: manipulation;
  user-select: none;
}

.config-content {
  flex: 1;
  overflow-y: auto;
  touch-action: pan-y;
}

.v-list-item {
  min-height: auto !important;
  padding-top: 16px !important;
  padding-bottom: 16px !important;
  touch-action: manipulation;
}

.v-list-item-title {
  font-weight: 500 !important;
  line-height: 1.2 !important;
  user-select: none;
}

.v-list-item-subtitle {
  opacity: 0.7 !important;
  font-size: 0.875rem !important;
  line-height: 1.3 !important;
  user-select: none;
}

.v-chip-group {
  margin-top: 8px;
  touch-action: manipulation;
}

.v-chip {
  margin-right: 8px !important;
  margin-bottom: 4px !important;
  touch-action: manipulation;
  user-select: none;
}

.v-avatar {
  margin-right: 16px !important;
  user-select: none;
}

.v-switch {
  flex: none !important;
  touch-action: manipulation;
}

.v-btn {
  touch-action: manipulation;
  user-select: none;
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .v-container {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }
  
  .v-list-item {
    padding-top: 12px !important;
    padding-bottom: 12px !important;
  }
  
  .v-list-item-title {
    font-size: 1.1rem !important;
  }
  
  .v-list-item-subtitle {
    font-size: 0.8rem !important;
  }
  
  .v-avatar {
    margin-right: 12px !important;
    width: 36px !important;
    height: 36px !important;
  }
  
  .v-chip {
    font-size: 0.8rem !important;
    height: 28px !important;
  }
  
  .v-app-bar-title {
    font-size: 1.1rem !important;
  }
}

@media (max-width: 480px) {
  .v-container {
    padding-left: 12px !important;
    padding-right: 12px !important;
    padding-top: 16px !important;
  }
  
  .v-list-item {
    padding-top: 10px !important;
    padding-bottom: 10px !important;
  }
  
  .v-list-item-title {
    font-size: 1rem !important;
  }
  
  .v-list-item-subtitle {
    font-size: 0.75rem !important;
  }
  
  .v-avatar {
    margin-right: 10px !important;
    width: 32px !important;
    height: 32px !important;
  }
  
  .v-chip {
    font-size: 0.75rem !important;
    height: 26px !important;
    margin-right: 6px !important;
  }
  
  .v-btn {
    font-size: 0.8rem !important;
  }
}

/* Smooth transitions */
.v-chip {
  transition: all 0.2s ease !important;
}

.v-switch {
  transition: all 0.2s ease !important;
}

.v-list-item {
  transition: background-color 0.2s ease !important;
}

/* Custom chip styling */
.v-chip--variant-outlined {
  border-width: 1.5px !important;
}

.v-chip.v-chip--selected {
  font-weight: 500 !important;
}
</style>