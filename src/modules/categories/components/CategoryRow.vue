<template>
  <tr class="border-b border-slate-100 dark:border-white/[0.06]">
    <td>
      <div class="relative flex items-center gap-2" :style="{ paddingLeft: `${depth * 22}px` }">
        <span
          v-if="depth > 0"
          class="absolute -left-1 top-1/2 h-8 -translate-y-1/2 border-l border-cyan-400/35"
          :style="{ left: `${depth * 22 - 10}px` }"
        />
        <button
          v-if="hasChildren"
          type="button"
          class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-300"
          @click="$emit('toggle', node.id)"
        >
          <ChevronDown v-if="expanded" class="h-4 w-4" />
          <ChevronRight v-else class="h-4 w-4" />
        </button>
        <span
          v-else
          class="inline-block h-6 w-6 rounded-md border border-white/30 bg-white/30 dark:border-white/10 dark:bg-white/[0.03]"
        />
        <span class="font-medium text-slate-900 dark:text-white">{{ node.nombre }}</span>
      </div>
    </td>
    <td class="font-mono text-xs">{{ node.code }}</td>
    <td class="font-mono text-xs text-slate-600 dark:text-slate-300">{{ node.slug }}</td>
    <td>{{ node.icono || '-' }}</td>
    <td>
      <span v-if="blueprintName" class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
        {{ blueprintName }}
      </span>
      <span v-else class="text-xs text-slate-400">-</span>
    </td>
    <td>
      <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-300">
        {{ depth === 0 ? 'Principal' : 'Subcategoría' }}
      </span>
    </td>
    <td class="text-right">
      <button
        @click="$emit('edit', node)"
        class="p-2 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition-all dark:hover:text-cyan-300 dark:hover:bg-[#1a1f2e]"
        title="Editar"
      >
        <Pencil class="h-4 w-4" />
      </button>
    </td>
  </tr>
</template>

<script setup lang="ts">
/**
 * @fileoverview Componente de fila de categoría para tabla jerárquica
 * @module @modules/categories/components/CategoryRow
 */
import { computed } from 'vue';
import type { CategoryNode, BlueprintOption } from '../types';
import { ChevronDown, ChevronRight, Pencil } from 'lucide-vue-next';

interface Props {
  node: CategoryNode;
  depth: number;
  expanded: boolean;
  blueprints: BlueprintOption[];
}

const props = defineProps<Props>();

defineEmits<{
  toggle: [id: number];
  edit: [category: CategoryNode];
}>();

const hasChildren = computed(() => (props.node.children ?? []).length > 0);

const blueprintName = computed(() => {
  if (!props.node.blueprint_id) return null;
  const bp = props.blueprints.find(b => b.id === props.node.blueprint_id);
  return bp?.name || null;
});
</script>
