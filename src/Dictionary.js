/**
 * Dictionary module for Hurdle
 * Manages the word dictionary and provides validation and selection methods
 */

// Import the WordsAPI tracker and configuration
import WordsAPITracker from './WordsAPITracker.js';
import { WORDS_API_CONFIG } from './config.js';

class Dictionary {
  /**
   * Create a Dictionary instance that uses WordsAPI exclusively
   * @param {string[]} words - Optional fallback word list for testing only
   */
  constructor(words = null) {
    // Only use fallback words in test environment
    const isTestEnvironment = this.detectTestEnvironment();
    
    if (words && isTestEnvironment) {
      console.log('Dictionary: Using fallback word list for testing');
      // Store words in a Set for O(1) lookup performance (fallback for tests)
      this.wordSet = new Set(words.map(word => word.toLowerCase()));
      this.wordArray = Array.from(this.wordSet);
      this.useLocalFallback = true;
    } else {
      console.log('Dictionary: Using WordsAPI exclusively (no local word list)');
      this.wordSet = new Set();
      this.wordArray = [];
      this.useLocalFallback = false;
    }
    
    // Environment detection
    this.isProduction = this.detectProductionEnvironment();
    
    // WordsAPI configuration - always enabled
    this.wordsApiEnabled = typeof fetch !== 'undefined';
    this.apiRetryCount = 0;
    this.maxRetries = 3;
    
    // Initialize API tracker
    this.apiTracker = new WordsAPITracker();
    this.limitExceededMessageShown = false;
    
    // Log configuration
    if (typeof console !== 'undefined') {
      console.log(`Dictionary initialized in ${this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
      console.log(`WordsAPI ${this.wordsApiEnabled ? 'ENABLED' : 'DISABLED'} - using ${this.useLocalFallback ? 'API + local fallback for tests' : 'API only'}`);
    }
  }

  /**
   * Detect if we're running in a test environment
   * @returns {boolean} True if running in test environment
   */
  detectTestEnvironment() {
    // Check for Jest test environment
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
      return true;
    }
    
    // Check for Jest globals
    if (typeof global !== 'undefined' && global.expect && global.test) {
      return true;
    }
    
    // Check for other test indicators
    if (typeof window !== 'undefined' && window.__karma__) {
      return true;
    }
    
    return false;
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

    // Always try WordsAPI first if available
    if (this.wordsApiEnabled) {
      // Check API limit before making request
      if (this.apiTracker && !this.apiTracker.shouldUseAPI()) {
        if (!this.limitExceededMessageShown) {
          console.warn(this.apiTracker.getUsageMessage());
          this.limitExceededMessageShown = true;
        }
        // Only fall back to local dictionary in test environment
        if (this.useLocalFallback) {
          return this.wordSet.has(word.toLowerCase());
        } else {
          // In production, return false if API limit exceeded
          return false;
        }
      }

      try {
        // Use WordsAPI for word validation
        const response = await fetch(`https://wordsapiv1.p.rapidapi.com/words/${word.toLowerCase()}`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': WORDS_API_CONFIG.API_KEY,
            'X-RapidAPI-Host': WORDS_API_CONFIG.HOST
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
        // 403 means API key issue - only fall back to local in test environment
        if (response.status === 403) {
          if (this.useLocalFallback) {
            return this.wordSet.has(word.toLowerCase());
          } else {
            // In production, treat API key issues as invalid words
            return false;
          }
        }
        
        return response.ok;
      } catch (error) {
        // If API fails, only fall back to local dictionary in test environment
        if (this.useLocalFallback) {
          return this.wordSet.has(word.toLowerCase());
        } else {
          // In production, treat API failures as invalid words
          console.warn(`WordsAPI validation failed for "${word}":`, error.message);
          return false;
        }
      }
    }

    // If WordsAPI is not available, only use local fallback in test environment
    if (this.useLocalFallback) {
      return this.wordSet.has(word.toLowerCase());
    } else {
      // In production without WordsAPI, cannot validate
      console.error('WordsAPI not available and no local fallback configured');
      return false;
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
   * Get a random word from WordsAPI (no local fallback except in tests)
   * @param {Object} frequencyRange - Optional frequency range {min, max}
   * @returns {Promise<string>} A random 5-letter word
   */
  async getRandomWord(frequencyRange = null) {
    console.log(`getRandomWord called with frequencyRange:`, frequencyRange);
    console.log(`wordsApiEnabled: ${this.wordsApiEnabled}, useLocalFallback: ${this.useLocalFallback}`);
    
    // ALWAYS ensure we have a frequency range for difficulty-based word selection
    let finalFrequencyRange = frequencyRange;
    if (!finalFrequencyRange || typeof finalFrequencyRange.min !== 'number' || typeof finalFrequencyRange.max !== 'number') {
      console.warn('No valid frequency range provided to getRandomWord, using default medium range');
      finalFrequencyRange = { min: 4.0, max: 5.49 }; // Default to medium difficulty
    }
    
    console.log(`Final frequency range to be used: ${finalFrequencyRange.min} - ${finalFrequencyRange.max}`);
    
    // Validate frequency range values
    if (finalFrequencyRange.min < 0 || finalFrequencyRange.max > 10 || finalFrequencyRange.min >= finalFrequencyRange.max) {
      console.error('Invalid frequency range values:', finalFrequencyRange);
      finalFrequencyRange = { min: 4.0, max: 5.49 }; // Fallback to medium
      console.log('Using fallback frequency range:', finalFrequencyRange);
    }
    
    // Always try WordsAPI first if available
    if (this.wordsApiEnabled) {
      // Check API limit before making request
      if (this.apiTracker && !this.apiTracker.shouldUseAPI()) {
        if (!this.limitExceededMessageShown) {
          console.warn(this.apiTracker.getUsageMessage());
          this.limitExceededMessageShown = true;
        }
        // Only fall back to local dictionary in test environment
        if (this.useLocalFallback) {
          console.log('API limit exceeded, using local fallback');
          return this.getRandomWordFromLocalDictionary();
        } else {
          // Use emergency fallback words
          return this.getEmergencyFallbackWord();
        }
      }

      // Try to get a word from WordsAPI with multiple attempts - ALWAYS with frequency range
      let lastError = null;
      for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        try {
          console.log(`WordsAPI attempt ${attempt + 1}/${this.maxRetries} with frequency range ${finalFrequencyRange.min}-${finalFrequencyRange.max}`);
          const wordFromAPI = await this.getRandomUncommonWordFromAPI(finalFrequencyRange);
          if (wordFromAPI) {
            console.log(`WordsAPI success: got word "${wordFromAPI}"`);
            this.apiRetryCount = 0; // Reset retry count on success
            return wordFromAPI;
          } else {
            console.warn(`WordsAPI attempt ${attempt + 1} returned null`);
          }
        } catch (error) {
          lastError = error;
          console.warn(`WordsAPI attempt ${attempt + 1} failed:`, error.message);
          console.error('Full error details:', error);
        }
      }
      
      // All WordsAPI attempts failed
      console.error('All WordsAPI attempts failed. Last error:', lastError?.message || 'Unknown error');
      console.error('Last error object:', lastError);
      this.apiRetryCount = this.maxRetries; // Mark as exhausted
    } else {
      console.error('WordsAPI is disabled (fetch not available)');
    }
    
    // If WordsAPI fails and we're in test environment, use local fallback
    if (this.useLocalFallback) {
      console.warn('WordsAPI failed, using local dictionary fallback for testing');
      return this.getRandomWordFromLocalDictionary();
    }
    
    // Use emergency fallback words to keep the game playable
    console.warn('WordsAPI failed, using emergency fallback words');
    return this.getEmergencyFallbackWord();
  }

  /**
   * Get an emergency fallback word when API fails
   * @returns {string} A random 5-letter word from a small predefined list
   */
  getEmergencyFallbackWord() {
    // Small list of common 5-letter words as emergency fallback
    const emergencyWords = [
      'about', 'above', 'abuse', 'actor', 'acute', 'admit', 'adopt', 'adult', 'after', 'again',
      'agent', 'agree', 'ahead', 'alarm', 'album', 'alert', 'alien', 'align', 'alike', 'alive',
      'allow', 'alone', 'along', 'alter', 'among', 'anger', 'angle', 'angry', 'apart', 'apple',
      'apply', 'arena', 'argue', 'arise', 'array', 'aside', 'asset', 'avoid', 'awake', 'award',
      'aware', 'badly', 'baker', 'bases', 'basic', 'beach', 'began', 'begin', 'being', 'below',
      'bench', 'billy', 'birth', 'black', 'blame', 'blind', 'block', 'blood', 'board', 'boost',
      'booth', 'bound', 'brain', 'brand', 'bread', 'break', 'breed', 'brief', 'bring', 'broad',
      'broke', 'brown', 'build', 'built', 'buyer', 'cable', 'calif', 'carry', 'catch', 'cause',
      'chain', 'chair', 'chaos', 'charm', 'chart', 'chase', 'cheap', 'check', 'chest', 'chief',
      'child', 'china', 'chose', 'civil', 'claim', 'class', 'clean', 'clear', 'click', 'climb',
      'clock', 'close', 'cloud', 'coach', 'coast', 'could', 'count', 'court', 'cover', 'craft',
      'crash', 'crazy', 'cream', 'crime', 'cross', 'crowd', 'crown', 'crude', 'curve', 'cycle',
      'daily', 'dance', 'dated', 'dealt', 'death', 'debut', 'delay', 'depth', 'doing', 'doubt',
      'dozen', 'draft', 'drama', 'drank', 'dream', 'dress', 'drill', 'drink', 'drive', 'drove',
      'dying', 'eager', 'early', 'earth', 'eight', 'elite', 'empty', 'enemy', 'enjoy', 'enter',
      'entry', 'equal', 'error', 'event', 'every', 'exact', 'exist', 'extra', 'faith', 'false',
      'fault', 'fiber', 'field', 'fifth', 'fifty', 'fight', 'final', 'first', 'fixed', 'flash',
      'fleet', 'floor', 'fluid', 'focus', 'force', 'forth', 'forty', 'forum', 'found', 'frame',
      'frank', 'fraud', 'fresh', 'front', 'fruit', 'fully', 'funny', 'giant', 'given', 'glass',
      'globe', 'going', 'grace', 'grade', 'grand', 'grant', 'grass', 'grave', 'great', 'green',
      'gross', 'group', 'grown', 'guard', 'guess', 'guest', 'guide', 'happy', 'harry', 'heart',
      'heavy', 'hence', 'henry', 'horse', 'hotel', 'house', 'human', 'ideal', 'image', 'index',
      'inner', 'input', 'issue', 'japan', 'jimmy', 'joint', 'jones', 'judge', 'known', 'label',
      'large', 'laser', 'later', 'laugh', 'layer', 'learn', 'lease', 'least', 'leave', 'legal',
      'level', 'lewis', 'light', 'limit', 'links', 'lives', 'local', 'loose', 'lower', 'lucky',
      'lunch', 'lying', 'magic', 'major', 'maker', 'march', 'maria', 'match', 'maybe', 'mayor',
      'meant', 'media', 'metal', 'might', 'minor', 'minus', 'mixed', 'model', 'money', 'month',
      'moral', 'motor', 'mount', 'mouse', 'mouth', 'moved', 'movie', 'music', 'needs', 'never',
      'newly', 'night', 'noise', 'north', 'noted', 'novel', 'nurse', 'occur', 'ocean', 'offer',
      'often', 'order', 'other', 'ought', 'paint', 'panel', 'paper', 'party', 'peace', 'peter',
      'phase', 'phone', 'photo', 'piano', 'piece', 'pilot', 'pitch', 'place', 'plain', 'plane',
      'plant', 'plate', 'point', 'pound', 'power', 'press', 'price', 'pride', 'prime', 'print',
      'prior', 'prize', 'proof', 'proud', 'prove', 'queen', 'quick', 'quiet', 'quite', 'radio',
      'raise', 'range', 'rapid', 'ratio', 'reach', 'ready', 'realm', 'rebel', 'refer', 'relax',
      'repay', 'reply', 'right', 'rigid', 'rival', 'river', 'robin', 'roger', 'roman', 'rough',
      'round', 'route', 'royal', 'rural', 'scale', 'scene', 'scope', 'score', 'sense', 'serve',
      'seven', 'shall', 'shape', 'share', 'sharp', 'sheet', 'shelf', 'shell', 'shift', 'shine',
      'shirt', 'shock', 'shoot', 'short', 'shown', 'sides', 'sight', 'silly', 'since', 'sixth',
      'sixty', 'sized', 'skill', 'sleep', 'slide', 'small', 'smart', 'smile', 'smith', 'smoke',
      'snake', 'snow', 'solid', 'solve', 'sorry', 'sound', 'south', 'space', 'spare', 'speak',
      'speed', 'spend', 'spent', 'split', 'spoke', 'sport', 'staff', 'stage', 'stake', 'stand',
      'start', 'state', 'steam', 'steel', 'steep', 'steer', 'stern', 'stick', 'still', 'stock',
      'stone', 'stood', 'store', 'storm', 'story', 'strip', 'stuck', 'study', 'stuff', 'style',
      'sugar', 'suite', 'super', 'sweet', 'swift', 'swing', 'swiss', 'table', 'taken', 'taste',
      'taxes', 'teach', 'teams', 'teeth', 'terry', 'texas', 'thank', 'theft', 'their', 'theme',
      'there', 'these', 'thick', 'thing', 'think', 'third', 'those', 'three', 'threw', 'throw',
      'thumb', 'tight', 'timer', 'tired', 'title', 'today', 'topic', 'total', 'touch', 'tough',
      'tower', 'track', 'trade', 'train', 'treat', 'trend', 'trial', 'tribe', 'trick', 'tried',
      'tries', 'truck', 'truly', 'trunk', 'trust', 'truth', 'twice', 'under', 'undue', 'union',
      'unity', 'until', 'upper', 'upset', 'urban', 'usage', 'usual', 'valid', 'value', 'video',
      'virus', 'visit', 'vital', 'vocal', 'voice', 'waste', 'watch', 'water', 'wheel', 'where',
      'which', 'while', 'white', 'whole', 'whose', 'woman', 'women', 'world', 'worry', 'worse',
      'worst', 'worth', 'would', 'write', 'wrong', 'wrote', 'young', 'youth'
    ];
    
    const randomIndex = Math.floor(Math.random() * emergencyWords.length);
    const word = emergencyWords[randomIndex];
    console.log(`Using emergency fallback word: ${word}`);
    return word;
  }

  /**
   * Get a random word from local dictionary (test environment only)
   * @returns {Promise<string>} A random word from local dictionary
   */
  async getRandomWordFromLocalDictionary() {
    if (!this.useLocalFallback || this.wordArray.length === 0) {
      throw new Error('Local dictionary fallback not available');
    }

    const nonProperNounWords = this.getNonProperNounWords();
    if (nonProperNounWords.length === 0) {
      // Fallback to all words if no non-proper nouns found
      const randomIndex = Math.floor(Math.random() * this.wordArray.length);
      return this.wordArray[randomIndex];
    }

    // Return a random non-proper noun word
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
          'X-RapidAPI-Key': WORDS_API_CONFIG.API_KEY,
          'X-RapidAPI-Host': WORDS_API_CONFIG.HOST
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
    // Must be exactly 5 characters and contain only letters (no numbers, punctuation, etc.)
    return /^[a-zA-Z]{5}$/.test(word);
  }

  /**
   * Get words that are not proper nouns (test environment only)
   * @returns {string[]} Array of words that are not proper nouns
   */
  getNonProperNounWords() {
    if (!this.useLocalFallback) {
      return []; // No local words in production
    }
    return this.wordArray.filter(word => !this.isProperNoun(word));
  }

  /**
   * Get a random uncommon 5-letter word from WordsAPI with definition validation
   * @param {Object} frequencyRange - Optional frequency range {min, max}
   * @returns {Promise<string|null>} An uncommon word with definitions or null if failed
   */
  async getRandomUncommonWordFromAPI(frequencyRange = null) {
    try {
      // ALWAYS ensure we have a frequency range - never call API without it
      let freq = frequencyRange;
      if (!freq || typeof freq.min !== 'number' || typeof freq.max !== 'number') {
        console.warn('No valid frequency range provided, using default medium range');
        freq = { min: 4.0, max: 5.49 }; // Default to medium difficulty
      }
      
      console.log(`getRandomUncommonWordFromAPI called with frequencyRange:`, frequencyRange);
      console.log(`Using frequency range: ${freq.min} - ${freq.max}`);
      
      // Only try API approaches that include frequency ranges
      const apiAttempts = [
        // Primary: letters=5 with frequency range (ALWAYS use frequency)
        {
          url: `https://wordsapiv1.p.rapidapi.com/words/?letters=5&frequencyMin=${freq.min}&frequencyMax=${freq.max}&random=true`,
          description: `letters=5 with frequency range ${freq.min}-${freq.max}`
        },
        // Secondary: basic random with frequency range (fallback but still with frequency)
        {
          url: `https://wordsapiv1.p.rapidapi.com/words/?frequencyMin=${freq.min}&frequencyMax=${freq.max}&random=true`,
          description: `basic random with frequency range ${freq.min}-${freq.max}`
        }
      ];
      
      for (const attempt of apiAttempts) {
        console.log(`Trying WordsAPI with ${attempt.description}: ${attempt.url}`);
        
        try {
          const response = await fetch(attempt.url, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': WORDS_API_CONFIG.API_KEY,
              'X-RapidAPI-Host': WORDS_API_CONFIG.HOST
            }
          });

          console.log(`WordsAPI response status: ${response.status} ${response.statusText}`);

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
            console.error('WordsAPI returned 403 Forbidden - API key issue or rate limit exceeded');
            return null;
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`WordsAPI attempt failed: ${response.status} ${response.statusText} - ${errorText}`);
            
            // Log specific error details for debugging
            if (response.status === 400) {
              console.error('Bad Request - Check frequency range parameters:', finalFrequencyRange);
            } else if (response.status === 429) {
              console.error('Rate limit exceeded - too many requests');
            } else if (response.status === 500) {
              console.error('WordsAPI server error');
            }
            
            continue; // Try next approach
          }

          const data = await response.json();
          console.log('WordsAPI response data:', data);
          
          // Extract word from API response
          let word = null;
          
          if (data.word && typeof data.word === 'string') {
            const candidateWord = data.word.toLowerCase();
            console.log(`Found candidate word: ${candidateWord}`);
            
            // Validate the word format and length
            if (candidateWord.length === 5 && this.validateWordFormat(candidateWord)) {
              word = candidateWord;
              console.log(`Word "${word}" passes format validation (letters only, no numbers)`);
              
              // Verify it has definitions before accepting it
              console.log(`Verifying definitions for word: ${word}`);
              const hasDefinition = await this.verifyWordHasDefinition(word);
              if (hasDefinition) {
                console.log(`Word "${word}" has valid definitions - SUCCESS!`);
                return word;
              } else {
                console.log(`Rejected word "${word}" - no valid definitions found`);
                continue; // Try next approach
              }
            } else {
              console.log(`Word "${candidateWord}" failed format validation (length: ${candidateWord.length}, contains non-letters: ${!/^[a-zA-Z]+$/.test(candidateWord)})`);
              continue; // Try next approach
            }
          } else {
            console.log('No word found in API response');
            continue; // Try next approach
          }
          
        } catch (fetchError) {
          console.warn(`Fetch error for ${attempt.description}:`, fetchError.message);
          continue; // Try next approach
        }
      }
      
      console.log('All WordsAPI approaches failed');
      return null;
    } catch (error) {
      console.error('Error in getRandomUncommonWordFromAPI:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw new Error(`Failed to fetch from WordsAPI: ${error.message}`);
    }
  }

  /**
   * Get the total number of words in the dictionary
   * @returns {number} The number of words (only meaningful in test environment)
   */
  size() {
    if (this.useLocalFallback) {
      return this.wordArray.length;
    } else {
      // In production using WordsAPI, return a representative number
      return 5000; // Approximate number of 5-letter words available via WordsAPI
    }
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

// ES6 export for modern bundlers
export default Dictionary;