<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { RouterLink, onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  Check,
  Download,
  Grid3x3,
  LayoutGrid,
  List,
  MessageCircle,
  Save,
  Search,
} from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useAlert } from '@/composables/useAlert';
import { useNotify } from '@/composables/useNotify';
import { parseApiError } from '@/utils/parseApiError';
import CatalogSheet from './CatalogSheet.vue';
import { iconDataUri, type BrandIcon } from './brandIcons';
import {
  API_URL,
  DEFAULT_CONFIG,
  defaultConfig,
  formatUsd,
  formatVes,
  normalizeProduct,
  priceParts,
  type CatalogConfig,
  type CatalogContact,
  type CatalogItem,
  type CatalogLayout,
  type CurrencyMode,
  type DigitalCatalog,
  type SheetOptions,
  type StoreInfo,
} from './catalog';

const route = useRoute();
const router = useRouter();
const { showConfirm } = useAlert();
const { success, error: notifyError } = useNotify();

// ---------- Constantes ----------
const PAGE_W = 794; // A4 a 96 dpi
const PAGE_H = 1123;

// Productos por hoja según el layout (la primera hoja lleva el encabezado grande).
const CAPACITY: Record<CatalogLayout, { first: number; rest: number }> = {
  grid2: { first: 4, rest: 4 },
  grid3: { first: 9, rest: 9 },
  list: { first: 9, rest: 10 },
};

const LAYOUTS = [
  { key: 'grid2' as const, label: 'Grid 2x2', hint: 'Tarjetas grandes', icon: LayoutGrid },
  { key: 'grid3' as const, label: 'Grid 3x3', hint: 'Parrilla compacta', icon: Grid3x3 },
  { key: 'list' as const, label: 'Lista', hint: 'Una fila por producto', icon: List },
];

const CURRENCY_MODES: { key: CurrencyMode; label: string }[] = [
  { key: 'USD', label: 'Solo USD ($)' },
  { key: 'VES', label: 'Solo VES (Bs.)' },
  { key: 'BOTH', label: 'Ambas' },
];

const TOGGLES: { key: 'showSku' | 'showStock' | 'showBrand'; label: string }[] = [
  { key: 'showSku', label: 'Mostrar SKU' },
  { key: 'showStock', label: 'Mostrar stock' },
  { key: 'showBrand', label: 'Mostrar marca' },
];

const CONTACT_FIELDS: { key: Exclude<keyof CatalogContact, 'note'>; icon: BrandIcon; placeholder: string }[] = [
  { key: 'phone', icon: 'whatsapp', placeholder: 'WhatsApp (ej. +58 412 000 0000)' },
  { key: 'address', icon: 'pin', placeholder: 'Dirección' },
  { key: 'instagram', icon: 'instagram', placeholder: 'Instagram (@usuario)' },
  { key: 'tiktok', icon: 'tiktok', placeholder: 'TikTok (@usuario)' },
  { key: 'facebook', icon: 'facebook', placeholder: 'Facebook (usuario o página)' },
];

const BRAND_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#e11d48', '#0f172a'];

// ---------- Configuración del catálogo (se guarda en el servidor) ----------
const config = reactive<CatalogConfig>(defaultConfig());
const name = ref('');
const catalogId = ref<string | null>((route.params.id as string) || null);
const isEdit = computed(() => !!catalogId.value);
const saving = ref(false);

// ---------- Productos de la tienda y selección ----------
const products = ref<CatalogItem[]>([]);
const loading = ref(true);
const loadError = ref('');
const search = ref('');
const category = ref('');
const selectedIds = ref<Set<string>>(new Set());

// Foto del estado guardado: sirve para saber si hay cambios sin guardar.
const snapshot = ref('');
const currentState = () => JSON.stringify({ name: name.value, config, ids: [...selectedIds.value].sort() });
const dirty = computed(() => !loading.value && currentState() !== snapshot.value);

