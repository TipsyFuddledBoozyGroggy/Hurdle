# Requirements Document

## Introduction

Hurdle Mode is the default and primary game mode that transforms the traditional single-word challenge into a continuous chain of word puzzles called "hurdles." Players progress through an unlimited sequence of 5-letter word puzzles, with each successful completion automatically starting the next hurdle using the previous answer as the first guess. The mode features a sophisticated scoring system that rewards both consistency and skill, creating an engaging endless gameplay experience. This replaces the previous single-word game mode entirely.

## Glossary

- **Hurdle Mode**: The default game mode featuring chained word puzzles with scoring
- **Hurdle**: A single 5-letter word puzzle within the hurdle chain, allowing up to 4 guesses
- **Hurdle Chain**: The continuous sequence of hurdles that continues until the player fails
- **Auto-guess**: The automatic first guess of a new hurdle, set to the correct answer of the previous hurdle
- **Hurdle Number**: The sequential position of the current hurdle in the chain (starting at 1)
- **Completed Hurdles**: The total count of hurdles successfully solved in the current game session
- **Guess Multiplier**: A scoring modifier based on the number of guesses used to solve a hurdle
- **Final Score**: The total points calculated when the hurdle chain ends
- **Board Clearing**: The UI animation and state reset that occurs between hurdles
- **Tile Flipping Animation**: The visual effect used when the board is cleared and auto-guess is entered

## Requirements

### Requirement 1

**User Story:** As a player, I want the game to start in hurdle mode by default, so that I can immediately play the enhanced chained puzzle experience.

#### Acceptance Criteria

1. WHEN the game application starts, THEN the Game System SHALL automatically initialize Hurdle 1 with a random 5-letter word
2. WHEN the game initializes, THEN the Game System SHALL set the hurdle number to 1 and completed hurdles count to 0
3. WHEN the game starts, THEN the Game System SHALL initialize the score to 0 and reset all game state
4. WHEN the game is active, THEN the Game System SHALL display the current hurdle number and total completed hurdles prominently
5. WHEN the game initializes, THEN the Game System SHALL ensure exactly 4 attempts are available for the first hurdle

### Requirement 2

**User Story:** As a player, I want to progress to the next hurdle when I solve the current word, so that I can continue the challenge chain.

#### Acceptance Criteria

1. WHEN a player solves the current hurdle in 4 or fewer guesses, THEN the Game System SHALL immediately begin a new hurdle
2. WHEN a new hurdle begins, THEN the Game System SHALL select a secret word that is different from the previous hurdle's answer
3. WHEN a new hurdle starts, THEN the Game System SHALL automatically enter the previous hurdle's correct answer as the first guess
4. WHEN the auto-guess is entered, THEN the Game System SHALL count it as Guess #1 for the new hurdle
5. WHEN transitioning between hurdles, THEN the Game System SHALL increment the hurdle number by 1
6. WHEN a hurdle is completed, THEN the Game System SHALL increment the completed hurdles count by 1

### Requirement 3

**User Story:** As a player, I want to see smooth visual transitions between hurdles, so that the progression feels polished and clear.

#### Acceptance Criteria

1. WHEN a hurdle is completed, THEN the Game System SHALL clear the game board with the tile flipping animation
2. WHEN the board is cleared, THEN the Game System SHALL enter the auto-guess with the tile flipping animation
3. WHEN the auto-guess animation completes, THEN the Game System SHALL display the feedback for the auto-guess
4. WHEN transitioning between hurdles, THEN the Game System SHALL update the hurdle number display
5. WHEN the transition completes, THEN the Game System SHALL be ready to accept the player's second guess

### Requirement 4

**User Story:** As a player, I want the game to end when I fail to solve a hurdle, so that I understand when my run is complete.

#### Acceptance Criteria

