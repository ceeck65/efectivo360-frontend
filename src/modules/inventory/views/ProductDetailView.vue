<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="py-12">
      <LoadingSpinner size="lg" color="primary" />
    </div>

    <!-- Error State -->
    <ErrorMessage
      v-else-if="error"
      :message="error"
      variant="error"
      retry-label="Reintentar"
      :on-retry="reloadProduct"
    />

    <!-- Product Detail -->
    <template v-else-if="product">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-start gap-4">
          <div class="p-3 bg-blue-100 rounded-lg">
            <Package class="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ product.name }}</h1>
            <p class="mt-1 text-sm text-gray-500">
              SKU: {{ product.sku }}
            </p>
            <div class="mt-2">
              <ProductStockBadge
                :level="getStockLevel(product)"
                :stock-quantity="product.currentStock"
                show-quantity
              />
            </div>
          </div>
        </div>
        <div class="flex gap-3">
          <router-link
            :to="{ name: inventoryRouteNames.productEdit, params: { id: product.id } }"
            class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Pencil class="w-4 h-4" />
            Editar
          </router-link>
          <button
            @click="goBack"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <ArrowLeft class="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Basic Info -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Información General
          </h3>
          <dl class="space-y-3">
            <div class="flex justify-between py-2 border-b border-gray-100">
              <dt class="text-gray-600">Categoría</dt>
              <dd class="font-medium text-gray-900">{{ product.category }}</dd>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <dt class="text-gray-600">Unidad de Medida</dt>
              <dd class="font-medium text-gray-900">{{ product.unitOfMeasure }}</dd>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <dt class="text-gray-600">Ubicación</dt>
              <dd class="font-medium text-gray-900">{{ product.location || '-' }}</dd>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <dt class="text-gray-600">Código de Barras</dt>
              <dd class="font-medium text-gray-900">{{ product.barcode || '-' }}</dd>
            </div>
            <div class="flex justify-between py-2">
              <dt class="text-gray-600">Estado</dt>
              <dd>
                <span
                  class="inline-flex px-2 py-1 rounded-full text-xs font-medium"
                  :class="product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                >
                  {{ product.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <!-- Pricing -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Precios
          </h3>
          <dl class="space-y-3">
            <div class="flex justify-between py-2 border-b border-gray-100">
              <dt class="text-gray-600">Precio de Venta</dt>
              <dd class="text-xl font-bold text-blue-600">
                {{ formatPrice(product.salePrice) }}
              </dd>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <dt class="text-gray-600">Precio de Costo</dt>
              <dd class="font-medium text-gray-900">
                {{ formatPrice(product.costPrice) }}
              </dd>
            </div>
            <div class="flex justify-between py-2">
              <dt class="text-gray-600">Margen</dt>
              <dd 
                class="font-medium"
                :class="margin > 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ formatPercentage(margin) }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Stock Levels -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Niveles de Stock
          </h3>
          <dl class="space-y-3">
            <div class="flex justify-between py-2 border-b border-gray-100">
              <dt class="text-gray-600">Stock Actual</dt>
              <dd class="text-xl font-bold text-gray-900">
                {{ product.currentStock }}
              </dd>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <dt class="text-gray-600">Stock Mínimo</dt>
              <dd class="font-medium" :class="isLowStock ? 'text-yellow-600' : 'text-gray-900'">
                {{ product.minStockLevel }}
              </dd>
            </div>
            <div class="flex justify-between py-2">
              <dt class="text-gray-600">Stock Máximo</dt>
              <dd class="font-medium text-gray-900">
                {{ product.maxStockLevel || '-' }}
              </dd>
            </div>
          </dl>
          <div v-if="isLowStock" class="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p class="text-sm text-yellow-800">
              <AlertTriangle class="inline w-4 h-4 mr-1" />
              El stock está por debajo del mínimo recomendado
            </p>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div v-if="product.description" class="bg-white rounded-xl border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
        <p class="text-gray-600">{{ product.description }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista - Detalle de Producto
 * @module @modules/inventory/views/ProductDetailView
 */
import { computed, onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Package, Pencil, ArrowLeft, AlertTriangle } from 'lucide-vue-next';
import { LoadingSpinner, ErrorMessage } from '@shared/index.js';
import { useInventory } from '../composables/useInventory';
import { inventoryRouteNames } from '../router';
import ProductStockBadge from '../components/ProductStockBadge.vue';
const router = useRouter();
const route = useRoute();

const {
  selectedProduct,
  loadProductById,
  getStockLevel,
  formatPrice,
} = useInventory();

const isLoading = ref(false);
const error = ref<string | null>(null);

const product = computed(() => selectedProduct.value);

const margin = computed(() => {
  if (!product.value) return 0;
  const cost = product.value.costPrice;
  const sale = product.value.salePrice;
  if (cost === 0) return 0;
  return ((sale - cost) / cost) * 100;
});

const isLowStock = computed(() => {
  if (!product.value) return false;
  return product.value.currentStock <= product.value.minStockLevel;
});

function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function goBack(): void {
  router.push({ name: inventoryRouteNames.products });
}

async function reloadProduct(): Promise<void> {
  const id = route.params.id as string;
  if (id) {
    isLoading.value = true;
    error.value = null;
    try {
      await loadProductById(id);
    } catch (err) {
      error.value = 'Error cargando el producto';
    } finally {
      isLoading.value = false;
    }
  }
}

onMounted(() => {
  reloadProduct();
});
</script>
