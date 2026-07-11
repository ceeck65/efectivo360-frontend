<template>
  <div class="relative" ref="containerRef">
    <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Buscar o Registrar Producto</label>
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        placeholder="Escribe nombre, SKU o código de barras..."
        @focus="isOpen = true"
        @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrev"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="isOpen = false"
        class="w-full h-10 pl-10 pr-3.5 text-sm border border-slate-300 dark:border-white/[0.08] rounded-lg bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
      <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
    </div>

    <div v-if="isOpen && query && !loading"
      class="absolute z-30 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.08] rounded-lg shadow-xl max-h-80 overflow-y-auto">
      <template v-if="localResults.length > 0">
        <div class="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">En Inventario</div>
        <button v-for="(item, i) in localResults" :key="'local-'+item.id"
          @click="selectLocal(item)"
          @mouseenter="highlightedIndex = flatIndex(i, 'local')"
          class="w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors"
          :class="highlightedIndex === flatIndex(i, 'local') ? 'bg-blue-50 dark:bg-blue-500/[0.12]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'">
          <div class="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
            <Package class="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div class="min-w-0 flex-1">
            <span class="font-medium text-slate-800 dark:text-slate-200 block truncate">{{ item.name }}</span>
            <span class="text-[10px] text-slate-400">{{ item.sku }}<template v-if="item.barcode"> · {{ item.barcode }}</template></span>
          </div>
          <span class="text-xs font-semibold text-emerald-600 whitespace-nowrap">{{ formatStock(item.stock) }} u.</span>
        </button>
      </template>

      <template v-if="globalResults.length > 0">
        <div class="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-white/[0.06]">Banco de Productos — Registrar</div>
        <button v-for="(item, i) in globalResults" :key="'global-'+item.id"
          @click="selectGlobal(item)"
          @mouseenter="highlightedIndex = flatIndex(i, 'global')"
          class="w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors"
          :class="highlightedIndex === flatIndex(i, 'global') ? 'bg-blue-50 dark:bg-blue-500/[0.12]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'">
          <div class="w-7 h-7 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
            <Globe class="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div class="min-w-0 flex-1">
            <span class="font-medium text-slate-800 dark:text-slate-200 block truncate">{{ item.name }}</span>
            <span class="text-[10px] text-slate-400">{{ item.sku }}<template v-if="item.barcode"> · {{ item.barcode }}</template></span>
          </div>
        </button>
      </template>

      <template v-if="localResults.length === 0 && globalResults.length === 0 && query.trim()">
        <button @click="createCustom"
          class="w-full text-left px-3 py-3 text-sm flex items-center gap-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/[0.08] transition-colors font-medium"
          :class="highlightedIndex === -1 ? 'bg-blue-50 dark:bg-blue-500/[0.12]' : ''">
          <Plus class="w-4 h-4" /> Crear producto personalizado "{{ query }}"
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { apiClient } from '@/composables/useApi';
import { Search, Loader2, Package, Globe, Plus } from 'lucide-vue-next';

export interface DualSearchProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  brand?: string;
  brand_id?: string | null;
  brand_display?: string;
  category?: string;
  category_global_id?: number | null;
  stock?: number;
  image_url?: string;
  inventory_type?: string;
  cost_price_usd?: number;
  cost_price_ves?: number;
  base_price_usd?: number;
  base_price_ves?: number;
  description?: string;
  iva_type?: string;
  tax_rate?: string;
  tax_rate_id?: string;
  product_type_id?: string;
  is_igtf_applicable?: boolean;
  unit_display?: string;
  presentacion_display?: string;
  base_unit_stock?: number;
}

const emit = defineEmits<{
  (e: 'select-local', product: DualSearchProduct): void;
  (e: 'select-global', product: DualSearchProduct): void;
  (e: 'create-custom', query: string): void;
}>();

