<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay">
      <div class="modal-content">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-slate-900">
            {{ currency ? `Editar ${currency.name}` : 'Nueva Moneda' }}
          </h2>
          <button @click="$emit('close')" class="rounded-full p-2 hover:bg-gray-100">
            <X class="h-5 w-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Basic Info -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="label">Código ISO *</label>
              <input
                v-model="formData.code"
                class="input"
                placeholder="Ej: USD"
                maxlength="3"
                required
                :disabled="!!currency"
              />
              <p class="text-xs text-slate-500">Código ISO de 3 letras (USD, VES, EUR)</p>
            </div>
            
            <div class="space-y-2">
              <label class="label">Nombre *</label>
              <input
                v-model="formData.name"
                class="input"
                placeholder="Ej: Dólar Americano"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="label">Símbolo *</label>
              <input
                v-model="formData.symbol"
                class="input"
                placeholder="Ej: $"
                maxlength="10"
                required
              />
            </div>
            
            <div class="space-y-2">
              <label class="label">Precisión Decimal *</label>
              <input
                v-model.number="formData.decimal_precision"
                type="number"
                class="input"
                min="0"
                max="8"
                required
              />
            </div>
            
            <div class="space-y-2">
              <label class="label">Posición del Símbolo *</label>
              <select v-model="formData.symbol_position" class="input" required>
                <option value="prefix">Prefijo ($100)</option>
                <option value="suffix">Sufijo (100$)</option>
              </select>
            </div>
          </div>

          <!-- Format Rules -->
          <div class="border-t border-slate-200 pt-4">
            <h3 class="text-sm font-medium text-slate-900 mb-3">Separadores</h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="label">Separador de Miles *</label>
                <input
                  v-model="formData.thousand_separator"
                  class="input"
                  placeholder=","
                  maxlength="1"
                  required
                />
              </div>
              
              <div class="space-y-2">
                <label class="label">Separador Decimal *</label>
                <input
                  v-model="formData.decimal_separator"
                  class="input"
                  placeholder="."
                  maxlength="1"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div class="bg-slate-50 rounded-lg p-4">
            <label class="text-sm font-medium text-slate-700">Vista Previa</label>
            <p class="text-2xl font-semibold text-slate-900 mt-1">
              {{ formatPreview }}
            </p>
          </div>

          <!-- Status -->
          <div class="flex items-center gap-2">
            <input
              :checked="formData.is_active"
              @change="formData.is_active = ($event.target as HTMLInputElement).checked"
              type="checkbox"
              id="is_active"
              class="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
            />
            <label for="is_active" class="text-sm text-gray-700 cursor-pointer">Activo</label>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" class="btn-secondary" @click="$emit('close')">
              Cancelar
            </button>
            <button type="submit" :disabled="loading" class="btn-primary gap-2">
              <span v-if="loading">Guardando...</span>
              <template v-else>
                <Check class="h-4 w-4" />
                {{ currency ? 'Actualizar' : 'Crear' }}
              </template>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { X, Check } from 'lucide-vue-next';
import type { Currency } from '@/types';
import type { CurrencyFormData } from '@/composables/useCurrencies';

const props = defineProps<{
  isOpen: boolean;
  currency: Currency | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [data: CurrencyFormData];
}>();

const loading = ref(false);

const defaultForm: CurrencyFormData = {
  code: '',
  name: '',
  symbol: '',
  is_active: true,
  decimal_precision: 2,
  symbol_position: 'prefix',
  thousand_separator: ',',
  decimal_separator: '.',
};

const formData = ref<CurrencyFormData>({ ...defaultForm });

// Preview formatter
const formatPreview = computed(() => {
  const amount = 1234567.89;
  const { symbol, symbol_position, decimal_precision, thousand_separator, decimal_separator } = formData.value;
  
  const parts = amount.toFixed(decimal_precision || 2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand_separator || ',');
  const decimalPart = parts[1];
  
  const formatted = (decimal_precision || 2) > 0 
    ? `${integerPart}${decimal_separator || '.'}${decimalPart}`
    : integerPart;
  
  return symbol_position === 'prefix' 
    ? `${symbol || '$'}${formatted}`
    : `${formatted}${symbol || '$'}`;
});

// Sync form with currency prop
watch(() => props.currency, (newCurrency) => {
  if (newCurrency) {
    formData.value = {
      code: newCurrency.code,
      name: newCurrency.name,
      symbol: newCurrency.symbol,
      is_active: newCurrency.is_active,
      decimal_precision: newCurrency.decimal_precision,
      symbol_position: newCurrency.symbol_position,
      thousand_separator: newCurrency.thousand_separator,
      decimal_separator: newCurrency.decimal_separator,
    };
  } else {
    formData.value = { ...defaultForm };
  }
}, { immediate: true });

const handleSubmit = () => {
  emit('save', formData.value);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
}

.label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(51, 65, 85);
  margin-bottom: 0.25rem;
}

.input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgb(203, 213, 225);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input:focus {
  outline: none;
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:disabled {
  background: rgb(243, 244, 246);
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  border: 1px solid rgb(203, 213, 225);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(51, 65, 85);
  background: white;
  transition: background-color 0.15s;
}

.btn-secondary:hover {
  background: rgb(248, 250, 252);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background: rgb(15, 23, 42);
  transition: background-color 0.15s;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: rgb(30, 41, 59);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
