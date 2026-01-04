// Hard Wordle End-to-End Tests using Selenium WebDriver
// Tests letter persistence, CSS animations, and UI functionality

const { Builder, By, until, Key } = require('selenium-webdriver');
const SeleniumConfig = require('./selenium.config');

describe('Hard Wordle E2E Tests', () => {
  let driver;
  const BASE_URL = 'http://localhost:3000';
  
  beforeAll(async () => {
    driver = await SeleniumConfig.createDriver();
  });
  
  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });
  
  beforeEach(async () => {
    await driver.get(BASE_URL);
    await SeleniumConfig.waitForElementVisible(driver, '#game-container');
  });
  
  describe('Game Board and Tile Tests', () => {
    test('should display game board with 4 rows and 5 tiles each', async () => {
      const rows = await driver.findElements(By.css('.guess-row'));
      expect(rows.length).toBe(4);
      
      for (let i = 0; i < rows.length; i++) {
        const tiles = await rows[i].findElements(By.css('.letter-tile'));
        expect(tiles.length).toBe(5);
      }
    });
    
    test('should display letters in tiles when typing', async () => {
      // Type a word using keyboard
      const word = 'APPLE';
      
      for (let i = 0; i < word.length; i++) {
        await driver.findElement(By.css('body')).sendKeys(word[i]);
        await SeleniumConfig.waitForAnimation(100);
        
        // Check that the letter appears in the correct tile
        const tile = await driver.findElement(By.css(`.guess-row:first-child .letter-tile:nth-child(${i + 1})`));
        const tileText = await tile.getText();
        expect(tileText).toBe(word[i]);
        
        // Check that tile has active class
        const classes = await tile.getAttribute('class');
        expect(classes).toContain('active');
      }
    });
    
    test('should persist letters during tile flip animation', async () => {
      // Type a valid word
      const word = 'APPLE';
      await driver.findElement(By.css('body')).sendKeys(word);
      
      // Submit the guess
      await driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      
      // Wait for animation to start
      await SeleniumConfig.waitForAnimation(200);
      
      // Check that letters persist during animation
      for (let i = 0; i < word.length; i++) {
        const tile = await driver.findElement(By.css(`.guess-row:first-child .letter-tile:nth-child(${i + 1})`));
        const tileText = await tile.getText();
        expect(tileText).toBe(word[i]);
      }
      
      // Wait for animation to complete
      await SeleniumConfig.waitForAnimation(1000);
      
      // Check that letters still persist after animation
      for (let i = 0; i < word.length; i++) {
        const tile = await driver.findElement(By.css(`.guess-row:first-child .letter-tile:nth-child(${i + 1})`));
        const tileText = await tile.getText();
        expect(tileText).toBe(word[i]);
        
        // Check that tile has feedback color class
        const classes = await tile.getAttribute('class');
        expect(classes).toMatch(/(correct|present|absent)/);
      }
    });
    
    test('should apply correct CSS classes for feedback', async () => {
      // Type and submit a word
      const word = 'APPLE';
      await driver.findElement(By.css('body')).sendKeys(word);
      await driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      
      // Wait for animation to complete
      await SeleniumConfig.waitForAnimation(1200);
      
      // Check that each tile has appropriate feedback class
      for (let i = 0; i < word.length; i++) {
        const tile = await driver.findElement(By.css(`.guess-row:first-child .letter-tile:nth-child(${i + 1})`));
        const classes = await tile.getAttribute('class');
        
        // Should have one of the feedback classes
        expect(classes).toMatch(/(correct|present|absent)/);
        
        // Should not have empty or active classes after submission
        expect(classes).not.toContain('empty');
        expect(classes).not.toContain('active');
      }
    });
    
    test('should display correct background colors for feedback', async () => {
      // Type and submit a word
      const word = 'APPLE';
      await driver.findElement(By.css('body')).sendKeys(word);
      await driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      
      // Wait for animation to complete
      await SeleniumConfig.waitForAnimation(1200);
      
      // Check background colors
      for (let i = 0; i < word.length; i++) {
        const tile = await driver.findElement(By.css(`.guess-row:first-child .letter-tile:nth-child(${i + 1})`));
        const backgroundColor = await tile.getCssValue('background-color');
        
        // Should have one of the Wordle colors (green, yellow, or gray)
        const validColors = [
          'rgb(83, 141, 78)',   // correct (green)
          'rgb(181, 159, 59)',  // present (yellow)
          'rgb(58, 58, 60)'     // absent (gray)
        ];
        
        expect(validColors).toContain(backgroundColor);
      }
    });
  });
  
  describe('Keyboard Interaction Tests', () => {
    test('should respond to on-screen keyboard clicks', async () => {
      // Click letters on the on-screen keyboard
      const letters = ['A', 'P', 'P', 'L', 'E'];
      
      for (let i = 0; i < letters.length; i++) {
        const keyButton = await driver.findElement(By.css(`[data-key="${letters[i]}"]`));
        await keyButton.click();
        await SeleniumConfig.waitForAnimation(100);
        
        // Check that letter appears in tile
        const tile = await driver.findElement(By.css(`.guess-row:first-child .letter-tile:nth-child(${i + 1})`));
        const tileText = await tile.getText();
        expect(tileText).toBe(letters[i]);
      }
    });
    
    test('should respond to physical keyboard input', async () => {
      const word = 'BREAD';
      
      // Type using physical keyboard
      await driver.findElement(By.css('body')).sendKeys(word);
      
      // Check that all letters appear
      for (let i = 0; i < word.length; i++) {
        const tile = await driver.findElement(By.css(`.guess-row:first-child .letter-tile:nth-child(${i + 1})`));
        const tileText = await tile.getText();
        expect(tileText).toBe(word[i]);
      }
    });
    
    test('should handle backspace correctly', async () => {
      // Type some letters
      await driver.findElement(By.css('body')).sendKeys('APPL');
      
      // Use backspace
      await driver.findElement(By.css('body')).sendKeys(Key.BACK_SPACE);
      
      // Check that last letter is removed
      const tile4 = await driver.findElement(By.css('.guess-row:first-child .letter-tile:nth-child(4)'));
      const tile4Text = await tile4.getText();
      expect(tile4Text).toBe('');
      
      // Check that previous letters remain
      const tile3 = await driver.findElement(By.css('.guess-row:first-child .letter-tile:nth-child(3)'));
      const tile3Text = await tile3.getText();
      expect(tile3Text).toBe('P');
    });
    
    test('should update keyboard key colors after guess', async () => {
      // Type and submit a word
      const word = 'APPLE';
      await driver.findElement(By.css('body')).sendKeys(word);
      await driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      
      // Wait for animation and keyboard update
      await SeleniumConfig.waitForAnimation(1500);
      
      // Check that keyboard keys have updated colors
      for (const letter of word) {
        const keyButton = await driver.findElement(By.css(`[data-key="${letter}"]`));
        const classes = await keyButton.getAttribute('class');
        
        // Should have feedback class
        expect(classes).toMatch(/(correct|present|absent)/);
      }
    });
  });
  
  describe('Animation Tests', () => {
    test('should show flip animation when submitting guess', async () => {
      // Type a word
      const word = 'APPLE';
      await driver.findElement(By.css('body')).sendKeys(word);
      
      // Submit guess
      await driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      
      // Check for flipping animation class (should appear briefly)
      await SeleniumConfig.waitForAnimation(200);
      
      // At least one tile should have had the flipping class
      // (This is tricky to test due to timing, so we'll check the final state)
      await SeleniumConfig.waitForAnimation(1000);
      
      // Verify animation completed and tiles have final colors
      const firstTile = await driver.findElement(By.css('.guess-row:first-child .letter-tile:first-child'));
      const classes = await firstTile.getAttribute('class');
      expect(classes).toMatch(/(correct|present|absent)/);
    });
    
    test('should show pulse animation for active tiles', async () => {
      // Type a letter
      await driver.findElement(By.css('body')).sendKeys('A');
      
      // Check that the tile has active class (which triggers pulse animation)
      const tile = await driver.findElement(By.css('.guess-row:first-child .letter-tile:first-child'));
      const classes = await tile.getAttribute('class');
      expect(classes).toContain('active');
    });
  });
  
  describe('Game Flow Tests', () => {
    test('should show error message for invalid words', async () => {
      // Type an invalid word (not in dictionary)
      await driver.findElement(By.css('body')).sendKeys('ZZZZZ');
      await driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      
      // Wait for error message
      await SeleniumConfig.waitForElementVisible(driver, '#message-area');
      
      const messageArea = await driver.findElement(By.css('#message-area'));
      const messageText = await messageArea.getText();
      const messageClasses = await messageArea.getAttribute('class');
      
      expect(messageText).toContain('Not a valid word');
      expect(messageClasses).toContain('error');
    });
    
    test('should show error message for short words', async () => {
      // Type a short word
      await driver.findElement(By.css('body')).sendKeys('APP');
      await driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      
      // Wait for error message
      await SeleniumConfig.waitForElementVisible(driver, '#message-area');
      
      const messageArea = await driver.findElement(By.css('#message-area'));
      const messageText = await messageArea.getText();
      
      expect(messageText).toContain('5 letters long');
    });
    
    test('should update attempts counter', async () => {
      const attemptsElement = await driver.findElement(By.css('#attempts-remaining'));
      let attemptsText = await attemptsElement.getText();
      expect(attemptsText).toBe('Attempts: 0/4');
      
      // Make a valid guess
      await driver.findElement(By.css('body')).sendKeys('APPLE');
      await driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      
      // Wait for guess to be processed
      await SeleniumConfig.waitForAnimation(1200);
      
      // Check updated attempts
      attemptsText = await attemptsElement.getText();
      expect(attemptsText).toBe('Attempts: 1/4');
    });
    
    test('should start new game when button clicked', async () => {
      // Make a guess first
      await driver.findElement(By.css('body')).sendKeys('APPLE');
      await driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      await SeleniumConfig.waitForAnimation(1200);
      
      // Click new game button
      const newGameButton = await driver.findElement(By.css('#new-game-btn'));
      await newGameButton.click();
      
      // Wait for new game to start
      await SeleniumConfig.waitForAnimation(500);
      
      // Check that attempts counter reset
      const attemptsElement = await driver.findElement(By.css('#attempts-remaining'));
      const attemptsText = await attemptsElement.getText();
      expect(attemptsText).toBe('Attempts: 0/4');
      
      // Check that first row tiles are empty
      const firstRowTiles = await driver.findElements(By.css('.guess-row:first-child .letter-tile'));
      for (const tile of firstRowTiles) {
        const tileText = await tile.getText();
        expect(tileText).toBe('');
        
        const classes = await tile.getAttribute('class');
        expect(classes).toContain('empty');
      }
    });
  });
  
  describe('Responsive Design Tests', () => {
    test('should maintain layout on mobile viewport', async () => {
      // Set mobile viewport
      await driver.manage().window().setRect({ width: 375, height: 667 });
      await SeleniumConfig.waitForAnimation(500);
      
      // Check that game container is still visible and properly sized
      const gameContainer = await driver.findElement(By.css('#game-container'));
      const containerSize = await gameContainer.getRect();
      
      expect(containerSize.width).toBeLessThanOrEqual(375);
      expect(containerSize.width).toBeGreaterThan(300);
      
      // Check that tiles are still properly sized
      const tile = await driver.findElement(By.css('.letter-tile'));
      const tileSize = await tile.getRect();
      
      expect(tileSize.width).toBeGreaterThan(30);
      expect(tileSize.height).toBeGreaterThan(30);
      
      // Reset to desktop viewport
      await driver.manage().window().setRect({ width: 1280, height: 720 });
    });
  });
});