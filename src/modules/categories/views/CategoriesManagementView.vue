<template>
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          <Waypoints class="h-8 w-8 text-cyan-500" />
          Categorías y Subcategorías ERP
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gestiona la jerarquía de catálogo con Blueprints y herencia de atributos.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          @click="loadCategories"
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
        >
          <RefreshCw :class="['h-4 w-4', loading && 'animate-spin']" />
          Recargar
        </button>
        <button
          @click="openCreate"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700"
        >
          <Plus class="h-4 w-4" />
          Nueva categoría
        </button>
      </div>
    </div>

    <!-- Card with Categories Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm dark:border-white/[0.06] dark:bg-[#141824]">
      <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Boxes class="h-5 w-5 text-cyan-500" />
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              DataTable Jerárquica con Blueprints
            </h3>
          </div>
          <div class="relative w-64">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Buscar por nombre, código o slug"
              class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/50 dark:bg-[#1a1f2e]/50">
            <tr>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Nombre</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Código</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Slug</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Icono</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Blueprint</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Tipo</th>
              <th class="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right dark:text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <!-- Loading State -->
            <tr v-if="loading">
              <td colspan="7" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                <RefreshCw class="mx-auto mb-2 h-5 w-5 animate-spin" />
                Cargando categorías...
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="filteredTree.length === 0">
              <td colspan="7" class="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                No hay categorías para mostrar.
              </td>
            </tr>

            <!-- Categories List -->
            <template v-else>
              <CategoryRow
                v-for="item in renderRows(filteredTree)"
                :key="item.node.id"
                :node="item.node"
                :depth="item.depth"
                :expanded="expandedRows.has(item.node.id)"
                :blueprints="blueprints"
                @toggle="toggleRow"
                @edit="openEdit"
              />
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="createModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Nueva Categoría</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Crea una nueva categoría principal o subcategoría, opcionalmente con un Blueprint.
          </p>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
            <input
              v-model="createNombre"
              type="text"
              placeholder="Ej: Cervezas"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Icono (Lucide)</label>
            <input
              v-model="createIcono"
              type="text"
              placeholder="Ej: beer"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Tipo / Padre</label>
            <select
              v-model="createParentId"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            >
              <option value="__ROOT__">Categoría principal</option>
              <option v-for="option in parentOptions" :key="option.id" :value="option.id">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Industry Blueprint</label>
            <select
              v-model="createBlueprintId"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            >
              <option value="__NONE__">Sin blueprint (heredar del padre)</option>
              <option v-for="bp in blueprints" :key="bp.id" :value="bp.id">
                {{ bp.name }} ({{ bp.code }})
              </option>
            </select>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Si no seleccionas un blueprint, la categoría heredará del padre.
            </p>
          </div>
        </div>

        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button
            @click="createModalOpen = false"
            :disabled="saving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
          >
            Cancelar
          </button>
          <button
            @click="handleCreate"
            :disabled="saving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50"
          >
            {{ saving ? 'Creando...' : 'Crear categoría' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 dark:bg-[#141824]">
        <div class="border-b border-slate-200 p-6 dark:border-white/[0.06]">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Editar Categoría</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Modifica el nombre, icono o asigna un Blueprint para herencia de atributos.
          </p>
        </div>

        <div class="p-6 space-y-4">
          <div v-if="editingCategory" class="flex items-center gap-2 rounded-lg bg-purple-50 p-3 dark:bg-purple-950/20">
            <span class="text-sm text-slate-600 dark:text-slate-400">Blueprint asociado:</span>
            <span v-if="getBlueprintName(editingCategory.blueprint_id)" class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              {{ getBlueprintName(editingCategory.blueprint_id) }}
            </span>
            <span v-else class="text-sm text-slate-400 italic">Sin blueprint (heredará del padre)</span>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre</label>
            <input
              v-model="editNombre"
              type="text"
              placeholder="Nombre de la categoría"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Icono (Lucide)</label>
            <input
              v-model="editIcono"
              type="text"
              placeholder="Ej: beer"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Industry Blueprint</label>
            <select
              v-model="editBlueprintId"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            >
              <option value="__NONE__">Sin blueprint (heredar del padre)</option>
              <option v-for="bp in blueprints" :key="bp.id" :value="bp.id">
                {{ bp.name }} ({{ bp.code }})
              </option>
            </select>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Si no seleccionas un blueprint, la categoría heredará del padre.
            </p>
          </div>
        </div>

        <div class="border-t border-slate-200 p-6 flex justify-end gap-2 dark:border-white/[0.06]">
          <button
            @click="editModalOpen = false"
            :disabled="saving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
          >
            Cancelar
          </button>
          <button
            @click="handleUpdate"
            :disabled="saving"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50"
          >
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista de gestión de categorías jerárquicas
 * @module @modules/categories/views/CategoriesManagementView
 */
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import type { CategoryNode, CategoryParentOption, BlueprintOption } from '../types';
import { Boxes, Waypoints, Plus, RefreshCw, Search } from 'lucide-vue-next';
import CategoryRow from '../components/CategoryRow.vue';

const ROOT_PARENT = '__ROOT__';

// =============================================================================
// STATE
// =============================================================================

const authStore = useAuthStore();
const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const categories = ref<CategoryNode[]>([]);
const blueprints = ref<BlueprintOption[]>([]);
const loading = ref(true);
const saving = ref(false);
const search = ref('');
const expandedRows = ref<Set<number>>(new Set());

const createModalOpen = ref(false);
const createNombre = ref('');
const createIcono = ref('');
const createParentId = ref(ROOT_PARENT);
const createBlueprintId = ref('');

const editModalOpen = ref(false);
const editingCategory = ref<CategoryNode | null>(null);
const editNombre = ref('');
const editIcono = ref('');
const editBlueprintId = ref('');

// =============================================================================
// COMPUTED
// =============================================================================

const user = computed(() => authStore.user);
const isStaff = computed(() => user.value?.is_staff || false);

const parentOptions = computed(() => flattenTree(categories.value));

const filteredTree = computed(() => filterTree(categories.value, search.value));

// =============================================================================
// METHODS
// =============================================================================

const buildFullLabel = (path: string[]) => path.join(' > ');

const flattenTree = (nodes: CategoryNode[], path: string[] = []): CategoryParentOption[] => {
  const result: CategoryParentOption[] = [];
  for (const node of nodes) {
    const nextPath = [...path, node.nombre];
    result.push({ id: node.id, label: buildFullLabel(nextPath) });
    result.push(...flattenTree(node.children ?? [], nextPath));
  }
  return result;
};

const nodeMatches = (node: CategoryNode, query: string): boolean => {
  const q = query.toLowerCase();
  return (
    node.nombre.toLowerCase().includes(q) ||
    node.code.toLowerCase().includes(q) ||
    node.slug.toLowerCase().includes(q)
  );
};

const filterTree = (nodes: CategoryNode[], query: string): CategoryNode[] => {
  if (!query.trim()) return nodes;

  return nodes
    .map((node) => {
      const children = filterTree(node.children ?? [], query);
      if (nodeMatches(node, query) || children.length > 0) {
        return { ...node, children };
      }
      return null;
    })
    .filter((node): node is CategoryNode => Boolean(node));
};

const toggleRow = (id: number) => {
  const next = new Set(expandedRows.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedRows.value = next;
};

const getBlueprintName = (blueprintId: number | null) => {
  if (!blueprintId) return null;
  const bp = blueprints.value.find(b => b.id === blueprintId);
  return bp?.name || null;
};

const renderRows = (nodes: CategoryNode[], depth = 0) => {
  const result: Array<{ node: CategoryNode; depth: number }> = [];

  for (const node of nodes) {
    result.push({ node, depth });
    if ((node.children ?? []).length > 0 && expandedRows.value.has(node.id)) {
      result.push(...renderRows(node.children, depth + 1));
    }
  }

  return result;
};

const loadCategories = async () => {
  try {
    loading.value = true;
    const data = await fetchApi<CategoryNode[]>('/api/v1/global/categorias/');
    categories.value = Array.isArray(data) ? data : [];
    expandedRows.value = new Set(categories.value.map(item => item.id));
  } catch (error) {
    notifyError('Error al cargar categorías.');
  } finally {
    loading.value = false;
  }
};

const loadBlueprints = async () => {
  try {
    const data = await fetchApi<{ results: BlueprintOption[] }>('/api/v1/industry-blueprints/');
    blueprints.value = data.results || [];
  } catch {
    blueprints.value = [];
  }
};

const openCreate = () => {
  createNombre.value = '';
  createIcono.value = '';
  createParentId.value = ROOT_PARENT;
  createBlueprintId.value = '';
  createModalOpen.value = true;
};

const handleCreate = async () => {
  if (!createNombre.value.trim()) {
    notifyError('El nombre de la categoría es obligatorio.');
    return;
  }

  try {
    saving.value = true;
    const payload: Record<string, unknown> = {
      nombre: createNombre.value.trim(),
      icon: createIcono.value.trim(),
    };

    if (createParentId.value !== ROOT_PARENT) {
      payload.parent_id = Number(createParentId.value);
    }

    if (createBlueprintId.value && createBlueprintId.value !== '__NONE__') {
      payload.industry_blueprint_id = Number(createBlueprintId.value);
    }

    await fetchApi('/api/v1/global/categorias/', {
      method: 'POST',
      data: payload,
    });

    notifySuccess('Categoría creada correctamente.');

    createModalOpen.value = false;
    createNombre.value = '';
    createIcono.value = '';
    createParentId.value = ROOT_PARENT;
    createBlueprintId.value = '';
    await loadCategories();
  } catch (error) {
    notifyError('Error al crear la categoría.');
  } finally {
    saving.value = false;
  }
};

const openEdit = (category: CategoryNode) => {
  editingCategory.value = category;
  editNombre.value = category.nombre;
  editIcono.value = category.icono || '';
  editBlueprintId.value = category.blueprint_id?.toString() || '__NONE__';
  editModalOpen.value = true;
};

const handleUpdate = async () => {
  if (!editingCategory.value || !editNombre.value.trim()) {
    notifyError('El nombre de la categoría es obligatorio.');
    return;
  }

  try {
    saving.value = true;
    const payload: Record<string, unknown> = {
      nombre: editNombre.value.trim(),
      icon: editIcono.value.trim(),
    };

    if (editBlueprintId.value && editBlueprintId.value !== '__NONE__') {
      payload.industry_blueprint_id = Number(editBlueprintId.value);
    } else {
      payload.industry_blueprint_id = null;
    }

    await fetchApi(`/api/v1/categories/${editingCategory.value.id}/`, {
      method: 'PATCH',
      data: payload,
    });

    notifySuccess('Categoría actualizada correctamente.');

    editModalOpen.value = false;
    editingCategory.value = null;
    await loadCategories();
  } catch (error) {
    notifyError('Error al actualizar la categoría.');
  } finally {
    saving.value = false;
  }
};

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(() => {
  if (!isStaff.value) {
    notifyError('No tiene permisos para gestionar categorías');
    return;
  }
  loadCategories();
  loadBlueprints();
});
</script>
