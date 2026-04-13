<template>
  <div class="blueprints-management p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Configuración de Rubros</h1>
        <p class="text-gray-600 mt-1">
          Gestiona la jerarquía de categorías y los blueprints con atributos dinámicos
        </p>
      </div>
      <div class="flex gap-3">
        <button
          @click="showCreateBlueprint = true"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus class="w-4 h-4" />
          Nuevo Blueprint
        </button>
        <button
          @click="showCreateCategory = true"
          class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FolderPlus class="w-4 h-4" />
          Nueva Categoría
        </button>
      </div>
    </div>

    <!-- Info Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Palette class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-blue-600 font-medium">Blueprints</p>
            <p class="text-2xl font-bold text-blue-900">{{ blueprints.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-green-50 border border-green-100 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <FolderTree class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-green-600 font-medium">Categorías</p>
            <p class="text-2xl font-bold text-green-900">{{ totalCategories }}</p>
          </div>
        </div>
      </div>
      <div class="bg-purple-50 border border-purple-100 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Tags class="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p class="text-sm text-purple-600 font-medium">Atributos Dinámicos</p>
            <p class="text-2xl font-bold text-purple-900">{{ totalAttributes }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="flex gap-8">
        <button
          @click="activeTab = 'tree'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === 'tree'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          <div class="flex items-center gap-2">
            <GitBranch class="w-4 h-4" />
            Árbol de Categorías
          </div>
        </button>
        <button
          @click="activeTab = 'blueprints'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === 'blueprints'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          <div class="flex items-center gap-2">
            <FileJson class="w-4 h-4" />
            Blueprints
          </div>
        </button>
        <button
          @click="activeTab = 'attributes'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === 'attributes'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          <div class="flex items-center gap-2">
            <Tags class="w-4 h-4" />
            Atributos
          </div>
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <!-- Tree View -->
      <div v-if="activeTab === 'tree'" class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Jerarquía de Categorías</h2>
          <div class="flex gap-2">
            <button
              @click="expandAll"
              class="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ExpandAll class="w-4 h-4 inline mr-1" />
              Expandir todo
            </button>
            <button
              @click="collapseAll"
              class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CollapseAll class="w-4 h-4 inline mr-1" />
              Colapsar todo
            </button>
          </div>
        </div>
        
        <!-- DataTable Jerárquica -->
        <DataTableJerarquica
          :nodes="categoryTree"
          :columns="categoryColumns"
          title=""
          @toggle="handleToggle"
          @select="handleSelect"
          @action="handleAction"
        >
          <template #row-actions="{ node }">
            <div class="flex items-center gap-1">
              <button
                @click="editCategory(node.category)"
                class="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Editar"
              >
                <Pencil class="w-4 h-4" />
              </button>
              <button
                @click="addSubcategory(node.category)"
                class="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Agregar subcategoría"
              >
                <Plus class="w-4 h-4" />
              </button>
              <button
                v-if="!node.children || node.children.length === 0"
                @click="deleteCategory(node.category)"
                class="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Eliminar"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </template>
        </DataTableJerarquica>
      </div>

      <!-- Blueprints View -->
      <div v-else-if="activeTab === 'blueprints'" class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="blueprint in blueprints"
            :key="blueprint.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div 
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :style="{ backgroundColor: blueprint.color || '#EEF2FF' }"
                >
                  <component :is="getIcon(blueprint.icon || 'FileJson')" class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">{{ blueprint.name }}</h3>
                  <p class="text-xs text-gray-500">{{ blueprint.code }}</p>
                </div>
              </div>
              <div class="flex gap-1">
                <button
                  @click="editBlueprint(blueprint)"
                  class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  @click="cloneBlueprint(blueprint)"
                  class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                >
                  <Copy class="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p class="text-sm text-gray-600 mb-3 line-clamp-2">
              {{ blueprint.description || 'Sin descripción' }}
            </p>
            
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">
                {{ blueprint.attributes.length }} atributos
              </span>
              <span 
                v-if="getCategoryCountForBlueprint(blueprint.id) > 0"
                class="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs"
              >
                {{ getCategoryCountForBlueprint(blueprint.id) }} categorías
              </span>
            </div>
            
            <!-- Atributos preview -->
            <div v-if="blueprint.attributes.length > 0" class="mt-3 pt-3 border-t border-gray-100">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="attr in blueprint.attributes.slice(0, 3)"
                  :key="attr.id"
                  class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {{ attr.name }}
                </span>
                <span
                  v-if="blueprint.attributes.length > 3"
                  class="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded"
                >
                  +{{ blueprint.attributes.length - 3 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Attributes View -->
      <div v-else-if="activeTab === 'attributes'" class="p-6">
        <div class="space-y-4">
          <div
            v-for="blueprint in blueprints"
            :key="blueprint.id"
            class="border border-gray-200 rounded-lg"
          >
            <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
              <h3 class="font-semibold text-gray-900">{{ blueprint.name }}</h3>
            </div>
            <div class="divide-y divide-gray-100">
              <div
                v-for="attr in blueprint.attributes"
                :key="attr.id"
                class="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
              >
                <div class="flex items-center gap-3">
                  <span 
                    class="w-8 h-8 rounded flex items-center justify-center text-xs font-medium"
                    :class="getAttributeTypeClass(attr.type)"
                  >
                    {{ getAttributeTypeLabel(attr.type) }}
                  </span>
                  <div>
                    <p class="font-medium text-gray-900">{{ attr.name }}</p>
                    <p class="text-xs text-gray-500">{{ attr.code }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="attr.isRequired" class="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                    Requerido
                  </span>
                  <span v-if="attr.isFilterable" class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    Filtro
                  </span>
                </div>
              </div>
              <div v-if="blueprint.attributes.length === 0" class="px-4 py-6 text-center text-gray-500">
                Este blueprint no tiene atributos definidos
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Category Details Panel -->
    <div
      v-if="selectedCategory"
      class="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 z-50 overflow-y-auto"
    >
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-gray-900">Detalles de Categoría</h2>
          <button
            @click="selectedCategory = null"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <p class="text-gray-900">{{ selectedCategory.name }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <p class="text-gray-900 font-mono">{{ selectedCategory.code }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Blueprint</label>
            <p class="text-gray-900">{{ getBlueprintName(selectedCategory.blueprintId) }}</p>
          </div>
          <div v-if="selectedCategory.description">
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <p class="text-gray-600">{{ selectedCategory.description }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Productos</label>
            <p class="text-2xl font-bold text-gray-900">{{ selectedCategory.productCount || 0 }}</p>
          </div>
        </div>
        
        <div class="mt-6 pt-6 border-t border-gray-200">
          <h3 class="font-medium text-gray-900 mb-3">Atributos del Blueprint</h3>
          <div class="space-y-2">
            <div
              v-for="attr in getBlueprintAttributes(selectedCategory.blueprintId)"
              :key="attr.id"
              class="flex items-center justify-between py-2"
            >
              <span class="text-sm text-gray-700">{{ attr.name }}</span>
              <span class="text-xs text-gray-500">{{ attr.type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista de gestión de Blueprints y Categorías
 * @module @modules/master-data/views/BlueprintsManagement
 * 
 * Integra DataTableJerarquica para la gestión de categorías con blueprints.
 * Soporta atributos dinámicos según el rubro del comercio.
 */
import { ref, computed, onMounted } from 'vue';
import {
  Plus,
  FolderPlus,
  Palette,
  FolderTree,
  Tags,
  GitBranch,
  FileJson,
  Pencil,
  Trash2,
  Copy,
  X,
} from 'lucide-vue-next';
import DataTableJerarquica from '@/shared/components/DataTableJerarquica.vue';
import { useMasterData } from '@/modules/master-data/composables/useMasterData';
import type { CategoryTree, Category, Blueprint, HierarchyColumn } from '@/modules/master-data/types';

// =============================================================================
// STATE
// =============================================================================

const activeTab = ref<'tree' | 'blueprints' | 'attributes'>('tree');
const selectedCategory = ref<Category | null>(null);
const showCreateBlueprint = ref(false);
const showCreateCategory = ref(false);

// =============================================================================
// MASTER DATA COMPOSABLE
// =============================================================================

const {
  blueprints,
  categoryTree,
  flatCategories,
  initialize,
  toggleExpand,
  getBlueprintById,
} = useMasterData();

// =============================================================================
// COMPUTED
// =============================================================================

const totalCategories = computed(() => flatCategories.value.length);

const totalAttributes = computed(() => 
  blueprints.value.reduce((sum, b) => sum + b.attributes.length, 0)
);

const categoryColumns: HierarchyColumn[] = [
  { field: 'name', header: 'Nombre', type: 'tree', width: '50%' },
  { field: 'code', header: 'Código', type: 'text', width: '20%' },
  { field: 'productCount', header: 'Productos', type: 'number', width: '15%' },
  { field: 'isActive', header: 'Estado', type: 'badge', width: '15%' },
];

// =============================================================================
// METHODS
// =============================================================================

function expandAll() {
  // Implementar expansión completa
  flatCategories.value.forEach(c => toggleExpand(c.id));
}

function collapseAll() {
  // Implementar colapso completo
}

function handleToggle(nodeId: string) {
  toggleExpand(nodeId);
}

function handleSelect(node: CategoryTree) {
  selectedCategory.value = node.category;
}

function handleAction(action: string, node: CategoryTree) {
  switch (action) {
    case 'edit':
      editCategory(node.category);
      break;
    case 'delete':
      deleteCategory(node.category);
      break;
  }
}

function editCategory(category: Category) {
  selectedCategory.value = category;
  // Abrir modal de edición
}

function addSubcategory(_parentCategory: Category) {
  // Crear nueva categoría con parentId predefinido
  showCreateCategory.value = true;
}

function deleteCategory(category: Category) {
  const confirmed = confirm(`¿Eliminar la categoría "${category.name}"?`);
  if (confirmed) {
    // Llamar al store para eliminar
  }
}

function editBlueprint(_blueprint: Blueprint) {
  // Abrir modal de edición
}

function cloneBlueprint(_blueprint: Blueprint) {
  // Clonar blueprint
}

function getBlueprintName(id: string): string {
  return getBlueprintById(id)?.name || 'Sin blueprint';
}

function getBlueprintAttributes(blueprintId: string) {
  return getBlueprintById(blueprintId)?.attributes || [];
}

function getCategoryCountForBlueprint(blueprintId: string): number {
  return flatCategories.value.filter(c => c.blueprintId === blueprintId).length;
}

// Icon mapping
const iconMap: Record<string, any> = {
  FileJson,
  FolderTree,
  Palette,
  Plus,
  FolderPlus,
  Tags,
  GitBranch,
  Pencil,
  Trash2,
  Copy,
  X,
};

function getIcon(name: string): any {
  return iconMap[name] || FileJson;
}

// Attribute type styling
function getAttributeTypeClass(type: string): string {
  const classes: Record<string, string> = {
    string: 'bg-blue-100 text-blue-700',
    number: 'bg-green-100 text-green-700',
    select: 'bg-purple-100 text-purple-700',
    color: 'bg-pink-100 text-pink-700',
    size: 'bg-orange-100 text-orange-700',
    boolean: 'bg-gray-100 text-gray-700',
  };
  return classes[type] || 'bg-gray-100 text-gray-700';
}

function getAttributeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    string: 'ABC',
    number: '123',
    select: '▼',
    color: '●',
    size: 'R',
    boolean: '✓',
  };
  return labels[type] || '?';
}

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(() => {
  initialize();
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
