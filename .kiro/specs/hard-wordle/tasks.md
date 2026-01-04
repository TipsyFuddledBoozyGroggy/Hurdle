# Hard Wordle Implementation Plan

## Implementation Notes

**Architecture Decision**: The implementation uses Vue.js 3 with the Composition API as specified in the design document. The application follows a layered architecture with clear separation between data, logic, and presentation layers.

## Core Implementation (Completed)

- [x] 1. Set up project structure and dependencies
  - Create project directory structure (src, tests, public, infrastructure)
  - Initialize package.json with dependencies (Jest, fast-check, webpack/build tools, Vue 3)
  - Create basic HTML structure and CSS files
  - Set up Jest configuration for testing
  - Set up Webpack configuration with Vue loader
  - Create .gitignore file
  - _Requirements: All_

- [x] 2. Create word dictionary and Dictionary module
  - [x] 2.1 Obtain and prepare 5-letter word dictionary
    - Source a comprehensive list of 5-letter English words (minimum 5000 words)
    - Create words.json file with word array
    - _Requirements: 7.1, 7.3, 7.4_

  - [x] 2.2 Implement Dictionary class
    - Write Dictionary class with constructor, isValidWord(), getRandomWord(), and size() methods
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 2.3 Write property test for dictionary operations
    - **Property 1: Target word validity**
    - **Property 5: Dictionary validation**
    - **Property 16: Dictionary minimum size**
    - **Validates: Requirements 1.1, 2.2, 7.1, 7.2, 7.3, 7.4**

- [x] 3. Implement feedback generation algorithm
  - [x] 3.1 Create LetterFeedback and Guess data structures
    - Define LetterFeedback type with letter and status fields
    - Implement Guess class with word and feedback properties
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Implement FeedbackGenerator class
    - Write generateFeedback() method with two-pass algorithm
    - First pass: mark exact position matches as 'correct'
    - Second pass: mark wrong position matches as 'present', handle letter frequency
    - Mark remaining letters as 'absent'
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.3 Write unit tests for feedback edge cases
    - Test duplicate letters in guess and target (e.g., "SPEED" vs "ERASE")
    - Test all letters correct scenario
    - Test no letters correct scenario
    - Test mix of correct, present, and absent letters
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x] 3.4 Write property test for feedback generation
    - **Property 9: Feedback correctness**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 4. Implement GameState class
  - [x] 4.1 Create GameState class
    - Implement constructor with targetWord and maxAttempts
    - Implement addGuess(), getRemainingAttempts(), isGameOver(), getGuesses() methods
    - Track game status ('in-progress', 'won', 'lost')
    - _Requirements: 1.2, 2.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

  - [x] 4.2 Write unit tests for game state transitions
    - Test initial state values
    - Test state after each guess
    - Test game status changes (in-progress → won/lost)
    - _Requirements: 1.2, 2.4, 5.1, 5.2, 5.3_

  - [x] 4.3 Write property tests for game state
    - **Property 2: Initial state consistency**
    - **Property 7: Attempt decrement**
    - **Property 10: Guess history ordering**
    - **Property 11: Guess persistence**
    - **Property 15: Remaining attempts accuracy**
    - **Validates: Requirements 1.2, 2.4, 4.1, 4.2, 4.3, 6.2**

- [x] 5. Implement GameController class
  - [x] 5.1 Create GameController class
    - Implement constructor accepting Dictionary instance
    - Implement startNewGame() method
    - Implement submitGuess() method with validation
    - Implement getGameState() method
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 Write unit tests for input validation
    - Test empty string rejection
    - Test wrong length rejection
    - Test non-dictionary word rejection
    - Test valid word acceptance in different cases
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 5.3 Write property tests for game controller
    - **Property 3: State isolation between games**
    - **Property 4: Length validation**
    - **Property 6: Invalid guess preservation**
    - **Property 8: Case normalization**
    - **Property 12: Win condition**
    - **Property 13: Loss condition**
    - **Property 14: Game status accuracy**
    - **Validates: Requirements 1.4, 2.1, 2.3, 2.5, 5.1, 5.2, 5.3**

- [x] 6. Checkpoint - Ensure all core game logic tests pass
  - All 78 tests passing successfully

