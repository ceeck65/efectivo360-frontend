<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="relative w-64">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar blueprints..."
          class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
        />
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700"
      >
        <Plus class="h-4 w-4" />
        Nuevo Blueprint
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/50 dark:bg-[#1a1f2e]/50">
            <tr>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Código</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Nombre</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Features</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Categorías</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Estado</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right dark:text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                <RefreshCw class="mx-auto mb-2 h-5 w-5 animate-spin" />
                Cargando...
              </td>
            </tr>
            <tr v-else-if="filteredData.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                No hay blueprints para mostrar.
              </td>
            </tr>
            <tr v-else v-for="bp in filteredData" :key="bp.id" class="hover:bg-slate-50/50 dark:hover:bg-[#1a1f2e]/50">
              <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ bp.code }}</td>
              <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">{{ bp.name }}</td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span v-for="feature in (bp.required_features || [])" :key="feature" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {{ feature }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ (bp.default_categories || []).length }}</td>
              <td class="px-6 py-4">
                <span :class="[
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                  bp.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                ]">
                  {{ bp.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEdit(bp)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Editar Blueprint">
                    <Edit3 class="h-4 w-4" />
                  </button>
                  <button @click="toggleActive(bp)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" :title="bp.is_active ? 'Desactivar' : 'Activar'">
                    <Power class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <SimplePagination
        v-if="total > 0"
        :page="page"
        :page-size="pageSize"
        :total="total"
        @update:page="page = $event; loadData()"
        @update:page-size="pageSize = $event; page = 1; loadData()"
      />
    </div>

    <!-- Create Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ editingItem ? 'Editar' : 'Nuevo' }} Blueprint</h3>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Código *</label>
              <input v-model="form.code" type="text" :disabled="!!editingItem" :placeholder="editingItem ? '' : 'ej: bodega'" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300 disabled:bg-slate-100 dark:disabled:bg-[#1a1f2e]" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
              <input v-model="form.name" type="text" placeholder="ej: Bodega" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Ícono (Lucide)</label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <input
                  v-model="form.icon"
                  type="text"
                  placeholder="Seleccionar icono..."
                  readonly
                  @click="showIconPicker = true"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
                />
                <button type="button" @click="showIconPicker = true" class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <Search class="h-4 w-4" />
                </button>
              </div>
              <div v-if="form.icon" class="flex items-center justify-center w-11 h-11 rounded-md border border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-[#1a1f2e]">
                <LucideIcon :name="form.icon" :size="20" class="text-slate-600 dark:text-slate-300" />
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Features (separados por coma)</label>
            <input v-model="form.features" type="text" placeholder="ej: balanza,variantes" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
          </div>
          <div v-if="editingItem" class="flex items-center gap-3">
            <input id="edit-active" v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
            <label for="edit-active" class="text-sm text-slate-700 dark:text-slate-300">Activo</label>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="closeModal" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]">
            Cancelar
          </button>
          <button @click="saveItem" :disabled="saving" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <RefreshCw v-if="saving" class="h-4 w-4 animate-spin" />
            <Plus v-if="!editingItem && !saving" class="h-4 w-4" />
            <span>{{ saving ? 'Guardando...' : (editingItem ? 'Guardar cambios' : 'Crear Blueprint') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Icon Picker -->
    <IconPicker :is-open="showIconPicker" v-model="form.icon" @update:is-open="showIconPicker = $event" @close="showIconPicker = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Search, Plus, Edit3, Power, RefreshCw } from 'lucide-vue-next';
import { SimplePagination } from '@/shared/index.js';
import IconPicker from '@/components/shared/IconPicker.vue';
import LucideIcon from '@/components/lucide/LucideIcon.vue';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import Swal from 'sweetalert2';

interface Blueprint {
  id: number;
  code: string;
  name: string;
  icon?: string;
  is_active: boolean;
  required_features?: string[];
  default_categories?: string[];
}

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const loading = ref(true);
const saving = ref(false);
const data = ref<Blueprint[]>([]);
const search = ref('');
const page = ref(1);
const pageSize = ref(100);
const total = ref(0);

const showModal = ref(false);
const showIconPicker = ref(false);
const editingItem = ref<Blueprint | null>(null);
const form = ref({ code: '', name: '', icon: '', features: '', is_active: true });

const filteredData = computed(() => {
  if (!search.value.trim()) return data.value;
  const q = search.value.toLowerCase();
  return data.value.filter(bp => bp.code.toLowerCase().includes(q) || bp.name.toLowerCase().includes(q));
});

async function loadData() {
  loading.value = true;
  try {
    const params = new URLSearchParams({ page: String(page.value), page_size: String(pageSize.value) });
    const result = await fetchApi<{ results: Blueprint[]; count: number }>(`/api/v1/industry-blueprints/?${params}`);
    data.value = result.results || [];
    total.value = result.count || 0;
  } catch (e) {
    notifyError('Error al cargar blueprints');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.value = { code: '', name: '', icon: '', features: '', is_active: true };
  editingItem.value = null;
  showModal.value = true;
}

function openEdit(bp: Blueprint) {
  editingItem.value = bp;
  form.value = {
    code: bp.code,
    name: bp.name,
    icon: bp.icon || '',
    features: (bp.required_features || []).join(', '),
    is_active: bp.is_active
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingItem.value = null;
}

async function saveItem() {
  if (!form.value.code || !form.value.name || saving.value) {
    notifyError('Código y nombre son obligatorios');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      code: form.value.code,
      name: form.value.name,
      icon: form.value.icon,
      required_features: form.value.features.split(',').map(f => f.trim()).filter(Boolean),
      is_active: form.value.is_active
    };

    if (editingItem.value) {
      await fetchApi(`/api/v1/industry-blueprints/${editingItem.value.id}/`, { method: 'PATCH', data: payload });
      notifySuccess('Blueprint actualizado correctamente');
    } else {
      await fetchApi('/api/v1/industry-blueprints/', { method: 'POST', data: payload });
      notifySuccess('Blueprint creado correctamente');
    }
    closeModal();
    loadData();
  } catch (error) {
    notifyError(editingItem.value ? 'Error al actualizar blueprint' : 'Error al crear blueprint');
  } finally {
    saving.value = false;
  }
}

async function toggleActive(bp: Blueprint) {
  const title = bp.is_active ? '¿Desactivar Blueprint?' : '¿Activar Blueprint?';
  const message = bp.is_active 
    ? 'El blueprint deixará d\'estar disponible per a nous clients.'
    : 'El blueprint estarà disponible per a nous clients.';

  const result = await Swal.fire({
    title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: bp.is_active ? '#ef4444' : '#22c55e',
    cancelButtonColor: '#64748b',
    confirmButtonText: bp.is_active ? 'Sí, desactivar' : 'Sí, activar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await fetchApi(`/api/v1/industry-blueprints/${bp.id}/`, { method: 'PATCH', data: { is_active: !bp.is_active } });
      bp.is_active = !bp.is_active;
      notifySuccess(bp.is_active ? 'Blueprint activado' : 'Blueprint desactivado');
    } catch (error) {
      notifyError('Error al actualizar estado');
    }
  }
}

onMounted(loadData);
</script>