const categories = computed(() =>
  [...new Set(products.value.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
);

const visibleProducts = computed(() => {
  const term = search.value.trim().toLowerCase();
  return products.value.filter((product) => {
    const matchesCategory = !category.value || product.category === category.value;
    const matchesSearch =
      !term ||
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      product.brand.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });
});

const selectedProducts = computed(() => products.value.filter((p) => selectedIds.value.has(p.id)));

function toggleProduct(id: string) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}

// Actúan sobre los productos visibles (respetan el filtro de categoría y el buscador).
function selectAllVisible() {
  const next = new Set(selectedIds.value);
  visibleProducts.value.forEach((p) => next.add(p.id));
  selectedIds.value = next;
}

function clearAllVisible() {
  const next = new Set(selectedIds.value);
  visibleProducts.value.forEach((p) => next.delete(p.id));
  selectedIds.value = next;
}

// ---------- Tienda y tasa ----------
const store = ref<StoreInfo>({ name: '', logo: '' });
const storeInfo = ref<any>(null);
const rate = ref<number | null>(null);
const today = new Date().toLocaleDateString('es-VE', { dateStyle: 'long' });

// Busca una red social en "Mi Negocio" (socials: [{ platform, url }]).
function social(platform: string): string {
  const socials: { platform: string; url: string }[] = storeInfo.value?.socials || [];
  return socials.find((s) => s.platform === platform && s.url)?.url || '';
}

// En un catálogo nuevo, el título y el contacto se completan con los datos de la tienda.
function prefillFromStore() {
  const contact = config.contact;
  if (!contact.phone) contact.phone = social('whatsapp') || storeInfo.value?.phone || '';
  if (!contact.address) contact.address = storeInfo.value?.address || '';
  if (!contact.instagram) contact.instagram = social('instagram');
  if (!contact.tiktok) contact.tiktok = social('tiktok');
  if (!contact.facebook) contact.facebook = social('facebook');
  if (config.title === DEFAULT_CONFIG.title && store.value.name) config.title = `Catálogo - ${store.value.name}`;
}

const sheetOptions = computed<SheetOptions>(() => ({
  ...config,
  contact: config.contact,
  rate: rate.value,
  date: today,
  store: store.value,
}));

const pages = computed(() => {
  const list = selectedProducts.value;
  if (!list.length) return [[]] as CatalogItem[][];

  const { first, rest } = CAPACITY[config.layout];
  const result = [list.slice(0, first)];
  for (let i = first; i < list.length; i += rest) result.push(list.slice(i, i + rest));
  return result;
});

// ---------- Vista previa escalada al ancho disponible ----------
const previewBox = ref<HTMLElement | null>(null);
const scale = ref(0.6);
let resizeObserver: ResizeObserver | null = null;

// ---------- Exportación ----------
const exporting = ref(false);
const exportRoot = ref<HTMLElement | null>(null);

function waitForImages(root: HTMLElement) {
  const images = [...root.querySelectorAll('img')];
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        })
    )
  );
}

// Imagen gris de 1x1 que se usa si alguna foto no se puede leer (p. ej. sin CORS).
const IMAGE_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'catalogo'
  );
}

// Cada hoja se rasteriza con el motor del propio navegador (html-to-image), por lo que el PDF
// coincide con la vista previa, y ocupa exactamente una página A4.
async function downloadPdf() {
  if (!selectedProducts.value.length || exporting.value) return;

  exporting.value = true;
  try {
    await nextTick(); // renderiza las hojas sin escalar fuera de pantalla
    const [{ toJpeg }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);
    const root = exportRoot.value!;
    await waitForImages(root);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    const sheets = root.querySelectorAll<HTMLElement>('[data-pdf-page]');

    for (let i = 0; i < sheets.length; i += 1) {
      const image = await toJpeg(sheets[i], {
        pixelRatio: 2,
        quality: 0.92,
        backgroundColor: '#ffffff',
        width: PAGE_W,
        height: PAGE_H,
        imagePlaceholder: IMAGE_PLACEHOLDER,
      });
      if (i > 0) pdf.addPage();
      pdf.addImage(image, 'JPEG', 0, 0, 210, 297);
    }

    const stamp = new Date().toISOString().slice(0, 10);
    pdf.save(`catalogo-${slugify(name.value || store.value.name || 'catalogo')}-${stamp}.pdf`);
    success('PDF descargado. Ya puedes enviarlo por WhatsApp.');
  } catch (err) {
    console.error(err);
    notifyError('No se pudo generar el PDF. Intenta de nuevo.');
  } finally {
    exporting.value = false;
  }
}

