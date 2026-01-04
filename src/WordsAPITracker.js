/**
 * WordsAPI Request Tracker
 * Tracks API requests to stay within the 2500/month limit
 */

class WordsAPITracker {
  constructor() {
    this.MONTHLY_LIMIT = 2500;
    this.storageKey = 'wordsapi_usage';
    this.isNode = typeof window === 'undefined';
  }

  /**
   * Get current usage data from storage
   * @returns {Object} Usage data with count and month
   */
  getUsageData() {
    try {
      let data;
      
      if (this.isNode) {
        // Node.js environment - use file system
        try {
          const fs = require('fs');
          const path = require('path');
          const usageFile = path.join(process.cwd(), '.wordsapi-usage.json');
          
          if (fs.existsSync(usageFile)) {
            const fileContent = fs.readFileSync(usageFile, 'utf8');
            data = JSON.parse(fileContent);
          }
        } catch (error) {
          // If Node.js modules aren't available, treat as browser
          this.isNode = false;
        }
      } else {
        // Browser environment - use localStorage
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          data = JSON.parse(stored);
        }
      }
      
      // Default data structure
      if (!data) {
        data = {
          count: 0,
          month: this.getCurrentMonth(),
          lastReset: new Date().toISOString()
        };
      }
      
      // Reset count if it's a new month
      const currentMonth = this.getCurrentMonth();
      if (data.month !== currentMonth) {
        data = {
          count: 0,
          month: currentMonth,
          lastReset: new Date().toISOString()
        };
        this.saveUsageData(data);
      }
      
      return data;
    } catch (error) {
      console.warn('Error reading WordsAPI usage data:', error.message);
      return {
        count: 0,
        month: this.getCurrentMonth(),
        lastReset: new Date().toISOString()
      };
    }
  }

  /**
   * Save usage data to storage
   * @param {Object} data - Usage data to save
   */
  saveUsageData(data) {
    try {
      if (this.isNode) {
        // Node.js environment - use file system
        try {
          const fs = require('fs');
          const path = require('path');
          const usageFile = path.join(process.cwd(), '.wordsapi-usage.json');
          fs.writeFileSync(usageFile, JSON.stringify(data, null, 2));
        } catch (error) {
          // If Node.js modules aren't available, treat as browser and use localStorage
          this.isNode = false;
          localStorage.setItem(this.storageKey, JSON.stringify(data));
        }
      } else {
        // Browser environment - use localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Error saving WordsAPI usage data:', error.message);
    }
  }

  /**
   * Get current month identifier (YYYY-MM)
   * @returns {string} Current month identifier
   */
  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Check if we can make a request (under the limit)
   * @returns {boolean} True if we can make a request
   */
  canMakeRequest() {
    const usage = this.getUsageData();
    return usage.count < this.MONTHLY_LIMIT;
  }

  /**
   * Record a successful API request
   * @returns {Object} Updated usage data
   */
  recordRequest() {
    const usage = this.getUsageData();
    usage.count += 1;
    usage.lastRequest = new Date().toISOString();
    this.saveUsageData(usage);
    return usage;
  }

  /**
   * Get current usage statistics
   * @returns {Object} Usage statistics
   */
  getUsageStats() {
    const usage = this.getUsageData();
    return {
      used: usage.count,
      limit: this.MONTHLY_LIMIT,
      remaining: this.MONTHLY_LIMIT - usage.count,
      month: usage.month,
      percentage: Math.round((usage.count / this.MONTHLY_LIMIT) * 100),
      lastRequest: usage.lastRequest || null,
      lastReset: usage.lastReset
    };
  }

  /**
   * Get user-friendly message about API usage
   * @returns {string} Usage message
   */
  getUsageMessage() {
    const stats = this.getUsageStats();
    
    if (stats.used >= this.MONTHLY_LIMIT) {
      return `⚠️ WordsAPI limit reached! Used ${stats.used}/${stats.limit} requests this month (${stats.month}). The game will use the local dictionary until next month.`;
    } else if (stats.percentage >= 90) {
      return `⚠️ WordsAPI usage high: ${stats.used}/${stats.limit} requests (${stats.percentage}%) used this month.`;
    } else if (stats.percentage >= 75) {
      return `📊 WordsAPI usage: ${stats.used}/${stats.limit} requests (${stats.percentage}%) used this month.`;
    } else {
      return `✅ WordsAPI usage: ${stats.used}/${stats.limit} requests (${stats.percentage}%) used this month.`;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WordsAPITracker;
}