- [x] 7. Implement Vue.js UI components
  - [x] 7.1 Create App.vue component with Composition API
    - Implement reactive state management for game state, current guess, messages
    - Create computed properties for game board display and game status
    - Implement methods for handling user input, guess submission, and new game
    - Add template with game board, input section, and message area
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 7.2 Implement on-screen keyboard
    - Create QWERTY keyboard layout with clickable keys
    - Add Enter and Backspace functionality
    - Implement keyboard state tracking (correct/present/absent letter highlighting)
    - Handle both on-screen clicks and physical keyboard input
    - _Requirements: 6.1, 6.3_

  - [x] 7.3 Implement game board visualization
    - Display all 6 guess rows (empty tiles shown by default)
    - Show letter tiles with appropriate color coding (green/yellow/gray)
    - Display current guess as user types
    - Maintain visual consistency between empty and filled rows
    - _Requirements: 6.1, 6.4, 4.1, 4.4_

- [x] 8. Implement application entry point
  - [x] 8.1 Update main.js to initialize Vue application
    - Load word dictionary from words.json file using fetch
    - Initialize Dictionary instance with loaded words
    - Initialize GameController with Dictionary
    - Create and mount Vue app with GameController as prop
    - Handle dictionary load errors with user-friendly message
    - _Requirements: 7.1, 6.1_

- [x] 9. Enhanced UI features
  - [x] 9.1 Add word definition display
    - Fetch word definitions from dictionary API after game ends
    - Display word definition with part of speech
    - Handle API errors gracefully
    - _Requirements: 5.3, 6.4_

  - [x] 9.2 Implement keyboard visual feedback
    - Update keyboard key colors based on guess feedback
    - Apply best status when letter appears multiple times (correct > present > absent)
    - Reset keyboard state on new game
    - _Requirements: 3.1, 3.2, 6.4_

- [x] 10. Checkpoint - Verify complete application functionality
  - All tests passing (78 tests)
  - Vue application fully functional with enhanced UI

## Infrastructure & Deployment (Completed)

- [x] 11. Set up Docker containerization
  - [x] 11.1 Create Dockerfile with multi-stage build
    - Stage 1: Node.js build environment, install dependencies, run tests, build application with webpack
    - Stage 2: Nginx production environment, copy built files from dist/, configure nginx
    - Ensure tests run during build and fail build if tests fail
    - _Requirements: 8.1, 8.3, 8.4, 8.5_

  - [x] 11.2 Create nginx.conf
    - Configure nginx to serve static files from /usr/share/nginx/html
    - Set up proper MIME types for .js, .css, .html files
    - Configure port 80 and default server
    - Add gzip compression for better performance
    - _Requirements: 8.2_

  - [x] 11.3 Create .dockerignore file
    - Exclude node_modules, tests, .git, and unnecessary files from Docker context
    - Include only src, public, package files, and config files
    - _Requirements: 8.5_

- [x] 12. Create AWS CloudFormation templates
  - [x] 12.1 Create infrastructure/network-stack.yaml
    - Define VPC with CIDR block
    - Create public subnets across 2 availability zones
    - Create Internet Gateway and attach to VPC
    - Define route tables for public subnets
    - Create security group for ALB (allow HTTP/HTTPS from internet)
    - Create security group for ECS tasks (allow traffic from ALB only)
    - Add resource tags for cost tracking
    - _Requirements: 10.1, 10.2, 10.5_

  - [x] 12.2 Create infrastructure/ecr-stack.yaml
    - Define ECR repository for Docker images
    - Configure image scanning on push
    - Set lifecycle policy to keep last 10 images
    - Add resource tags
    - _Requirements: 10.1, 10.2, 10.5_

  - [x] 12.3 Create infrastructure/ecs-stack.yaml
    - Define ECS cluster using Fargate launch type
    - Create task definition with container configuration (image from ECR, port 80, memory/CPU limits)
    - Define ECS service with desired count of 2 tasks
    - Create Application Load Balancer in public subnets
    - Create target group with health check on /
    - Create ALB listener on port 80 forwarding to target group
    - Configure service auto-scaling (min 2, max 4 tasks)
    - Add resource tags
    - _Requirements: 9.4, 9.5, 10.1, 10.2, 10.5_

  - [x] 12.4 Create infrastructure/pipeline-stack.yaml and related pipeline files
    - Define CodePipeline with source, build, and deploy stages
    - Configure source stage to pull from GitHub repository
    - Create CodeBuild project with buildspec reference
    - Configure build stage to run CodeBuild project
    - Configure deploy stage to update ECS service with new image
    - Define IAM role for CodePipeline with permissions for CodeBuild and ECS
    - Define IAM role for CodeBuild with permissions for ECR, S3, and CloudWatch
    - Add resource tags
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 10.3, 10.4, 10.5_

