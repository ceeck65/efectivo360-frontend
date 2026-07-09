<template>
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          <Building2 class="h-7 w-7 text-cyan-500" />
          Tipos de Comercio
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Administra los tipos de comercio que aparecen en el wizard de configuración inicial.
        </p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        <Plus class="h-4 w-4" />
        Crear tipo
      </button>
    </div>

    <!-- Card with Blueprints List -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
      <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Tipos de comercio cargados</h3>
      </div>

      <div class="p-6 space-y-3">
        <!-- Loading State -->
        <div v-if="loading" class="text-sm text-slate-500 dark:text-slate-400">
          Cargando tipos de comercio...
        </div>

        <!-- Empty State -->
        <div v-else-if="blueprints.length === 0" class="text-sm text-slate-500 dark:text-slate-400">
          No hay tipos de comercio aún.
        </div>

        <!-- Blueprints List -->
        <div
          v-for="blueprint in blueprints"
          :key="blueprint.id"
          class="rounded-md border border-slate-200 p-3 dark:border-white/[0.06]"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <p class="font-medium text-slate-900 dark:text-white">{{ blueprint.name }}</p>
                <span
                  v-if="blueprint.sort_order !== undefined"
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Orden: {{ blueprint.sort_order }}
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Código: {{ blueprint.code }}</p>
              <p
                v-if="blueprint.description"
                class="text-xs text-slate-500 dark:text-slate-400"
              >
                {{ blueprint.description }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="openEdit(blueprint)"
                class="inline-flex items-center justify-center gap-1 h-8 px-3 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
              >
                <Edit3 class="h-4 w-4" />
                Editar
              </button>
              <button
                @click="handleDelete(blueprint)"
                class="inline-flex items-center justify-center gap-1 h-8 px-3 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-900/20"
              >
                <Trash2 class="h-4 w-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <CreateBlueprintModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @created="loadBlueprints"
    />

    <!-- Edit Modal -->
    <EditBlueprintModal
      :blueprint="editingBlueprint"
      :is-open="isEditModalOpen"
      @close="closeEditModal"
      @updated="loadBlueprints"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import type { Blueprint } from '../types';
import { Building2, Plus, Edit3, Trash2 } from 'lucide-vue-next';
import CreateBlueprintModal from '../components/CreateBlueprintModal.vue';
import EditBlueprintModal from '../components/EditBlueprintModal.vue';

const authStore = useAuthStore();
const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const loading = ref(true);
const blueprints = ref<Blueprint[]>([]);
const isCreateModalOpen = ref(false);
const editingBlueprint = ref<Blueprint | null>(null);
const isEditModalOpen = ref(false);

const user = computed(() => authStore.user);
const isStaff = computed(() => user.value?.is_staff || false);

const loadBlueprints = async () => {
  try {
    loading.value = true;
    const response = await fetchApi<Blueprint[] | { results?: Blueprint[] }>('/api/v1/business-types/');
    blueprints.value = Array.isArray(response) ? response : (response as { results?: Blueprint[] }).results ?? [];
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'No se pudieron cargar los tipos de comercio.');
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  isCreateModalOpen.value = true;
};

const openEdit = (blueprint: Blueprint) => {
  editingBlueprint.value = blueprint;
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  editingBlueprint.value = null;
};

const handleDelete = async (blueprint: Blueprint) => {
  const confirmed = window.confirm(`¿Eliminar el tipo de comercio '${blueprint.name}'?`);
  if (!confirmed) return;
  
  try {
    await fetchApi(`/api/v1/business-types/${blueprint.id}/`, { method: 'DELETE' });
    blueprints.value = blueprints.value.filter(item => item.id !== blueprint.id);
    notifySuccess('Tipo de comercio eliminado.');
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'No se pudo eliminar el tipo de comercio.');
  }
};

onMounted(() => {
  if (!isStaff.value) {
    notifyError('No tiene permisos para gestionar tipos de comercio');
    return;
  }
  loadBlueprints();
});
</script>