// Texto listo para pegar en WhatsApp (*negrita* y _cursiva_ nativas).
function buildWhatsAppText(): string {
  const lines = [`*${config.title}*`];
  if (config.subtitle) lines.push(`_${config.subtitle}_`);
  lines.push(`Fecha: ${today}`);
  if (rate.value && config.currencyMode !== 'USD') {
    lines.push(`Tasa de referencia: 1 USD = ${formatVes(rate.value)}`);
  }

  const groups = new Map<string, CatalogItem[]>();
  selectedProducts.value.forEach((product) => {
    const group = product.category || 'Otros';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(product);
  });

  groups.forEach((items, group) => {
    lines.push('', `*${group}*`);
    items.forEach((product) => {
      const brand = config.showBrand && product.brand ? ` (${product.brand})` : '';
      const sku = config.showSku && product.sku ? ` [${product.sku}]` : '';
      const { main, sub } = priceParts(product, config.currencyMode, rate.value);
      const price = sub ? `${main} (${sub})` : main;
      const stock = config.showStock ? (product.stock > 0 ? ` - stock: ${product.stock}` : ' - agotado') : '';
      lines.push(`• ${product.name}${brand}${sku} - ${price}${stock}`);
    });
  });

  const contact = config.contact;
  lines.push('');
  if (store.value.name) lines.push(`🏪 ${store.value.name}`);
  if (contact.phone) lines.push(`📞 ${contact.phone}`);
  if (contact.address) lines.push(`📍 ${contact.address}`);
  if (contact.instagram) lines.push(`📸 ${contact.instagram}`);
  if (contact.tiktok) lines.push(`🎵 ${contact.tiktok}`);
  if (contact.facebook) lines.push(`📘 ${contact.facebook}`);
  if (contact.note) lines.push('', `_${contact.note}_`);

  return lines.join('\n');
}

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Respaldo para HTTP (ej. efectivo360.test), donde la API de portapapeles no está disponible.
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(area);
  if (!ok) throw new Error('copy failed');
}

async function copyWhatsApp() {
  if (!selectedProducts.value.length) return;
  try {
    await copyText(buildWhatsAppText());
    success('Texto copiado. Pégalo en WhatsApp.');
  } catch {
    notifyError('No se pudo copiar el texto.');
  }
}

// ---------- Guardado ----------
function applyCatalog(catalog: DigitalCatalog) {
  const base = defaultConfig();
  name.value = catalog.name;
  Object.assign(config, { ...base, ...catalog.config, contact: { ...base.contact, ...catalog.config.contact } });
  // Los productos que ya no existen o están inactivos se descartan de la selección.
  const available = new Set(products.value.map((p) => p.id));
  selectedIds.value = new Set(catalog.product_ids.filter((id) => available.has(id)));
}

async function save() {
  if (!name.value.trim()) {
    notifyError('Ponle un nombre al catálogo antes de guardarlo.');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      name: name.value.trim(),
      config: JSON.parse(JSON.stringify(config)),
      // Se guardan en el orden del listado de productos, igual que en la vista previa.
      product_ids: selectedProducts.value.map((p) => p.id),
    };

    if (isEdit.value) {
      await fetchApi(`${API_URL}${catalogId.value}/`, { method: 'PUT', data: payload });
      snapshot.value = currentState();
    } else {
      const data = await fetchApi<DigitalCatalog>(API_URL, { method: 'POST', data: payload });
      catalogId.value = data.id;
      snapshot.value = currentState(); // antes de navegar, para que no se pida confirmar la salida
      await router.replace({ name: 'DigitalCatalogEdit', params: { id: data.id } });
    }
    success(`Catálogo "${payload.name}" guardado.`);
  } catch (err) {
    notifyError(parseApiError(err) || 'No se pudo guardar el catálogo.');
  } finally {
    saving.value = false;
  }
}

function warnBeforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) event.preventDefault();
}

onBeforeRouteLeave(async () => {
  if (!dirty.value) return true;
  return await showConfirm('Tienes cambios sin guardar', '¿Salir de todos modos?', 'Salir');
});

// ---------- Carga inicial ----------
// /api/v1/products/ está paginado: se recorren todas las páginas.
async function loadAllProducts(): Promise<CatalogItem[]> {
  const items: any[] = [];
  let url: string | null = '/api/v1/products/?is_active=true';
  while (url) {
    const res: any = await fetchApi<any>(url);
    if (Array.isArray(res)) {
      items.push(...res);
      break;
    }
    items.push(...(res?.results ?? []));
    url = res?.next || null;
  }
  return items.filter((p) => p.is_active !== false).map(normalizeProduct);
}

async function loadStoreInfo() {
  try {
    const info = await fetchApi<any>('/api/v1/tenants/settings/info/');
    storeInfo.value = info;
    store.value = {
      name: info?.commercial_name || info?.name || info?.legal_name || '',
      logo: info?.logo_url || info?.thumb_url || '',
    };
  } catch {
    // Sin datos de la tienda la hoja muestra la inicial en lugar del logo.
  }
}

async function loadRate() {
  try {
    const res = await fetchApi<{ rate?: number }>('/api/v1/forex/rate/');
    const value = Number(res?.rate);
    rate.value = Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    rate.value = null;
  }
}

