<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, onBeforeRouteLeave } from 'vue-router';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  ExternalLink,
  Globe,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useAlert } from '@/composables/useAlert';
import { useNotify } from '@/composables/useNotify';
import { parseApiError } from '@/utils/parseApiError';
import { BENEFIT_ICONS } from '@/views/storefront/components/benefitIcons';
import {
  DAY_LONG,
  SORT_OPTIONS,
  STORE_BASE_URL,
  publicStoreUrl,
  type StoreBanner,
  type StoreConfig,
  type StoreFilters,
} from '@/views/storefront/storefront';

interface SettingsResponse {
  is_published: boolean;
  slug: string;
  config: StoreConfig;
  updated_at: string | null;
}

const API = '/api/v1/storefront/';
const { showConfirm } = useAlert();
const { success, error: notifyError } = useNotify();

const loading = ref(true);
const loadError = ref('');
const saving = ref(false);

const isPublished = ref(false);
const slug = ref('');
const savedSlug = ref('');
const config = ref<StoreConfig | null>(null);

// Foto del estado guardado: sirve para saber si hay cambios sin guardar.
const snapshot = ref('');
const currentState = () => JSON.stringify({ p: isPublished.value, s: slug.value, c: config.value });
const dirty = computed(() => !loading.value && currentState() !== snapshot.value);

// ---------- Enlace público (slug) ----------
const slugStatus = reactive({ checking: false, available: true, message: '' });
let slugTimer: ReturnType<typeof setTimeout> | undefined;

// Minúsculas, sin acentos ni espacios: "Repuestos Valenzuela 42" → "repuestos-valenzuela-42".
function normalizeSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 60);
}

watch(slug, (value) => {
  const clean = normalizeSlug(value);
  if (clean !== value) {
    slug.value = clean;
    return;
  }
  clearTimeout(slugTimer);
  if (!value || value === savedSlug.value) {
    Object.assign(slugStatus, { checking: false, available: !!value, message: value ? '' : 'El enlace es requerido.' });
    return;
  }
  slugStatus.checking = true;
  slugTimer = setTimeout(async () => {
    try {
      const res = await fetchApi<{ available: boolean; message: string }>(`${API}slug-check/`, { params: { slug: value } });
      Object.assign(slugStatus, { available: res.available, message: res.message });
    } catch {
      Object.assign(slugStatus, { available: true, message: '' });
    } finally {
      slugStatus.checking = false;
    }
  }, 400);
});

const publicUrl = computed(() => publicStoreUrl(savedSlug.value || slug.value));
// Vista previa en este mismo dominio: funciona aunque la tienda no esté publicada.
const previewUrl = computed(() => `/store/${savedSlug.value}`);
const copied = ref(false);

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(publicUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    notifyError('No se pudo copiar el enlace.');
  }
}

// ---------- Opciones ----------
const BRAND_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#e11d48', '#0f172a'];

const FILTERS: { key: keyof StoreFilters; label: string; hint: string }[] = [
  { key: 'categories', label: 'Categorías', hint: 'Árbol de categorías de tus productos' },
  { key: 'brands', label: 'Marcas', hint: 'Útil en repuestos, ferretería, cosméticos...' },
  { key: 'price', label: 'Rango de precios', hint: 'Deslizador de precio mínimo y máximo' },
  { key: 'budget', label: 'Simulador de presupuesto', hint: '"¿Cuánto quieres gastar?"' },
  { key: 'stock', label: 'Solo en stock', hint: 'Ocultar agotados desde los filtros' },
];

const TOGGLES: { key: 'showSku' | 'showStockQuantity' | 'hideOutOfStock'; label: string; hint: string }[] = [
  { key: 'showSku', label: 'Mostrar código (SKU)', hint: 'Recomendado para repuestos y ferretería' },
  { key: 'showStockQuantity', label: 'Mostrar cantidad en stock', hint: 'Si está apagado solo se ve "Disponible"' },
  { key: 'hideOutOfStock', label: 'Ocultar productos agotados', hint: 'No aparecen en la tienda' },
];

