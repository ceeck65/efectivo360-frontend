<template>
  <div class="max-w-xl mx-auto">
    <!-- Error banner -->
    <div v-if="errorMessage"
      class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
      <AlertCircle class="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-red-800">Error al registrar movimiento</p>
        <p class="text-sm text-red-600 mt-0.5">{{ errorMessage }}</p>
      </div>
      <button @click="errorMessage = ''" class="text-red-400 hover:text-red-600">
        <X class="w-4 h-4" />
      </button>
    </div>

    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm">
      <!-- Header -->
      <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div class="p-2 rounded-lg" :class="headerIconBg">
          <ArrowLeftRight class="w-5 h-5" :class="headerIconColor" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-slate-800">Registrar Movimiento</h2>
          <p class="text-xs text-slate-400">Entrada / Salida / Ajuste de inventario</p>
        </div>
      </div>

      <div class="p-5 space-y-5">
        <!-- Producto -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Producto</label>
          <div class="relative" ref="productSearchRef">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="productQuery"
                type="text"
                placeholder="Buscar producto por nombre o SKU..."
                @focus="productOpen = true"
                @keydown.down.prevent="productHighlightNext"
                @keydown.up.prevent="productHighlightPrev"
                @keydown.enter.prevent="productSelectHighlighted"
                @keydown.escape="productOpen = false"
                class="w-full h-11 pl-10 pr-3.5 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
              <div v-if="productLoading"
                class="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 class="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            </div>
            <div v-if="productOpen && productResults.length > 0"
              class="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              <button
                v-for="(item, i) in productResults"
                :key="item.id"
                @click="productSelect(item)"
                @mouseenter="productHighlightedIndex = i"
                class="w-full text-left px-3.5 py-3 border-b border-slate-100 last:border-0 transition-colors"
                :class="i === productHighlightedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'"
              >
                <div class="flex justify-between items-center gap-3">
                  <div class="min-w-0">
                    <span class="text-sm font-semibold text-slate-800 block truncate">{{ item.name }}</span>
                    <span class="text-xs text-slate-400">SKU: {{ item.sku }}</span>
                  </div>
                  <span class="text-xs font-medium text-slate-500 whitespace-nowrap">{{ item.currentStock }} u.</span>
                </div>
              </button>
            </div>
            <div v-else-if="productOpen && productQuery && !productLoading && productResults.length === 0"
              class="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center text-sm text-slate-400">
              Sin resultados para "{{ productQuery }}"
            </div>
          </div>
          <div v-if="selectedProduct"
            class="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
            <Package class="w-4 h-4 text-blue-500" />
            <span class="text-sm font-medium text-blue-700">{{ selectedProduct.name }}</span>
            <button @click="clearProduct" class="ml-auto text-slate-400 hover:text-slate-600">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Variantes -->
        <div v-if="selectedProduct?.hasVariants && variants.length > 0">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Variante</label>
          <select
            v-model="form.product_ulid"
            class="w-full h-11 px-3.5 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          >
            <option value="" disabled>Seleccione una variante</option>
            <option v-for="v in variants" :key="v.id" :value="v.id">
              {{ v.variantLabel }}
            </option>
          </select>
          <p class="mt-1 text-xs text-slate-400">Seleccione la combinación exacta de talla / color</p>
        </div>

        <!-- Almacén -->
        <div v-if="isCorporatePlan">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Almacén</label>
          <select
            v-model="form.warehouse_ulid"
            class="w-full h-11 px-3.5 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          >
            <option value="" disabled>Seleccione un almacén</option>
            <option v-for="w in warehouses" :key="w.id" :value="w.id">
              {{ w.name }}
            </option>
          </select>
        </div>

        <!-- Ubicación (pasillo / estante) -->
        <div v-if="form.warehouse_ulid && locations.length > 0">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Ubicación <span class="text-slate-400 font-normal">(opcional)</span></label>
          <select
            v-model="form.location_ulid"
            class="w-full h-11 px-3.5 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          >
            <option :value="null">Sin ubicación</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">
              {{ loc.label }}
            </option>
          </select>
        </div>

        <!-- Lote / Trazabilidad -->
        <div v-if="selectedProduct?.requiresBatch">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Lote <span class="text-red-500">*</span></label>
          <div class="flex gap-2">
            <input
              v-model="batchInput"
              type="text"
              placeholder="Número de lote"
              class="flex-1 h-11 px-3.5 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            <button
              v-if="batchInput && selectedBatch"
              @click="clearBatch"
              class="px-3 text-sm text-slate-500 hover:text-slate-700"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <div v-if="productBatches.length > 0"
            class="mt-2 grid grid-cols-2 gap-1.5">
            <button
              v-for="b in productBatches"
              :key="b.id"
              @click="selectBatch(b)"
              class="text-left px-3 py-2 text-sm border rounded-lg transition-colors"
              :class="form.batch_ulid === b.id
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
            >
              <span class="font-medium">{{ b.batchNumber }}</span>
              <span v-if="b.expirationDate" class="block text-xs text-slate-400">Vence: {{ b.expirationDate }}</span>
            </button>
          </div>
        </div>

        <!-- Tipo de Movimiento -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Movimiento</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="mt in movementTypes"
              :key="mt.value"
              @click="form.movement_type = mt.value"
              class="flex items-center justify-center gap-1.5 h-11 px-3 text-sm font-semibold rounded-xl border-2 transition-all"
              :class="form.movement_type === mt.value
                ? mt.activeClass
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
            >
              <component :is="mt.icon" class="w-4 h-4" />
              {{ mt.label }}
            </button>
          </div>
        </div>

        <!-- Cantidad -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Cantidad</label>
          <div class="flex items-center gap-0 border border-slate-300 rounded-xl overflow-hidden bg-white">
            <button
              @click="decrementQuantity"
              :disabled="form.quantity_change <= 0.001"
              class="flex items-center justify-center w-12 h-12 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Minus class="w-5 h-5" />
            </button>
            <input
              v-model.number="form.quantity_change"
              type="number"
              step="1"
              min="0.001"
              class="flex-1 h-12 text-center text-lg font-semibold text-slate-800 border-x border-slate-200 bg-white focus:outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              @click="form.quantity_change = Math.round((form.quantity_change + 1) * 1000) / 1000"
              class="flex items-center justify-center w-12 h-12 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <Plus class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Referencia -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Referencia <span class="text-slate-400 font-normal">(opcional)</span></label>
          <input
            v-model="form.reference_id"
            type="text"
            placeholder="Ej: FAC-00123, ORD-045"
            class="w-full h-11 px-3.5 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-4 border-t border-slate-100">
        <button
          @click="submit"
          :disabled="!canSubmit || loading"
          class="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all"
          :class="submitButtonClass"
        >
          <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
          <component :is="submitIcon" v-else class="w-5 h-5" />
          {{ submitLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { apiClient } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import {
  Search, X, Package, Loader2,
  ArrowLeftRight, Plus, Minus,
  AlertCircle, ArrowDown, ArrowUp,
  RotateCcw,
} from 'lucide-vue-next';

const props = defineProps<{
  isCorporatePlan: boolean;
  defaultWarehouseUlid: string;
}>();

const emit = defineEmits<{
  (e: 'created', movement: { ulid: string; movement_type: string }): void;
}>();

const { success, error: notifyError } = useNotify();

// ── Form state ──────────────────────────────────────────

const form = reactive({
  product_ulid: '',
  warehouse_ulid: props.isCorporatePlan ? '' : props.defaultWarehouseUlid,
  location_ulid: null as string | null,
  batch_ulid: null as string | null,
  movement_type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
  quantity_change: 1,
  reference_id: '',
});

const loading = ref(false);
const errorMessage = ref('');

// ── Movement type options ───────────────────────────────

const movementTypes = [
  {
    value: 'IN' as const, label: 'Entrada',
    icon: ArrowDown, activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  },
  {
    value: 'OUT' as const, label: 'Salida',
    icon: ArrowUp, activeClass: 'border-red-500 bg-red-50 text-red-700',
  },
  {
    value: 'ADJUSTMENT' as const, label: 'Ajuste',
    icon: RotateCcw, activeClass: 'border-slate-500 bg-slate-50 text-slate-700',
  },
];

const submitButtonClass = computed(() => {
  const base = 'w-full h-12 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all';
  if (loading.value) return `${base} bg-slate-300 text-slate-500 cursor-wait`;
  if (!canSubmit.value) return `${base} bg-slate-200 text-slate-400 cursor-not-allowed`;
  switch (form.movement_type) {
    case 'IN': return `${base} bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800`;
    case 'OUT': return `${base} bg-red-600 text-white hover:bg-red-700 active:bg-red-800`;
    case 'ADJUSTMENT': return `${base} bg-slate-700 text-white hover:bg-slate-800 active:bg-slate-900`;
  }
});

const submitIcon = computed(() => {
  switch (form.movement_type) {
    case 'IN': return ArrowDown;
    case 'OUT': return ArrowUp;
    case 'ADJUSTMENT': return RotateCcw;
  }
});

const submitLabel = computed(() => {
  if (loading.value) return 'Registrando...';
  switch (form.movement_type) {
    case 'IN': return 'Registrar Entrada';
    case 'OUT': return 'Registrar Salida';
    case 'ADJUSTMENT': return 'Registrar Ajuste';
  }
});

const headerIconBg = computed(() => {
  switch (form.movement_type) {
    case 'IN': return 'bg-emerald-100';
    case 'OUT': return 'bg-red-100';
    case 'ADJUSTMENT': return 'bg-slate-100';
  }
});

const headerIconColor = computed(() => {
  switch (form.movement_type) {
    case 'IN': return 'text-emerald-600';
    case 'OUT': return 'text-red-600';
    case 'ADJUSTMENT': return 'text-slate-600';
  }
});

const canSubmit = computed(() => {
  if (!form.product_ulid) return false;
  if (selectedProduct.value?.hasVariants) {
    const parent = productLookup.value?.id;
    if (form.product_ulid === parent) return false;
  }
  if (props.isCorporatePlan && !form.warehouse_ulid) return false;
  if (selectedProduct.value?.requiresBatch && !form.batch_ulid) return false;
  if (form.quantity_change <= 0) return false;
  return true;
});

// ── Quantity helpers ────────────────────────────────────

function decrementQuantity() {
  if (form.quantity_change <= 0.001) return;
  if (form.quantity_change <= 1) {
    form.quantity_change = Math.round((form.quantity_change - 0.1) * 1000) / 1000;
  } else {
    form.quantity_change = Math.round((form.quantity_change - 1) * 1000) / 1000;
  }
  if (form.quantity_change < 0.001) form.quantity_change = 0.001;
}

// ── Product search ─────────────────────────────────────

interface ProductSearchResult {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  hasVariants: boolean;
  requiresBatch: boolean;
}

const productQuery = ref('');
const productOpen = ref(false);
const productLoading = ref(false);
const productResults = ref<ProductSearchResult[]>([]);
const productHighlightedIndex = ref(-1);
const productSearchRef = ref<HTMLElement | null>(null);
const selectedProduct = ref<ProductSearchResult | null>(null);
const productLookup = ref<{ id: string } | null>(null);

const debouncedProductSearch = useDebounceFn(async (term: string) => {
  if (!term.trim()) return;
  productLoading.value = true;
  try {
    const res = await apiClient.get('/api/products/', {
      params: { search: term, page_size: 20 },
    });
    const data = res.data;
    const items: any[] = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
    productResults.value = items.map((item: any) => ({
      id: item.id,
      name: item.name ?? '',
      sku: item.sku ?? '',
      currentStock: item.current_stock ?? item.base_unit_stock ?? 0,
      hasVariants: item.product_type?.has_variants ?? item.has_variants ?? false,
      requiresBatch: item.track_lots ?? false,
    }));
    productHighlightedIndex.value = -1;
    productOpen.value = true;
  } catch {
    productResults.value = [];
  } finally {
    productLoading.value = false;
  }
}, 300);

watch(productQuery, (v) => {
  if (!v.trim()) {
    productResults.value = [];
    productOpen.value = false;
    return;
  }
  debouncedProductSearch(v);
});

function productSelect(item: ProductSearchResult) {
  selectedProduct.value = item;
  productQuery.value = item.name;
  productLookup.value = { id: item.id };
  form.product_ulid = item.id;
  form.batch_ulid = null;
  batchInput.value = '';
  productOpen.value = false;
  loadVariants(item.id);
  loadBatches(item.id);
  nextTick(() => (document.activeElement as HTMLElement)?.blur());
}

function clearProduct() {
  selectedProduct.value = null;
  productLookup.value = null;
  productQuery.value = '';
  form.product_ulid = '';
  form.batch_ulid = null;
  batchInput.value = '';
  variants.value = [];
  productBatches.value = [];
}

function productHighlightNext() {
  if (productResults.value.length === 0) return;
  productHighlightedIndex.value = (productHighlightedIndex.value + 1) % productResults.value.length;
}

function productHighlightPrev() {
  if (productResults.value.length === 0) return;
  productHighlightedIndex.value = (productHighlightedIndex.value - 1 + productResults.value.length) % productResults.value.length;
}

function productSelectHighlighted() {
  if (productHighlightedIndex.value >= 0 && productHighlightedIndex.value < productResults.value.length) {
    productSelect(productResults.value[productHighlightedIndex.value]);
  }
}

function onClickOutside(e: MouseEvent) {
  if (productSearchRef.value && !productSearchRef.value.contains(e.target as Node)) {
    productOpen.value = false;
  }
}

onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));

