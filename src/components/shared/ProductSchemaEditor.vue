<template>
  <div class="space-y-3">
    <div
      v-for="(field, index) in schema"
      :key="index"
      class="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/[0.06] dark:bg-slate-800"
    >
      <div class="flex items-center gap-2 mb-3">
        <div class="flex-1 grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Nombre (key)</label>
            <input
              :value="field.name"
              @input="updateField(index, 'name', ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="ej: medida"
              class="w-full h-8 text-sm border border-slate-200 rounded px-2 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
          <div>
            <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Etiqueta</label>
            <input
              :value="field.label"
              @input="updateField(index, 'label', ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="ej: Medida"
              class="w-full h-8 text-sm border border-slate-200 rounded px-2 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
        </div>
        <button
          @click="removeField(index)"
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
            @change="updateField(index, 'type', ($event.target as HTMLSelectElement).value)"
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
            @input="updateField(index, 'unit', ($event.target as HTMLInputElement).value)"
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
              @change="updateField(index, 'required', ($event.target as HTMLInputElement).checked)"
              class="rounded border-slate-300"
            />
            Obligatorio
          </label>
        </div>
      </div>

      <div v-if="field.type === 'select'" class="mt-3">
        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Opciones (separadas por coma)</label>
        <input
          :value="(field.options || []).join(', ')"
          @input="updateField(index, 'options', ($event.target as HTMLInputElement).value.split(',').map(o => o.trim()))"
          type="text"
          placeholder="ej: M4, M6, M8, M10"
          class="w-full h-8 text-sm border border-slate-200 rounded px-2 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
        />
      </div>

      <div v-if="field.type === 'weight'" class="flex items-center gap-2 mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded dark:bg-amber-900/20">
        <Settings class="h-3 w-3" />
        Este campo habilitará venta fraccionada automáticamente en el POS
      </div>
    </div>

    <button
      @click="addField"
      class="w-full py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded hover:bg-slate-50 dark:text-slate-400 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
    >
      + Agregar campo
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Editor de schema de productos
 * @module @components/shared/ProductSchemaEditor
 */
import { Trash2, Settings } from 'lucide-vue-next';

interface ProductSchemaField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  unit?: string;
}

interface Props {
  schema: ProductSchemaField[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:schema': [schema: ProductSchemaField[]];
}>();

const addField = () => {
  emit('update:schema', [
    ...props.schema,
    { name: '', label: '', type: 'text', required: false },
  ]);
};

const removeField = (index: number) => {
  emit('update:schema', props.schema.filter((_, i) => i !== index));
};

const updateField = (index: number, key: keyof ProductSchemaField, value: unknown) => {
  const newSchema = [...props.schema];
  newSchema[index] = { ...newSchema[index], [key]: value };
  emit('update:schema', newSchema);
};
</script>