- [x] 13. Create CI/CD configuration files
  - [x] 13.1 Create buildspec.yml for CodeBuild
    - Define install phase: install Node.js dependencies
    - Define pre_build phase: run npm test (exit on failure)
    - Define build phase: run npm run build, build Docker image with ECR URI and commit SHA tag
    - Define post_build phase: push Docker image to ECR, create imagedefinitions.json for ECS deployment
    - Configure artifacts to output imagedefinitions.json
    - Set environment variables for AWS region and ECR repository
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 13.2 Create infrastructure/deploy.sh script
    - Create bash script to deploy CloudFormation stacks in correct order
    - Deploy network-stack first, wait for completion
    - Deploy ecr-stack second, wait for completion
    - Deploy ecs-stack third, wait for completion
    - Deploy pipeline-stack last
    - Add error handling and status messages
    - _Requirements: 10.1, 10.2_

  - [x] 13.3 Create infrastructure/parameters/ directory with parameter files
    - Create dev-params.json for development environment
    - Create prod-params.json for production environment
    - Include parameters for VPC CIDR, subnet CIDRs, desired task count, etc.
    - _Requirements: 10.1, 10.2_

- [x] 14. Create documentation
  - [x] 14.1 Create comprehensive README.md
    - Document project overview and game rules
    - Add prerequisites (Node.js, npm, Docker, AWS CLI)
    - Add local development setup instructions (npm install, npm start)
    - Document how to run tests (npm test, npm run test:coverage)
    - Add Docker build and run instructions
    - Document AWS deployment process with CloudFormation
    - Add architecture diagram or description
    - Include troubleshooting section
    - _Requirements: All_

  - [x] 14.2 Create infrastructure/README.md for deployment
    - Document CloudFormation stack deployment order
    - List AWS prerequisites (AWS account, IAM permissions, GitHub token)
    - Document required IAM permissions for deployment
    - Explain environment variables and configuration parameters
    - Add step-by-step deployment guide
    - Document how to update the application
    - Add troubleshooting guide for common deployment issues
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4_

- [x] 15. Final checkpoint - Verify complete system
  - All tests passing (78 tests)
  - All documentation complete
  - Application fully implemented and ready for deployment

## Bug Fixes (Current Priority)

- [x] 18. Fix letter tile display bug
  - [x] 18.1 Debug and fix letter tile rendering issue
    - Investigate why letter tiles are not showing guessed letters when Enter is pressed
    - Check Vue reactivity and computed property updates in boardRows
    - Verify game state updates are triggering UI re-renders correctly
    - Fix any issues with the letter tile display logic in App.vue
    - Test that letters appear immediately when typed and remain visible after submission
    - _Requirements: 6.4, 4.1, 4.3_

  - [x] 18.2 Test the fix across different scenarios
    - Test letter display during typing (before submission)
    - Test letter display after valid guess submission
    - Test letter display after invalid guess submission
    - Test letter display with feedback colors (green/yellow/gray)
    - Verify letters persist correctly in game history
    - _Requirements: 6.4, 3.1, 3.2, 4.1_

- [x] 19. Fix JavaScript console error
  - [x] 19.1 Debug and fix null reference error
    - Investigate "Cannot read properties of null (reading 'getGuesses')" error
    - Add proper null checking for gameController prop in Vue component
    - Add safety checks in computed properties and event handlers
    - Ensure graceful handling when gameState is null during initialization
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 19.2 Add comprehensive null safety throughout component
    - Add optional chaining to all gameState.value method calls (getGuesses, getTargetWord)
    - Add initialization state tracking to prevent premature interactions
    - Disable keyboard buttons until game is properly initialized
    - Add comprehensive error handling for game controller availability
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 20. Fix game board display and guess persistence
  - [x] 20.1 Debug Vue reactivity issue with game state
    - Investigate why completed guesses weren't persisting on the board
    - Investigate why new guesses stayed on first line instead of moving to next row
    - Identify that Vue computed properties weren't detecting GameState object changes
    - Root cause: GameController.getGameState() returns same object reference, but Vue doesn't detect internal state changes
    - _Requirements: 6.4, 4.1, 4.3_

  - [x] 20.2 Implement reactivity trigger solution
    - Add gameStateVersion reactive reference to force computed property updates
    - Modify gameState computed property to depend on gameStateVersion
    - Increment gameStateVersion after submitGuess and startNewGame calls
    - Ensure Vue detects all changes to game state and re-renders board correctly
    - _Requirements: 6.4, 4.1, 4.3_

