<template>
  <div class="max-w-3xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
      </h1>
      <p class="mt-1 text-sm text-gray-500">
        {{ isEditing ? 'Modifica los datos del producto' : 'Completa la información del nuevo producto' }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-12 text-center">
      <LoadingSpinner size="lg" color="primary" />
      <p class="mt-4 text-sm text-gray-500">Cargando...</p>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Error Message -->
      <ErrorMessage
        v-if="saveError"
        :message="saveError"
        variant="error"
        dismissible
        @dismiss="clearSaveError"
      />

      <!-- Basic Information -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Información Básica
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- SKU -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              SKU <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.sku"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: PROD-001"
            />
          </div>

          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre del producto"
            />
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Categoría <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.categoryId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecciona una categoría</option>
              <option 
                v-for="category in categories" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>

          <!-- Unit of Measure -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Unidad de Medida <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.unitOfMeasure"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="UNIT">Unidad</option>
              <option value="KG">Kilogramo</option>
              <option value="G">Gramo</option>
              <option value="L">Litro</option>
              <option value="ML">Mililitro</option>
              <option value="BOX">Caja</option>
              <option value="PACK">Paquete</option>
            </select>
          </div>
        </div>

        <!-- Description -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Descripción detallada del producto..."
          />
        </div>
      </div>

      <!-- Pricing -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Precios
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Cost Price -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Precio de Costo <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Bs.</span>
              <input
                v-model.number="form.costPrice"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Sale Price -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Precio de Venta <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Bs.</span>
              <input
                v-model.number="form.salePrice"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <!-- Margin Preview -->
        <div v-if="marginPreview !== null" class="mt-4 p-3 bg-gray-50 rounded-lg">
          <p class="text-sm">
            Margen estimado: 
            <span 
              class="font-medium"
              :class="marginPreview >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ formatPercentage(marginPreview) }}
            </span>
          </p>
        </div>
      </div>

      <!-- Stock Configuration -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Configuración de Stock
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Initial Stock -->
          <div v-if="!isEditing">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Stock Inicial
            </label>
            <input
              v-model.number="form.initialStock"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <!-- Min Stock -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Stock Mínimo
            </label>
            <input
              v-model.number="form.minStockLevel"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <!-- Max Stock -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Stock Máximo
            </label>
            <input
              v-model.number="form.maxStockLevel"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        <!-- Location & Barcode -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Ubicación en Almacén
            </label>
            <input
              v-model="form.location"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Estante A-3"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Código de Barras
            </label>
            <input
              v-model="form.barcode"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: 7501234567890"
            />
          </div>
        </div>

        <!-- Tracking Options -->
        <div class="flex gap-6 mt-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="form.trackLots"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">Seguimiento por lotes</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="form.trackExpiry"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">Control de vencimiento</span>
          </label>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button
          type="button"
          @click="goBack"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <LoadingSpinner v-if="saving" size="sm" color="white" />
          <Save v-else class="w-4 h-4" />
          {{ saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Producto') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview Vista - Formulario de Producto (Crear/Editar)
 * @module @modules/inventory/views/ProductFormView
 */
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Save } from 'lucide-vue-next';
import { LoadingSpinner, ErrorMessage } from '@shared/index.js';
import { useInventory } from '../composables/useInventory';
import { inventoryRouteNames } from '../router';
import type { CreateProductDTO, UpdateProductDTO, UnitOfMeasure } from '../types';

const router = useRouter();
const route = useRoute();

const {
  selectedProduct,
  categories,
  loadCategories,
  loadProductById,
  createProduct,
  updateProduct,
} = useInventory();

const isLoading = ref(false);
const saving = ref(false);
const saveError = ref<string | null>(null);

const isEditing = computed(() => !!route.params.id);

const form = ref<CreateProductDTO>({
  sku: '',
  name: '',
  description: '',
  categoryId: '',
  unitOfMeasure: 'UNIT' as UnitOfMeasure,
  salePrice: 0,
  costPrice: 0,
  initialStock: 0,
  minStockLevel: 0,
  maxStockLevel: 0,
  location: '',
  barcode: '',
  trackLots: false,
  trackExpiry: false,
});

const marginPreview = computed(() => {
  const cost = form.value.costPrice;
  const sale = form.value.salePrice;
  if (cost === 0) return null;
  return ((sale - cost) / cost) * 100;
});

function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function clearSaveError(): void {
  saveError.value = null;
}

function goBack(): void {
  router.push({ name: inventoryRouteNames.products });
}

async function handleSubmit(): Promise<void> {
  saving.value = true;
  saveError.value = null;

  try {
    // Convertir precios a centavos para la API
    const data = {
      ...form.value,
      salePrice: Math.round(form.value.salePrice * 100),
      costPrice: Math.round(form.value.costPrice * 100),
    };

    let result;
    if (isEditing.value) {
      const updateData: UpdateProductDTO = { ...data };
      delete (updateData as Record<string, unknown>).initialStock;
      result = await updateProduct(route.params.id as string, updateData);
    } else {
      result = await createProduct(data);
    }

    if (result) {
      router.push({ name: inventoryRouteNames.products });
    } else {
      saveError.value = 'Error guardando el producto';
    }
  } catch (err) {
    saveError.value = 'Error inesperado. Intente nuevamente.';
  } finally {
    saving.value = false;
  }
}

async function loadExistingProduct(): Promise<void> {
  const id = route.params.id as string;
  if (!id) return;

  isLoading.value = true;
  try {
    await loadProductById(id);
    if (selectedProduct.value) {
      const p = selectedProduct.value;
      form.value = {
        sku: p.sku,
        name: p.name,
        description: p.description,
        categoryId: p.categoryId,
        unitOfMeasure: p.unitOfMeasure,
        salePrice: p.salePrice / 100,
        costPrice: p.costPrice / 100,
        initialStock: 0,
        minStockLevel: p.minStockLevel,
        maxStockLevel: p.maxStockLevel,
        location: p.location || '',
        barcode: p.barcode || '',
        trackLots: p.trackLots,
        trackExpiry: p.trackExpiry,
      };
    }
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await loadCategories();
  if (isEditing.value) {
    await loadExistingProduct();
  }
});
</script>
