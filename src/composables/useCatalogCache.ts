import { ref } from 'vue';

interface CacheEntry<T> { data: T; ts: number; }
const cache = new Map<string, CacheEntry<any>>();
const TTL = 5 * 60 * 1000;

function get<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL) { cache.delete(key); return null; }
  return entry.data as T;
}

function set(key: string, data: any) {
  cache.set(key, { data, ts: Date.now() });
}

export function useCatalogCache() {
  const loading = ref(false);

  async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = get<T>(key);
    if (cached !== null) return cached;
    loading.value = true;
    try {
      const data = await fetcher();
      set(key, data);
      return data;
    } finally {
      loading.value = false;
    }
  }

  function invalidate(pattern?: string) {
    if (!pattern) { cache.clear(); return; }
    for (const key of cache.keys()) {
      if (key.startsWith(pattern)) cache.delete(key);
    }
  }

  return { loading, fetchWithCache, invalidate };
}