const TIMEZONES = ['America/Caracas', 'America/Bogota', 'America/Panama', 'America/Lima', 'America/Santiago', 'America/Mexico_City', 'America/New_York', 'Europe/Madrid'];
const DAYS = [1, 2, 3, 4, 5, 6, 0];

// ---------- Banners ----------
const MAX_BANNERS = 6;
const uploadingId = ref('');

function addBanner() {
  if (!config.value || config.value.banners.length >= MAX_BANNERS) return;
  config.value.banners.push({
    id: Math.random().toString(36).slice(2, 12),
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    linkLabel: '',
    showOverlay: true,
  });
}

function moveBanner(index: number, delta: number) {
  const list = config.value!.banners;
  const target = index + delta;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
}

function removeBanner(index: number) {
  config.value!.banners.splice(index, 1);
}

async function uploadBannerImage(banner: StoreBanner, event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    notifyError('La imagen no puede pesar más de 8 MB.');
    return;
  }
  uploadingId.value = banner.id;
  try {
    const data = new FormData();
    data.append('image', file);
    const res = await fetchApi<{ url: string }>(`${API}upload-image/`, {
      method: 'POST',
      data,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    banner.imageUrl = res.url;
  } catch (err) {
    notifyError(parseApiError(err) || 'No se pudo subir la imagen.');
  } finally {
    uploadingId.value = '';
  }
}

// ---------- Ventajas ----------
function addBenefit() {
  if (!config.value || config.value.benefits.length >= 3) return;
  config.value.benefits.push({ icon: 'star', title: '', text: '' });
}

// ---------- Horario ----------
type DayMode = 'closed' | 'open' | '24h';

function dayMode(day: number): DayMode {
  const range = config.value!.hours[String(day)];
  if (!range) return 'closed';
  return range[0] === '00:00' && range[1] === '24:00' ? '24h' : 'open';
}

function setDayMode(day: number, mode: DayMode) {
  const hours = config.value!.hours;
  if (mode === 'closed') hours[String(day)] = null;
  else if (mode === '24h') hours[String(day)] = ['00:00', '24:00'];
  else hours[String(day)] = ['08:00', '18:00'];
}

function copyHoursToWeekdays(day: number) {
  const range = config.value!.hours[String(day)];
  [1, 2, 3, 4, 5].forEach((d) => {
    config.value!.hours[String(d)] = range ? [range[0], range[1]] : null;
  });
}

// ---------- SEO ----------
const seoTitlePreview = computed(() => config.value?.seoTitle || [storeName.value, config.value?.tagline].filter(Boolean).join(' | '));
const seoDescriptionPreview = computed(
  () => config.value?.seoDescription || config.value?.description || `Compra en línea en ${storeName.value}. Pide por WhatsApp y paga en USD o bolívares.`
);
const storeName = ref('');

// ---------- Guardar ----------
async function save() {
  if (!config.value) return;
  if (!slug.value || (!slugStatus.available && slug.value !== savedSlug.value)) {
    notifyError(slugStatus.message || 'Revisa el enlace de la tienda.');
    return;
  }
  if (slug.value !== savedSlug.value && savedSlug.value && isPublished.value) {
    const ok = await showConfirm(
      'Cambiar el enlace de la tienda',
      `El enlace anterior (${publicStoreUrl(savedSlug.value)}) dejará de funcionar y los enlaces ya compartidos o indexados en Google se perderán.`,
      'Cambiar enlace'
    );
    if (!ok) return;
  }

  saving.value = true;
  try {
    const res = await fetchApi<SettingsResponse>(`${API}settings/`, {
      method: 'PUT',
      data: { is_published: isPublished.value, slug: slug.value, config: config.value },
    });
    apply(res);
    success(isPublished.value ? 'Tienda guardada y publicada.' : 'Tienda guardada (sin publicar).');
  } catch (err: any) {
    notifyError(parseApiError(err) || 'No se pudo guardar la tienda.');
  } finally {
    saving.value = false;
  }
}

function apply(res: SettingsResponse) {
  isPublished.value = res.is_published;
  savedSlug.value = res.slug;
  slug.value = res.slug;
  config.value = res.config;
  snapshot.value = currentState();
}

function warnBeforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) event.preventDefault();
}

