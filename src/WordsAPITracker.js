/**
 * WordsAPI Request Tracker - Header-Priority Architecture
 * 
 * This tracker prioritizes real-time header information from WordsAPI responses
 * over local storage tracking. File-based tracking is only used as a fallback
 * when header information is unavailable.
 * 
 * Priority Order:
 * 1. Header-based tracking (x-ratelimit-requests-remaining) - Most reliable
 * 2. Storage-based tracking (.wordsapi-usage.json) - Fallback only
 * 
 * Tracks API requests to stay within the 2500/month limit
 */

class WordsAPITracker {
  constructor() {
    this.MONTHLY_LIMIT = 2500; // Fallback if headers unavailable
    this.storageKey = 'wordsapi_usage';
    this.isNode = typeof window === 'undefined';
    
    // Header-based tracking state (PRIMARY)
    this.lastKnownRemaining = null;
    this.lastKnownLimit = null;
    this.lastKnownReset = null;
    this.lastHeaderUpdate = null;
    this.warningThresholds = {
      high: 250,    // Warn when < 250 remaining (90%)
      medium: 625,  // Log when < 625 remaining (75%)
    };
  }

  /**
   * Check if header-based tracking is available and reliable
   * @returns {boolean} True if we have recent header data
   */
  hasReliableHeaderData() {
    return this.lastKnownRemaining !== null && this.lastHeaderUpdate !== null;
  }

  /**
   * Get the current tracking mode being used
   * @returns {string} 'headers' or 'storage'
   */
  getCurrentTrackingMode() {
    return this.hasReliableHeaderData() ? 'headers' : 'storage';
  }

  /**
   * Extract rate limit information from API response headers
   * @param {Response} response - The fetch response object
   * @returns {Object|null} Rate limit info or null if headers unavailable
   */
  updateFromHeaders(response) {
    if (!response || !response.headers) {
      return null;
    }

    const remaining = response.headers.get('x-ratelimit-requests-remaining');
    const limit = response.headers.get('x-ratelimit-requests-limit');
    const reset = response.headers.get('x-ratelimit-requests-reset');
    
    if (remaining !== null) {
      this.lastKnownRemaining = parseInt(remaining);
      this.lastHeaderUpdate = new Date().toISOString();
      
      // Update monthly limit if provided
      if (limit !== null) {
        this.lastKnownLimit = parseInt(limit);
        this.MONTHLY_LIMIT = this.lastKnownLimit;
      }
      
      // Store reset time if provided
      if (reset !== null) {
        this.lastKnownReset = reset;
      }
      
      return {
        remaining: this.lastKnownRemaining,
        limit: this.lastKnownLimit || this.MONTHLY_LIMIT,
        reset: this.lastKnownReset,
        updated: this.lastHeaderUpdate
      };
    }
    
    return null;
  }

  /**
   * Check if we should use API based on header information (primary) or storage (fallback)
   * @returns {boolean} True if we should make API requests
   */
  shouldUseAPI() {
    // PRIORITY 1: Use header-based tracking if available
    if (this.lastKnownRemaining !== null) {
      // Need at least 2 requests: one for word search, one for definition check
      return this.lastKnownRemaining >= 2;
    }
    
    // PRIORITY 2: Fallback to storage-based tracking only when headers unavailable
    // This is conservative and only used when we have no header information
    const usage = this.getUsageData();
    const remaining = this.MONTHLY_LIMIT - usage.count;
    return remaining >= 2; // Need at least 2 requests for word + definition check
  }

