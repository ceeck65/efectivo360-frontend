<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="relative w-64">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar add-ons..."
          class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
        />
      </div>
      <div class="flex gap-2">
        <button @click="openCreate" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700">
          <Plus class="h-4 w-4" /> Nuevo Add-on
        </button>
        <button @click="openAssign" :disabled="!data.length" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50">
          <Target class="h-4 w-4" /> Asignar a Tenant
        </button>
      </div>
    </div>

    <!-- Assignment Form -->
    <div v-if="showAssign" class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824] p-6">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Asignar Add-on a Tenant</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Tenant</label>
          <select v-model="assignForm.tenant_id" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300">
            <option :value="undefined">Seleccionar...</option>
            <option v-for="t in tenants" :key="t.id" :value="t.id">{{ t.commercial_name || t.name }} ({{ t.slug }})</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Add-on</label>
          <select v-model="assignForm.addon_id" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300">
            <option :value="undefined">Seleccionar...</option>
            <option v-for="a in data" :key="a.id" :value="a.id">{{ a.name }} ({{ a.code }})</option>
          </select>
        </div>
        <div v-if="selectedAddon?.addon_type === 'CONSUMO'">
          <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Unidades</label>
          <input v-model.number="assignForm.units" type="number" min="1" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button @click="showAssign = false" class="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
        <button @click="assignAddon" :disabled="savingAssign" class="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50">
          {{ savingAssign ? 'Asignando...' : 'Asignar' }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-200 dark:border-white/[0.06]">
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Código</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Nombre</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Tipo</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Precio</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Unidades</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Estado</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400"><RefreshCw class="mx-auto h-5 w-5 animate-spin" /></td>
          </tr>
          <tr v-else-if="filteredData.length === 0">
            <td colspan="7" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">No hay add-ons para mostrar.</td>
          </tr>
          <tr v-else v-for="addon in filteredData" :key="addon.id" :class="['hover:bg-slate-50/50 dark:hover:bg-[#1a1f2e]/50', !addon.is_active && 'opacity-50']">
            <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ addon.code }}</td>
            <td class="px-6 py-4">
              <div class="font-medium text-slate-900 dark:text-white">{{ addon.name }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">{{ addon.description }}</div>
            </td>
            <td class="px-6 py-4">
              <span :class="['inline-flex items-center px-2 py-1 rounded text-xs font-medium', addon.addon_type === 'SERVICIO' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400']">
                {{ addon.addon_type }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">${{ addon.price }}</td>
            <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ addon.addon_type === 'CONSUMO' ? addon.units_included : '-' }}</td>
            <td class="px-6 py-4">
              <span :class="addon.is_active ? 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400'">
                {{ addon.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button @click="openEdit(addon)" class="p-1 text-slate-400 hover:text-slate-600"><Edit3 class="h-4 w-4" /></button>
                <button @click="toggleActive(addon)" :class="['p-1', addon.is_active ? 'text-green-600 hover:text-green-700' : 'text-slate-400 hover:text-slate-600']">
                  <Power :class="['h-4 w-4', !addon.is_active && 'rotate-90']" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <SimplePagination v-if="total > 0" :page="page" :page-size="pageSize" :total="total" @update:page="page = $event; loadData()" @update:page-size="pageSize = $event; page = 1; loadData()" />
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ editingItem ? 'Editar' : 'Nuevo' }} Add-on</h3>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Código *</label>
              <input v-model="form.code" type="text" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
              <input v-model="form.name" type="text" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Descripción</label>
            <textarea v-model="form.description" rows="2" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Tipo *</label>
              <select v-model="form.addon_type" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]">
                <option value="CONSUMO">Pack de Consumo</option>
                <option value="SERVICIO">Servicio Recurrente</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Precio (USD) *</label>
              <input v-model.number="form.price" type="number" step="0.01" min="0" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div v-if="form.addon_type === 'CONSUMO'">
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Unidades Incluidas *</label>
              <input v-model.number="form.units_included" type="number" min="1" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]" />
            </div>
            <div v-if="form.addon_type === 'SERVICIO'">
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Duración (días)</label>
              <input v-model.number="form.default_duration_days" type="number" min="1" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Orden</label>
              <input v-model.number="form.display_order" type="number" min="0" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]" />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <input v-model="form.is_active" type="checkbox" id="addon-active" class="h-4 w-4 rounded border-slate-300 text-cyan-600" />
            <label for="addon-active" class="text-sm text-slate-700 dark:text-slate-300">Activo</label>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="closeModal" class="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button @click="saveItem" :disabled="saving" class="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50">
            {{ saving ? 'Guardando...' : (editingItem ? 'Guardar cambios' : 'Crear') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Search, Plus, Edit3, Power, RefreshCw, Target } from 'lucide-vue-next';
import { SimplePagination } from '@/shared/index.js';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import Swal from 'sweetalert2';

interface Addon {
  id: number;
  code: string;
  name: string;
  description: string;
  addon_type: string;
  price: number;
  units_included?: number;
  default_duration_days?: number;
  is_active: boolean;
  display_order: number;
}

interface Tenant {
  id: number;
  name: string;
  commercial_name?: string;
  slug: string;
}

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const loading = ref(true);
const saving = ref(false);
const savingAssign = ref(false);
const data = ref<Addon[]>([]);
const tenants = ref<Tenant[]>([]);
const search = ref('');
const page = ref(1);
const pageSize = ref(100);
const total = ref(0);

const showModal = ref(false);
const showAssign = ref(false);
const editingItem = ref<Addon | null>(null);

const defaultForm = () => ({ 
  code: '', 
  name: '', 
  description: '', 
  addon_type: 'CONSUMO', 
  price: 0, 
  units_included: 100, 
  default_duration_days: 30, 
  is_active: true, 
  display_order: 0 
});
const form = ref<{code:string; name:string; description:string; addon_type:string; price:number; units_included:number; default_duration_days:number; is_active:boolean; display_order:number}>(defaultForm());

const assignForm = ref({ tenant_id: undefined as number | undefined, addon_id: undefined as number | undefined, units: 100 });

const filteredData = computed(() => {
  if (!search.value.trim()) return data.value;
  const q = search.value.toLowerCase();
  return data.value.filter(a => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q));
});

