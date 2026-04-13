<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-bold text-slate-900">
          {{ country ? t('geography.editCountry') : t('geography.addCountry') }}
        </h2>
        <button
          @click="handleClose"
          class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Name Field -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">
            {{ t('geography.name') }}
          </label>
          <input
            v-model="form.name"
            type="text"
            class="input-field"
            :placeholder="'Ej: Venezuela'"
          />
          <p v-if="errors.name" class="text-sm text-red-500">{{ errors.name }}</p>
        </div>

        <!-- Code Field -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">
            {{ t('geography.code') }}
          </label>
          <input
            v-model="form.code"
            type="text"
            class="input-field"
            :placeholder="'Ej: VE'"
          />
          <p v-if="errors.code" class="text-sm text-red-500">{{ errors.code }}</p>
        </div>

        <!-- Active Toggle -->
        <div class="flex items-center gap-3 py-2">
          <input
            id="is_active"
            v-model="form.is_active"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
          />
          <label for="is_active" class="text-sm text-slate-700">
            {{ t('geography.active') }}
          </label>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            @click="handleClose"
            class="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn-primary gap-2"
          >
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            {{ country ? 'Guardar cambios' : 'Crear país' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { X, Loader2 } from 'lucide-vue-next';
import type { Country } from '@/types';

const props = defineProps<{
  isOpen: boolean;
  country: Country | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', data: Partial<Country>): void;
}>();

const isSubmitting = ref(false);
const errors = reactive<Record<string, string>>({});

const form = reactive({
  name: '',
  code: '',
  is_active: true,
});

// Translation helper
const t = (key: string): string => {
  const translations: Record<string, string> = {
    'geography.addCountry': 'Agregar País',
    'geography.editCountry': 'Editar País',
    'geography.name': 'Nombre',
    'geography.code': 'Código',
    'geography.active': 'Activo',
  };
  return translations[key] || key;
};

// Watch for country changes to populate form
watch(
  () => props.country,
  (newCountry) => {
    if (newCountry) {
      form.name = newCountry.name;
      form.code = newCountry.code;
      form.is_active = newCountry.is_active;
    } else {
      form.name = '';
      form.code = '';
      form.is_active = true;
    }
    // Clear errors
    Object.keys(errors).forEach(k => delete errors[k]);
  },
  { immediate: true }
);

const validate = (): boolean => {
  Object.keys(errors).forEach(k => delete errors[k]);
  
  if (!form.name.trim()) {
    errors.name = 'El nombre es requerido';
  }
  if (!form.code.trim()) {
    errors.code = 'El código es requerido';
  }
  
  return Object.keys(errors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;
  
  isSubmitting.value = true;
  try {
    emit('save', {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      is_active: form.is_active,
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.input-field {
  @apply flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400;
  @apply focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:ring-offset-0;
  @apply disabled:cursor-not-allowed disabled:opacity-50;
}

.btn-primary {
  @apply inline-flex items-center justify-center rounded-md text-sm font-medium;
  @apply bg-brand-primary text-white hover:bg-brand-primary/90;
  @apply h-10 px-4 py-2 transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply inline-flex items-center justify-center rounded-md text-sm font-medium;
  @apply border border-slate-200 bg-white text-slate-700 hover:bg-slate-50;
  @apply h-10 px-4 py-2 transition-colors;
}
</style>
