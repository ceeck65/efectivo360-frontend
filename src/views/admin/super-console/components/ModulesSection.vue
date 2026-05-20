<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="relative w-64">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar módulos..."
          class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
        />
      </div>
      <button @click="openCreate" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
        <Plus class="h-4 w-4" /> Nuevo Módulo
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
      <table class="w-full">
        <thead class="bg-slate-50 dark:bg-[#1a1f2e] border-b border-slate-200 dark:border-white/[0.06]">
          <tr>
            <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">ULID</th>
            <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Nombre</th>
            <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Slug</th>
            <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Descripción</th>
            <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Estado</th>
            <th class="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400"><RefreshCw class="mx-auto h-5 w-5 animate-spin" /></td>
          </tr>
          <tr v-else-if="filteredData.length === 0">
            <td colspan="6" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">No hay módulos para mostrar.</td>
          </tr>
          <tr v-else v-for="mod in filteredData" :key="mod.ulid" class="hover:bg-slate-50/50 dark:hover:bg-[#1a1f2e]/50">
            <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ mod.ulid }}</td>
            <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">{{ mod.name }}</td>
            <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ mod.slug }}</td>
            <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ mod.description }}</td>
            <td class="px-6 py-4">
              <span :class="['inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', mod.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300']">
                {{ mod.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button @click="openEdit(mod)" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><Edit class="h-4 w-4" /></button>
                <button @click="toggleActive(mod)" :class="['p-1', mod.is_active ? 'text-green-600 hover:text-green-700' : 'text-slate-400 hover:text-slate-600']">
                  <Power class="h-4 w-4" />
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
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ editingItem ? 'Editar' : 'Nuevo' }} Módulo</h3>
        </div>
        <div class="p-6 space-y-4">
          <div v-if="editingItem">
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">ULID</label>
            <input :value="editingItem.ulid" disabled class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 dark:bg-[#1a1f2e]" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
            <input v-model="form.name" type="text" placeholder="ej: Gestión de Inventario" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]" @input="generateSlug" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Slug *</label>
            <input v-model="form.slug" type="text" placeholder="ej: gestion-inventario" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Descripción</label>
            <textarea v-model="form.description" rows="3" placeholder="Descripción del módulo..." class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e]"></textarea>
          </div>
          <div class="flex items-center gap-3">
            <input v-model="form.is_active" type="checkbox" id="mod-active" class="h-4 w-4 rounded border-slate-300 text-cyan-600" />
            <label for="mod-active" class="text-sm text-slate-700 dark:text-slate-300">Activo</label>
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="closeModal" class="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06]">Cancelar</button>
          <button @click="saveItem" :disabled="saving" class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {{ saving ? 'Guardando...' : (editingItem ? 'Guardar cambios' : 'Crear Módulo') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Search, Plus, Edit, Power, RefreshCw } from 'lucide-vue-next';
import { SimplePagination } from '@/shared/index.js';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

interface AppModule {
  ulid: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const loading = ref(true);
const saving = ref(false);
const data = ref<AppModule[]>([]);
const search = ref('');
const page = ref(1);
const pageSize = ref(100);
const total = ref(0);

const showModal = ref(false);
const editingItem = ref<AppModule | null>(null);
const form = ref({ name: '', slug: '', description: '', is_active: true });

const filteredData = computed(() => {
  if (!search.value.trim()) return data.value;
  const q = search.value.toLowerCase();
  return data.value.filter(m => m.name.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q));
});

function generateSlug() {
  if (!editingItem.value) {
    form.value.slug = form.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchApi<{ results: AppModule[]; count: number }>(`/api/v1/app-modules/?page=${page.value}&page_size=${pageSize.value}`);
    data.value = result.results || [];
    total.value = result.count || 0;
  } catch (e) {
    notifyError('Error al cargar módulos');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.value = { name: '', slug: '', description: '', is_active: true };
  editingItem.value = null;
  showModal.value = true;
}

function openEdit(mod: AppModule) {
  editingItem.value = mod;
  form.value = { name: mod.name, slug: mod.slug, description: mod.description, is_active: mod.is_active };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingItem.value = null;
}

async function saveItem() {
  if (!form.value.name || !form.value.slug || saving.value) {
    notifyError('Nombre y slug son obligatorios');
    return;
  }

  saving.value = true;
  try {
    if (editingItem.value) {
      await fetchApi(`/api/v1/app-modules/${editingItem.value.ulid}/`, { method: 'PATCH', data: form.value });
      notifySuccess('Módulo actualizado correctamente');
    } else {
      await fetchApi('/api/v1/app-modules/', { method: 'POST', data: form.value });
      notifySuccess('Módulo creado correctamente');
    }
    closeModal();
    loadData();
  } catch (e) {
    notifyError(editingItem.value ? 'Error al actualizar' : 'Error al crear');
  } finally {
    saving.value = false;
  }
}

async function toggleActive(mod: AppModule) {
  try {
    await fetchApi(`/api/v1/app-modules/${mod.ulid}/`, { method: 'PATCH', data: { is_active: !mod.is_active } });
    mod.is_active = !mod.is_active;
    notifySuccess(mod.is_active ? 'Módulo activado' : 'Módulo desactivado');
  } catch (e) {
    notifyError('Error al actualizar estado');
  }
}

onMounted(loadData);
</script>