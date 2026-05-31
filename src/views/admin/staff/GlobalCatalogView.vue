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
      <button
        @click="showSlideOver = true; editingProduct = null"
        class="shrink-0 inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 shadow-sm transition-colors"
      >
        <Plus class="h-4 w-4" />
        Nuevo Producto
      </button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-slate-200 dark:border-white/[0.06] overflow-x-auto">
      <div class="flex gap-0 min-w-max">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="relative px-4 sm:px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors"
          :class="activeTab === tab.key
            ? 'text-cyan-600 dark:text-cyan-400'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'"
        >
          {{ tab.label }}
          <span
            v-if="tab.badge"
            class="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold rounded-full"
            :class="activeTab === tab.key
              ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'"
          >
            {{ tab.badge }}
          </span>
          <span
            v-if="activeTab === tab.key"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"
          />
        </button>
      </div>
    </div>

    <!-- Tab: Aprobados -->
    <div v-if="activeTab === 'approved'">
      <!-- Filters bar -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            v-model="approvedSearch"
            type="text"
            placeholder="Buscar por nombre, código o SKU..."
            class="w-full h-10 pl-9 pr-4 text-sm border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
          />
        </div>
        <select
          v-model="approvedCategoryFilter"
          class="h-10 px-3 text-sm border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
        >
          <option value="">Todas las categorías</option>
          <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <!-- Products grid -->
      <div v-if="loadingApproved" class="flex items-center justify-center py-16 text-slate-400">
        <Loader2 class="w-5 h-5 animate-spin mr-2" /> Cargando...
      </div>
      <div v-else-if="filteredApproved.length === 0" class="text-center py-16 text-sm text-slate-400 italic">
        No hay productos aprobados que coincidan
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="p in filteredApproved"
          :key="p.id"
          class="bg-white dark:bg-[#141824] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors shadow-sm"
        >
          <div class="w-full h-32 rounded-lg bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center overflow-hidden mb-3">
            <img v-if="p.image_url || p.official_image_url" :src="absUrl(p.image_url || p.official_image_url)" class="w-full h-full object-contain" alt="" />
            <Package v-else class="w-8 h-8 text-slate-300" />
          </div>
          <p class="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{{ p.name }}</p>
          <p class="text-[11px] text-slate-400 font-mono truncate mt-0.5">{{ p.barcode || p.sku }}</p>
          <div class="flex items-center gap-2 mt-2">
            <span v-if="p.category" class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 truncate">{{ p.category }}</span>
            <span v-if="p.brand" class="text-[10px] text-slate-400 truncate">{{ p.brand }}</span>
            <button
              @click="editingProduct = p; showSlideOver = true"
              class="ml-auto shrink-0 p-1 rounded-md text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:text-cyan-400 dark:hover:bg-cyan-900/20 transition-colors"
              title="Editar producto"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Pendientes -->
    <div v-if="activeTab === 'pending'">
      <GlobalProductModerationDashboard
        :key="refreshKey"
        @productCreated="onProductCreated"
        @productModified="onProductCreated"
      />
    </div>

    <!-- Tab: Rechazados -->
    <div v-if="activeTab === 'rejected'">
      <div v-if="loadingRejected" class="flex items-center justify-center py-16 text-slate-400">
        <Loader2 class="w-5 h-5 animate-spin mr-2" /> Cargando...
      </div>
      <div v-else-if="filteredRejected.length === 0" class="text-center py-16 text-sm text-slate-400 italic">
        No hay productos rechazados o con apelación
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="p in filteredRejected"
          :key="p.id"
          class="bg-white dark:bg-[#141824] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 flex items-start gap-4 hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors shadow-sm"
        >
          <div class="shrink-0 w-12 h-12 rounded-lg bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center overflow-hidden">
            <img v-if="p.image_url || p.official_image_url" :src="absUrl(p.image_url || p.official_image_url)" class="w-full h-full object-cover" alt="" />
            <Package v-else class="w-5 h-5 text-slate-300" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{{ p.name }}</p>
              <span
                class="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded"
                :class="p.status === 'REJECTED_BANNED'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'"
              >
                {{ p.status === 'REJECTED_BANNED' ? 'BANEADO' : 'RECHAZADO' }}
              </span>
            </div>
            <p class="text-[11px] text-slate-400 font-mono mt-0.5">{{ p.barcode || p.sku }}</p>
            <p v-if="p.rejection_reason" class="text-xs text-red-600 dark:text-red-400 mt-1.5 bg-red-50 dark:bg-red-900/10 rounded-lg px-3 py-1.5">
              {{ p.rejection_reason }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <GlobalProductSlideOver
      :visible="showSlideOver"
      :editProduct="editingProduct"
      @close="showSlideOver = false; editingProduct = null"
      @productCreated="onProductCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Package, Plus, Search, Loader2, Pencil } from 'lucide-vue-next';
import GlobalProductModerationDashboard from '@/views/admin/super-console/components/GlobalProductModerationDashboard.vue';
import GlobalProductSlideOver from '@/views/admin/super-console/components/GlobalProductSlideOver.vue';
import { useApi } from '@/composables/useApi';

const { fetchApi } = useApi();

const refreshKey = ref(0);
const showSlideOver = ref(false);
const editingProduct = ref<any>(null);
const activeTab = ref('pending');

const approvedSearch = ref('');
const approvedCategoryFilter = ref('');
const approvedProducts = ref<any[]>([]);
const loadingApproved = ref(false);

const rejectedProducts = ref<any[]>([]);
const loadingRejected = ref(false);

const pendingCount = ref(0);

// Build categories from product data
const categoryOptions = computed(() => {
  const cats = new Set<string>();
  for (const p of approvedProducts.value) {
    if (p.category) cats.add(p.category);
  }
  return Array.from(cats).sort();
});

const tabs = computed(() => [
  { key: 'approved', label: 'Aprobados', badge: null },
  { key: 'pending', label: 'Pendientes', badge: pendingCount.value },
  { key: 'rejected', label: 'Rechazados / Apelación', badge: null },
]);

const filteredApproved = computed(() => {
  let list = approvedProducts.value;
  const q = approvedSearch.value.toLowerCase();
  if (q) {
    list = list.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)
    );
  }
  if (approvedCategoryFilter.value) {
    list = list.filter(p => p.category === approvedCategoryFilter.value);
  }
  return list;
});

