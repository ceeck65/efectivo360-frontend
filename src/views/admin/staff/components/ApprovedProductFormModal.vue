<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />
      <div class="relative bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
        <!-- Header -->
        <div class="flex items-start justify-between px-5 py-4 border-b border-slate-200">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Package class="w-4 h-4 text-cyan-500" />
              {{ isEdit ? 'Editar Producto del Banco Global' : 'Nuevo Producto del Banco Global' }}
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">
              {{ isEdit ? `Código ${product?.barcode}` : 'Se agrega directamente como APROBADO' }}
            </p>
          </div>
          <button @click="handleClose" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
          <ProductImageUpload v-model="imageFile" :existing-url="product?.image_url || null" />

          <div v-if="isEdit">
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Código de Barras</label>
            <div class="flex items-center gap-2 h-9 px-3 text-sm font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-500">
              <Lock class="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span class="truncate">{{ product?.barcode }}</span>
            </div>
          </div>
          <div v-else>
            <label class="block text-xs font-medium text-slate-600 mb-1">
              Código de Barras <span class="text-red-400">*</span>
            </label>
            <input v-model="barcode" type="text" placeholder="7591031000983"
              class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500" />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">
              Nombre <span class="text-red-400">*</span>
            </label>
            <input v-model="name" type="text" placeholder="Ej: Pepsi Cola 1.5L"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500" />
          </div>

          <BrandSelect v-model="brandId" />
          <CategoryAsyncSelect v-model="categoryId" />

          <div>
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Impuesto (IVA)</label>
            <select v-model="taxType"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500">
              <option v-for="opt in TAX_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Unidad de Venta POS</label>
            <select v-model="saleUnit"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500">
              <option v-for="opt in SALE_UNIT_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <p v-if="requiresDecimalInput" class="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-amber-600">
              <Scale class="w-3 h-3 shrink-0" />
              El POS solicitará ingreso decimal / integración con balanza para este producto.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
          <button @click="handleClose" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button @click="submit" :disabled="!canSubmit || saving"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            {{ saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Producto' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { X, Package, Lock, Save, Loader2, Scale } from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import BrandSelect from '@/views/admin/super-console/components/BrandSelect.vue';
import CategoryAsyncSelect from '@/views/admin/staff/products/CategoryAsyncSelect.vue';
import ProductImageUpload from '@/views/admin/super-console/components/ProductImageUpload.vue';

interface ApprovedProduct {
  id: string;
  barcode: string;
  sku: string;
  name: string;
  brand_id: string | null;
  brand_name: string;
  category_id: string | null;
  category_name: string;
  tax_type: string;
  sale_unit: string;
  image_url: string;
  is_verified: boolean;
  created_at: string;
}

// Matches GlobalProduct.TaxType (apps/products/models.py).
const TAX_TYPE_OPTIONS = [
  { value: 'EXEMPT', label: 'Exento de IVA (E)' },
  { value: 'IVA_16', label: 'IVA General (16%)' },
  { value: 'IVA_8', label: 'IVA Reducido (8%)' },
  { value: 'REDUCIDO', label: 'Reducido / Especial' },
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

const props = defineProps<{
  visible: boolean;
  /** null = create mode ('+ Nuevo'); a product = edit mode. */
  product: ApprovedProduct | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [product: ApprovedProduct];
}>();

const { success, error: notifyError } = useNotify();

const isEdit = computed(() => !!props.product);
const requiresDecimalInput = computed(() => DECIMAL_SALE_UNITS.has(saleUnit.value));

const barcode = ref('');
const name = ref('');
const brandId = ref<string | number | null>(null);
const categoryId = ref<string | number | null>(null);
const taxType = ref('EXEMPT');
const saleUnit = ref('UNIDAD');
const imageFile = ref<File | null>(null);
const saving = ref(false);

const canSubmit = computed(() => {
  if (!name.value.trim()) return false;
  if (!isEdit.value && !barcode.value.trim()) return false;
  return true;
});

function resetForm() {
  const p = props.product;
  barcode.value = p?.barcode || '';
  name.value = p?.name || '';
  brandId.value = p?.brand_id || null;
  categoryId.value = p?.category_id || null;
  taxType.value = p?.tax_type || 'EXEMPT';
  saleUnit.value = p?.sale_unit || 'UNIDAD';
  imageFile.value = null;
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
  return e?.message || 'Error al guardar el producto';
}

async function submit() {
  if (!canSubmit.value || saving.value) return;
  saving.value = true;
  try {
    const fd = new FormData();
    fd.append('name', name.value.trim());
    fd.append('brand_id', brandId.value != null ? String(brandId.value) : '');
    fd.append('category_id', categoryId.value != null ? String(categoryId.value) : '');
    fd.append('tax_type', taxType.value);
    fd.append('sale_unit', saleUnit.value);
    if (imageFile.value) fd.append('image', imageFile.value);

    let res: ApprovedProduct;
    if (isEdit.value) {
      res = await fetchApi<ApprovedProduct>(`/api/v1/admin/global-catalog/approved/${props.product!.id}/`, {
        method: 'PATCH',
        data: fd,
      });
      success('Producto actualizado correctamente.');
    } else {
      fd.append('barcode', barcode.value.trim());
      res = await fetchApi<ApprovedProduct>('/api/v1/admin/global-catalog/approved/', {
        method: 'POST',
        data: fd,
      });
      success('Producto creado y agregado al Banco Global.');
    }

    emit('saved', res);
    emit('close');
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
    nextTick();
  }
});
</script>
