<template>
  <div class="space-y-4 sm:space-y-6 p-4 sm:p-6">

    <!-- Header -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          <Package class="h-7 w-7 text-cyan-500" />
          Catálogo Global
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Banco global de productos, moderación de solicitudes y marcas homologadas.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button v-if="activeMainTab === 'moderation' && moderationSubTab === 'rejected'" @click="showFilterSidebar = true"
          class="shrink-0 inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors relative">
          <SlidersHorizontal class="h-4 w-4" />
          Filtros
          <span v-if="activeFilterCount > 0"
            class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-500 text-white text-[9px] font-bold flex items-center justify-center">
            {{ activeFilterCount }}
          </span>
        </button>
        <template v-if="activeMainTab === 'products'">
          <button @click="showBulkImport = true"
            class="shrink-0 inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <UploadCloud class="h-4 w-4" />
            Carga Masiva (CSV / Excel)
          </button>
          <button @click="showProductForm = true; editingProduct = null"
            class="shrink-0 inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 shadow-sm transition-colors">
            <Plus class="h-4 w-4" />
            Nuevo
          </button>
        </template>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
          <Globe2 class="w-3.5 h-3.5" /> Total en Banco Global
        </div>
        <p class="mt-1.5 text-2xl font-bold text-slate-800">
          <Loader2 v-if="loadingStats" class="w-5 h-5 animate-spin text-slate-300" />
          <template v-else>{{ formatQty(stats.total_approved) }}</template>
        </p>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
          <Tag class="w-3.5 h-3.5" /> Marcas Homologadas
        </div>
        <p class="mt-1.5 text-2xl font-bold text-slate-800">
          <Loader2 v-if="loadingStats" class="w-5 h-5 animate-spin text-slate-300" />
          <template v-else>{{ formatQty(stats.total_brands) }}</template>
        </p>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
          <FolderOpen class="w-3.5 h-3.5" /> Categorías Activas
        </div>
        <p class="mt-1.5 text-2xl font-bold text-slate-800">
          <Loader2 v-if="loadingStats" class="w-5 h-5 animate-spin text-slate-300" />
          <template v-else>{{ formatQty(stats.total_categories) }}</template>
        </p>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 text-amber-500 text-[11px] font-semibold uppercase tracking-wider">
          <Hourglass class="w-3.5 h-3.5" /> Pendientes de Revisión
        </div>
        <p class="mt-1.5 text-2xl font-bold text-amber-700">
          <Loader2 v-if="loadingStats" class="w-5 h-5 animate-spin text-amber-300" />
          <template v-else>{{ formatQty(stats.pending_submissions) }}</template>
        </p>
      </div>
    </div>

    <!-- Main Tabs -->
    <div class="border-b border-slate-200 dark:border-white/[0.06] overflow-x-auto">
      <div class="flex gap-0 min-w-max">
        <button v-for="tab in mainTabs" :key="tab.key" @click="activeMainTab = tab.key"
          class="relative px-4 sm:px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors"
          :class="activeMainTab === tab.key ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'">
          {{ tab.label }}
          <span v-if="tab.badge" class="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold rounded-full"
            :class="activeMainTab === tab.key ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600'">
            {{ tab.badge }}
          </span>
          <span v-if="activeMainTab === tab.key" class="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
        </button>
      </div>
    </div>

    <!-- Active filters indicator (Rechazados) -->
    <div v-if="activeMainTab === 'moderation' && moderationSubTab === 'rejected' && activeFilterCount > 0" class="flex items-center gap-2 flex-wrap">
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

    <!-- ═══════ TAB: PRODUCTOS GLOBALES ═══════ -->
    <div v-if="activeMainTab === 'products'">
      <!-- Audit quick filters -->
      <div class="flex items-center gap-1.5 flex-wrap mb-3">
        <button v-for="opt in AUDIT_FILTER_OPTIONS" :key="opt.value" @click="setAuditIssue(opt.value)"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors"
          :class="auditIssue === opt.value
            ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'">
          {{ opt.label }}
        </button>
      </div>

      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row gap-3 mb-4">
        <div class="relative flex-1 min-w-0">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input v-model="productsSearch" type="text" placeholder="Buscar por nombre, código de barras o marca..."
            class="w-full h-10 pl-9 pr-9 text-sm border border-slate-200 bg-white text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400" />
          <Loader2 v-if="loadingProducts" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-300" />
        </div>
        <select v-model="filterCategoryId"
          class="h-10 px-3 text-sm border border-slate-200 bg-white text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 min-w-0 lg:w-48">
          <option value="">Todas las categorías</option>
          <option v-for="c in allCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select v-model="filterBrandId"
          class="h-10 px-3 text-sm border border-slate-200 bg-white text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 min-w-0 lg:w-48">
          <option value="">Todas las marcas</option>
          <option v-for="b in allBrands" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
      </div>

      <!-- Table -->
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/80">
              <tr>
                <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Código EAN/UPC</th>
                <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Categoría &amp; Marca</th>
                <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Impuesto</th>
                <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="loadingProducts">
                <td colspan="5" class="px-4 py-16 text-center text-slate-400">
                  <Loader2 class="w-5 h-5 animate-spin mx-auto mb-2" /> Cargando...
                </td>
              </tr>
              <tr v-else-if="productsResults.length === 0">
                <td colspan="5" class="px-4 py-12 text-center text-sm text-slate-400 italic">
                  {{ productsSearch || filterCategoryId || filterBrandId || auditIssue ? 'Sin resultados para este filtro' : 'No hay productos en el Banco Global' }}
                </td>
              </tr>
              <tr v-for="p in productsResults" :key="p.id" class="hover:bg-slate-50/80 transition-colors group">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="group/thumb relative w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      title="Editar imagen"
                      @mouseenter="hoveredImage = p.id" @mouseleave="hoveredImage = null"
                      @click="openImageEditor(p)">
                      <img v-if="p.image_url" :src="absUrl(p.image_url)" class="w-full h-full object-cover" alt="" />
                      <Package v-else class="w-5 h-5 text-slate-300" />
                      <div class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/20 transition-colors">
                        <ImagePlus class="w-3.5 h-3.5 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow" />
                      </div>
                    </div>
                    <p class="text-sm font-medium text-slate-800 truncate max-w-[220px]">{{ p.name }}</p>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1.5 font-mono text-xs" :class="p.barcode ? 'text-slate-500' : 'text-rose-400 italic'">
                    <Barcode class="w-3.5 h-3.5 text-slate-300 shrink-0" /> {{ p.barcode || p.sku || 'Sin código' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap items-center gap-1">
                    <span v-if="p.category_name" class="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      <FolderOpen class="w-2.5 h-2.5" /> {{ p.category_name }}
                    </span>
                    <span v-if="p.brand_name" class="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                      <Tag class="w-2.5 h-2.5" /> {{ p.brand_name }}
                    </span>
                    <span v-if="!p.category_name && !p.brand_name" class="text-slate-300 text-xs">—</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    :class="taxBadgeClass(p.tax_type)">
                    {{ taxLabel(p.tax_type) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="inline-flex items-center gap-1">
                    <button @click="editingProduct = p; showProductForm = true"
                      class="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 transition-colors">
                      <Pencil class="w-3.5 h-3.5" /> Editar
                    </button>
                    <div class="relative" data-actions-menu>
                      <button @click.stop="openActionsMenuId = openActionsMenuId === p.id ? null : p.id"
                        class="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                        <MoreVertical class="w-3.5 h-3.5" />
                      </button>
                      <div v-if="openActionsMenuId === p.id"
                        class="absolute right-0 mt-1 z-20 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                        <button @click="openImageEditor(p)"
                          class="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                          <ImagePlus class="w-3.5 h-3.5" /> Editar Imagen
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="productsCount > 0" class="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-100">
          <span class="text-[11px] text-slate-400">{{ formatQty(productsCount) }} productos</span>
          <div class="flex items-center gap-1">
            <button @click="goToProductsPage(productsPage - 1)" :disabled="!productsPrevious"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft class="w-3.5 h-3.5" /> Anterior
            </button>
            <template v-for="(n, i) in productsPageWindow" :key="i">
              <span v-if="n === '...'" class="px-1.5 text-xs text-slate-300">…</span>
              <button v-else @click="goToProductsPage(n as number)"
                class="min-w-[28px] h-7 px-1.5 text-xs rounded-md border transition-colors"
                :class="n === productsPage ? 'bg-cyan-600 border-cyan-600 text-white font-semibold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'">
                {{ n }}
              </button>
            </template>
            <button @click="goToProductsPage(productsPage + 1)" :disabled="!productsNext"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
              Siguiente <ChevronRight class="w-3.5 h-3.5" />
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
    </div>

    <!-- ═══════ TAB: MODERACIÓN ═══════ -->
    <div v-if="activeMainTab === 'moderation'">
      <!-- Sub-tabs -->
      <div class="flex items-center gap-1.5 mb-4">
        <button @click="moderationSubTab = 'pending'"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors"
          :class="moderationSubTab === 'pending' ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'">
          Pendientes
          <span class="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full"
            :class="moderationSubTab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'">
            {{ pendingCount }}
          </span>
        </button>
        <button @click="moderationSubTab = 'rejected'"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors"
          :class="moderationSubTab === 'rejected' ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'">
          Rechazados / Apelación
        </button>
      </div>

      <GlobalProductModerationDashboard v-if="moderationSubTab === 'pending'" :key="refreshKey"
        @productCreated="onModerationChanged" @productModified="onModerationChanged" />

      <div v-if="moderationSubTab === 'rejected'">
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
    </div>

    <!-- ═══════ TAB: MARCAS ═══════ -->
    <div v-if="activeMainTab === 'brands'">
      <GlobalCatalogBrandsView />
    </div>

    <!-- Filter Sidebar (Rechazados) -->
    <CatalogFilterSidebar
      :visible="showFilterSidebar"
      :initial-categories="filterState.categoryIds"
      :initial-brands="filterState.brandIds"
      @close="showFilterSidebar = false"
      @update="onFilterUpdate"
    />

    <!-- Product form (create / edit — Banco Global) -->
    <ApprovedProductFormModal
      :visible="showProductForm"
      :product="editingProduct"
      @close="showProductForm = false; editingProduct = null"
      @saved="onProductSaved"
    />

    <!-- Bulk Import -->
    <BulkImportModal
      :visible="showBulkImport"
      @close="showBulkImport = false"
      @imported="onBulkImported"
    />

    <!-- Image Editor -->
    <ImageEditorModal
      :visible="showImageEditor"
      :product-id="editingImageProduct?.id || ''"
      :current-image-url="editingImageProduct?.image_url || null"
      :product-name="editingImageProduct?.name || ''"
      @close="showImageEditor = false; editingImageProduct = null"
      @image-saved="onImageSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, reactive } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import {
  Package, Plus, Search, Loader2, Pencil, SlidersHorizontal, ChevronLeft, ChevronRight, X,
  UploadCloud, Globe2, Tag, FolderOpen, Hourglass, Barcode, MoreVertical, ImagePlus,
} from 'lucide-vue-next';
import GlobalProductModerationDashboard from '@/views/admin/super-console/components/GlobalProductModerationDashboard.vue';
import CatalogFilterSidebar from './components/CatalogFilterSidebar.vue';
import BulkImportModal, { type BulkImportResult } from './components/BulkImportModal.vue';
import ApprovedProductFormModal from './components/ApprovedProductFormModal.vue';
import GlobalCatalogBrandsView from './components/GlobalCatalogBrandsView.vue';
import ImageEditorModal from './components/ImageEditorModal.vue';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

const { fetchApi } = useApi();
const { success: notifySuccess } = useNotify();

const refreshKey = ref(0);
const showProductForm = ref(false);
const showBulkImport = ref(false);
const showFilterSidebar = ref(false);
const showImageEditor = ref(false);
const editingProduct = ref<any>(null);
const editingImageProduct = ref<GlobalProductRow | null>(null);
const openActionsMenuId = ref<string | null>(null);
const activeMainTab = ref<'products' | 'moderation' | 'brands'>('moderation');
const moderationSubTab = ref<'pending' | 'rejected'>('pending');
const hoveredImage = ref<string | null>(null);
const mousePos = ref({ x: 0, y: 0 });

interface GlobalProductRow {
  id: string;
  barcode: string;
  sku: string;
  name: string;
  brand_id: string | null;
  brand_name: string;
  category_id: string | null;
  category_name: string;
  tax_type: string;
  image_url: string;
  is_verified: boolean;
  created_at: string;
}

const AUDIT_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'missing_barcode', label: '⚠️ Sin Barcode' },
  { value: 'missing_image', label: '🖼️ Sin Imagen' },
  { value: 'missing_brand', label: '🏷️ Sin Marca' },
];

const PRODUCTS_PAGE_SIZE = 20;
const productsSearch = ref('');
const productsResults = ref<GlobalProductRow[]>([]);
const productsCount = ref(0);
const productsNext = ref<string | null>(null);
const productsPrevious = ref<string | null>(null);
const productsPage = ref(1);
const loadingProducts = ref(false);
const filterCategoryId = ref('');
const filterBrandId = ref('');
const auditIssue = ref('');

const stats = ref({ total_approved: 0, total_brands: 0, total_categories: 0, pending_submissions: 0 });
const loadingStats = ref(false);

const rejectedProducts = ref<any[]>([]);
const loadingRejected = ref(false);

const pendingCount = ref(0);

const filterState = reactive<{ categoryIds: number[]; brandIds: string[] }>({ categoryIds: [], brandIds: [] });
const allCategories = ref<{ id: number; name: string; icon?: string; code?: string }[]>([]);
const categoryTree = ref<any[]>([]);
const allBrands = ref<{ id: string; name: string; smart_categories?: { id: number }[] }[]>([]);

const mainTabs = computed<{ key: 'products' | 'moderation' | 'brands'; label: string; badge: number | null }[]>(() => [
  { key: 'products', label: 'Productos Globales', badge: null },
  { key: 'moderation', label: 'Moderación', badge: pendingCount.value },
  { key: 'brands', label: 'Marcas', badge: null },
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

const productsTotalPages = computed(() => Math.max(1, Math.ceil(productsCount.value / PRODUCTS_PAGE_SIZE)));

/** Truncated page-number window (1 … current±2 … last) — printing hundreds of pages would be absurd. */
const productsPageWindow = computed<(number | '...')[]>(() => {
  const total = productsTotalPages.value;
  const current = productsPage.value;
  const delta = 2;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  const range: (number | '...')[] = [1];
  if (left > 2) range.push('...');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push('...');
  if (total > 1) range.push(total);
  return range;
});

function taxLabel(taxType: string): string {
  switch (taxType) {
    case 'EXEMPT': return 'Exento (E)';
    case 'IVA_16': return 'IVA 16%';
    case 'IVA_8': return 'IVA 8%';
    case 'REDUCIDO': return 'Reducido';
    default: return taxType || '—';
  }
}

function taxBadgeClass(taxType: string): string {
  switch (taxType) {
    case 'EXEMPT': return 'bg-slate-100 text-slate-600';
    case 'IVA_16': return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'IVA_8':
    case 'REDUCIDO': return 'bg-amber-50 text-amber-700 border border-amber-200';
    default: return 'bg-slate-100 text-slate-500';
  }
}

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

function getProductById(id: string): any {
  return productsResults.value.find(p => p.id === id);
}

function formatQty(n: number): string {
  return (n || 0).toLocaleString('es');
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

function setAuditIssue(value: string) {
  auditIssue.value = value;
}

async function loadProducts() {
  loadingProducts.value = true;
  try {
    const params = new URLSearchParams();
    params.set('page', String(productsPage.value));
    if (productsSearch.value.trim()) params.set('q', productsSearch.value.trim());
    if (filterCategoryId.value) params.set('category_id', filterCategoryId.value);
    if (filterBrandId.value) params.set('brand_id', filterBrandId.value);
    if (auditIssue.value) params.set('audit_issue', auditIssue.value);

    const res = await fetchApi<any>(`/api/v1/admin/global-catalog/products/?${params.toString()}`);
    productsResults.value = Array.isArray(res?.results) ? res.results : [];
    productsCount.value = res?.count ?? 0;
    productsNext.value = res?.next ?? null;
    productsPrevious.value = res?.previous ?? null;
  } catch {
    productsResults.value = [];
    productsCount.value = 0;
    productsNext.value = null;
    productsPrevious.value = null;
  } finally {
    loadingProducts.value = false;
  }
}

async function loadStats() {
  loadingStats.value = true;
  try {
    const res = await fetchApi<any>('/api/v1/admin/global-catalog/stats/');
    stats.value = {
      total_approved: res?.total_approved ?? 0,
      total_brands: res?.total_brands ?? 0,
      total_categories: res?.total_categories ?? 0,
      pending_submissions: res?.pending_submissions ?? 0,
    };
  } catch { /* keep last known values */ }
  finally { loadingStats.value = false; }
}

function goToProductsPage(n: number) {
  if (n < 1 || n > productsTotalPages.value || n === productsPage.value) return;
  productsPage.value = n;
  loadProducts();
}

function onBulkImported(result: BulkImportResult) {
  if (result.created > 0 || result.updated > 0) {
    notifySuccess(`Importación completada: ${result.created} creados, ${result.updated} actualizados.`);
    productsPage.value = 1;
    loadProducts();
    loadStats();
    loadCatalogData();
  }
}

function onProductSaved() {
  productsPage.value = 1;
  loadProducts();
  loadStats();
}

function openImageEditor(product: GlobalProductRow) {
  openActionsMenuId.value = null;
  editingImageProduct.value = product;
  showImageEditor.value = true;
}

function onImageSaved() {
  // Re-fetch instead of patching in place: a saved image can make a row
  // disappear from the current view (e.g. under the "Sin Imagen" filter).
  loadProducts();
  loadStats();
}

async function loadCatalogData() {
  try {
    const [catRes, brandRes] = await Promise.all([
      fetchApi<any>('/api/v1/catalog/categories/?page_size=500'),
      fetchApi<any>('/api/v1/admin/global-catalog/brands/?page_size=500&ordering=name'),
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
    const brandList = Array.isArray(brandRes?.results) ? brandRes.results : (Array.isArray(brandRes) ? brandRes : []);
    allBrands.value = brandList.map((b: any) => ({
      id: b.id || b.pk,
      name: b.name,
      smart_categories: b.categories || [],
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
    const res = await fetchApi<any>('/api/v1/admin/global-catalog/submissions/?status=PENDING');
    pendingCount.value = res?.count ?? (Array.isArray(res?.results) ? res.results.length : 0);
  } catch { pendingCount.value = 0; }
}

function onModerationChanged() {
  refreshKey.value++;
  loadRejected();
  loadPendingCount();
  loadStats();
}

function trackMouse(e: MouseEvent) { mousePos.value = { x: e.clientX, y: e.clientY }; }

function onDocumentClick(e: MouseEvent) {
  if (!openActionsMenuId.value) return;
  const target = e.target as HTMLElement;
  if (!target.closest('[data-actions-menu]')) openActionsMenuId.value = null;
}

watch(activeMainTab, (tab) => {
  if (tab === 'products' && productsResults.value.length === 0 && !loadingProducts.value) loadProducts();
  if (tab === 'moderation' && moderationSubTab.value === 'rejected' && rejectedProducts.value.length === 0 && !loadingRejected.value) loadRejected();
});

watch(moderationSubTab, (sub) => {
  if (sub === 'rejected' && rejectedProducts.value.length === 0 && !loadingRejected.value) loadRejected();
});

const debouncedSearchLoad = useDebounceFn(() => {
  productsPage.value = 1;
  loadProducts();
}, 300);
watch(productsSearch, debouncedSearchLoad);

watch([filterCategoryId, filterBrandId, auditIssue], () => {
  productsPage.value = 1;
  loadProducts();
});

onMounted(() => {
  loadPendingCount();
  loadCatalogData();
  loadStats();
  document.addEventListener('mousemove', trackMouse);
  document.addEventListener('click', onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', trackMouse);
  document.removeEventListener('click', onDocumentClick);
});
</script>
