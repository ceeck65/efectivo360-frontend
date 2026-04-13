<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700">Campos Requeridos del Tenant</label>
      <button
        type="button"
        @click="addField"
        class="btn-secondary text-xs"
      >
        <Plus class="h-4 w-4" />
        Añadir Campo
      </button>
    </div>
    
    <div v-if="modelValue.length === 0" class="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
      No hay campos definidos. Los tenants no necesitarán llenar datos adicionales.
    </div>
    
    <div v-else class="space-y-2">
      <div
        v-for="(field, index) in modelValue"
        :key="index"
        class="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3"
      >
        <div class="flex flex-col gap-1 pt-1">
          <button
            type="button"
            @click="moveField(index, 'up')"
            :disabled="index === 0"
            class="text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronUp class="h-4 w-4" />
          </button>
          <button
            type="button"
            @click="moveField(index, 'down')"
            :disabled="index === modelValue.length - 1"
            class="text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronDown class="h-4 w-4" />
          </button>
        </div>
        
        <div class="grid flex-1 grid-cols-4 gap-2">
          <input
            placeholder="Nombre (key)"
            :value="field.name"
            @input="updateField(index, { name: ($event.target as HTMLInputElement).value })"
            class="input text-sm"
          />
          <input
            placeholder="Etiqueta"
            :value="field.label"
            @input="updateField(index, { label: ($event.target as HTMLInputElement).value })"
            class="input text-sm"
          />
          <select
            :value="field.type"
            @change="updateField(index, { type: ($event.target as HTMLSelectElement).value as MetadataField['type'] })"
            class="input text-sm"
          >
            <option value="text">Texto</option>
            <option value="email">Email</option>
            <option value="tel">Teléfono</option>
            <option value="select">Select</option>
            <option value="number">Número</option>
          </select>
          <input
            placeholder="Valor por defecto (opcional)"
            :value="field.default || ''"
            @input="updateField(index, { default: ($event.target as HTMLInputElement).value })"
            class="input text-sm"
          />
        </div>
        
        <button
          type="button"
          @click="removeField(index)"
          class="rounded p-1 text-red-500 hover:bg-red-50"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>
    </div>
    
    <p class="text-xs text-gray-500">
      Estos campos se mostrarán automáticamente cuando un Tenant use esta plantilla.
    </p>
  </div>
</template>

<script setup lang="ts">
import { Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-vue-next';
import type { MetadataField } from '@/types';

const props = defineProps<{
  modelValue: MetadataField[];
}>();

const emit = defineEmits<{
  'update:modelValue': [fields: MetadataField[]];
}>();

const addField = () => {
  emit('update:modelValue', [
    ...props.modelValue,
    { name: '', label: '', type: 'text', required: true },
  ]);
};

const updateField = (index: number, updates: Partial<MetadataField>) => {
  const newFields = [...props.modelValue];
  newFields[index] = { ...newFields[index], ...updates };
  emit('update:modelValue', newFields);
};

const removeField = (index: number) => {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index));
};

const moveField = (index: number, direction: 'up' | 'down') => {
  if (direction === 'up' && index === 0) return;
  if (direction === 'down' && index === props.modelValue.length - 1) return;
  
  const newFields = [...props.modelValue];
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
  emit('update:modelValue', newFields);
};
</script>