// ── Variants ────────────────────────────────────────────

interface Variant {
  id: string;
  variantLabel: string;
}

const variants = ref<Variant[]>([]);

async function loadVariants(productId: string) {
  variants.value = [];
  try {
    const res = await apiClient.get(`/api/products/${productId}/variants/`);
    const data = res.data;
    const items: any[] = data?.results ?? data ?? [];
    variants.value = items.map((v: any) => ({
      id: v.id,
      variantLabel: v.variant_label ?? v.name ?? v.sku ?? '',
    }));
  } catch {
    variants.value = [];
  }
}

// ── Warehouses ──────────────────────────────────────────

interface Warehouse {
  id: string;
  name: string;
}

const warehouses = ref<Warehouse[]>([]);

onMounted(async () => {
  try {
    const res = await apiClient.get('/api/inventory/warehouses/');
    const data = res.data;
    const items: any[] = data?.results ?? data ?? [];
    warehouses.value = items.map((w: any) => ({ id: w.id, name: w.name }));
  } catch {
    warehouses.value = [];
  }

  if (!props.isCorporatePlan && props.defaultWarehouseUlid) {
    form.warehouse_ulid = props.defaultWarehouseUlid;
  }
});

// ── Locations ───────────────────────────────────────────

interface Location {
  id: string;
  label: string;
}

