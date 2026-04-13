<template>
  <div class="space-y-2">
    <div class="flex items-center gap-3">
      <div
        class="h-10 w-10 rounded-lg border-2 border-gray-200 shadow-sm"
        :style="{ backgroundColor: modelValue }"
      />
      <input
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        placeholder="#3b82f6"
        class="input w-32 font-mono text-sm"
      />
      <input
        type="color"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        class="h-10 w-16 cursor-pointer border-0 p-0"
      />
    </div>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="color in PRESET_COLORS"
        :key="color"
        type="button"
        @click="$emit('update:modelValue', color)"
        :class="[
          'h-8 w-8 rounded-lg border-2 transition-all hover:scale-110',
          modelValue === color ? 'border-gray-900 ring-2 ring-gray-200' : 'border-gray-200'
        ]"
        :style="{ backgroundColor: color }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Los colores preset vienen de una API en una implementación real
// Por ahora, estos son solo valores de UI que no afectan la lógica de negocio
const PRESET_COLORS = [
  '#007f2d', '#ce1126', '#004d95', '#00abbd', '#6c1cd3',
  '#f3ba2f', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#64748b', '#1e293b',
];

defineProps<{
  modelValue: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>
