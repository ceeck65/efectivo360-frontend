<template>
  <div class="rounded-lg border border-slate-200 bg-white overflow-hidden dark:border-white/[0.06] dark:bg-[#141824]">
    <!-- Header collapsable -->
    <button
      type="button"
      @click="expanded = !expanded"
      class="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors dark:hover:bg-[#1a1f2e]"
    >
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {{ groupKey }}
        </span>
        <span class="text-xs text-slate-500 dark:text-slate-400">
          {{ group.fields.length }} campo{{ group.fields.length !== 1 ? 's' : '' }}
        </span>
        <span v-if="hasFields && !expanded" class="text-xs text-slate-400">
          {{ group.fields.slice(0, 2).map(f => f.label || f.name).join(', ') }}
          {{ group.fields.length > 2 ? ' +' + (group.fields.length - 2) : '' }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-500 dark:text-slate-400">
          {{ expanded ? 'Colapsar' : 'Expandir' }}
        </span>
        <svg
          :class="['w-4 h-4 text-slate-400 transition-transform', expanded && 'rotate-180']"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        <button
          @click="$emit('remove')"
          class="text-red-500 hover:text-red-600"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>
    </button>

    <!-- Content expandible -->
    <div v-if="expanded" class="p-4 pt-0 space-y-3 border-t border-slate-100 dark:border-white/[0.06]">
      <div class="space-y-3 pt-3">
        <AttributeFieldEditor
          v-for="(field, idx) in group.fields"
          :key="idx"
          :field="field"
          @update="$emit('update', { fields: [...group.fields.slice(0, idx), $event, ...group.fields.slice(idx + 1)] })"
          @remove="$emit('update', { fields: group.fields.filter((_, i) => i !== idx) })"
        />
      </div>

      <button
        @click="addField"
        class="w-full py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded hover:bg-slate-50 dark:text-slate-400 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
      >
        + Agregar campo
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Editor de grupo de atributos
 * @module @modules/blueprints/components/GroupEditor
 */
import { ref, computed } from 'vue';
import type { AttributeGroup } from '../types';
import { Trash2 } from 'lucide-vue-next';
import AttributeFieldEditor from './AttributeFieldEditor.vue';

interface Props {
  groupKey: string;
  group: AttributeGroup;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  update: [group: AttributeGroup];
  remove: [];
}>();

const expanded = ref(false);

const hasFields = computed(() => props.group.fields && props.group.fields.length > 0);

const addField = () => {
  emit('update', {
    ...props.group,
    fields: [
      ...props.group.fields,
      { name: '', label: '', type: 'text', required: false },
    ],
  });
  expanded.value = true;
};
</script>
