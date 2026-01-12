const RateLimiter = require("../utils/rateLimiter");

describe("RateLimiter", () => {
  describe("Token bucket algorithm", () => {
    test("allows requests within rate limit", () => {
      const limiter = new RateLimiter(60); // 60 requests per minute

      // Should allow first request
      const result1 = limiter.acquire();
      expect(result1.allowed).toBe(true);

      // Should allow second request
      const result2 = limiter.acquire();
      expect(result2.allowed).toBe(true);
    });

    test("rate limits when tokens are exhausted", () => {
      const limiter = new RateLimiter(2); // 2 requests per minute (very low for testing)

      // Exhaust tokens
      expect(limiter.acquire().allowed).toBe(true);
      expect(limiter.acquire().allowed).toBe(true);

      // Third request should be rate limited
      const result = limiter.acquire();
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    test("refills tokens over time", (done) => {
      const limiter = new RateLimiter(60, 1); // 1 token capacity, 60 per minute = 1 per second

      // Exhaust token
      expect(limiter.acquire().allowed).toBe(true);
      expect(limiter.acquire().allowed).toBe(false);

      // Wait for token to refill (should refill in ~1 second)
      setTimeout(() => {
        const result = limiter.acquire();
        expect(result.allowed).toBe(true);
        done();
      }, 1100); // Slightly more than 1 second to account for timing
    }, 2000);

    test("getTokens returns current token count", () => {
      const limiter = new RateLimiter(60, 10); // 10 token capacity

      expect(limiter.getTokens()).toBe(10);

      limiter.acquire();
      expect(limiter.getTokens()).toBe(9);

      limiter.acquire();
      expect(limiter.getTokens()).toBe(8);
    });

    test("reset resets token bucket", () => {
      const limiter = new RateLimiter(60, 10);

      limiter.acquire();
      limiter.acquire();
      expect(limiter.getTokens()).toBe(8);

      limiter.reset();
      expect(limiter.getTokens()).toBe(10);
    });

    test("capacity defaults to rate per minute", () => {
      const limiter = new RateLimiter(60);
      expect(limiter.getTokens()).toBe(60);
    });

    test("custom capacity works correctly", () => {
      const limiter = new RateLimiter(60, 100);
      expect(limiter.getTokens()).toBe(100);
    });
  });
});

