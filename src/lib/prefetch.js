/**
 * Lightweight module-level cache for route prefetching.
 */

const prefetchCache = new Map();

export const prefetch = {
  get: (key) => prefetchCache.get(key),
  set: (key, data) => prefetchCache.set(key, data),
  has: (key) => prefetchCache.has(key),
};
