<template>
  <div class="relative" ref="containerRef">
    <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
      Marca de Producto
    </label>
    <button type="button" @click="toggle"
      class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] rounded-lg flex items-center justify-between transition-colors bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200">
      <span class="truncate text-left pr-2">{{ selected?.name || 'Sin marca' }}</span>
      <ChevronDown class="w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform" :class="{ 'rotate-180': open }" />
    </button>

    <div v-if="open" data-brand-dropdown
      class="fixed z-[200] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.08] rounded-lg shadow-xl overflow-hidden"
      :style="dropdownStyle">
      <div class="p-2 border-b border-slate-100 dark:border-white/[0.06]">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input v-model="query" type="text" placeholder="Buscar marca..."
            class="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 dark:border-white/[0.08] rounded-md bg-slate-50 dark:bg-white/[0.03] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400" />
        </div>
      </div>

      <div class="max-h-60 overflow-y-auto py-1">
        <button v-if="modelValue != null" @click="select(null)"
          class="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors italic">
          Sin marca
        </button>

        <div v-if="loading" class="px-3 py-4 text-center text-xs text-slate-400">Buscando...</div>
        <template v-else>
          <div v-if="results.length === 0 && !canCreate" class="px-3 py-4 text-center text-xs text-slate-400">Sin resultados</div>
          <button v-for="b in results" :key="b.id" @click="select(b)"
            class="w-full text-left px-3 py-1.5 text-sm hover:bg-cyan-50 dark:hover:bg-cyan-500/[0.08] transition-colors flex items-center justify-between gap-2"
            :class="modelValue === b.id ? 'bg-cyan-50 dark:bg-cyan-500/[0.12] text-cyan-700 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-300'">
            <span class="truncate">{{ b.name }}</span>
          </button>

          <button v-if="canCreate" @click="createAndSelect"
            :disabled="creating"
            class="w-full text-left px-3 py-2 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/[0.08] transition-colors flex items-center gap-1.5 border-t border-slate-100 dark:border-white/[0.06] disabled:opacity-50">
            <Loader2 v-if="creating" class="w-3.5 h-3.5 animate-spin shrink-0" />
            <Plus v-else class="w-3.5 h-3.5 shrink-0" />
            <span class="truncate">Agregar nueva marca "{{ query.trim() }}"</span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { ChevronDown, Search, Plus, Loader2 } from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

interface BrandOption {
  id: string | number;
  name: string;
}

const props = defineProps<{
  modelValue: string | number | null;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number | null): void;
  (e: 'select', brand: BrandOption | null): void;
}>();

const { error: notifyError } = useNotify();

const open = ref(false);
const query = ref('');
const loading = ref(false);
const creating = ref(false);
const results = ref<BrandOption[]>([]);
const selected = ref<BrandOption | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});

const canCreate = computed(() => {
  const term = query.value.trim();
  if (!term) return false;
  return !results.value.some((b) => b.name.toLowerCase() === term.toLowerCase());
});

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
    maxHeight: '280px',
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
    const params: Record<string, string> = { page_size: '50' };
    if (search?.trim()) params.search = search.trim();
    const queryString = new URLSearchParams(params).toString();
    const res = await fetchApi<any>(`/api/v1/catalog/brands/?${queryString}`);
    const raw = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
    results.value = raw.map((b: any) => ({ id: b.id, name: b.name }));
  } catch {
    results.value = [];
  } finally {
    loading.value = false;
  }
}

function select(b: BrandOption | null) {
  selected.value = b;
  emit('update:modelValue', b?.id ?? null);
  emit('select', b);
  open.value = false;
  query.value = '';
}

async function createAndSelect() {
  const name = query.value.trim();
  if (!name || creating.value) return;
  creating.value = true;
  try {
    const created = await fetchApi<any>('/api/v1/catalog/brands/', {
      method: 'POST',
      data: { name },
    });
    const brand: BrandOption = { id: created.id, name: created.name };
    select(brand);
  } catch (e: any) {
    const msg = e?.data?.name?.[0] || e?.message || 'No se pudo crear la marca';
    notifyError(msg);
  } finally {
    creating.value = false;
  }
}

function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    const panel = document.querySelector('[data-brand-dropdown]');
    if (panel?.contains(e.target as Node)) return;
    open.value = false;
  }
}

// Resolve the initial display label when a modelValue is preset without a matching `select` event.
watch(() => props.modelValue, async (id) => {
  if (!id) {
    selected.value = null;
    return;
  }
  if (selected.value?.id === id) return;
  if (results.value.length === 0) await fetchResults();
  selected.value = results.value.find((b) => b.id === id) || selected.value;
}, { immediate: true });

onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));
</script>
