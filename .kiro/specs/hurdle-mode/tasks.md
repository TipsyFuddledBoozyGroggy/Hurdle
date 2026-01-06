# Implementation Plan: Hurdle Mode

## Overview

This implementation plan converts the Hurdle Mode design into a series of incremental coding tasks that build upon the existing Wordle-style game. The tasks focus on extending the current GameController/GameState architecture with hurdle chain mechanics, scoring system, and enhanced UI components while maintaining clean integration with the existing Vue.js frontend.

## Tasks

- [ ] 1. Create core hurdle data models and scoring logic
  - Create HurdleSession class to track overall session state
  - Create CompletedHurdle class to represent individual completed hurdles
  - Create ScoreCalculator class with scoring formula implementation
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 1.1 Write property test for scoring calculation
  - **Property 7: Comprehensive Scoring Calculation**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ]* 1.2 Write unit tests for data models
  - Test HurdleSession initialization and state management
  - Test CompletedHurdle creation and data integrity
  - Test ScoreCalculator edge cases and boundary values
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 2. Implement HurdleState class for session state management
  - Create HurdleState class with hurdle tracking methods
  - Implement methods for incrementing hurdle numbers and completed counts
  - Add score accumulation and state reset functionality
  - _Requirements: 1.2, 1.3, 2.5, 2.6_

- [ ]* 2.1 Write property test for state management
  - **Property 1: Hurdle Mode Initialization**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.5**

- [ ]* 2.2 Write property test for hurdle progression
  - **Property 2: Hurdle Progression and Word Uniqueness**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 2.6, 6.5**

- [ ] 3. Create HurdleController class for orchestrating hurdle chains
  - Implement HurdleController constructor with dictionary integration
  - Add startHurdleMode method for session initialization
  - Create processHurdleCompletion method for handling successful hurdles
  - Implement startNextHurdle method with auto-guess logic
  - Add word selection with uniqueness validation
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4_

- [ ]* 3.1 Write property test for auto-guess counting
  - **Property 3: Auto-guess Counting**
  - **Validates: Requirements 2.4**

- [ ]* 3.2 Write property test for game failure handling
  - **Property 6: Game Failure Handling**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [ ] 4. Checkpoint - Ensure core hurdle logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Extend Vue.js App component for hurdle mode UI
  - Add hurdle mode state management to App.vue
  - Create reactive properties for hurdle number, completed count, and score
  - Implement hurdle mode toggle and initialization
  - Add UI elements for displaying hurdle progress and scoring
  - _Requirements: 1.4, 7.1, 7.2, 7.4_

- [ ]* 5.1 Write property test for UI display requirements
  - **Property 4: Comprehensive UI Display**
  - **Validates: Requirements 1.4, 7.1, 7.2, 7.4**

- [ ] 6. Implement hurdle transition animations and UI updates
  - Add board clearing animation for hurdle completion
  - Implement auto-guess entry with tile flipping animation
  - Create hurdle number update animations
  - Add score display animations for completed hurdles
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.3_

- [ ]* 6.1 Write property test for transition animations
  - **Property 5: Transition Animation Sequence**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [ ]* 6.2 Write property test for score display
  - **Property 9: Score Display on Completion**
  - **Validates: Requirements 7.3**

- [ ] 7. Add game ending and restart functionality
  - Implement game over detection and final score calculation
  - Create game end summary display with hurdle count and final score
  - Add restart functionality with complete state reset
  - Implement final score display and breakdown
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.5_

- [ ]* 7.1 Write property test for final score calculation
  - **Property 8: Final Score Calculation**
  - **Validates: Requirements 5.4, 5.6**

- [ ]* 7.2 Write property test for game end summary
  - **Property 10: Game End Summary**
  - **Validates: Requirements 7.5**

- [ ]* 7.3 Write property test for restart functionality
  - **Property 13: Restart State Reset**
  - **Validates: Requirements 6.4**

- [ ] 8. Implement word definition tracking and display
  - Add solved words list management to HurdleState
  - Create word definition display components
  - Implement definition viewing options after hurdle completion
  - Add definition access for all completed words
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 8.1 Write property test for word definition management
  - **Property 11: Word Definition Management**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.5**

- [ ]* 8.2 Write property test for definition display format
  - **Property 12: Definition Display Format**
  - **Validates: Requirements 8.4**

- [ ] 9. Add edge case handling and error recovery
  - Implement word selection retry logic with fallback strategies
  - Add state corruption detection and recovery
  - Create animation timeout handling
  - Add UI state synchronization safeguards
  - _Requirements: 6.3, 6.4_

- [ ]* 9.1 Write unit tests for edge cases
  - Test zero hurdles completed scenario
  - Test auto-guess immediate win scenario
  - Test word selection failures and recovery
  - _Requirements: 5.5, 6.1, 6.2, 6.3_

- [ ] 10. Integration and wiring
  - Integrate HurdleController with existing GameController
  - Wire hurdle mode UI components with game logic
  - Connect scoring system with UI displays
  - Ensure seamless mode switching between regular and hurdle modes
  - _Requirements: All requirements integration_

- [ ]* 10.1 Write integration tests
  - Test complete hurdle mode sessions from start to finish
  - Test mode switching and state isolation
  - Test UI synchronization with game state changes
  - _Requirements: All requirements integration_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- Integration tests ensure components work together correctly