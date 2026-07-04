<template>
  <div class="relative" ref="containerRef">
    <label
      class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Marca</label>
    <div class="flex gap-2">
      <div class="relative flex-1">
        <input ref="inputRef" v-model="query" type="text"
          :placeholder="disabled ? 'Primero elige una categoría' : placeholder" :disabled="disabled"
          @focus="open = true" @click="open = true" @keydown.down.prevent="highlightNext"
          @keydown.up.prevent="highlightPrev" @keydown.enter.prevent="selectHighlighted" @keydown.escape="open = false"
          class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] rounded-lg focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 focus:outline-none transition-colors"
          :class="[disabled
            ? 'bg-slate-100 dark:bg-white/[0.01] text-slate-400 dark:text-slate-500 cursor-not-allowed'
            : 'bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200']" />
        <ChevronDown v-if="!query"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <X v-else @click="clear"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
      </div>

      <button type="button" @click="handleExternalCreate" :disabled="disabled"
        class="h-9 px-3 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 shrink-0"
        :class="disabled
          ? 'border-slate-200 dark:border-white/[0.04] text-slate-300 dark:text-slate-500 cursor-not-allowed'
          : 'border-slate-300 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'">
        <Plus class="w-4 h-4" /> Nueva Marca
      </button>
    </div>

    <div v-if="open && !disabled && (filtered.length > 0 || (query.trim() && filtered.length === 0))"
      class="absolute z-30 mt-1 w-[calc(100%-110px)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.08] rounded-lg shadow-xl max-h-60 overflow-y-auto">

      <div v-if="filtered.length > 0">
        <button v-for="(item, i) in filtered" :key="item.id" @click="select(item)" @mouseenter="highlightedIndex = i"
          class="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
          :class="i === highlightedIndex ? 'bg-blue-50 dark:bg-blue-500/[0.12] text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'">
          <span class="truncate">{{ item.name }}</span>
        </button>
      </div>

      <div v-else-if="query.trim() && filtered.length === 0">
        <button @click="createInline"
          class="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/[0.08] transition-colors font-medium">
          <Plus class="w-3.5 h-3.5" /> Crear marca "{{ query }}"
        </button>
      </div>
    </div>

    <p v-if="loading" class="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
      <Loader2 class="w-3 h-3 animate-spin" /> Cargando marcas...
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { Plus, X, ChevronDown, Loader2 } from 'lucide-vue-next';

interface BrandItem {
  id: string;
  name: string;
}

const props = defineProps<{
  modelValue: string | null;
  options: BrandItem[];
  loading?: boolean;
  disabled: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | null): void;
  (e: 'create-inline', name: string): void;
}>();

const query = ref('');
const open = ref(false);
const highlightedIndex = ref(-1);
const containerRef = ref<HTMLElement | null>(null);

// REPARADO: Si no hay query, muestra TODAS las opciones que bajaron de Redis
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options || [];
  return props.options.filter(b => b.name.toLowerCase().includes(q));
});

watch(() => props.modelValue, (v) => {
  if (v) {
    const found = props.options.find(b => b.id === v);
    query.value = found ? found.name : '';
  } else {
    query.value = '';
  }
}, { immediate: true });

watch(() => props.options, () => {
  if (props.modelValue) {
    const found = props.options.find(b => b.id === props.modelValue);
    if (found) query.value = found.name;
  }
}, { deep: true });

function select(item: BrandItem) {
  emit('update:modelValue', item.id);
  query.value = item.name;
  open.value = false;
}

function clear() {
  emit('update:modelValue', null);
  query.value = '';
  open.value = false;
}

function createInline() {
  const text = query.value.trim();
  if (!text) return;
  emit('create-inline', text);
  open.value = false;
}

// Controla la acción del botón "+ Nueva Marca" lateral
function handleExternalCreate() {
  // Envía lo que esté escrito, o un string vacío para abrir el modal global de creación de marca
  emit('create-inline', query.value.trim());
}

function highlightNext() {
  if (filtered.value.length === 0) return;
  highlightedIndex.value = (highlightedIndex.value + 1) % filtered.value.length;
}

function highlightPrev() {
  if (filtered.value.length === 0) return;
  highlightedIndex.value = (highlightedIndex.value - 1 + filtered.value.length) % filtered.value.length;
}

function selectHighlighted() {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < filtered.value.length) {
    select(filtered.value[highlightedIndex.value]);
  } else if (query.value.trim() && filtered.value.length === 0) {
    createInline();
  }
}

function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));
</script>