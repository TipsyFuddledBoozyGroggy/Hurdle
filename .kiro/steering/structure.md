# Project Structure

## Root Directory
```
Hurdle/
├── src/                    # Application source code
├── tests/                  # Test files
├── public/                 # Static assets
├── terraform/              # Infrastructure as Code
├── database/               # Database initialization scripts
├── mcp-browser-extension/  # Browser extension for testing
├── docker-compose.yml      # Local development setup
├── package.json           # Dependencies and scripts
├── webpack.config.js      # Build configuration
└── jest.config.js         # Test configuration
```

## Source Code Organization (`src/`)

### Core Game Classes
- **`main.js`**: Application entry point, initializes Vue app and loads dictionary
- **`App.vue`**: Main Vue component with game UI and user interactions
- **`GameController.js`**: Orchestrates game flow and enforces rules
- **`GameState.js`**: Manages state of a single game session
- **`Dictionary.js`**: Handles word validation and random word selection
- **`Guess.js`**: Represents a single guess with feedback
- **`FeedbackGenerator.js`**: Generates color-coded feedback for guesses
- **`Database.js`**: Database operations for statistics (if used)

### Architecture Pattern
- **MVC-like separation**: GameController orchestrates, GameState manages data, Vue handles view
- **Module pattern**: Each class is a separate module with CommonJS exports
- **Dependency injection**: Dictionary injected into GameController
- **Immutable feedback**: Guess objects contain immutable feedback arrays

## Static Assets (`public/`)
- **`index.html`**: HTML template
- **`styles.css`**: Global CSS styles
- **`words.json`**: Dictionary file with 5000+ words

## Testing Structure (`tests/`)
- **Unit tests**: `*.test.js` files for individual classes
- **Integration tests**: `*.integration.test.js` for component interactions
- **E2E tests**: `selenium/` directory for browser automation tests
- **Mocks**: `__mocks__/` directory for test utilities

## Configuration Files
- **`.babelrc`**: Babel transpilation settings
- **`webpack.config.js`**: Build and dev server configuration
- **`jest.config.js`**: Test runner configuration with coverage thresholds
- **`docker-compose.yml`**: Multi-service local development setup

## Naming Conventions
- **Classes**: PascalCase (e.g., `GameController`, `Dictionary`)
- **Files**: PascalCase for classes, camelCase for utilities
- **Methods**: camelCase (e.g., `submitGuess`, `isValidWord`)
- **Constants**: UPPER_SNAKE_CASE
- **CSS classes**: kebab-case (e.g., `letter-tile`, `guess-row`)