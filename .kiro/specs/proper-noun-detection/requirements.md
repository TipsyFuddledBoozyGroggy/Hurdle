# Requirements Document

## Introduction

Enhance the Hurdle word game's proper noun detection system to more accurately exclude proper nouns (names, places, brands) from being selected as target words, improving game fairness and user experience.

## Glossary

- **Dictionary**: The word management system that validates and selects words for the game
- **WordsAPI**: External API service that provides word definitions and linguistic information
- **Proper_Noun**: A name used for an individual person, place, or organization (e.g., "SMITH", "PARIS", "APPLE")
- **Pattern_Analyzer**: Component that uses linguistic rules to identify proper noun patterns
- **API_Checker**: Component that queries WordsAPI for parts of speech information
- **Target_Word**: The word that players must guess in each game round

## Requirements

### Requirement 1: API-Based Proper Noun Detection

**User Story:** As a player, I want the game to use accurate linguistic data to exclude proper nouns, so that I only encounter common English words as targets.

#### Acceptance Criteria

1. WHEN checking if a word is a proper noun, THE API_Checker SHALL query WordsAPI for parts of speech information
2. WHEN WordsAPI returns parts of speech data, THE API_Checker SHALL identify words marked as "proper noun" or "noun, proper"
3. WHEN the API request fails or times out, THE API_Checker SHALL return null to allow fallback methods
4. WHEN API rate limits are exceeded, THE API_Checker SHALL gracefully degrade to pattern analysis only
5. THE API_Checker SHALL cache results for 24 hours to minimize redundant API calls

### Requirement 2: Linguistic Pattern Analysis

**User Story:** As a system administrator, I want the game to use linguistic patterns to identify proper nouns offline, so that proper noun detection works even when the API is unavailable.

#### Acceptance Criteria

1. THE Pattern_Analyzer SHALL identify words with common proper noun suffixes (-son, -berg, -stein, -ton, -ford, -burg, -land, -wood)
2. THE Pattern_Analyzer SHALL identify words with common proper noun prefixes (Mc-, Mac-, O'-, De-, Van-, Von-)
3. THE Pattern_Analyzer SHALL identify words that are common first names (JAMES, SARAH, DAVID, MARIA, etc.)
4. THE Pattern_Analyzer SHALL identify words that are common place names (PARIS, TOKYO, CHINA, TEXAS, etc.)
5. THE Pattern_Analyzer SHALL identify words that are common brand names (APPLE, HONDA, NOKIA, ADOBE, etc.)
6. THE Pattern_Analyzer SHALL use case-insensitive matching for all pattern checks

### Requirement 3: Hybrid Detection System

**User Story:** As a developer, I want the proper noun detection to combine multiple methods, so that we achieve maximum accuracy while maintaining performance.

#### Acceptance Criteria

1. WHEN detecting proper nouns, THE Dictionary SHALL first attempt API-based detection
2. IF API detection is unavailable or inconclusive, THE Dictionary SHALL use pattern analysis as fallback
3. WHEN both methods disagree, THE Dictionary SHALL err on the side of exclusion (treat as proper noun)
4. THE Dictionary SHALL log detection method used for monitoring and debugging
5. THE Dictionary SHALL maintain detection accuracy metrics for performance monitoring

### Requirement 4: Performance and Caching

**User Story:** As a player, I want proper noun detection to be fast and not slow down the game, so that my gameplay experience remains smooth.

#### Acceptance Criteria

1. THE Dictionary SHALL cache proper noun detection results in memory for the session
2. THE Dictionary SHALL implement a maximum 2-second timeout for API requests
3. WHEN API requests exceed timeout, THE Dictionary SHALL immediately fall back to pattern analysis
4. THE Dictionary SHALL batch API requests when possible to reduce total request count
5. THE Dictionary SHALL prioritize pattern analysis for words that clearly match known patterns

### Requirement 5: Comprehensive Pattern Database

**User Story:** As a game designer, I want the pattern analysis to cover a wide range of proper noun types, so that players encounter only appropriate common words.

#### Acceptance Criteria

1. THE Pattern_Analyzer SHALL maintain a database of at least 100 common first names
2. THE Pattern_Analyzer SHALL maintain a database of at least 50 common place names
3. THE Pattern_Analyzer SHALL maintain a database of at least 30 common brand names
4. THE Pattern_Analyzer SHALL support adding new patterns without code changes
5. THE Pattern_Analyzer SHALL validate pattern databases on initialization

### Requirement 6: Error Handling and Fallback

**User Story:** As a system administrator, I want proper noun detection to handle errors gracefully, so that the game continues working even when external services fail.

#### Acceptance Criteria

1. WHEN WordsAPI is completely unavailable, THE Dictionary SHALL use pattern analysis exclusively
2. WHEN pattern analysis fails, THE Dictionary SHALL fall back to the current capitalization check
3. WHEN all detection methods fail, THE Dictionary SHALL allow the word but log the failure
4. THE Dictionary SHALL provide clear error messages for debugging detection issues
5. THE Dictionary SHALL maintain service availability metrics for monitoring