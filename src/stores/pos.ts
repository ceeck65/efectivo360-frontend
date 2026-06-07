import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchApi } from '@/composables/useApi';

interface PosProduct {
  id: number | string;
  name: string;
  barcode: string;
  category_code: string;
  category_name: string;
  category_emoji: string;
  image_url: string;
  brand: string;
}

interface BlockedResult {
  blocked: true;
  product_name: string;
  category_name: string;
  category_emoji: string;
}

export const usePosStore = defineStore('pos', () => {
  // ── O(1) lookup maps ──
  const localProducts = ref<Map<string, PosProduct>>(new Map());
  const allowedCategories = ref<Map<string, boolean>>(new Map());

  const isBootstrapped = ref(false);
  const warming = ref(false);

  const productCount = computed(() => localProducts.value.size);
  const categoryCount = computed(() => allowedCategories.value.size);

  // ── bootstrapPOS: warm cache on cash drawer open ──
  async function bootstrapPOS() {
    if (isBootstrapped.value) return;
    warming.value = true;
    try {
      const res = await fetchApi<{ products_cached: number; categories_cached: number }>(
        '/api/v1/pos/cache/warm/',
        { method: 'POST', data: { top: 500 } },
      );
      isBootstrapped.value = true;
      return res;
    } finally {
      warming.value = false;
    }
  }

  // ── lookupProduct: hybrid O(1) local then remote ──
  async function lookupProduct(barcode: string): Promise<PosProduct | BlockedResult | null> {
    const code = barcode.trim().toUpperCase();
    if (!code) return null;

    // Fast path: local Map (O(1))
    const local = localProducts.value.get(code);
    if (local) {
      const allowed = allowedCategories.value.get(local.category_code.toUpperCase());
      if (allowed === false) {
        return {
          blocked: true,
          product_name: local.name,
          category_name: local.category_name,
          category_emoji: local.category_emoji,
        };
      }
      return local;
    }

    // Slow path: remote fetch via Redis-backed endpoint
    try {
      const res = await fetchApi<any>(`/api/v1/inventory/lookup/?code=${encodeURIComponent(code)}`);

      // Blocked by category
      if (res?.status === 'error' && res?.code === 'CATEGORY_NOT_ACTIVE') {
        const meta = res.meta || {};
        return {
          blocked: true,
          product_name: meta.product_name || '',
          category_name: meta.category_name || '',
          category_emoji: meta.category_emoji || '📦',
        };
      }

      // Redis cache hit
      if (res?.source === 'redis' && res?.data) {
        const d = res.data as PosProduct;
        localProducts.value.set(code, d);
        return d;
      }

      // Fallback: full proxy response (local / global / external / null)
      if (res?.data) {
        const d = res.data;
        const catCode = (d.category || res?.suggestion?.category_suggestion || '').toUpperCase();
        const catName = d.category_name || d.category || catCode;
        const catEmoji = d.category_emoji || '📦';
        const product: PosProduct = {
          id: d.id || '',
          name: d.name || res?.suggestion?.name || '',
          barcode: code,
          category_code: catCode,
          category_name: catName,
          category_emoji: catEmoji,
          image_url: d.image_url || res?.suggestion?.image_url || '',
          brand: d.brand || res?.suggestion?.brand || '',
        };
        localProducts.value.set(code, product);
        return product;
      }

      return null;
    } catch (e: any) {
      // Handle 422 from axios-like errors
      if (e?.status === 422 || e?.response?.status === 422) {
        const data = e?.data || e?.response?.data || {};
        if (data?.code === 'CATEGORY_NOT_ACTIVE' || data?.error === 'CATEGORY_NOT_ACTIVE') {
          return {
            blocked: true,
            product_name: data.product_name || data.meta?.product_name || '',
            category_name: data.category_name || data.meta?.category_name || '',
            category_emoji: data.category_emoji || data.meta?.category_emoji || '📦',
          };
        }
      }
      return null;
    }
  }

  // ── setAllowedCategories: preload from bootstrap or tenant config ──
  function setAllowedCategories(codes: string[]) {
    const m = new Map<string, boolean>();
    for (const c of codes) {
      m.set(c.toUpperCase(), true);
    }
    allowedCategories.value = m;
  }

  // ── addProductToLocal: dynamic warm on scan miss ──
  function addProductToLocal(product: PosProduct) {
    localProducts.value.set(product.barcode.trim().toUpperCase(), product);
  }

  // ── reset: clear all caches (e.g. on cash drawer close) ──
  function reset() {
    localProducts.value = new Map();
    allowedCategories.value = new Map();
    isBootstrapped.value = false;
  }

  return {
    localProducts,
    allowedCategories,
    isBootstrapped,
    warming,
    productCount,
    categoryCount,
    bootstrapPOS,
    lookupProduct,
    setAllowedCategories,
    addProductToLocal,
    reset,
  };
});
