<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />
      <div class="relative bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
        <!-- Header -->
        <div class="flex items-start justify-between px-5 py-4 border-b border-slate-200">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <PackagePlus class="w-4 h-4 text-blue-500" /> Registro Rápido de Producto
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Créalo sin salir de la factura</p>
          </div>
          <button @click="handleClose" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-3 max-h-[75vh] overflow-y-auto">
          <!-- Informative banner -->
          <div class="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2.5">
            <Globe2 class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p class="text-[11px] text-blue-700 leading-snug">
              Código no encontrado en la red global. Este producto se registrará para tu tienda y se enviará a verificación.
            </p>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Código de Barras</label>
            <div class="flex items-center gap-2 h-9 px-3 text-sm font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-500">
              <Lock class="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span class="truncate">{{ barcode }}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">
              Nombre Comercial / Nomenclatura <span class="text-red-400">*</span>
            </label>
            <input
              ref="nameInput"
              v-model="name"
              type="text"
              placeholder="Ej: Marca + Producto + Contenido"
              class="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              @keydown.enter.prevent="focusNext(0)"
            />
          </div>

          <CategoryAsyncSelect v-model="categoryId" @select="onCategorySelect" />

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">
              Tratamiento Fiscal / Impuestos <span class="text-red-400">*</span>
            </label>
            <select
              :ref="(el) => setFieldRef(0, el)"
              v-model="taxType"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              @keydown.enter.prevent="focusNext(1)">
              <option value="" disabled>Selecciona un tratamiento fiscal...</option>
              <option v-for="opt in TAX_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Unidad de Venta POS</label>
              <select
                :ref="(el) => setFieldRef(1, el)"
                v-model="saleUnit"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                @keydown.enter.prevent="focusNext(2)">
                <option v-for="opt in SALE_UNIT_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <p v-if="requiresDecimalInput" class="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-amber-600">
                <Scale class="w-3 h-3 shrink-0" />
                Requiere ingreso decimal / balanza en el POS.
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Presentación de Compra</label>
              <select
                :ref="(el) => setFieldRef(2, el)"
                v-model="purchaseUnitName"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                @keydown.enter.prevent="focusNext(3)">
                <option v-for="opt in packageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Factor de Conversión</label>
              <input
                :ref="(el) => setFieldRef(3, el)"
                v-model.number="conversionFactor"
                type="number" min="0.001" step="0.001" placeholder="24"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                @keydown.enter.prevent="focusNext(4)" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Precio Venta ($)</label>
              <input
                :ref="(el) => setFieldRef(4, el)"
                v-model.number="priceUsd"
                type="number" min="0" step="0.01" placeholder="0.00"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                @keydown.enter.prevent="submit" />
            </div>
          </div>
          <p class="text-[11px] text-slate-400">
            Presiona <kbd class="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px]">Enter</kbd>
            en cualquier campo para avanzar, o en Precio de Venta para guardar.
          </p>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
          <button @click="handleClose" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button @click="submit" :disabled="!canSubmit || saving"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            {{ saving ? 'Guardando...' : 'Guardar y Agregar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { X, Lock, PackagePlus, Save, Loader2, Globe2, Scale } from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import CategoryAsyncSelect from '@/views/admin/staff/products/CategoryAsyncSelect.vue';
import { packageOptionsFor, directPackageFor } from '@/composables/usePackageTypes';

// Matches GlobalProduct.TaxType / Product.tax_type on the backend (apps/products/models.py).
// REDUCIDO exists on the backend but isn't offered here per the quick-create UX spec.
const TAX_TYPE_OPTIONS = [
  { value: 'EXEMPT', label: 'Exento de IVA (E)' },
  { value: 'IVA_16', label: 'IVA General (16%)' },
  { value: 'IVA_8', label: 'IVA Reducido (8%)' },
];
// Matches GlobalProduct.SaleUnitChoices (apps/products/models.py).
const SALE_UNIT_OPTIONS = [
  { value: 'PESO', label: '⚖️ PESO (Kilogramos, Gramos, Libras, Granel)' },
  { value: 'VOLUMEN', label: '🧪 VOLUMEN (Lítros, Mililitros, Gases, Galones)' },
  { value: 'UNIDAD', label: '📦 UNIDAD (Unidades, Pares, Docenas, Bultos, Cajas)' },
];
// PESO / VOLUMEN products are sold by weight or volume, so the POS needs a
// decimal quantity field (and, where available, a scale reading) instead of
// a whole-number count.
const DECIMAL_SALE_UNITS = new Set(['PESO', 'VOLUMEN']);

export interface QuickCreatedProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  image: string | null;
  stock: number;
  sale_unit: string;
  purchase_unit_name: string;
  conversion_factor: number;
  current_cost: number;
  current_price: number;
  tax_type: string;
}

const props = defineProps<{
  visible: boolean;
  barcode: string;
}>();

const emit = defineEmits<{
  close: [];
  created: [product: QuickCreatedProduct];
}>();

const { error: notifyError } = useNotify();

const nameInput = ref<HTMLInputElement | null>(null);
const fieldRefs: Record<number, HTMLElement> = {};
function setFieldRef(idx: number, el: unknown) {
  if (el) fieldRefs[idx] = el as HTMLElement;
  else delete fieldRefs[idx];
}
function focusNext(idx: number) {
  fieldRefs[idx]?.focus();
}

const name = ref('');
const categoryId = ref<string | number | null>(null);
const taxType = ref('');
const saleUnit = ref('UNIDAD');
const purchaseUnitName = ref(directPackageFor('UNIDAD'));
const conversionFactor = ref<number | null>(1);
const priceUsd = ref<number | null>(null);
const saving = ref(false);

function onCategorySelect() {
  // Handled via v-model; kept for parity with CategoryAsyncSelect's contract.
}

const requiresDecimalInput = computed(() => DECIMAL_SALE_UNITS.has(saleUnit.value));
const packageOptions = computed(() => packageOptionsFor(saleUnit.value));

// Changing the measure re-preselects the "direct" package (no case/bulk
// multiplier) for the new measure — a PESO product should never keep a
// leftover LIQUIDO/UNIDAD package like GALON or BULTO selected.
watch(saleUnit, (unit) => {
  purchaseUnitName.value = directPackageFor(unit);
  conversionFactor.value = 1;
});

const canSubmit = computed(() => (
  name.value.trim().length > 0 &&
  !!categoryId.value &&
  !!taxType.value &&
  !!conversionFactor.value && conversionFactor.value > 0 &&
  priceUsd.value != null && priceUsd.value >= 0
));

function resetForm() {
  name.value = '';
  categoryId.value = null;
  taxType.value = '';
  saleUnit.value = 'UNIDAD';
  purchaseUnitName.value = directPackageFor('UNIDAD');
  conversionFactor.value = 1;
  priceUsd.value = null;
  saving.value = false;
}

function extractErrorMessage(e: any): string {
  const data = e?.data;
  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const val = firstKey ? data[firstKey] : null;
    if (Array.isArray(val) && val.length) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return e?.message || 'Error al crear el producto';
}

async function submit() {
  if (!canSubmit.value || saving.value) return;
  saving.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/products/quick-create/', {
      method: 'POST',
      data: {
        // The scanned/typed barcode is sent verbatim as both fields — it IS
        // the SKU by default. Never replaced by a client-generated hash here.
        barcode: props.barcode,
        sku: props.barcode,
        name: name.value.trim(),
        category_id: categoryId.value,
        tax_type: taxType.value,
        sale_unit: saleUnit.value,
        purchase_unit_name: purchaseUnitName.value,
        default_conversion_factor: conversionFactor.value,
        // The invoice grid captures the real cost per package right after this
        // row is inserted; this is only a seed value to satisfy the required field.
        cost_price_usd: priceUsd.value,
        price_usd: priceUsd.value,
      },
    });

    emit('created', {
      id: res.id,
      name: res.name,
      sku: res.sku,
      barcode: res.barcode ?? props.barcode,
      image: res.image ?? null,
      stock: Number(res.current_stock ?? 0),
      sale_unit: res.sale_unit,
      purchase_unit_name: res.purchase_unit_name,
      conversion_factor: Number(res.default_conversion_factor ?? conversionFactor.value),
      current_cost: Number(res.cost_price_usd ?? 0),
      current_price: Number(res.price_usd ?? 0),
      tax_type: res.tax_type ?? taxType.value,
    });
  } catch (e: any) {
    notifyError(extractErrorMessage(e));
  } finally {
    saving.value = false;
  }
}

function handleClose() {
  if (saving.value) return;
  emit('close');
}

watch(() => props.visible, (v) => {
  if (v) {
    resetForm();
    nextTick(() => nameInput.value?.focus());
  }
});
</script>
