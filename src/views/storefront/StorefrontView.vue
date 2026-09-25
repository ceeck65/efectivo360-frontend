<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Eye, LayoutGrid, List, MapPin, PackageSearch, SlidersHorizontal, Store, X } from 'lucide-vue-next';
import StoreHeader from './components/StoreHeader.vue';
import HeroCarousel, { type HeroSlide } from './components/HeroCarousel.vue';
import BenefitsStrip from './components/BenefitsStrip.vue';
import FiltersSidebar from './components/FiltersSidebar.vue';
import ProductCard from './components/ProductCard.vue';
import ProductRow from './components/ProductRow.vue';
import ProductQuickView from './components/ProductQuickView.vue';
import CartDrawer from './components/CartDrawer.vue';
import { useStoreCart, type StoreCart } from './useStoreCart';
import { useStoreSeo } from './useStoreSeo';
import {
  SORT_OPTIONS,
  brandVars,
  descendantIds,
  fetchStore,
  fetchStoreProducts,
  flattenCategories,
  formatHours,
  formatMoney,
  formatQuantity,
  openWhatsApp,
  priceIn,
  publicStoreUrl,
  socialUrl,
  whatsappNumber,
  type CategoryItem,
  type CurrencyCode,
  type SortKey,
  type StoreCategory,
  type StorePayload,
  type StoreProduct,
} from './storefront';

const PAGE_SIZE = 24;
const PLATFORM_URL = 'https://efectivo360.app';

const route = useRoute();
const router = useRouter();
const seo = useStoreSeo();

const slug = computed(() => String(route.params.slug || '').toLowerCase());

// ---------- Datos ----------
const payload = ref<StorePayload | null>(null);
const products = ref<StoreProduct[]>([]);
const categories = ref<StoreCategory[]>([]);
const brandNames = ref<string[]>([]);
const loading = ref(true);
const productsLoading = ref(true);
const notFound = ref(false);
const loadError = ref('');

const store = computed(() => payload.value!.store);
const config = computed(() => payload.value!.config);
const rate = computed(() => payload.value?.rate ?? null);
const cart = shallowRef<StoreCart | null>(null); // shallow: sus computed internos se usan con .value

// ---------- Monedas ----------
// BOTH: el visitante alterna entre USD y Bs. (si hay tasa); USD/VES: una sola moneda.
const currencies = computed<CurrencyCode[]>(() => {
  const mode = config.value.currencyMode;
  const canVes = !!rate.value || (products.value.length > 0 && products.value.every((p) => p.priceVes));
  if (mode === 'USD' || !canVes) return ['USD'];
  if (mode === 'VES') return ['VES'];
  return ['USD', 'VES'];
});

const currency = ref<CurrencyCode>('USD');
const primaryCode = computed<CurrencyCode>(() => (currencies.value.includes(currency.value) ? currency.value : currencies.value[0]));
const secondaryCode = computed<CurrencyCode | ''>(() => currencies.value.find((c) => c !== primaryCode.value) || '');
const cartCurrencies = computed<CurrencyCode[]>(() => [primaryCode.value, ...(secondaryCode.value ? [secondaryCode.value] : [])]);

// ---------- Preferencias del visitante (por tienda) ----------
function readPref(key: string): string | null {
  try {
    return localStorage.getItem(`e360_store_${slug.value}_${key}`);
  } catch {
    return null;
  }
}

function writePref(key: string, value: string) {
  try {
    localStorage.setItem(`e360_store_${slug.value}_${key}`, value);
  } catch {
    // Sin almacenamiento: la preferencia solo dura la visita.
  }
}

const viewMode = ref<'grid' | 'list'>('grid');
watch(viewMode, (mode) => writePref('view', mode));
watch(currency, (code) => writePref('currency', code));

// ---------- Filtros ----------
const filters = reactive({
  search: '',
  categoryId: '',
  brands: [] as string[],
  budgetInput: '',
  budgetCurrency: 'USD' as CurrencyCode,
  range: [0, 0] as [number, number],
  inStockOnly: false,
  sort: 'featured' as SortKey,
});

const priceCeiling = computed(() => Math.max(1, Math.ceil(Math.max(0, ...products.value.map((p) => p.priceUsd)))));

