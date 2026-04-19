<template>
  <div class="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-3 dark:border-white/[0.06] dark:bg-slate-800">
    <div class="flex items-center gap-2">
      <GripVertical class="h-4 w-4 text-slate-400" />
      <div class="flex-1 grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Nombre (key)</label>
          <input
            :value="field.name"
            @input="$emit('update', { ...field, name: ($event.target as HTMLInputElement).value.toLowerCase().replace(/\s+/g, '_') })"
            type="text"
            placeholder="ej: medida"
            class="w-full h-8 text-sm border border-slate-200 rounded px-2 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
          />
        </div>
        <div>
          <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Etiqueta</label>
          <input
            :value="field.label"
            @input="$emit('update', { ...field, label: ($event.target as HTMLInputElement).value })"
            type="text"
            placeholder="ej: Medida"
            class="w-full h-8 text-sm border border-slate-200 rounded px-2 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
          />
        </div>
      </div>
      <button
        @click="$emit('remove')"
        class="text-red-500 hover:text-red-600"
      >
        <Trash2 class="h-4 w-4" />
      </button>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <div>
        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Tipo</label>
        <select
          :value="field.type"
          @change="$emit('update', { ...field, type: ($event.target as HTMLSelectElement).value as AttributeField['type'] })"
          class="w-full h-8 text-sm rounded border border-slate-200 bg-white px-2 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
        >
          <option value="text">Texto</option>
          <option value="number">Número</option>
          <option value="select">Selección</option>
          <option value="boolean">Sí/No</option>
          <option value="weight">Peso/Masa</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Unidad (opcional)</label>
        <input
          :value="field.unit || ''"
          @input="$emit('update', { ...field, unit: ($event.target as HTMLInputElement).value })"
          type="text"
          placeholder="ej: kg, cm"
          class="w-full h-8 text-sm border border-slate-200 rounded px-2 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
        />
      </div>
      <div class="flex items-end">
        <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            :checked="field.required || false"
            @change="$emit('update', { ...field, required: ($event.target as HTMLInputElement).checked })"
            class="rounded border-slate-300"
          />
          Obligatorio
        </label>
      </div>
    </div>

    <div v-if="field.type === 'select'">
      <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Opciones (separadas por coma)</label>
      <input
        :value="localOptions"
        @input="updateOptions($event)"
        type="text"
        placeholder="ej: M4, M6, M8, M10"
        class="w-full h-8 text-sm border border-slate-200 rounded px-2 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
      />
    </div>

    <div v-if="field.type === 'weight'" class="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded dark:bg-amber-900/20">
      <Settings class="h-3 w-3" />
      Este campo habilitará venta fraccionada automáticamente en el POS
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Editor de campo de atributo
 * @module @modules/blueprints/components/AttributeFieldEditor
 */
import { ref, watch } from 'vue';
import type { AttributeField } from '../types';
import { GripVertical, Trash2, Settings } from 'lucide-vue-next';

interface Props {
  field: AttributeField;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  update: [field: AttributeField];
  remove: [];
}>();

const localOptions = ref((props.field.options || []).join(', '));

const updateOptions = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  localOptions.value = value;
  const options = value.split(',').map(o => o.trim()).filter(Boolean);
  emit('update', { ...props.field, options });
};

watch(() => props.field.options, (newOptions) => {
  localOptions.value = (newOptions || []).join(', ');
});
</script>
