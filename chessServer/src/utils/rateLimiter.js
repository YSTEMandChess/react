// chessServer/src/utils/rateLimiter.js
// Responsibility: Token bucket rate limiter
// Implements token bucket algorithm for rate limiting API calls

/**
 * Token bucket rate limiter
 * Refills tokens at a constant rate (tokens per second)
 * Each request consumes 1 token
 */
class RateLimiter {
  constructor(ratePerMinute = 60, capacity = null) {
    // Rate in tokens per second
    this.ratePerSecond = ratePerMinute / 60;
    
    // Capacity defaults to rate per minute (allows burst of up to 1 minute)
    this.capacity = capacity !== null ? capacity : ratePerMinute;
    
    // Current token count
    this.tokens = this.capacity;
    
    // Last refill timestamp
    this.lastRefill = Date.now();
  }

  /**
   * Refills tokens based on elapsed time
   * @private
   */
  _refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // Convert to seconds
    
    if (elapsed > 0) {
      // Add tokens based on rate
      this.tokens = Math.min(
        this.capacity,
        this.tokens + (elapsed * this.ratePerSecond)
      );
      this.lastRefill = now;
    }
  }

  /**
   * Attempts to acquire a token
   * @returns {Object} { allowed: boolean, retryAfter?: number }
   */
  acquire() {
    this._refill();
    
    if (this.tokens >= 1) {
      // Token available, consume it
      this.tokens -= 1;
      return { allowed: true };
    }
    
    // No token available, calculate retry after
    const tokensNeeded = 1;
    const secondsToWait = tokensNeeded / this.ratePerSecond;
    const retryAfter = Math.ceil(secondsToWait * 1000); // Convert to milliseconds
    
    return {
      allowed: false,
      retryAfter,
    };
  }

  /**
   * Gets current token count (for debugging/monitoring)
   * @returns {number} Current token count
   */
  getTokens() {
    this._refill();
    return this.tokens;
  }

  /**
   * Resets the rate limiter (for testing)
   */
  reset() {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
}

module.exports = RateLimiter;

