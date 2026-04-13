<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Ajuste de Inventario</h1>
      <p class="mt-1 text-sm text-gray-500">
        Ajusta manualmente el stock de un producto
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <ErrorMessage
        v-if="error"
        :message="error"
        variant="error"
        @dismiss="error = null"
      />

      <!-- Product Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Producto <span class="text-red-500">*</span>
        </label>
        <div class="flex gap-2">
          <input
            v-model="skuSearch"
            type="text"
            placeholder="Ingresa SKU y presiona Enter"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            @keyup.enter="searchProduct"
          />
          <button
            type="button"
            @click="searchProduct"
            :disabled="searching"
            class="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            <Search v-if="!searching" class="w-4 h-4" />
            <LoadingSpinner v-else size="sm" color="white" />
          </button>
        </div>
      </div>

      <!-- Product Info -->
      <div v-if="selectedProduct" class="p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900">{{ selectedProduct.name }}</p>
            <p class="text-sm text-gray-500">SKU: {{ selectedProduct.sku }}</p>
          </div>
          <ProductStockBadge
            :level="getStockLevel(selectedProduct)"
            :stock-quantity="selectedProduct.currentStock"
            show-quantity
          />
        </div>
      </div>

      <!-- New Quantity -->
      <div v-if="selectedProduct">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Nueva Cantidad <span class="text-red-500">*</span>
        </label>
        <input
          v-model.number="newQuantity"
          type="number"
          min="0"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="0"
        />
        <p class="mt-1 text-sm text-gray-500">
          Cantidad actual: {{ selectedProduct.currentStock }}
          <span v-if="quantityDiff !== 0" :class="quantityDiff > 0 ? 'text-green-600' : 'text-red-600'">
            ({{ quantityDiff > 0 ? '+' : '' }}{{ quantityDiff }})
          </span>
        </p>
      </div>

      <!-- Reason -->
      <div v-if="selectedProduct">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Motivo del Ajuste <span class="text-red-500">*</span>
        </label>
        <select
          v-model="reason"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecciona un motivo</option>
          <option value="count">Ajuste por inventario físico</option>
          <option value="damaged">Producto dañado</option>
          <option value="expired">Producto vencido</option>
          <option value="found">Mercancía encontrada</option>
          <option value="correction">Corrección de error</option>
          <option value="other">Otro</option>
        </select>
      </div>

      <!-- Notes -->
      <div v-if="selectedProduct">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Notas Adicionales
        </label>
        <textarea
          v-model="notes"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Detalles adicionales sobre el ajuste..."
        />
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          @click="goBack"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="!canSubmit || submitting"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <LoadingSpinner v-if="submitting" size="sm" color="white" />
          <Check v-else class="w-4 h-4" />
          {{ submitting ? 'Aplicando...' : 'Aplicar Ajuste' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista - Ajuste de Stock
 * @module @modules/inventory/views/StockAdjustmentView
 */
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Check } from 'lucide-vue-next';
import { LoadingSpinner, ErrorMessage } from '@shared/index.js';
import { useInventory } from '../composables/useInventory';
import { inventoryRouteNames } from '../router';
import ProductStockBadge from '../components/ProductStockBadge.vue';
import type { Product } from '../types';

const router = useRouter();
const { searchBySku, adjustStock, getStockLevel } = useInventory();

const skuSearch = ref('');
const searching = ref(false);
const selectedProduct = ref<Product | null>(null);
const newQuantity = ref(0);
const reason = ref('');
const notes = ref('');
const submitting = ref(false);
const error = ref<string | null>(null);

const quantityDiff = computed(() => {
  if (!selectedProduct.value) return 0;
  return newQuantity.value - selectedProduct.value.currentStock;
});

const canSubmit = computed(() => {
  return selectedProduct.value && 
         newQuantity.value >= 0 && 
         reason.value &&
         quantityDiff.value !== 0;
});

async function searchProduct(): Promise<void> {
  if (!skuSearch.value.trim()) return;
  
  searching.value = true;
  error.value = null;
  
  try {
    const product = await searchBySku(skuSearch.value.trim());
    if (product) {
      selectedProduct.value = product;
      newQuantity.value = product.currentStock;
    } else {
      error.value = 'Producto no encontrado';
    }
  } finally {
    searching.value = false;
  }
}

function goBack(): void {
  router.push({ name: inventoryRouteNames.movements });
}

async function handleSubmit(): Promise<void> {
  if (!canSubmit.value || !selectedProduct.value) return;
  
  submitting.value = true;
  error.value = null;
  
  const fullReason = `${movementReasonLabels[reason.value]}${notes.value ? ` - ${notes.value}` : ''}`;
  
  try {
    const result = await adjustStock(
      selectedProduct.value.id,
      newQuantity.value,
      fullReason
    );
    
    if (result) {
      router.push({ name: inventoryRouteNames.movements });
    } else {
      error.value = 'Error aplicando el ajuste';
    }
  } finally {
    submitting.value = false;
  }
}

const movementReasonLabels: Record<string, string> = {
  count: 'Ajuste por inventario físico',
  damaged: 'Producto dañado',
  expired: 'Producto vencido',
  found: 'Mercancía encontrada',
  correction: 'Corrección de error',
  other: 'Otro',
};
</script>
