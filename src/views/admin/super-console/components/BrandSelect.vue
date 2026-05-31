<template>
  <div class="relative" ref="wrapperRef">
    <!-- Select trigger -->
    <button
      type="button"
      @click="open = !open"
      class="w-full h-9 px-3 text-sm border rounded-lg flex items-center justify-between transition-colors"
      :class="modelValue
        ? 'border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200'
        : 'border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-400'"
    >
      <span class="truncate">{{ modelValue ? selectedLabel : placeholder }}</span>
      <ChevronDown class="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" :class="{ 'rotate-180': open }" />
    </button>

    <!-- Dropdown -->
    <div
      v-if="open"
      class="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-[#1a1f2e] border border-slate-200 dark:border-white/[0.06] rounded-lg shadow-lg overflow-hidden"
    >
      <!-- Search -->
      <div class="p-2 border-b border-slate-100 dark:border-white/[0.04]">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            v-model="search"
            type="text"
            :placeholder="searchPlaceholder"
            class="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 dark:border-white/[0.06] rounded-md bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            @keydown.escape="open = false"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="px-3 py-2 text-xs text-slate-400 flex items-center gap-2">
        <Loader2 class="w-3 h-3 animate-spin" /> Cargando...
      </div>

      <!-- Options -->
      <div v-else-if="filteredOptions.length > 0" class="max-h-48 overflow-y-auto">
        <button
          v-for="opt in filteredOptions"
          :key="opt.id"
          @click="select(opt)"
          class="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors flex items-center gap-2"
          :class="modelValue === opt.name ? 'bg-cyan-50 dark:bg-cyan-900/10 text-cyan-700 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-300'"
        >
          <Check v-if="modelValue === opt.name" class="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span v-else class="w-3.5 shrink-0" />
          <span class="truncate">{{ opt.name }}</span>
        </button>
      </div>

      <!-- Empty state -->
      <div v-else class="px-3 py-4 text-center">
        <p class="text-xs text-slate-500">Marca no encontrada</p>
        <button
          v-if="allowCreate"
          @click="$emit('createBrand'); open = false"
          class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
        >
          <Plus class="w-3 h-3" />
          Crear nueva marca
        </button>
      </div>
    </div>

    <!-- Backdrop click to close -->
    <div v-if="open" class="fixed inset-0 z-40" @click="open = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { ChevronDown, Search, Check, Plus, Loader2 } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';

interface BrandOption { id: string; name: string; slug: string; }

const props = withDefaults(defineProps<{
  modelValue?: string | null;
  placeholder?: string;
  searchPlaceholder?: string;
  allowCreate?: boolean;
  endpoint?: string;
}>(), {
  placeholder: 'Seleccionar marca...',
  searchPlaceholder: 'Buscar marca...',
  allowCreate: true,
  endpoint: '/api/v1/catalog/brands/all/',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  createBrand: [];
}>();

const { fetchApi } = useApi();
const open = ref(false);
const search = ref('');
const loading = ref(false);
const options = ref<BrandOption[]>([]);
const wrapperRef = ref<HTMLElement | null>(null);

const selectedLabel = computed(() => {
  return props.modelValue || '';
});

const filteredOptions = computed(() => {
  if (!search.value.trim()) return options.value;
  const q = search.value.toLowerCase();
  return options.value.filter(o => o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q));
});

async function loadOptions() {
  loading.value = true;
  try {
    const data = await fetchApi<any>(props.endpoint);
    options.value = Array.isArray(data) ? data : (data?.results || []);
  } catch {
    options.value = [];
  } finally {
    loading.value = false;
  }
}

function select(opt: BrandOption) {
  emit('update:modelValue', opt.name);
  open.value = false;
  search.value = '';
}

watch(open, (val) => {
  if (val && options.value.length === 0) loadOptions();
});

function closeOnEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false;
}
onMounted(() => document.addEventListener('keydown', closeOnEsc));
onUnmounted(() => document.removeEventListener('keydown', closeOnEsc));
</script>
