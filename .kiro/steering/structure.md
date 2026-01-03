# Project Structure

## Directory Layout

```
hurdle/
├── src/                    # Application source code
├── tests/                  # Test files (mirrors src structure)
├── public/                 # Static assets
├── terraform/              # Terraform IaC templates
├── dist/                   # Build output (generated, not in git)
├── node_modules/           # Dependencies (generated, not in git)
└── [config files]          # Root-level configuration
```

## Source Code Organization (`src/`)

The application follows a **layered architecture**:

### Data Layer
- `Dictionary.js` - Word dictionary management and validation
- `GameState.js` - Game state tracking (target word, guesses, status)
- `Guess.js` - Guess data structure

### Logic Layer  
- `GameController.js` - Game orchestration and rule enforcement
- `FeedbackGenerator.js` - Feedback generation algorithm

### Presentation Layer
- `App.vue` - Vue 3 Single File Component (Composition API) for UI rendering and interaction
- `main.js` - Application entry point, initializes Vue app and loads dictionary

### Component Interaction Flow
```
User Input → Vue App Component → GameController → GameState
                                       ↓
                                FeedbackGenerator
                                       ↓
                                  Dictionary
```

**Note**: Business logic (GameController, GameState, FeedbackGenerator, Dictionary) remains framework-agnostic and uses CommonJS. Only the presentation layer uses Vue 3.

## Test Organization (`tests/`)

- Test files mirror source structure: `src/X.js` → `tests/X.test.js`
- Integration tests: `*.integration.test.js`
- Mocks: `tests/__mocks__/` (e.g., `styleMock.js` for CSS imports)
- Both unit tests and property-based tests in same files

## Static Assets (`public/`)

- `index.html` - Main HTML template
- `styles.css` - Application styling
- `words.json` - Dictionary of 5000+ valid 5-letter words

## Infrastructure (`terraform/`)

Terraform templates for DigitalOcean deployment:

- `main.tf` - Main infrastructure configuration
- `variables.tf` - Input variables
- `outputs.tf` - Output values
- `terraform.tfvars.example` - Example configuration
- `README.md` - Deployment guide

## Configuration Files (Root)

- `package.json` - Dependencies and npm scripts
- `webpack.config.js` - Webpack bundler configuration
- `jest.config.js` - Jest test runner configuration
- `.babelrc` - Babel transpiler configuration
- `Dockerfile` - Multi-stage Docker build
- `Dockerfile.notest` - Docker build without tests
- `buildspec.yml` - AWS CodeBuild configuration
- `nginx.conf` - Nginx web server configuration
- `.gitignore` - Git ignore patterns
- `.dockerignore` - Docker build ignore patterns

## Module System

- Uses **CommonJS** (`module.exports` / `require`)
- All modules check for `module` existence for browser compatibility
- Pattern: `if (typeof module !== 'undefined' && module.exports) { module.exports = X; }`

## Naming Conventions

- **Classes**: PascalCase (e.g., `GameController`, `FeedbackGenerator`)
- **Files**: Match class names (e.g., `GameController.js`)
- **Test files**: `[SourceFile].test.js` or `[SourceFile].integration.test.js`
- **Variables/functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE (if used)

## Code Organization Principles

1. **Single Responsibility**: Each class has one clear purpose
2. **Separation of Concerns**: Data, logic, and presentation are separated
3. **Testability**: All business logic is testable without DOM
4. **Immutability**: GameState returns copies of arrays to prevent external modification
5. **Error Handling**: Comprehensive validation with descriptive error messages
