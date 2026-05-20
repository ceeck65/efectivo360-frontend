<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="relative w-64">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar atributos..."
          class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
        />
      </div>
      <button @click="openCreate" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700">
        <Plus class="h-4 w-4" /> Nuevo Atributo
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/50 dark:bg-[#1a1f2e]/50">
            <tr>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">ID</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Nombre</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Tipo</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Unidad</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Usos</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Estado</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right dark:text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <tr v-if="loading">
              <td colspan="7" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                <RefreshCw class="mx-auto mb-2 h-5 w-5 animate-spin" />
                Cargando...
              </td>
            </tr>
            <tr v-else-if="filteredData.length === 0">
              <td colspan="7" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                No hay atributos para mostrar.
              </td>
            </tr>
            <tr v-else v-for="attr in filteredData" :key="attr.id" class="hover:bg-slate-50/50 dark:hover:bg-[#1a1f2e]/50">
              <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ attr.id }}</td>
              <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">{{ attr.label }}</td>
              <td class="px-6 py-4">
                <span :class="[
                  'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                  attr.attr_type === 'select' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                  attr.attr_type === 'boolean' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  attr.attr_type === 'decimal' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                ]">
                  {{ attr.type_display }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ attr.unit || '-' }}</td>
              <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ attr.usage_count }}</td>
              <td class="px-6 py-4">
                <span :class="[
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                  attr.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                ]">
                  {{ attr.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEdit(attr)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Editar">
                    <Edit3 class="h-4 w-4" />
                  </button>
                  <button @click="toggleActive(attr)" :class="['text-slate-400 hover:text-slate-600 dark:hover:text-slate-300', attr.is_active && 'text-green-600']" :title="attr.is_active ? 'Desactivar' : 'Activar'">
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

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ editingItem ? 'Editar' : 'Nuevo' }} Atributo</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">ID (identificador único) *</label>
            <input v-model="form.id" type="text" :disabled="!!editingItem" placeholder="ej: color, marca" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] disabled:bg-slate-100" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre (Label) *</label>
            <input v-model="form.label" type="text" placeholder="ej: Color, Marca" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Tipo *</label>
              <select v-model="form.attr_type" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]">
                <option value="string">Texto</option>
                <option value="decimal">Decimal</option>
                <option value="boolean">Booleano</option>
                <option value="select">Selección Única</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Unidad</label>
              <input v-model="form.unit" type="text" placeholder="ej: kg, mm, horas" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]" />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <input v-model="form.is_active" type="checkbox" id="attr-active" class="h-4 w-4 rounded border-slate-300 text-cyan-600" />
            <label for="attr-active" class="text-sm text-slate-700 dark:text-slate-300">Activo</label>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="closeModal" class="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button @click="saveItem" :disabled="saving" class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50">
            {{ saving ? 'Guardando...' : (editingItem ? 'Guardar cambios' : 'Crear') }}
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

interface MasterAttribute {
  id: string;
  label: string;
  attr_type: string;
  type_display: string;
  unit: string;
  is_active: boolean;
  usage_count: number;
}

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const loading = ref(true);
const saving = ref(false);
const data = ref<MasterAttribute[]>([]);
const search = ref('');
const page = ref(1);
const pageSize = ref(100);
const total = ref(0);

const showModal = ref(false);
const editingItem = ref<MasterAttribute | null>(null);
const form = ref({
  id: '',
  label: '',
  attr_type: 'string',
  unit: '',
  is_active: true
});

const filteredData = computed(() => {
  if (!search.value.trim()) return data.value;
  const q = search.value.toLowerCase();
  return data.value.filter(a => 
    a.label.toLowerCase().includes(q) || 
    a.id.toLowerCase().includes(q)
  );
});

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchApi<{ results: MasterAttribute[]; count: number }>(`/api/v1/admin/master-attributes/?page=${page.value}&page_size=${pageSize.value}`);
    data.value = result.results || [];
    total.value = result.count || 0;
  } catch (e) {
    notifyError('Error al cargar atributos');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.value = { id: '', label: '', attr_type: 'string', unit: '', is_active: true };
  editingItem.value = null;
  showModal.value = true;
}

function openEdit(attr: MasterAttribute) {
  editingItem.value = attr;
  form.value = {
    id: attr.id,
    label: attr.label,
    attr_type: attr.attr_type,
    unit: attr.unit,
    is_active: attr.is_active
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingItem.value = null;
}

async function saveItem() {
  if (!form.value.id || !form.value.label) {
    notifyError('ID y nombre son obligatorios');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      id: form.value.id,
      label: form.value.label,
      attr_type: form.value.attr_type,
      unit: form.value.unit,
      is_active: form.value.is_active
    };

    if (editingItem.value) {
      await fetchApi(`/api/v1/admin/master-attributes/${editingItem.value.id}/`, { method: 'PATCH', data: payload });
      notifySuccess('Atributo actualizado correctamente');
    } else {
      await fetchApi('/api/v1/admin/master-attributes/', { method: 'POST', data: payload });
      notifySuccess('Atributo creado correctamente');
    }
    closeModal();
    loadData();
  } catch (e) {
    notifyError(editingItem.value ? 'Error al actualizar' : 'Error al crear');
  } finally {
    saving.value = false;
  }
}

async function toggleActive(attr: MasterAttribute) {
  const result = await Swal.fire({
    title: attr.is_active ? '¿Desactivar Atributo?' : '¿Activar Atributo?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: attr.is_active ? '#ef4444' : '#22c55e',
    confirmButtonText: 'Sí'
  });

  if (result.isConfirmed) {
    try {
      await fetchApi(`/api/v1/admin/master-attributes/${attr.id}/`, { method: 'PATCH', data: { is_active: !attr.is_active } });
      attr.is_active = !attr.is_active;
      notifySuccess(attr.is_active ? 'Atributo activado' : 'Atributo desactivado');
    } catch (e) {
      notifyError('Error al actualizar estado');
    }
  }
}

onMounted(loadData);
</script>