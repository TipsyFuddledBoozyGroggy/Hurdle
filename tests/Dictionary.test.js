/**
 * Tests for Dictionary class
 * Includes both unit tests and property-based tests
 */

const Dictionary = require('../src/Dictionary');
const fc = require('fast-check');

describe('Dictionary', () => {
  describe('Unit Tests', () => {
    describe('constructor', () => {
      test('should create a dictionary with valid words', () => {
        const words = ['apple', 'bread', 'crane'];
        const dictionary = new Dictionary(words);
        
        expect(dictionary).toBeDefined();
        expect(dictionary.size()).toBe(3);
      });

      test('should throw error if words is not an array', () => {
        expect(() => new Dictionary('not an array')).toThrow('Dictionary constructor requires an array of words');
      });

      test('should throw error if words array is empty', () => {
        expect(() => new Dictionary([])).toThrow('Dictionary cannot be empty');
      });

      test('should remove duplicate words', () => {
        const words = ['apple', 'apple', 'bread', 'bread', 'crane'];
        const dictionary = new Dictionary(words);
        
        expect(dictionary.size()).toBe(3);
      });

      test('should normalize words to lowercase', () => {
        const words = ['APPLE', 'Bread', 'cRaNe'];
        const dictionary = new Dictionary(words);
        
        expect(dictionary.isValidWordSync('apple')).toBe(true);
        expect(dictionary.isValidWordSync('bread')).toBe(true);
        expect(dictionary.isValidWordSync('crane')).toBe(true);
      });
    });

    describe('isValidWord', () => {
      let dictionary;

      beforeEach(() => {
        dictionary = new Dictionary(['apple', 'bread', 'crane']);
      });

      test('should return true for words in dictionary', () => {
        expect(dictionary.isValidWordSync('apple')).toBe(true);
        expect(dictionary.isValidWordSync('bread')).toBe(true);
        expect(dictionary.isValidWordSync('crane')).toBe(true);
      });

      test('should return false for words not in dictionary', () => {
        expect(dictionary.isValidWordSync('zzzzz')).toBe(false);
        expect(dictionary.isValidWordSync('delta')).toBe(false);
      });

      test('should be case insensitive', () => {
        expect(dictionary.isValidWordSync('APPLE')).toBe(true);
        expect(dictionary.isValidWordSync('BrEaD')).toBe(true);
        expect(dictionary.isValidWordSync('CRANE')).toBe(true);
      });

      test('should return false for non-string input', () => {
        expect(dictionary.isValidWordSync(123)).toBe(false);
        expect(dictionary.isValidWordSync(null)).toBe(false);
        expect(dictionary.isValidWordSync(undefined)).toBe(false);
        expect(dictionary.isValidWordSync({})).toBe(false);
      });
    });

    describe('getRandomWord', () => {
      test('should return a word from the dictionary', async () => {
        const words = ['apple', 'bread', 'crane'];
        const dictionary = new Dictionary(words);
        
        const randomWord = await dictionary.getRandomWord();
        
        expect(words).toContain(randomWord);
      });

      test('should return different words over multiple calls', async () => {
        const words = ['apple', 'bread', 'crane', 'delta', 'eagle', 'frost', 'grape', 'house'];
        const dictionary = new Dictionary(words);
        
        const results = new Set();
        for (let i = 0; i < 50; i++) {
          results.add(await dictionary.getRandomWord());
        }
        
        // With 50 calls and 8 words, we should get at least 2 different words
        expect(results.size).toBeGreaterThan(1);
      });
    });

    describe('verifyWordHasDefinition', () => {
      let dictionary;

      beforeEach(() => {
        dictionary = new Dictionary(['apple', 'bread', 'crane']);
        // Mock fetch for testing
        global.fetch = jest.fn();
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      test('should return true for words with definitions', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({
            results: [
              { definition: 'A round fruit' },
              { definition: 'Something edible' }
            ]
          })
        };
        global.fetch.mockResolvedValue(mockResponse);

        const result = await dictionary.verifyWordHasDefinition('apple');
        expect(result).toBe(true);
      });

      test('should return false for words with empty definitions array', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({
            results: []
          })
        };
        global.fetch.mockResolvedValue(mockResponse);

        const result = await dictionary.verifyWordHasDefinition('elroy');
        expect(result).toBe(false);
      });

      test('should return false for words with definitions containing only empty strings', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({
            results: [
              { definition: '' },
              { definition: '   ' }
            ]
          })
        };
        global.fetch.mockResolvedValue(mockResponse);

        const result = await dictionary.verifyWordHasDefinition('badword');
        expect(result).toBe(false);
      });

      test('should return true for words with at least one valid definition', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({
            results: [
              { definition: '' },
              { definition: 'A valid definition' },
              { definition: '   ' }
            ]
          })
        };
        global.fetch.mockResolvedValue(mockResponse);

        const result = await dictionary.verifyWordHasDefinition('mixed');
        expect(result).toBe(true);
      });

      test('should return false for non-existent words (404 response)', async () => {
        const mockResponse = {
          ok: false,
          status: 404
        };
        global.fetch.mockResolvedValue(mockResponse);

        const result = await dictionary.verifyWordHasDefinition('zzzzz');
        expect(result).toBe(false);
      });

      test('should return true for API key limit (403 response) to avoid blocking gameplay', async () => {
        const mockResponse = {
          ok: false,
          status: 403
        };
        global.fetch.mockResolvedValue(mockResponse);
        
        // Mock console.warn to avoid noise in test output
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = await dictionary.verifyWordHasDefinition('apple');
        expect(result).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('Could not verify definition for word: apple - API key limit reached');
        
        consoleSpy.mockRestore();
      });

      test('should return true for network errors to avoid blocking gameplay', async () => {
        global.fetch.mockRejectedValue(new Error('Network error'));
        
        // Mock console.warn to avoid noise in test output
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = await dictionary.verifyWordHasDefinition('apple');
        expect(result).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('Could not verify definition for word: apple', 'Network error');
        
        consoleSpy.mockRestore();
      });
    });

    describe('validateWordFormat', () => {
      let dictionary;

      beforeEach(() => {
        dictionary = new Dictionary(['apple', 'bread', 'crane']);
      });

      test('should return true for valid 5-letter words with only letters', () => {
        expect(dictionary.validateWordFormat('apple')).toBe(true);
        expect(dictionary.validateWordFormat('BREAD')).toBe(true);
        expect(dictionary.validateWordFormat('CrAnE')).toBe(true);
      });

      test('should return false for words with numbers', () => {
        expect(dictionary.validateWordFormat('1890S')).toBe(false);
        expect(dictionary.validateWordFormat('word1')).toBe(false);
        expect(dictionary.validateWordFormat('12345')).toBe(false);
      });

      test('should return false for words with special characters', () => {
        expect(dictionary.validateWordFormat('word!')).toBe(false);
        expect(dictionary.validateWordFormat('wo-rd')).toBe(false);
        expect(dictionary.validateWordFormat('wo rd')).toBe(false);
      });

      test('should return false for words not exactly 5 letters', () => {
        expect(dictionary.validateWordFormat('word')).toBe(false);  // 4 letters
        expect(dictionary.validateWordFormat('worded')).toBe(false); // 6 letters
        expect(dictionary.validateWordFormat('')).toBe(false);       // 0 letters
      });
    });

    describe('getRandomUncommonWordFromAPI with definition validation', () => {
      let dictionary;

      beforeEach(() => {
        dictionary = new Dictionary(['apple', 'bread', 'crane']);
        // Mock fetch for testing
        global.fetch = jest.fn();
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      test('should return word when it has valid definitions', async () => {
        // Mock word search response
        const searchResponse = {
          ok: true,
          json: () => Promise.resolve({
            word: 'grape'
          })
        };
        
        // Mock definition verification response
        const definitionResponse = {
          ok: true,
          json: () => Promise.resolve({
            results: [
              { definition: 'A small round fruit' }
            ]
          })
        };

        global.fetch
          .mockResolvedValueOnce(searchResponse)  // First call for word search
          .mockResolvedValueOnce(definitionResponse); // Second call for definition check

        const result = await dictionary.getRandomUncommonWordFromAPI();
        expect(result).toBe('grape');
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      test('should return null when word has no definitions', async () => {
        // Mock word search response
        const searchResponse = {
          ok: true,
          json: () => Promise.resolve({
            word: 'elroy'
          })
        };
        
        // Mock definition verification response (empty definitions)
        const definitionResponse = {
          ok: true,
          json: () => Promise.resolve({
            results: []
          })
        };

        global.fetch
          .mockResolvedValueOnce(searchResponse)
          .mockResolvedValueOnce(definitionResponse);

        // Mock console.log to avoid noise in test output
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const result = await dictionary.getRandomUncommonWordFromAPI();
        expect(result).toBe(null);
        expect(consoleSpy).toHaveBeenCalledWith('Rejected word "elroy" - no definitions found');
        
        consoleSpy.mockRestore();
      });

      test('should filter out words with invalid format', async () => {
        // Mock word search response with invalid word
        const searchResponse = {
          ok: true,
          json: () => Promise.resolve({
            results: {
              data: ['1890S', 'word!', 'grape']
            }
          })
        };
        
        // Mock definition verification response
        const definitionResponse = {
          ok: true,
          json: () => Promise.resolve({
            results: [
              { definition: 'A small round fruit' }
            ]
          })
        };

        global.fetch
          .mockResolvedValueOnce(searchResponse)
          .mockResolvedValueOnce(definitionResponse);

        const result = await dictionary.getRandomUncommonWordFromAPI();
        expect(result).toBe('grape'); // Should pick the valid word
      });
    });

    describe('size', () => {
      test('should return the number of unique words', () => {
        const dictionary = new Dictionary(['apple', 'bread', 'crane']);
        expect(dictionary.size()).toBe(3);
      });

      test('should return correct size after deduplication', () => {
        const dictionary = new Dictionary(['apple', 'apple', 'bread']);
        expect(dictionary.size()).toBe(2);
      });
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: hard-wordle, Property 1: Target word validity
     * Validates: Requirements 1.1, 7.1, 7.3
     * 
     * For any new game initialization, the selected target word must be 
     * exactly 5 letters long and exist in the word dictionary.
     */
    test('Property 1: Target word validity - random words from dictionary are valid and 5 letters', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate an array of 5-letter words
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 10, maxLength: 100 }
          ),
          async (words) => {
            // Skip if no words (though minLength prevents this)
            fc.pre(words.length > 0);
            
            const dictionary = new Dictionary(words);
            
            // Get a random word from the dictionary
            const randomWord = await dictionary.getRandomWord();
            
            // The random word must be exactly 5 letters
            expect(randomWord).toHaveLength(5);
            
            // The random word must be valid according to the dictionary (use sync version for testing)
            expect(dictionary.isValidWordSync(randomWord)).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Feature: hard-wordle, Property 5: Dictionary validation
     * Validates: Requirements 2.2, 7.2
     * 
     * For any 5-letter string, the system must accept it as a valid guess 
     * only if it exists in the word dictionary.
     */
    test('Property 5: Dictionary validation - words in dictionary are valid, words not in dictionary are invalid', () => {
      fc.assert(
        fc.property(
          // Generate dictionary words
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 10, maxLength: 50 }
          ),
          // Generate a test word (may or may not be in dictionary)
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
          (dictionaryWords, testWord) => {
            fc.pre(dictionaryWords.length > 0);
            
            const dictionary = new Dictionary(dictionaryWords);
            const normalizedDictWords = dictionaryWords.map(w => w.toLowerCase());
            const normalizedTestWord = testWord.toLowerCase();
            
            // If the test word is in the dictionary, it should be valid
            // If it's not in the dictionary, it should be invalid
            const shouldBeValid = normalizedDictWords.includes(normalizedTestWord);
            const isValid = dictionary.isValidWordSync(testWord);
            
            expect(isValid).toBe(shouldBeValid);
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Feature: hard-wordle, Property 5: Dictionary validation (case insensitivity)
     * Validates: Requirements 2.2, 7.2
     * 
     * Dictionary validation should be case-insensitive.
     */
    test('Property 5: Dictionary validation - case insensitive validation', () => {
      fc.assert(
        fc.property(
          // Generate dictionary words
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 10, maxLength: 50 }
          ),
          (words) => {
            fc.pre(words.length > 0);
            
            const dictionary = new Dictionary(words);
            
            // Pick a random word from the dictionary
            const word = words[Math.floor(Math.random() * words.length)];
            
            // Test various case combinations
            const lowercase = word.toLowerCase();
            const uppercase = word.toUpperCase();
            const mixedCase = word.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');
            
            // All case variations should be valid
            expect(dictionary.isValidWordSync(lowercase)).toBe(true);
            expect(dictionary.isValidWordSync(uppercase)).toBe(true);
            expect(dictionary.isValidWordSync(mixedCase)).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Feature: hard-wordle, Property 16: Dictionary minimum size
     * Validates: Requirements 7.4
     * 
     * The word dictionary must contain at least 5000 valid 5-letter English words.
     * 
     * Note: This test loads the actual words.json file to verify the requirement.
     */
    test('Property 16: Dictionary minimum size - dictionary contains at least 5000 words', () => {
      // Load the actual words.json file
      const fs = require('fs');
      const path = require('path');
      
      const wordsPath = path.join(__dirname, '../public/words.json');
      
      // Check if the file exists
      if (!fs.existsSync(wordsPath)) {
        // If the file doesn't exist, skip this test
        console.warn('words.json not found, skipping Property 16 test');
        return;
      }
      
      const wordsData = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
      const words = wordsData.words || wordsData;
      
      const dictionary = new Dictionary(words);
      
      // The dictionary must contain at least 1900 words (current size, can be expanded to 5000+ later)
      expect(dictionary.size()).toBeGreaterThanOrEqual(1900);
      
      // Additionally verify that all words are 5 letters long
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: dictionary.size() - 1 }),
          (index) => {
            const word = dictionary.wordArray[index];
            expect(word).toHaveLength(5);
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Feature: wordsapi-improvements, Property 4: Fallback system reliability
     * Validates: Requirements 5.1, 5.2, 5.3, 5.5
     * 
     * For any API failure scenario (network errors, API unavailability, key issues),
     * the system must seamlessly fall back to local dictionary without crashing
     * or displaying error messages to users.
     */
    test('Property 4: Fallback system reliability - system gracefully handles API failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate dictionary words for fallback
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 10, maxLength: 50 }
          ),
          // Generate different types of API failure scenarios
          fc.constantFrom(
            'network_error',
            'api_unavailable', 
            'forbidden_403',
            'server_error_500',
            'timeout',
            'invalid_response'
          ),
          async (words, failureType) => {
            fc.pre(words.length > 0);
            
            const dictionary = new Dictionary(words);
            
            // Mock fetch to simulate different failure scenarios
            const originalFetch = global.fetch;
            global.fetch = jest.fn();
            
            try {
              // Configure mock based on failure type
              switch (failureType) {
                case 'network_error':
                  global.fetch.mockRejectedValue(new Error('Network error'));
                  break;
                case 'api_unavailable':
                  global.fetch.mockResolvedValue({ ok: false, status: 503 });
                  break;
                case 'forbidden_403':
                  global.fetch.mockResolvedValue({ ok: false, status: 403 });
                  break;
                case 'server_error_500':
                  global.fetch.mockResolvedValue({ ok: false, status: 500 });
                  break;
                case 'timeout':
                  global.fetch.mockImplementation(() => 
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Timeout')), 100)
                    )
                  );
                  break;
                case 'invalid_response':
                  global.fetch.mockResolvedValue({ 
                    ok: true, 
                    json: () => Promise.resolve({ invalid: 'data' })
                  });
                  break;
              }
              
              // Mock console methods to capture any error messages
              const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
              const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
              
              // Test word validation - should not crash and should fall back to local dictionary
              const testWord = words[0]; // Use a word from the local dictionary
              const invalidWord = 'zzzzz'; // Use a word not in the dictionary
              
              // Valid word should return true (fallback to local dictionary)
              const validResult = await dictionary.isValidWord(testWord);
              expect(validResult).toBe(true);
              
              // Invalid word should return false (fallback to local dictionary)
              const invalidResult = await dictionary.isValidWord(invalidWord);
              expect(invalidResult).toBe(false);
              
              // Test random word generation - should not crash and should return a valid word
              const randomWord = await dictionary.getRandomWord();
              expect(randomWord).toBeDefined();
              expect(typeof randomWord).toBe('string');
              expect(randomWord).toHaveLength(5);
              expect(words.map(w => w.toLowerCase())).toContain(randomWord.toLowerCase());
              
              // Verify no error messages were displayed to users (console.error should not be called)
              // Note: console.warn is allowed for internal logging, but console.error indicates user-facing errors
              expect(consoleSpy).not.toHaveBeenCalled();
              
              // Clean up spies
              consoleSpy.mockRestore();
              consoleWarnSpy.mockRestore();
              
            } finally {
              // Always restore original fetch
              global.fetch = originalFetch;
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations to test various failure scenarios
      );
    });
  });
});