const selectedAddon = computed(() => data.value.find(a => a.id === assignForm.value.addon_id));

async function loadData() {
  loading.value = true;
  try {
    const [addonResult, tenantResult] = await Promise.all([
      fetchApi<{ results: Addon[]; count: number }>(`/api/v1/addons/?page=${page.value}&page_size=${pageSize.value}`),
      fetchApi<Tenant[]>('/api/v1/tenants/')
    ]);
    data.value = addonResult.results || [];
    total.value = addonResult.count || 0;
    tenants.value = Array.isArray(tenantResult) ? tenantResult : (tenantResult as any).results || [];
  } catch (e) {
    notifyError('Error al cargar add-ons');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.value = defaultForm();
  editingItem.value = null;
  showModal.value = true;
}

function openEdit(addon: Addon) {
  editingItem.value = addon;
  form.value = { 
    code: addon.code, 
    name: addon.name, 
    description: addon.description || '', 
    addon_type: addon.addon_type, 
    price: addon.price, 
    units_included: addon.units_included ?? 100, 
    default_duration_days: addon.default_duration_days ?? 30, 
    is_active: addon.is_active, 
    display_order: addon.display_order 
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingItem.value = null;
}

async function saveItem() {
  if (!form.value.code || !form.value.name || form.value.price < 0) {
    notifyError('Complete los campos requeridos');
    return;
  }
  if (form.value.addon_type === 'CONSUMO' && (!form.value.units_included || form.value.units_included <= 0)) {
    notifyError('Las unidades son obligatorias para tipo CONSUMO');
    return;
  }

  saving.value = true;
  try {
    if (editingItem.value) {
      await fetchApi(`/api/v1/addons/${editingItem.value.id}/`, { method: 'PATCH', data: form.value });
      notifySuccess('Add-on actualizado correctamente');
    } else {
      await fetchApi('/api/v1/addons/', { method: 'POST', data: form.value });
      notifySuccess('Add-on creado correctamente');
    }
    closeModal();
    loadData();
  } catch (e) {
    notifyError(editingItem.value ? 'Error al actualizar' : 'Error al crear');
  } finally {
    saving.value = false;
  }
}

async function toggleActive(addon: Addon) {
  const result = await Swal.fire({
    title: addon.is_active ? '¿Desactivar Add-on?' : '¿Activar Add-on?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: addon.is_active ? '#ef4444' : '#22c55e',
    confirmButtonText: 'Sí'
  });

  if (result.isConfirmed) {
    try {
      await fetchApi(`/api/v1/addons/${addon.id}/`, { method: 'PATCH', data: { is_active: !addon.is_active } });
      addon.is_active = !addon.is_active;
      notifySuccess(addon.is_active ? 'Add-on activado' : 'Add-on desactivado');
    } catch (e) {
      notifyError('Error al actualizar estado');
    }
  }
}

function openAssign() {
  assignForm.value = { tenant_id: undefined, addon_id: undefined, units: 100 };
  showAssign.value = true;
}

async function assignAddon() {
  if (!assignForm.value.tenant_id || !assignForm.value.addon_id) {
    notifyError('Seleccione un tenant y un add-on');
    return;
  }

  savingAssign.value = true;
  try {
    await fetchApi('/api/v1/tenant-addons/', {
      method: 'POST',
      data: {
        tenant: assignForm.value.tenant_id,
        addon: assignForm.value.addon_id,
        remaining_units: selectedAddon.value?.addon_type === 'CONSUMO' ? assignForm.value.units : 0
      }
    });
    notifySuccess('Add-on asignado correctamente');
    showAssign.value = false;
  } catch (e) {
    notifyError('Error al asignar add-on');
  } finally {
    savingAssign.value = false;
  }
}

onMounted(loadData);
</script>