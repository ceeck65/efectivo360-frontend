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
            <div class="relative border-2 border-dashed rounded-lg transition-colors cursor-pointer group"
              :class="imagePreview ? 'border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02]' : 'border-slate-300 dark:border-slate-600 hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:bg-cyan-50 dark:hover:bg-cyan-500/[0.03]'"
              @click="triggerFileInput" @dragover.prevent="dragOver = true" @dragleave.prevent="dragOver = false" @drop.prevent="handleDrop">
              <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelect" />
              <div v-if="imagePreview" class="relative">
                <img :src="imagePreview" class="w-full h-40 object-contain rounded-lg" alt="" />
                <button @click.stop="clearImage" class="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 dark:bg-black/70 text-white hover:bg-black/80 transition-colors"><X class="w-3.5 h-3.5" /></button>
              </div>
              <div v-else class="flex flex-col items-center gap-1.5 py-8">
                <ImagePlus class="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors" />
                <p class="text-xs text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400/80 transition-colors">Arrastra o haz clic</p>
                <p class="text-[10px] text-slate-400 dark:text-slate-600">PNG, JPEG, WebP</p>
              </div>
            </div>
            <div class="mt-2 relative">
              <input v-model="form.official_image_url" type="url" placeholder="O pega URL..."
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

            <div v-if="scanning" class="relative rounded-lg overflow-hidden border border-slate-300 dark:border-white/[0.08] bg-black">
              <div id="barcode-scanner" class="w-full h-56 sm:h-72" />
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-56 h-28 sm:w-64 sm:h-32 border-2 border-cyan-400/60 rounded-lg"><div class="w-full h-0.5 bg-cyan-400/80 animate-scan-line" /></div>
              </div>
              <button @click="stopScanner" class="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90"><X class="w-4 h-4" /></button>
              <p class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-slate-400 bg-black/60 px-3 py-1 rounded-full">Apunta al código de barras</p>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nombre <span class="text-red-400">*</span></label>
              <input v-model="form.name" type="text" placeholder="Nombre del producto" :class="inputClass(errors.name)" @input="errors.name = ''" />
              <p v-if="errors.name" class="text-[11px] text-red-500 mt-1">{{ errors.name }}</p>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Marca</label>
              <input v-model="form.brand" type="text" placeholder="Marca del producto"
                class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500/50 focus:outline-none transition-colors" />
            </div>
          </div>

          <!-- Category -->
          <div class="pt-1">
            <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Categoría Global</label>
            <div class="relative">
              <select v-model="form.global_category_id"
                class="w-full h-9 px-3 pr-8 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500/50 focus:outline-none transition-colors appearance-none cursor-pointer">
                <option :value="null" class="bg-white dark:bg-slate-800 text-slate-500">Sin categoría</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id" class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200">{{ cat.nombre || cat.name }}</option>
              </select>
              <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <!-- Attributes -->
          <div v-if="form.global_category_id && attributeFields.length > 0" class="pt-1">
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
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { X, ChevronDown, Loader2, Save, ImagePlus, Link, ScanBarcode, ScanLine } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const props = defineProps<{ visible: boolean; editProduct?: any }>();
const emit = defineEmits<{ close: []; productCreated: [payload: Record<string, any>] }>();

interface AttributeField {
  key: string; label: string; type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[]; placeholder?: string; checkbox_label?: string;
}
interface CategoryOption { id: number; nombre?: string; name?: string; }

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const categories = ref<CategoryOption[]>([]);
const attributeFields = ref<AttributeField[]>([]);
const loadingAttributes = ref(false);
const submitting = ref(false);
const dragOver = ref(false);
const imagePreview = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const scanning = ref(false);
const scannerInstance = ref<Html5Qrcode | null>(null);
const hasInitialized = ref(false);
const uploadingImage = ref(false);

const form = reactive({
  barcode: '', name: '', brand: '', official_image_url: '', description: '',
  global_category_id: null as number | null,
  base_attributes: {} as Record<string, any>,
});
const errors = reactive({ barcode: '', name: '' });

function inputClass(error: string) {
  return error
    ? 'w-full h-9 px-3 text-sm border-2 border-red-400 bg-red-50 dark:bg-red-500/[0.04] text-red-900 dark:text-red-200 placeholder-red-400 rounded-lg focus:outline-none transition-colors'
    : 'w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 placeholder-slate-400 rounded-lg focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500/50 focus:outline-none transition-colors';
}

// ── Image upload ──
function triggerFileInput() { fileInput.value?.click(); }
function handleFileSelect(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) readFile(f); }
function handleDrop(e: DragEvent) { dragOver.value = false; const f = e.dataTransfer?.files?.[0]; if (f) readFile(f); }
function readFile(file: File) {
  if (!file.type.startsWith('image/')) return;
  uploadingImage.value = true;
  const formData = new FormData();
  formData.append('image', file);
  fetchApi('/api/v1/product-moderation/upload-image/', {
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res: any) => {
    if (res?.url) {
      form.official_image_url = res.url;
      imagePreview.value = res.url;
    }
  }).catch(() => {
    // fallback: show local preview only
    const reader = new FileReader();
    reader.onload = () => { imagePreview.value = reader.result as string; };
    reader.readAsDataURL(file);
  }).finally(() => { uploadingImage.value = false; });
}
function clearImage() { imagePreview.value = null; if (fileInput.value) fileInput.value.value = ''; }

