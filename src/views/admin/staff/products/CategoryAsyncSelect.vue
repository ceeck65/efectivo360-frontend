<template>
  <div class="relative" ref="containerRef">
    <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Categoría <span class="text-red-400">*</span></label>
    <button type="button" @click="toggle"
      class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] rounded-lg flex items-center justify-between transition-colors bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200">
      <span class="truncate text-left pr-2">{{ selected?.name || 'Seleccionar categoría...' }}</span>
      <ChevronDown class="w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform" :class="{ 'rotate-180': open }" />
    </button>

    <div v-if="open" data-cat-dropdown
      class="fixed z-[200] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.08] rounded-lg shadow-xl overflow-hidden"
      :style="dropdownStyle">
      <div class="p-2 border-b border-slate-100 dark:border-white/[0.06]">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input v-model="query" type="text" placeholder="Buscar categoría..."
            class="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 dark:border-white/[0.08] rounded-md bg-slate-50 dark:bg-white/[0.03] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
      </div>
      <div v-if="loading" class="px-3 py-4 text-center text-xs text-slate-400">Buscando...</div>
      <div v-else-if="results.length === 0" class="px-3 py-4 text-center text-xs text-slate-400">Sin resultados</div>
      <div v-else class="max-h-60 overflow-y-auto py-1">
        <button v-for="node in results" :key="node.id"
          @click="select(node)"
          class="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-500/[0.08] transition-colors flex items-center gap-2"
          :style="{ paddingLeft: (node._depth * 12 + 12) + 'px' }"
          :class="$props.modelValue === node.id ? 'bg-blue-50 dark:bg-blue-500/[0.12] text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'">
          <span v-if="node._depth > 0" class="text-slate-300 text-[10px] shrink-0">{{ '·'.repeat(Math.min(node._depth, 3)) }}</span>
          <span class="truncate">{{ node.name }}</span>
          <span class="text-[10px] text-slate-400 font-mono ml-auto shrink-0">{{ node.code }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { fetchApi } from '@/composables/useApi';
import { Search, ChevronDown } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

interface CategoryNode {
  id: number | string;
  name: string;
  code?: string;
  _depth: number;
  children?: CategoryNode[];
}

interface FlatCategory extends CategoryNode {
  _depth: number;
}

defineProps<{
  modelValue: number | string | null;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: number | string | null): void;
  (e: 'select', category: FlatCategory): void;
}>();

const open = ref(false);
const query = ref('');
const loading = ref(false);
const results = ref<FlatCategory[]>([]);
const selected = ref<FlatCategory | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});
const authStore = useAuthStore();

function toggle() {
  open.value = !open.value;
  if (open.value) {
    nextTick(() => updatePosition());
    if (!query.value) fetchResults();
  }
}

function updatePosition() {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  dropdownStyle.value = {
    top: (rect.bottom + 4) + 'px',
    left: rect.left + 'px',
    width: rect.width + 'px',
    maxHeight: '260px',
  };
}

const debouncedSearch = useDebounceFn((term: string) => {
  fetchResults(term);
}, 300);

watch(query, (v) => {
  if (!open.value) return;
  debouncedSearch(v);
});

async function fetchResults(search?: string) {
  loading.value = true;
  try {
    const params: Record<string, any> = { page_size: 1000 };
    if (search?.trim()) params.search = search;

    const tid = authStore.tenantUlid;
    if (tid) {
      params.tenant_id = tid;
    }

    const queryString = new URLSearchParams(params).toString();
    const url = `/api/v1/catalog/categories/${queryString ? '?' + queryString : ''}`;
    const res = await fetchApi<any>(url);
    const raw = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
    const flat: FlatCategory[] = [];
    function walk(nodes: any[], depth: number) {
      for (const n of nodes) {
        flat.push({ id: n.id, name: n.name, code: n.code, _depth: depth });
        if (n.children) walk(n.children, depth + 1);
      }
    }
    walk(raw, 0);
    results.value = flat;
  } catch {
    results.value = [];
  } finally {
    loading.value = false;
  }
}

function select(node: FlatCategory) {
  selected.value = node;
  emit('update:modelValue', node.id);
  emit('select', node);
  open.value = false;
  query.value = '';
}

function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    const panel = document.querySelector('[data-cat-dropdown]');
    if (panel?.contains(e.target as Node)) return;
    open.value = false;
  }
}

onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));
</script>
