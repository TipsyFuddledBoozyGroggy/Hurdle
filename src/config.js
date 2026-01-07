/**
 * Configuration module for Hurdle
 * Manages API keys and environment-specific settings
 */

// WordsAPI configuration
export const WORDS_API_CONFIG = {
  // Your WordsAPI key from RapidAPI
  API_KEY: 'e31ec18bc2mshcaa71bab98451fdp1490f9jsncceac7ee395b',
  HOST: 'wordsapiv1.p.rapidapi.com',
  BASE_URL: 'https://wordsapiv1.p.rapidapi.com'
};

// Validate API key - remove warning since we have a valid key
console.log('✅ WordsAPI configured and ready');

export default {
  WORDS_API_CONFIG
};