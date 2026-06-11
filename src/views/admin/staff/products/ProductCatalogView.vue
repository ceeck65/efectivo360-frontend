<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">Productos</h2>
        <p class="text-xs text-slate-500 mt-0.5">Catálogo de productos del comercio</p>
      </div>
      <button @click="showDrawer = true"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm">
        <Plus class="w-4 h-4" /> Nuevo Producto
      </button>
    </div>

    <!-- Create Drawer -->
    <ProductCreateDrawer
      :visible="showDrawer"
      @close="showDrawer = false"
      @product-created="onProductCreated"
    />

    <!-- Search + Filter -->
    <div class="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="relative sm:col-span-2">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input v-model="search" type="text" placeholder="Buscar por nombre, SKU o código de barras..."
            class="w-full h-10 pl-10 pr-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <select v-model="filterStatus"
            class="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
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
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Producto</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">SKU</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Categoría</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Precio USD</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Precio VES</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Margen</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Tipo</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden xl:table-cell">Sugerido</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Método</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-20">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="p in filteredProducts" :key="p.id"
              @click="navigateToEdit(p)"
              class="hover:bg-slate-50/50 transition-colors cursor-pointer">
              <td class="px-4 py-3">
                <span class="text-slate-800 font-medium">{{ p.name }}</span>
                <p v-if="p.barcode" class="text-[10px] text-slate-400 font-mono mt-0.5">{{ p.barcode }}</p>
              </td>
              <td class="px-4 py-3 text-slate-600 font-mono text-xs">{{ p.sku }}</td>
              <td class="px-4 py-3 hidden md:table-cell"><span class="text-xs text-slate-500">{{ p.category || '—' }}</span></td>

              <!-- PRECIO USD -->
              <td class="px-4 py-3 text-right" @click.stop="startEdit(p, 'price_usd')">
                <input v-if="editingKey === p.id + '-price_usd'"
                  v-model.number="editBuffer"
                  type="number" step="0.01" min="0"
                  class="w-24 text-right text-sm font-mono border border-blue-400 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  @blur="commitEdit(p, 'price_usd')" @keydown.enter="commitEdit(p, 'price_usd')" @keydown.escape="cancelEdit"
                  ref="editRef" />
                <span v-else class="font-mono text-slate-700 cursor-pointer hover:bg-blue-50 px-1.5 py-0.5 -mx-1.5 rounded"
                  :class="{'ring-1 ring-blue-300 bg-blue-50': dirtyKeys.has(p.id + '-price_usd')}">
                  ${{ displayNum(p, 'price_usd') }}
                </span>
              </td>

              <!-- PRECIO VES -->
              <td class="px-4 py-3 text-right hidden lg:table-cell" @click.stop="startEdit(p, 'price_ves')">
                <input v-if="editingKey === p.id + '-price_ves'"
                  v-model.number="editBuffer"
                  type="number" step="0.01" min="0"
                  class="w-28 text-right text-sm font-mono border border-blue-400 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  @blur="commitEdit(p, 'price_ves')" @keydown.enter="commitEdit(p, 'price_ves')" @keydown.escape="cancelEdit"
                  autofocus />
                <span v-else class="font-mono text-slate-700 cursor-pointer hover:bg-blue-50 px-1.5 py-0.5 -mx-1.5 rounded"
                  :class="{'ring-1 ring-blue-300 bg-blue-50': dirtyKeys.has(p.id + '-price_ves')}">
                  Bs. {{ displayNum(p, 'price_ves') }}
                </span>
              </td>

              <!-- MARGEN % -->
              <td class="px-4 py-3 text-right hidden lg:table-cell" @click.stop="startEdit(p, 'profit_margin')">
                <input v-if="editingKey === p.id + '-profit_margin'"
                  v-model.number="editBuffer"
                  type="number" step="0.5" min="0" max="100"
                  class="w-20 text-right text-sm font-mono border border-blue-400 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  @blur="commitEdit(p, 'profit_margin')" @keydown.enter="commitEdit(p, 'profit_margin')" @keydown.escape="cancelEdit"
                  autofocus />
                <span v-else class="font-mono text-slate-700 cursor-pointer hover:bg-blue-50 px-1.5 py-0.5 -mx-1.5 rounded"
                  :class="{'ring-1 ring-blue-300 bg-blue-50': dirtyKeys.has(p.id + '-profit_margin')}">
                  {{ displayNum(p, 'profit_margin') }}%
                </span>
              </td>

              <!-- MARGIN TYPE -->
              <td class="px-4 py-3 text-center hidden lg:table-cell" @click.stop>
                <button v-if="editingKey === p.id + '-margin_type'"
                  @click="commitEdit(p, 'margin_type')"
                  class="text-[10px] font-semibold px-2 py-1 rounded-full border transition-colors"
                  :class="val(p, 'margin_type') === 'FINANCIAL'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-amber-50 border-amber-300 text-amber-700'">
                  {{ val(p, 'margin_type') === 'FINANCIAL' ? 'Financiero' : 'Tradicional' }} ✓
                </button>
                <button v-else
                  @click.stop="toggleMarginType(p)"
                  class="text-[10px] font-semibold px-2 py-1 rounded-full border transition-colors cursor-pointer"
                  :class="val(p, 'margin_type') === 'FINANCIAL'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'">
                  {{ val(p, 'margin_type') === 'FINANCIAL' ? '🛡️ Financiero' : '➕ Tradicional' }}
                </button>
              </td>

              <!-- SUGERIDO (cálculo en vivo) -->
              <td class="px-4 py-3 text-right hidden xl:table-cell">
                <span class="font-mono text-xs"
                  :class="suggestedDiff(p) > 0 ? 'text-emerald-600' : suggestedDiff(p) < 0 ? 'text-red-500' : 'text-slate-400'">
                  ${{ liveSuggested(p) }}
                </span>
              </td>

              <td class="px-4 py-3 text-center" @click.stop="startEdit(p, 'inventory_method')">
                <select v-if="editingKey === p.id + '-inventory_method'"
                  v-model="editBuffer"
                  class="text-xs border border-blue-400 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  @change="commitEdit(p, 'inventory_method')" @blur="commitEdit(p, 'inventory_method')" autofocus>
                  <option value="FIFO">FIFO</option>
                  <option value="LIFO">LIFO</option>
                  <option value="AVERAGE">Promedio</option>
                </select>
                <span v-else class="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full cursor-pointer"
                  :class="methodBadge(val(p, 'inventory_method'))">
                  {{ methodLabel(val(p, 'inventory_method')) }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <button @click.stop="toggleActive(p)"
                  class="inline-flex items-center gap-1 text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity px-2 py-1 rounded"
                  :class="val(p, 'is_active') ? 'text-emerald-700 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'">
                  <span class="w-1.5 h-1.5 rounded-full" :class="val(p, 'is_active') ? 'bg-emerald-500' : 'bg-slate-300'" />
                  {{ val(p, 'is_active') ? 'Activo' : 'Inactivo' }}
                </button>
              </td>
            </tr>
            <tr v-if="filteredProducts.length === 0">
              <td colspan="10" class="px-4 py-14 text-center">
                <Package class="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p class="text-sm text-slate-400">No hay productos</p>
                <button @click="showDrawer = true"
                  class="text-xs text-blue-600 hover:underline mt-1 inline-block cursor-pointer">Crear primer producto</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Save bar -->
    <Transition name="fade">
      <div v-if="dirtyCount > 0"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-white border border-slate-200 shadow-lg rounded-xl px-5 py-3">
        <span class="text-sm text-slate-600">{{ dirtyCount }} cambio{{ dirtyCount !== 1 ? 's' : '' }} pendiente{{ dirtyCount !== 1 ? 's' : '' }}</span>
        <button @click="saveChanges"
          :disabled="saving"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm">
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          Guardar cambios
        </button>
        <button @click="discardChanges"
          class="text-sm text-slate-400 hover:text-slate-600 transition-colors">Descartar</button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Search, Package, Loader2, Save } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import ProductCreateDrawer from './ProductCreateDrawer.vue';