const locations = ref<Location[]>([]);

watch(() => form.warehouse_ulid, async (warehouseId) => {
  locations.value = [];
  form.location_ulid = null;
  if (!warehouseId) return;
  try {
    const res = await apiClient.get(`/api/inventory/warehouses/${warehouseId}/locations/`);
    const data = res.data;
    const items: any[] = data?.results ?? data ?? [];
    locations.value = items.map((loc: any) => ({
      id: loc.id,
      label: [loc.aisle, loc.rack, loc.tier].filter(Boolean).join(' / '),
    }));
  } catch {
    locations.value = [];
  }
});

// ── Batches ─────────────────────────────────────────────

interface Batch {
  id: string;
  batchNumber: string;
  expirationDate: string | null;
}

const productBatches = ref<Batch[]>([]);
const batchInput = ref('');
const selectedBatch = computed(() =>
  productBatches.value.find((b) => b.id === form.batch_ulid) ?? null,
);

async function loadBatches(productId: string) {
  productBatches.value = [];
  if (!productId) return;
  try {
    const res = await apiClient.get(`/api/products/${productId}/batches/`);
    const data = res.data;
    const items: any[] = data?.results ?? data ?? [];
    productBatches.value = items.map((b: any) => ({
      id: b.id,
      batchNumber: b.batch_number ?? b.lot_number ?? '',
      expirationDate: b.expiration_date ?? b.expiry_date ?? null,
    }));
  } catch {
    productBatches.value = [];
  }
}

