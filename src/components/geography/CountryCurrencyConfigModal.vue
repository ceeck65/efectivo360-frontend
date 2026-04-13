<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900 tracking-tight">
          {{ config ? t('countryCurrency.editConfig') : t('countryCurrency.addConfig') }}
        </h2>
        <button
          @click="handleClose"
          class="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Country Selector -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {{ t('countryCurrency.country') }}
          </label>
          <select
            v-model="form.country"
            class="w-full h-10 px-3 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
            :disabled="!!config"
          >
            <option value="">{{ t('countryCurrency.selectCountry') }}</option>
            <option v-for="country in countries" :key="country.id" :value="country.id">
              {{ country.name }} ({{ country.code }})
            </option>
          </select>
          <p v-if="errors.country" class="text-xs text-red-500">{{ errors.country }}</p>
        </div>

        <!-- Currency Selector -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {{ t('countryCurrency.currency') }}
          </label>
          <select
            v-model="form.currency"
            class="w-full h-10 px-3 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
            :disabled="!!config"
          >
            <option value="">{{ t('countryCurrency.selectCurrency') }}</option>
            <option v-for="currency in availableCurrencies" :key="currency.id" :value="currency.id">
              {{ currency.code }} — {{ currency.name }}
            </option>
          </select>
          <p v-if="errors.currency" class="text-xs text-red-500">{{ errors.currency }}</p>
        </div>

        <!-- Priority Order -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {{ t('countryCurrency.priorityOrder') }}
          </label>
          <input
            v-model.number="form.priority_order"
            type="number"
            min="1"
            class="w-full h-10 px-3 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition-all"
            :placeholder="'Ej: 1'"
          />
          <p class="text-xs text-slate-400">{{ t('countryCurrency.priorityHelp') }}</p>
        </div>

        <!-- Toggles -->
        <div class="space-y-3 py-2">
          <!-- Legal Tender -->
          <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
              <input
                id="is_legal_tender"
                v-model="form.is_legal_tender"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-100"
              />
              <label for="is_legal_tender" class="text-sm text-slate-700">
                {{ t('countryCurrency.legalTender') }}
              </label>
            </div>
            <span class="text-xs text-slate-400">{{ t('countryCurrency.legalTenderHelp') }}</span>
          </div>

          <!-- Price Base -->
          <div class="flex items-center justify-between py-2 border-t border-slate-100">
            <div class="flex items-center gap-3">
              <input
                id="is_price_base"
                v-model="form.is_price_base"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-100"
              />
              <label for="is_price_base" class="text-sm text-slate-700">
                {{ t('countryCurrency.priceBase') }}
              </label>
            </div>
            <span class="text-xs text-slate-400">{{ t('countryCurrency.priceBaseHelp') }}</span>
          </div>

          <!-- Active -->
          <div class="flex items-center gap-3 py-2 border-t border-slate-100">
            <input
              id="is_active"
              v-model="form.is_active"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-100"
            />
            <label for="is_active" class="text-sm text-slate-700">
              {{ t('countryCurrency.active') }}
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            @click="handleClose"
            class="h-9 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            {{ config ? t('common.save') : t('common.create') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { X, Loader2 } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import type { Country, CountryCurrencyConfig, CountryCurrencyFormData, Currency } from '@/types';

const props = defineProps<{
  isOpen: boolean;
  config: CountryCurrencyConfig | null;
  countries: Country[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', data: CountryCurrencyFormData): void;
}>();

const { fetchApi } = useApi();

const isSubmitting = ref(false);
const errors = reactive<Record<string, string>>({});
const currencies = ref<Currency[]>([]);

const form = reactive({
  country: '',
  currency: '',
  is_legal_tender: false,
  is_price_base: false,
  priority_order: 1,
  is_active: true,
});

// Get currencies not already associated with this country
const availableCurrencies = computed(() => {
  // If editing, show the current currency plus unassigned ones
  if (props.config) {
    return currencies.value;
  }
  // When creating, could filter out already-associated currencies
  return currencies.value;
});

// Translation helper
const t = (key: string): string => {
  const translations: Record<string, string> = {
    'countryCurrency.editConfig': 'Editar Asociación',
    'countryCurrency.addConfig': 'Asociar Moneda',
    'countryCurrency.country': 'País',
    'countryCurrency.selectCountry': 'Selecciona un país',
    'countryCurrency.currency': 'Moneda',
    'countryCurrency.selectCurrency': 'Selecciona una moneda',
    'countryCurrency.priorityOrder': 'Orden de Prioridad',
    'countryCurrency.priorityHelp': 'Orden en que aparece en el POS (1 = primero)',
    'countryCurrency.legalTender': 'Moneda Fiscal',
    'countryCurrency.legalTenderHelp': 'Moneda oficial del país',
    'countryCurrency.priceBase': 'Base de Precios',
    'countryCurrency.priceBaseHelp': 'Usar para fijar precios de productos',
    'countryCurrency.active': 'Activo',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar cambios',
    'common.create': 'Crear asociación',
  };
  return translations[key] || key;
};

// Load currencies
const loadCurrencies = async () => {
  try {
    const response = await fetchApi<{ results: Currency[] }>('/api/currencies/');
    currencies.value = response.results || [];
  } catch (err) {
    console.error('Error loading currencies:', err);
  }
};

// Watch for config changes to populate form
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      form.country = String(newConfig.country);
      form.currency = String(newConfig.currency);
      form.is_legal_tender = newConfig.is_legal_tender;
      form.is_price_base = newConfig.is_price_base;
      form.priority_order = newConfig.priority_order;
      form.is_active = newConfig.is_active;
    } else {
      form.country = '';
      form.currency = '';
      form.is_legal_tender = false;
      form.is_price_base = false;
      form.priority_order = 1;
      form.is_active = true;
    }
    // Clear errors
    Object.keys(errors).forEach(k => delete errors[k]);
  },
  { immediate: true }
);

onMounted(() => {
  loadCurrencies();
});

const validate = (): boolean => {
  Object.keys(errors).forEach(k => delete errors[k]);

  if (!form.country) {
    errors.country = 'El país es requerido';
  }
  if (!form.currency) {
    errors.currency = 'La moneda es requerida';
  }
  if (form.priority_order < 1) {
    errors.priority_order = 'La prioridad debe ser mayor a 0';
  }

  return Object.keys(errors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    emit('save', {
      country: Number(form.country),
      currency: Number(form.currency),
      is_legal_tender: form.is_legal_tender,
      is_price_base: form.is_price_base,
      priority_order: form.priority_order,
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
/* Component uses only Tailwind classes - no custom CSS needed */
</style>
