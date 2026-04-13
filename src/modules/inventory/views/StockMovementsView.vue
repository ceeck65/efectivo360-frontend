<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Movimientos de Stock</h1>
        <p class="mt-1 text-sm text-gray-500">
          Historial de entradas, salidas y ajustes
        </p>
      </div>
      <router-link
        :to="{ name: inventoryRouteNames.adjustment }"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        <Scale class="w-4 h-4" />
        Nuevo Ajuste
      </router-link>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">Producto</label>
          <input
            v-model="filters.productId"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Buscar por ID..."
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
          <input
            v-model="filters.dateFrom"
            type="date"
            class="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
          <input
            v-model="filters.dateTo"
            type="date"
            class="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="applyFilters"
            class="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Filtrar
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="py-12">
      <LoadingSpinner size="lg" color="primary" />
    </div>

    <!-- Error -->
    <ErrorMessage
      v-else-if="errors.movements"
      :message="errors.movements"
      variant="error"
      :on-retry="loadMovements"
    />

    <!-- Movements Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <DataTable
        :columns="columns"
        :rows="movements"
        row-key="id"
        empty-message="No hay movimientos registrados"
      >
        <template #cell-movementType="{ value }">
          <span
            class="inline-flex px-2 py-1 rounded-full text-xs font-medium"
            :class="movementTypeClasses[value as string]"
          >
            {{ movementTypeLabels[value as string] }}
          </span>
        </template>

        <template #cell-quantity="{ value }">
          <span
            class="font-medium"
            :class="Number(value) >= 0 ? 'text-green-600' : 'text-red-600'"
          >
            {{ Number(value) > 0 ? '+' : '' }}{{ value }}
          </span>
        </template>

        <template #cell-movementDate="{ value }">
          {{ formatDate(String(value)) }}
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista - Movimientos de Stock
 * @module @modules/inventory/views/StockMovementsView
 */
import { onMounted, ref } from 'vue';
import { Scale } from 'lucide-vue-next';
import { LoadingSpinner, ErrorMessage, DataTable, type Column } from '@shared/index.js';
import { useInventory } from '../composables/useInventory';
import { inventoryRouteNames } from '../router';
import type { StockMovementFilters } from '../types';

const { movements, isLoading, errors, loadMovements } = useInventory();

const filters = ref<StockMovementFilters>({
  productId: '',
  dateFrom: '',
  dateTo: '',
});

const columns: Column[] = [
  { key: 'movementDate', label: 'Fecha', sortable: true },
  { key: 'productName', label: 'Producto', sortable: true },
  { key: 'movementType', label: 'Tipo', sortable: true, align: 'center' },
  { key: 'quantity', label: 'Cantidad', sortable: true, align: 'center' },
  { key: 'referenceNumber', label: 'Referencia', sortable: true },
  { key: 'performedByName', label: 'Usuario', sortable: true },
];

const movementTypeLabels: Record<string, string> = {
  IN: 'Entrada',
  OUT: 'Salida',
  ADJUSTMENT: 'Ajuste',
  TRANSFER: 'Transferencia',
  RETURN: 'Devolución',
  SALE: 'Venta',
  PURCHASE: 'Compra',
};

const movementTypeClasses: Record<string, string> = {
  IN: 'bg-green-100 text-green-800',
  OUT: 'bg-red-100 text-red-800',
  ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
  TRANSFER: 'bg-blue-100 text-blue-800',
  RETURN: 'bg-purple-100 text-purple-800',
  SALE: 'bg-indigo-100 text-indigo-800',
  PURCHASE: 'bg-cyan-100 text-cyan-800',
};

function formatDate(date: string): string {
  return new Date(date).toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function applyFilters(): Promise<void> {
  await loadMovements(filters.value);
}

onMounted(() => {
  loadMovements();
});
</script>
