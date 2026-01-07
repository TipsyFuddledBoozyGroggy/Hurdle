# WordsAPI Key Setup Instructions

## The Issue
The current API key in the code is a placeholder and invalid. You need to get your own free WordsAPI key.

## Steps to Fix:

### 1. Get Your Free WordsAPI Key
1. Go to: https://rapidapi.com/dpventures/api/wordsapi
2. Sign up for a free RapidAPI account
3. Subscribe to WordsAPI (free tier available)
4. Copy your X-RapidAPI-Key from the dashboard

### 2. Update the Configuration
Open `src/config.js` and replace `YOUR_WORDS_API_KEY_HERE` with your actual API key:

```javascript
// Replace this line:
API_KEY: process.env.WORDS_API_KEY || 'YOUR_WORDS_API_KEY_HERE',

// With your actual key:
API_KEY: process.env.WORDS_API_KEY || 'your-actual-api-key-here',
```

### 3. Alternative: Use Environment Variable (Recommended)
Instead of hardcoding the key, set an environment variable:

**For development:**
Create a `.env.local` file in the project root:
```
WORDS_API_KEY=your-actual-api-key-here
```

**For production:**
Set the `WORDS_API_KEY` environment variable in your deployment platform.

## Files Updated
The following files now use the centralized configuration:
- ✅ `src/Dictionary.js` - All WordsAPI calls
- ✅ `src/App.vue` - Word definition fetching
- ✅ `src/config.js` - Centralized API key management

## What This Fixes
- ❌ "Invalid API key" errors
- ❌ "WordsAPI is not available" errors  
- ✅ Random word generation from WordsAPI
- ✅ Word validation using WordsAPI
- ✅ Word definitions after game completion

## Free Tier Limits
WordsAPI free tier includes:
- 2,500 requests per month
- Rate limiting may apply
- Perfect for development and moderate usage

Once you update the API key, the game should work perfectly with WordsAPI integration!