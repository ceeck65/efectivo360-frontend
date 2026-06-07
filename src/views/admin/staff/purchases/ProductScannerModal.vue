<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')" />
      <div class="relative bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="text-base font-semibold text-slate-800">{{ creatingProduct ? 'Crear Producto Rápido' : 'Buscar Producto' }}</h3>
            <p class="text-xs text-slate-500 mt-0.5">Escanear código de barras o buscar por nombre</p>
          </div>
          <button @click="$emit('close')" class="p-1 rounded-lg hover:bg-slate-100"><X class="w-4 h-4 text-slate-400" /></button>
        </div>

        <!-- Non-creating mode: search input -->
        <template v-if="!creatingProduct">
          <div class="relative mb-3">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref="searchInput"
              v-model="query"
              type="text"
              placeholder="Escanear código o buscar producto..."
              class="w-full h-10 pl-9 pr-20 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              @keydown.enter.prevent="selectOrCreate"
            />
            <div class="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <button
                @click="toggleScanner"
                class="w-8 h-8 rounded-md transition-colors flex items-center justify-center"
                :class="scanning ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'"
                :title="scanning ? 'Detener escáner' : 'Escanear con cámara'"
              >
                <ScanLine v-if="scanning" class="w-4 h-4 animate-pulse" />
                <ScanBarcode v-else class="w-4 h-4" />
              </button>
              <button @click="selectOrCreate" class="w-8 h-8 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center" title="Buscar">
                <ArrowRight class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Scanner Preview -->
          <div v-if="scanning" class="relative rounded-lg overflow-hidden border border-slate-300 bg-black mb-3">
            <div id="purchase-scanner" class="w-full h-40" />
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-40 h-20 border-2 border-blue-400/60 rounded-lg">
                <div class="w-full h-0.5 bg-blue-400/80 animate-scan-line" />
              </div>
            </div>
            <button @click="stopScanner" class="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80">
              <X class="w-3.5 h-3.5" />
            </button>
            <p class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 bg-black/60 px-2 py-0.5 rounded-full">Apunta al código de barras</p>
          </div>

          <!-- Loading -->
          <div v-if="searching" class="text-center py-8 text-slate-400"><Loader2 class="w-5 h-5 animate-spin mx-auto mb-1" /> Buscando...</div>

          <!-- Results -->
          <div v-else-if="results.length > 0" class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            <template v-for="p in results" :key="p.id">
              <button v-if="!p.blocked"
                @click="selectProduct(p)"
                class="w-full text-left px-4 py-3 hover:bg-blue-50/50 transition-colors flex items-center gap-3"
              >
                <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  <img v-if="p.image_url" :src="p.image_url" class="w-full h-full object-contain" alt="" />
                  <Package v-else class="w-5 h-5 text-slate-300" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-800 truncate">{{ p.name }}</p>
                  <p class="text-[11px] text-slate-400 font-mono">{{ p.barcode || p.sku }}</p>
                </div>
                <span class="text-[10px] text-blue-600 font-medium shrink-0">Seleccionar</span>
              </button>
              <div v-else class="flex items-start gap-3 p-4 bg-amber-50 border-t border-amber-200">
                <AlertTriangle class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold text-slate-700">⚠️ Producto no disponible</p>
                  <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    <span class="font-semibold text-slate-800">&quot;{{ p.name }}&quot;</span>
                    pertenece a
                    <span class="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 py-0.5 mx-0.5 whitespace-nowrap">
                      <span class="text-sm leading-none">{{ p.category_emoji || '📦' }}</span>
                      <span class="text-[11px] font-medium text-slate-700">{{ p.category_name || p.category }}</span>
                    </span>
                    categoría que no está activa para tu tipo de negocio.
                  </p>
                </div>
              </div>
            </template>
          </div>

          <!-- Empty + Create option -->
          <div v-else-if="query.trim().length >= 2" class="text-center py-8">
            <p class="text-sm text-slate-500 mb-3">Producto no encontrado: <strong>{{ query }}</strong></p>
            <button @click="startCreate" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">
              <Plus class="w-4 h-4" /> Crear producto rápido
            </button>
          </div>
        </template>

        <!-- Creating product mode -->
        <template v-else>
          <div class="bg-blue-50/60 border border-blue-100 text-blue-800 p-3 rounded-lg text-xs mb-4 flex items-start gap-2">
            <Info class="w-4 h-4 shrink-0 mt-0.5" />
            <span>Para mejorar la calidad del servicio, este producto será revisado por las normas comunitarias del catálogo global. Sin embargo, ya se encuentra disponible para el uso inmediato en su tienda.</span>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Código de Barras <span class="text-red-400">*</span></label>
              <div class="flex gap-1.5">
                <input v-model="newProduct.barcode" type="text" placeholder="EAN-13, UPC..."
                  class="flex-1 h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                <button
                  @click="toggleCreateScanner"
                  :class="['shrink-0 w-9 h-9 rounded-lg border transition-colors flex items-center justify-center', scanningCreate ? 'bg-blue-100 border-blue-400 text-blue-600' : 'border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50']"
                  :title="scanningCreate ? 'Detener escáner' : 'Escanear código'"
                >
                  <ScanLine v-if="scanningCreate" class="w-4 h-4 animate-pulse" />
                  <ScanBarcode v-else class="w-4 h-4" />
                </button>
              </div>
              <!-- Create scanner preview -->
              <div v-if="scanningCreate" class="relative rounded-lg overflow-hidden border border-slate-300 bg-black mt-2">
                <div id="purchase-create-scanner" class="w-full h-36" />
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div class="w-36 h-16 border-2 border-blue-400/60 rounded-lg">
                    <div class="w-full h-0.5 bg-blue-400/80 animate-scan-line" />
                  </div>
                </div>
                <button @click="stopCreateScanner" class="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"><X class="w-3 h-3" /></button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Nombre <span class="text-red-400">*</span></label>
              <input v-model="newProduct.name" type="text" placeholder="Nombre del producto"
                class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Categoría</label>
              <CategoryTreeSelect v-model="newProduct.category_id" :tree="categoryTree" placeholder="Seleccionar..." />
              <button @click="showBlueprintPopover = !showBlueprintPopover" class="mt-2 text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                <Plus class="w-3 h-3" /> Activar otros rubros
              </button>

              <!-- Blueprint popover -->
              <div v-if="showBlueprintPopover" class="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                <div v-if="loadingBlueprints" class="text-xs text-slate-400 py-2">Cargando rubros...</div>
                <label v-for="bp in blueprints" :key="bp.id" class="flex items-center gap-2 cursor-pointer py-1">
                  <input type="checkbox" :checked="bp.subscribed" @change="toggleBlueprint(bp)" class="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500/30" />
                  <span class="text-sm text-slate-700">{{ bp.name }}</span>
                  <span class="text-[10px] text-slate-400 font-mono ml-auto">{{ bp.code }}</span>
                </label>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Imagen</label>
              <div class="flex items-center gap-2">
                <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0" :class="{ 'cursor-pointer': !newProduct.image_url }" @click="!newProduct.image_url && (showImageStudio = true)">
                  <img v-if="newProduct.image_url" :src="newProduct.image_url" class="w-full h-full object-contain" alt="" />
                  <Camera v-else class="w-4 h-4 text-slate-400" />
                </div>
                <div class="flex-1 flex gap-1">
                  <input v-model="newProduct.image_url" type="text" placeholder="URL de la imagen..."
                    class="flex-1 h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                  <button @click="showImageStudio = true" class="shrink-0 w-9 h-9 rounded-lg border border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center" title="Editar imagen">
                    <ImagePlus class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p v-if="newProduct.processedBlob" class="text-[10px] text-emerald-600 mt-1">Imagen procesada lista para subir</p>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button @click="creatingProduct = false" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50">Volver</button>
            <button @click="createAndAdd" :disabled="creating || !newProduct.barcode.trim() || !newProduct.name.trim()" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center gap-2">
              <Save v-if="!creating" class="w-4 h-4" /> <Loader2 v-else class="w-4 h-4 animate-spin" />
              {{ creating ? 'Creando...' : 'Crear y Agregar' }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- Image Studio Modal -->
    <Teleport to="body">
      <div v-if="showImageStudio" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showImageStudio = false" />
        <div class="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <ProductImageStudio @processed="onStudioProcessed" @cancel="showImageStudio = false" />
        </div>
      </div>
    </Teleport>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, watch, onUnmounted } from 'vue';
