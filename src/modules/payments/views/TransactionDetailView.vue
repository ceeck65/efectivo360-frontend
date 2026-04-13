<template>
  <div class="p-6">
    <div class="flex items-center gap-2 mb-6">
      <button 
        @click="$router.back()" 
        class="p-2 text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h1 class="text-2xl font-bold text-gray-900">Detalle de Transacción</h1>
    </div>

    <LoadingSpinner v-if="isLoading" size="lg" />
    
    <div v-else-if="selectedTransaction" class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-gray-500">ID</label>
          <p class="font-mono">{{ selectedTransaction.id }}</p>
        </div>
        <div>
          <label class="text-sm text-gray-500">Estado</label>
          <p class="capitalize">{{ selectedTransaction.status }}</p>
        </div>
        <div>
          <label class="text-sm text-gray-500">Monto</label>
          <p>{{ formatAmount(selectedTransaction.amount) }}</p>
        </div>
        <div>
          <label class="text-sm text-gray-500">Fecha</label>
          <p>{{ formatDate(selectedTransaction.created_at) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista - Detalle de Transacción
 * @module @modules/payments/views/TransactionDetailView
 */
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import { LoadingSpinner } from '@shared/index.js';
import { usePaymentsStore } from '../stores/paymentsStore';
import { usePayments } from '../composables/usePayments';

const route = useRoute();
const store = usePaymentsStore();
const { selectedTransaction, isLoading } = store;
const { formatAmount } = usePayments();

function formatDate(date: string | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-VE');
}

onMounted(() => {
  const id = route.params.id as string;
  if (id) {
    store.loadTransactionById(id);
  }
});
</script>
