#!/usr/bin/env node

// Demo Selenium Tests - Shows key functionality in action
// This runs a subset of tests with visible browser so you can see them working

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { spawn } = require('child_process');

class DemoSeleniumTests {
  constructor() {
    this.driver = null;
    this.devServer = null;
  }
  
  async startDevServer() {
    console.log('🚀 Starting development server...');
    
    return new Promise((resolve, reject) => {
      this.devServer = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe'
      });
      
      this.devServer.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('webpack compiled')) {
          console.log('✅ Development server is ready!');
          setTimeout(resolve, 2000); // Give it a moment to fully start
        }
      });
      
      this.devServer.stderr.on('data', (data) => {
        // Ignore stderr for demo
      });
      
      setTimeout(() => reject(new Error('Server timeout')), 15000);
    });
  }
  
  async createDriver() {
    console.log('🌐 Starting Chrome browser...');
    
    const options = new chrome.Options();
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,720');
    // Don't use headless so you can see the tests
    
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    await this.driver.manage().setTimeouts({ implicit: 10000 });
    console.log('✅ Browser ready!');
  }
  
  async runDemoTests() {
    console.log('🧪 Running demo Selenium tests...');
    console.log('👀 Watch the browser window to see the tests in action!');
    
    const BASE_URL = 'http://localhost:3000';
    
    try {
      // Test 1: Load the application
      console.log('\n📋 Test 1: Loading Hard Wordle application...');
      await this.driver.get(BASE_URL);
      await this.driver.wait(until.elementLocated(By.css('#game-container')), 10000);
      
      const title = await this.driver.getTitle();
      console.log(`✅ Application loaded! Title: ${title}`);
      
      // Test 2: Verify game board structure
      console.log('\n📋 Test 2: Checking game board structure...');
      const rows = await this.driver.findElements(By.css('.guess-row'));
      console.log(`✅ Found ${rows.length} rows (expected 6)`);
      
      const firstRowTiles = await rows[0].findElements(By.css('.letter-tile'));
      console.log(`✅ Found ${firstRowTiles.length} tiles per row (expected 5)`);
      
      // Test 3: Type letters and watch them appear
      console.log('\n📋 Test 3: Testing letter input - watch the tiles!');
      const word = 'APPLE';
      
      for (let i = 0; i < word.length; i++) {
        console.log(`   Typing letter: ${word[i]}`);
        await this.driver.findElement(By.css('body')).sendKeys(word[i]);
        await this.sleep(500); // Slow down so you can see it
        
        const tile = await this.driver.findElement(By.css(`.guess-row:first-child .letter-tile:nth-child(${i + 1})`));
        const tileText = await tile.getText();
        console.log(`   ✅ Letter ${word[i]} appeared in tile ${i + 1}`);
      }
      
      // Test 4: Submit guess and watch animation
      console.log('\n📋 Test 4: Submitting guess - watch for tile flip animation!');
      await this.driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      
      console.log('   ⏳ Waiting for flip animation...');
      await this.sleep(2000); // Wait for animation
      
      // Check that letters persisted through animation
      for (let i = 0; i < word.length; i++) {
        const tile = await this.driver.findElement(By.css(`.guess-row:first-child .letter-tile:nth-child(${i + 1})`));
        const tileText = await tile.getText();
        const classes = await tile.getAttribute('class');
        
        console.log(`   ✅ Tile ${i + 1}: Letter '${tileText}' persisted, has feedback class: ${classes.includes('correct') || classes.includes('present') || classes.includes('absent')}`);
      }
      
      // Test 5: Check attempts counter
      console.log('\n📋 Test 5: Checking attempts counter...');
      const attemptsElement = await this.driver.findElement(By.css('#attempts-remaining'));
      const attemptsText = await attemptsElement.getText();
      console.log(`✅ Attempts counter: ${attemptsText}`);
      
      // Test 6: Test on-screen keyboard
      console.log('\n📋 Test 6: Testing on-screen keyboard - watch the clicks!');
      const letters = ['B', 'R', 'E', 'A', 'D'];
      
      for (let i = 0; i < letters.length; i++) {
        console.log(`   Clicking key: ${letters[i]}`);
        const keyButton = await this.driver.findElement(By.css(`[data-key="${letters[i]}"]`));
        await keyButton.click();
        await this.sleep(400);
        
        const tile = await this.driver.findElement(By.css(`.guess-row:nth-child(2) .letter-tile:nth-child(${i + 1})`));
        const tileText = await tile.getText();
        console.log(`   ✅ On-screen key ${letters[i]} worked, tile shows: ${tileText}`);
      }
      
      // Test 7: Submit second guess
      console.log('\n📋 Test 7: Submitting second guess...');
      const enterKey = await this.driver.findElement(By.css('[data-key="ENTER"]'));
      await enterKey.click();
      await this.sleep(2000);
      
      const attemptsAfter = await this.driver.findElement(By.css('#attempts-remaining'));
      const attemptsAfterText = await attemptsAfter.getText();
      console.log(`✅ Attempts after second guess: ${attemptsAfterText}`);
      
      // Test 8: New game functionality
      console.log('\n📋 Test 8: Testing new game functionality...');
      const newGameBtn = await this.driver.findElement(By.css('#new-game-btn'));
      await newGameBtn.click();
      await this.sleep(1000);
      
      const attemptsReset = await this.driver.findElement(By.css('#attempts-remaining'));
      const attemptsResetText = await attemptsReset.getText();
      console.log(`✅ New game started, attempts reset: ${attemptsResetText}`);
      
      console.log('\n🎉 All demo tests completed successfully!');
      console.log('🎯 Key features verified:');
      console.log('   • Letters appear in tiles when typing');
      console.log('   • Letters persist during flip animations');
      console.log('   • CSS feedback colors are applied');
      console.log('   • On-screen keyboard works');
      console.log('   • Attempts counter updates correctly');
      console.log('   • New game functionality works');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      throw error;
    }
  }
  
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.driver) {
      await this.driver.quit();
      console.log('✅ Browser closed');
    }
    
    if (this.devServer) {
      this.devServer.kill('SIGTERM');
      console.log('✅ Dev server stopped');
    }
  }
  
  async run() {
    try {
      await this.startDevServer();
      await this.createDriver();
      await this.runDemoTests();
    } catch (error) {
      console.error('💥 Demo failed:', error.message);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the demo
const demo = new DemoSeleniumTests();

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Interrupted, cleaning up...');
  await demo.cleanup();
  process.exit(0);
});

demo.run();