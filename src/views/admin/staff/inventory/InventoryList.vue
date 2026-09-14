<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">Existencias</h2>
        <p class="text-xs text-slate-500 mt-0.5">Stock actual, tipo de control y estado de inventario</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="showScannerDrawer = true"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm">
          <Zap class="w-4 h-4" /> Entrada Rápida (Lector)
        </button>
        <button @click="$router.push('/admin/inventory/purchases/new')"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm">
          <FileText class="w-4 h-4" /> Cargar Compra / Reponer Stock
        </button>
        <button @click="$router.push('/admin/staff/products')"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
          <PackagePlus class="w-4 h-4" /> Gestionar Productos
        </button>
      </div>
    </div>

    <!-- Filter chips -->
    <div class="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Filtrar por tipo:</span>
        <button @click="filterType = ''"
          class="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
          :class="filterType === '' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
          Todos
        </button>
        <button @click="filterType = 'KARDEX'"
          class="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
          :class="filterType === 'KARDEX' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
          Kardex Transaccional
        </button>
        <button @click="filterType = 'SIMPLE'"
          class="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
          :class="filterType === 'SIMPLE' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
          Stock Simple
        </button>
        <button @click="filterType = 'NONE'"
          class="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
          :class="filterType === 'NONE' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
          Servicio / Infinito
        </button>
      </div>
      <div class="relative mt-3">
        <ProductSearchSelect v-model="search" @select="search = $event.name" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2 class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-400">Cargando productos...</span>
    </div>

    <!-- Table -->
    <div v-else class="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="w-8 px-2 py-3"></th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Producto</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">SKU</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Control</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Stock Actual</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-for="p in filteredProducts" :key="p.id">
            <tr class="hover:bg-slate-50/50 transition-colors">
              <td class="px-2 py-3 text-center">
                <button v-if="p.variants?.length" @click="toggleExpand(p.id)"
                  class="p-0.5 rounded hover:bg-slate-200 transition-colors cursor-pointer">
                  <ChevronRight v-if="!expandedRows.has(p.id)" class="w-4 h-4 text-slate-400" />
                  <ChevronDown v-else class="w-4 h-4 text-slate-600" />
                </button>
              </td>
              <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <img v-if="p.image" :src="p.image" alt="" class="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                    <div v-else class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                      <Package class="w-4 h-4 text-blue-500" />
                    </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-800 truncate max-w-[240px]">{{ p.name }}</p>
                    <p v-if="p.category" class="text-[11px] text-slate-400 truncate max-w-[240px]">{{ p.category }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <code class="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{{ p.sku }}</code>
              </td>
              <td class="px-4 py-3">
                <span v-if="p.inventory_type === 'KARDEX'"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <Activity class="w-3 h-3" /> Kardex
                </span>
                <span v-else-if="p.inventory_type === 'SIMPLE'"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <Inbox class="w-3 h-3" /> Simple
                </span>
                <span v-else
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  <Infinity class="w-3 h-3" /> Servicio
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <span v-if="p.inventory_type === 'NONE'"
                  class="text-sm text-purple-500 font-medium">&infin;</span>
                <button v-else-if="(p.current_stock ?? 0) <= 0"
                  @click="goToPurchaseEntry(p)"
                  title="Sin stock — clic para reponer vía Carga de Factura"
                  class="text-sm font-semibold text-rose-600 underline decoration-dotted decoration-rose-300 underline-offset-2 hover:text-rose-700 transition-colors">
                  {{ formatStock(p.current_stock) }}
                </button>
                <span v-else class="text-sm font-semibold text-slate-800">
                  {{ formatStock(p.current_stock) }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <div v-if="p.inventory_type === 'KARDEX' || p.inventory_type === 'SIMPLE'" class="flex items-center justify-center gap-1">
                  <button @click="goToPurchaseEntry(p)"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                    <PackagePlus class="w-3.5 h-3.5" /> Reponer
                  </button>
                  <div class="relative inline-block">
                    <button @click="toggleMenu(p.id)"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                      <MoreVertical class="w-4 h-4" />
                    </button>
                    <div v-if="openMenuId === p.id"
                      class="absolute right-0 top-full z-20 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-xs">
                      <button v-if="p.inventory_type === 'KARDEX'" @click="openAudit(p)"
                        class="flex items-center gap-2 w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50">
                        <Clock class="w-3.5 h-3.5" /> Auditoría
                      </button>
                      <button @click="openAdjustmentDrawer(p)"
                        class="flex items-center gap-2 w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50">
                        <Wrench class="w-3.5 h-3.5" /> Ajuste
                      </button>
                    </div>
                  </div>
                </div>
                <span v-else class="text-[11px] text-slate-400">—</span>
              </td>
            </tr>
            <tr v-if="expandedRows.has(p.id) && p.variants?.length" class="border-b border-slate-100">
              <td colspan="6" class="p-0">
                <table class="w-full text-xs bg-slate-50/50">
                  <thead>
                    <tr class="text-slate-400 uppercase tracking-wider text-[10px]">
                      <th class="text-left px-4 py-2 pl-12 font-semibold">Variante</th>
                      <th class="text-left px-4 py-2 font-semibold">SKU</th>
                      <th class="text-left px-4 py-2 font-semibold">Atributos</th>
                      <th class="text-right px-4 py-2 font-semibold">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="v in p.variants" :key="v.id" class="hover:bg-slate-100/50">
                      <td class="px-4 py-2 pl-12 text-slate-700 font-medium">
                        <div class="flex items-center gap-2">
                          <span class="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                          {{ v.display_name || v.sku || 'N/A' }}
                        </div>
                      </td>
                      <td class="px-4 py-2">
                        <span class="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {{ v.sku || 'N/A' }}
                        </span>
                      </td>
                      <td class="px-4 py-2">
                        <div v-if="v.formatted_attributes?.length" class="flex flex-wrap gap-1">
                          <span v-for="(attr, i) in v.formatted_attributes" :key="i"
                            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <span class="text-slate-400 mr-1 font-normal">{{ attr.name }}:</span> {{ attr.value }}
                          </span>
                        </div>
                        <span v-else class="text-slate-400">—</span>
                      </td>
                      <td class="px-4 py-2 text-right font-semibold" :class="v.stock > 0 ? 'text-slate-800' : 'text-rose-500'">
                        {{ Number(v.stock).toLocaleString('es-VE') }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            </template>
          </tbody>
        </table>
        <div v-if="filteredProducts.length === 0" class="text-center py-16 text-slate-400">
          <Package class="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p class="text-sm">No se encontraron productos</p>
        </div>
      </div>
    </div>

    <!-- Kardex Audit Drawer -->
    <KardexAuditDrawer
      :visible="auditProduct !== null"
      :product="auditProduct"
      @close="auditProduct = null"
    />

    <!-- Scanner Restock Drawer -->
    <ScannerRestockDrawer
      :visible="showScannerDrawer"
      @close="showScannerDrawer = false"
      @restocked="handleRestockSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '@/composables/useApi';
import { Package, Loader2, Activity, Inbox, Infinity, Clock, MoreVertical, PackagePlus, Wrench, ChevronRight, ChevronDown, Zap, FileText } from 'lucide-vue-next';
import KardexAuditDrawer from './KardexAuditDrawer.vue';
import ProductSearchSelect from './ProductSearchSelect.vue';
import ScannerRestockDrawer from './ScannerRestockDrawer.vue';

interface VariantStock {
  id: string;
  sku: string;
  stock: number;
  display_name?: string;
  formatted_attributes?: { name: string; value: string }[];
}

interface ProductItem {
  id: string;
  /** Product ULID (distinct from the Stock row's own `id` above) — used for restock calls. */
  product_id: string;
  name: string;
  sku: string;
  category?: string;
  inventory_type: 'KARDEX' | 'SIMPLE' | 'NONE';
  current_stock?: number;
  image?: string | null;
  variants?: VariantStock[];
}

const router = useRouter();

const search = ref('');
const filterType = ref('');
const loading = ref(true);
const products = ref<ProductItem[]>([]);
const auditProduct = ref<ProductItem | null>(null);
const openMenuId = ref<string | null>(null);
const expandedRows = ref<Set<string>>(new Set());
const showScannerDrawer = ref(false);

function toggleExpand(id: string) {
  const s = new Set(expandedRows.value);
  if (s.has(id)) s.delete(id);
  else s.add(id);
  expandedRows.value = s;
}

function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id;
}

function closeMenu(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.relative.inline-block')) {
    openMenuId.value = null;
  }
}

onMounted(() => document.addEventListener('click', closeMenu));
onBeforeUnmount(() => document.removeEventListener('click', closeMenu));

function openAudit(p: ProductItem) {
  auditProduct.value = p;
  openMenuId.value = null;
}

function openAdjustmentDrawer(p: ProductItem) {
  console.log('Adjustment for', p.name, p.id);
  openMenuId.value = null;
}

function goToPurchaseEntry(p: ProductItem) {
  openMenuId.value = null;
  router.push({
    path: '/admin/inventory/purchases/new',
    query: { product_id: p.product_id },
  });
}

function handleRestockSuccess(payload: { productId: string; newStock: number }) {
  const target = products.value.find(p => p.product_id === payload.productId);
  if (target) target.current_stock = payload.newStock;
}

function formatStock(val: number | string | undefined | null): string {
  if (val == null) return '0';
  const n = Number(val);
  if (isNaN(n)) return '0';
  return n.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Normalise a stock‑API item into a ProductItem for the table */
function normaliseStockItem(item: any): ProductItem {
  const prod = item.product ?? {};
  return {
    id: item.id,
    product_id: prod.id ?? item.id,
    name: prod.effective_name ?? prod.global_product?.official_name ?? '',
    sku: prod.effective_sku ?? prod.global_product?.sku ?? '',
    category: prod.global_product?.smart_category?.name ?? '',
    inventory_type: 'SIMPLE',
    current_stock: item.quantity ?? 0,
    image: prod.image ?? null,
    variants: item.variants || [],
  };
}

const filteredProducts = computed(() => {
  let list = products.value;
  if (filterType.value) {
    list = list.filter(p => p.inventory_type === filterType.value);
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  }
  return list;
});

onMounted(async () => {
  loading.value = true;
  try {
    const params: Record<string, string | number> = { page_size: 1000 };
    const res = await apiClient.get('/stocks/', { params });
    const data = res.data;
    const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
    products.value = items.map(normaliseStockItem);
  } catch (e) {
    console.error('Error loading stock', e);
  } finally {
    loading.value = false;
  }
});
</script>
