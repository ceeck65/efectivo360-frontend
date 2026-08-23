<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input v-model="search" type="text" placeholder="Buscar marcas..."
          class="w-full h-10 pl-9 pr-9 text-sm border border-slate-200 bg-white text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400" />
        <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-300" />
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button @click="showMerge = true"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <GitMerge class="h-4 w-4" /> Fusionar Marcas
        </button>
        <button @click="editingBrand = null; showForm = true"
          class="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 shadow-sm transition-colors">
          <Plus class="h-4 w-4" /> Nueva Marca
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/80">
            <tr>
              <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-12"><span class="sr-only">Logo</span></th>
              <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
              <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Categorías</th>
              <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Productos</th>
              <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
              <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td colspan="6" class="px-4 py-16 text-center text-slate-400">
                <Loader2 class="w-5 h-5 animate-spin mx-auto mb-2" /> Cargando...
              </td>
            </tr>
            <tr v-else-if="brands.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-sm text-slate-400 italic">
                {{ search ? 'Sin resultados' : 'No hay marcas registradas' }}
              </td>
            </tr>
            <tr v-for="b in brands" :key="b.id" class="hover:bg-slate-50/80 transition-colors" :class="{ 'opacity-50': !b.is_active }">
              <td class="px-4 py-3">
                <div class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img v-if="b.logo" :src="b.logo" class="w-full h-full object-contain" alt="" />
                  <Tag v-else class="w-4 h-4 text-slate-300" />
                </div>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-slate-800">{{ b.name }}</p>
                <p class="text-xs text-slate-400 font-mono">{{ b.slug }}</p>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1 max-w-[220px]">
                  <template v-if="b.categories?.length">
                    <span v-for="cat in b.categories.slice(0, 3)" :key="cat.id"
                      class="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded bg-slate-50 text-slate-500 border border-slate-100">
                      {{ cat.name }}
                    </span>
                    <span v-if="b.categories.length > 3" class="text-[10px] text-slate-400">+{{ b.categories.length - 3 }}</span>
                  </template>
                  <span v-else class="text-xs text-slate-300">—</span>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-sm font-semibold text-slate-700">{{ formatQty(b.products_count) }}</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center gap-1 text-xs" :class="b.is_active ? 'text-emerald-600' : 'text-slate-400'">
                  <span class="w-1.5 h-1.5 rounded-full" :class="b.is_active ? 'bg-emerald-400' : 'bg-slate-300'" />
                  {{ b.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="inline-flex items-center gap-1">
                  <button @click="editingBrand = b; showForm = true"
                    class="p-1.5 rounded-md text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors" title="Editar">
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button @click="toggleActive(b)"
                    class="p-1.5 rounded-md transition-colors"
                    :title="b.is_active ? 'Desactivar' : 'Activar'"
                    :class="b.is_active ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-300 hover:text-emerald-600 hover:bg-emerald-50'">
                    <Ban v-if="b.is_active" class="w-3.5 h-3.5" />
                    <RotateCcw v-else class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="count > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <span class="text-[11px] text-slate-400">{{ formatQty(count) }} marcas</span>
        <div class="flex items-center gap-1">
          <button @click="goToPage(page - 1)" :disabled="!previous"
            class="px-2 py-1 text-xs rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>
          <span class="text-[11px] text-slate-500 px-2">{{ page }} / {{ totalPages }}</span>
          <button @click="goToPage(page + 1)" :disabled="!next"
            class="px-2 py-1 text-xs rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create / Edit -->
    <BrandFormModal
      :visible="showForm"
      :editing="editingBrand"
      :category-tree="categoryTree"
      :saving="saving"
      @close="showForm = false; editingBrand = null"
      @save="handleSave"
    />

    <!-- Merge -->
    <MergeBrandsModal
      :visible="showMerge"
      @close="showMerge = false"
      @merged="loadBrands"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { Search, Plus, Loader2, Pencil, Ban, RotateCcw, Tag, GitMerge, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { fetchApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import BrandFormModal from '@/views/admin/super-console/components/BrandFormModal.vue';
import MergeBrandsModal from './MergeBrandsModal.vue';

interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  is_active: boolean;
  products_count: number;
  category_ids: string[];
  categories: { id: string; name: string }[];
}

const { success, error: notifyError } = useNotify();

const PAGE_SIZE = 20;
const brands = ref<AdminBrand[]>([]);
const count = ref(0);
const next = ref<string | null>(null);
const previous = ref<string | null>(null);
const page = ref(1);
const loading = ref(true);
const search = ref('');

const categoryTree = ref<any[]>([]);
const showForm = ref(false);
const editingBrand = ref<AdminBrand | null>(null);
const saving = ref(false);
const showMerge = ref(false);

const totalPages = ref(1);

function formatQty(n: number): string {
  return (n || 0).toLocaleString('es');
}

async function loadBrands() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.set('page', String(page.value));
    if (search.value.trim()) params.set('search', search.value.trim());

    const res = await fetchApi<any>(`/api/v1/admin/global-catalog/brands/?${params.toString()}`);
    brands.value = Array.isArray(res?.results) ? res.results : [];
    count.value = res?.count ?? 0;
    next.value = res?.next ?? null;
    previous.value = res?.previous ?? null;
    totalPages.value = Math.max(1, Math.ceil(count.value / PAGE_SIZE));
  } catch {
    brands.value = [];
    count.value = 0;
  } finally {
    loading.value = false;
  }
}

async function loadCategoryTree() {
  try {
    const res = await fetchApi<any>('/api/v1/catalog/categories/?page_size=500');
    categoryTree.value = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
  } catch {
    categoryTree.value = [];
  }
}

function goToPage(n: number) {
  if (n < 1 || n > totalPages.value || n === page.value) return;
  page.value = n;
  loadBrands();
}

function extractErrorMessage(e: any): string {
  const data = e?.data;
  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const val = firstKey ? data[firstKey] : null;
    if (Array.isArray(val) && val.length) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return e?.message || 'Error al guardar la marca';
}

async function handleSave(data: Record<string, any>) {
  saving.value = true;
  try {
    const isEdit = !!editingBrand.value;
    const url = isEdit
      ? `/api/v1/admin/global-catalog/brands/${editingBrand.value!.id}/`
      : '/api/v1/admin/global-catalog/brands/';

    // `slug` isn't sent — it's read-only on AdminBrandSerializer (auto-derived from name).
    const fd = new FormData();
    fd.append('name', data.name || '');
    if (data.logo instanceof File) fd.append('logo', data.logo);
    for (const id of (data.category_ids || [])) fd.append('category_ids', String(id));

    await fetchApi(url, { method: isEdit ? 'PATCH' : 'POST', data: fd });
    success(isEdit ? 'Marca actualizada.' : 'Marca creada.');
    showForm.value = false;
    editingBrand.value = null;
    await loadBrands();
  } catch (e: any) {
    notifyError(extractErrorMessage(e));
  } finally {
    saving.value = false;
  }
}

async function toggleActive(brand: AdminBrand) {
  try {
    if (brand.is_active) {
      await fetchApi(`/api/v1/admin/global-catalog/brands/${brand.id}/`, { method: 'DELETE' });
    } else {
      await fetchApi(`/api/v1/admin/global-catalog/brands/${brand.id}/`, { method: 'PATCH', data: { is_active: true } });
    }
    brand.is_active = !brand.is_active;
    success(brand.is_active ? 'Marca activada.' : 'Marca desactivada.');
  } catch (e: any) {
    notifyError(extractErrorMessage(e));
  }
}

const debouncedSearch = useDebounceFn(() => {
  page.value = 1;
  loadBrands();
}, 300);
watch(search, debouncedSearch);

onMounted(() => {
  loadBrands();
  loadCategoryTree();
});
</script>
