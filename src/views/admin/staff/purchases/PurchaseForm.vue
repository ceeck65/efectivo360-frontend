<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">Nueva Compra</h2>
        <p class="text-xs text-slate-500 mt-0.5">Registrar factura de compra al proveedor</p>
      </div>
    </div>

    <!-- Info Panel -->
    <div class="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Proveedor <span class="text-red-400">*</span></label>
          <div class="flex gap-1.5">
            <select v-model="form.supplier_id" :disabled="loadingData"
              class="flex-1 min-w-0 h-9 px-3 text-sm border rounded-lg bg-white text-slate-800 truncate focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              :class="fieldErrors.supplier ? 'border-red-400' : 'border-slate-300'"
              style="text-overflow:ellipsis; max-width:calc(100% - 2.5rem);">
              <option :value="null" class="text-slate-400">{{ loadingData ? 'Cargando...' : 'Seleccionar...' }}</option>
              <option v-for="s in suppliers" :key="s.id" :value="s.id" class="truncate">{{ s.name }} ({{ s.rif }})</option>
            </select>
            <button @click="showQuickSupplier = true" class="shrink-0 w-9 h-9 rounded-lg border border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center" title="Agregar proveedor rápido">
              <Plus class="w-4 h-4" />
            </button>
          </div>
          <p v-if="fieldErrors.supplier" class="mt-1 text-[11px] text-red-500">{{ fieldErrors.supplier }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Almacén <span class="text-red-400">*</span></label>
          <div class="flex gap-1.5">
            <select v-model="form.warehouse_id" :disabled="loadingData"
              class="flex-1 min-w-0 h-9 px-3 text-sm border rounded-lg bg-white text-slate-800 truncate focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              :class="fieldErrors.warehouse ? 'border-red-400' : 'border-slate-300'"
              style="text-overflow:ellipsis; max-width:calc(100% - 2.5rem);">
              <option :value="null" class="text-slate-400">{{ loadingData ? 'Cargando...' : 'Seleccionar...' }}</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id" class="truncate">{{ w.name }}</option>
            </select>
            <button @click="showQuickWarehouse = true" class="shrink-0 w-9 h-9 rounded-lg border border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center" title="Agregar almacén rápido">
              <Plus class="w-4 h-4" />
            </button>
          </div>
          <p v-if="fieldErrors.warehouse" class="mt-1 text-[11px] text-red-500">{{ fieldErrors.warehouse }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Nº Factura <span class="text-red-400">*</span></label>
          <input v-model="form.invoice_number" type="text" placeholder="Ej. FAC-001"
            class="w-full h-9 px-3 text-sm border rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            :class="fieldErrors.invoice_number ? 'border-red-400' : 'border-slate-300'" />
          <p v-if="fieldErrors.invoice_number" class="mt-1 text-[11px] text-red-500">{{ fieldErrors.invoice_number }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Nº Control Fiscal</label>
          <input v-model="form.control_number" type="text" placeholder="Opcional" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-700">Items de la Compra</h3>
        <div class="flex items-center gap-2">
          <button @click="showScanner = true" class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            <ScanBarcode class="w-3.5 h-3.5" /> Escanear / Buscar
          </button>
          <button @click="addItem" class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            <Plus class="w-3.5 h-3.5" /> Añadir Manual
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Producto <span class="text-red-400">*</span></th>
              <th class="text-center px-2 py-3 text-xs font-semibold text-slate-500 uppercase w-20">Empaque</th>
              <th class="text-right px-2 py-3 text-xs font-semibold text-slate-500 uppercase w-16">Cant.</th>
              <th class="text-right px-2 py-3 text-xs font-semibold text-slate-500 uppercase w-20">x Empaque</th>
              <th class="text-right px-2 py-3 text-xs font-semibold text-slate-500 uppercase w-24">$ / Empaque</th>
              <th class="text-right px-2 py-3 text-xs font-semibold text-slate-500 uppercase w-14">IVA%</th>
              <th class="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase w-24">Total</th>
              <th class="text-center px-2 py-3 w-12"><span class="sr-only">Acción</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(item, i) in form.items" :key="i" class="hover:bg-slate-50/50">
              <td class="px-3 py-2 relative">
                <input v-model="item.product_name" type="text" placeholder="Buscar producto..."
                  class="w-full h-8 px-2 text-sm border border-slate-200 rounded-md bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  @input="searchProduct(i)" @focus="activeSearchIndex = i" />
                <div v-if="activeSearchIndex === i && searchResults[i]?.length" class="absolute z-30 left-3 right-3 mt-0.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  <button v-for="p in (searchResults[i] || [])" :key="p.id" @click="selectSearchResult(i, p)" class="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 border-b border-slate-50 last:border-0">
                    <span class="flex-1 min-w-0"><span class="text-slate-800 truncate block">{{ p.name }}</span><span class="text-[10px] text-slate-400 font-mono">{{ p.barcode || p.sku }}</span></span>
                    <span class="text-[10px] text-blue-600 shrink-0">Seleccionar</span>
                  </button>
                </div>
                <div v-if="activeSearchIndex === i && searchDone[i] && !(searchResults[i]?.length) && item.product_name.trim().length >= 2" class="absolute z-30 left-3 right-3 mt-0.5 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm text-slate-500">
                  No encontrado. <button @click="showScanner = true" class="text-blue-600 hover:underline">Crear producto</button>
                </div>
                <div v-if="activeSearchIndex === i && blockedInlineProduct.visible && blockedInlineProduct.rowIndex === i"
                  class="absolute z-30 left-3 right-3 mt-0.5 bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-3">
                  <div class="flex items-start gap-2.5">
                    <AlertTriangle class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div class="min-w-0 flex-1">
                      <p class="text-[11px] text-slate-700 leading-relaxed">
                        <span class="font-semibold text-slate-800">&quot;{{ blockedInlineProduct.productName }}&quot;</span>
                        pertenece a
                        <span class="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full px-1.5 py-0.5 mx-0.5">
                          <span class="text-xs leading-none">{{ blockedInlineProduct.categoryEmoji }}</span>
                          <span class="text-[10px] font-medium text-slate-700">{{ blockedInlineProduct.categoryName }}</span>
                        </span>
                        categoría no activa.
                      </p>
                      <button @click="dismissBlockedInline" class="mt-1 text-[10px] font-medium text-slate-500 hover:text-slate-700 underline underline-offset-2">Entendido</button>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-2 py-2">
                <select v-model="item.purchase_unit" class="w-full h-8 px-1 text-xs border border-slate-200 rounded-md bg-transparent text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="UNIT">Unidad</option>
                  <option value="BOX">Caja</option>
                  <option value="BULK">Bulto</option>
                  <option value="SACK">Saco</option>
                  <option value="LOT">Lote</option>
                  <option value="KG">KG</option>
                  <option value="LITER">Litro</option>
                </select>
              </td>
              <td class="px-2 py-2">
                <input v-model.number="item.package_quantity" type="number" min="0" step="0.001" class="w-full h-8 px-1 text-xs text-right border border-slate-200 rounded-md bg-transparent text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </td>
              <td class="px-2 py-2">
                <input v-model.number="item.units_per_package" type="number" min="0.001" step="0.001" class="w-full h-8 px-1 text-xs text-right border border-slate-200 rounded-md bg-transparent text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </td>
              <td class="px-2 py-2">
                <input v-model.number="item.package_cost" type="number" min="0" step="0.01" class="w-full h-8 px-1 text-xs text-right border border-slate-200 rounded-md bg-transparent text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </td>
              <td class="px-2 py-2">
                <input v-model.number="item.tax_rate" type="number" min="0" max="100" class="w-full h-8 px-1 text-xs text-right border border-slate-200 rounded-md bg-transparent text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </td>
              <td class="px-3 py-2 text-right">
                <span class="text-sm font-medium text-slate-800">{{ formatCurrency(itemLineTotal(i)) }}</span>
                <p v-if="item.units_per_package > 0 && item.package_cost > 0" class="text-[10px] text-slate-400 leading-tight">
                  {{ formatQty(item.package_quantity * item.units_per_package) }} u · {{ formatCurrency(item.package_cost / item.units_per_package) }} c/u
                </p>
              </td>
              <td class="px-2 py-2 text-center">
                <button @click="removeItem(i)" class="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50"><X class="w-3.5 h-3.5" /></button>
              </td>
            </tr>
            <tr v-if="form.items.length === 0">
              <td colspan="8" class="px-4 py-10 text-center text-sm text-slate-400 italic">No hay items. Usa "Escanear / Buscar" o "Añadir Manual".</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex justify-end">
        <div class="w-64 space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Subtotal</span><span class="font-medium text-slate-700">{{ formatCurrency(subtotal) }}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">IVA ({{ taxRateSummary }})</span><span class="font-medium text-slate-700">{{ formatCurrency(taxAmount) }}</span></div>
          <div class="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><span class="text-slate-800">Total</span><span class="text-slate-900">{{ formatCurrency(total) }}</span></div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3">
      <button @click="saveDraft" :disabled="saving" class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-2">
        <Save class="w-4 h-4" /> Guardar Borrador
      </button>
      <button @click="processAndReceive" :disabled="saving" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors flex items-center gap-2 shadow-sm">
        <Check class="w-4 h-4" /> Procesar y Recibir
      </button>
    </div>

    <!-- Quick-Add Supplier Modal -->
    <Teleport to="body">
      <div v-if="showQuickSupplier" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showQuickSupplier = false" />
        <div class="relative bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-800">Agregar Proveedor</h3>
            <button @click="showQuickSupplier = false" class="p-1 rounded-lg hover:bg-slate-100"><X class="w-4 h-4 text-slate-400" /></button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">RIF <span class="text-red-400">*</span></label>
              <RifInput v-model="quickForm.rif" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Razón Social <span class="text-red-400">*</span></label>
              <input v-model="quickForm.name" type="text" placeholder="Nombre del proveedor" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Persona de Contacto</label>
              <input v-model="quickForm.contact_person" type="text" placeholder="Vendedor o encargado" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
              <PhoneInput v-model="quickForm.phone" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input v-model="quickForm.email" type="email" placeholder="correo@..." class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button @click="showQuickSupplier = false" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50">Cancelar</button>
            <button @click="createQuickSupplier" :disabled="quickSaving || !quickForm.rif.trim() || !quickForm.name.trim()" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center gap-2">
              <Save v-if="!quickSaving" class="w-4 h-4" /> <Loader2 v-else class="w-4 h-4 animate-spin" />
              {{ quickSaving ? 'Agregando...' : 'Agregar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Quick-Add Warehouse Modal -->
    <Teleport to="body">
      <div v-if="showQuickWarehouse" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showQuickWarehouse = false" />
        <div class="relative bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-800">Agregar Almacén</h3>
            <button @click="showQuickWarehouse = false" class="p-1 rounded-lg hover:bg-slate-100"><X class="w-4 h-4 text-slate-400" /></button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Nombre <span class="text-red-400">*</span></label>
              <input v-model="whForm.name" type="text" placeholder="Ej. Almacén Principal" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Código <span class="text-red-400">*</span></label>
              <input v-model="whForm.code" type="text" placeholder="Ej. MAIN" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Dirección</label>
              <textarea v-model="whForm.address" placeholder="Opcional" rows="2" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button @click="showQuickWarehouse = false" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50">Cancelar</button>
            <button @click="createQuickWarehouse" :disabled="whSaving || !whForm.name.trim() || !whForm.code.trim()" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center gap-2">
              <Save v-if="!whSaving" class="w-4 h-4" /> <Loader2 v-else class="w-4 h-4 animate-spin" />
              {{ whSaving ? 'Agregando...' : 'Agregar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <ProductScannerModal
      :visible="showScanner"
      :categoryTree="categoryTree"
      @close="showScanner = false"
      @addItem="onScanAdd"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { Plus, X, Save, Check, ScanBarcode, AlertTriangle } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import RifInput from '@/components/shared/RifInput.vue';
import PhoneInput from '@/components/shared/PhoneInput.vue';
import ProductScannerModal from './ProductScannerModal.vue';

interface PurchaseItem { product_name: string; purchase_unit: string; package_quantity: number; units_per_package: number; package_cost: number; tax_rate: number; }

const { fetchApi } = useApi();
const { success, error: notifyError } = useNotify();
const saving = ref(false);
const loadingData = ref(true);
const showQuickSupplier = ref(false);
const showQuickWarehouse = ref(false);
const showScanner = ref(false);
const quickSaving = ref(false);
const whSaving = ref(false);
const quickForm = reactive({ rif: '', name: '', contact_person: '', phone: '', email: '' });
const whForm = reactive({ name: '', code: '', address: '' });
const suppliers = ref<any[]>([]);
const warehouses = ref<any[]>([]);
const categoryTree = ref<any[]>([]);

const form = reactive({
  supplier_id: null as string | null,
  warehouse_id: null as string | null,
  invoice_number: '',
  control_number: '',
  items: [] as PurchaseItem[],
});

const fieldErrors = reactive<Record<string, string>>({});
function clearFieldErrors() { Object.keys(fieldErrors).forEach(k => delete fieldErrors[k]); }

async function loadData() {
  loadingData.value = true;
  try {
    const [supRes, whRes, catTreeRes] = await Promise.all([
      fetchApi<any>('/api/v1/purchases/suppliers/?page_size=200'),
      fetchApi<any>('/api/v1/inventory/warehouses/?page_size=200'),
      fetchApi<any>('/api/v1/catalog/categories/?page_size=200'),
    ]);
    suppliers.value = Array.isArray(supRes?.results) ? supRes.results : (Array.isArray(supRes) ? supRes : []);
    warehouses.value = Array.isArray(whRes?.results) ? whRes.results : (Array.isArray(whRes) ? whRes : []);
    categoryTree.value = Array.isArray(catTreeRes?.results) ? catTreeRes.results : (Array.isArray(catTreeRes) ? catTreeRes : []);
    // Pre-select MAIN warehouse, or first available
    const main = warehouses.value.find((w: any) => w.code === 'MAIN');
    if (main) form.warehouse_id = main.id;
    else if (warehouses.value.length > 0) form.warehouse_id = warehouses.value[0].id;
  } catch { suppliers.value = []; warehouses.value = []; }
  finally { loadingData.value = false; }
}

function addItem() { form.items.push({ product_name: '', purchase_unit: 'UNIT', package_quantity: 1, units_per_package: 1, package_cost: 0, tax_rate: 16 }); }

const blockedInlineProduct = reactive<{ visible: boolean; productName: string; categoryName: string; categoryEmoji: string; rowIndex: number }>({
  visible: false, productName: '', categoryName: '', categoryEmoji: '', rowIndex: -1,
});

function dismissBlockedInline() { blockedInlineProduct.visible = false; blockedInlineProduct.rowIndex = -1; }

const categoryCodeMap = computed(() => {
  const map = new Map<string, { name: string; icon: string }>();
  function walk(nodes: any[]) {
    for (const n of nodes) {
      if (n.code) map.set(n.code, { name: n.name, icon: n.icon || '' });
      if (n.children?.length) walk(n.children);
    }
  }
  walk(categoryTree.value);
  return map;
});

function itemLineTotal(i: number): number {
  const item = form.items[i];
  if (!item) return 0;
  const qty = item.package_quantity || 0;
  const cost = item.package_cost || 0;
  const subtotal = qty * cost;
  const tax = subtotal * ((item.tax_rate || 0) / 100);
  return subtotal + tax;
}

function selectSearchResult(i: number, p: any) {
  dismissBlockedInline();
  if (p.category) {
    const entry = categoryCodeMap.value.get(p.category);
    if (!entry) {
      blockedInlineProduct.productName = p.name;
      blockedInlineProduct.categoryName = p.category;
      blockedInlineProduct.categoryEmoji = '📦';
      blockedInlineProduct.rowIndex = i;
      blockedInlineProduct.visible = true;
      searchResults[i] = [];
      activeSearchIndex.value = -1;
      searchDone[i] = false;
      return;
    }
  }
  form.items[i].product_name = p.name;
  form.items[i].units_per_package = p.default_units_per_package || 1;
  form.items[i].purchase_unit = p.default_purchase_unit || 'UNIT';
  searchResults[i] = [];
  activeSearchIndex.value = -1;
  searchDone[i] = false;
}

function formatQty(v: number): string {
  return (v || 0).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function onScanAdd(item: any) {
  form.items.push({ product_name: item.name || item.barcode, purchase_unit: 'UNIT', package_quantity: 1, units_per_package: 1, package_cost: item.cost_price || 0, tax_rate: 16 });
}

// ── Inline product search per row ──
const activeSearchIndex = ref(-1);
const searchResults = reactive<Record<number, any[]>>({});
const searchDone = reactive<Record<number, boolean>>({});
const searchTimers: Record<number, ReturnType<typeof setTimeout>> = {};

function searchProduct(i: number) {
  if (searchTimers[i]) clearTimeout(searchTimers[i]);
  searchTimers[i] = setTimeout(async () => {
    const q = form.items[i]?.product_name?.trim() || '';
    if (q.length < 2) { searchResults[i] = []; searchDone[i] = false; return; }
    try {
      const res = await fetchApi<any>(`/api/global-products/?search=${encodeURIComponent(q)}`);
      searchResults[i] = Array.isArray(res?.results) ? res.results.slice(0, 5) : [];
    } catch { searchResults[i] = []; }
    searchDone[i] = true;
  }, 300);
}

function removeItem(i: number) { form.items.splice(i, 1); }

const subtotal = computed(() => form.items.reduce((s, _, i) => {
  const it = form.items[i];
  if (!it) return s;
  return s + ((it.package_quantity || 0) * (it.package_cost || 0));
}, 0));

const taxRates = computed(() => {
  const m = new Map<number, number>();
  for (const item of form.items) {
    const rate = item.tax_rate || 0;
    const base = (item.package_quantity || 0) * (item.package_cost || 0);
    m.set(rate, (m.get(rate) || 0) + base);
  }
  return m;
});

const taxAmount = computed(() => {
  let t = 0;
  for (const [rate, base] of taxRates.value) t += base * (rate / 100);
  return t;
});

const total = computed(() => subtotal.value + taxAmount.value);

const taxRateSummary = computed(() => {
  const parts: string[] = [];
  for (const [rate] of taxRates.value) parts.push(`${rate}%`);
  return parts.join(', ') || '0%';
});

function formatCurrency(v: number): string {
  return v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function saveDraft() { await submitPurchase('DRAFT'); }
async function processAndReceive() { await submitPurchase('RECEIVED'); }

async function submitPurchase(status: string) {
  saving.value = true;
  clearFieldErrors();
  try {
    const payload = {
      supplier_id: form.supplier_id,
      warehouse_id: form.warehouse_id,
      invoice_number: form.invoice_number,
      control_number: form.control_number,
      items: form.items.map(it => ({
        product_name: it.product_name, purchase_unit: it.purchase_unit,
        package_quantity: it.package_quantity, units_per_package: it.units_per_package,
        package_cost: it.package_cost, tax_rate: it.tax_rate,
        total: itemLineTotal(form.items.indexOf(it)),
      })),
      subtotal: subtotal.value, tax_amount: taxAmount.value, total: total.value,
      status,
    };
    await fetchApi('/api/v1/purchases/', { method: 'POST', data: payload });
    success(status === 'DRAFT' ? 'Borrador guardado' : 'Compra procesada y recibida exitosamente');
    clearFieldErrors();
    form.items = []; form.invoice_number = ''; form.control_number = '';
  } catch (e: any) {
    const data = e?.data || e?.response?.data || {};
    if (typeof data === 'object' && !Array.isArray(data)) {
      clearFieldErrors();
      let hasFieldErrors = false;
      // Map backend field names to frontend form fields to skip stale errors
      const fieldValueMap: Record<string, () => any> = {
        supplier: () => form.supplier_id,
        warehouse: () => form.warehouse_id,
        invoice_number: () => form.invoice_number,
      };
      for (const [key, msgs] of Object.entries(data)) {
        if (Array.isArray(msgs) && msgs.length > 0) {
          const getValue = fieldValueMap[key];
          if (getValue) {
            const val = getValue();
            if (val !== null && val !== undefined && val !== '') {
              continue;
            }
          }
          fieldErrors[key] = msgs[0];
          hasFieldErrors = true;
        }
      }
      if (!hasFieldErrors) {
        notifyError(data?.error || data?.detail || e?.message || 'Error al guardar');
      }
    } else {
      notifyError(e?.message || 'Error al guardar');
    }
  } finally { saving.value = false; }
}

async function createQuickSupplier() {
  quickSaving.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/purchases/suppliers/', {
      method: 'POST',
      data: {
        rif: quickForm.rif.trim(),
        name: quickForm.name.trim(),
        contact_person: quickForm.contact_person.trim(),
        phone: quickForm.phone.trim(),
        email: quickForm.email.trim(),
      },
    });
    suppliers.value.push(res);
    form.supplier_id = res.id;
    quickForm.rif = ''; quickForm.name = ''; quickForm.contact_person = ''; quickForm.phone = ''; quickForm.email = '';
    showQuickSupplier.value = false;
    success('Proveedor agregado');
  } catch (e: any) { notifyError(e?.response?.data?.detail || 'Error'); }
  finally { quickSaving.value = false; }
}

async function createQuickWarehouse() {
  whSaving.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/inventory/warehouses/', {
      method: 'POST',
      data: {
        name: whForm.name.trim(),
        code: whForm.code.trim().toUpperCase(),
        address: whForm.address.trim(),
      },
    });
    warehouses.value.push(res);
    form.warehouse_id = res.id;
    whForm.name = ''; whForm.code = ''; whForm.address = '';
    showQuickWarehouse.value = false;
    success('Almacén agregado');
  } catch (e: any) { notifyError(e?.response?.data?.detail || 'Error'); }
  finally { whSaving.value = false; }
}

onMounted(loadData);

// Clear individual field errors on change (supplier_id → supplier mapping)
watch(() => form.supplier_id, () => { delete fieldErrors['supplier']; delete fieldErrors['supplier_id']; }, { immediate: true });
watch(() => form.warehouse_id, () => { delete fieldErrors['warehouse']; delete fieldErrors['warehouse_id']; }, { immediate: true });
watch(() => form.invoice_number, () => { delete fieldErrors['invoice_number']; }, { immediate: true });
</script>
