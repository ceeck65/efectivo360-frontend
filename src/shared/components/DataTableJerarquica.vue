<template>
  <div class="data-table-jerarquica">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <h3 v-if="title" class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        <div class="flex items-center gap-2">
          <button
            @click="expandAll"
            class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Expandir todo
          </button>
          <button
            @click="collapseAll"
            class="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Colapsar todo
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <!-- Table -->
    <div class="border border-gray-200 rounded-lg overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th 
              v-for="column in columns" 
              :key="column.field"
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              :style="{ width: column.width }"
            >
              {{ column.header }}
            </th>
            <th v-if="hasActions" class="px-4 py-3 text-right w-20">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <template v-if="nodes.length > 0">
            <TreeRow
              v-for="node in nodes"
              :key="node.category.id"
              :node="node"
              :columns="columns"
              :level="0"
              :expanded-nodes="expandedNodes"
              :has-actions="hasActions"
              @toggle="toggleNode"
              @select="selectNode"
              @action="handleAction"
            >
              <template #row-actions="{ node: rowNode }">
                <slot name="row-actions" :node="rowNode" />
              </template>
            </TreeRow>
          </template>
          <tr v-else>
            <td :colspan="columns.length + (hasActions ? 1 : 0)" class="px-4 py-8 text-center text-gray-500">
              <slot name="empty">
                No hay categorías para mostrar
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Selected Node Info -->
    <div v-if="selectedNode && showDetails" class="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 class="font-medium text-gray-900 mb-2">{{ selectedNode.category.name }}</h4>
      <div class="text-sm text-gray-600 space-y-1">
        <p>Código: {{ selectedNode.category.code }}</p>
        <p v-if="selectedNode.category.blueprintId">Blueprint: {{ getBlueprintName(selectedNode.category.blueprintId) }}</p>
        <p>Productos: {{ selectedNode.category.productCount || 0 }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview DataTable jerárquica recursiva para categorías
 * @module @shared/components/DataTableJerarquica
 * 
 * Componente recursivo que renderiza árbol de categorías con Blueprints.
 * Soporta expandir/colapsar, selección y acciones por fila.
 */
import { ref, computed, provide, inject } from 'vue';
import TreeRow from './TreeRow.vue';
import type { CategoryTree, HierarchyColumn, Blueprint } from '@modules/master-data/types';

// =============================================================================
// PROPS
// =============================================================================

interface Props {
  nodes: CategoryTree[];
  columns?: HierarchyColumn[];
  title?: string;
  showDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => defaultColumns,
  showDetails: true,
});

// Default columns
const defaultColumns: HierarchyColumn[] = [
  { field: 'name', header: 'Nombre', type: 'tree', width: '40%' },
  { field: 'code', header: 'Código', type: 'text', width: '20%' },
  { field: 'productCount', header: 'Productos', type: 'number', width: '15%' },
  { field: 'isActive', header: 'Estado', type: 'badge', width: '15%' },
];

// =============================================================================
// EMITS
// =============================================================================

const emit = defineEmits<{
  toggle: [nodeId: string];
  select: [node: CategoryTree];
  action: [action: string, node: CategoryTree];
}>();

// =============================================================================
// STATE
// =============================================================================

const expandedNodes = ref<Set<string>>(new Set());
const selectedNode = ref<CategoryTree | null>(null);

const hasActions = computed(() => {
  // Check if row-actions slot is provided
  return true; // Always show actions column, content will be empty if no slot
});

// Blueprint context (injected from parent)
const blueprints = inject<Blueprint[]>('blueprints', []);

// =============================================================================
// METHODS
// =============================================================================

function toggleNode(nodeId: string): void {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId);
  } else {
    expandedNodes.value.add(nodeId);
  }
  emit('toggle', nodeId);
}

function expandAll(): void {
  function addAll(nodes: CategoryTree[]) {
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        expandedNodes.value.add(node.category.id);
        addAll(node.children);
      }
    });
  }
  addAll(props.nodes);
}

function collapseAll(): void {
  expandedNodes.value.clear();
}

function selectNode(node: CategoryTree): void {
  selectedNode.value = node;
  emit('select', node);
}

function handleAction(action: string, node: CategoryTree): void {
  emit('action', action, node);
}

function getBlueprintName(blueprintId: string): string {
  const blueprint = blueprints.find(b => b.id === blueprintId);
  return blueprint?.name || 'N/A';
}

// =============================================================================
// PROVIDE CONTEXT
// =============================================================================

provide('dataTableJerarquica', {
  toggleNode,
  selectNode,
  isExpanded: (id: string) => expandedNodes.value.has(id),
  isSelected: (id: string) => selectedNode.value?.category.id === id,
});
</script>

<style scoped>
.data-table-jerarquica {
  @apply w-full;
}
</style>