const filteredRejected = computed(() => {
  return rejectedProducts.value;
});

async function loadApproved() {
  loadingApproved.value = true;
  try {
    const res = await fetchApi<any>('/api/global-products/?status=APPROVED&page=1&page_size=200');
    const list = res?.results || res || [];
    approvedProducts.value = Array.isArray(list) ? list : [];
  } catch {
    approvedProducts.value = [];
  } finally {
    loadingApproved.value = false;
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
  } catch {
    rejectedProducts.value = [];
  } finally {
    loadingRejected.value = false;
  }
}

async function loadPendingCount() {
  try {
    const res = await fetchApi<any>('/api/v1/product-moderation/?page=1&page_size=1');
    pendingCount.value = res?.count || 0;
  } catch {
    pendingCount.value = 0;
  }
}

function absUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return window.location.origin + url;
  return url;
}

function onProductCreated() {
  refreshKey.value++;
  loadApproved();
  loadRejected();
  loadPendingCount();
}

watch(activeTab, (tab) => {
  if (tab === 'approved' && approvedProducts.value.length === 0 && !loadingApproved.value) loadApproved();
  if (tab === 'rejected' && rejectedProducts.value.length === 0 && !loadingRejected.value) loadRejected();
  if (tab === 'pending') loadPendingCount();
});

onMounted(() => {
  loadPendingCount();
});
</script>
