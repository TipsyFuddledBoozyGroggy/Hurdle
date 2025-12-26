# Hard Wordle Selenium E2E Tests

This directory contains comprehensive end-to-end tests for the Hard Wordle application using Selenium WebDriver. These tests verify that the frontend UI works correctly, including letter persistence, CSS animations, and user interactions.

## 🎯 Test Coverage

### Game Board & Tiles
- ✅ Game board displays 6 rows with 5 tiles each
- ✅ Letters appear in tiles when typing
- ✅ Letters persist during tile flip animations
- ✅ Correct CSS classes applied for feedback (correct/present/absent)
- ✅ Proper background colors for feedback states

### Keyboard Interactions
- ✅ On-screen keyboard clicks work correctly
- ✅ Physical keyboard input works correctly
- ✅ Backspace functionality works properly
- ✅ Keyboard keys update colors after guesses

### Animations
- ✅ Tile flip animation plays when submitting guess
- ✅ Pulse animation shows for active tiles
- ✅ Letters persist throughout all animations

### Game Flow
- ✅ Error messages for invalid words
- ✅ Error messages for incorrect word length
- ✅ Attempts counter updates correctly
- ✅ New game functionality works

### Responsive Design
- ✅ Layout maintains integrity on mobile viewports

## 🚀 Running Tests

### Prerequisites
- Node.js 18+
- Chrome browser installed
- All npm dependencies installed (`npm install`)

### Run All E2E Tests
```bash
# Run tests with visible browser (for debugging)
npm run test:selenium

# Run tests in headless mode (faster)
npm run test:selenium:headless

# Alternative command
npm run test:e2e
```

### Run Individual Test Files
```bash
# Run specific test file
npx jest tests/selenium/hard-wordle.e2e.test.js --verbose

# Run with custom Jest config
npx jest --config tests/selenium/jest.selenium.config.js
```

## 🔧 Configuration

### Browser Options
The tests are configured to run in Chrome with the following options:
- Headless mode (can be disabled for debugging)
- Window size: 1280x720
- No sandbox mode for CI compatibility
- Disabled GPU acceleration

### Timeouts
- Individual test timeout: 60 seconds
- Element wait timeout: 10 seconds
- Animation wait times: 100ms - 1500ms depending on animation

### Test Environment
- Tests run against `http://localhost:3000`
- Development server is automatically started and stopped
- Tests run sequentially to avoid conflicts

## 🐛 Debugging

### Visual Debugging
To see the browser during test execution, modify `selenium.config.js`:
```javascript
// Comment out this line to see the browser
// options.addArguments('--headless');
```

### Common Issues

#### Chrome Not Found
```bash
# Install Chrome on macOS
brew install --cask google-chrome

# Install Chrome on Ubuntu
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo apt-get update
sudo apt-get install google-chrome-stable
```

#### Port Already in Use
If port 3000 is already in use:
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port by modifying BASE_URL in test files
```

#### Slow Tests
If tests are running slowly:
- Reduce animation wait times in test files
- Use headless mode
- Ensure Chrome is up to date

## 📁 File Structure

```
tests/selenium/
├── README.md                    # This file
├── selenium.config.js           # WebDriver configuration
├── jest.selenium.config.js      # Jest configuration for E2E tests
├── jest.selenium.setup.js       # Test environment setup
├── run-selenium-tests.js        # Test runner script
└── hard-wordle.e2e.test.js     # Main E2E test suite
```

## 🎨 Test Scenarios

### Letter Persistence Test
1. Type a 5-letter word
2. Submit the guess
3. Verify letters remain visible during flip animation
4. Verify letters persist after animation completes
5. Verify correct feedback colors are applied

### CSS Animation Test
1. Type letters and verify pulse animation on active tiles
2. Submit guess and verify flip animation plays
3. Check that animation classes are applied and removed correctly
4. Verify final state has correct colors and no animation classes

### Keyboard Integration Test
1. Test both on-screen and physical keyboard input
2. Verify backspace removes letters correctly
3. Verify keyboard keys update colors after feedback
4. Test Enter key for guess submission

### Game Flow Test
1. Test complete game from start to finish
2. Verify error handling for invalid inputs
3. Test new game functionality
4. Verify attempts counter accuracy

## 🚫 CI/CD Integration

**Important**: These Selenium tests are designed for **local testing only** and are **NOT** included in the AWS CI/CD pipeline. This is intentional because:

1. **Browser Dependencies**: Selenium requires Chrome/ChromeDriver which adds complexity to CI environments
2. **Test Speed**: E2E tests are slower than unit tests
3. **Resource Usage**: Browser automation uses more CPU/memory
4. **Reliability**: Network-dependent tests can be flaky in CI

The AWS pipeline focuses on:
- Unit tests (Jest)
- Integration tests (Vue Test Utils)
- Build verification
- Docker container testing

## 🔍 What These Tests Verify

### Critical UI Functionality
- **Letter Persistence**: Ensures letters don't disappear during animations
- **CSS Animations**: Verifies flip and pulse animations work correctly
- **Color Feedback**: Confirms correct/present/absent colors display properly
- **Keyboard Input**: Tests both virtual and physical keyboard interaction
- **Responsive Design**: Ensures layout works on different screen sizes

### User Experience
- **Visual Feedback**: Animations provide smooth user experience
- **Input Validation**: Proper error messages for invalid inputs
- **Game State**: Correct tracking of attempts and game progress
- **Accessibility**: Keyboard navigation and visual indicators

These tests complement the unit and integration tests by verifying the complete user experience in a real browser environment.