const budgetUsd = computed(() => {
  const value = parseFloat(String(filters.budgetInput).replace(',', '.'));
  if (!(value > 0)) return null;
  if (filters.budgetCurrency === 'USD') return value;
  return rate.value ? value / rate.value : null;
});

const categoryScope = computed(() => (filters.categoryId ? descendantIds(filters.categoryId, categories.value) : null));

function matches(product: StoreProduct): boolean {
  const term = filters.search.trim().toLowerCase();
  if (categoryScope.value && !(product.categoryId && categoryScope.value.has(product.categoryId))) return false;
  if (filters.brands.length && !filters.brands.includes(product.brand)) return false;
  if (
    term &&
    !product.name.toLowerCase().includes(term) &&
    !product.sku.toLowerCase().includes(term) &&
    !product.barcode.toLowerCase().includes(term) &&
    !product.brand.toLowerCase().includes(term)
  ) {
    return false;
  }
  if (filters.inStockOnly && product.stock <= 0) return false;
  if (product.priceUsd < filters.range[0] || product.priceUsd > filters.range[1]) return false;
  if (budgetUsd.value !== null && product.priceUsd > budgetUsd.value + 1e-9) return false;
  return true;
}

const SORTERS: Partial<Record<SortKey, (a: StoreProduct, b: StoreProduct) => number>> = {
  name: (a, b) => a.name.localeCompare(b.name, 'es'),
  'price-asc': (a, b) => a.priceUsd - b.priceUsd,
  'price-desc': (a, b) => b.priceUsd - a.priceUsd,
  newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
};

const filtered = computed(() => {
  const list = products.value.filter(matches);
  const sorter = SORTERS[filters.sort];
  // "Destacados": primero lo que hay en stock, en el orden del inventario.
  if (!sorter) return [...list].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
  return [...list].sort(sorter);
});

const visibleCount = ref(PAGE_SIZE);
const shown = computed(() => filtered.value.slice(0, visibleCount.value));

watch(
  () => [filters.search, filters.categoryId, filters.brands.join('|'), filters.budgetInput, filters.budgetCurrency, filters.range[0], filters.range[1], filters.inStockOnly, filters.sort],
  () => {
    visibleCount.value = PAGE_SIZE;
  }
);

// Árbol de categorías de la tienda; el conteo suma los productos de sus subcategorías.
const categoryItems = computed<CategoryItem[]>(() =>
  flattenCategories(categories.value).map((category) => {
    const ids = descendantIds(category.id, categories.value);
    return { ...category, count: products.value.filter((p) => p.categoryId && ids.has(p.categoryId)).length };
  })
);

const brandItems = computed(() =>
  brandNames.value.map((name) => ({ name, count: products.value.filter((p) => p.brand === name).length }))
);

const affordableCount = computed(() => (budgetUsd.value === null ? 0 : filtered.value.length));

const hasSidebar = computed(() => {
  const f = config.value.filters;
  return (
    (f.categories && categoryItems.value.length > 0) ||
    (f.brands && brandItems.value.length > 1) ||
    f.budget ||
    (f.price && priceCeiling.value > 1) ||
    f.stock
  );
});

const gridClass = computed(() =>
  config.value.gridColumns === 4
    ? hasSidebar.value
      ? 'md:grid-cols-3 xl:grid-cols-4'
      : 'md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'
    : hasSidebar.value
      ? 'md:grid-cols-3'
      : 'md:grid-cols-3 lg:grid-cols-4'
);

function resetFilters() {
  filters.categoryId = '';
  filters.brands = [];
  filters.budgetInput = '';
  filters.range = [0, priceCeiling.value];
  filters.inStockOnly = false;
  filters.search = '';
}

