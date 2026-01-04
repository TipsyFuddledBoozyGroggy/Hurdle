# WordsAPI Integration Improvements - Design Document

## Architecture Overview

The improved WordsAPI integration will consist of three main components:

1. **Enhanced Dictionary Class**: Fixed API requests with proper filtering
2. **Unified Usage Tracker**: Cross-environment request tracking
3. **Smart Fallback System**: Graceful degradation when limits exceeded

## Component Design

### 1. Enhanced Dictionary Class (`src/Dictionary.js`)

#### Current Issues
- Malformed WordsAPI URL: `letterPattern=^[a-zA-Z]{5}b7dbcbd2-1b0a-43e6-b408-0d38363a640cfrequencyMin=1`
- Missing proper parameter encoding
- Insufficient word validation

#### Proposed Changes

```javascript
// Fixed API request with proper URL encoding
async getRandomUncommonWordFromAPI() {
  const params = new URLSearchParams({
    letterPattern: '^[a-zA-Z]{5}$',  // Only letters, exactly 5 characters
    frequencyMin: '1',
    frequencyMax: '3',
    random: 'true'
  });
  
  const url = `https://wordsapiv1.p.rapidapi.com/words/?${params.toString()}`;
  // ... rest of implementation
}

// Enhanced word validation
validateWordFormat(word) {
  return /^[a-zA-Z]{5}$/.test(word);
}
```

#### Key Improvements
- Proper URL parameter encoding using `URLSearchParams`
- Strict regex validation for letters-only words
- Enhanced error handling and retry logic
- Better logging for debugging

### 2. Rate Limit Header Tracker (`src/WordsAPITracker.js`)

#### Current Issues
- Manual request counting is unreliable and can get out of sync
- Separate storage mechanisms create complexity
- No real-time visibility into actual API limits

#### Proposed Architecture - Header-Based Tracking

```javascript
class WordsAPITracker {
  constructor() {
    this.MONTHLY_LIMIT = 2500; // Fallback if headers unavailable
    this.lastKnownRemaining = null;
    this.lastHeaderUpdate = null;
    this.warningThresholds = {
      high: 250,    // Warn when < 250 remaining (90%)
      medium: 625,  // Log when < 625 remaining (75%)
    };
  }
  
  // Extract rate limit info from API response headers
  updateFromHeaders(response) {
    const remaining = response.headers.get('x-ratelimit-requests-remaining');
    const limit = response.headers.get('x-ratelimit-requests-limit');
    const reset = response.headers.get('x-ratelimit-requests-reset');
    
    if (remaining !== null) {
      this.lastKnownRemaining = parseInt(remaining);
      this.lastHeaderUpdate = new Date().toISOString();
      
      // Update monthly limit if provided
      if (limit !== null) {
        this.MONTHLY_LIMIT = parseInt(limit);
      }
      
      return {
        remaining: this.lastKnownRemaining,
        limit: this.MONTHLY_LIMIT,
        reset: reset,
        updated: this.lastHeaderUpdate
      };
    }
    
    return null;
  }
}
```

#### Header-Based Strategy Benefits

**Real-Time Accuracy**
- Uses actual remaining count from WordsAPI
- No risk of local tracking getting out of sync
- Handles API resets automatically

**Simplified Architecture**
- No complex storage strategies needed
- No cross-environment synchronization issues
- Stateless operation (headers are source of truth)

**Better User Experience**
- Accurate remaining request counts
- Real-time limit notifications
- Automatic handling of limit resets

### 3. Smart Fallback System

#### Decision Tree

```
API Request Needed
├── Check Monthly Limit
│   ├── Under 75% → Make API Request
│   ├── 75-90% → Make Request + Log Warning
│   ├── 90-99% → Make Request + Show User Warning
│   └── 100%+ → Skip API, Use Local Dictionary
├── API Request Failed
│   ├── Network Error → Retry with Backoff
│   ├── 403 Forbidden → Disable API for Session
│   └── Other Error → Log and Use Local Dictionary
└── API Response Received
    ├── Valid Word → Use API Word
    ├── Invalid Word → Reject and Retry (max 3 times)
    └── No Valid Words → Use Local Dictionary
```

#### Implementation Strategy

```javascript
class SmartWordProvider {
  async getWord() {
    // Check if we should use API based on last known remaining count
    if (!this.shouldUseAPI()) {
      return this.getLocalWord();
    }
    
    // Try API with header-based tracking
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await this.makeAPIRequest();
        
        // Update rate limit info from headers
        const rateLimitInfo = this.apiTracker.updateFromHeaders(response);
        if (rateLimitInfo) {
          this.checkRateLimitThresholds(rateLimitInfo);
        }
        
        if (response.ok) {
          const data = await response.json();
          const word = this.extractValidWord(data);
          if (word) return word;
        }
      } catch (error) {
        if (attempt === 3) break;
        await this.delay(attempt * 1000); // Exponential backoff
      }
    }
    
    // Fallback to local dictionary
    return this.getLocalWord();
  }
  
  shouldUseAPI() {
    // Use headers if available, otherwise fallback to conservative approach
    if (this.apiTracker.lastKnownRemaining !== null) {
      return this.apiTracker.lastKnownRemaining > 0;
    }
    
    // Conservative fallback - assume we can make requests
    return true;
  }
  
  checkRateLimitThresholds(rateLimitInfo) {
    const { remaining, limit } = rateLimitInfo;
    const percentage = (remaining / limit) * 100;
    
    if (remaining === 0) {
      console.warn(`⚠️ WordsAPI limit reached! No requests remaining until reset.`);
      this.showUserNotification('API limit reached - using local dictionary');
    } else if (remaining <= this.apiTracker.warningThresholds.high) {
      console.warn(`⚠️ WordsAPI usage high: ${remaining} requests remaining (${percentage.toFixed(1)}%)`);
    } else if (remaining <= this.apiTracker.warningThresholds.medium) {
      console.log(`📊 WordsAPI usage: ${remaining} requests remaining (${percentage.toFixed(1)}%)`);
    }
  }
}
```

## Data Flow

### Request Tracking Flow (Header-Based)

```
1. API Request Initiated
   ↓