onBeforeRouteLeave(async () => {
  if (!dirty.value) return true;
  return await showConfirm('Tienes cambios sin guardar', '¿Salir de todos modos?', 'Salir');
});

onMounted(async () => {
  window.addEventListener('beforeunload', warnBeforeUnload);
  try {
    const [res, info] = await Promise.all([
      fetchApi<SettingsResponse>(`${API}settings/`),
      fetchApi<any>('/api/v1/tenants/settings/info/').catch(() => null),
    ]);
    storeName.value = info?.commercial_name || info?.name || '';
    apply(res);
    // Si todavía no se configuró el WhatsApp, se propone el teléfono de "Mi Negocio".
    if (!res.config.whatsapp && info?.phone) {
      config.value!.whatsapp = String(info.phone).replace(/\D/g, '').replace(/^580/, '58');
      snapshot.value = currentState();
    }
  } catch (err) {
    loadError.value = parseApiError(err) || 'No se pudo cargar la configuración de la tienda.';
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', warnBeforeUnload);
  clearTimeout(slugTimer);
});

const card = 'rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141824] shadow-sm p-5 space-y-4';
const inputClass =
  'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141824] px-3 py-2 text-sm text-slate-700 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200';
const segmentClass = (active: boolean) =>
  active
    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
    : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.03]';
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-4 p-4 pb-28 md:p-6 md:pb-28">
    <!-- Cabecera -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-lg font-black text-slate-800 dark:text-white">Tienda Pública</h1>
        <p class="text-xs text-slate-400">Tu vitrina en línea con tus productos, filtros y pedidos por WhatsApp</p>
      </div>
      <a
        v-if="savedSlug"
        :href="previewUrl"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141824] px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
      >
        <ExternalLink :size="15" /> {{ isPublished ? 'Ver tienda' : 'Vista previa' }}
      </a>
    </div>

    <div v-if="loading" class="py-16 text-center text-slate-400"><Loader2 :size="22" class="inline-block animate-spin" /></div>
    <p v-else-if="loadError || !config" class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ loadError }}</p>

    <template v-else>
      <!-- 1. Publicación y enlace -->
      <section :class="card">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white"><Globe :size="16" class="text-blue-600" /> Publicación</h2>
            <p class="mt-0.5 text-xs text-slate-400">Mientras no esté publicada, solo tu equipo puede verla (vista previa).</p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="isPublished"
            class="relative h-7 w-12 shrink-0 rounded-full transition-colors"
            :class="isPublished ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/[0.12]'"
            @click="isPublished = !isPublished"
          >
            <span class="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform" :class="isPublished ? 'translate-x-5' : ''" />
          </button>
        </div>

        <div>
          <label :class="labelClass">Enlace de tu tienda</label>
          <div class="flex items-stretch overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.08] focus-within:ring-2 focus-within:ring-blue-500/30">
            <span class="hidden items-center bg-slate-50 dark:bg-white/[0.04] px-3 text-sm text-slate-400 sm:flex">{{ STORE_BASE_URL.replace(/^https?:\/\//, '') }}/</span>
            <input v-model="slug" type="text" maxlength="60" placeholder="mi-tienda" class="min-w-0 flex-1 bg-white dark:bg-[#141824] px-3 py-2 text-sm font-semibold text-slate-700 dark:text-white outline-none" />
            <span class="flex items-center px-3">
              <Loader2 v-if="slugStatus.checking" :size="16" class="animate-spin text-slate-400" />
              <Check v-else-if="slug && slugStatus.available" :size="16" class="text-emerald-500" />
              <X v-else :size="16" class="text-red-500" />
            </span>
          </div>
          <p class="mt-1 text-xs" :class="slugStatus.available ? 'text-slate-400' : 'text-red-600'">
            {{ slugStatus.message || 'Único para tu tienda: letras minúsculas, números y guiones. Es la dirección que verán tus clientes y Google.' }}
          </p>
        </div>

        <div v-if="savedSlug" class="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] px-3 py-2 text-sm">
          <span class="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-200">{{ publicUrl }}</span>
          <button type="button" class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50" @click="copyUrl">
            <component :is="copied ? Check : Copy" :size="13" /> {{ copied ? 'Copiado' : 'Copiar' }}
          </button>
        </div>
        <p class="text-xs text-slate-400">
          El nombre, logo, dirección, teléfono y redes se toman de
          <RouterLink to="/admin/business/console" class="font-semibold text-blue-600 hover:underline">Mi Negocio</RouterLink>.
        </p>
      </section>

      <!-- 2. Presentación -->
      <section :class="card">
        <h2 class="text-sm font-bold text-slate-800 dark:text-white">Presentación</h2>
        <div>
          <label :class="labelClass">Eslogan</label>
          <input v-model="config.tagline" type="text" maxlength="120" placeholder="Ej.: Repuestos originales para tu vehículo" :class="inputClass" />
        </div>
        <div>
          <label :class="labelClass">Descripción</label>
          <textarea v-model="config.description" rows="3" maxlength="500" placeholder="Cuéntale a tus clientes qué vendes y por qué comprarte." :class="inputClass" />
        </div>
        <div>
          <p :class="labelClass">Color de la marca</p>
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
            <input v-model="config.brand" type="color" class="h-8 w-10 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5" title="Elegir otro color" />
          </div>
        </div>
      </section>

      <!-- 3. Diseño -->
      <section :class="card">
        <h2 class="text-sm font-bold text-slate-800 dark:text-white">Diseño</h2>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p :class="labelClass">Vista de productos por defecto</p>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="rounded-xl border p-2.5 text-xs font-semibold" :class="segmentClass(config.productView === 'grid')" @click="config.productView = 'grid'">
                Grilla<span class="block text-[10px] font-normal text-slate-400">Tarjetas con foto grande</span>
              </button>
              <button type="button" class="rounded-xl border p-2.5 text-xs font-semibold" :class="segmentClass(config.productView === 'list')" @click="config.productView = 'list'">
                Lista<span class="block text-[10px] font-normal text-slate-400">Filas con código y stock</span>
              </button>
            </div>
          </div>
          <div>
            <p :class="labelClass">Columnas en computador</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="cols in [3, 4] as const"
                :key="cols"
                type="button"
                class="rounded-xl border p-2.5 text-xs font-semibold"
                :class="segmentClass(config.gridColumns === cols)"
                @click="config.gridColumns = cols"
              >
                {{ cols }} columnas<span class="block text-[10px] font-normal text-slate-400">{{ cols === 3 ? 'Más grande' : 'Más productos a la vista' }}</span>
              </button>
            </div>
          </div>
          <div>
            <p :class="labelClass">Ajuste de las fotos</p>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="rounded-xl border p-2.5 text-xs font-semibold" :class="segmentClass(config.imageFit === 'cover')" @click="config.imageFit = 'cover'">
                Rellenar<span class="block text-[10px] font-normal text-slate-400">Ropa, comida, ambientes</span>
              </button>
              <button type="button" class="rounded-xl border p-2.5 text-xs font-semibold" :class="segmentClass(config.imageFit === 'contain')" @click="config.imageFit = 'contain'">
                Completa<span class="block text-[10px] font-normal text-slate-400">Repuestos y productos con fondo blanco</span>
              </button>
            </div>
          </div>
          <div>
            <p :class="labelClass">Portada (banners)</p>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="rounded-xl border p-2.5 text-xs font-semibold" :class="segmentClass(config.hero === 'carousel')" @click="config.hero = 'carousel'">
                Mostrar<span class="block text-[10px] font-normal text-slate-400">Carrusel arriba</span>
              </button>
              <button type="button" class="rounded-xl border p-2.5 text-xs font-semibold" :class="segmentClass(config.hero === 'none')" @click="config.hero = 'none'">
                Ocultar<span class="block text-[10px] font-normal text-slate-400">Directo a los productos</span>
              </button>
            </div>
          </div>
          <div>
            <label :class="labelClass">Orden por defecto</label>
            <select v-model="config.defaultSort" :class="inputClass">
              <option v-for="option in SORT_OPTIONS" :key="option.key" :value="option.key">{{ option.label }}</option>
            </select>
          </div>
          <div>
            <label :class="labelClass">Moneda de los precios</label>
            <select v-model="config.currencyMode" :class="inputClass">
              <option value="BOTH">USD y bolívares (el cliente elige)</option>
              <option value="USD">Solo USD</option>
              <option value="VES">Solo bolívares</option>
            </select>
          </div>
        </div>

        <div class="space-y-3 border-t border-slate-100 dark:border-white/[0.06] pt-4">
          <div v-for="toggle in TOGGLES" :key="toggle.key" class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm text-slate-700 dark:text-slate-200">{{ toggle.label }}</p>
              <p class="text-xs text-slate-400">{{ toggle.hint }}</p>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="config[toggle.key]"
              class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
              :class="config[toggle.key] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-white/[0.12]'"
              @click="config[toggle.key] = !config[toggle.key]"
            >
              <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" :class="config[toggle.key] ? 'translate-x-5' : ''" />
            </button>
          </div>
        </div>
      </section>

      <!-- 4. Filtros -->
      <section :class="card">
        <div>
          <h2 class="text-sm font-bold text-slate-800 dark:text-white">Filtros</h2>
          <p class="text-xs text-slate-400">Elige los filtros que tienen sentido para tu rubro. Las categorías son las mismas de tus productos.</p>
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <label
            v-for="filter in FILTERS"
            :key="filter.key"
            class="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 dark:border-white/[0.08] p-3 hover:bg-slate-50 dark:hover:bg-white/[0.03]"
          >
            <input v-model="config.filters[filter.key]" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600" />
            <span>
              <span class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ filter.label }}</span>
              <span class="block text-xs text-slate-400">{{ filter.hint }}</span>
            </span>
          </label>
        </div>
      </section>

      <!-- 5. Banners -->
      <section :class="card">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-bold text-slate-800 dark:text-white">Banners de portada</h2>
            <p class="text-xs text-slate-400">Hasta {{ MAX_BANNERS }}. Sin banners se muestra una portada con tu nombre y eslogan. Tamaño sugerido: 1600 × 500 px.</p>
          </div>
          <button
            type="button"
            class="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 disabled:opacity-40"
            :disabled="config.banners.length >= MAX_BANNERS"
            @click="addBanner"
          >
            <Plus :size="14" /> Agregar
          </button>
        </div>

        <div v-for="(banner, index) in config.banners" :key="banner.id" class="space-y-3 rounded-xl border border-slate-200 dark:border-white/[0.08] p-3">
          <div class="flex gap-3">
            <label
              class="relative flex h-24 w-40 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:bg-white/[0.04] text-slate-400 hover:border-blue-400"
              :style="banner.imageUrl ? {} : { background: config.brand, color: '#fff' }"
            >
              <img v-if="banner.imageUrl" :src="banner.imageUrl" alt="" class="absolute inset-0 h-full w-full object-cover" />
              <span v-if="uploadingId === banner.id" class="relative"><Loader2 :size="20" class="animate-spin" /></span>
              <span v-else class="relative flex flex-col items-center gap-1 rounded-md bg-black/30 px-2 py-1 text-[10px] font-semibold text-white">
                <ImagePlus :size="16" /> {{ banner.imageUrl ? 'Cambiar' : 'Subir imagen' }}
              </span>
              <input type="file" accept="image/*" class="hidden" @change="uploadBannerImage(banner, $event)" />
            </label>
            <div class="min-w-0 flex-1 space-y-2">
              <input v-model="banner.title" type="text" maxlength="80" placeholder="Título (ej.: Ofertas de la semana)" :class="inputClass" />
              <input v-model="banner.subtitle" type="text" maxlength="160" placeholder="Subtítulo" :class="inputClass" />
            </div>
            <div class="flex shrink-0 flex-col gap-1">
              <button type="button" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" :disabled="index === 0" title="Subir" @click="moveBanner(index, -1)"><ArrowUp :size="15" /></button>
              <button type="button" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" :disabled="index === config.banners.length - 1" title="Bajar" @click="moveBanner(index, 1)"><ArrowDown :size="15" /></button>
              <button type="button" class="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar" @click="removeBanner(index)"><Trash2 :size="15" /></button>
            </div>
          </div>
          <div class="grid gap-2 sm:grid-cols-[1fr_180px]">
            <input v-model="banner.linkUrl" type="text" placeholder="Enlace del botón (opcional; vacío = ir a los productos)" :class="inputClass" />
            <input v-model="banner.linkLabel" type="text" maxlength="30" placeholder="Texto del botón" :class="inputClass" />
          </div>
          <label v-if="banner.imageUrl" class="flex items-center gap-2 text-xs text-slate-500">
            <input v-model="banner.showOverlay" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600" />
            Oscurecer la imagen para que el texto se lea mejor
          </label>
        </div>
      </section>

      <!-- 6. Ventajas -->
      <section :class="card">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-bold text-slate-800 dark:text-white">Ventajas</h2>
            <p class="text-xs text-slate-400">Hasta 3 mensajes cortos bajo la portada (envíos, garantía, formas de pago...).</p>
          </div>
          <button
            type="button"
            class="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 disabled:opacity-40"
            :disabled="config.benefits.length >= 3"
            @click="addBenefit"
          >
            <Plus :size="14" /> Agregar
          </button>
        </div>
        <div v-for="(benefit, index) in config.benefits" :key="index" class="grid gap-2 sm:grid-cols-[170px_1fr_1fr_auto]">
          <select v-model="benefit.icon" :class="inputClass">
            <option v-for="(item, key) in BENEFIT_ICONS" :key="key" :value="key">{{ item.label }}</option>
          </select>
          <input v-model="benefit.title" type="text" maxlength="40" placeholder="Título" :class="inputClass" />
          <input v-model="benefit.text" type="text" maxlength="80" placeholder="Detalle" :class="inputClass" />
          <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar" @click="config.benefits.splice(index, 1)">
            <Trash2 :size="15" />
          </button>
        </div>
        <p v-if="!config.benefits.length" class="text-xs text-slate-400">Sin ventajas: la franja no se muestra.</p>
      </section>

      <!-- 7. Contacto y horario -->
      <section :class="card">
        <h2 class="text-sm font-bold text-slate-800 dark:text-white">Pedidos, contacto y horario</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label :class="labelClass">WhatsApp para pedidos</label>
            <input v-model="config.whatsapp" type="tel" placeholder="584120000000" :class="inputClass" />
            <p class="mt-1 text-xs text-slate-400">Con código de país, sin espacios ni el 0 de la operadora.</p>
          </div>
          <div>
            <label :class="labelClass">Enlace de Google Maps (opcional)</label>
            <input v-model="config.mapUrl" type="url" placeholder="https://maps.app.goo.gl/..." :class="inputClass" />
          </div>
          <div>
            <label :class="labelClass">Zona horaria</label>
            <select v-model="config.timezone" :class="inputClass">
              <option v-for="tz in TIMEZONES" :key="tz" :value="tz">{{ tz }}</option>
            </select>
          </div>
        </div>

        <div class="overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.08]">
          <div
            v-for="day in DAYS"
            :key="day"
            class="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-white/[0.06] px-3 py-2 last:border-b-0"
          >
            <span class="w-24 text-sm font-medium text-slate-700 dark:text-slate-200">{{ DAY_LONG[day] }}</span>
            <select :value="dayMode(day)" class="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141824] px-2 py-1 text-sm" @change="setDayMode(day, ($event.target as HTMLSelectElement).value as DayMode)">
              <option value="open">Abierto</option>
              <option value="24h">24 horas</option>
              <option value="closed">Cerrado</option>
            </select>
            <template v-if="dayMode(day) === 'open'">
              <input v-model="config.hours[String(day)]![0]" type="time" class="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141824] px-2 py-1 text-sm" />
              <span class="text-xs text-slate-400">a</span>
              <input v-model="config.hours[String(day)]![1]" type="time" class="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141824] px-2 py-1 text-sm" />
            </template>
            <button
              v-if="day === 1"
              type="button"
              class="ml-auto text-xs font-semibold text-blue-600 hover:underline"
              @click="copyHoursToWeekdays(1)"
            >
              Copiar a lunes–viernes
            </button>
          </div>
        </div>

        <div>
          <label :class="labelClass">Nota del pie de página</label>
          <input v-model="config.footerNote" type="text" maxlength="300" placeholder="Ej.: Precios sujetos a cambio sin previo aviso." :class="inputClass" />
        </div>
      </section>

      <!-- 8. SEO -->
      <section :class="card">
        <div>
          <h2 class="text-sm font-bold text-slate-800 dark:text-white">Buscadores (SEO)</h2>
          <p class="text-xs text-slate-400">Así podría verse tu tienda en Google. Si los dejas vacíos se usan tu nombre, eslogan y descripción.</p>
        </div>
        <div class="rounded-xl border border-slate-200 dark:border-white/[0.08] p-3">
          <p class="truncate text-xs text-slate-500">{{ publicUrl }}</p>
          <p class="truncate text-lg text-[#1a0dab] dark:text-blue-300">{{ seoTitlePreview || 'Mi tienda' }}</p>
          <p class="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{{ seoDescriptionPreview }}</p>
        </div>
        <div>
          <label :class="labelClass">Título para buscadores <span class="text-xs font-normal text-slate-400">({{ config.seoTitle.length }}/70)</span></label>
          <input v-model="config.seoTitle" type="text" maxlength="70" :class="inputClass" />
        </div>
        <div>
          <label :class="labelClass">Descripción para buscadores <span class="text-xs font-normal text-slate-400">({{ config.seoDescription.length }}/160)</span></label>
          <textarea v-model="config.seoDescription" rows="2" maxlength="160" :class="inputClass" />
        </div>
      </section>
    </template>

    <!-- Barra de guardado -->
    <div
      v-if="config"
      class="fixed bottom-4 left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#141824]/95 px-4 py-3 shadow-xl backdrop-blur"
    >
      <p class="text-xs text-slate-500">
        <span v-if="dirty" class="font-semibold text-amber-600">Cambios sin guardar</span>
        <span v-else>{{ isPublished ? 'Tienda publicada' : 'Tienda sin publicar' }}</span>
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        :disabled="saving || !dirty || slugStatus.checking"
        @click="save"
      >
        <Loader2 v-if="saving" :size="16" class="animate-spin" />
        <Save v-else :size="16" />
        {{ saving ? 'Guardando...' : 'Guardar' }}
      </button>
    </div>
  </div>
</template>