1. WHEN a player fails to guess the word within 4 attempts, THEN the Game System SHALL end the game immediately
2. WHEN the game ends due to failure, THEN the Game System SHALL display the correct answer for the failed hurdle
3. WHEN the game ends, THEN the Game System SHALL calculate and display the final score based on completed hurdles
4. WHEN the game ends, THEN the Game System SHALL provide an option to start a new game session
5. WHEN the game ends, THEN the Game System SHALL preserve the count of completed hurdles for score calculation

### Requirement 5

**User Story:** As a player, I want to earn points based on my performance, so that I can track my skill and improvement over time.

#### Acceptance Criteria

1. WHEN a hurdle is completed, THEN the Game System SHALL calculate points using the formula: hurdle_number × 100 × guess_multiplier
2. WHEN calculating the guess multiplier, THEN the Game System SHALL use 1.75x for 1 guess, 1.5x for 2 guesses, 1.25x for 3 guesses, and 1.0x for 4 guesses
3. WHEN a hurdle is completed in 4 guesses, THEN the Game System SHALL apply a 1.0x multiplier
4. WHEN the game ends, THEN the Game System SHALL sum all points from completed hurdles to determine the final score
5. WHEN zero hurdles are completed, THEN the Game System SHALL set the final score to 0
6. WHEN displaying scores, THEN the Game System SHALL show both individual hurdle points and cumulative total

### Requirement 6

**User Story:** As a player, I want to handle edge cases gracefully, so that unusual situations don't break my game experience.

#### Acceptance Criteria

1. WHEN the auto-guess immediately solves the new hurdle, THEN the Game System SHALL award points and continue to the next hurdle
2. WHEN the auto-guess solves the hurdle immediately, THEN the Game System SHALL count it as a 1-guess completion for scoring
3. WHEN the word dictionary is exhausted, THEN the Game System SHALL handle the situation gracefully without crashing
4. WHEN restarting the game, THEN the Game System SHALL reset hurdle count, score, and all game state to initial values
5. WHEN transitioning between hurdles, THEN the Game System SHALL ensure the new secret word is always different from the previous answer

### Requirement 7

**User Story:** As a player, I want to see my progress and scoring information, so that I can understand my performance during the game.

#### Acceptance Criteria

1. WHEN playing the game, THEN the Game System SHALL display the current hurdle number prominently
2. WHEN playing the game, THEN the Game System SHALL display the total number of completed hurdles
3. WHEN a hurdle is completed, THEN the Game System SHALL display the points earned for that specific hurdle
4. WHEN playing the game, THEN the Game System SHALL display the current cumulative score
5. WHEN the game ends, THEN the Game System SHALL display a summary showing completed hurdles and final score

### Requirement 8

**User Story:** As a player, I want to view definitions of solved words, so that I can learn from the words I've encountered.

#### Acceptance Criteria

1. WHEN a hurdle is completed, THEN the Game System SHALL provide an option to view the definition of the solved word
2. WHEN viewing solved words, THEN the Game System SHALL maintain a list of all words completed in the current session
3. WHEN the game ends, THEN the Game System SHALL provide access to definitions of all completed words
4. WHEN displaying word definitions, THEN the Game System SHALL show the word alongside its definition
5. WHEN transitioning between hurdles, THEN the Game System SHALL add the completed word to the solved words list

### Requirement 9

**User Story:** As a developer, I want to remove all non-hurdle mode code and UI elements, so that the application is simplified and focused on the hurdle experience.

#### Acceptance Criteria

1. WHEN the application loads, THEN the Game System SHALL NOT display any mode toggle buttons or switches
2. WHEN cleaning up the codebase, THEN the Game System SHALL remove all regular/single-word game mode logic and UI components
3. WHEN removing legacy code, THEN the Game System SHALL remove all tests related to non-hurdle functionality
4. WHEN simplifying the UI, THEN the Game System SHALL remove conditional rendering based on game mode
5. WHEN updating the interface, THEN the Game System SHALL always show hurdle-specific UI elements (score, hurdle number, completed count)
