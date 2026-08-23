<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />
      <div class="relative bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl">
        <!-- Header -->
        <div class="flex items-start justify-between px-5 py-4 border-b border-slate-200">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <GitMerge class="w-4 h-4 text-cyan-500" /> Fusionar Marcas
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">
              Unifica marcas duplicadas (ej. "Coca Cola" y "Coca-Cola") en una sola.
            </p>
          </div>
          <button @click="handleClose" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input v-model="query" type="text" placeholder="Buscar marcas..."
              class="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500" />
          </div>

          <div v-if="loading" class="text-center py-8 text-slate-400">
            <Loader2 class="w-5 h-5 animate-spin mx-auto mb-2" /> Cargando marcas...
          </div>

          <template v-else>
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                1. Marcas a fusionar (origen) <span class="text-red-400">*</span>
              </label>
              <div class="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                <label v-for="b in filteredBrands" :key="b.id"
                  class="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 transition-colors"
                  :class="targetId === b.id ? 'opacity-30 pointer-events-none' : ''">
                  <input type="checkbox" :checked="sourceIds.includes(b.id)" @change="toggleSource(b.id)"
                    class="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/30 focus:ring-offset-0" />
                  <span class="truncate">{{ b.name }}</span>
                  <span class="text-[10px] text-slate-400 ml-auto shrink-0">{{ b.products_count }} productos</span>
                </label>
                <p v-if="filteredBrands.length === 0" class="px-3 py-6 text-center text-xs text-slate-400 italic">Sin resultados</p>
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                2. Marca destino (se conserva) <span class="text-red-400">*</span>
              </label>
              <select v-model="targetId"
                class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500">
                <option value="">Selecciona la marca destino...</option>
                <option v-for="b in brands.filter(x => !sourceIds.includes(x.id))" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>

            <div v-if="sourceIds.length > 0 && targetId" class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700 flex items-start gap-2">
              <AlertTriangle class="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Se reasignarán todos los productos de <strong>{{ sourceIds.length }}</strong> marca(s) a
                <strong>{{ targetName }}</strong>, y las marcas origen quedarán <strong>inactivas</strong>. Esta acción no se puede deshacer.
              </span>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
          <button @click="handleClose" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button @click="submit" :disabled="!canSubmit || merging"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Loader2 v-if="merging" class="w-4 h-4 animate-spin" />
            <GitMerge v-else class="w-4 h-4" />
            {{ merging ? 'Fusionando...' : 'Fusionar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { X, Search, GitMerge, Loader2, AlertTriangle } from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

interface BrandOption {
  id: string;
  name: string;
  products_count: number;
}

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  merged: [];
}>();

const { success, error: notifyError } = useNotify();

const query = ref('');
const brands = ref<BrandOption[]>([]);
const loading = ref(false);
const sourceIds = ref<string[]>([]);
const targetId = ref('');
const merging = ref(false);

const filteredBrands = computed(() => {
  if (!query.value.trim()) return brands.value;
  const q = query.value.toLowerCase();
  return brands.value.filter(b => b.name.toLowerCase().includes(q));
});

const targetName = computed(() => brands.value.find(b => b.id === targetId.value)?.name || '');

const canSubmit = computed(() => sourceIds.value.length > 0 && !!targetId.value);

function toggleSource(id: string) {
  if (sourceIds.value.includes(id)) {
    sourceIds.value = sourceIds.value.filter(i => i !== id);
  } else {
    sourceIds.value = [...sourceIds.value, id];
  }
}

async function loadBrands() {
  loading.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/admin/global-catalog/brands/?page_size=200&ordering=name');
    brands.value = Array.isArray(res?.results) ? res.results : [];
  } catch {
    brands.value = [];
  } finally {
    loading.value = false;
  }
}

function extractErrorMessage(e: any): string {
  const data = e?.data;
  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const val = firstKey ? data[firstKey] : null;
    if (Array.isArray(val) && val.length) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return e?.message || 'Error al fusionar las marcas';
}

async function submit() {
  if (!canSubmit.value || merging.value) return;
  merging.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/admin/global-catalog/brands/merge/', {
      method: 'POST',
      data: { source_brand_ids: sourceIds.value, target_brand_id: targetId.value },
    });
    success(`${res?.products_reassigned ?? 0} producto(s) reasignados a ${targetName.value}.`);
    emit('merged');
    emit('close');
  } catch (e: any) {
    notifyError(extractErrorMessage(e));
  } finally {
    merging.value = false;
  }
}

function handleClose() {
  if (merging.value) return;
  emit('close');
}

function resetForm() {
  query.value = '';
  sourceIds.value = [];
  targetId.value = '';
  merging.value = false;
}

watch(() => props.visible, (v) => {
  if (v) {
    resetForm();
    loadBrands();
  }
});
</script>
