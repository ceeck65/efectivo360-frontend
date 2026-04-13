<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-gray-900">Transacciones</h1>
    <p class="mt-1 text-sm text-gray-500">
      Historial de transacciones de pago
    </p>

    <LoadingSpinner v-if="isLoading" size="lg" class="mt-6" />
    <ErrorMessage v-else-if="errors.transactions" :message="errors.transactions" variant="error" />
    
    <div v-else class="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="tx in transactions" :key="tx.id">
            <td class="px-6 py-4 font-mono text-sm">{{ tx.id.slice(-8) }}</td>
            <td class="px-6 py-4">{{ formatAmount(tx.amount) }}</td>
            <td class="px-6 py-4">
              <span 
                :class="{
                  'bg-yellow-100 text-yellow-800': tx.status === 'pending',
                  'bg-green-100 text-green-800': tx.status === 'completed',
                  'bg-red-100 text-red-800': tx.status === 'failed',
                }"
                class="px-2 py-1 text-xs rounded-full"
              >
                {{ tx.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm">{{ formatDate(tx.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista - Lista de Transacciones
 * @module @modules/payments/views/TransactionsView
 */
import { onMounted } from 'vue';
import { LoadingSpinner, ErrorMessage } from '@shared/index.js';
import { usePaymentsStore } from '../stores/paymentsStore';
import { usePayments } from '../composables/usePayments';

const store = usePaymentsStore();
const { transactions, isLoading, errors } = store;
const { formatAmount } = usePayments();

function formatDate(date: string | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-VE');
}

onMounted(() => {
  store.loadTransactions();
});
</script>
