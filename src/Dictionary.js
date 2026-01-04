/**
 * Dictionary module for Hard Wordle
 * Manages the word dictionary and provides validation and selection methods
 */

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
    
    // WordsAPI configuration for uncommon words
    this.wordsApiEnabled = typeof fetch !== 'undefined'; // Only in browser
    this.apiRetryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Check if a word exists in the dictionary using API validation
   * @param {string} word - The word to validate
   * @returns {Promise<boolean>} True if the word is a valid English word
   */
  async isValidWord(word) {
    if (typeof word !== 'string' || word.length !== 5) {
      return false;
    }

    try {
      // Use the same dictionary API for word validation
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      return response.ok;
    } catch (error) {
      // If API fails, fall back to local dictionary
      console.warn('API validation failed, falling back to local dictionary:', error);
      return this.wordSet.has(word.toLowerCase());
    }
  }

  /**
   * Get a random uncommon word from WordsAPI or fallback to local dictionary
   * @returns {Promise<string>} A random 5-letter uncommon word
   */
  async getRandomWord() {
    // Try to get an uncommon word from WordsAPI first
    if (this.wordsApiEnabled && this.apiRetryCount < this.maxRetries) {
      try {
        const uncommonWord = await this.getRandomUncommonWordFromAPI();
        if (uncommonWord) {
          this.apiRetryCount = 0; // Reset retry count on success
          return uncommonWord;
        }
      } catch (error) {
        console.warn('WordsAPI failed, falling back to local dictionary:', error.message);
        this.apiRetryCount++;
      }
    }
    
    // Fallback to local dictionary
    const randomIndex = Math.floor(Math.random() * this.wordArray.length);
    return this.wordArray[randomIndex];
  }

  /**
   * Get a random uncommon 5-letter word from WordsAPI
   * @returns {Promise<string|null>} An uncommon word or null if failed
   */
  async getRandomUncommonWordFromAPI() {
    try {
      // Search for random 5-letter words with low frequency (1-3 = uncommon)
      // frequencyMin=1, frequencyMax=3 targets rare words
      const response = await fetch(
        'https://wordsapiv1.p.rapidapi.com/words/?letterPattern=^.{5}$&frequencyMin=1&frequencyMax=3&random=true',
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': 'demo', // Using demo key - users can replace with their own
            'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`WordsAPI responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      // WordsAPI returns either a single word object or search results
      if (data.word && data.word.length === 5) {
        return data.word.toLowerCase();
      } else if (data.results && data.results.data && data.results.data.length > 0) {
        // Pick a random word from the results
        const words = data.results.data.filter(word => word.length === 5);
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dictionary;
}
