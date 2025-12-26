#!/usr/bin/env node

// Selenium Test Runner for Hard Wordle
// This script starts the dev server and runs Selenium tests locally

const { spawn, exec } = require('child_process');
const path = require('path');

class SeleniumTestRunner {
  constructor() {
    this.devServer = null;
    this.serverReady = false;
  }
  
  async startDevServer() {
    console.log('🚀 Starting development server...');
    
    return new Promise((resolve, reject) => {
      this.devServer = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        cwd: path.resolve(__dirname, '../..')
      });
      
      this.devServer.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('📦 Dev Server:', output.trim());
        
        // Check if server is ready
        if (output.includes('webpack compiled') || output.includes('Local:')) {
          if (!this.serverReady) {
            this.serverReady = true;
            console.log('✅ Development server is ready!');
            resolve();
          }
        }
      });
      
      this.devServer.stderr.on('data', (data) => {
        console.error('❌ Dev Server Error:', data.toString());
      });
      
      this.devServer.on('error', (error) => {
        console.error('❌ Failed to start dev server:', error);
        reject(error);
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (!this.serverReady) {
          reject(new Error('Dev server failed to start within 30 seconds'));
        }
      }, 30000);
    });
  }
  
  async runSeleniumTests() {
    console.log('🧪 Running Selenium E2E tests...');
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('npx', ['jest', 'tests/selenium/', '--verbose'], {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..')
      });
      
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ All Selenium tests passed!');
          resolve();
        } else {
          console.error(`❌ Selenium tests failed with exit code ${code}`);
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });
      
      testProcess.on('error', (error) => {
        console.error('❌ Failed to run tests:', error);
        reject(error);
      });
    });
  }
  
  async stopDevServer() {
    if (this.devServer) {
      console.log('🛑 Stopping development server...');
      this.devServer.kill('SIGTERM');
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force kill if still running
      if (!this.devServer.killed) {
        this.devServer.kill('SIGKILL');
      }
    }
  }
  
  async run() {
    try {
      // Start dev server
      await this.startDevServer();
      
      // Wait a bit for server to fully initialize
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Run tests
      await this.runSeleniumTests();
      
      console.log('🎉 All tests completed successfully!');
      
    } catch (error) {
      console.error('💥 Test run failed:', error.message);
      process.exit(1);
    } finally {
      // Always stop the dev server
      await this.stopDevServer();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new SeleniumTestRunner();
  
  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down...');
    await runner.stopDevServer();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    await runner.stopDevServer();
    process.exit(0);
  });
  
  runner.run();
}

module.exports = SeleniumTestRunner;