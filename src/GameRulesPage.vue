<template>
  <v-dialog
    v-model="isOpen"
    fullscreen
    transition="dialog-bottom-transition"
    persistent
  >
    <v-card>
      <v-toolbar color="primary" dark>
        <v-toolbar-title>Game Rules & Scoring</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0">
        <v-container class="py-6">
          <!-- Game Overview -->
          <v-row class="mb-6">
            <v-col cols="12">
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-h5 d-flex align-center">
                  <v-icon class="mr-3" color="primary">mdi-gamepad-variant</v-icon>
                  What is Hurdle?
                </v-card-title>
                <v-card-text class="text-body-1">
                  <p class="mb-3">
                    Hurdle is a challenging word-guessing game inspired by Wordle, but with significantly increased difficulty. 
                    Instead of just solving one word, you'll face an endless series of hurdles, each more challenging than the last.
                  </p>
                  <v-alert type="info" variant="tonal" class="mb-3">
                    <strong>Key Difference:</strong> Hurdle uses over 5,000 English words compared to Wordle's smaller dictionary, 
                    making it much more challenging and educational.
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Basic Gameplay -->
          <v-row class="mb-6">
            <v-col cols="12">
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-h5 d-flex align-center">
                  <v-icon class="mr-3" color="success">mdi-target</v-icon>
                  Basic Gameplay
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <h3 class="text-h6 mb-3">Objective</h3>
                      <p class="mb-4">Guess the 5-letter word within your allowed attempts (3-6 guesses, configurable).</p>
                      
                      <h3 class="text-h6 mb-3">How to Play</h3>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>1. Type a 5-letter word and press Enter</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>2. Letters will change color to give you clues</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>3. Use the clues to guess the word</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>4. Solve the word to advance to the next hurdle</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-col>
                    <v-col cols="12" md="6">
                      <h3 class="text-h6 mb-3">Letter Color Meanings</h3>
                      <v-card variant="tonal" color="success" class="mb-2">
                        <v-card-text class="py-2">
                          <v-icon class="mr-2">mdi-check-circle</v-icon>
                          <strong>Green:</strong> Correct letter in the correct position
                        </v-card-text>
                      </v-card>
                      <v-card variant="tonal" color="warning" class="mb-2">
                        <v-card-text class="py-2">
                          <v-icon class="mr-2">mdi-alert-circle</v-icon>
                          <strong>Yellow:</strong> Correct letter in the wrong position
                        </v-card-text>
                      </v-card>
                      <v-card variant="tonal" color="grey-darken-2" class="mb-2">
                        <v-card-text class="py-2">
                          <v-icon class="mr-2">mdi-close-circle</v-icon>
                          <strong>Gray:</strong> Letter is not in the word
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Scoring System -->
          <v-row class="mb-6">
            <v-col cols="12">
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-h5 d-flex align-center">
                  <v-icon class="mr-3" color="warning">mdi-trophy</v-icon>
                  Scoring System
                </v-card-title>
                <v-card-text>
                  <v-alert type="success" variant="tonal" class="mb-4">
                    <v-alert-title>Scoring Formula</v-alert-title>
                    <strong>Score = Hurdle Number × 100 × Guess Multiplier</strong>
                  </v-alert>

                  <v-row>
                    <v-col cols="12" md="6">
                      <h3 class="text-h6 mb-3">Guess Multipliers</h3>
                      <v-table density="compact">
                        <thead>
                          <tr>
                            <th>Guesses Used</th>
                            <th>Multiplier</th>
                            <th>Performance</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><v-chip color="success" size="small">1 guess</v-chip></td>
                            <td><strong>1.75×</strong></td>
                            <td>Perfect!</td>
                          </tr>
                          <tr>
                            <td><v-chip color="success" size="small">2 guesses</v-chip></td>
                            <td><strong>1.5×</strong></td>
                            <td>Excellent</td>
                          </tr>
                          <tr>
                            <td><v-chip color="warning" size="small">3 guesses</v-chip></td>
                            <td><strong>1.25×</strong></td>
                            <td>Good</td>
                          </tr>
                          <tr>
                            <td><v-chip color="error" size="small">4+ guesses</v-chip></td>
                            <td><strong>1.0×</strong></td>
                            <td>Standard</td>
                          </tr>
                        </tbody>
                      </v-table>
                    </v-col>
                    <v-col cols="12" md="6">
                      <h3 class="text-h6 mb-3">Scoring Examples</h3>
                      <v-card variant="tonal" class="mb-2">
                        <v-card-text class="py-2">
                          <strong>Hurdle 1, 1 guess:</strong> 1 × 100 × 1.75 = <span class="text-success font-weight-bold">175 points</span>
                        </v-card-text>
                      </v-card>
                      <v-card variant="tonal" class="mb-2">
                        <v-card-text class="py-2">
                          <strong>Hurdle 5, 2 guesses:</strong> 5 × 100 × 1.5 = <span class="text-success font-weight-bold">750 points</span>
                        </v-card-text>
                      </v-card>
                      <v-card variant="tonal" class="mb-2">
                        <v-card-text class="py-2">
                          <strong>Hurdle 10, 4 guesses:</strong> 10 × 100 × 1.0 = <span class="text-warning font-weight-bold">1,000 points</span>
                        </v-card-text>
                      </v-card>
                      <v-alert type="info" variant="tonal" class="mt-3">
                        <strong>Pro Tip:</strong> Higher hurdles are worth more points, so the game gets more rewarding as you progress!
                      </v-alert>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Game Modes -->
          <v-row class="mb-6">
            <v-col cols="12">
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-h5 d-flex align-center">
                  <v-icon class="mr-3" color="error">mdi-fire</v-icon>
                  Game Modes & Settings
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <h3 class="text-h6 mb-3">Hard Mode</h3>
                      <v-alert type="error" variant="tonal" class="mb-3">
                        <v-alert-title>Challenge Mode</v-alert-title>
                        In Hard Mode, any revealed hints must be used in subsequent guesses.
                      </v-alert>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>• Green letters must stay in the same position</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>• Yellow letters must be included in your next guess</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>• Makes the game significantly more challenging</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-col>
                    <v-col cols="12" md="6">
                      <h3 class="text-h6 mb-3">Difficulty Levels</h3>
                      <v-card variant="tonal" color="success" class="mb-2">
                        <v-card-text class="py-2">
                          <strong>Easy:</strong> Common words (5000+ most frequent)
                        </v-card-text>
                      </v-card>
                      <v-card variant="tonal" color="warning" class="mb-2">
                        <v-card-text class="py-2">
                          <strong>Medium:</strong> Moderate words (balanced difficulty)
                        </v-card-text>
                      </v-card>
                      <v-card variant="tonal" color="error" class="mb-2">
                        <v-card-text class="py-2">
                          <strong>Hard:</strong> Rare words (challenging vocabulary)
                        </v-card-text>
                      </v-card>
                      
                      <h3 class="text-h6 mb-3 mt-4">Guess Limits</h3>
                      <p>Choose between 3, 4, 5, or 6 guesses per word. Fewer guesses = higher challenge!</p>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Strategy Tips -->
          <v-row class="mb-6">
            <v-col cols="12">
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-h5 d-flex align-center">
                  <v-icon class="mr-3" color="info">mdi-lightbulb</v-icon>
                  Strategy Tips
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <h3 class="text-h6 mb-3">Starting Words</h3>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>• Use words with common vowels (A, E, I, O, U)</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>• Include frequent consonants (R, S, T, L, N)</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>• Good starters: ADIEU, AROSE, SLATE, CRANE</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-col>
                    <v-col cols="12" md="6">
                      <h3 class="text-h6 mb-3">Advanced Tips</h3>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>• Pay attention to letter frequency patterns</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>• Use elimination strategy for gray letters</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>• Consider word endings (-ING, -ED, -ER, -LY)</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>• Build vocabulary to handle rare words</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Word Definitions -->
          <v-row class="mb-6">
            <v-col cols="12">
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-h5 d-flex align-center">
                  <v-icon class="mr-3" color="purple">mdi-book-open-variant</v-icon>
                  Learning Features
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <h3 class="text-h6 mb-3">Word Definitions</h3>
                      <p class="mb-3">
                        After completing each word, you can view its definition to expand your vocabulary. 
                        This feature can be toggled in settings.
                      </p>
                      <v-alert type="info" variant="tonal">
                        <strong>Educational Benefit:</strong> Learn new words and their meanings as you play!
                      </v-alert>
                    </v-col>
                    <v-col cols="12" md="6">
                      <h3 class="text-h6 mb-3">Solved Words History</h3>
                      <p class="mb-3">
                        At the end of each game session, review all the words you've solved. 
                        Click on any word to see its definition again.
                      </p>
                      <v-alert type="success" variant="tonal">
                        <strong>Progress Tracking:</strong> Build your vocabulary over time!
                      </v-alert>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Game End -->
          <v-row class="mb-6">
            <v-col cols="12">
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-h5 d-flex align-center">
                  <v-icon class="mr-3" color="success">mdi-flag-checkered</v-icon>
                  Game End & Scoring
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <h3 class="text-h6 mb-3">When Does the Game End?</h3>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>• When you fail to guess a word within your allowed attempts</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>• The game continues indefinitely as long as you keep solving words</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>• Challenge yourself to reach higher hurdle numbers!</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-col>
                    <v-col cols="12" md="6">
                      <h3 class="text-h6 mb-3">Final Score</h3>
                      <p class="mb-3">
                        Your final score is the sum of all individual hurdle scores. 
                        Higher hurdle numbers and fewer guesses lead to better scores.
                      </p>
                      <v-alert type="warning" variant="tonal">
                        <strong>Challenge:</strong> Can you reach Hurdle 20? 50? 100? The difficulty keeps increasing!
                      </v-alert>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          @click="$emit('close')"
          color="primary"
          size="large"
          variant="elevated"
        >
          Got It - Let's Play!
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'GameRulesPage',
  emits: ['close'],
  setup() {
    const isOpen = computed(() => true);

    return {
      isOpen
    };
  }
};
</script>

<style scoped>
.v-table th {
  font-weight: 600;
}

.v-card-title .v-icon {
  opacity: 0.8;
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
    padding: 8px;
  }
  
  .text-h5 {
    font-size: 1.25rem !important;
  }
  
  .text-h6 {
    font-size: 1.1rem !important;
  }
}
</style>