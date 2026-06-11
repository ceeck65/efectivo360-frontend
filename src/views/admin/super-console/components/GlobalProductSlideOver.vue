<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[100] flex justify-end">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')" />
      <div class="relative w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/[0.06] shadow-2xl flex flex-col animate-slide-in">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/[0.06]">
          <div>
            <h2 class="text-base font-semibold text-slate-900 dark:text-white">{{ isEditing ? 'Editar Producto' : 'Nuevo Producto Global' }}</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ isEditing ? 'Actualizar producto en el catálogo maestro' : 'Crear producto en el catálogo maestro' }}</p>
          </div>
          <button @click="$emit('close')" class="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          <!-- Image -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Imagen del producto</label>

            <!-- Preview or upload button -->
            <div v-if="processedImageUrl" class="relative rounded-lg overflow-hidden bg-slate-50 dark:bg-white/[0.02]">
              <img :src="processedImageUrl" class="w-full h-40 object-contain" alt="" />
              <div class="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <div class="flex gap-2">
                  <button @click="showStudio = true" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-gray-800 shadow-sm hover:bg-gray-50 transition-colors">Editar</button>
                  <button @click="clearProcessedImage" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-red-600 shadow-sm hover:bg-red-50 transition-colors">Quitar</button>
                </div>
              </div>
            </div>

            <div v-else>
              <button @click="showStudio = true" class="w-full py-8 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-cyan-400 dark:hover:border-cyan-500 bg-transparent hover:bg-cyan-50/50 dark:hover:bg-cyan-500/[0.03] transition-colors flex flex-col items-center gap-1.5">
                <Camera class="w-8 h-8 text-slate-400" />
                <p class="text-xs text-slate-500">Abrir estudio de imagen</p>
                <p class="text-[10px] text-slate-400">Recorte 1:1 · Fondo blanco · WebP</p>
              </button>
            </div>

            <div class="mt-2 relative">
              <input v-model="form.official_image_url" type="url" placeholder="O pega URL externa…"
                class="w-full h-8 pl-7 pr-3 text-xs border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-cyan-500/20 focus:border-cyan-400 transition-colors" />
              <Link class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            </div>
          </div>

          <!-- Fields -->
          <div class="space-y-3.5">
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Barcode <span class="text-red-400">*</span></label>
              <div class="flex gap-2">
                <input v-model="form.barcode" type="text" placeholder="EAN-13, UPC, etc." :class="inputClass(errors.barcode)" @input="errors.barcode = ''" class="flex-1" />
                <button type="button" @click="toggleScanner"
                  class="h-9 px-3 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5"
                  :class="scanning ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-600 dark:text-cyan-400' : 'border-slate-300 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'">
                  <ScanBarcode v-if="!scanning" class="w-4 h-4" />
                  <ScanLine v-else class="w-4 h-4 animate-pulse" />
                  <span class="hidden sm:inline">{{ scanning ? 'Escaneando...' : 'Escanear' }}</span>
                </button>
              </div>
              <p v-if="errors.barcode" class="text-[11px] text-red-500 mt-1">{{ errors.barcode }}</p>
            </div>

            <BarcodeScanner
              id="barcode-scanner"
              :scanning="scanning"
              include-qr
              include-extended
              :qrbox-width="280"
              :qrbox-height="160"
              :aspect-ratio="1.75"
              overlay-class="w-56 h-28 sm:w-64 sm:h-32"
              overlay-border="border-cyan-400/60"
              scan-line-class="bg-cyan-400/80"
              @scan="(txt: string) => { form.barcode = txt; }"
              @close="scanning = false"
              @error="(msg: string) => notifyError(msg)"
            />

            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nombre <span class="text-red-400">*</span></label>
              <input v-model="form.name" type="text" placeholder="Nombre del producto" :class="inputClass(errors.name)" @input="errors.name = ''" />
              <p v-if="errors.name" class="text-[11px] text-red-500 mt-1">{{ errors.name }}</p>
            </div>

          </div>

          <!-- Category -->
          <div class="pt-1">
            <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Categoría Global</label>
            <CategoryTreeSelect
              v-model="selectedCategoryId"
              :tree="categoryTree"
              placeholder="Buscar categoría..."
            />
          </div>

          <!-- Brand (filtered by category) -->
          <div class="pt-1">
            <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Marca</label>
            <BrandSelect
              :modelValue="form.brand"
              :endpoint="selectedCategoryId ? '/api/v1/catalog/categories/' + selectedCategoryId + '/brands/' : '/api/v1/catalog/brands/all/'"
              @update:modelValue="form.brand = $event || ''"
              @createBrand="showBrandModal = true"
            />
          </div>

          <!-- Attributes -->
          <div v-if="selectedCategoryId && attributeFields.length > 0" class="pt-1">
            <div class="flex items-center gap-2 mb-3">
              <div class="h-px flex-1 bg-slate-200 dark:bg-white/[0.06]" />
              <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Atributos</span>
              <div class="h-px flex-1 bg-slate-200 dark:bg-white/[0.06]" />
            </div>
            <div v-if="loadingAttributes" class="flex items-center gap-2 py-3 text-xs text-slate-500"><Loader2 class="w-3 h-3 animate-spin" /> Cargando atributos...</div>
            <div v-else class="space-y-3">
              <div v-for="attr in attributeFields" :key="attr.key">
                <label class="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">{{ attr.label }}</label>
                <input v-if="attr.type === 'text' || attr.type === 'number'" v-model="form.base_attributes[attr.key]" :type="attr.type" :placeholder="attr.placeholder || ''"
                  class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500/50 focus:outline-none transition-colors" />
                <div v-else-if="attr.type === 'select' && attr.options" class="relative">
                  <select v-model="form.base_attributes[attr.key]"
                    class="w-full h-9 px-3 pr-8 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500/50 focus:outline-none transition-colors appearance-none cursor-pointer">
                    <option :value="null" class="bg-white dark:bg-slate-800">Seleccionar...</option>
                    <option v-for="opt in attr.options" :key="opt" :value="opt" class="bg-white dark:bg-slate-800">{{ opt }}</option>
                  </select>
                  <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
                <label v-else-if="attr.type === 'boolean'" class="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" v-model="form.base_attributes[attr.key]" class="w-4 h-4 rounded border-slate-300 dark:border-white/[0.15] bg-slate-50 dark:bg-white/[0.04] text-cyan-500 focus:ring-cyan-500/30 focus:ring-offset-0" />
                  <span class="text-xs text-slate-700 dark:text-slate-300">{{ attr.checkbox_label || 'Sí' }}</span>
                </label>
                <input v-else v-model="form.base_attributes[attr.key]" type="text" :placeholder="attr.key"
                  class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500/50 focus:outline-none transition-colors" />
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="pt-1">
            <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
            <textarea v-model="form.description" rows="2" placeholder="Descripción opcional..."
              class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500/50 focus:outline-none transition-colors resize-none"></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-4 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.01] flex items-center gap-3">
          <button @click="$emit('close')" class="flex-1 h-10 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors">Cancelar</button>
          <button @click="handleSubmit" :disabled="submitting" class="flex-[2] h-10 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
            <Save v-if="!submitting" class="w-4 h-4" />
            <Loader2 v-else class="w-4 h-4 animate-spin" />
            {{ isEditing ? 'Guardar Cambios' : 'Guardar Producto' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ProductImageStudio Modal -->
  <Teleport to="body">
    <div v-if="showStudio" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showStudio = false" />
      <div class="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <ProductImageStudio
          @processed="onStudioProcessed"
          @cancel="showStudio = false"
        />
      </div>
    </div>
  </Teleport>

  <!-- Quick-Create Brand Modal -->
  <Teleport to="body">
    <div v-if="showBrandModal" class="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showBrandModal = false" />
      <div class="relative bg-white dark:bg-[#141824] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">Crear Nueva Marca</h3>
          <button @click="showBrandModal = false" class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
            <X class="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nombre <span class="text-red-400">*</span></label>
            <input v-model="newBrandName" type="text" placeholder="Ej. Puma"
              class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Logo</label>
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/[0.03] flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="newBrandLogo" :src="newBrandLogo" class="w-full h-full object-contain" alt="" />
                <ImagePlus v-else class="w-4 h-4 text-slate-400" />
              </div>
              <input v-model="newBrandLogo" type="text" placeholder="URL del logo..."
                class="flex-1 h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Categorías</label>
            <CategoryMultiTreeSelect
              v-model="newBrandCategoryIds"
              :tree="categoryTree"
              placeholder="Asignar categorías..."
            />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button @click="showBrandModal = false" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">Cancelar</button>
          <button @click="createBrand" :disabled="brandCreating || !newBrandName.trim()" class="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-40 transition-colors flex items-center gap-2">
            <Save v-if="!brandCreating" class="w-4 h-4" />
            <Loader2 v-else class="w-4 h-4 animate-spin" />
            {{ brandCreating ? 'Creando...' : 'Crear' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { X, ChevronDown, Loader2, Save, Link, ScanBarcode, ScanLine, Camera, ImagePlus } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import BarcodeScanner from '@/components/shared/BarcodeScanner.vue';
import ProductImageStudio from './ProductImageStudio.vue';
import BrandSelect from './BrandSelect.vue';
import CategoryTreeSelect from './CategoryTreeSelect.vue';
import CategoryMultiTreeSelect from './CategoryMultiTreeSelect.vue';

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const props = defineProps<{ visible: boolean; editProduct?: any }>();
const emit = defineEmits<{ close: []; productCreated: [payload: Record<string, any>] }>();

const isEditing = ref(false);

watch(() => props.editProduct, (product) => {
  isEditing.value = !!product;
  if (product) {
    form.barcode = product.barcode || '';
    form.name = product.name || '';
    form.brand = product.brand || '';
    form.official_image_url = product.official_image_url || product.image_url || '';
    form.description = product.description || '';
    form.global_category_id = product.global_category || null;
    processedImageUrl.value = product.official_image_url || product.image_url || null;
  }
}, { immediate: true });

const form = reactive({
  barcode: '', name: '', brand: '', official_image_url: '', description: '',
  global_category_id: null as number | null,
  base_attributes: {} as Record<string, any>,
});
const errors = reactive({ barcode: '', name: '' });
const categories = ref<{ id: number; nombre?: string; name?: string }[]>([]);
const attributeFields = ref<{ key: string; label: string; type: string; options?: string[]; placeholder?: string; checkbox_label?: string }[]>([]);
const loadingAttributes = ref(false);
const submitting = ref(false);
const scanning = ref(false);
const hasInitialized = ref(false);
const categoryTree = ref<any[]>([]);
const selectedCategoryId = ref<number | null>(null);

const selectedCategoryCode = computed(() => {
  if (!selectedCategoryId.value) return '';
  function find(nodes: any[]): string {
    for (const n of nodes) {
      if (n.id === selectedCategoryId.value) return n.code || '';
      if (n.children) {
        const found = find(n.children);
        if (found) return found;
      }
    }
    return '';
  }
  return find(categoryTree.value);
});
const showStudio = ref(false);
const processedImageBlob = ref<Blob | null>(null);
const processedImageUrl = ref<string | null>(null);
const showBrandModal = ref(false);
const newBrandName = ref('');
const newBrandLogo = ref('');
const newBrandCategoryIds = ref<number[]>([]);
const brandCreating = ref(false);

function inputClass(error: string) {
  return error
    ? 'w-full h-9 px-3 text-sm border-2 border-red-400 bg-red-50 dark:bg-red-500/[0.04] text-red-900 dark:text-red-200 placeholder-red-400 rounded-lg focus:outline-none transition-colors'
    : 'w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500/50 focus:outline-none transition-colors';
}

function toggleScanner() { scanning.value = !scanning.value; }

async function loadCategories() {
  try {
    const data = await fetchApi<any>('/api/v1/categories/?is_active=true');
    categories.value = Array.isArray(data?.results || data) ? (data?.results || data) : [];
  } catch { categories.value = []; }
}

async function loadTree() {
  try {
    const res = await fetchApi<any>('/api/v1/catalog/categories/?page_size=200');
    categoryTree.value = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
  } catch { categoryTree.value = []; }
}

async function fetchCategoryAttributes(categoryId: number) {
  loadingAttributes.value = true; form.base_attributes = {}; attributeFields.value = [];
  try {
    const data = await fetchApi<any>(`/api/v1/catalog/categories/${categoryId}/attributes/`);
    const all = Array.isArray(data) ? data : [];
    attributeFields.value = all.map((a: any) => ({
      key: a.key, label: a.name, type: a.type, options: a.options, placeholder: '', checkbox_label: 'Sí',
    }));
    for (const attr of attributeFields.value) {
      form.base_attributes[attr.key] = attr.type === 'boolean' ? false : '';
    }
  } catch { attributeFields.value = []; }
  finally { loadingAttributes.value = false; }
}

watch(() => selectedCategoryId.value, (id) => { if (id) fetchCategoryAttributes(id); else { form.base_attributes = {}; attributeFields.value = []; } });

function validate(): boolean {
  let ok = true; errors.barcode = ''; errors.name = '';
  if (!form.barcode.trim()) { errors.barcode = 'El barcode es obligatorio'; ok = false; }
  if (!form.name.trim()) { errors.name = 'El nombre es obligatorio'; ok = false; }
  return ok;
}

async function handleSubmit() {
  if (!validate()) return;
  submitting.value = true;
  try {
    // Upload processed image if available
    let imageUrl = form.official_image_url.trim();
    if (processedImageBlob.value) {
      const formData = new FormData();
      formData.append('image', processedImageBlob.value, 'product.webp');
      const uploadRes = await fetchApi<any>('/api/v1/product-moderation/upload-image/', {
        method: 'POST', data: formData, headers: { 'Content-Type': 'multipart/form-data' },
      });
      imageUrl = uploadRes?.url || imageUrl;
      processedImageBlob.value = null;
    }

    if (isEditing.value) {
      await fetchApi(`/api/global-products/${props.editProduct.id}/`, {
        method: 'PATCH',
        data: { name: form.name.trim(), brand: form.brand.trim(), description: form.description.trim(), official_image_url: imageUrl, category: selectedCategoryCode.value, base_attributes: { ...form.base_attributes } },
      });
      notifySuccess('Producto actualizado exitosamente');
    } else {
      await fetchApi('/api/v1/product-moderation/staff-create/', {
        method: 'POST',
        data: { barcode: form.barcode.trim(), name: form.name.trim(), brand: form.brand.trim(), image_url: imageUrl, description: form.description.trim(), category_code: selectedCategoryCode.value, base_attributes: { ...form.base_attributes } },
      });
      notifySuccess('Producto global creado exitosamente');
    }
    resetForm();
    emit('productCreated', { ...form });
    emit('close');
  } catch (e: any) {
    notifyError(e?.response?.data?.error || e?.message || 'Error al guardar producto');
  } finally { submitting.value = false; }
}

function resetForm() {
  form.barcode = ''; form.name = ''; form.brand = ''; form.official_image_url = '';
  form.description = ''; form.global_category_id = null; form.base_attributes = {};
  selectedCategoryId.value = null;
  errors.barcode = ''; errors.name = '';
  attributeFields.value = [];
  scanning.value = false;
  isEditing.value = false;
  processedImageBlob.value = null;
  processedImageUrl.value = null;
}

async function createBrand() {
  if (brandCreating.value || !newBrandName.value.trim()) return;
  brandCreating.value = true;
  try {
    await fetchApi('/api/v1/catalog/brands/', {
      method: 'POST',
      data: {
        name: newBrandName.value.trim(),
        logo_url: newBrandLogo.value.trim(),
        category_ids: newBrandCategoryIds.value,
      },
    });
    form.brand = newBrandName.value.trim();
    newBrandName.value = '';
    newBrandLogo.value = '';
    newBrandCategoryIds.value = [];
    showBrandModal.value = false;
    notifySuccess('Marca creada correctamente');
  } catch (e: any) {
    notifyError(e?.response?.data?.detail || e?.message || 'Error al crear marca');
  } finally { brandCreating.value = false; }
}

function clearProcessedImage() {
  processedImageBlob.value = null;
  processedImageUrl.value = null;
  form.official_image_url = '';
}

function onStudioProcessed(blob: Blob, previewUrl: string) {
  processedImageBlob.value = blob;
  processedImageUrl.value = previewUrl;
  form.official_image_url = '';
  showStudio.value = false;
}

// ── Init on first open ──
watch(() => props.visible, (v) => {
  if (v) {
    if (!hasInitialized.value) {
      loadCategories();
      loadTree();
      hasInitialized.value = true;
    }
  }
});
</script>

<style scoped>
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
