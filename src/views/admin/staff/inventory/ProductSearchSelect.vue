<template>
  <div class="relative" ref="containerRef">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        placeholder="Buscar producto por nombre, marca o SKU..."
        @focus="isOpen = true"
        @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrev"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="isOpen = false"
        class="w-full h-10 pl-10 pr-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>

    <div v-if="isOpen && results.length > 0"
      class="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
      <button
        v-for="(item, i) in results"
        :key="item.id"
        @click="select(item)"
        @mouseenter="highlightedIndex = i"
        class="w-full text-left px-3 py-2.5 border-b border-slate-100 last:border-0 transition-colors"
        :class="i === highlightedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'"
      >
        <div class="flex justify-between items-center gap-3">
          <div class="min-w-0">
            <span class="text-sm font-semibold text-slate-800 block truncate">{{ item.name }}</span>
            <span class="text-xs text-slate-400">{{ item.brand || 'Sin Marca' }} &middot; SKU: {{ item.sku }}</span>
          </div>
          <span class="text-sm font-medium text-slate-700 whitespace-nowrap">{{ formatStock(item.current_stock) }} u.</span>
        </div>
      </button>
    </div>
    <div v-else-if="isOpen && query && !loading && results.length === 0"
      class="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-center text-sm text-slate-400">
      Sin resultados para "{{ query }}"
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { apiClient } from '@/composables/useApi';
import { Search } from 'lucide-vue-next';

interface SearchResult {
  id: string;
  name: string;
  sku: string;
  brand: string;
  current_stock: number;
}

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'select', product: SearchResult): void;
}>();

const query = ref(props.modelValue);
const isOpen = ref(false);
const loading = ref(false);
const results = ref<SearchResult[]>([]);
const highlightedIndex = ref(-1);
const containerRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

watch(() => props.modelValue, (v) => {
  query.value = v;
});

watch(query, (v) => {
  emit('update:modelValue', v);
  if (!v.trim()) {
    results.value = [];
    isOpen.value = false;
    return;
  }
  debouncedSearch(v);
});

const debouncedSearch = useDebounceFn(async (term: string) => {
  if (!term.trim()) return;
  loading.value = true;
  try {
    const res = await apiClient.get('/api/products/', {
      params: { search: term, page_size: 20 },
    });
    const data = res.data;
    const items: any[] = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
    results.value = items.map((item: any) => ({
      id: item.id,
      name: item.name ?? '',
      sku: item.sku ?? '',
      brand: item.brand ?? '',
      current_stock: item.current_stock ?? item.base_unit_stock ?? 0,
    }));
    highlightedIndex.value = -1;
    isOpen.value = true;
  } catch {
    results.value = [];
  } finally {
    loading.value = false;
  }
}, 300);

function select(item: SearchResult) {
  emit('select', item);
  query.value = item.name;
  isOpen.value = false;
  nextTick(() => inputRef.value?.blur());
}

function highlightNext() {
  if (results.value.length === 0) return;
  highlightedIndex.value = (highlightedIndex.value + 1) % results.value.length;
}

function highlightPrev() {
  if (results.value.length === 0) return;
  highlightedIndex.value = (highlightedIndex.value - 1 + results.value.length) % results.value.length;
}

function selectHighlighted() {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < results.value.length) {
    select(results.value[highlightedIndex.value]);
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
