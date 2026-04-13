<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Productos</h1>
        <p class="mt-1 text-sm text-gray-500">
          Gestión del catálogo de productos
        </p>
      </div>
      <router-link
        :to="{ name: inventoryRouteNames.productCreate }"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        <Plus class="w-4 h-4" />
        Nuevo Producto
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && products.length === 0" class="py-12">
      <LoadingSpinner size="lg" color="primary" />
    </div>

    <!-- Error State -->
    <ErrorMessage
      v-else-if="errors.products"
      :message="errors.products"
      variant="error"
      retry-label="Reintentar"
      :on-retry="reloadProducts"
    />

    <!-- Product Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <DataTable
        :columns="columns"
        :rows="products"
        row-key="id"
        :sort-key="sortKey"
        :sort-order="sortOrder"
        :clickable="true"
        @row-click="handleRowClick"
        @sort="handleSort"
        empty-message="No hay productos registrados"
      >
        <!-- Stock Badge Slot -->
        <template #cell-currentStock="{ row }">
          <ProductStockBadge
            :level="getStockLevel(row as Product)"
            :stock-quantity="(row as Product).currentStock"
            show-quantity
            size="sm"
          />
        </template>

        <!-- Price Slot -->
        <template #cell-salePrice="{ value }">
          <span class="font-medium text-gray-900">
            {{ formatPrice(Number(value)) }}
          </span>
        </template>

        <!-- Actions Slot -->
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-2">
            <button
              @click.stop="editProduct((row as Product).id)"
              class="p-1 text-gray-500 hover:text-blue-600 transition-colors"
              title="Editar"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              @click.stop="confirmDelete(row as Product)"
              class="p-1 text-gray-500 hover:text-red-600 transition-colors"
              title="Eliminar"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista - Lista de Productos
 * @module @modules/inventory/views/ProductListView
 */
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Pencil, Trash2 } from 'lucide-vue-next';
import { LoadingSpinner, ErrorMessage, DataTable, type Column, type SortOrder } from '@shared/index.js';
import { useInventory } from '../composables/useInventory';
import { inventoryRouteNames } from '../router';
import ProductStockBadge from '../components/ProductStockBadge.vue';
import type { Product } from '../types';

const router = useRouter();

const { 
  products, 
  isLoading, 
  errors, 
  loadProducts, 
  deleteProduct,
  getStockLevel,
  formatPrice,
} = useInventory();

const sortKey = ref<string>('name');
const sortOrder = ref<SortOrder>('asc');

const columns: Column[] = [
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'category', label: 'Categoría', sortable: true },
  { key: 'currentStock', label: 'Stock', sortable: true, align: 'center' },
  { key: 'salePrice', label: 'Precio', sortable: true, align: 'right', format: 'currency' },
  { key: 'actions', label: 'Acciones', align: 'center' },
];

function handleRowClick(row: unknown): void {
  const product = row as Product;
  router.push({ name: inventoryRouteNames.productDetail, params: { id: product.id } });
}

function editProduct(id: string): void {
  router.push({ name: inventoryRouteNames.productEdit, params: { id } });
}

async function confirmDelete(row: unknown): Promise<void> {
  const product = row as Product;
  if (confirm(`¿Eliminar el producto "${product.name}"?`)) {
    await deleteProduct(product.id);
  }
}

function handleSort(key: string, order: SortOrder): void {
  sortKey.value = key;
  sortOrder.value = order;
}

async function reloadProducts(): Promise<void> {
  await loadProducts();
}

onMounted(() => {
  loadProducts();
});
</script>
