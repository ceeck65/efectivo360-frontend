<template>
  <div v-if="isOpen && blueprint" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.06] dark:bg-[#141824]">
      <!-- Header -->
      <div class="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 z-10 dark:border-white/[0.06] dark:bg-[#141824]">
        <div>
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white">Editar tipo de comercio</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Código: <span class="font-mono text-slate-700 dark:text-slate-300">{{ blueprint.code }}</span>
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          ✕
        </button>
      </div>

      <!-- Form Content -->
      <div class="p-6 space-y-6">
        <!-- Nombre e Icono -->
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Nombre *</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="ej: Bodega"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Ícono</label>
            <input
              v-model="form.icon"
              type="text"
              placeholder="ej: store"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>
        </div>

        <!-- Orden -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Orden</label>
          <input
            v-model.number="form.sort_order"
            type="number"
            placeholder="ej: 1"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
          />
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Descripción</label>
          <textarea
            v-model="form.description"
            placeholder="Descripción del tipo de comercio"
            rows="3"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
          />
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 dark:border-white/[0.06] dark:bg-[#141824]">
        <button
          @click="$emit('close')"
          :disabled="saving"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]"
        >
          Cancelar
        </button>
        <button
          @click="handleSubmit"
          :disabled="saving"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import type { Blueprint } from '../types';

interface Props {
  blueprint: Blueprint | null;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const saving = ref(false);

interface FormState {
  name: string;
  icon: string;
  description: string;
  sort_order?: number;
}

const defaultForm: FormState = {
  name: '',
  icon: '',
  description: '',
  sort_order: undefined,
};

const form = ref<FormState>({ ...defaultForm });

watch(() => props.blueprint, (blueprint) => {
  if (blueprint && props.isOpen) {
    form.value = {
      name: blueprint.name,
      icon: blueprint.icon || '',
      description: blueprint.description || '',
      sort_order: blueprint.sort_order,
    };
  }
});

const handleSubmit = async () => {
  if (!props.blueprint || !form.value.name.trim()) {
    notifyError('El nombre es obligatorio.');
    return;
  }

  try {
    saving.value = true;
    await fetchApi(`/api/v1/business-types/${props.blueprint.id}/`, {
      method: 'PATCH',
      data: {
        name: form.value.name.trim(),
        icon: form.value.icon.trim(),
        description: form.value.description.trim(),
        sort_order: form.value.sort_order,
      },
    });
    notifySuccess('Tipo de comercio actualizado.');
    emit('updated');
    emit('close');
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'No se pudo actualizar el tipo de comercio.');
  } finally {
    saving.value = false;
  }
};
</script>