onMounted(async () => {
  window.addEventListener('beforeunload', warnBeforeUnload);

  resizeObserver = new ResizeObserver(([entry]) => {
    scale.value = Math.min(1, Math.max(0.25, entry.contentRect.width / PAGE_W));
  });
  if (previewBox.value) resizeObserver.observe(previewBox.value);

  try {
    const [items] = await Promise.all([loadAllProducts(), loadStoreInfo(), loadRate()]);
    products.value = items;

    if (isEdit.value) {
      applyCatalog(await fetchApi<DigitalCatalog>(`${API_URL}${catalogId.value}/`));
    } else {
      prefillFromStore();
      selectedIds.value = new Set(items.map((p) => p.id));
    }
  } catch (err: any) {
    loadError.value = err?.status === 404 ? 'El catálogo no existe o fue eliminado.' : 'No se pudieron cargar los datos.';
  } finally {
    snapshot.value = currentState();
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', warnBeforeUnload);
  resizeObserver?.disconnect();
});

const inputClass =
  'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141824] px-3 py-2 text-sm text-slate-700 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400';
</script>

<template>
  <div class="grid grid-cols-1 gap-4 p-4 md:p-6 lg:h-[calc(100dvh-4rem)] lg:grid-cols-[35%_1fr]">
    <!-- Panel izquierdo: configuración (35%) -->
    <aside class="flex min-h-0 flex-col rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141824] shadow-sm">
      <div class="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
        <!-- Identificación del catálogo -->
        <section class="space-y-3">
          <RouterLink :to="{ name: 'DigitalCatalogs' }" class="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">
            <ArrowLeft :size="15" /> Mis catálogos
          </RouterLink>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Nombre del catálogo (uso interno)</label>
            <input v-model="name" type="text" maxlength="80" placeholder="Ej.: Ofertas semana 38" :class="inputClass" />
          </div>
          <p v-if="loadError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ loadError }}</p>
        </section>

        <!-- Selección de productos -->
        <section class="space-y-3">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">1. Productos de la tienda</h2>

          <div class="relative">
            <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input v-model="search" type="search" placeholder="Buscar por nombre, SKU o marca..." :class="[inputClass, 'pl-9']" />
          </div>

          <select v-model="category" :class="inputClass">
            <option value="">Todas las categorías</option>
            <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
          </select>

          <div class="flex items-center justify-between gap-2">
            <p class="text-xs text-slate-500">
              <span class="font-semibold text-blue-600">{{ selectedProducts.length }}</span> de
              {{ products.length }} seleccionados
            </p>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100"
                title="Selecciona los productos que ves en la lista"
                @click="selectAllVisible"
              >
                Seleccionar todos
              </button>
              <button
                type="button"
                class="rounded-lg bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                title="Desmarca los productos que ves en la lista"
                @click="clearAllVisible"
              >
                Desmarcar todos
              </button>
            </div>
          </div>

          <div class="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/[0.08]">
            <p v-if="loading" class="p-4 text-sm text-slate-500">Cargando productos...</p>
            <p v-else-if="loadError" class="p-4 text-sm text-red-600">{{ loadError }}</p>
            <p v-else-if="!visibleProducts.length" class="p-4 text-sm text-slate-400">No hay productos para mostrar.</p>

            <label
              v-for="product in visibleProducts"
              :key="product.id"
              class="flex cursor-pointer items-center gap-3 border-b border-slate-100 dark:border-white/[0.06] px-3 py-2 last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/[0.03]"
            >
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                :checked="selectedIds.has(product.id)"
                @change="toggleProduct(product.id)"
              />
              <img v-if="product.image" :src="product.image" alt="" class="h-9 w-9 shrink-0 rounded-md bg-white object-contain" />
              <div v-else class="h-9 w-9 shrink-0 rounded-md bg-slate-100 dark:bg-white/[0.06]" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-slate-800 dark:text-white">{{ product.name }}</p>
                <p class="truncate text-xs text-slate-400">{{ [product.sku, product.category].filter(Boolean).join(' · ') }}</p>
              </div>
              <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">{{ formatUsd(product.priceUsd) }}</span>
            </label>
          </div>
        </section>

        <!-- Personalización -->
        <section class="space-y-4">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">2. Personalización</h2>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Título del catálogo</label>
            <input v-model="config.title" type="text" maxlength="80" :class="inputClass" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Subtítulo / Mensaje</label>
            <input v-model="config.subtitle" type="text" maxlength="100" :class="inputClass" />
          </div>

          <div>
            <p class="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">Diseño</p>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="option in LAYOUTS"
                :key="option.key"
                type="button"
                class="flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-colors"
                :class="
                  config.layout === option.key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                "
                @click="config.layout = option.key"
              >
                <component :is="option.icon" :size="20" />
                <span class="text-xs font-semibold">{{ option.label }}</span>
                <span class="text-[10px] leading-tight text-slate-400">{{ option.hint }}</span>
              </button>
            </div>
          </div>

          <div>
            <p class="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">Moneda a mostrar</p>
            <div class="flex rounded-xl bg-slate-100 dark:bg-white/[0.06] p-0.5">
              <button
                v-for="mode in CURRENCY_MODES"
                :key="mode.key"
                type="button"
                class="flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors"
                :class="
                  config.currencyMode === mode.key
                    ? 'bg-white dark:bg-[#1c2130] text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                "
                @click="config.currencyMode = mode.key"
              >
                {{ mode.label }}
              </button>
            </div>
            <p v-if="config.currencyMode !== 'USD'" class="mt-1 text-xs text-slate-400">
              <template v-if="rate">Tasa del día: 1 USD = {{ formatVes(rate) }}</template>
              <template v-else>No hay tasa disponible: se mostrarán los precios en USD.</template>
            </p>
          </div>

          <div class="space-y-2">
            <div v-for="toggle in TOGGLES" :key="toggle.key" class="flex items-center justify-between">
              <span class="text-sm text-slate-700 dark:text-slate-200">{{ toggle.label }}</span>
              <button
                type="button"
                role="switch"
                :aria-checked="config[toggle.key]"
                class="relative h-6 w-11 rounded-full transition-colors"
                :class="config[toggle.key] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-white/[0.12]'"
                @click="config[toggle.key] = !config[toggle.key]"
              >
                <span
                  class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                  :class="config[toggle.key] ? 'translate-x-5' : ''"
                />
              </button>
            </div>
          </div>

          <div>
            <p class="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Color primario</p>
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="color in BRAND_COLORS"
                :key="color"
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 transition"
                :class="config.brand === color ? 'ring-2 ring-slate-400' : ''"
                :style="{ background: color }"
                :title="color"
                @click="config.brand = color"
              >
                <Check v-if="config.brand === color" :size="14" class="text-white" />
              </button>
              <input
                v-model="config.brand"
                type="color"
                class="h-8 w-10 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
                title="Elegir otro color"
              />
            </div>
          </div>
        </section>

        <!-- Contacto -->
        <section class="space-y-3">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">3. Contacto y redes (pie de página)</h2>
          <label v-for="field in CONTACT_FIELDS" :key="field.key" class="relative block">
            <img
              :src="iconDataUri(field.icon, '#94a3b8')"
              alt=""
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            />
            <input v-model="config.contact[field.key]" type="text" :placeholder="field.placeholder" :class="[inputClass, 'pl-10']" />
          </label>
          <input v-model="config.contact.note" type="text" placeholder="Nota de condiciones" :class="inputClass" />
        </section>
      </div>

      <!-- Acciones -->
      <div class="shrink-0 space-y-2 border-t border-slate-100 dark:border-white/[0.06] p-4">
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 dark:bg-blue-500/10 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="saving || loading || (isEdit && !dirty)"
          @click="save"
        >
          <Save :size="17" />
          {{ saving ? 'Guardando...' : isEdit ? (dirty ? 'Guardar cambios' : 'Todo guardado') : 'Guardar catálogo' }}
        </button>
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!selectedProducts.length || exporting"
          @click="downloadPdf"
        >
          <Download :size="18" />
          {{ exporting ? 'Generando PDF...' : 'Descargar Catálogo PDF' }}
        </button>
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!selectedProducts.length"
          @click="copyWhatsApp"
        >
          <MessageCircle :size="17" /> Copiar formato WhatsApp
        </button>
      </div>
    </aside>

    <!-- Panel derecho: vista previa A4 en tiempo real (65%) -->
    <section class="flex min-h-0 flex-col rounded-xl bg-slate-200/70 dark:bg-white/[0.04]">
      <div class="flex shrink-0 items-center justify-between px-5 py-3 text-xs text-slate-500">
        <span class="font-semibold uppercase tracking-wide">Vista previa (A4)</span>
        <span>{{ selectedProducts.length }} producto(s) · {{ pages.length }} hoja(s)</span>
      </div>

      <div ref="previewBox" class="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-5 [scrollbar-gutter:stable]">
        <div
          v-for="(pageProducts, index) in pages"
          :key="index"
          class="mx-auto aspect-[1/1.414] overflow-hidden bg-white shadow-lg"
          :style="{ width: `${PAGE_W * scale}px` }"
        >
          <div :style="{ width: `${PAGE_W}px`, height: `${PAGE_H}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }">
            <CatalogSheet :products="pageProducts" :page-index="index" :page-count="pages.length" :options="sheetOptions" />
          </div>
        </div>
      </div>
    </section>

    <!-- Hojas sin escalar, solo mientras se exporta (el rasterizado necesita el tamaño real) -->
    <div v-if="exporting" ref="exportRoot" aria-hidden="true" class="pointer-events-none fixed left-[-10000px] top-0">
      <CatalogSheet
        v-for="(pageProducts, index) in pages"
        :key="index"
        :products="pageProducts"
        :page-index="index"
        :page-count="pages.length"
        :options="sheetOptions"
      />
    </div>
  </div>
</template>
