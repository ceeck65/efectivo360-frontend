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
                
                <!-- Default Categories Badge -->
                <span
                  v-if="blueprint.default_categories && blueprint.default_categories.length > 0"
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {{ blueprint.default_categories.length }} categorías
                </span>

                <!-- Groups Badge -->
                <span
                  v-if="blueprint.schema_logic && blueprint.schema_logic.grupos"
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 cursor-help"
                  :title="Object.keys(blueprint.schema_logic.grupos).join(', ')"
                >
                  {{ Object.keys(blueprint.schema_logic.grupos).length }} grupos
                </span>

                <!-- Business Conditions Badges -->
                <template v-if="blueprint.business_conditions">
                  <span
                    v-if="blueprint.business_conditions.fractional_sale"
                    class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border border-slate-200 text-slate-700 dark:border-white/[0.06] dark:text-slate-300"
                  >
                    Fraccionado
                  </span>
                  <span
                    v-if="blueprint.business_conditions.service_management"
                    class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border border-slate-200 text-slate-700 dark:border-white/[0.06] dark:text-slate-300"
                  >
                    Servicios
                  </span>
                  <span
                    v-if="blueprint.business_conditions.attribute_control"
                    class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border border-slate-200 text-slate-700 dark:border-white/[0.06] dark:text-slate-300"
                  >
                    Atributos
                  </span>
                  <span
                    v-if="blueprint.business_conditions.traceability"
                    class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border border-slate-200 text-slate-700 dark:border-white/[0.06] dark:text-slate-300"
                  >
                    Trazabilidad
                  </span>
                </template>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Código: {{ blueprint.code }}</p>
              <p
                v-if="blueprint.required_features && blueprint.required_features.length > 0"
                class="text-xs text-slate-500 dark:text-slate-400"
              >
                Features: {{ blueprint.required_features.join(', ') }}
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
                @click="openEditGroups(blueprint)"
                class="inline-flex items-center justify-center gap-1 h-8 px-3 text-sm font-medium text-slate-700 border border-purple-200 rounded-lg hover:bg-purple-50 dark:text-slate-300 dark:border-purple-900 dark:hover:bg-purple-900/20"
              >
                <Settings class="h-4 w-4 text-purple-600" />
                Grupos
              </button>
              <label class="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-white/[0.06]">
                <span class="text-slate-700 dark:text-slate-300">Activo</span>
                <button
                  @click="toggleActive(blueprint, !blueprint.is_active)"
                  :class="[
                    'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
                    blueprint.is_active ? 'bg-green-600' : 'bg-slate-200'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                      blueprint.is_active ? 'translate-x-4' : 'translate-x-0.5'
                    ]"
                  />
                </button>
              </label>
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

    <!-- Edit Groups Modal -->
    <EditBlueprintGroupsModal
      :blueprint="editingBlueprint"
      :is-open="isGroupsModalOpen"
      @close="closeGroupsModal"
      @updated="loadBlueprints"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista de gestión de blueprints (tipos de comercio)
 * @module @modules/blueprints/views/BlueprintsManagementView
 */
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import type { Blueprint } from '../types';
import { Building2, Plus, Edit3, Settings, Trash2 } from 'lucide-vue-next';
import CreateBlueprintModal from '../components/CreateBlueprintModal.vue';
import EditBlueprintModal from '../components/EditBlueprintModal.vue';
import EditBlueprintGroupsModal from '../components/EditBlueprintGroupsModal.vue';

// =============================================================================
// STATE
// =============================================================================

const authStore = useAuthStore();
const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const loading = ref(true);
const blueprints = ref<Blueprint[]>([]);
const isCreateModalOpen = ref(false);
const editingBlueprint = ref<Blueprint | null>(null);
const isEditModalOpen = ref(false);
const isGroupsModalOpen = ref(false);

// =============================================================================
// COMPUTED
// =============================================================================

const user = computed(() => authStore.user);
const isStaff = computed(() => user.value?.is_staff || false);

// =============================================================================
// METHODS
// =============================================================================

const loadBlueprints = async () => {
  try {
    loading.value = true;
    const response = await fetchApi<Blueprint[] | { results?: Blueprint[] }>('/api/v1/industry-blueprints/');
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

const openEditGroups = (blueprint: Blueprint) => {
  editingBlueprint.value = blueprint;
  isGroupsModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  editingBlueprint.value = null;
};

const closeGroupsModal = () => {
  isGroupsModalOpen.value = false;
  editingBlueprint.value = null;
};

const toggleActive = async (blueprint: Blueprint, active: boolean) => {
  try {
    await fetchApi(`/api/v1/industry-blueprints/${blueprint.id}/`, {
      method: 'PATCH',
      data: { is_active: active },
    });
    blueprints.value = blueprints.value.map(item =>
      item.id === blueprint.id ? { ...item, is_active: active } : item
    );
    notifySuccess('Estado actualizado.');
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'No se pudo actualizar el estado.');
  }
};

const handleDelete = async (blueprint: Blueprint) => {
  const confirmed = window.confirm(`¿Eliminar el tipo de comercio '${blueprint.name}'?`);
  if (!confirmed) return;
  
  try {
    await fetchApi(`/api/v1/industry-blueprints/${blueprint.id}/`, { method: 'DELETE' });
    blueprints.value = blueprints.value.filter(item => item.id !== blueprint.id);
    notifySuccess('Tipo de comercio eliminado.');
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'No se pudo eliminar el tipo de comercio.');
  }
};

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(() => {
  if (!isStaff.value) {
    notifyError('No tiene permisos para gestionar tipos de comercio');
    return;
  }
  loadBlueprints();
});
</script>
