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
        Nuevo Business Type
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
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Ícono</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Orden</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right dark:text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <tr v-if="loading">
              <td colspan="5" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                <RefreshCw class="mx-auto mb-2 h-5 w-5 animate-spin" />
                Cargando...
              </td>
            </tr>
            <tr v-else-if="filteredData.length === 0">
              <td colspan="5" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                No hay business types para mostrar.
              </td>
            </tr>
            <tr v-else v-for="bp in filteredData" :key="bp.id" class="hover:bg-slate-50/50 dark:hover:bg-[#1a1f2e]/50">
              <td class="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{{ bp.code }}</td>
              <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">
                <span class="inline-flex items-center gap-2">
                  <span v-if="bp.icon" class="text-lg leading-none">{{ bp.icon }}</span>
                  {{ bp.name }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ bp.icon || '-' }}</td>
              <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{{ bp.sort_order ?? '-' }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEdit(bp)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Editar Business Type">
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
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ editingItem ? 'Editar' : 'Nuevo' }} Business Type</h3>
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
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Ícono</label>
              <div class="relative">
                <button type="button" @click="showEmojiPicker = !showEmojiPicker"
                  class="w-14 h-14 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-cyan-400 hover:bg-cyan-50 transition-all flex items-center justify-center cursor-pointer text-3xl"
                  :class="form.icon ? 'border-cyan-300 bg-cyan-50' : ''">
                  <span v-if="form.icon">{{ form.icon }}</span>
                  <Smile v-else class="w-6 h-6 text-slate-400" />
                </button>
                <div v-if="showEmojiPicker" class="absolute top-full left-0 mt-2 z-50">
                  <VuemojiPicker @emojiClick="onEmojiSelect" />
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Orden</label>
              <input v-model.number="form.sort_order" type="number" placeholder="ej: 1" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Descripción</label>
            <textarea v-model="form.description" rows="3" placeholder="Descripción del business type" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300" />
          </div>
        </div>
        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button @click="closeModal" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]">
            Cancelar
          </button>
          <button @click="saveItem" :disabled="saving" class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <RefreshCw v-if="saving" class="h-4 w-4 animate-spin" />
            <Plus v-if="!editingItem && !saving" class="h-4 w-4" />
            <span>{{ saving ? 'Guardando...' : (editingItem ? 'Guardar cambios' : 'Crear Business Type') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Search, Plus, Edit3, RefreshCw, Smile } from 'lucide-vue-next';
import { SimplePagination } from '@/shared/index.js';
import { VuemojiPicker } from 'vuemoji-picker';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

interface BusinessType {
  id: number;
  code: string;
  name: string;
  icon?: string;
  description?: string;
  sort_order?: number;
}

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const loading = ref(true);
const saving = ref(false);
const data = ref<BusinessType[]>([]);
const search = ref('');
const page = ref(1);
const pageSize = ref(100);
const total = ref(0);

const showModal = ref(false);
const showEmojiPicker = ref(false);
const editingItem = ref<BusinessType | null>(null);
const form = ref({ code: '', name: '', icon: '', description: '', sort_order: undefined as number | undefined });

function onEmojiSelect(detail: any) {
  form.value.icon = detail.unicode;
  showEmojiPicker.value = false;
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.relative') && showEmojiPicker.value) {
    showEmojiPicker.value = false;
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));

const filteredData = computed(() => {
  if (!search.value.trim()) return data.value;
  const q = search.value.toLowerCase();
  return data.value.filter(bp => bp.code.toLowerCase().includes(q) || bp.name.toLowerCase().includes(q));
});

async function loadData() {
  loading.value = true;
  try {
    const params = new URLSearchParams({ page: String(page.value), page_size: String(pageSize.value) });
    const result = await fetchApi<{ results: BusinessType[]; count: number }>(`/api/v1/business-types/?${params}`);
    data.value = result.results || [];
    total.value = result.count || 0;
  } catch (e) {
    notifyError('Error al cargar business types');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.value = { code: '', name: '', icon: '', description: '', sort_order: undefined };
  editingItem.value = null;
  showModal.value = true;
}

function openEdit(bp: BusinessType) {
  editingItem.value = bp;
  form.value = {
    code: bp.code,
    name: bp.name,
    icon: bp.icon || '',
    description: bp.description || '',
    sort_order: bp.sort_order,
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
    const payload: Record<string, unknown> = {
      code: form.value.code,
      name: form.value.name,
      icon: form.value.icon,
      description: form.value.description,
    };
    if (form.value.sort_order !== undefined) {
      payload.sort_order = form.value.sort_order;
    }

    if (editingItem.value) {
      await fetchApi(`/api/v1/business-types/${editingItem.value.id}/`, { method: 'PATCH', data: payload });
      notifySuccess('Business Type actualizado correctamente');
    } else {
      await fetchApi('/api/v1/business-types/', { method: 'POST', data: payload });
      notifySuccess('Business Type creado correctamente');
    }
    closeModal();
    loadData();
  } catch (error) {
    notifyError(editingItem.value ? 'Error al actualizar business type' : 'Error al crear business type');
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>
