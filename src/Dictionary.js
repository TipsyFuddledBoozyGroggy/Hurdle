/**
 * Dictionary module for Hard Wordle
 * Manages the word dictionary and provides validation and selection methods
 */

// Import the WordsAPI tracker
const WordsAPITracker = typeof require !== 'undefined' ? require('./WordsAPITracker.js') : null;

class Dictionary {
  /**
   * Create a Dictionary instance
   * @param {string[]} words - Array of valid 5-letter words (fallback list)
   */
  constructor(words) {
    if (!Array.isArray(words)) {
      throw new Error('Dictionary constructor requires an array of words');
    }
    
    if (words.length === 0) {
      throw new Error('Dictionary cannot be empty');
    }
    
    // Store words in a Set for O(1) lookup performance (fallback)
    this.wordSet = new Set(words.map(word => word.toLowerCase()));
    this.wordArray = Array.from(this.wordSet);
    
    // Environment detection
    this.isProduction = this.detectProductionEnvironment();
    
    // WordsAPI configuration - only enabled in production
    this.wordsApiEnabled = typeof fetch !== 'undefined' && this.isProduction;
    this.apiRetryCount = 0;
    this.maxRetries = 3;
    
    // Initialize API tracker only in production
    this.apiTracker = (WordsAPITracker && this.isProduction) ? new WordsAPITracker() : null;
    this.limitExceededMessageShown = false;
    
    // Log environment mode
    if (typeof console !== 'undefined') {
      console.log(`Dictionary initialized in ${this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
      console.log(`WordsAPI ${this.wordsApiEnabled ? 'ENABLED' : 'DISABLED'} - using ${this.wordsApiEnabled ? 'API + local fallback' : 'local dictionary only'}`);
    }
  }

  /**
   * Detect if we're running in production environment
   * @returns {boolean} True if running in production
   */
  detectProductionEnvironment() {
    // Check various indicators of production environment
    
    // 1. Check NODE_ENV environment variable (Node.js)
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
      return true;
    }
    
    // 2. Check if we're in browser and not on localhost
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || 
                         hostname === '127.0.0.1' || 
                         hostname.startsWith('192.168.') ||
                         hostname.startsWith('10.') ||
                         hostname.endsWith('.local');
      
      // Production if not localhost and not file:// protocol
      return !isLocalhost && window.location.protocol !== 'file:';
    }
    
    // 3. Default to development if we can't determine
    return false;
  }

  /**
   * Check if a word exists in the dictionary using WordsAPI validation
   * @param {string} word - The word to validate
   * @returns {Promise<boolean>} True if the word is a valid English word
   */
  async isValidWord(word) {
    if (typeof word !== 'string' || word.length !== 5) {
      return false;
    }

    // In development mode, always use local dictionary
    if (!this.isProduction) {
      return this.wordSet.has(word.toLowerCase());
    }

    // Check API limit before making request (production only)
    if (this.apiTracker && !this.apiTracker.canMakeRequest()) {
      if (!this.limitExceededMessageShown) {
        console.warn(this.apiTracker.getUsageMessage());
        this.limitExceededMessageShown = true;
      }
      // Fall back to local dictionary
      return this.wordSet.has(word.toLowerCase());
    }

    try {
      // Use WordsAPI for word validation (production only)
      const response = await fetch(`https://wordsapiv1.p.rapidapi.com/words/${word.toLowerCase()}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': 'e31ec18bc2mshcaa71bab98451fdp1490f9jsncceac7ee395b', // Your WordsAPI key
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
        }
      });

      // Record the API request
      if (this.apiTracker) {
        const usage = this.apiTracker.recordRequest();
        // Log usage periodically
        if (usage.count % 100 === 0 || usage.count >= 2400) {
          console.log(this.apiTracker.getUsageMessage());
        }
      }

      // WordsAPI returns 200 for valid words, 404 for invalid words
      // 403 means API key issue - fall back to local dictionary
      if (response.status === 403) {
        // Silently fall back to local dictionary for demo key limitations
        return this.wordSet.has(word.toLowerCase());
      }
      
