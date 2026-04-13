<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard de Inventario</h1>
        <p class="mt-1 text-sm text-gray-500">
          Resumen general del estado del inventario
        </p>
      </div>
      <div class="flex gap-3">
        <button
          @click="refreshData"
          :disabled="isLoading"
          class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw :class="{ 'animate-spin': isLoading }" class="w-4 h-4" />
          Actualizar
        </button>
        <router-link
          :to="paths.products()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Package class="w-4 h-4" />
          Ver Productos
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !summary" class="py-12">
      <LoadingSpinner size="lg" color="primary" />
    </div>

    <!-- Error State -->
    <ErrorMessage
      v-else-if="errors.summary"
      :message="errors.summary"
      variant="error"
      retry-label="Reintentar"
      :on-retry="refreshData"
    />

    <!-- Dashboard Content -->
    <template v-else-if="summary">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Productos -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Productos</p>
              <p class="mt-2 text-3xl font-bold text-gray-900">
                {{ formatNumber(summary.totalProducts) }}
              </p>
            </div>
            <div class="p-3 bg-blue-50 rounded-lg">
              <Package class="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <!-- Stock Bajo -->
        <div 
          class="bg-white rounded-xl border p-6 cursor-pointer hover:shadow-md transition-shadow"
          :class="summary.lowStockCount > 0 ? 'border-yellow-200' : 'border-gray-200'"
          @click="goToLowStock"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Stock Bajo</p>
              <p 
                class="mt-2 text-3xl font-bold"
                :class="summary.lowStockCount > 0 ? 'text-yellow-600' : 'text-gray-900'"
              >
                {{ formatNumber(summary.lowStockCount) }}
              </p>
            </div>
            <div 
              class="p-3 rounded-lg"
              :class="summary.lowStockCount > 0 ? 'bg-yellow-50' : 'bg-gray-50'"
            >
              <AlertTriangle 
                class="w-6 h-6"
                :class="summary.lowStockCount > 0 ? 'text-yellow-600' : 'text-gray-400'"
              />
            </div>
          </div>
          <p v-if="summary.lowStockCount > 0" class="mt-2 text-xs text-yellow-600">
            Requiere atención
          </p>
        </div>

        <!-- Sin Stock -->
        <div 
          class="bg-white rounded-xl border p-6 cursor-pointer hover:shadow-md transition-shadow"
          :class="summary.outOfStockCount > 0 ? 'border-red-200' : 'border-gray-200'"
          @click="goToOutOfStock"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Sin Stock</p>
              <p 
                class="mt-2 text-3xl font-bold"
                :class="summary.outOfStockCount > 0 ? 'text-red-600' : 'text-gray-900'"
              >
                {{ formatNumber(summary.outOfStockCount) }}
              </p>
            </div>
            <div 
              class="p-3 rounded-lg"
              :class="summary.outOfStockCount > 0 ? 'bg-red-50' : 'bg-gray-50'"
            >
              <XCircle 
                class="w-6 h-6"
                :class="summary.outOfStockCount > 0 ? 'text-red-600' : 'text-gray-400'"
              />
            </div>
          </div>
          <p v-if="summary.outOfStockCount > 0" class="mt-2 text-xs text-red-600">
            Urgente reponer
          </p>
        </div>

        <!-- Movimientos Hoy -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Movimientos Hoy</p>
              <p class="mt-2 text-3xl font-bold text-gray-900">
                {{ formatNumber(summary.todayMovements) }}
              </p>
            </div>
            <div class="p-3 bg-purple-50 rounded-lg">
              <ArrowLeftRight class="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <!-- Valoración y Alertas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Valor del Inventario -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Valoración del Inventario
          </h3>
          <div class="space-y-4">
            <div class="flex justify-between items-center py-3 border-b border-gray-100">
              <span class="text-gray-600">Valor al Costo</span>
              <span class="text-xl font-semibold text-gray-900">
                {{ formatCurrency(summary.totalInventoryValue) }}
              </span>
            </div>
            <div class="flex justify-between items-center py-3 border-b border-gray-100">
              <span class="text-gray-600">Potencial de Ventas</span>
              <span class="text-xl font-semibold text-green-600">
                {{ formatCurrency(summary.potentialRevenue) }}
              </span>
            </div>
            <div class="flex justify-between items-center py-3">
              <span class="text-gray-600">Margen Estimado</span>
              <span 
                class="text-xl font-semibold"
                :class="estimatedMargin >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ formatPercentage(estimatedMargin) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Alertas -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Alertas
          </h3>
          <div class="space-y-3">
            <div 
              v-if="summary.expiringLotsCount > 0"
              class="flex items-start gap-3 p-3 bg-orange-50 rounded-lg"
            >
              <Clock class="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p class="font-medium text-orange-900">
                  Lotes próximos a vencer
                </p>
                <p class="text-sm text-orange-700">
                  {{ summary.expiringLotsCount }} lotes vencen en los próximos 30 días
                </p>
              </div>
            </div>
            
            <div 
              v-if="productsWithStockAlerts.length > 0"
              class="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg"
            >
              <AlertTriangle class="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p class="font-medium text-yellow-900">
                  Stock bajo
                </p>
                <p class="text-sm text-yellow-700">
                  {{ productsWithStockAlerts.length }} productos necesitan reposición
                </p>
              </div>
            </div>

            <div 
              v-if="summary.outOfStockCount === 0 && summary.lowStockCount === 0 && summary.expiringLotsCount === 0"
              class="flex items-center gap-3 p-4 bg-green-50 rounded-lg"
            >
              <CheckCircle2 class="w-5 h-5 text-green-600" />
              <p class="text-green-900">
                No hay alertas activas. ¡Todo en orden!
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Acciones Rápidas -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        <div class="flex flex-wrap gap-3">
          <router-link
            :to="paths.productCreate()"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus class="w-4 h-4" />
            Nuevo Producto
          </router-link>
          <router-link
            :to="paths.adjustment()"
            class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Scale class="w-4 h-4" />
            Ajustar Stock
          </router-link>
          <router-link
            :to="paths.movements()"
            class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <History class="w-4 h-4" />
            Ver Movimientos
          </router-link>
          <router-link
            :to="paths.categories()"
            class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Tags class="w-4 h-4" />
            Categorías
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista principal - Dashboard de Inventario
 * @module @modules/inventory/views/InventoryDashboard
 */
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Package, 
  AlertTriangle, 
  XCircle, 
  ArrowLeftRight,
  RefreshCw,
  Plus,
  Scale,
  History,
  Tags,
  Clock,
  CheckCircle2
} from 'lucide-vue-next';
import { LoadingSpinner, ErrorMessage } from '@shared/index.js';
import { useInventory } from '../composables/useInventory';
import { inventoryPaths as paths } from '../router';

const router = useRouter();

const {
  summary,
  productsWithStockAlerts,
  isLoading,
  errors,
  loadSummary,
  loadProducts,
  applyFilters,
} = useInventory();

// Margen estimado basado en costo vs potencial de ventas
const estimatedMargin = computed(() => {
  if (!summary.value) return 0;
  const cost = summary.value.totalInventoryValue;
  const revenue = summary.value.potentialRevenue;
  if (cost === 0) return 0;
  return ((revenue - cost) / cost) * 100;
});

// Formateadores
function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-VE').format(num);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
  }).format(amount / 100);
}

function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

// Navegación
async function goToLowStock(): Promise<void> {
  await applyFilters({ lowStockOnly: true });
  router.push(paths.products());
}

async function goToOutOfStock(): Promise<void> {
  await applyFilters({ activeOnly: true });
  router.push(paths.products());
}

async function refreshData(): Promise<void> {
  await loadSummary();
}

// Carga inicial
onMounted(async () => {
  await loadSummary();
  await loadProducts({ activeOnly: true, pageSize: 5 });
});
</script>