// ---------- Hero ----------
const slides = computed<HeroSlide[]>(() => {
  const banners = config.value.banners;
  if (banners.length) {
    return banners.map((banner) => ({
      id: banner.id,
      title: banner.title,
      text: banner.subtitle,
      imageUrl: banner.imageUrl,
      showOverlay: banner.showOverlay,
      cta: banner.linkUrl || banner.linkLabel ? { label: banner.linkLabel || 'Ver más', url: banner.linkUrl } : null,
    }));
  }
  // Sin banners: una portada con el nombre y el eslogan de la tienda, en su color de marca.
  return [
    {
      id: 'default',
      eyebrow: store.value.businessType?.name || '',
      title: store.value.name,
      text: config.value.tagline || config.value.description || 'Haz tu pedido en línea y te lo confirmamos por WhatsApp.',
      imageUrl: '',
      showOverlay: false,
      cta: { label: 'Ver productos', url: '' },
    },
  ];
});

const gridSection = ref<HTMLElement | null>(null);

async function scrollToGrid() {
  await nextTick();
  gridSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onHeroCta(slide: HeroSlide) {
  const url = slide.cta?.url || '';
  if (!url) return scrollToGrid();
  if (/^\/(?!\/)/.test(url)) window.location.assign(url);
  else if (/^https?:\/\//.test(url)) window.open(url, '_blank', 'noopener');
}

// ---------- Enlaces compartibles: ?p=<producto>&c=<categoría>&q=<búsqueda> ----------
const viewing = ref<StoreProduct | null>(null);

function productHref(product: StoreProduct): string {
  return `${router.resolve({ query: { p: product.id } }).href}`;
}

function productShareUrl(product: StoreProduct): string {
  return `${publicStoreUrl(store.value.slug)}?p=${encodeURIComponent(product.id)}`;
}

function syncQuery() {
  const query: Record<string, string> = {};
  if (viewing.value) query.p = viewing.value.id;
  if (filters.categoryId) query.c = filters.categoryId;
  if (filters.search.trim()) query.q = filters.search.trim();
  const current = route.query;
  if (current.p !== query.p || current.c !== query.c || current.q !== query.q) {
    router.replace({ query });
  }
}

watch(() => [viewing.value?.id, filters.categoryId, filters.search], syncQuery);

// ---------- Carrito y pedido por WhatsApp ----------
const filtersOpen = ref(false);
const toast = ref('');
let toastTimer: ReturnType<typeof setTimeout> | undefined;

function showToast(message: string) {
  toast.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = '';
  }, 2600);
}

function addToCart(product: StoreProduct, quantity?: number) {
  const result = cart.value!.add(product, quantity);
  if (result === 'out') return showToast(`"${product.name}" está agotado.`);
  if (result === 'capped') return showToast(`Solo hay ${formatQuantity(product.stock, product.unit)} disponibles.`);
  showToast('Agregado al carrito');
}

function addFromModal(product: StoreProduct, quantity: number) {
  addToCart(product, quantity);
  viewing.value = null;
}

const waNumber = computed(() => (payload.value ? whatsappNumber(config.value, store.value) : ''));

function money(item: { priceUsd: number; priceVes?: number | null }, quantity: number): string {
  return cartCurrencies.value.map((code) => formatMoney(priceIn(item, code, rate.value, quantity), code)).join(' / ');
}

function buyOneOnWhatsApp(product: StoreProduct, quantity: number) {
  const lines = [
    `Hola *${store.value.name}*, me interesa este producto:`,
    '',
    `${product.name}${product.sku ? ` (${product.sku})` : ''} x${formatQuantity(quantity, product.unit)}`,
    money(product, quantity),
    productShareUrl(product),
    '',
    '¿Está disponible? Quisiera acordar el pago y la entrega. ¡Gracias!',
  ];
  openWhatsApp(waNumber.value, lines.join('\n'));
}