// ── Barcode Scanner ──
async function toggleScanner() { if (scanning.value) stopScanner(); else await startScanner(); }
async function startScanner() {
  scanning.value = true;
  await nextTick();
  try {
    const allFormats = [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E, Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39, Html5QrcodeSupportedFormats.CODE_93, Html5QrcodeSupportedFormats.ITF, Html5QrcodeSupportedFormats.CODABAR, Html5QrcodeSupportedFormats.QR_CODE];
    const scanner = new Html5Qrcode('barcode-scanner', { formatsToSupport: allFormats, verbose: false });
    scannerInstance.value = scanner;
    await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 280, height: 160 }, aspectRatio: 1.75, disableFlip: false },
      (decodedText, decodedResult) => {
        const formatName = decodedResult?.result?.format?.formatName || '';
        form.barcode = decodedText;
        notifySuccess(`Código escaneado${formatName ? ' (' + formatName + ')' : ''}: ${decodedText}`);
        stopScanner();
      }, () => {});
  } catch (e: any) {
    notifyError(e?.message || 'No se pudo acceder a la cámara');
    scanning.value = false;
    scannerInstance.value = null;
  }
}
function stopScanner() {
  if (scannerInstance.value && scanning.value) {
    scannerInstance.value.stop().then(() => { scannerInstance.value?.clear(); scannerInstance.value = null; }).catch(() => {});
  }
  scanning.value = false;
}
onUnmounted(() => { if (scannerInstance.value) { if (scannerInstance.value.isScanning) scannerInstance.value.stop().catch(() => {}); scannerInstance.value = null; } });

// ── Categories ──
async function loadCategories() {
  try {
    const data = await fetchApi<any>('/api/v1/categories/?is_active=true');
    categories.value = Array.isArray(data?.results || data) ? (data?.results || data) : [];
  } catch { categories.value = []; }
}

// ── Dynamic attributes ──
async function fetchCategoryAttributes(categoryId: number) {
  loadingAttributes.value = true;
  form.base_attributes = {};
  attributeFields.value = [];
  try {
    const data = await fetchApi<any>(`/api/v1/categories/${categoryId}/dynamic-attributes/`);
    const suggested: string[] = data?.suggested_attributes || [];
    const blueprint: any[] = data?.blueprint_attributes || [];
    if (blueprint.length > 0) {
      attributeFields.value = blueprint.map((a: any) => ({ key: a.key || a.name || '', label: a.label || a.name || a.key || '', type: a.type || 'text', options: a.options || [], placeholder: a.placeholder || '', checkbox_label: a.checkbox_label || 'Sí' }));
    } else if (suggested.length > 0) {
      attributeFields.value = suggested.map((key: string) => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1), type: 'text' as const }));
    }
    for (const attr of attributeFields.value) { form.base_attributes[attr.key] = attr.type === 'boolean' ? false : ''; }
  } catch { attributeFields.value = []; }
  finally { loadingAttributes.value = false; }
}

watch(() => form.global_category_id, (newId) => { if (newId) fetchCategoryAttributes(newId); else { form.base_attributes = {}; attributeFields.value = []; } });

// ── Validation ──
function validate(): boolean {
  let valid = true;
  errors.barcode = ''; errors.name = '';
  if (!form.barcode.trim()) { errors.barcode = 'El barcode es obligatorio'; valid = false; }
  if (!form.name.trim()) { errors.name = 'El nombre es obligatorio'; valid = false; }
  return valid;
}

// ── Submit ──
const isEditing = computed(() => !!props.editProduct);

watch(() => props.editProduct, (product) => {
  if (product) {
    form.barcode = product.barcode || '';
    form.name = product.name || '';
    form.brand = product.brand || '';
    form.official_image_url = product.official_image_url || product.image_url || '';
    form.description = product.description || '';
    form.global_category_id = product.global_category || null;
    imagePreview.value = product.official_image_url || product.image_url || null;
  }
}, { immediate: true });

async function handleSubmit() {
  if (!validate()) return;
  submitting.value = true;
  try {
    if (isEditing.value) {
      await fetchApi(`/api/global-products/${props.editProduct.id}/`, {
        method: 'PATCH',
        data: {
          name: form.name.trim(),
          brand: form.brand.trim(),
          description: form.description.trim(),
          official_image_url: form.official_image_url.trim(),
        },
      });
      notifySuccess('Producto actualizado exitosamente');
    } else {
      await fetchApi('/api/v1/product-moderation/staff-create/', {
        method: 'POST',
        data: { barcode: form.barcode.trim(), name: form.name.trim(), brand: form.brand.trim(), image_url: form.official_image_url.trim(), description: form.description.trim(), category_code: '', base_attributes: { ...form.base_attributes } },
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
  errors.barcode = ''; errors.name = '';
  attributeFields.value = [];
  imagePreview.value = null;
  if (fileInput.value) fileInput.value.value = '';
  if (scanning.value) stopScanner();
}

// ── Init on first open ──
watch(() => props.visible, (v) => {
  if (v) {
    if (!hasInitialized.value) {
      loadCategories();
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
@keyframes scan-line {
  0%, 100% { transform: translateY(-14px); }
  50% { transform: translateY(14px); }
}
.animate-slide-in { animation: slide-in 0.2s ease-out; }
.animate-scan-line { animation: scan-line 1.5s ease-in-out infinite; }
</style>
