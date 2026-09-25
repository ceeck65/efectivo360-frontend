<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ImageOff, Search, ShoppingCart, X } from 'lucide-vue-next';
import { formatMoney, getOpenStatus, priceIn, type CurrencyCode, type StoreConfig, type StoreProduct, type StoreProfile } from '../storefront';

const props = defineProps<{
  store: StoreProfile;
  config: StoreConfig;
  products: StoreProduct[];
  cartCount: number;
  currencies: CurrencyCode[];
  rate: number | null;
}>();
const emit = defineEmits<{
  (e: 'open-cart'): void;
  (e: 'select-product', product: StoreProduct): void;
  (e: 'submit-search'): void;
}>();

const search = defineModel<string>('search', { default: '' });
const currency = defineModel<CurrencyCode>('currency', { default: 'USD' });

// ---------- Estado de la tienda ----------
const now = ref(new Date());
const status = computed(() => getOpenStatus(props.config.hours, props.config.timezone, now.value));
let statusTimer: ReturnType<typeof setInterval> | undefined;

// ---------- Búsqueda predictiva ----------
const focused = ref(false);
const highlighted = ref(-1);

const suggestions = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return [];
  return props.products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.barcode.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term)
    )
    .slice(0, 6);
});

const showSuggestions = computed(() => focused.value && suggestions.value.length > 0);

watch(suggestions, () => {
  highlighted.value = -1;
});

function pick(product: StoreProduct) {
  focused.value = false;
  emit('select-product', product);
}

function onEnter() {
  const chosen = suggestions.value[highlighted.value];
  if (chosen) return pick(chosen);
  focused.value = false;
  emit('submit-search');
}

function move(step: number) {
  const total = suggestions.value.length;
  if (!total) return;
  highlighted.value = (highlighted.value + step + total) % total;
}

// ---------- Insignia del carrito animada ----------
const bump = ref(false);
let bumpTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.cartCount,
  (next, previous) => {
    if (next <= previous) return;
    bump.value = false;
    requestAnimationFrame(() => {
      bump.value = true;
      clearTimeout(bumpTimer);
      bumpTimer = setTimeout(() => {
        bump.value = false;
      }, 600);
    });
  }
);

const initial = computed(() => (props.store.name || 'T').charAt(0).toUpperCase());

onMounted(() => {
  statusTimer = setInterval(() => {
    now.value = new Date();
  }, 60_000);
});

onBeforeUnmount(() => {
  clearInterval(statusTimer);
  clearTimeout(bumpTimer);
});
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <!-- Logo + estado -->
      <div class="flex min-w-0 items-center gap-3">
        <img
          v-if="store.logo"
          :src="store.logo"
          :alt="store.name"
          class="h-11 w-auto max-w-[9rem] object-contain sm:h-12"
        />
        <span
          v-else
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--brand)] text-lg font-black text-[color:var(--on-brand)]"
        >
          {{ initial }}
        </span>
        <!-- Estado compacto (móvil) -->
        <span
          class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:hidden"
          :class="status.open ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
        >
          <span class="h-2 w-2 rounded-full" :class="status.open ? 'bg-emerald-500' : 'bg-red-500'" />
          {{ status.open ? 'Abierta' : 'Cerrada' }}
        </span>
        <div class="hidden min-w-0 leading-tight sm:block">
          <h1 class="truncate text-sm font-bold text-slate-800">{{ store.name }}</h1>
          <p class="flex items-center gap-1.5 text-xs" :class="status.open ? 'text-emerald-600' : 'text-slate-500'">
            <span class="relative flex h-2 w-2">
              <span v-if="status.open" class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span class="relative inline-flex h-2 w-2 rounded-full" :class="status.open ? 'bg-emerald-500' : 'bg-red-500'" />
            </span>
            {{ status.label }}
            <span v-if="status.detail" class="hidden text-slate-400 lg:inline">· {{ status.detail }}</span>
          </p>
        </div>
      </div>

      <!-- Acciones (móvil: junto al logo) -->
      <div class="order-2 ml-auto flex items-center gap-2 md:order-3 md:ml-0">
        <div v-if="currencies.length > 1" class="flex items-center gap-2">
          <div class="flex rounded-xl bg-slate-100 p-0.5">
            <button
              v-for="code in currencies"
              :key="code"
              type="button"
              class="rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"
              :class="currency === code ? 'bg-white text-[color:var(--brand)] shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              @click="currency = code"
            >
              {{ code === 'USD' ? 'USD' : 'Bs.' }}
            </button>
          </div>
          <span v-if="rate" class="hidden whitespace-nowrap text-xs text-slate-500 xl:inline">
            1 USD = <strong class="text-slate-700">{{ formatMoney(rate, 'VES') }}</strong>
          </span>
        </div>

        <button
          type="button"
          class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--brand)] text-[color:var(--on-brand)] shadow-sm transition hover:brightness-95"
          title="Ver carrito"
          @click="emit('open-cart')"
        >
          <ShoppingCart :size="20" />
          <span
            v-if="cartCount > 0"
            class="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white"
            :class="bump ? 'badge-bump' : ''"
          >
            {{ cartCount }}
          </span>
        </button>
      </div>

      <!-- Buscador predictivo -->
      <div class="relative order-3 w-full md:order-2 md:w-auto md:flex-1">
        <Search :size="18" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          type="search"
          autocomplete="off"
          placeholder="Buscar por nombre, código o marca..."
          class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-sm focus:border-[color:var(--brand)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-ring)]"
          @focus="focused = true"
          @blur="focused = false"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="onEnter"
          @keydown.esc="focused = false"
        />
        <button
          v-if="search"
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          title="Limpiar búsqueda"
          @mousedown.prevent
          @click="search = ''"
        >
          <X :size="14" />
        </button>

        <ul
          v-if="showSuggestions"
          class="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <li v-for="(product, index) in suggestions" :key="product.id">
            <button
              type="button"
              class="flex w-full items-center gap-3 px-3 py-2 text-left"
              :class="index === highlighted ? 'bg-[color:var(--brand-soft)]' : 'hover:bg-slate-50'"
              @mousedown.prevent="pick(product)"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                <img v-if="product.image" :src="product.image" alt="" class="h-full w-full object-contain" />
                <ImageOff v-else :size="16" class="text-slate-300" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-slate-800">{{ product.name }}</span>
                <span class="block truncate text-xs text-slate-400">{{ [product.sku, product.brand].filter(Boolean).join(' · ') }}</span>
              </span>
              <span class="text-sm font-semibold text-[color:var(--brand)]">
                {{ formatMoney(priceIn(product, currency, rate), currency) }}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </header>
</template>

<style scoped>
.badge-bump {
  animation: bump 0.6s ease;
}

@keyframes bump {
  0% { transform: scale(1); }
  35% { transform: scale(1.6); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .badge-bump { animation: none; }
}
</style>
