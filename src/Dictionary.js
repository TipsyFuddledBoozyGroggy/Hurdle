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
    
    // WordsAPI configuration - enabled in both development and production
    this.wordsApiEnabled = typeof fetch !== 'undefined';
    this.apiRetryCount = 0;
    this.maxRetries = 3;
    
    // Initialize API tracker in both development and production
    this.apiTracker = (WordsAPITracker) ? new WordsAPITracker() : null;
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

    // Check API limit before making request
    if (this.apiTracker && !this.apiTracker.shouldUseAPI()) {
      if (!this.limitExceededMessageShown) {
        console.warn(this.apiTracker.getUsageMessage());
        this.limitExceededMessageShown = true;
      }
      // Fall back to local dictionary
      return this.wordSet.has(word.toLowerCase());
    }

    try {
      // Use WordsAPI for word validation
      const response = await fetch(`https://wordsapiv1.p.rapidapi.com/words/${word.toLowerCase()}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': 'e31ec18bc2mshcaa71bab98451fdp1490f9jsncceac7ee395b', // Your WordsAPI key
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
        }
      });

      // Extract and update rate limit information from headers
      if (this.apiTracker) {
        const rateLimitInfo = this.apiTracker.updateFromHeaders(response);
        if (rateLimitInfo) {
          // Check thresholds and log warnings
          this.apiTracker.checkRateLimitThresholds(rateLimitInfo);
        } else {
          // Only record to storage when headers are unavailable (fallback mode)
          this.apiTracker.recordRequest();
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
    // Check API limit before making request
    if (this.apiTracker && !this.apiTracker.shouldUseAPI()) {
      if (!this.limitExceededMessageShown) {
        console.warn(this.apiTracker.getUsageMessage());
        this.limitExceededMessageShown = true;
      }
      // Fall back to local dictionary with definition verification
      return await this.getRandomWordFromLocalDictionary();
    }

    // Try to get an uncommon word from WordsAPI first
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
    
    // Fallback to local dictionary with definition verification
    return await this.getRandomWordFromLocalDictionary();
  }

  /**
   * Get a random word from local dictionary with definition verification
   * @returns {Promise<string>} A random word that has definitions in WordsAPI
   */
  async getRandomWordFromLocalDictionary() {
    const nonProperNounWords = this.getNonProperNounWords();
    if (nonProperNounWords.length === 0) {
      // Fallback to all words if no non-proper nouns found
      const randomIndex = Math.floor(Math.random() * this.wordArray.length);
      return this.wordArray[randomIndex];
    }

    // Try up to 10 times to find a word with definitions
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const randomIndex = Math.floor(Math.random() * nonProperNounWords.length);
      const candidateWord = nonProperNounWords[randomIndex];
      
      // If WordsAPI is available, verify the word has definitions
      if (this.wordsApiEnabled) {
        try {
          const hasDefinition = await this.verifyWordHasDefinition(candidateWord);
          if (hasDefinition) {
            console.log(`Selected word "${candidateWord}" with verified definition`);
            return candidateWord;
          } else {
            console.log(`Rejected word "${candidateWord}" - no definitions found`);
            continue;
          }
        } catch (error) {
          // If verification fails, continue to next word
          console.warn(`Could not verify definition for "${candidateWord}":`, error.message);
          continue;
        }
      } else {
        // If WordsAPI is not available, return the word without verification
        return candidateWord;
      }
    }
    
    // If we couldn't find a word with definitions after maxAttempts, return a random word
    console.warn(`Could not find a word with definitions after ${maxAttempts} attempts, returning random word`);
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
   * Verify that a word has at least one valid definition from WordsAPI
   * @param {string} word - The word to check for definitions
   * @returns {Promise<boolean>} True if the word has definitions, false otherwise
   */
  async verifyWordHasDefinition(word) {
    try {
      const response = await fetch(`https://wordsapiv1.p.rapidapi.com/words/${word.toLowerCase()}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': 'e31ec18bc2mshcaa71bab98451fdp1490f9jsncceac7ee395b',
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
        }
      });

      // Record the API request for definition validation and extract headers
      if (this.apiTracker) {
        const rateLimitInfo = this.apiTracker.updateFromHeaders(response);
        if (rateLimitInfo) {
          // Check thresholds and log warnings
          this.apiTracker.checkRateLimitThresholds(rateLimitInfo);
        } else {
          // Only record to storage when headers are unavailable (fallback mode)
          this.apiTracker.recordRequest();
        }
      }

      // Handle 403 Forbidden (API key issues) gracefully
      if (response.status === 403) {
        // If we can't verify due to API limits, return false to avoid words without definitions
        console.warn(`Could not verify definition for word: ${word} - API key limit reached`);
        return false;
      }

      // Handle 404 Not Found - word doesn't exist
      if (response.status === 404) {
        return false;
      }

      if (response.ok) {
        const data = await response.json();
        // Check if the word has at least one definition with meaningful content
        // and contains 'typeOf' (common concepts) rather than 'instanceOf' (specific instances/names)
        const hasValidDefinition = data.results && data.results.length > 0 && 
               data.results.some(result => 
                 result.definition && 
                 result.definition.trim() && 
                 result.definition.trim().length > 10 && // Ensure definition has substance
                 result.typeOf && // Must have typeOf (indicates common concept)
                 !result.instanceOf // Must NOT have instanceOf (indicates specific instance/name)
               );
        
        if (hasValidDefinition) {
          const validResults = data.results.filter(result => 
            result.typeOf && !result.instanceOf
          );
          console.log(`Word "${word}" has ${validResults.length} valid definition(s) with typeOf`);
        } else {
          const hasInstanceOf = data.results && data.results.some(result => result.instanceOf);
          if (hasInstanceOf) {
            console.log(`Word "${word}" rejected - contains instanceOf (proper noun/name)`);
          } else {
            console.log(`Word "${word}" rejected - no typeOf found (not a common concept)`);
          }
        }
        
        return hasValidDefinition;
      }
      
      // If the word doesn't exist or has no definitions, return false
      return false;
    } catch (error) {
      // If verification fails due to network issues, return false to be safe
      console.warn(`Could not verify definition for word: ${word}`, error.message);
      return false;
    }
  }

  /**
   * Validate that a word contains only letters and is exactly 5 characters
   * @param {string} word - The word to validate
   * @returns {boolean} True if the word format is valid
   */
  validateWordFormat(word) {
    return /^[a-zA-Z]{5}$/.test(word);
  }

  /**
   * Get words that are not proper nouns
   * @returns {string[]} Array of words that are not proper nouns
   */
  getNonProperNounWords() {
    return this.wordArray.filter(word => !this.isProperNoun(word));
  }

  /**
   * Get a random uncommon 5-letter word from WordsAPI with definition validation
   * @returns {Promise<string|null>} An uncommon word with definitions or null if failed
   */
  async getRandomUncommonWordFromAPI() {
    try {
      // Create properly encoded URL parameters
      const params = new URLSearchParams({
        letterPattern: '^[a-zA-Z]{5}$',  // Only letters, exactly 5 characters
        frequencyMin: '1',
        frequencyMax: '3',
        random: 'true'
      });
      
      const url = `https://wordsapiv1.p.rapidapi.com/words/?${params.toString()}`;
      
      // Search for random 5-letter words with letters only (no numbers/symbols)
      // frequencyMin=1, frequencyMax=3 targets rare words
      const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': 'e31ec18bc2mshcaa71bab98451fdp1490f9jsncceac7ee395b', // Your WordsAPI key
            'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
          }
        }
      );

      // Record the API request and extract headers
      if (this.apiTracker) {
        const rateLimitInfo = this.apiTracker.updateFromHeaders(response);
        if (rateLimitInfo) {
          // Check thresholds and log warnings
          this.apiTracker.checkRateLimitThresholds(rateLimitInfo);
        } else {
          // Only record to storage when headers are unavailable (fallback mode)
          this.apiTracker.recordRequest();
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
      
      // Extract and validate word from API response
      let word = null;
      
      // WordsAPI returns either a single word object or search results
      if (data.word && data.word.length === 5 && this.validateWordFormat(data.word)) {
        word = data.word.toLowerCase();
      } else if (data.results && data.results.data && data.results.data.length > 0) {
        // Pick a random word from the results, filtering for valid format
        const validWords = data.results.data.filter(w => 
          w.length === 5 && this.validateWordFormat(w)
        );
        if (validWords.length > 0) {
          const randomIndex = Math.floor(Math.random() * validWords.length);
          word = validWords[randomIndex].toLowerCase();
        }
      }
      
      // If we found a word, verify it has definitions before accepting it
      if (word) {
        const hasDefinition = await this.verifyWordHasDefinition(word);
        if (hasDefinition) {
          return word;
        } else {
          console.log(`Rejected word "${word}" - no definitions found`);
          return null;
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