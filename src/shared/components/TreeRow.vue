<template>
    <!-- Current Row -->
    <tr 
      :class="[
        'hover:bg-gray-50 transition-colors cursor-pointer',
        isSelected ? 'bg-blue-50 hover:bg-blue-100' : '',
      ]"
      @click="selectNode"
    >
      <td
        v-for="column in columns"
        :key="column.field"
        class="px-4 py-3 text-sm"
        :class="{ 'text-gray-900': !isSelected, 'text-blue-900': isSelected }"
      >
        <!-- Tree column with indentation -->
        <div 
          v-if="column.type === 'tree'"
          class="flex items-center gap-2"
          :style="{ paddingLeft: `${level * 24}px` }"
        >
          <!-- Expand/Collapse button -->
          <button
            v-if="hasChildren"
            @click.stop="toggleNode"
            class="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
          >
            <ChevronRight 
              v-if="!isExpanded" 
              class="w-4 h-4 text-gray-500" 
            />
            <ChevronDown 
              v-else 
              class="w-4 h-4 text-gray-500" 
            />
          </button>
          <span v-else class="w-5"></span>

          <!-- Icon -->
          <component
            v-if="node.category.icon"
            :is="getIconComponent(node.category.icon)"
            class="w-4 h-4"
            :style="{ color: node.category.color || '#6B7280' }"
          />
          <Folder v-else class="w-4 h-4 text-gray-400" />

          <!-- Name -->
          <span class="font-medium">{{ node.category.name }}</span>

          <!-- Loading indicator -->
          <Loader2 v-if="node.isLoading" class="w-4 h-4 animate-spin text-gray-400" />
        </div>

        <!-- Text column -->
        <span v-else-if="column.type === 'text'">
          {{ formatValue(node.category[column.field as keyof Category], column) }}
        </span>

        <!-- Number column -->
        <span v-else-if="column.type === 'number'" class="text-gray-600">
          {{ formatNumber(node.category[column.field as keyof Category]) }}
        </span>

        <!-- Badge column -->
        <span
          v-else-if="column.type === 'badge'"
          :class="getBadgeClass(node.category[column.field as keyof Category])"
          class="px-2 py-1 text-xs rounded-full"
        >
          {{ formatValue(node.category[column.field as keyof Category], column) }}
        </span>

        <!-- Icon column -->
        <component
          v-else-if="column.type === 'icon' && node.category[column.field as keyof Category]"
          :is="getIconComponent(String(node.category[column.field as keyof Category]))"
          class="w-5 h-5"
        />

        <!-- Default text -->
        <span v-else class="text-gray-600">
          {{ formatValue(node.category[column.field as keyof Category], column) }}
        </span>
      </td>

      <!-- Actions column -->
      <td v-if="hasActions" class="px-4 py-3 text-right">
        <div class="flex items-center justify-end gap-1">
          <button
            @click.stop="$emit('action', 'edit', node)"
            class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Editar"
          >
            <Pencil class="w-4 h-4" />
          </button>
          <button
            @click.stop="$emit('action', 'delete', node)"
            class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Eliminar"
          >
            <Trash2 class="w-4 h-4" />
          </button>
          <slot name="row-actions" :node="node" />
        </div>
      </td>
    </tr>

    <!-- Children rows (recursive) -->
    <template v-if="isExpanded && node.children && node.children.length > 0">
      <TreeRow
        v-for="child in node.children"
        :key="child.category.id"
        :node="child"
        :columns="columns"
        :level="level + 1"
        :expanded-nodes="expandedNodes"
        :has-actions="hasActions"
        @toggle="(id: string) => $emit('toggle', id)"
        @select="(n: CategoryTree) => $emit('select', n)"
        @action="(a: string, n: CategoryTree) => $emit('action', a, n)"
      />
    </template>
</template>

<script setup lang="ts">
/**
 * @fileoverview Fila recursiva para DataTableJerarquica
 * @module @shared/components/TreeRow
 * 
 * Componente interno que renderiza una fila y sus hijos recursivamente.
 */
import { computed, inject } from 'vue';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  Pencil, 
  Trash2, 
  Loader2,
} from 'lucide-vue-next';
import type { CategoryTree, HierarchyColumn, Category } from '@modules/master-data/types';

// =============================================================================
// PROPS
// =============================================================================

interface Props {
  node: CategoryTree;
  columns: HierarchyColumn[];
  level: number;
  expandedNodes: Set<string>;
  hasActions: boolean;
}

const props = defineProps<Props>();

// =============================================================================
// EMITS
// =============================================================================

const emit = defineEmits<{
  toggle: [nodeId: string];
  select: [node: CategoryTree];
  action: [action: string, node: CategoryTree];
}>();

// =============================================================================
// INJECTED CONTEXT
// =============================================================================

const context = inject<{
  isExpanded: (id: string) => boolean;
  isSelected: (id: string) => boolean;
}>('dataTableJerarquica');

// =============================================================================
// COMPUTED
// =============================================================================

const isExpanded = computed(() => 
  context?.isExpanded(props.node.category.id) || props.expandedNodes.has(props.node.category.id)
);

const isSelected = computed(() => 
  context?.isSelected(props.node.category.id) || false
);

const hasChildren = computed(() => 
  props.node.children && props.node.children.length > 0
);

// =============================================================================
// METHODS
// =============================================================================

function toggleNode(): void {
  emit('toggle', props.node.category.id);
}

function selectNode(): void {
  emit('select', props.node);
}

function formatValue(value: unknown, column: HierarchyColumn): string {
  if (value === null || value === undefined) return '-';
  if (column.format) return column.format(value, props.node.category);
  return String(value);
}

function formatNumber(value: unknown): string {
  if (typeof value === 'number') return value.toLocaleString('es-ES');
  return String(value);
}

function getBadgeClass(value: unknown): string {
  if (typeof value === 'boolean') {
    return value 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }
  return 'bg-gray-100 text-gray-800';
}

// Map icon names to Lucide components
const iconMap: Record<string, any> = {
  Folder,
  Pencil,
  Trash2,
  Loader2,
};

function getIconComponent(name: string): any {
  return iconMap[name] || Folder;
}
</script>

<style scoped>
tr {
  @apply border-b border-gray-100 last:border-b-0;
}
</style>