      return response.ok;
    } catch (error) {
      // If API fails, silently fall back to local dictionary
      return this.wordSet.has(word.toLowerCase());
    }
  }

  /**
   * Synchronous word validation using only the local dictionary (for testing)
   * @param {string} word - The word to validate
   * @returns {boolean} True if the word exists in the local dictionary
   */
  isValidWordSync(word) {
    if (typeof word !== 'string' || word.length !== 5) {
      return false;
    }
    return this.wordSet.has(word.toLowerCase());
  }

  /**
   * Get a random uncommon word from WordsAPI or fallback to local dictionary
   * @returns {Promise<string>} A random 5-letter uncommon word
   */
  async getRandomWord() {
    // In development mode, always use local dictionary (excluding proper nouns)
    if (!this.isProduction) {
      const nonProperNounWords = this.getNonProperNounWords();
      if (nonProperNounWords.length === 0) {
        // Fallback to all words if no non-proper nouns found
        const randomIndex = Math.floor(Math.random() * this.wordArray.length);
        return this.wordArray[randomIndex];
      }
      const randomIndex = Math.floor(Math.random() * nonProperNounWords.length);
      return nonProperNounWords[randomIndex];
    }

    // Check API limit before making request (production only)
    if (this.apiTracker && !this.apiTracker.canMakeRequest()) {
      if (!this.limitExceededMessageShown) {
        console.warn(this.apiTracker.getUsageMessage());
        this.limitExceededMessageShown = true;
      }
      // Fall back to local dictionary (excluding proper nouns)
      const nonProperNounWords = this.getNonProperNounWords();
      if (nonProperNounWords.length === 0) {
        // Fallback to all words if no non-proper nouns found
        const randomIndex = Math.floor(Math.random() * this.wordArray.length);
        return this.wordArray[randomIndex];
      }
      const randomIndex = Math.floor(Math.random() * nonProperNounWords.length);
      return nonProperNounWords[randomIndex];
    }

    // Try to get an uncommon word from WordsAPI first (production only)
    if (this.wordsApiEnabled && this.apiRetryCount < this.maxRetries) {
      try {
        const uncommonWord = await this.getRandomUncommonWordFromAPI();
        if (uncommonWord) {
          this.apiRetryCount = 0; // Reset retry count on success
          return uncommonWord;
        }
      } catch (error) {
        // Silently fall back to local dictionary
        this.apiRetryCount++;
      }
    }
    
    // Fallback to local dictionary (excluding proper nouns)
    const nonProperNounWords = this.getNonProperNounWords();
    if (nonProperNounWords.length === 0) {
      // Fallback to all words if no non-proper nouns found
      const randomIndex = Math.floor(Math.random() * this.wordArray.length);
      return this.wordArray[randomIndex];
    }
    const randomIndex = Math.floor(Math.random() * nonProperNounWords.length);
    return nonProperNounWords[randomIndex];
  }

  /**
   * Check if a word is likely a proper noun (starts with capital letter)
   * @param {string} word - The word to check
   * @returns {boolean} True if the word appears to be a proper noun
   */
  isProperNoun(word) {
    if (typeof word !== 'string' || word.length === 0) {
      return false;
    }
    // Check if the first letter is uppercase (indicating a proper noun)
    return word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
  }

  /**
   * Get words that are not proper nouns
   * @returns {string[]} Array of words that are not proper nouns
   */
  getNonProperNounWords() {
    return this.wordArray.filter(word => !this.isProperNoun(word));
  }

  /**
   * Get a random uncommon 5-letter word from WordsAPI
   * @returns {Promise<string|null>} An uncommon word or null if failed
   */
  async getRandomUncommonWordFromAPI() {
    try {
      // Search for random 5-letter words with letters only (no numbers/symbols)
      // letterPattern=^[a-zA-Z]{5}$ ensures only letters
      // frequencyMin=1, frequencyMax=3 targets rare words
      const response = await fetch(
        'https://wordsapiv1.p.rapidapi.com/words/?letterPattern=^[a-zA-Z]{5}$&frequencyMin=1&frequencyMax=3&random=true',
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': 'e31ec18bc2mshcaa71bab98451fdp1490f9jsncceac7ee395b', // Your WordsAPI key
            'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
          }
        }
      );

      // Record the API request
      if (this.apiTracker) {
        const usage = this.apiTracker.recordRequest();
        // Log usage periodically
        if (usage.count % 100 === 0 || usage.count >= 2400) {
          console.log(this.apiTracker.getUsageMessage());
        }
      }

      // Handle 403 Forbidden (API key issues) gracefully
      if (response.status === 403) {
        // Silently return null for demo key limitations
        return null;
      }

      if (!response.ok) {
        throw new Error(`WordsAPI responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Helper function to check if word contains only letters
      const isLettersOnly = (word) => /^[a-zA-Z]+$/.test(word);
      
      // WordsAPI returns either a single word object or search results
      if (data.word && data.word.length === 5 && isLettersOnly(data.word)) {
        return data.word.toLowerCase();
      } else if (data.results && data.results.data && data.results.data.length > 0) {
        // Pick a random word from the results, filtering for letters only
        const words = data.results.data.filter(word => 
          word.length === 5 && isLettersOnly(word)
        );
        if (words.length > 0) {
          const randomIndex = Math.floor(Math.random() * words.length);
          return words[randomIndex].toLowerCase();
        }
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to fetch from WordsAPI: ${error.message}`);
    }
  }

  /**
   * Get the total number of words in the dictionary
   * @returns {number} The number of words
   */
  size() {
    return this.wordArray.length;
  }

  /**
   * Get WordsAPI usage statistics
   * @returns {Object|null} Usage statistics or null if tracker not available
   */
  getAPIUsageStats() {
    return this.apiTracker ? this.apiTracker.getUsageStats() : null;
  }

  /**
   * Get user-friendly API usage message
   * @returns {string|null} Usage message or null if tracker not available
   */
  getAPIUsageMessage() {
    return this.apiTracker ? this.apiTracker.getUsageMessage() : null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dictionary;
}