import { X, Search, ArrowRight, Loader2, Plus, Package, Camera, Save, Info, ScanBarcode, ScanLine, ImagePlus, AlertTriangle } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import { usePosStore } from '@/stores/pos';
import CategoryTreeSelect from '@/views/admin/super-console/components/CategoryTreeSelect.vue';
import ProductImageStudio from '@/views/admin/super-console/components/ProductImageStudio.vue';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const props = defineProps<{ visible: boolean; categoryTree?: any[] }>();
const emit = defineEmits<{ close: []; addItem: [item: any] }>();

const { fetchApi } = useApi();
const { success, error: notifyError } = useNotify();
const posStore = usePosStore();

const query = ref('');
const results = ref<any[]>([]);
const searching = ref(false);
const creatingProduct = ref(false);
const creating = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
const scanning = ref(false);
const scannerInstance = ref<Html5Qrcode | null>(null);
const scanningCreate = ref(false);
const scannerCreateInstance = ref<Html5Qrcode | null>(null);
const showImageStudio = ref(false);
const showBlueprintPopover = ref(false);
const blueprints = ref<any[]>([]);
const loadingBlueprints = ref(false);
const blockedProduct = reactive<{ visible: boolean; productName: string; categoryName: string; categoryEmoji: string }>({
  visible: false, productName: '', categoryName: '', categoryEmoji: '',
});

