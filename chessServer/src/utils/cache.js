// chessServer/src/utils/cache.js
// Responsibility: Simple caching layer with TTL support and size limits
// Cache key format: analysis:${fenAfter}:${moveUci}:depth${depth}:movetime${movetime}:multipv${multipv}

const cache = new Map(); // Stores: { value, expiresAt, lastAccess }
const MAX_SIZE = Number(process.env.CACHE_MAX_SIZE || 5000);

// Cache statistics
let stats = {
  hits: 0,
  misses: 0,
};

/**
 * Get a value from cache if it exists and hasn't expired
 * @param {string} key - Cache key
 * @returns {any|null} - Cached value or null if not found/expired
 */
function get(key) {
  const entry = cache.get(key);
  
  if (!entry) {
    stats.misses++;
    return null;
  }
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key); // Clean up expired entry
    stats.misses++;
    return null;
  }
  
  // Update last access time for LRU
  entry.lastAccess = Date.now();
  stats.hits++;
  return entry.value;
}

/**
 * Evict least recently used entry when cache is at capacity
 * @private
 */
function _evictLRU() {
  if (cache.size < MAX_SIZE) {
    return; // No eviction needed
  }

  // Find the entry with the oldest lastAccess time
  let oldestKey = null;
  let oldestAccess = Infinity;

  for (const [key, entry] of cache.entries()) {
    const lastAccess = entry.lastAccess || entry.expiresAt; // Fallback to expiresAt if lastAccess not set
    if (lastAccess < oldestAccess) {
      oldestAccess = lastAccess;
      oldestKey = key;
    }
  }

  if (oldestKey !== null) {
    cache.delete(oldestKey);
  }
}

/**
 * Set a value in cache with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds (default: 24 hours)
 */
function set(key, value, ttlSeconds = 86400) {
  // Evict LRU entry if cache is at capacity
  if (cache.size >= MAX_SIZE && !cache.has(key)) {
    _evictLRU();
  }

  const expiresAt = Date.now() + (ttlSeconds * 1000);
  const now = Date.now();
  cache.set(key, { value, expiresAt, lastAccess: now });
}

/**
 * Check if a key exists in cache and hasn't expired
 * @param {string} key - Cache key
 * @returns {boolean} - True if key exists and is not expired
 */
function has(key) {
  const entry = cache.get(key);
  
  if (!entry) {
    // Note: get() already increments stats, so we don't increment here
    return false;
  }
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key); // Clean up expired entry
    return false;
  }
  
  // Note: get() already increments stats and updates lastAccess, so we don't need to do it here
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

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getStats() {
  const total = stats.hits + stats.misses;
  const hitRate = total > 0 ? stats.hits / total : 0;
  
  return {
    size: cache.size,
    maxSize: MAX_SIZE,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: hitRate,
  };
}

/**
 * Reset cache statistics (for testing)
 */
function resetStats() {
  stats.hits = 0;
  stats.misses = 0;
}

module.exports = {
  get,
  set,
  has,
  clear,
  cleanup,
  getStats,
  resetStats,
};