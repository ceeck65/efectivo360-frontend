<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-bold text-slate-900">
          {{ city ? t('geography.editCity') : t('geography.addCity') }}
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
            :placeholder="'Ej: Caracas'"
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
            :placeholder="'Ej: CCS'"
          />
          <p v-if="errors.code" class="text-sm text-red-500">{{ errors.code }}</p>
        </div>

        <!-- Country Selector -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">
            {{ t('geography.country') }}
          </label>
          <select
            v-model="form.country"
            class="input-field"
            @change="handleCountryChange"
          >
            <option value="">{{ t('geography.selectCountry') }}</option>
            <option v-for="country in countries" :key="country.id" :value="country.id">
              {{ country.name }}
            </option>
          </select>
          <p v-if="errors.country" class="text-sm text-red-500">{{ errors.country }}</p>
        </div>

        <!-- State Selector (Dynamic based on Country) -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">
            {{ t('geography.state') }}
          </label>
          <select
            v-model="form.state"
            class="input-field"
            :disabled="!form.country || filteredStates.length === 0"
          >
            <option value="">{{ t('geography.selectState') }}</option>
            <option v-for="state in filteredStates" :key="state.id" :value="state.id">
              {{ state.name }}
            </option>
          </select>
          <p v-if="errors.state" class="text-sm text-red-500">{{ errors.state }}</p>
          <p v-else-if="form.country && filteredStates.length === 0" class="text-xs text-amber-600">
            No hay estados disponibles para este país. Cree estados primero.
          </p>
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
            {{ city ? 'Guardar cambios' : 'Crear ciudad' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { X, Loader2 } from 'lucide-vue-next';
import type { City, Country, State } from '@/types';

const props = defineProps<{
  isOpen: boolean;
  city: City | null;
  countries: Country[];
  states: State[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', data: Partial<City>): void;
}>();

const isSubmitting = ref(false);
const errors = reactive<Record<string, string>>({});

const form = reactive({
  name: '',
  code: '',
  country: '',
  state: '',
  is_active: true,
});

// Filter states based on selected country
const filteredStates = computed(() => {
  if (!form.country) return [];
  return props.states.filter(s => s.country === Number(form.country) || s.country === form.country);
});

// Translation helper
const t = (key: string): string => {
  const translations: Record<string, string> = {
    'geography.addCity': 'Agregar Ciudad',
    'geography.editCity': 'Editar Ciudad',
    'geography.name': 'Nombre',
    'geography.code': 'Código',
    'geography.country': 'País',
    'geography.state': 'Estado',
    'geography.selectCountry': 'Selecciona un país',
    'geography.selectState': 'Selecciona un estado',
    'geography.active': 'Activo',
  };
  return translations[key] || key;
};

// Watch for city changes to populate form
watch(
  () => props.city,
  (newCity) => {
    if (newCity) {
      form.name = newCity.name;
      form.code = newCity.code;
      form.country = String(newCity.country);
      form.state = String(newCity.state);
      form.is_active = newCity.is_active;
    } else {
      form.name = '';
      form.code = '';
      form.country = '';
      form.state = '';
      form.is_active = true;
    }
    // Clear errors
    Object.keys(errors).forEach(k => delete errors[k]);
  },
  { immediate: true }
);

// Reset state when country changes
const handleCountryChange = () => {
  form.state = '';
};

const validate = (): boolean => {
  Object.keys(errors).forEach(k => delete errors[k]);
  
  if (!form.name.trim()) {
    errors.name = 'El nombre es requerido';
  }
  if (!form.code.trim()) {
    errors.code = 'El código es requerido';
  }
  if (!form.country) {
    errors.country = 'El país es requerido';
  }
  if (!form.state) {
    errors.state = 'El estado es requerido';
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
      country: Number(form.country),
      state: Number(form.state),
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
