// Hard Wordle Container E2E Tests using Selenium WebDriver
// Tests against containerized application on port 80

const { Builder, By, until, Key } = require('selenium-webdriver');
const SeleniumConfig = require('./selenium.container.config');

describe('Hard Wordle Container E2E Tests', () => {
  let driver;
  const BASE_URL = 'http://localhost:80'; // Container runs on port 80
  
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
  
  describe('Container Application Tests', () => {
    test('should load the containerized application', async () => {
      const title = await driver.getTitle();
      expect(title).toBe('Hard Wordle');
      
      const header = await driver.findElement(By.css('h1'));
      const headerText = await header.getText();
      expect(headerText).toBe('Hard Wordle');
    });
    
    test('should display game board with proper structure', async () => {
      const rows = await driver.findElements(By.css('.guess-row'));
      expect(rows.length).toBe(4);
      
      for (let i = 0; i < rows.length; i++) {
        const tiles = await rows[i].findElements(By.css('.letter-tile'));
        expect(tiles.length).toBe(5);
      }
    });
    
    test('should handle letter input and display in tiles', async () => {
      const word = 'APPLE';
      
      // Type letters and verify they appear
      for (let i = 0; i < word.length; i++) {
        await driver.findElement(By.css('body')).sendKeys(word[i]);
        await SeleniumConfig.waitForAnimation(200);
        
        const tile = await driver.findElement(By.css(`.guess-row:first-child .letter-tile:nth-child(${i + 1})`));
        const tileText = await tile.getText();
        expect(tileText).toBe(word[i]);
      }
    });
    
    test('should show tile flip animation and persist letters', async () => {
      const word = 'APPLE';
      
      // Type word
      await driver.findElement(By.css('body')).sendKeys(word);
      
      // Submit guess
      await driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      
      // Wait for animation to start
      await SeleniumConfig.waitForAnimation(300);
      
      // Verify letters persist during animation
      for (let i = 0; i < word.length; i++) {
        const tile = await driver.findElement(By.css(`.guess-row:first-child .letter-tile:nth-child(${i + 1})`));
        const tileText = await tile.getText();
        expect(tileText).toBe(word[i]);
      }
      
      // Wait for animation to complete
      await SeleniumConfig.waitForAnimation(1000);
      
      // Verify letters still persist and have feedback colors
      for (let i = 0; i < word.length; i++) {
        const tile = await driver.findElement(By.css(`.guess-row:first-child .letter-tile:nth-child(${i + 1})`));
        const tileText = await tile.getText();
        const classes = await tile.getAttribute('class');
        
        expect(tileText).toBe(word[i]);
        expect(classes).toMatch(/(correct|present|absent)/);
      }
    });
    
    test('should update attempts counter correctly', async () => {
      const attemptsElement = await driver.findElement(By.css('#attempts-remaining'));
      let attemptsText = await attemptsElement.getText();
      expect(attemptsText).toBe('Attempts: 0/4');
      
      // Make a guess
      await driver.findElement(By.css('body')).sendKeys('APPLE');
      await driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      
      // Wait for processing
      await SeleniumConfig.waitForAnimation(1500);
      
      // Check updated attempts
      attemptsText = await attemptsElement.getText();
      expect(attemptsText).toBe('Attempts: 1/4');
    });
    
    test('should handle on-screen keyboard clicks', async () => {
      const letters = ['A', 'P', 'P', 'L', 'E'];
      
      for (let i = 0; i < letters.length; i++) {
        const keyButton = await driver.findElement(By.css(`[data-key="${letters[i]}"]`));
        await keyButton.click();
        await SeleniumConfig.waitForAnimation(100);
        
        const tile = await driver.findElement(By.css(`.guess-row:first-child .letter-tile:nth-child(${i + 1})`));
        const tileText = await tile.getText();
        expect(tileText).toBe(letters[i]);
      }
    });
    
    test('should start new game correctly', async () => {
      // Make a guess first
      await driver.findElement(By.css('body')).sendKeys('APPLE');
      await driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      await SeleniumConfig.waitForAnimation(1500);
      
      // Click new game
      const newGameButton = await driver.findElement(By.css('#new-game-btn'));
      await newGameButton.click();
      await SeleniumConfig.waitForAnimation(500);
      
      // Verify reset
      const attemptsElement = await driver.findElement(By.css('#attempts-remaining'));
      const attemptsText = await attemptsElement.getText();
      expect(attemptsText).toBe('Attempts: 0/4');
      
      // Check first row is empty
      const firstRowTiles = await driver.findElements(By.css('.guess-row:first-child .letter-tile'));
      for (const tile of firstRowTiles) {
        const tileText = await tile.getText();
        expect(tileText).toBe('');
      }
    });
  });
});
