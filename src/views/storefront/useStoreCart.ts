import { computed, reactive } from 'vue';
import { quantityStep, type StoreProduct } from './storefront';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  image: string | null;
  priceUsd: number;
  priceVes: number | null;
  unit: string;
  stock: number;
  quantity: number;
}

export type AddResult = 'added' | 'capped' | 'out';

const round = (value: number) => Math.round(value * 1000) / 1000;

// Un carrito por tienda (se guarda en el navegador con el slug en la clave), así el carrito de
// una tienda nunca se mezcla con el de otra.
function createCart(slug: string) {
  const storageKey = `e360_store_cart_${slug}`;

  function load(): CartItem[] {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  const state = reactive({ items: load() as CartItem[], open: false });

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state.items));
    } catch {
      // Sin almacenamiento: el carrito solo dura la sesión.
    }
  }

  const count = computed(() => state.items.length);
  const totalUsd = computed(() => state.items.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0));

  function quantityOf(productId: string): number {
    return state.items.find((i) => i.productId === productId)?.quantity || 0;
  }

  function add(product: StoreProduct, quantity = quantityStep(product)): AddResult {
    if (product.stock <= 0) return 'out';

    const existing = state.items.find((item) => item.productId === product.id);
    const wanted = round((existing?.quantity || 0) + quantity);
    const capped = Math.min(wanted, product.stock);
    const result: AddResult = capped < wanted ? 'capped' : 'added';

    if (existing) {
      existing.quantity = round(capped);
      existing.stock = product.stock;
    } else {
      state.items.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        image: product.image,
        priceUsd: product.priceUsd,
        priceVes: product.priceVes,
        unit: product.unit,
        stock: product.stock,
        quantity: round(capped),
      });
    }
    persist();
    return result;
  }

  function setQuantity(productId: string, quantity: number) {
    const item = state.items.find((i) => i.productId === productId);
    if (!item) return;
    const step = item.unit ? 0.25 : 1;
    const value = Number.isFinite(quantity) ? quantity : step;
    item.quantity = round(Math.min(Math.max(value, step), item.stock));
    persist();
  }

  function step(productId: string, direction: 1 | -1) {
    const item = state.items.find((i) => i.productId === productId);
    if (item) setQuantity(productId, item.quantity + direction * (item.unit ? 0.25 : 1));
  }

  function remove(productId: string) {
    state.items = state.items.filter((item) => item.productId !== productId);
    persist();
  }

  function clear() {
    state.items = [];
    persist();
  }

  // Actualiza precio/stock con el inventario vigente y descarta lo que ya no se vende.
  function sync(products: StoreProduct[]) {
    const byId = new Map(products.map((p) => [p.id, p]));
    state.items = state.items
      .map((item) => {
        const current = byId.get(item.productId);
        if (!current || current.stock <= 0) return null;
        return {
          ...item,
          name: current.name,
          sku: current.sku,
          image: current.image,
          priceUsd: current.priceUsd,
          priceVes: current.priceVes,
          unit: current.unit,
          stock: current.stock,
          quantity: round(Math.min(item.quantity, current.stock)),
        };
      })
      .filter((item): item is CartItem => item !== null);
    persist();
  }

  return { state, count, totalUsd, quantityOf, add, setQuantity, step, remove, clear, sync };
}

export type StoreCart = ReturnType<typeof createCart>;

const carts = new Map<string, StoreCart>();

export function useStoreCart(slug: string): StoreCart {
  if (!carts.has(slug)) carts.set(slug, createCart(slug));
  return carts.get(slug)!;
}