2. Make API Call to WordsAPI
   ↓
3. Extract Rate Limit Headers
   ├── x-ratelimit-requests-remaining
   ├── x-ratelimit-requests-limit  
   └── x-ratelimit-requests-reset
   ↓
4. Update Local Rate Limit State
   ↓
5. Check Notification Thresholds
   ├── 0 remaining → Block future requests
   ├── < 250 remaining → Show warning
   └── < 625 remaining → Log info
   ↓
6. Return Result or Fallback
```

### Header-Based Advantages

```
Traditional Tracking          Header-Based Tracking
       ↓                             ↓
Manual Count Increment  →  Real-Time API Headers
       ↓                             ↓
Storage Synchronization →  Stateless Operation
       ↓                             ↓
Cross-Environment Issues →  Always Accurate
       ↓                             ↓
Potential Drift         →  Self-Correcting
```

## User Experience Design

### Notification System (Header-Based)

**High Usage (< 250 remaining / 90% used)**
```
Console: "⚠️ WordsAPI usage high: 247 requests remaining (9.9%)"
UI: Subtle indicator in game interface
```

**Critical Usage (< 100 remaining / 96% used)**
```
Console: "🚨 WordsAPI usage critical: 87 requests remaining (3.5%)"
UI: Prominent warning about impending limit
```

**Limit Reached (0 remaining)**
```
Console: "⚠️ WordsAPI limit reached! No requests remaining until reset. The game will use the local dictionary."
UI: Clear message to user about local dictionary mode
```

### Graceful Degradation (Header-Aware)

**Headers Available + Requests Remaining**
- Full WordsAPI integration
- Real-time limit monitoring
- Accurate usage notifications

**Headers Available + No Requests Remaining**
- Immediate fallback to local dictionary
- Clear user communication
- Automatic retry after reset period

**Headers Unavailable**
- Conservative API usage
- Local dictionary preference
- Fallback to manual tracking if needed

## Implementation Plan

### Phase 1: Fix WordsAPI Requests
1. Fix malformed URL parameters
2. Add proper word format validation
3. Implement retry logic with exponential backoff
4. Add comprehensive error handling

### Phase 2: Header-Based Rate Limiting
1. Implement header extraction from API responses
2. Create real-time rate limit monitoring
3. Add threshold-based user notifications
4. Remove complex storage tracking system

### Phase 3: Smart Fallback System
1. Implement header-based usage threshold checking
2. Add dynamic user notification system
3. Create graceful degradation logic based on remaining requests
4. Add performance monitoring

### Phase 4: Testing and Optimization
1. Comprehensive unit tests for all components
2. Integration tests for cross-environment scenarios
3. Performance testing for API response times
4. User acceptance testing for notification system

## Configuration

### Environment Variables
```bash
# Optional: Override default monthly limit
WORDSAPI_MONTHLY_LIMIT=2500

# Optional: Enable debug logging
WORDSAPI_DEBUG=true

# Optional: Custom usage file location
WORDSAPI_USAGE_FILE=.wordsapi-usage.json
```

### Feature Flags
```javascript
const config = {
  enableAPITracking: true,
  enableCrossEnvironmentSync: true,
  enableUserNotifications: true,
  enableSmartFallback: true,
  maxRetries: 3,
  retryDelayMs: 1000
};
```

## Monitoring and Analytics

### Key Metrics
- Total API requests per month
- Request success/failure rates
- Average response times
- Fallback usage frequency
- User notification trigger rates

### Logging Strategy
```javascript
// Usage milestones
console.log("WordsAPI: 500 requests used this month");
console.log("WordsAPI: 1000 requests used this month");

// Performance metrics
console.log("WordsAPI response time: 245ms");

// Error tracking
console.warn("WordsAPI request failed, using fallback");
console.error("WordsAPI: All storage strategies failed");
```

## Security Considerations

1. **API Key Protection**: Ensure API keys are not exposed in client-side code
2. **Rate Limiting**: Implement client-side rate limiting to prevent abuse
3. **Input Validation**: Validate all API responses before using
4. **Error Information**: Don't expose sensitive error details to users
5. **Storage Security**: Ensure usage tracking files have appropriate permissions

## Performance Considerations

1. **Response Caching**: Cache API responses to reduce duplicate requests
2. **Lazy Loading**: Only initialize tracking when API is actually used
3. **Async Operations**: All API operations must be non-blocking
4. **Memory Management**: Clean up unused cached data periodically
5. **Network Optimization**: Use connection pooling and keep-alive headers