interface CatalogProduct {
  id: string; name: string; sku: string; barcode: string | null;
  category: string; price_usd: number; price_ves: number;
  cost_price_usd: number; profit_margin: number; margin_type: string;
  inventory_method: string; is_active: boolean;
  status: string; global_product_id: string | null;
}

const router = useRouter();
const { fetchApi } = useApi();
const showDrawer = ref(false);
const loading = ref(true);
const products = ref<CatalogProduct[]>([]);
const search = ref('');
const filterStatus = ref('');

// Inline editing state
const editingKey = ref<string | null>(null);
const editBuffer = ref<any>(null);
const dirty = ref<Map<string, Record<string, any>>>(new Map());
const saving = ref(false);
const editRef = ref<HTMLInputElement | null>(null);

// ── Computed ──

const dirtyCount = computed(() => dirty.value.size);

const dirtyKeys = computed(() => {
  const s = new Set<string>();
  for (const [id, changes] of dirty.value) {
    for (const key of Object.keys(changes)) {
      s.add(id + '-' + key);
    }
  }
  return s;
});

const filteredProducts = computed(() => {
  let list = products.value;
  const q = search.value.trim().toLowerCase();
  if (q) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }
  if (filterStatus.value === 'active') list = list.filter(p => val(p, 'is_active'));
  else if (filterStatus.value === 'inactive') list = list.filter(p => !val(p, 'is_active'));
  return list;
});

