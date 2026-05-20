<template>
  <div class="max-w-3xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-foreground">
        {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ isEditing ? 'Modifica los datos del producto' : 'Completa la información del nuevo producto' }}
      </p>
    </div>

    <div v-if="isLoading" class="py-12 text-center">
      <LoadingSpinner size="lg" color="primary" />
      <p class="mt-4 text-sm text-muted-foreground">Cargando...</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <ErrorMessage
        v-if="saveError"
        :message="saveError"
        variant="error"
        dismissible
        @dismiss="clearSaveError"
      />

      <!-- Alerta de Rubro (Efi) -->
      <Transition name="fade-slide">
        <div
          v-if="rubroWarning"
          class="flex items-start gap-3 p-4 rounded-xl border border-electric/30 bg-electric/5"
        >
          <span class="text-lg shrink-0">✨</span>
          <div class="text-sm text-foreground">
            <p class="font-medium">Efi detectó un posible desajuste de rubro</p>
            <p class="mt-1 text-muted-foreground">{{ rubroWarning }}</p>
          </div>
          <button
            type="button"
            @click="rubroWarning = ''"
            class="ml-auto shrink-0 text-muted-foreground hover:text-foreground text-lg leading-none"
          >&times;</button>
        </div>
      </Transition>

      <!-- ============ INFORMACIÓN BÁSICA ============ -->
      <div class="bg-card rounded-xl border border-border p-6">
        <h2 class="text-lg font-semibold text-card-foreground mb-4">
          Información Básica
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">
              SKU <span class="text-destructive">*</span>
            </label>
            <input
              v-model="form.sku"
              type="text"
              required
              class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="Ej: PROD-001"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">
              Nombre <span class="text-destructive">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="Nombre del producto"
            />
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">
              Categoría <span class="text-destructive">*</span>
            </label>
            <div class="relative">
              <select
                v-model="form.categoryId"
                required
                :class="[
                  'w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring appearance-none',
                  suggestedCategory
                    ? 'border-electric bg-electric/5 pr-8'
                    : 'border-input'
                ]"
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
              <span
                v-if="suggestionLoading"
                class="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <LoadingSpinner size="sm" color="primary" />
              </span>
            </div>
            <Transition name="fade">
              <div
                v-if="suggestedCategory && form.categoryId"
                class="mt-1.5 flex items-center gap-1.5"
              >
                <span class="inline-flex items-center gap-1 text-xs text-electric font-medium">
                  <span>✨</span> Sugerido por Efi
                </span>
                <button
                  type="button"
                  @click="clearSuggestion"
                  class="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Descartar
                </button>
              </div>
              <p
                v-else-if="suggestedCategory && !form.categoryId"
                class="mt-1 text-xs text-electric"
              >
                ✨ Efi sugiere: <strong>{{ suggestedCategory.category_name }}</strong>
              </p>
            </Transition>
          </div>

          <!-- Unit of Measure (default) -->
          <div v-if="!isService">
            <label class="block text-sm font-medium text-foreground mb-1">
              Unidad de Medida <span class="text-destructive">*</span>
            </label>
            <Transition name="fade" mode="out-in">
              <select
                v-if="attributeProfile === 'weight'"
                key="weight"
                v-model="form.unitOfMeasure"
                required
                class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <option value="KG">Kilogramo (kg)</option>
                <option value="G">Gramo (g)</option>
                <option value="LB">Libra (lb)</option>
                <option value="L">Litro (L)</option>
                <option value="ML">Mililitro (ml)</option>
              </select>
              <select
                v-else
                key="default"
                v-model="form.unitOfMeasure"
                required
                class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <option value="UNIT">Unidad</option>
                <option value="BOX">Caja</option>
                <option value="PACK">Paquete</option>
              </select>
            </Transition>
          </div>

          <!-- Service Duration -->
          <div v-if="isService">
            <label class="block text-sm font-medium text-foreground mb-1">
              Duración Estimada
            </label>
            <div class="flex gap-2">
              <input
                v-model.number="form.serviceDuration"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                placeholder="1"
              />
              <select
                v-model="form.serviceDurationUnit"
                class="w-28 px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <option value="MIN">Minutos</option>
                <option value="HOUR">Horas</option>
                <option value="DAY">Días</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-foreground mb-1">
            Descripción
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
            placeholder="Descripción detallada del producto..."
          />
        </div>

        <!-- Atributos Dinámicos (Características / Técnico) -->
        <Transition name="fade-slide">
          <div v-if="dynamicFields.length > 0 && !isService" class="mt-4 border-t border-border pt-4">
            <h3 class="text-sm font-medium text-foreground mb-3">
              {{ dynamicFieldsLabel }}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div v-for="field in dynamicFields" :key="field.field">
                <label class="block text-xs font-medium text-muted-foreground mb-1">
                  {{ field.label }}
                </label>
                <select
                  v-if="field.type === 'select' && field.options"
                  v-model="form.dynamicAttributes![field.field]"
                  class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="">Seleccionar</option>
                  <option v-for="opt in field.options" :key="opt" :value="opt">
                    {{ opt }}
                  </option>
                </select>
                <input
                  v-else
                  v-model="form.dynamicAttributes![field.field]"
                  type="text"
                  class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                  :placeholder="field.label"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- ============ PRECIOS ============ -->
      <div class="bg-card rounded-xl border border-border p-6">
        <h2 class="text-lg font-semibold text-card-foreground mb-4">
          Precios
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">
              Precio de Costo <span class="text-destructive">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Bs.</span>
              <input
                v-model.number="form.costPrice"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">
              Precio de Venta <span class="text-destructive">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Bs.</span>
              <input
                v-model.number="form.salePrice"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
        <Transition name="fade">
          <div v-if="marginPreview !== null" class="mt-4 p-3 bg-muted rounded-lg">
            <p class="text-sm">
              Margen estimado:
              <span
                class="font-medium"
                :class="marginPreview >= 0 ? 'text-green-600' : 'text-destructive'"
              >
                {{ formatPercentage(marginPreview) }}
              </span>
            </p>
          </div>
        </Transition>
      </div>

      <!-- ============ STOCK (oculto si es servicio) ============ -->
      <Transition name="fade-slide">
        <div v-if="!isService" class="bg-card rounded-xl border border-border p-6">
          <h2 class="text-lg font-semibold text-card-foreground mb-4">
            Configuración de Stock
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-if="!isEditing">
              <label class="block text-sm font-medium text-foreground mb-1">
                Stock Inicial
              </label>
              <input
                v-model.number="form.initialStock"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                placeholder="0"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">
                Stock Mínimo
              </label>
              <input
                v-model.number="form.minStockLevel"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                placeholder="0"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">
                Stock Máximo
              </label>
              <input
                v-model.number="form.maxStockLevel"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                placeholder="0"
              />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">
                Ubicación en Almacén
              </label>
              <input
                v-model="form.location"
                type="text"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                placeholder="Ej: Estante A-3"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">
                Código de Barras
              </label>
              <input
                v-model="form.barcode"
                type="text"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                placeholder="Ej: 7501234567890"
              />
            </div>
          </div>
          <div class="flex gap-6 mt-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.trackLots"
                type="checkbox"
                class="w-4 h-4 text-primary border-input rounded focus:ring-ring"
              />
              <span class="text-sm text-foreground">Seguimiento por lotes</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.trackExpiry"
                type="checkbox"
                class="w-4 h-4 text-primary border-input rounded focus:ring-ring"
              />
              <span class="text-sm text-foreground">Control de vencimiento</span>
            </label>
          </div>
        </div>
      </Transition>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button
          type="button"
          @click="goBack"
          class="px-4 py-2 border border-input rounded-lg text-sm font-medium text-foreground bg-card hover:bg-accent"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
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
 * @fileoverview Vista - Formulario de Producto Camaleónico (Crear/Editar)
 * Se adapta dinámicamente al tipo de negocio usando el Blueprint del tenant.
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Save } from 'lucide-vue-next';
import { LoadingSpinner, ErrorMessage } from '@shared/index.js';
import { useInventory } from '../composables/useInventory';
import { InventoryService } from '../services/inventory.service';
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

