<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Monedas</h1>
        <p class="mt-1 text-sm text-gray-500">
          Gestión de divisas del sistema (Solo Staff)
        </p>
      </div>
    </div>

    <LoadingSpinner v-if="isLoading" size="lg" />
    <ErrorMessage v-else-if="errors.currencies" :message="errors.currencies" variant="error" />
    
    <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Símbolo</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="currency in currencies" :key="currency.id">
            <td class="px-6 py-4 font-medium">{{ currency.code }}</td>
            <td class="px-6 py-4">{{ currency.name }}</td>
            <td class="px-6 py-4">{{ currency.symbol }}</td>
            <td class="px-6 py-4">
              <span 
                :class="currency.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                class="px-2 py-1 text-xs rounded-full"
              >
                {{ currency.is_active ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista - Configuración de Monedas (Staff Only)
 * @module @modules/payments/views/CurrencyConfigView
 */
import { onMounted } from 'vue';
import { LoadingSpinner, ErrorMessage } from '@shared/index.js';
import { usePaymentsStore } from '../stores/paymentsStore';

const store = usePaymentsStore();
const { currencies, isLoading, errors } = store;

onMounted(() => {
  store.loadCurrencies();
});
</script>
