<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('cancel')" />
      <div class="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="shrink-0 px-6 py-4 border-b border-slate-200">
          <h2 class="text-base font-semibold text-slate-800">Configurar Actividad Comercial</h2>
          <p class="text-xs text-slate-500 mt-0.5">Selecciona el rubro principal de tu negocio</p>
        </div>

        <!-- Search -->
        <div class="shrink-0 px-6 pt-4 pb-2">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input v-model="query" type="text" placeholder="Buscar rubro..."
              class="w-full h-9 pl-9 pr-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <!-- Grid -->
        <div class="flex-1 overflow-y-auto px-6 py-3">
          <div v-if="fetching" class="flex items-center justify-center py-10">
            <Loader2 class="w-6 h-6 animate-spin text-slate-300" />
          </div>
          <div v-else-if="filtered.length === 0" class="text-center py-10 text-sm text-slate-400">
            {{ query ? 'Sin resultados para "' + query + '"' : 'No hay rubros disponibles.' }}
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button v-for="bp in filtered" :key="bp.id" type="button"
              @click="selectedId = bp.ulid"
              class="relative flex flex-col items-start text-left p-4 rounded-xl border transition-all duration-150"
              :class="selectedId === bp.ulid
                ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'">
              <div class="absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                :class="selectedId === bp.ulid ? 'border-blue-500 bg-blue-500' : 'border-slate-300'">
                <Check v-if="selectedId === bp.ulid" class="w-3 h-3 text-white" />
              </div>
              <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-2 text-xl bg-slate-100">
                <span v-if="bp.icon">{{ bp.icon }}</span>
                <component v-else :is="iconComponent(bp.icon)" class="w-5 h-5 text-slate-400" />
              </div>
              <p class="text-sm font-medium text-slate-800 pr-5">{{ bp.name }}</p>
              <p v-if="bp.description" class="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{{ bp.description }}</p>
              <span class="mt-2 text-[10px] font-mono text-slate-400">{{ bp.code }}</span>
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="shrink-0 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button @click="$emit('cancel')"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            Cancelar
          </button>
          <button @click="confirm" :disabled="!selectedId || saving"
            class="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl flex items-center gap-2 transition-colors">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            Guardar Rubro
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import * as AllIcons from 'lucide-vue-next';
const { Search, Check, Loader2 } = AllIcons;
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

interface BusinessType {
  id: string;
  ulid: string;
  name: string;
  code: string;
  icon: string;
  description: string;
}

const emit = defineEmits<{ selected: [blueprint: BusinessType]; cancel: [] }>();

const { fetchApi } = useApi();
const { success, error: notifyError } = useNotify();

const query = ref('');
const selectedId = ref<string | null>(null);
const saving = ref(false);
const fetching = ref(true);
const blueprints = ref<BusinessType[]>([]);

const filtered = computed(() => {
  if (!query.value) return blueprints.value;
  const q = query.value.toLowerCase();
  return blueprints.value.filter((b) => b.name?.toLowerCase().includes(q) || b.code?.toLowerCase().includes(q));
});

onMounted(async () => {
  try {
    const res = await fetchApi<any>('/api/v1/business-types/?page=1&page_size=100');
    blueprints.value = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
  } catch {
    blueprints.value = [];
  } finally {
    fetching.value = false;
  }
});

function iconComponent(name?: string): any {
  if (!name) return AllIcons.Store;
  return (AllIcons as Record<string, any>)[name] || AllIcons.Store;
}

async function confirm() {
  if (!selectedId.value) return;
  saving.value = true;
  try {
    const res = await fetchApi<BusinessType>('/api/v1/tenants/me/setup-business/', {
      method: 'POST',
      data: { business_type_ulid: selectedId.value, selected_category_ulids: [] },
    });
    success('Rubro principal configurado correctamente');
    emit('selected', res);
  } catch (e: any) {
    notifyError(e?.message || 'Error al configurar el rubro principal');
  } finally {
    saving.value = false;
  }
}
</script>