function checkout() {
  const items = cart.value!.state.items;
  if (!items.length) return;
  const lines = [`Hola *${store.value.name}*, quiero hacer este pedido:`, ''];
  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name}${item.sku ? ` (${item.sku})` : ''} x${formatQuantity(item.quantity, item.unit)}`);
    lines.push(`    ${money(item, item.quantity)}`);
  });
  const totals = cartCurrencies.value.map((code) => {
    const total = items.reduce<number | null>((sum, item) => {
      const line = priceIn(item, code, rate.value, item.quantity);
      return sum === null || line === null ? null : sum + line;
    }, 0);
    return formatMoney(total, code);
  });
  lines.push('', `*Total: ${totals.join(' / ')}*`);
  if (rate.value && cartCurrencies.value.includes('VES')) lines.push(`Tasa de referencia: 1 USD = ${formatMoney(rate.value, 'VES')}`);
  lines.push('', 'Quisiera acordar la forma de pago y la entrega. ¡Gracias!');
  openWhatsApp(waNumber.value, lines.join('\n'));
}

// ---------- Pie de página ----------
const hoursLines = computed(() => formatHours(config.value.hours));
const socialLinks = computed(() =>
  store.value.socials
    .filter((s) => s.platform !== 'whatsapp')
    .map((s) => ({ ...s, href: socialUrl(s.platform, s.url) }))
    .filter((s) => s.href)
);
const locationText = computed(() => [store.value.city, store.value.state].filter(Boolean).join(', '));

// ---------- Bloqueo de scroll y teclado ----------
watch(
  () => !!viewing.value || !!cart.value?.state.open || filtersOpen.value,
  (locked) => document.body.classList.toggle('overflow-hidden', locked)
);

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  if (viewing.value) viewing.value = null;
  else if (cart.value?.state.open) cart.value.state.open = false;
  else if (filtersOpen.value) filtersOpen.value = false;
}

// ---------- Carga ----------
function applyInitialQuery() {
  const { p, c, q } = route.query;
  if (typeof q === 'string') filters.search = q;
  if (typeof c === 'string' && categories.value.some((cat) => cat.id === c)) filters.categoryId = c;
  if (typeof p === 'string') viewing.value = products.value.find((prod) => prod.id === p) || null;
}

async function load() {
  loading.value = true;
  productsLoading.value = true;
  notFound.value = false;
  loadError.value = '';
  try {
    payload.value = await fetchStore(slug.value);
  } catch (err: any) {
    if (err?.response?.status === 404) notFound.value = true;
    else loadError.value = 'No pudimos cargar la tienda. Intenta de nuevo en unos minutos.';
    loading.value = false;
    return;
  }

  cart.value = useStoreCart(slug.value);
  const savedView = readPref('view');
  viewMode.value = savedView === 'list' || savedView === 'grid' ? savedView : config.value.productView;
  const savedCurrency = readPref('currency');
  currency.value = savedCurrency === 'VES' || savedCurrency === 'USD' ? savedCurrency : 'USD';
  filters.sort = config.value.defaultSort;
  loading.value = false;
  seo.apply(payload.value);

  try {
    const data = await fetchStoreProducts(slug.value);
    products.value = data.products;
    categories.value = data.categories;
    brandNames.value = data.brands;
    filters.range = [0, priceCeiling.value];
    filters.budgetCurrency = primaryCode.value;
    cart.value.sync(products.value);
    applyInitialQuery();
    seo.apply(payload.value, products.value.length);
  } catch {
    loadError.value = 'No pudimos cargar los productos. Intenta de nuevo en unos minutos.';
  } finally {
    productsLoading.value = false;
  }
}

watch(slug, load);

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  load();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.classList.remove('overflow-hidden');
  clearTimeout(toastTimer);
});
</script>

<template>
  <!-- Cargando -->
  <div v-if="loading" class="flex min-h-screen items-center justify-center bg-slate-50">
    <div class="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-500" />
  </div>

  <!-- Tienda inexistente o sin publicar -->
  <div v-else-if="notFound || !payload" class="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
    <Store :size="56" class="mb-4 text-slate-300" />
    <h1 class="text-2xl font-extrabold text-slate-800">{{ notFound ? 'Tienda no encontrada' : 'No pudimos abrir la tienda' }}</h1>
    <p class="mt-2 max-w-md text-sm text-slate-500">
      {{ notFound ? 'Revisa el enlace: la tienda no existe o todavía no está publicada.' : loadError }}
    </p>
    <a :href="PLATFORM_URL" class="mt-6 text-sm font-semibold text-blue-600 hover:underline">Ir a Efectivo 360</a>
  </div>

  <div v-else class="min-h-screen bg-slate-50 text-slate-800" :style="brandVars(config.brand)">
    <!-- Vista previa (tienda sin publicar, vista por su propio equipo) -->
    <div v-if="payload.preview" class="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-800">
      <Eye :size="14" /> Vista previa: esta tienda todavía no está publicada. Solo tu equipo puede verla.
    </div>

    <StoreHeader
      v-model:search="filters.search"
      v-model:currency="currency"
      :store="store"
      :config="config"
      :products="products"
      :cart-count="cart!.count.value"
      :currencies="currencies"
      :rate="currencies.includes('VES') ? rate : null"
      @open-cart="cart!.state.open = true"
      @select-product="(p) => (viewing = p)"
      @submit-search="scrollToGrid"
    />

    <main class="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <HeroCarousel v-if="config.hero === 'carousel'" :slides="slides" @cta="onHeroCta" />
      <BenefitsStrip v-if="config.benefits.length" :benefits="config.benefits" />

      <div ref="gridSection" class="scroll-mt-28" :class="hasSidebar ? 'lg:grid lg:grid-cols-4 lg:items-start lg:gap-6' : ''">
        <!-- Filtros (escritorio) -->
        <aside v-if="hasSidebar" class="hidden lg:sticky lg:top-28 lg:col-span-1 lg:block lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pr-1">
          <FiltersSidebar
            v-model:category-id="filters.categoryId"
            v-model:selected-brands="filters.brands"
            v-model:budget-input="filters.budgetInput"
            v-model:budget-currency="filters.budgetCurrency"
            v-model:range="filters.range"
            v-model:in-stock-only="filters.inStockOnly"
            :enabled="config.filters"
            :categories="categoryItems"
            :brands="brandItems"
            :total-count="products.length"
            :price-ceiling="priceCeiling"
            :affordable-count="affordableCount"
            :rate="rate"
            :currencies="currencies"
            @reset="resetFilters"
          />
        </aside>

        <!-- Productos -->
        <section class="min-w-0" :class="hasSidebar ? 'lg:col-span-3' : ''">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <button
                v-if="hasSidebar"
                type="button"
                class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm lg:hidden"
                @click="filtersOpen = true"
              >
                <SlidersHorizontal :size="16" /> Filtros
              </button>
              <p class="text-sm text-slate-500">
                <strong class="text-slate-800">{{ filtered.length }}</strong>
                producto{{ filtered.length === 1 ? '' : 's' }}
              </p>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm" role="group" aria-label="Formato de visualización">
                <button
                  type="button"
                  class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors"
                  :class="viewMode === 'grid' ? 'bg-[color:var(--brand)] text-[color:var(--on-brand)]' : 'text-slate-500 hover:text-slate-800'"
                  :aria-pressed="viewMode === 'grid'"
                  title="Vista grilla"
                  @click="viewMode = 'grid'"
                >
                  <LayoutGrid :size="16" /> <span class="hidden sm:inline">Grilla</span>
                </button>
                <button
                  type="button"
                  class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors"
                  :class="viewMode === 'list' ? 'bg-[color:var(--brand)] text-[color:var(--on-brand)]' : 'text-slate-500 hover:text-slate-800'"
                  :aria-pressed="viewMode === 'list'"
                  title="Vista lista"
                  @click="viewMode = 'list'"
                >
                  <List :size="16" /> <span class="hidden sm:inline">Lista</span>
                </button>
              </div>

              <label class="flex items-center gap-2 text-sm text-slate-500">
                <span class="hidden sm:inline">Ordenar por</span>
                <select
                  v-model="filters.sort"
                  class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-ring)]"
                >
                  <option v-for="option in SORT_OPTIONS" :key="option.key" :value="option.key">{{ option.label }}</option>
                </select>
              </label>
            </div>
          </div>

          <div v-if="productsLoading" class="grid grid-cols-2 gap-4" :class="gridClass">
            <div v-for="n in 6" :key="n" class="aspect-[3/4] animate-pulse rounded-2xl bg-slate-200" />
          </div>
          <p v-else-if="loadError" class="rounded-xl bg-red-50 p-4 text-sm text-red-700">{{ loadError }}</p>

          <div v-else-if="!filtered.length" class="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <PackageSearch :size="44" class="mb-3 text-slate-300" />
            <template v-if="products.length">
              <p class="font-semibold text-slate-600">No encontramos productos con esos filtros</p>
              <p class="text-sm text-slate-400">Prueba con otra búsqueda, categoría o rango de precio.</p>
              <button
                type="button"
                class="mt-4 rounded-xl bg-[color:var(--brand)] px-4 py-2 text-sm font-semibold text-[color:var(--on-brand)] hover:brightness-95"
                @click="resetFilters"
              >
                Limpiar filtros
              </button>
            </template>
            <template v-else>
              <p class="font-semibold text-slate-600">Esta tienda todavía no tiene productos publicados</p>
              <p class="text-sm text-slate-400">Vuelve pronto o escríbenos por WhatsApp.</p>
            </template>
          </div>

          <template v-else>
            <div v-if="viewMode === 'list'" class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div class="hidden grid-cols-[56px_112px_minmax(0,1fr)_96px_130px_190px] items-center gap-x-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
                <span />
                <span>Código</span>
                <span>Producto</span>
                <span class="text-center">Stock</span>
                <span class="text-right">Precio</span>
                <span class="text-right">Cantidad</span>
              </div>
              <ProductRow
                v-for="product in shown"
                :key="product.id"
                :product="product"
                :config="config"
                :href="productHref(product)"
                :primary-code="primaryCode"
                :secondary-code="secondaryCode"
                :rate="rate"
                :in-cart="cart!.quantityOf(product.id)"
                @view="(p) => (viewing = p)"
                @add="addToCart"
              />
            </div>

            <div v-else class="grid grid-cols-2 gap-3 sm:gap-4" :class="gridClass">
              <ProductCard
                v-for="product in shown"
                :key="product.id"
                :product="product"
                :config="config"
                :href="productHref(product)"
                :primary-code="primaryCode"
                :secondary-code="secondaryCode"
                :rate="rate"
                :in-cart="cart!.quantityOf(product.id)"
                @view="(p) => (viewing = p)"
                @add="(p) => addToCart(p)"
              />
            </div>

            <div v-if="filtered.length > shown.length" class="mt-6 text-center">
              <button
                type="button"
                class="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                @click="visibleCount += PAGE_SIZE"
              >
                Mostrar más productos ({{ filtered.length - shown.length }})
              </button>
            </div>
          </template>
        </section>
      </div>
    </main>

    <footer class="mt-10 border-t border-slate-200 bg-white">
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Negocio -->
        <div>
          <img v-if="store.logo" :src="store.logo" :alt="store.name" class="mb-3 h-12 w-auto max-w-[10rem] object-contain" />
          <p class="font-bold text-slate-800">{{ store.name }}</p>
          <p v-if="config.tagline" class="mt-1 text-sm text-slate-500">{{ config.tagline }}</p>
          <p v-if="config.description" class="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-500">{{ config.description }}</p>
          <p v-if="store.legalName || store.rif" class="mt-3 text-xs text-slate-400">
            {{ store.legalName }}<span v-if="store.legalName && store.rif"> · </span>{{ store.rif }}
          </p>
        </div>

        <!-- Contacto -->
        <div class="text-sm text-slate-600">
          <h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Contacto</h2>
          <ul class="space-y-2">
            <li v-if="waNumber">
              <a :href="`https://wa.me/${waNumber}`" target="_blank" rel="noopener" class="hover:text-[color:var(--brand)]">WhatsApp +{{ waNumber }}</a>
            </li>
            <li v-if="store.phone"><a :href="`tel:${store.phone}`" class="hover:text-[color:var(--brand)]">Tel. {{ store.phone }}</a></li>
            <li v-if="store.email"><a :href="`mailto:${store.email}`" class="hover:text-[color:var(--brand)]">{{ store.email }}</a></li>
            <li v-if="store.address" class="flex items-start gap-2">
              <MapPin :size="16" class="mt-0.5 shrink-0 text-[color:var(--brand)]" />
              <span>
                {{ store.address }}<template v-if="locationText">, {{ locationText }}</template>
                <a v-if="config.mapUrl" :href="config.mapUrl" target="_blank" rel="noopener" class="ml-1 text-[color:var(--brand)] hover:underline">Ver mapa</a>
              </span>
            </li>
          </ul>
        </div>

        <!-- Horarios -->
        <div class="text-sm text-slate-600">
          <h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Horarios</h2>
          <ul class="space-y-1">
            <li v-for="line in hoursLines" :key="line.days" class="flex justify-between gap-3">
              <span class="font-medium">{{ line.days }}</span>
              <span :class="line.text === 'Cerrado' ? 'text-slate-400' : ''">{{ line.text }}</span>
            </li>
          </ul>
        </div>

        <!-- Redes -->
        <div class="text-sm text-slate-600">
          <h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Síguenos</h2>
          <ul class="space-y-2">
            <li v-for="link in socialLinks" :key="link.platform + link.url">
              <a :href="link.href" target="_blank" rel="noopener noreferrer" class="capitalize hover:text-[color:var(--brand)]">{{ link.platform }}</a>
            </li>
            <li v-if="store.website">
              <a :href="store.website" target="_blank" rel="noopener noreferrer" class="hover:text-[color:var(--brand)]">{{ store.website.replace(/^https?:\/\//, '') }}</a>
            </li>
            <li v-if="!socialLinks.length && !store.website" class="text-slate-400">—</li>
          </ul>
        </div>
      </div>

      <div class="border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-400">
        <p v-if="config.footerNote" class="mb-2">{{ config.footerNote }}</p>
        <p v-if="currencies.includes('VES')">Los precios en bolívares se calculan a la tasa oficial del día.</p>
        <p class="mt-2">
          Tienda creada con <a :href="PLATFORM_URL" target="_blank" rel="noopener" class="font-semibold text-slate-500 hover:text-slate-700">Efectivo 360</a>
        </p>
      </div>
    </footer>

    <!-- Filtros móvil (slide-over izquierdo) -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="filtersOpen" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden" @click="filtersOpen = false" />
    </Transition>
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      leave-active-class="transition-transform duration-200 ease-in"
      enter-from-class="-translate-x-full"
      leave-to-class="-translate-x-full"
    >
      <aside v-if="filtersOpen" class="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col bg-slate-50 shadow-2xl lg:hidden">
        <header class="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <h2 class="font-bold text-slate-900">Filtros</h2>
          <button type="button" class="rounded-full p-2 text-slate-500 hover:bg-slate-100" title="Cerrar" @click="filtersOpen = false">
            <X :size="18" />
          </button>
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto p-4">
          <FiltersSidebar
            v-model:category-id="filters.categoryId"
            v-model:selected-brands="filters.brands"
            v-model:budget-input="filters.budgetInput"
            v-model:budget-currency="filters.budgetCurrency"
            v-model:range="filters.range"
            v-model:in-stock-only="filters.inStockOnly"
            :enabled="config.filters"
            :categories="categoryItems"
            :brands="brandItems"
            :total-count="products.length"
            :price-ceiling="priceCeiling"
            :affordable-count="affordableCount"
            :rate="rate"
            :currencies="currencies"
            @reset="resetFilters"
          />
        </div>
        <footer class="shrink-0 border-t border-slate-200 bg-white p-4">
          <button
            type="button"
            class="w-full rounded-xl bg-[color:var(--brand)] py-3 font-semibold text-[color:var(--on-brand)] hover:brightness-95"
            @click="filtersOpen = false; scrollToGrid()"
          >
            Ver {{ filtered.length }} producto{{ filtered.length === 1 ? '' : 's' }}
          </button>
        </footer>
      </aside>
    </Transition>

    <ProductQuickView
      v-if="viewing"
      :product="viewing"
      :config="config"
      :share-url="productShareUrl(viewing)"
      :primary-code="primaryCode"
      :secondary-code="secondaryCode"
      :rate="rate"
      @close="viewing = null"
      @add="addFromModal"
      @whatsapp="buyOneOnWhatsApp"
    />

    <CartDrawer :cart="cart!" :currencies="cartCurrencies" :rate="rate" @checkout="checkout" />

    <Transition
      enter-active-class="transition duration-200"
      leave-active-class="transition duration-200"
      enter-from-class="translate-y-2 opacity-0"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="toast"
        class="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xl"
        role="status"
      >
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
