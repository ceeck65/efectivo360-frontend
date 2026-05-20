<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="relative w-64">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar categorías..."
          class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
        />
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
      >
        <Plus class="h-4 w-4" />
        Nueva Categoría
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/50 dark:bg-[#1a1f2e]/50">
            <tr>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Nombre</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Código</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Blueprint</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Padre</th>
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
                No hay categorías para mostrar.
              </td>
            </tr>
            <tr v-else v-for="cat in filteredData" :key="cat.id" class="hover:bg-slate-50/50 dark:hover:bg-[#1a1f2e]/50">
              <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">{{ cat.nombre }}</td>
              <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ cat.code }}</td>
              <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ getBlueprintName(cat.industry_blueprint_id) }}</td>
              <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ cat.parent?.nombre || '-' }}</td>
              <td class="px-6 py-4">
                <span :class="[
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                  cat.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                ]">
                  {{ cat.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="toggleActive(cat)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" :title="cat.is_active ? 'Desactivar' : 'Activar'">
                    <Power class="h-4 w-4" />
                  </button>
                  <button @click="openEdit(cat)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Editar Categoría">
                    <Edit3 class="h-4 w-4" />
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

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ editingItem ? 'Editar' : 'Nueva' }} Categoría</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Código *</label>
            <input v-model="form.code" type="text" :disabled="!!editingItem" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300 disabled:bg-slate-100 dark:disabled:bg-[#1a1f2e]" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
            <input v-model="form.nombre" type="text" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Blueprint</label>
            <select v-model="form.industry_blueprint_id" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300">
              <option :value="undefined">Sin blueprint</option>
              <option v-for="bp in blueprints" :key="bp.id" :value="bp.id">
                {{ bp.name }} ({{ bp.code }})
              </option>
            </select>
          </div>
          <div v-if="editingItem" class="flex items-center gap-3">
            <input id="cat-active" v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
            <label for="cat-active" class="text-sm text-slate-700 dark:text-slate-300">Activo</label>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="closeModal" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]">
            Cancelar
          </button>
          <button @click="saveItem" :disabled="saving" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            <RefreshCw v-if="saving" class="h-4 w-4 animate-spin" />
            <span>{{ saving ? 'Guardando...' : (editingItem ? 'Guardar cambios' : 'Crear') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Search, Plus, Edit3, Power, RefreshCw } from 'lucide-vue-next';
import { SimplePagination } from '@/shared/index.js';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import Swal from 'sweetalert2';

interface Category {
  id: number;
  code: string;
  nombre: string;
  is_active: boolean;
  industry_blueprint_id?: number;
  parent?: { nombre: string };
}

interface Blueprint {
  id: number;
  code: string;
  name: string;
}

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const loading = ref(true);
const saving = ref(false);
const data = ref<Category[]>([]);
const blueprints = ref<Blueprint[]>([]);
const search = ref('');
const page = ref(1);
const pageSize = ref(100);
const total = ref(0);

const showModal = ref(false);
const editingItem = ref<Category | null>(null);
const form = ref({ code: '', nombre: '', industry_blueprint_id: undefined as number | undefined, is_active: true });

const filteredData = computed(() => {
  if (!search.value.trim()) return data.value;
  const q = search.value.toLowerCase();
  return data.value.filter(cat => cat.code.toLowerCase().includes(q) || cat.nombre.toLowerCase().includes(q));
});

async function loadData() {
  loading.value = true;
  try {
    const [catResult, bpResult] = await Promise.all([
      fetchApi<{ results: Category[]; count: number }>(`/api/v1/categories/?page=${page.value}&page_size=${pageSize.value}`),
      fetchApi<Blueprint[]>('/api/v1/industry-blueprints/')
    ]);
    data.value = catResult.results || [];
    total.value = catResult.count || 0;
    blueprints.value = Array.isArray(bpResult) ? bpResult : (bpResult as any).results || [];
  } catch (e) {
    notifyError('Error al cargar categorías');
  } finally {
    loading.value = false;
  }
}

function getBlueprintName(id?: number) {
  if (!id) return '-';
  const bp = blueprints.value.find(b => b.id === id);
  return bp?.name || '-';
}

function openCreate() {
  form.value = { code: '', nombre: '', industry_blueprint_id: undefined, is_active: true };
  editingItem.value = null;
  showModal.value = true;
}

function openEdit(cat: Category) {
  editingItem.value = cat;
  form.value = {
    code: cat.code,
    nombre: cat.nombre,
    industry_blueprint_id: cat.industry_blueprint_id,
    is_active: cat.is_active
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingItem.value = null;
}

async function saveItem() {
  if (!form.value.code || !form.value.nombre || saving.value) {
    notifyError('Código y nombre son obligatorios');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      code: form.value.code,
      nombre: form.value.nombre,
      industry_blueprint_id: form.value.industry_blueprint_id || null,
      is_active: form.value.is_active
    };

    if (editingItem.value) {
      await fetchApi(`/api/v1/categories/${editingItem.value.id}/`, { method: 'PATCH', data: payload });
      notifySuccess('Categoría actualizada correctamente');
    } else {
      await fetchApi('/api/v1/categories/', { method: 'POST', data: payload });
      notifySuccess('Categoría creada correctamente');
    }
    closeModal();
    loadData();
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Error al guardar categoría');
  } finally {
    saving.value = false;
  }
}

async function toggleActive(cat: Category) {
  const result = await Swal.fire({
    title: cat.is_active ? '¿Desactivar Categoría?' : '¿Activar Categoría?',
    text: cat.is_active ? 'La categoría deixará d\'estar disponible.' : 'La categoría estarà disponible.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: cat.is_active ? '#ef4444' : '#22c55e',
    cancelButtonColor: '#64748b',
    confirmButtonText: cat.is_active ? 'Sí, desactivar' : 'Sí, activar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await fetchApi(`/api/v1/categories/${cat.id}/`, { method: 'PATCH', data: { is_active: !cat.is_active } });
      cat.is_active = !cat.is_active;
      notifySuccess(cat.is_active ? 'Categoría activada' : 'Categoría desactivada');
    } catch (error) {
      notifyError('Error al actualizar estado');
    }
  }
}

onMounted(loadData);
</script>