  /**
   * Get real-time usage statistics - prioritizes headers over storage
   * @returns {Object} Usage statistics with header information preferred
   */
  getHeaderBasedStats() {
    // PRIORITY 1: Use header-based data if available (most accurate)
    if (this.lastKnownRemaining !== null) {
      const limit = this.lastKnownLimit || this.MONTHLY_LIMIT;
      const used = limit - this.lastKnownRemaining;
      const percentage = Math.round((used / limit) * 100);
      
      return {
        used: used,
        limit: limit,
        remaining: this.lastKnownRemaining,
        percentage: percentage,
        lastUpdate: this.lastHeaderUpdate,
        reset: this.lastKnownReset,
        source: 'headers',
        reliable: true // Header data is always reliable
      };
    }
    
    // PRIORITY 2: Fallback to storage-based tracking (less reliable)
    const usage = this.getUsageData();
    const remaining = this.MONTHLY_LIMIT - usage.count;
    return {
      used: usage.count,
      limit: this.MONTHLY_LIMIT,
      remaining: remaining,
      month: usage.month,
      percentage: Math.round((usage.count / this.MONTHLY_LIMIT) * 100),
      lastRequest: usage.lastRequest || null,
      lastReset: usage.lastReset,
      source: 'storage',
      reliable: false // Storage data may be out of sync
    };
  }

  /**
   * Check rate limit thresholds and provide notifications
   * @param {Object} rateLimitInfo - Rate limit info from headers
   * @returns {string|null} Warning message if threshold exceeded
   */
  checkRateLimitThresholds(rateLimitInfo) {
    if (!rateLimitInfo) return null;
    
    const { remaining, limit } = rateLimitInfo;
    const percentage = ((limit - remaining) / limit) * 100;
    
    if (remaining === 0) {
      const message = `⚠️ WordsAPI limit reached! No requests remaining until reset.`;
      console.warn(message);
      return message;
    } else if (remaining <= 2) {
      const message = `🚨 WordsAPI usage critical: ${remaining} requests remaining - switching to local dictionary`;
      console.warn(message);
      return message;
    } else if (remaining <= this.warningThresholds.high) {
      const message = `⚠️ WordsAPI usage high: ${remaining} requests remaining (${percentage.toFixed(1)}% used)`;
      console.warn(message);
      return message;
    } else if (remaining <= this.warningThresholds.medium) {
      const message = `📊 WordsAPI usage: ${remaining} requests remaining (${percentage.toFixed(1)}% used)`;
      console.log(message);
      return message;
    }
    
    return null;
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
   * Check if we can make a request - simplified to prioritize headers
   * @returns {boolean} True if we can make a request
   */
  canMakeRequest() {
    // Simplified logic - just use shouldUseAPI which already prioritizes headers
    return this.shouldUseAPI();
  }

  /**
   * Record a successful API request - only used when headers unavailable
   * @returns {Object} Updated usage data (only relevant for storage fallback)
   */
  recordRequest() {
    // Only record to storage when headers are unavailable (fallback mode)
    if (this.lastKnownRemaining === null) {
      const usage = this.getUsageData();
      usage.count += 1;
      usage.lastRequest = new Date().toISOString();
      this.saveUsageData(usage);
      return usage;
    }
    
    // When headers are available, storage tracking is not needed
    // Return current header-based stats instead
    return this.getHeaderBasedStats();
  }

  /**
   * Get current usage statistics (header-based preferred)
   * @returns {Object} Usage statistics
   */
  getUsageStats() {
    return this.getHeaderBasedStats();
  }

  /**
   * Get user-friendly message about API usage - prioritizes header data
   * @returns {string} Usage message based on most reliable data source
   */
  getUsageMessage() {
    const stats = this.getHeaderBasedStats();
    
    // Add reliability indicator to message
    const sourceIndicator = stats.reliable ? '' : ' (estimated)';
    
    if (stats.remaining <= 0) {
      return `⚠️ WordsAPI limit reached! Used ${stats.used}/${stats.limit} requests${sourceIndicator}. The game will use the local dictionary until reset.`;
    } else if (stats.percentage >= 90) {
      return `⚠️ WordsAPI usage high: ${stats.used}/${stats.limit} requests (${stats.percentage}%) used${sourceIndicator}.`;
    } else if (stats.percentage >= 75) {
      return `📊 WordsAPI usage: ${stats.used}/${stats.limit} requests (${stats.percentage}%) used${sourceIndicator}.`;
    } else {
      return `✅ WordsAPI usage: ${stats.used}/${stats.limit} requests (${stats.percentage}%) used${sourceIndicator}.`;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WordsAPITracker;
}

// ES6 export for modern bundlers
export default WordsAPITracker;