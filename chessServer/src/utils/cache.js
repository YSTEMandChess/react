//Responsibility: Simple caching layer -->  avoid calling the LLM again for the exact same “input” when you already have the answer
//this is important because the LLM is expensive and we want to avoid calling it unnecessarily (user switches tabs)

//get(key), set(key, value, ttl), has(key)
//Cache key format: analysis:${fenAfter}:${moveUci}:depth${depth}:movetime${movetime}:multipv${multipv}
//Includes analysis settings to ensure cache matches analysis parameters


//Caching Strategy
//Cache Key Format:analysis:${fenAfter}:${moveUci}:depth${depth}:movetime${movetime}:multipv${multipv}Rationale:

//Uses fenAfter:moveUci for cache reuse across games (same position + move)
//Includes analysis settings (depth, movetime, multipv) to ensure cache matches analysis parameters
//Different settings produce different cache entries (e.g., depth 10 vs depth 20)
//TTL: 24 hours (or per Google Doc requirements)Cache Storage: Start with in-memory Map, upgrade to Redis if needed for production.


const cache = new Map();

export const get = (key) => {
    return cache.get(key);
};

export const set = (key, value, ttl) => {
    cache.set(key, value, ttl);
};

export const has = (key) => {
    return cache.has(key);
};