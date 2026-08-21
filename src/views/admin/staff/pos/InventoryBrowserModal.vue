<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiClient } from '@/composables/useApi';
import { X, Search, Package, Activity, Inbox, Infinity, Clock, ChevronRight, ChevronDown, Boxes, ScanLine, ScanBarcode, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-vue-next';
import KardexAuditDrawer from '@/views/admin/staff/inventory/KardexAuditDrawer.vue';
import BarcodeScanner from '@/components/shared/BarcodeScanner.vue';

const emit = defineEmits<{ close: [] }>();

interface VariantStock {
  id: string;
  sku: string;
  stock: number;
  display_name?: string;
  formatted_attributes?: { name: string; value: string }[];
}

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category?: string;
  inventory_type: 'KARDEX' | 'SIMPLE' | 'NONE';
  current_stock?: number;
  image?: string | null;
  variants?: VariantStock[];
}

const search = ref('');
const filterType = ref<'' | 'KARDEX' | 'SIMPLE' | 'NONE'>('');
const onlyOutOfStock = ref(false);
const loading = ref(true);
const products = ref<ProductItem[]>([]);
const auditProduct = ref<ProductItem | null>(null);
const expandedRows = ref<Set<string>>(new Set());

// ═══════ Lector de códigos de barras (misma cámara/lib que el buscador principal del POS) ═══════
const scanning = ref(false);
function toggleScanner() {
  scanning.value = !scanning.value;
}

// ═══════ Orden por stock disponible ═══════
type StockSort = 'none' | 'desc' | 'asc';
const stockSort = ref<StockSort>('none');
function toggleStockSort() {
  stockSort.value = stockSort.value === 'none' ? 'desc' : stockSort.value === 'desc' ? 'asc' : 'none';
}

function toggleExpand(id: string) {
  const s = new Set(expandedRows.value);
  if (s.has(id)) s.delete(id);
  else s.add(id);
  expandedRows.value = s;
}

function openAudit(p: ProductItem) {
  auditProduct.value = p;
}

function formatStock(val: number | string | undefined | null): string {
  if (val == null) return '0';
  const n = Number(val);
  if (isNaN(n)) return '0';
  return n.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Normaliza un item de /stocks/ (mismo endpoint/forma que usa InventoryList.vue). */
function normaliseStockItem(item: any): ProductItem {
  const prod = item.product ?? {};
  return {
    id: item.id,
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
    list = list.filter((p) => p.inventory_type === filterType.value);
  }
  if (onlyOutOfStock.value) {
    // Servicio/Infinito (NONE) no tiene noción de "stock": nunca cuenta como sin stock.
    list = list.filter((p) => p.inventory_type !== 'NONE' && Number(p.current_stock ?? 0) <= 0);
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }
  if (stockSort.value !== 'none') {
    list = [...list].sort((a, b) => {
      const diff = Number(a.current_stock ?? 0) - Number(b.current_stock ?? 0);
      return stockSort.value === 'desc' ? -diff : diff;
    });
  }
  return list;
});

const lowStockCount = computed(() =>
  products.value.filter((p) => p.inventory_type !== 'NONE' && Number(p.current_stock ?? 0) <= 0).length
);

