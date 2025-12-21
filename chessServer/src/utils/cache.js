// chessServer/src/utils/cache.js
// Responsibility: Simple caching layer with TTL support
// Cache key format: analysis:${fenAfter}:${moveUci}:depth${depth}:movetime${movetime}:multipv${multipv}

const cache = new Map(); // Stores: { value, expiresAt }

/**
 * Get a value from cache if it exists and hasn't expired
 * @param {string} key - Cache key
 * @returns {any|null} - Cached value or null if not found/expired
 */
function get(key) {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key); // Clean up expired entry
    return null;
  }
  
  return entry.value;
}

/**
 * Set a value in cache with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds (default: 24 hours)
 */
function set(key, value, ttlSeconds = 86400) {
  const expiresAt = Date.now() + (ttlSeconds * 1000);
  cache.set(key, { value, expiresAt });
}

/**
 * Check if a key exists in cache and hasn't expired
 * @param {string} key - Cache key
 * @returns {boolean} - True if key exists and is not expired
 */
function has(key) {
  const entry = cache.get(key);
  
  if (!entry) {
    return false;
  }
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key); // Clean up expired entry
    return false;
  }
  
  return true;
}

/**
 * Clear all cache entries
 */
function clear() {
  cache.clear();
}

/**
 * Remove expired entries (cleanup function, can be called periodically)
 * @returns {number} - Number of entries removed
 */
function cleanup() {
  const now = Date.now();
  let removed = 0;
  
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
      removed++;
    }
  }
  
  return removed;
}

module.exports = {
  get,
  set,
  has,
  clear,
  cleanup,
};