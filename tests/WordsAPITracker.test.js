/**
 * Tests for WordsAPITracker - Header-Priority Architecture
 */

const WordsAPITracker = require('../src/WordsAPITracker');

describe('WordsAPITracker - Header-Priority Architecture', () => {
  let tracker;

  beforeEach(() => {
    tracker = new WordsAPITracker();
  });

  describe('Header-Priority Logic', () => {
    test('should prioritize header data over storage when available', () => {
      // Mock response with headers
      const mockResponse = {
        headers: {
          get: jest.fn((headerName) => {
            switch (headerName) {
              case 'x-ratelimit-requests-remaining':
                return '1500';
              case 'x-ratelimit-requests-limit':
                return '2500';
              case 'x-ratelimit-requests-reset':
                return '1640995200';
              default:
                return null;
            }
          })
        }
      };

      // Update from headers
      const rateLimitInfo = tracker.updateFromHeaders(mockResponse);
      
      expect(rateLimitInfo).not.toBeNull();
      expect(rateLimitInfo.remaining).toBe(1500);
      expect(rateLimitInfo.limit).toBe(2500);
      
      // Verify header-based tracking is now active
      expect(tracker.hasReliableHeaderData()).toBe(true);
      expect(tracker.getCurrentTrackingMode()).toBe('headers');
    });

    test('should fall back to storage when headers unavailable', () => {
      // Mock response without headers
      const mockResponse = {
        headers: {
          get: jest.fn(() => null)
        }
      };

      // Try to update from headers (should fail)
      const rateLimitInfo = tracker.updateFromHeaders(mockResponse);
      
      expect(rateLimitInfo).toBeNull();
      expect(tracker.hasReliableHeaderData()).toBe(false);
      expect(tracker.getCurrentTrackingMode()).toBe('storage');
    });

    test('shouldUseAPI should prioritize header data', () => {
      // Test with header data showing 5 remaining requests
      const mockResponse = {
        headers: {
          get: jest.fn((headerName) => {
            if (headerName === 'x-ratelimit-requests-remaining') return '5';
            if (headerName === 'x-ratelimit-requests-limit') return '2500';
            return null;
          })
        }
      };

      tracker.updateFromHeaders(mockResponse);
      expect(tracker.shouldUseAPI()).toBe(true); // 5 >= 2 requests needed

      // Test with header data showing 1 remaining request
      const mockResponseLow = {
        headers: {
          get: jest.fn((headerName) => {
            if (headerName === 'x-ratelimit-requests-remaining') return '1';
            if (headerName === 'x-ratelimit-requests-limit') return '2500';
            return null;
          })
        }
      };

      tracker.updateFromHeaders(mockResponseLow);
      expect(tracker.shouldUseAPI()).toBe(false); // 1 < 2 requests needed
    });

    test('saveUsageData should work in browser mode', () => {
      // Force browser mode for testing localStorage
      tracker.isNode = false;
      
      // Mock localStorage properly
      const mockSetItem = jest.fn();
      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: mockSetItem
        },
        writable: true
      });

      // Test saveUsageData directly
      const testData = { count: 5, month: '2024-01', lastReset: new Date().toISOString() };
      tracker.saveUsageData(testData);
      
      // Verify localStorage.setItem was called
      expect(mockSetItem).toHaveBeenCalledWith(
        'wordsapi_usage',
        JSON.stringify(testData)
      );

      // Clean up
      delete global.localStorage;
    });

    test('recordRequest should only update storage when headers unavailable', () => {
      // Force browser mode for testing localStorage
      tracker.isNode = false;
      
      // Mock localStorage properly
      const mockGetItem = jest.fn(() => JSON.stringify({
        count: 10,
        month: tracker.getCurrentMonth(),
        lastReset: new Date().toISOString()
      }));
      const mockSetItem = jest.fn();
      
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: mockGetItem,
          setItem: mockSetItem
        },
        writable: true
      });

      // Ensure no header data is present
      expect(tracker.lastKnownRemaining).toBeNull();
      expect(tracker.hasReliableHeaderData()).toBe(false);
      
      // Test recordRequest without headers - should update storage
      const storageResult = tracker.recordRequest();
      
      // Verify localStorage.setItem was called
      expect(mockSetItem).toHaveBeenCalled();
      expect(storageResult.count).toBe(11); // Should increment from 10 to 11

      // Now test with headers available - should NOT update storage
      const mockResponse = {
        headers: {
          get: jest.fn((headerName) => {
            if (headerName === 'x-ratelimit-requests-remaining') return '1500';
            if (headerName === 'x-ratelimit-requests-limit') return '2500';
            return null;
          })
        }
      };

      tracker.updateFromHeaders(mockResponse);
      mockSetItem.mockClear(); // Clear previous calls
      
      const headerResult = tracker.recordRequest();
      
      // Should return header-based stats, not update storage
      expect(headerResult.source).toBe('headers');
      expect(mockSetItem).not.toHaveBeenCalled();

      // Clean up
      delete global.localStorage;
    });

    test('getHeaderBasedStats should indicate reliability', () => {
      // Test with header data (reliable)
      const mockResponse = {
        headers: {
          get: jest.fn((headerName) => {
            if (headerName === 'x-ratelimit-requests-remaining') return '1500';
            if (headerName === 'x-ratelimit-requests-limit') return '2500';
            return null;
          })
        }
      };

      tracker.updateFromHeaders(mockResponse);
      const headerStats = tracker.getHeaderBasedStats();
      
      expect(headerStats.reliable).toBe(true);
      expect(headerStats.source).toBe('headers');

      // Test without header data (unreliable)
      tracker.lastKnownRemaining = null; // Clear header data
      const storageStats = tracker.getHeaderBasedStats();
      
      expect(storageStats.reliable).toBe(false);
      expect(storageStats.source).toBe('storage');
    });

    test('getUsageMessage should include reliability indicator', () => {
      // Test with unreliable storage data
      const message = tracker.getUsageMessage();
      expect(message).toContain('(estimated)');

      // Test with reliable header data
      const mockResponse = {
        headers: {
          get: jest.fn((headerName) => {
            if (headerName === 'x-ratelimit-requests-remaining') return '1500';
            if (headerName === 'x-ratelimit-requests-limit') return '2500';
            return null;
          })
        }
      };

      tracker.updateFromHeaders(mockResponse);
      const reliableMessage = tracker.getUsageMessage();
      expect(reliableMessage).not.toContain('(estimated)');
    });
  });
});