# WordsAPI Integration Improvements - Requirements Document

## Introduction

This specification addresses critical improvements to the WordsAPI integration in Hard Wordle to ensure reliable word validation and proper API usage tracking. The current implementation has issues with invalid word filtering and incomplete request tracking across environments.

## Current Issues

1. **Invalid Words**: WordsAPI returns non-alphabetic words like "1890S" due to malformed request parameters
2. **Incomplete Tracking**: API requests are only tracked in production, not during local development
3. **Poor User Experience**: Users aren't properly notified when API limits are reached

## Glossary

- **WordsAPI**: External API service providing word validation and random word generation
- **API Request Tracking**: System to monitor and limit API usage to stay within monthly quotas
- **Letter-Only Words**: Words containing only alphabetic characters (a-z, A-Z), no numbers or symbols
- **Monthly Limit**: 2500 API requests per month allowed by WordsAPI subscription
- **Cross-Environment Tracking**: Unified tracking system that works in both development and production
- **Graceful Degradation**: System behavior when API limits are exceeded, falling back to local dictionary

## Requirements

### Requirement 1: Fix WordsAPI Word Filtering and Definition Validation

**User Story:** As a player, I want to only receive valid alphabetic words with definitions from the game, so that I don't encounter invalid words like "1890S" or words without definitions.

#### Acceptance Criteria

1. WHEN requesting random words from WordsAPI, THEN the system SHALL use proper letter-pattern filtering to ensure only alphabetic characters
2. WHEN WordsAPI returns a word, THEN the system SHALL validate that the word contains only letters (a-z, A-Z) before accepting it
3. WHEN WordsAPI returns a word, THEN the system SHALL verify that the word has at least one definition available in WordsAPI
4. WHEN a word lacks definitions, THEN the system SHALL reject it and either retry or fall back to local dictionary
5. WHEN an invalid word is received from WordsAPI, THEN the system SHALL reject it and either retry or fall back to local dictionary
6. WHEN making WordsAPI requests, THEN the system SHALL use the correct URL format with proper parameter encoding
7. THE system SHALL never present words containing numbers, symbols, or special characters to players
8. THE system SHALL only present words that have definitions available for display after game completion

### Requirement 2: Header-Based API Request Tracking

**User Story:** As a system administrator, I want to use WordsAPI's rate limit headers to track usage, so that I have accurate real-time information about remaining requests.

#### Acceptance Criteria

1. WHEN any WordsAPI request is made, THEN the system SHALL extract the `x-ratelimit-requests-remaining` header from the response
2. WHEN rate limit headers are received, THEN the system SHALL update its internal state with the current remaining request count
3. WHEN rate limit headers are unavailable, THEN the system SHALL fall back to conservative usage patterns
4. WHEN the `x-ratelimit-requests-remaining` header shows 0, THEN the system SHALL immediately switch to local dictionary mode
5. THE system SHALL use header information as the authoritative source for rate limit decisions

### Requirement 3: Real-Time Usage Monitoring

**User Story:** As a developer, I want real-time visibility into remaining API requests, so that I can make informed decisions about API usage.

#### Acceptance Criteria

1. WHEN making API requests, THEN the system SHALL display current remaining request count from headers
2. WHEN rate limit information changes, THEN the system SHALL immediately update its usage calculations
3. WHEN headers indicate low remaining requests, THEN the system SHALL prioritize essential API calls
4. WHEN rate limit resets occur, THEN the system SHALL automatically detect and adapt to the new limits
5. THE system SHALL provide accurate usage information without manual tracking or storage complexity

### Requirement 4: Header-Based Limit Management

**User Story:** As a user, I want to be notified about API usage based on real-time data, so that I understand the current status accurately.

#### Acceptance Criteria

1. WHEN remaining requests drop below 625 (75% used), THEN the system SHALL log an informational message
2. WHEN remaining requests drop below 250 (90% used), THEN the system SHALL display a warning to users
3. WHEN remaining requests reach 0, THEN the system SHALL notify users that local dictionary mode is active
4. WHEN rate limit headers are received, THEN the system SHALL provide real-time usage percentages
5. THE system SHALL base all notifications on actual header values rather than estimated counts

### Requirement 5: Enhanced Error Handling

**User Story:** As a player, I want the game to work reliably even when external services fail, so that I can always play the game.

#### Acceptance Criteria

1. WHEN WordsAPI is unavailable, THEN the system SHALL seamlessly fall back to local dictionary validation
2. WHEN API requests fail, THEN the system SHALL not display error messages to end users
3. WHEN network issues occur, THEN the system SHALL continue functioning with local word validation
4. WHEN API key issues arise, THEN the system SHALL gracefully degrade to local-only mode
5. THE system SHALL never crash or become unusable due to external API failures

### Requirement 6: Simplified Request Management

**User Story:** As a system administrator, I want to eliminate complex tracking systems, so that rate limiting is reliable and maintenance-free.

#### Acceptance Criteria

1. WHEN using header-based tracking, THEN the system SHALL eliminate file-based request counting
2. WHEN API responses include rate limit headers, THEN the system SHALL use them as the single source of truth
3. WHEN headers are unavailable, THEN the system SHALL default to conservative local dictionary usage
4. WHEN implementing rate limiting, THEN the system SHALL avoid cross-environment synchronization complexity
5. THE system SHALL operate statelessly using only header information for rate limit decisions

### Requirement 7: Header-Based Analytics

**User Story:** As a developer, I want usage statistics derived from API headers, so that I have accurate real-time information without complex tracking.

#### Acceptance Criteria

1. WHEN checking usage statistics, THEN the system SHALL provide remaining requests from the latest header response
2. WHEN displaying usage information, THEN the system SHALL show percentage used based on header limit values
3. WHEN rate limit information is requested, THEN the system SHALL include timestamps of last header update
4. WHEN headers provide reset time, THEN the system SHALL display when limits will refresh
5. THE system SHALL derive all analytics from header data rather than maintaining separate counters

## Technical Constraints

1. **API Limit**: Maximum 2500 requests per month across all environments
2. **Definition Validation Cost**: Each word requires 2 API requests (search + definition check)
3. **Effective Word Limit**: ~1250 words per month due to definition validation
4. **Response Time**: WordsAPI requests must not block game functionality for more than 5 seconds total
5. **Fallback Requirement**: Local dictionary must always be available as backup
6. **Cross-Platform**: Tracking must work in both Node.js and browser environments
7. **Data Persistence**: Usage data must survive application restarts and deployments

## Success Criteria

1. Zero invalid words (containing numbers/symbols) presented to players
2. 100% of API requests tracked across all environments
3. Graceful degradation when API limits exceeded
4. Clear user communication about API status
5. Reliable game functionality regardless of external API availability

## Out of Scope

1. Increasing the WordsAPI monthly limit (requires subscription upgrade)
2. Alternative word validation APIs (focus on optimizing current WordsAPI usage)
3. Offline word generation (beyond existing local dictionary)
4. Real-time usage synchronization across multiple instances