function selectBatch(b: Batch) {
  form.batch_ulid = b.id;
  batchInput.value = b.batchNumber;
}

function clearBatch() {
  form.batch_ulid = null;
  batchInput.value = '';
}

// ── Submit ──────────────────────────────────────────────

async function submit() {
  if (!canSubmit.value || loading.value) return;
  loading.value = true;
  errorMessage.value = '';

  try {
    const payload: Record<string, unknown> = {
      product_ulid: form.product_ulid,
      warehouse_ulid: form.warehouse_ulid,
      location_ulid: form.location_ulid ?? null,
      batch_ulid: form.batch_ulid ?? null,
      movement_type: form.movement_type,
      quantity_change: form.quantity_change,
    };
    if (form.reference_id) {
      payload.reference_id = form.reference_id;
    }

    const result = await apiClient.post('/api/inventory/movements/create/', payload);
    const movement = result.data;
    success('Movimiento registrado exitosamente');
    emit('created', movement);

    resetForm();
  } catch (err: any) {
    const status = err?.response?.status ?? err?.status ?? 0;
    const data = err?.response?.data ?? err?.data ?? {};
    const msg = data?.error ?? data?.message ?? err?.message ?? 'Error al registrar movimiento';

    if (status === 400 && msg.toLowerCase().includes('insufficient stock')) {
      errorMessage.value = msg;
    } else {
      notifyError(msg);
    }
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.product_ulid = '';
  form.location_ulid = null;
  form.batch_ulid = null;
  form.movement_type = 'IN';
  form.quantity_change = 1;
  form.reference_id = '';
  selectedProduct.value = null;
  productLookup.value = null;
  productQuery.value = '';
  variants.value = [];
  productBatches.value = [];
  batchInput.value = '';
}
</script>
