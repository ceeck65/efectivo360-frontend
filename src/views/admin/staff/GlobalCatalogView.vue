<template>
  <div class="space-y-4 sm:space-y-6 p-4 sm:p-6">

    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          <Package class="h-7 w-7 text-cyan-500" />
          Catálogo Global
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Moderación del banco global de productos.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="showFilterSidebar = true"
          class="shrink-0 inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors relative">
          <SlidersHorizontal class="h-4 w-4" />
          Filtros
          <span v-if="activeFilterCount > 0"
            class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-500 text-white text-[9px] font-bold flex items-center justify-center">
            {{ activeFilterCount }}
          </span>
        </button>
        <button @click="showSlideOver = true; editingProduct = null"
          class="shrink-0 inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 shadow-sm transition-colors">
          <Plus class="h-4 w-4" />
          Nuevo
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-slate-200 dark:border-white/[0.06] overflow-x-auto">
      <div class="flex gap-0 min-w-max">
        <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
          class="relative px-4 sm:px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors"
          :class="activeTab === tab.key ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'">
          {{ tab.label }}
          <span v-if="tab.badge" class="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold rounded-full"
            :class="activeTab === tab.key ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600'">
            {{ tab.badge }}
          </span>
          <span v-if="activeTab === tab.key" class="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
        </button>
      </div>
    </div>

    <!-- Active filters indicator -->
    <div v-if="activeFilterCount > 0" class="flex items-center gap-2 flex-wrap">
      <span class="text-[11px] text-slate-400 font-medium">Filtros activos:</span>
      <span v-for="catId in filterState.categoryIds" :key="'c'+catId"
        class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-cyan-50 text-cyan-700 rounded-full border border-cyan-200">
        {{ getCatName(catId) }}
        <button @click="removeCategoryFilter(catId)" class="hover:text-cyan-900"><X class="w-2.5 h-2.5" /></button>
      </span>
      <span v-for="brandId in filterState.brandIds" :key="'b'+brandId"
        class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-violet-50 text-violet-700 rounded-full border border-violet-200">
        {{ getBrandName(brandId) }}
        <button @click="removeBrandFilter(brandId)" class="hover:text-violet-900"><X class="w-2.5 h-2.5" /></button>
      </span>
      <button @click="clearFilters" class="text-[10px] text-slate-400 hover:text-rose-500 font-medium ml-1">Limpiar</button>
    </div>

    <!-- ═══════ TAB: APROBADOS ═══════ -->
    <div v-if="activeTab === 'approved'">
      <!-- Search -->
      <div class="flex flex-col sm:flex-row gap-3 mb-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input v-model="approvedSearch" type="text" placeholder="Buscar por nombre, código o SKU..."
            class="w-full h-10 pl-9 pr-4 text-sm border border-slate-200 bg-white text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400" />
        </div>
      </div>

      <div v-if="loadingApproved" class="flex items-center justify-center py-16 text-slate-400">
        <Loader2 class="w-5 h-5 animate-spin mr-2" /> Cargando...
      </div>

      <template v-else>
        <!-- Table -->
        <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50/80">
                <tr>
                  <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Código</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Marca</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="paginatedApproved.length === 0">
                  <td colspan="5" class="px-4 py-12 text-center text-sm text-slate-400 italic">No hay productos aprobados</td>
                </tr>
                <tr v-for="p in paginatedApproved" :key="p.id"
                  class="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  @click="editingProduct = p; showSlideOver = true">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="relative w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden"
                        @mouseenter="hoveredImage = p.id" @mouseleave="hoveredImage = null">
                        <img v-if="getImageUrl(p)" :src="getImageUrl(p)" class="w-full h-full object-cover" alt="" />
                        <Package v-else class="w-5 h-5 text-slate-300" />
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-slate-800 truncate">{{ p.name }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ p.barcode || p.sku || '—' }}</td>
                  <td class="px-4 py-3">
                    <span v-if="p.category" class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{{ p.category }}</span>
                    <span v-else class="text-slate-300">—</span>
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-500">{{ p.brand || '—' }}</td>
                  <td class="px-4 py-3 text-right">
                    <button @click.stop="editingProduct = p; showSlideOver = true"
                      class="p-1.5 rounded-md text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors opacity-0 group-hover:opacity-100">
                      <Pencil class="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div v-if="approvedTotalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span class="text-[11px] text-slate-400">{{ filteredApproved.length }} productos</span>
            <div class="flex items-center gap-1">
              <button @click="approvedPage--" :disabled="approvedPage <= 1"
                class="px-2 py-1 text-xs rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft class="w-3.5 h-3.5" />
              </button>
              <span class="text-[11px] text-slate-500 px-2">{{ approvedPage }} / {{ approvedTotalPages }}</span>
              <button @click="approvedPage++" :disabled="approvedPage >= approvedTotalPages"
                class="px-2 py-1 text-xs rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Image preview tooltip -->
        <Teleport to="body">
          <div v-if="hoveredImage && getMediumUrl(getProductById(hoveredImage))"
            class="fixed z-[200] pointer-events-none p-1 bg-white border border-slate-200 rounded-xl shadow-2xl"
            :style="hoverStyle">
            <img :src="getMediumUrl(getProductById(hoveredImage))" class="w-48 h-48 object-contain rounded-lg" alt="" />
          </div>
        </Teleport>
      </template>
    </div>

    <!-- ═══════ TAB: PENDIENTES ═══════ -->
    <div v-if="activeTab === 'pending'">
      <GlobalProductModerationDashboard :key="refreshKey" @productCreated="onProductCreated" @productModified="onProductCreated" />
    </div>

    <!-- ═══════ TAB: RECHAZADOS ═══════ -->
    <div v-if="activeTab === 'rejected'">
      <div v-if="loadingRejected" class="flex items-center justify-center py-16 text-slate-400">
        <Loader2 class="w-5 h-5 animate-spin mr-2" /> Cargando...
      </div>
      <template v-else>
        <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50/80">
                <tr>
                  <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Código</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Razón</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="filteredRejected.length === 0">
                  <td colspan="4" class="px-4 py-12 text-center text-sm text-slate-400 italic">No hay productos rechazados</td>
                </tr>
                <tr v-for="p in filteredRejected" :key="p.id" class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img v-if="getImageUrl(p)" :src="getImageUrl(p)" class="w-full h-full object-cover" alt="" />
                        <Package v-else class="w-5 h-5 text-slate-300" />
                      </div>
                      <p class="text-sm font-medium text-slate-800 truncate">{{ p.name }}</p>
                    </div>
                  </td>
                  <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ p.barcode || p.sku || '—' }}</td>
                  <td class="px-4 py-3">
                    <span class="px-1.5 py-0.5 text-[10px] font-semibold rounded"
                      :class="p.status === 'REJECTED_BANNED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'">
                      {{ p.status === 'REJECTED_BANNED' ? 'BANEADO' : 'RECHAZADO' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">{{ p.rejection_reason || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>

    <!-- Filter Sidebar -->
    <CatalogFilterSidebar
      :visible="showFilterSidebar"
      :initial-categories="filterState.categoryIds"
      :initial-brands="filterState.brandIds"
      @close="showFilterSidebar = false"
      @update="onFilterUpdate"
    />

    <!-- SlideOver -->
    <GlobalProductSlideOver
      :visible="showSlideOver"
      :editProduct="editingProduct"
      @close="showSlideOver = false; editingProduct = null"
      @productCreated="onProductCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue';
import { Package, Plus, Search, Loader2, Pencil, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-vue-next';
import GlobalProductModerationDashboard from '@/views/admin/super-console/components/GlobalProductModerationDashboard.vue';
import GlobalProductSlideOver from '@/views/admin/super-console/components/GlobalProductSlideOver.vue';
import CatalogFilterSidebar from './components/CatalogFilterSidebar.vue';
import { useApi } from '@/composables/useApi';

const { fetchApi } = useApi();

const refreshKey = ref(0);
const showSlideOver = ref(false);
const showFilterSidebar = ref(false);
const editingProduct = ref<any>(null);
const activeTab = ref('pending');
const hoveredImage = ref<number | null>(null);
const mousePos = ref({ x: 0, y: 0 });

const approvedSearch = ref('');
const approvedProducts = ref<any[]>([]);
const loadingApproved = ref(false);
const approvedPage = ref(1);
const PAGE_SIZE = 15;

const rejectedProducts = ref<any[]>([]);
const loadingRejected = ref(false);

const pendingCount = ref(0);

const filterState = reactive<{ categoryIds: number[]; brandIds: string[] }>({ categoryIds: [], brandIds: [] });
const allCategories = ref<{ id: number; name: string; icon?: string; code?: string }[]>([]);
const categoryTree = ref<any[]>([]);
const allBrands = ref<{ id: string; name: string; smart_categories?: { id: number }[] }[]>([]);

const tabs = computed(() => [
  { key: 'approved', label: 'Aprobados', badge: null },
  { key: 'pending', label: 'Pendientes', badge: pendingCount.value },
  { key: 'rejected', label: 'Rechazados / Apelación', badge: null },
]);

const activeFilterCount = computed(() => filterState.categoryIds.length + filterState.brandIds.length);

function collectCodes(nodes: any[]): string[] {
  const codes: string[] = [];
  for (const n of nodes) {
    if (n.code) codes.push(n.code);
    if (n.children?.length) codes.push(...collectCodes(n.children));
  }
  return codes;
}

function getDescendantCodes(catId: number): string[] {
  function find(nodes: any[]): string[] | null {
    for (const n of nodes) {
      if (n.id === catId) return collectCodes([n]);
      if (n.children?.length) {
        const found = find(n.children);
        if (found) return found;
      }
    }
    return null;
  }
  return find(categoryTree.value) || [];
}

const filteredApproved = computed(() => {
  let list = approvedProducts.value;
  const q = approvedSearch.value.toLowerCase();
  if (q) list = list.filter(p => p.name?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  if (filterState.categoryIds.length) {
    const catCodes = filterState.categoryIds.flatMap(id => getDescendantCodes(id)).filter(Boolean);
    if (catCodes.length) list = list.filter(p => catCodes.includes(p.category));
  }
  if (filterState.brandIds.length) {
    const brandNames = filterState.brandIds
      .map(id => allBrands.value.find(b => String(b.id) === String(id))?.name)
      .filter(Boolean);
    if (brandNames.length) list = list.filter(p => brandNames.includes(p.brand));
  }
  return list;
});

const approvedTotalPages = computed(() => Math.max(1, Math.ceil(filteredApproved.value.length / PAGE_SIZE)));

const paginatedApproved = computed(() => {
  const start = (approvedPage.value - 1) * PAGE_SIZE;
  return filteredApproved.value.slice(start, start + PAGE_SIZE);
});

const filteredRejected = computed(() => {
  let list = rejectedProducts.value;
  if (filterState.categoryIds.length) {
    const catCodes = filterState.categoryIds.flatMap(id => getDescendantCodes(id)).filter(Boolean);
    if (catCodes.length) list = list.filter(p => catCodes.includes(p.category));
  }
  if (filterState.brandIds.length) {
    const brandNames = filterState.brandIds
      .map(id => allBrands.value.find(b => String(b.id) === String(id))?.name)
      .filter(Boolean);
    if (brandNames.length) list = list.filter(p => brandNames.includes(p.brand));
  }
  return list;
});

const hoverStyle = computed(() => ({
  left: `${mousePos.value.x + 16}px`,
  top: `${mousePos.value.y - 100}px`,
}));

function getImageUrl(p: any): string {
  const url = p.image_url || p.official_image_url || p.thumbnail_url;
  return url ? absUrl(url) : '';
}

function getMediumUrl(p: any): string {
  if (!p) return '';
  const url = p.image_url_medium || p.image_url || p.official_image_url;
  return url ? absUrl(url) : '';
}

function getProductById(id: number): any {
  return approvedProducts.value.find(p => p.id === id);
}

function absUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return window.location.origin + url;
  return url;
}

function onFilterUpdate(filters: { categoryIds: number[]; brandIds: string[] }) {
  filterState.categoryIds = filters.categoryIds;
  filterState.brandIds = filters.brandIds;
  approvedPage.value = 1;
}

function getCatName(id: number): string {
  return allCategories.value.find(c => c.id === id)?.name || String(id);
}

function getBrandName(id: string): string {
  return allBrands.value.find(b => String(b.id) === String(id))?.name || String(id);
}

function removeCategoryFilter(id: number) {
  filterState.categoryIds = filterState.categoryIds.filter(c => c !== id);
}

function removeBrandFilter(id: string) {
  filterState.brandIds = filterState.brandIds.filter(b => String(b) !== String(id));
}

function clearFilters() {
  filterState.categoryIds = [];
  filterState.brandIds = [];
}

async function loadApproved() {
  loadingApproved.value = true;
  try {
    const res = await fetchApi<any>('/api/global-products/?status=APPROVED&page=1&page_size=500');
    const list = res?.results || res || [];
    approvedProducts.value = Array.isArray(list) ? list : [];
  } catch { approvedProducts.value = []; }
  finally { loadingApproved.value = false; }
}

async function loadCatalogData() {
  try {
    const [catRes, brandRes] = await Promise.all([
      fetchApi<any>('/api/v1/catalog/categories/?page_size=500'),
      fetchApi<any>('/api/v1/catalog/brands/all/'),
    ]);
    const catList = catRes?.results || (Array.isArray(catRes) ? catRes : []);
    categoryTree.value = catList;
    const flat: { id: number; name: string; icon?: string; code?: string }[] = [];
    function walk(nodes: any[]) {
      for (const n of nodes) {
        flat.push({ id: n.id, name: n.name, icon: n.icon || '', code: n.code || '' });
        if (n.children?.length) walk(n.children);
      }
    }
    walk(catList);
    allCategories.value = flat;
    const brandList = Array.isArray(brandRes) ? brandRes : [];
    allBrands.value = brandList.map((b: any) => ({
      id: b.id || b.pk,
      name: b.name,
      smart_categories: b.smart_categories || [],
    }));
  } catch {
    allCategories.value = [];
    categoryTree.value = [];
    allBrands.value = [];
  }
}

async function loadRejected() {
  loadingRejected.value = true;
  try {
    const [res1, res2] = await Promise.all([
      fetchApi<any>('/api/global-products/?status=REJECTED_FORMAT&page=1&page_size=200'),
      fetchApi<any>('/api/global-products/?status=REJECTED_BANNED&page=1&page_size=200'),
    ]);
    const list1 = Array.isArray(res1?.results || res1) ? (res1?.results || res1) : [];
    const list2 = Array.isArray(res2?.results || res2) ? (res2?.results || res2) : [];
    rejectedProducts.value = [...list1, ...list2];
  } catch { rejectedProducts.value = []; }
  finally { loadingRejected.value = false; }
}

async function loadPendingCount() {
  try {
    const res = await fetchApi<any>('/api/v1/product-moderation/?page=1&page_size=1');
    pendingCount.value = res?.count || 0;
  } catch { pendingCount.value = 0; }
}

function onProductCreated() {
  refreshKey.value++;
  loadApproved();
  loadRejected();
  loadPendingCount();
}

function trackMouse(e: MouseEvent) { mousePos.value = { x: e.clientX, y: e.clientY }; }

watch(activeTab, (tab) => {
  if (tab === 'approved' && approvedProducts.value.length === 0 && !loadingApproved.value) loadApproved();
  if (tab === 'rejected' && rejectedProducts.value.length === 0 && !loadingRejected.value) loadRejected();
  if (tab === 'pending') loadPendingCount();
});

watch(approvedSearch, () => { approvedPage.value = 1; });

onMounted(() => {
  loadPendingCount();
  loadCatalogData();
  document.addEventListener('mousemove', trackMouse);
});
</script>