onMounted(async () => {
  loading.value = true;
  try {
    const res = await apiClient.get('/stocks/', { params: { page_size: 1000 } });
    const data = res.data;
    const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
    products.value = items.map(normaliseStockItem);
  } catch (e) {
    console.error('Error loading stock', e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="fixed inset-0 z-50 bg-white flex flex-col text-slate-800">

    <!-- Header -->
    <div class="shrink-0 p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Boxes class="w-4 h-4 text-blue-600" />
        <div>
          <h2 class="text-sm font-black uppercase tracking-wider text-slate-800">Inventario</h2>
          <p class="text-[10px] text-slate-400 font-medium">
            Consulta existencias y movimientos sin salir del POS
            <button v-if="lowStockCount > 0" @click="onlyOutOfStock = true"
              class="text-rose-500 font-bold hover:underline">· {{ lowStockCount }} en cero</button>
          </p>
        </div>
      </div>
      <button @click="emit('close')" aria-label="Cerrar"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
        <X :size="20" />
      </button>
    </div>

    <!-- Buscador + filtros -->
    <div class="shrink-0 p-3 border-b border-slate-200 space-y-2.5">
      <div class="relative max-w-lg">
        <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          type="text"
          autofocus
          placeholder="Buscar por nombre, SKU o escanear código de barras…"
          class="w-full h-10 pl-9 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
        <button @click="toggleScanner"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          :class="scanning ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'"
          :title="scanning ? 'Detener escáner' : 'Escanear con cámara'">
          <ScanLine v-if="scanning" class="w-3.5 h-3.5 animate-pulse" />
          <ScanBarcode v-else class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="max-w-lg">
        <BarcodeScanner
          id="inventory-scanner"
          :scanning="scanning"
          include-qr
          :qrbox-width="280"
          :qrbox-height="120"
          :aspect-ratio="1.6"
          overlay-class="w-52 h-16"
          overlay-border="border-blue-400/50"
          scan-line-class="bg-blue-400/70"
          height-class="h-36"
          container-class="rounded-xl border-slate-200 bg-slate-900 shadow-md"
          @scan="(txt: string) => { search = txt; }"
          @close="scanning = false"
        />
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <button @click="filterType = ''"
          class="px-3 py-1.5 text-xs font-bold rounded-full border transition-colors"
          :class="filterType === '' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
          Todos
        </button>
        <button @click="filterType = 'KARDEX'"
          class="px-3 py-1.5 text-xs font-bold rounded-full border transition-colors"
          :class="filterType === 'KARDEX' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
          Kardex Transaccional
        </button>
        <button @click="filterType = 'SIMPLE'"
          class="px-3 py-1.5 text-xs font-bold rounded-full border transition-colors"
          :class="filterType === 'SIMPLE' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
          Stock Simple
        </button>
        <button @click="filterType = 'NONE'"
          class="px-3 py-1.5 text-xs font-bold rounded-full border transition-colors"
          :class="filterType === 'NONE' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
          Servicio / Infinito
        </button>
        <span class="w-px h-5 bg-slate-200 mx-0.5"></span>
        <button @click="onlyOutOfStock = !onlyOutOfStock"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition-colors"
          :class="onlyOutOfStock ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
          <AlertTriangle :size="12" /> Sin Stock
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <div v-if="loading" class="flex items-center justify-center py-16 text-slate-400 text-sm">
        Cargando inventario…
      </div>
      <template v-else>
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              <th class="w-8 px-2 py-3"></th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Producto</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">SKU</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Control</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                <button @click="toggleStockSort" title="Ordenar por stock disponible"
                  class="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                  :class="stockSort !== 'none' ? 'text-blue-600' : ''">
                  Stock Actual
                  <ArrowUp v-if="stockSort === 'asc'" :size="12" />
                  <ArrowDown v-else-if="stockSort === 'desc'" :size="12" />
                  <ArrowUpDown v-else :size="12" class="text-slate-300" />
                </button>
              </th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Auditoría</th>
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
                  <span v-if="p.inventory_type === 'NONE'" class="text-sm text-purple-500 font-medium">&infin;</span>
                  <span v-else class="text-sm font-semibold" :class="(p.current_stock ?? 0) <= 0 ? 'text-rose-600' : 'text-slate-800'">
                    {{ formatStock(p.current_stock) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <button v-if="p.inventory_type === 'KARDEX'" @click="openAudit(p)" title="Ver movimientos"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Clock class="w-4 h-4" />
                  </button>
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
      </template>
    </div>

    <!-- Kardex Audit Drawer -->
    <KardexAuditDrawer
      :visible="auditProduct !== null"
      :product="auditProduct"
      @close="auditProduct = null"
    />
  </div>
</template>