const newProduct = reactive({ barcode: '', name: '', category_id: null as number | null, image_url: '', processedBlob: null as Blob | null });

watch(() => query.value, async (q) => {
  if (q.trim().length < 2) { results.value = []; searching.value = false; blockedProduct.visible = false; return; }
  searching.value = true;
  blockedProduct.visible = false;
  try {
    const res = await fetchApi<any>(`/api/global-products/?search=${encodeURIComponent(q.trim())}`);
    const items = Array.isArray(res?.results) ? res.results : [];
    const blocked = items.find((p: any) => p.blocked === true);
    if (blocked) {
      blockedProduct.productName = blocked.name;
      blockedProduct.categoryName = blocked.category_name || blocked.category || '';
      blockedProduct.categoryEmoji = blocked.category_emoji || '📦';
      blockedProduct.visible = true;
      results.value = items;
    } else {
      results.value = items;
    }
  } catch { results.value = []; }
  finally { searching.value = false; }
});

function selectOrCreate() {
  if (results.value.length === 1 && !results.value[0].blocked) selectProduct(results.value[0]);
  else if (results.value.length === 0 && query.value.trim().length >= 2) startCreate();
}

async function selectProduct(p: any) {
  if (p.blocked) return;
  blockedProduct.visible = false;
  const barcode = p.barcode || p.sku || '';
  if (barcode) {
    const result = await posStore.lookupProduct(barcode);
    if (result && 'blocked' in result && result.blocked) {
      blockedProduct.productName = result.product_name;
      blockedProduct.categoryName = result.category_name;
      blockedProduct.categoryEmoji = result.category_emoji;
      blockedProduct.visible = true;
      query.value = ''; results.value = [];
      return;
    }
  }
  emit('addItem', { id: p.id, name: p.name, barcode: p.barcode || p.sku, cost_price: 0 });
  query.value = ''; results.value = [];
  emit('close');
}

function startCreate() {
  newProduct.barcode = query.value.trim();
  newProduct.name = '';
  newProduct.category_id = null;
  newProduct.image_url = '';
  creatingProduct.value = true;
  nextTick(() => {});
}

async function createAndAdd() {
  creating.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/product-moderation/tenant-create/', {
      method: 'POST',
      data: {
        barcode: newProduct.barcode.trim(),
        name: newProduct.name.trim(),
        image_url: newProduct.image_url.trim(),
        category_code: '',
        base_attributes: {},
      },
    });
    emit('addItem', { id: res?.id, name: newProduct.name.trim(), barcode: newProduct.barcode.trim(), cost_price: 0 });
    success('Producto creado y agregado');
    creatingProduct.value = false; query.value = '';
    emit('close');
  } catch (e: any) { notifyError(e?.response?.data?.error || 'Error al crear'); }
  finally { creating.value = false; }
}

