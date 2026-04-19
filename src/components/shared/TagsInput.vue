<template>
  <div class="space-y-2">
    <div v-if="label" class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ label }}</div>
    <div class="flex flex-wrap gap-2 rounded-md border border-slate-200 p-2 dark:border-white/[0.06]">
      <span
        v-for="tag in tags"
        :key="tag"
        class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
      >
        {{ tag }}
        <button
          type="button"
          @click="removeTag(tag)"
          class="text-slate-500 hover:text-red-500"
        >
          ×
        </button>
      </span>
      <input
        v-model="inputValue"
        @keydown="handleKeyDown"
        @blur="inputValue && addTag(inputValue)"
        :placeholder="placeholder || 'Escribe y presiona Enter...'"
        class="flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm dark:bg-transparent dark:text-slate-300"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Componente de input de tags
 * @module @components/shared/TagsInput
 */
import { ref } from 'vue';

interface Props {
  label?: string;
  tags: string[];
  placeholder?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:tags': [tags: string[]];
}>();

const inputValue = ref('');

const addTag = (value: string) => {
  const trimmed = value.trim();
  if (trimmed && !props.tags.includes(trimmed)) {
    emit('update:tags', [...props.tags, trimmed]);
  }
  inputValue.value = '';
};

const removeTag = (tag: string) => {
  emit('update:tags', props.tags.filter(t => t !== tag));
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addTag(inputValue.value);
  } else if (e.key === 'Backspace' && !inputValue.value && props.tags.length > 0) {
    removeTag(props.tags[props.tags.length - 1]);
  }
};
</script>