const query = ref('');
const isOpen = ref(false);
const loading = ref(false);
const localResults = ref<DualSearchProduct[]>([]);
const globalResults = ref<DualSearchProduct[]>([]);
const highlightedIndex = ref(-1);
const containerRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

function flatIndex(idx: number, source: 'local' | 'global'): number {
  if (source === 'local') return idx;
  return localResults.value.length + idx;
}

function resultCount(): number {
  return localResults.value.length + globalResults.value.length;
}

watch(query, (v) => {
  if (!v.trim()) {
    localResults.value = [];
    globalResults.value = [];
    isOpen.value = false;
    return;
  }
  debouncedSearch(v);
});

const debouncedSearch = useDebounceFn(async (term: string) => {
  if (!term.trim()) return;
  loading.value = true;
  highlightedIndex.value = -1;
  try {
    const [localRes, globalRes] = await Promise.all([
      apiClient.get('/api/products/', { params: { search: term, page_size: 5 } }),
      apiClient.get('/api/global-products/', { params: { search: term, page_size: 5 } }),
    ]);
    const mapItems = (data: any, source: 'local' | 'global'): DualSearchProduct[] => {
      const items: any[] = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      return items.map((item: any) => ({
        id: item.id,
        name: item.name ?? '',
        sku: item.sku ?? '',
        barcode: item.barcode ?? '',
        brand: item.brand_display ?? item.brand ?? '',
        brand_id: source === 'local' ? (item.brand ?? null) : null,
        brand_display: item.brand_display ?? '',
        category: item.category ?? '',
        category_global_id: item.category_global_id ?? item.global_category ?? null,
        stock: item.current_stock ?? item.base_unit_stock ?? 0,
        image_url: item.image_url ?? '',
        inventory_type: item.inventory_type ?? 'SIMPLE',
        cost_price_usd: item.cost_price_usd ?? 0,
        cost_price_ves: item.cost_price_ves ?? 0,
        base_price_usd: item.base_price_usd ?? 0,
        base_price_ves: item.base_price_ves ?? 0,
        description: item.description ?? '',
        iva_type: item.iva_type ?? 'GENERAL',
        tax_rate: item.tax_rate ?? '',
        tax_rate_id: item.tax_rate_id ?? item.tax_rate ?? null,
        product_type_id: item.product_type_id ?? null,
        is_igtf_applicable: item.is_igtf_applicable ?? false,
        unit_display: item.unit_display ?? '',
        presentacion_display: item.presentacion_display ?? '',
        base_unit_stock: item.base_unit_stock ?? 0,
      }));
    };
    localResults.value = mapItems(localRes.data, 'local');
    globalResults.value = mapItems(globalRes.data, 'global');
    isOpen.value = true;
  } catch {
    localResults.value = [];
    globalResults.value = [];
  } finally {
    loading.value = false;
  }
}, 300);

function selectLocal(product: DualSearchProduct) {
  emit('select-local', product);
  isOpen.value = false;
  nextTick(() => inputRef.value?.blur());
}

function selectGlobal(product: DualSearchProduct) {
  emit('select-global', product);
  isOpen.value = false;
  nextTick(() => inputRef.value?.blur());
}

function createCustom() {
  emit('create-custom', query.value.trim());
  isOpen.value = false;
}

function highlightNext() {
  const total = resultCount();
  if (total === 0) return;
  highlightedIndex.value = (highlightedIndex.value + 1) % total;
}

function highlightPrev() {
  const total = resultCount();
  if (total === 0) return;
  highlightedIndex.value = (highlightedIndex.value - 1 + total) % total;
}

function selectHighlighted() {
  const idx = highlightedIndex.value;
  if (idx < 0) return;
  if (idx < localResults.value.length) {
    selectLocal(localResults.value[idx]);
  } else {
    selectGlobal(globalResults.value[idx - localResults.value.length]);
  }
}

function formatStock(val: number | undefined | null): string {
  if (val == null) return '0';
  return Number(val.toFixed(2)).toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));
</script>
