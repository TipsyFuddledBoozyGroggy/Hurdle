#!/bin/bash

# Script to build Docker container and run Selenium tests against it
# This demonstrates the complete containerized application with E2E testing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Hard Wordle: Container + Selenium Tests${NC}"
echo -e "${BLUE}========================================${NC}"

# Run cleanup script first
echo -e "${GREEN}🧹 Step 0: Cleaning up existing Docker resources...${NC}"
if [ -f "./cleanup-docker.sh" ]; then
    ./cleanup-docker.sh
else
    echo -e "${YELLOW}⚠️  cleanup-docker.sh not found, skipping cleanup${NC}"
fi

# Cleanup function for this script's containers
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up test containers...${NC}"
    
    # Stop and remove container if it exists
    if docker ps -q -f name=hard-wordle-selenium-test > /dev/null 2>&1; then
        echo -e "${YELLOW}🛑 Stopping container...${NC}"
        docker stop hard-wordle-selenium-test > /dev/null 2>&1 || true
    fi
    
    if docker ps -aq -f name=hard-wordle-selenium-test > /dev/null 2>&1; then
        echo -e "${YELLOW}🗑️  Removing container...${NC}"
        docker rm hard-wordle-selenium-test > /dev/null 2>&1 || true
    fi
}

# Set up cleanup on script exit
trap cleanup EXIT

# Step 1: Build the Docker image (without tests for now)
echo -e "${GREEN}🐳 Step 1: Building Docker image (without tests)...${NC}"
docker build -f Dockerfile.notest -t hard-wordle-selenium .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully!${NC}"
else
    echo -e "${RED}❌ Docker build failed!${NC}"
    exit 1
fi

# Step 2: Run the container
echo -e "\n${GREEN}🚀 Step 2: Starting containerized application...${NC}"
docker run -d -p 80:80 --name hard-wordle-selenium-test hard-wordle-selenium

# Wait for container to be ready
echo -e "${YELLOW}⏳ Waiting for container to be ready...${NC}"
sleep 5

# Check if container is running
if ! docker ps | grep -q hard-wordle-selenium-test; then
    echo -e "${RED}❌ Container failed to start!${NC}"
    docker logs hard-wordle-selenium-test
    exit 1
fi

# Test if application is accessible
echo -e "${YELLOW}🔍 Testing application accessibility...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:80 > /dev/null; then
        echo -e "${GREEN}✅ Application is accessible on port 80!${NC}"
        break
    fi
    
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ Application not accessible after 10 attempts!${NC}"
        docker logs hard-wordle-selenium-test
        exit 1
    fi
    
    echo -e "${YELLOW}⏳ Attempt $i/10 - waiting for application...${NC}"
    sleep 2
done

# Step 3: Update Selenium tests to use port 80
echo -e "\n${GREEN}🔧 Step 3: Configuring Selenium tests for containerized app...${NC}"

# Create a temporary Selenium config for container testing
cat > tests/selenium/selenium.container.config.js << 'EOF'
// Selenium WebDriver configuration for containerized Hard Wordle E2E tests
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class SeleniumConfig {
  static async createDriver() {
    const options = new chrome.Options();
    
    // Configure Chrome options for testing
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1280,720');
    
    // Show browser for demonstration (comment out for headless)
    // options.addArguments('--headless');
    
    const driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    // Set implicit wait timeout
    await driver.manage().setTimeouts({ implicit: 10000 });
    
    return driver;
  }
  
  static async waitForElement(driver, selector, timeout = 10000) {
    return await driver.wait(until.elementLocated(By.css(selector)), timeout);
  }
  
  static async waitForElementVisible(driver, selector, timeout = 10000) {
    const element = await this.waitForElement(driver, selector, timeout);
    await driver.wait(until.elementIsVisible(element), timeout);
    return element;
  }
  
  static async waitForAnimation(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SeleniumConfig;
EOF

# Create a container-specific test file
cat > tests/selenium/container.e2e.test.js << 'EOF'
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
      expect(rows.length).toBe(6);
      
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
      expect(attemptsText).toBe('Attempts: 0/6');
      
      // Make a guess
      await driver.findElement(By.css('body')).sendKeys('APPLE');
      await driver.findElement(By.css('body')).sendKeys(Key.ENTER);
      
      // Wait for processing
      await SeleniumConfig.waitForAnimation(1500);
      
      // Check updated attempts
      attemptsText = await attemptsElement.getText();
      expect(attemptsText).toBe('Attempts: 1/6');
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
      expect(attemptsText).toBe('Attempts: 0/6');
      
      // Check first row is empty
      const firstRowTiles = await driver.findElements(By.css('.guess-row:first-child .letter-tile'));
      for (const tile of firstRowTiles) {
        const tileText = await tile.getText();
        expect(tileText).toBe('');
      }
    });
  });
});
EOF

# Step 4: Run Selenium tests against the container
echo -e "\n${GREEN}🧪 Step 4: Running Selenium tests against containerized app...${NC}"
echo -e "${YELLOW}📺 Browser window will open - you can watch the tests run!${NC}"

# Run the container-specific tests
npx jest tests/selenium/container.e2e.test.js --verbose --testTimeout=60000

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All Selenium tests passed against the containerized application!${NC}"
else
    echo -e "\n${RED}❌ Some Selenium tests failed!${NC}"
    exit 1
fi

# Step 5: Show container logs
echo -e "\n${GREEN}📋 Step 5: Container logs:${NC}"
docker logs hard-wordle-selenium-test --tail 20

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Container + Selenium Testing Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}Summary:${NC}"
echo -e "${BLUE}• Docker image built successfully${NC}"
echo -e "${BLUE}• Container running on port 80${NC}"
echo -e "${BLUE}• Selenium tests executed against container${NC}"
echo -e "${BLUE}• Letter persistence verified${NC}"
echo -e "${BLUE}• CSS animations tested${NC}"
echo -e "${BLUE}• All functionality validated${NC}"

# Cleanup will happen automatically via trap