- [x] 21. Improve tile flip animation timing and sequence
  - [x] 21.1 Slow down tile flip animation by 10%
    - Change CSS animation duration from 0.6s to 0.66s (10% slower)
    - Update flip keyframe animation timing in styles.css
    - Provide more polished visual experience with slightly slower reveal
    - _Requirements: 6.4, 3.1, 3.2_

  - [x] 21.2 Fix CSS class application timing
    - Wait for full flip animation to complete before adding status classes
    - Change JavaScript timing from 300ms (half duration) to 660ms (full duration)
    - Ensure 'correct'/'present'/'absent' classes appear after flip finishes completely
    - Update total animation wait time to account for staggered timing
    - _Requirements: 6.4, 3.1, 3.2_

  - [x] 21.3 Fix premature color application during Vue re-renders
    - Add animatingRowIndex tracker to prevent status classes during animation
    - Modify boardRows computed property to show 'filled' status instead of colors while animating
    - Set animatingRowIndex before animation starts, clear after animation completes
    - Force Vue re-render after animation to show final colors properly
    - Reset animation state on new game to prevent state leakage
    - _Requirements: 6.4, 3.1, 3.2_

  - [x] 21.5 Remove wait for immediate color reveal
    - Remove await Promise wrapper from tile animation loop
    - Each tile now shows its color immediately when its own flip completes
    - No longer wait for all 5 tiles to finish before showing any colors
    - Remove unnecessary gameStateVersion increment since colors apply via DOM manipulation
    - Improve animation responsiveness and visual feedback timing
    - _Requirements: 6.4, 3.1, 3.2_

- [x] 22. Replace word list with uncommon 5-letter English words
  - [x] 22.1 Create comprehensive list of rare and technical words
    - Generate 1000+ uncommon 5-letter English words from specialized fields
    - Focus on archaic, technical, scientific, medical, and botanical terms
    - Include words from chemistry, biology, linguistics, and obsolete English
    - Remove common everyday words to significantly increase game difficulty
    - _Requirements: 7.1, 7.3, 7.4_

  - [x] 22.2 Implement new word list in JSON format
    - Replace existing words.json with curated uncommon vocabulary
    - Maintain proper JSON structure for dictionary loading
    - Ensure all words are valid 5-letter English dictionary words
    - Focus on words that are legitimate but rarely used in everyday language
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 23. Fix JSON syntax error in word list
  - [x] 23.1 Identify and fix JSON parsing error
    - Locate missing comma after 'bubas' entry at line 1498 column 5
    - Fix JSON syntax error causing "Expected ',' or ']' after array element" 
    - Validate JSON structure using Node.js JSON.parse validation
    - Ensure proper dictionary loading without parsing errors
    - _Requirements: 7.1, 7.2_

- [x] 24. Improve error handling for uncommon word definitions
  - [x] 24.1 Fix console errors for missing word definitions
    - Remove console.error logging for missing word definitions
    - Handle 404 responses gracefully without throwing errors
    - Eliminate "Error fetching definition: Definition not found" console messages
    - Prevent error logging that doesn't affect game functionality
    - _Requirements: 5.3, 6.4_

  - [x] 24.2 Provide informative messages for rare words
    - Set partOfSpeech to 'uncommon word' for words not found in dictionary API
    - Provide explanatory message: "This is a rare or technical English word"
    - Explain that definition unavailability is expected for rare vocabulary
    - Maintain user-friendly experience even when definitions aren't available
    - _Requirements: 5.3, 6.4_

- [x] 25. Implement API-based word validation for guess checking
  - [x] 25.1 Modify Dictionary class for API validation
    - Update Dictionary.isValidWord() to use dictionary API for word validation
    - Make isValidWord() async to handle API calls
    - Add fallback to local dictionary if API fails
    - Maintain local word list for target word selection (uncommon words)
    - _Requirements: 2.2, 7.1, 7.2_

  - [x] 25.2 Update GameController for async validation
    - Make submitGuess() method async to handle API-based validation
    - Update JSDoc to reflect Promise return type
    - Await dictionary validation before proceeding with guess processing
    - Maintain all existing validation logic and error handling
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 25.3 Update Vue component for async word validation
    - Make handleGuessSubmit() await async submitGuess() call
    - Add loading message during word validation process
    - Show "Validating word..." message while API call is in progress
    - Maintain responsive UI during validation
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 25.4 Test and deploy API-based validation
    - Rebuild Docker container with API-based word validation
    - Test that common words like "trend" are now accepted as valid guesses
    - Test that uncommon target words are still selected from local list
    - Verify fallback to local dictionary works if API fails
    - Commit and push API validation improvements to git repository
    - _Requirements: 8.1, 8.2, 2.2, 7.2_