// ── Live price suggestion ──

function liveSuggested(p: CatalogProduct): string {
  const cost = val(p, 'cost_price_usd') || 0;
  const margin = val(p, 'profit_margin') || 0;
  const mtype = val(p, 'margin_type');
  const price = cost > 0 && margin > 0
    ? (mtype === 'FINANCIAL'
        ? cost / (1 - margin / 100)
        : cost * (1 + margin / 100))
    : 0;
  return price.toFixed(2);
}

function suggestedDiff(p: CatalogProduct): number {
  const suggested = Number(liveSuggested(p));
  const current = val(p, 'price_usd') || 0;
  return current > 0 ? suggested - current : 0;
}

// ── Data accessors (respect dirty) ──

function val(p: CatalogProduct, field: string): any {
  const changes = dirty.value.get(p.id);
  if (changes && changes[field] !== undefined) return changes[field];
  return (p as any)[field];
}

function displayNum(p: CatalogProduct, field: string): string {
  const v = val(p, field) || 0;
  return Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Inline editing ──

function startEdit(p: CatalogProduct, field: string) {
  editBuffer.value = val(p, field);
  editingKey.value = p.id + '-' + field;
  nextTick(() => {
    (document.querySelector('input[autofocus], select[autofocus]') as HTMLElement | null)?.focus();
  });
}

function commitEdit(p: CatalogProduct, field: string) {
  const newVal = (field === 'margin_type')
    ? (val(p, 'margin_type') === 'FINANCIAL' ? 'TRADITIONAL' : 'FINANCIAL')
    : editBuffer.value;
  if (newVal === undefined) { cancelEdit(); return; }

  const existing = dirty.value.get(p.id) ?? {};
  const oldVal = existing[field] !== undefined ? existing[field] : (p as any)[field];

  if (newVal === oldVal) {
    const rest = { ...existing };
    delete (rest as any)[field];
    if (Object.keys(rest).length) dirty.value.set(p.id, rest);
    else dirty.value.delete(p.id);
  } else {
    dirty.value.set(p.id, { ...existing, [field]: newVal });
  }
  editingKey.value = null;
  editBuffer.value = null;
}

function cancelEdit() {
  editingKey.value = null;
  editBuffer.value = null;
}

function toggleMarginType(p: CatalogProduct) {
  const existing = dirty.value.get(p.id) ?? {};
  const current = (existing.margin_type !== undefined ? existing.margin_type : p.margin_type);
  dirty.value.set(p.id, { ...existing, margin_type: current === 'FINANCIAL' ? 'TRADITIONAL' : 'FINANCIAL' });
}

function toggleActive(p: CatalogProduct) {
  const existing = dirty.value.get(p.id) ?? {};
  dirty.value.set(p.id, { ...existing, is_active: !val(p, 'is_active') });
}

function methodLabel(m: string) {
  const map: Record<string, string> = { AVERAGE: 'Promedio', FIFO: 'FIFO', LIFO: 'LIFO' };
  return map[m] || m;
}

function methodBadge(m: string) {
  if (m === 'FIFO') return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (m === 'LIFO') return 'bg-violet-50 text-violet-700 border border-violet-200';
  return 'bg-sky-50 text-sky-700 border border-sky-200';
}

// ── Navigation to edit form ──

function navigateToEdit(p: CatalogProduct) {
  router.push(`/admin/staff/products/${p.id}/edit`);
}

// ── Save ──

async function saveChanges() {
  if (dirty.value.size === 0) return;
  saving.value = true;
  try {
    const payload = Array.from(dirty.value.entries()).map(([id, changes]) => ({ id, ...changes }));
    await fetchApi('/api/v1/products/bulk-update/', {
      method: 'PATCH',
      data: JSON.stringify(payload),
    });
    dirty.value = new Map();
    await loadProducts();
  } catch {
    // Keep dirty state so user can retry
  } finally {
    saving.value = false;
  }
}

function discardChanges() {
  dirty.value = new Map();
  editingKey.value = null;
  editBuffer.value = null;
}

function onProductCreated() {
  loadProducts();
}

async function loadProducts() {
  loading.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/products/?page_size=500');
    products.value = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
  } catch {
    products.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadProducts);
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