// ── Barcode Scanner ──
async function toggleScanner() { if (scanning.value) stopScanner(); else await startScanner(); }

async function startScanner() {
  scanning.value = true; await nextTick();
  try {
    const formats = [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E, Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39, Html5QrcodeSupportedFormats.QR_CODE];
    const scanner = new Html5Qrcode('purchase-scanner', { formatsToSupport: formats, verbose: false });
    scannerInstance.value = scanner;
    await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 120 }, aspectRatio: 1.5 },
      (txt) => { query.value = txt; stopScanner(); }, () => {});
  } catch (e: any) { scanning.value = false; scannerInstance.value = null; }
}

function stopScanner() {
  if (scannerInstance.value && scanning.value) {
    scannerInstance.value.stop().then(() => { scannerInstance.value?.clear(); scannerInstance.value = null; }).catch(() => {});
  }
  scanning.value = false;
}

onUnmounted(() => { if (scannerInstance.value) { if (scannerInstance.value.isScanning) scannerInstance.value.stop().catch(() => {}); scannerInstance.value = null; } });

// ── Create-product scanner ──
async function toggleCreateScanner() { if (scanningCreate.value) stopCreateScanner(); else await startCreateScanner(); }

async function startCreateScanner() {
  scanningCreate.value = true; await nextTick();
  try {
    const formats = [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E, Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39, Html5QrcodeSupportedFormats.QR_CODE];
    const scanner = new Html5Qrcode('purchase-create-scanner', { formatsToSupport: formats, verbose: false });
    scannerCreateInstance.value = scanner;
    await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 200, height: 80 }, aspectRatio: 1.5 },
      (txt) => { newProduct.barcode = txt; stopCreateScanner(); }, () => {});
  } catch { scanningCreate.value = false; scannerCreateInstance.value = null; }
}

function stopCreateScanner() {
  if (scannerCreateInstance.value && scanningCreate.value) {
    scannerCreateInstance.value.stop().then(() => { scannerCreateInstance.value?.clear(); scannerCreateInstance.value = null; }).catch(() => {});
  }
  scanningCreate.value = false;
}

function onStudioProcessed(blob: Blob, previewUrl: string) {
  newProduct.processedBlob = blob;
  newProduct.image_url = previewUrl;
  showImageStudio.value = false;
}

// ── Blueprint extensions ──
async function loadBlueprints() {
  if (blueprints.value.length > 0) return;
  loadingBlueprints.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/tenants/blueprints/available/');
    blueprints.value = Array.isArray(res) ? res : [];
  } catch { blueprints.value = []; }
  finally { loadingBlueprints.value = false; }
}

async function toggleBlueprint(bp: any) {
  try {
    await fetchApi('/api/v1/tenants/blueprints/extend/', {
      method: 'POST',
      data: { business_type_id: bp.id, subscribe: !bp.subscribed },
    });
    bp.subscribed = !bp.subscribed;
    // Reload tree
    const res = await fetchApi<any>('/api/v1/catalog/categories/?page_size=200');
    const tree = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []) as any;
    // Update the passed tree reference (trigger reactivity in parent)
    if (props.categoryTree) {
      props.categoryTree.splice(0, props.categoryTree.length, ...tree);
    }
  } catch {}
}

watch(showBlueprintPopover, (v) => { if (v) loadBlueprints(); });

watch(() => props.visible, (v) => {
  if (v) { query.value = ''; results.value = []; creatingProduct.value = false; nextTick(() => searchInput.value?.focus()); posStore.bootstrapPOS(); }
  else { stopScanner(); stopCreateScanner(); }
});
</script>

<style scoped>
@keyframes scan-line {
  0%, 100% { transform: translateY(-10px); }
  50% { transform: translateY(10px); }
}
.animate-scan-line { animation: scan-line 1.5s ease-in-out infinite; }
</style>