- [x] 26. Implement WordsAPI integration for dynamic uncommon word selection
  - [x] 26.1 Enhance Dictionary class with WordsAPI integration
    - Add getRandomUncommonWordFromAPI() method using WordsAPI
    - Configure frequency filtering (frequencyMin=1, frequencyMax=3) for rare words
    - Implement retry logic and fallback to local dictionary
    - Make getRandomWord() async to support API calls
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 26.2 Update GameController for async word selection
    - Make startNewGame() async to handle API-based word selection
    - Update JSDoc to reflect Promise return type
    - Maintain error handling and fallback behavior
    - _Requirements: 1.1, 1.2, 7.1, 7.2_

  - [x] 26.3 Update Vue component for async game initialization
    - Make handleNewGame() and onMounted() async
    - Add loading message during new game initialization
    - Handle API failures gracefully with user feedback
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 26.4 Update tests for async behavior
    - Convert Dictionary tests to async/await pattern
    - Update GameController tests for async methods
    - Maintain test coverage and property-based testing
    - Verify API fallback works correctly in test environment
    - _Requirements: All testing requirements_

## Remaining Tasks (To Be Completed)

- [x] 16. Write Vue component integration tests





  - [x] 16.1 Set up Vue Test Utils for component testing


    - Install @vue/test-utils and configure Jest for Vue component testing
    - Create test utilities for mounting Vue components with game controller
    - _Requirements: 6.1, 6.3, 6.4_

  - [x] 16.2 Write integration tests for App.vue component


    - Test complete game flow from start to win through UI
    - Test complete game flow from start to loss through UI
    - Test keyboard interaction (both on-screen and physical keyboard)
    - Test error message display and clearing
    - Test new game functionality
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 5.1, 5.2, 5.3_

  - [x] 16.3 Write integration tests for UI and game controller interaction


    - Test that UI correctly reflects game state changes
    - Test that user input is properly validated and processed
    - Test that feedback is correctly displayed on the game board
    - Test that keyboard state updates correctly after guesses
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 6.4_

- [x] 17. Verify deployment readiness





  - [x] 17.1 Test Docker build and container locally


    - Build Docker image locally and verify it includes all tests
    - Run container and verify application works on port 80
    - Verify tests run during build and fail build if tests fail
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 17.2 Validate CloudFormation templates


    - Validate all CloudFormation templates for syntax errors
    - Review parameter files for correct environment configuration
    - Test deployment script functionality
    - _Requirements: 10.1, 10.2, 10.5_

## Summary

**Implementation Status: 95% COMPLETE ✓**

The Hard Wordle application is nearly complete with all core functionality implemented and tested:

- ✓ Complete game logic with proper feedback generation (78 tests passing - 100%)
- ✓ All 16 correctness properties validated via property-based testing
- ✓ Full Vue.js 3 UI implementation with Composition API
- ✓ Enhanced UI features (on-screen keyboard, visual feedback, word definitions)
- ✓ Docker containerization with multi-stage build
- ✓ Complete AWS infrastructure as code (CloudFormation)
- ✓ CI/CD pipeline configuration
- ✓ Comprehensive documentation

**Remaining Work**: Only Vue component integration tests need to be completed to achieve 100% test coverage and ensure the UI layer is fully tested. The application is already functional and deployable.

**Architecture**: Successfully implemented using Vue.js 3 with Composition API as specified in the design document, maintaining clear separation between data, logic, and presentation layers.

## Deployment

The application is ready for deployment! Follow these steps:

### Local Testing
- Run `npm test` to execute all 78 tests
- Run `npm start` to launch the development server at http://localhost:3000
- Run `docker build -t hard-wordle .` to test the Docker build

### AWS Deployment
1. Review the infrastructure/README.md for deployment prerequisites
2. Configure AWS credentials and GitHub token
3. Run `./infrastructure/deploy.sh <environment> <github-token>`
4. Monitor the deployment through AWS CloudFormation console
5. Access the application via the Application Load Balancer URL

### Continuous Deployment
Once deployed, the CI/CD pipeline will automatically:
- Trigger on every push to the GitHub repository
- Run all tests (build fails if tests fail)
- Build and push Docker image to ECR
- Deploy to ECS with zero-downtime rolling updates
