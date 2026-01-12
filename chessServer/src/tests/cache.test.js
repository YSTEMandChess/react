const cache = require("../utils/cache");

describe("Cache Utility", () => {
  beforeEach(() => {
    cache.clear();
    cache.resetStats();
    jest.useRealTimers();
  });

  afterEach(() => {
    cache.clear();
    cache.resetStats();
    jest.useRealTimers();
  });

  describe("Basic Operations", () => {
    test("get() returns value for valid key", () => {
      cache.set("test-key", "test-value");
      expect(cache.get("test-key")).toBe("test-value");
    });

    test("get() returns null for non-existent key", () => {
      expect(cache.get("non-existent")).toBeNull();
    });

    test("set() stores value with TTL", () => {
      cache.set("key", "value", 60);
      expect(cache.get("key")).toBe("value");
    });

    test("set() uses default TTL when not specified", () => {
      cache.set("key", "value");
      expect(cache.get("key")).toBe("value");
      expect(cache.has("key")).toBe(true);
    });

    test("set() overwrites existing key with new TTL", () => {
      cache.set("key", "value1", 60);
      cache.set("key", "value2", 120);
      expect(cache.get("key")).toBe("value2");
    });

    test("has() returns true for existing, non-expired key", () => {
      cache.set("key", "value");
      expect(cache.has("key")).toBe(true);
    });

    test("has() returns false for non-existent key", () => {
      expect(cache.has("non-existent")).toBe(false);
    });

    test("clear() removes all entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.clear();
      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(false);
    });
  });

  describe("TTL and Expiration", () => {
    test("Entry expires after specified TTL", () => {
      jest.useFakeTimers();
      cache.set("key", "value", 1); // 1 second TTL
      
      expect(cache.get("key")).toBe("value");
      
      // Advance time by 1 second + 1ms
      jest.advanceTimersByTime(1001);
      
      expect(cache.get("key")).toBeNull();
      expect(cache.has("key")).toBe(false);
    });

    test("Entry is automatically removed on access after expiration", () => {
      jest.useFakeTimers();
      cache.set("key", "value", 1);
      
      jest.advanceTimersByTime(1001);
      
      const result = cache.get("key");
      expect(result).toBeNull();
      // Entry should be deleted from cache
      expect(cache.has("key")).toBe(false);
    });

    test("Entry is automatically removed on has() check after expiration", () => {
      jest.useFakeTimers();
      cache.set("key", "value", 1);
      
      jest.advanceTimersByTime(1001);
      
      const result = cache.has("key");
      expect(result).toBe(false);
      // Entry should be deleted from cache
      expect(cache.get("key")).toBeNull();
    });

    test("Different entries can have different TTLs", () => {
      jest.useFakeTimers();
      cache.set("key1", "value1", 1);
      cache.set("key2", "value2", 2);
      
      jest.advanceTimersByTime(1001);
      
      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBe("value2");
      
      jest.advanceTimersByTime(1000);
      
      expect(cache.get("key2")).toBeNull();
    });
  });

  describe("Cleanup Operations", () => {
    test("cleanup() removes all expired entries", () => {
      jest.useFakeTimers();
      cache.set("key1", "value1", 1);
      cache.set("key2", "value2", 2);
      cache.set("key3", "value3", 3);
      
      jest.advanceTimersByTime(1500);
      
      const removed = cache.cleanup();
      expect(removed).toBe(1); // Only key1 should be expired
      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(true);
      expect(cache.has("key3")).toBe(true);
    });

    test("cleanup() returns count of removed entries", () => {
      jest.useFakeTimers();
      cache.set("key1", "value1", 1);
      cache.set("key2", "value2", 1);
      
      jest.advanceTimersByTime(1001);
      
      const removed = cache.cleanup();
      expect(removed).toBe(2);
    });

    test("cleanup() does not remove non-expired entries", () => {
      cache.set("key1", "value1", 100);
      cache.set("key2", "value2", 200);
      
      const removed = cache.cleanup();
      expect(removed).toBe(0);
      expect(cache.has("key1")).toBe(true);
      expect(cache.has("key2")).toBe(true);
    });

    test("cleanup() can be called on empty cache", () => {
      const removed = cache.cleanup();
      expect(removed).toBe(0);
    });
  });
});

