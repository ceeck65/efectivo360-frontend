<template>
  <div class="min-h-screen bg-slate-50/50 p-6">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <RouterLink
            to="/admin"
            class="rounded-lg p-2 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft class="h-5 w-5 text-slate-600" />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Gestión de Monedas</h1>
            <p class="text-sm text-slate-500">
              Configuración global de monedas del sistema
            </p>
          </div>
        </div>
        
        <button 
          @click="handleCreate" 
          class="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus class="h-4 w-4" />
          Nueva Moneda
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-[180px] animate-pulse bg-slate-200 rounded-lg" />
      </div>

      <!-- Empty State -->
      <div v-else-if="currencies.length === 0" class="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <CircleDollarSign class="h-8 w-8 text-slate-400" />
        </div>
        <h3 class="text-lg font-medium text-slate-900">No hay monedas configuradas</h3>
        <p class="mt-1 text-sm text-slate-500">
          Crea la primera moneda para el sistema.
        </p>
        <button 
          @click="handleCreate" 
          class="mt-4 inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus class="h-4 w-4" />
          Crear moneda
        </button>
      </div>

      <!-- Cards Grid -->
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="currency in currencies"
          :key="currency.id"
          class="group relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-lg"
        >
          <!-- Currency Code Bar -->
          <div
            class="absolute left-0 top-0 h-full w-1 bg-slate-900"
          />
          
          <!-- Card Header -->
          <div class="p-6 pb-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm"
                >
                  <span class="text-lg font-bold">{{ currency.symbol }}</span>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">{{ currency.name }}</h3>
                  <p class="text-sm text-slate-500">{{ currency.code }}</p>
                </div>
              </div>
              
              <!-- Actions - appear on hover -->
              <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  @click="handleEdit(currency)"
                  class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <Pencil class="h-4 w-4" />
                </button>
                <button
                  @click="handleDelete(currency)"
                  class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          <!-- Card Content -->
          <div class="px-6 pb-6 space-y-3">
            <!-- Format Info -->
            <div class="flex flex-wrap gap-2">
              <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                {{ currency.symbol_position === 'prefix' ? 'Prefijo' : 'Sufijo' }}
              </span>
              <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                {{ currency.decimal_precision }} decimales
              </span>
              <span
                v-if="!currency.is_active"
                class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700"
              >
                Inactivo
              </span>
            </div>
            
            <!-- Format Preview -->
            <div class="text-sm text-slate-600 pt-2 border-t border-slate-100">
              <span class="text-xs text-slate-400">Formato:</span>
              <p class="font-medium">
                {{ formatExample(currency) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Modal -->
      <CurrencyFormModal
        :is-open="modalOpen"
        :currency="editingCurrency"
        @close="modalOpen = false"
        @save="handleSave"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowLeft, Plus, Pencil, Trash2, CircleDollarSign } from 'lucide-vue-next';
import { useCurrencies } from '@/composables/useCurrencies';
import { useNotify } from '@/composables/useNotify';
import type { Currency } from '@/types';
import type { CurrencyFormData } from '@/composables/useCurrencies';
import CurrencyFormModal from '@/components/currencies/CurrencyFormModal.vue';
import Swal from 'sweetalert2';

const {
  currencies,
  isLoading,
  loadCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
} = useCurrencies();
const { success: notifySuccess, error: notifyError } = useNotify();

const modalOpen = ref(false);
const editingCurrency = ref<Currency | null>(null);

onMounted(() => {
  loadCurrencies();
});

// Format example for display
const formatExample = (currency: Currency): string => {
  const amount = 1234.56;
  const { symbol, symbol_position, decimal_precision, thousand_separator, decimal_separator } = currency;
  
  const parts = amount.toFixed(decimal_precision).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand_separator);
  const decimalPart = parts[1];
  
  const formatted = `${integerPart}${decimal_separator}${decimalPart}`;
  
  return symbol_position === 'prefix' 
    ? `${symbol}${formatted}`
    : `${formatted}${symbol}`;
};

const handleCreate = () => {
  editingCurrency.value = null;
  modalOpen.value = true;
};

const handleEdit = (currency: Currency) => {
  editingCurrency.value = currency;
  modalOpen.value = true;
};

const handleDelete = async (currency: Currency) => {
  const result = await Swal.fire({
    title: '¿Eliminar moneda?',
    text: `Se eliminará permanentemente "${currency.name}" (${currency.code})`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
  });

  if (!result.isConfirmed) return;

  try {
    await deleteCurrency(currency.id);
    notifySuccess(`Moneda "${currency.name}" eliminada`);
  } catch (err: any) {
    notifyError(err?.message || 'Error eliminando moneda');
  }
};

const handleSave = async (formData: CurrencyFormData) => {
  try {
    if (editingCurrency.value) {
      await updateCurrency(editingCurrency.value.id, formData);
      notifySuccess(`Moneda "${formData.name}" actualizada`);
    } else {
      const result = await createCurrency(formData);
      notifySuccess(`Moneda "${result.name}" creada`);
    }
    modalOpen.value = false;
    await loadCurrencies();
  } catch (err: any) {
    const msg = err?.message || err?.error || 'Error guardando moneda';
    if (msg.includes('code') && msg.includes('existe')) {
      notifyError('El código de moneda ya existe. Use uno diferente.');
    } else {
      notifyError(msg);
    }
    throw err;
  }
};
</script>