// ==================== BLUEPRINT / CHAMELEON STATE ====================

interface DynamicField {
  field: string;
  type: string;
  label: string;
  unit?: string;
  options?: string[];
}

const blueprintConfig = ref<Record<string, unknown> | null>(null);
const rubroWarning = ref('');

const isService = ref(false);

const attributeProfile = computed(() => {
  const profile = (blueprintConfig.value?.attribute_profile as Record<string, unknown>) || {};
  return (profile.code as string) || 'default';
});

const dynamicFields = computed<DynamicField[]>(() => {
  const profile = (blueprintConfig.value?.attribute_profile as Record<string, unknown>) || {};
  return (profile.fields as DynamicField[]) || [];
});

const dynamicFieldsLabel = computed(() => {
  const profile = (blueprintConfig.value?.attribute_profile as Record<string, unknown>) || {};
  return (profile.label as string) || 'Atributos';
});

// ==================== FORM STATE ====================

const form = ref<CreateProductDTO & {
  serviceDuration?: number;
  serviceDurationUnit?: string;
  dynamicAttributes?: Record<string, string>;
}>({
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
  serviceDuration: 0,
  serviceDurationUnit: 'MIN',
  dynamicAttributes: {},
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

// ==================== CATEGORÍAS INTELIGENTES (EFI) ====================

interface SuggestedCategory {
  category_id: string;
  category_name: string;
  category_code: string;
  full_path: string;
  slug: string;
  matched_keywords: string[];
  confidence: number;
}

const suggestedCategory = ref<SuggestedCategory | null>(null);
const suggestionLoading = ref(false);
const lastSuggestedName = ref('');

let suggestionTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => form.value.name,
  (newName) => {
    if (suggestionTimer) clearTimeout(suggestionTimer);
    const trimmed = (newName || '').trim();
    if (trimmed.length < 3) {
      suggestedCategory.value = null;
      lastSuggestedName.value = '';
      return;
    }
    if (lastSuggestedName.value && trimmed.toLowerCase().startsWith(lastSuggestedName.value.toLowerCase())) {
      return;
    }
    suggestionTimer = setTimeout(() => fetchSuggestion(trimmed), 500);
  }
);

async function fetchSuggestion(name: string): Promise<void> {
  suggestionLoading.value = true;
  try {
    const result = await InventoryService.suggestCategory(name);
    if (result.suggested && result.category) {
      const cat = result.category as SuggestedCategory;
      suggestedCategory.value = cat;
      lastSuggestedName.value = name;
      const match = categories.value.find(c => c.id === cat.category_id);
      if (match) form.value.categoryId = cat.category_id;
    } else if (lastSuggestedName.value === name) {
      suggestedCategory.value = null;
      // Efi validation: check if product matches business type
      await checkBusinessType(name);
    }
  } catch {
    if (lastSuggestedName.value === name) suggestedCategory.value = null;
  } finally {
    suggestionLoading.value = false;
  }
}

async function checkBusinessType(name: string): Promise<void> {
  try {
    const result = await InventoryService.validateProduct(name) as Record<string, unknown>;
    if (result.valid === false && result.warning) {
      rubroWarning.value = result.warning as string;
    } else {
      rubroWarning.value = '';
    }
  } catch {
    // ignore validation errors
  }
}

function clearSuggestion(): void {
  suggestedCategory.value = null;
  lastSuggestedName.value = '';
  form.value.categoryId = '';
}

onUnmounted(() => {
  if (suggestionTimer) clearTimeout(suggestionTimer);
});

// ==================== HANDLE SUBMIT ====================

async function handleSubmit(): Promise<void> {
  saving.value = true;
  saveError.value = null;

  try {
    const data: Record<string, unknown> = {
      ...form.value,
      salePrice: Math.round(form.value.salePrice * 100),
      costPrice: Math.round(form.value.costPrice * 100),
      is_service: isService.value,
    };

    if (isService.value) {
      data.service_duration = form.value.serviceDuration;
      data.service_duration_unit = form.value.serviceDurationUnit;
      data.initial_stock = 0;
      data.min_stock_level = 0;
      data.max_stock_level = 0;
      data.track_lots = false;
      data.track_expiry = false;
    }

    if (Object.keys(form.value.dynamicAttributes || {}).length > 0) {
      data.dynamic_attributes = form.value.dynamicAttributes;
    }

    let result;
    if (isEditing.value) {
      delete data.initialStock;
      const updateData = data as unknown as UpdateProductDTO;
      result = await updateProduct(route.params.id as string, updateData);
    } else {
      result = await createProduct(data as unknown as CreateProductDTO);
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

// ==================== LOAD EXISTING ====================

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
        serviceDuration: 0,
        serviceDurationUnit: 'MIN',
        dynamicAttributes: {},
      };
    }
  } finally {
    isLoading.value = false;
  }
}

// ==================== MOUNTED ====================

onMounted(async () => {
  await loadCategories();

  try {
    const config = await InventoryService.getBlueprintConfig();
    blueprintConfig.value = config;

    isService.value = (config.supports_services as boolean) || false;
  } catch {
    // ignore blueprint errors, form works with defaults
  }

  if (isEditing.value) {
    await loadExistingProduct();
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
