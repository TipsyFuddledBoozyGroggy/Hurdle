// Selenium WebDriver configuration for Hard Wordle E2E tests
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class SeleniumConfig {
  static async createDriver() {
    const options = new chrome.Options();
    
    // Configure Chrome options for testing
    options.addArguments('--headless'); // Run in headless mode for CI
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1280,720');
    
    // For local testing, you can comment out --headless to see the browser
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