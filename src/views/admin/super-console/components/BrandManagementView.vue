<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">Marcas</h2>
        <p class="text-xs text-slate-500 mt-0.5">Gestión de marcas del catálogo inteligente</p>
      </div>
      <button @click="openCreate" class="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
        <Plus class="w-4 h-4" /> Nueva Marca
      </button>
    </div>

    <!-- Search -->
    <div class="relative max-w-sm">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input v-model="search" type="text" placeholder="Buscar marcas..."
        class="w-full h-9 pl-9 pr-4 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16 text-slate-400"><Loader2 class="w-5 h-5 animate-spin mx-auto mb-2" /> Cargando...</div>

    <!-- Table -->
    <div v-else class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12"><span class="sr-only">Logo</span></th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Categorías</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Estado</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="brand in filteredBrands" :key="brand.id"
              class="hover:bg-slate-50/50 transition-colors" :class="{ 'opacity-50': !brand.is_active }">
              <!-- Logo -->
              <td class="px-4 py-3">
                <div class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img v-if="brand.logo_url" :src="brand.logo_url" class="w-full h-full object-contain" alt="" />
                  <Tag v-else class="w-4 h-4 text-slate-300" />
                </div>
              </td>
              <!-- Name -->
              <td class="px-4 py-3">
                <p class="font-medium text-slate-800">{{ brand.name }}</p>
                <p class="text-xs text-slate-400 font-mono">{{ brand.slug }}</p>
              </td>
              <!-- Categories -->
              <td class="px-4 py-3 hidden md:table-cell">
                <div class="flex flex-wrap gap-1">
                  <template v-if="brand.smart_categories?.length">
                    <span v-for="cat in brand.smart_categories.slice(0, 4)" :key="cat.id"
                      class="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded bg-slate-50 text-slate-500 border border-slate-100">
                      {{ cat.name }}
                    </span>
                    <span v-if="brand.smart_categories.length > 4"
                      class="text-[10px] text-slate-400">+{{ brand.smart_categories.length - 4 }}</span>
                  </template>
                  <span v-else class="text-xs text-slate-300">—</span>
                </div>
              </td>
              <!-- Status -->
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center gap-1 text-xs" :class="brand.is_active ? 'text-emerald-600' : 'text-slate-400'">
                  <span class="w-1.5 h-1.5 rounded-full" :class="brand.is_active ? 'bg-emerald-400' : 'bg-slate-300'" />
                  {{ brand.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <!-- Actions -->
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="openEdit(brand)" class="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                    <Pencil class="w-3.5 h-3.5" /></button>
                  <button @click="toggleActive(brand)" class="p-1.5 rounded-md transition-colors" :title="brand.is_active ? 'Desactivar' : 'Activar'"
                    :class="brand.is_active ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-300 hover:text-emerald-600 hover:bg-emerald-50'">
                    <EyeOff v-if="brand.is_active" class="w-3.5 h-3.5" />
                    <Eye v-else class="w-3.5 h-3.5" /></button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredBrands.length === 0">
              <td colspan="5" class="px-4 py-12 text-center text-sm text-slate-400 italic">
                {{ search ? 'Sin resultados' : 'No hay marcas registradas' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BrandFormModal
      :visible="showModal" :editing="editingBrand"
      :category-tree="categoryTree" :saving="saving"
      @close="showModal = false; editingBrand = null"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Plus, Search, Loader2, Pencil, Eye, EyeOff, Tag } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import BrandFormModal from './BrandFormModal.vue';

interface BrandItem {
  id: string; name: string; slug: string; logo_url?: string; description?: string;
  is_active: boolean; tenant_id: string | null;
  smart_categories?: Array<{ id: number; name: string }>;
}

const { fetchApi } = useApi();
const { success, error: notifyError } = useNotify();

const brands = ref<BrandItem[]>([]);
const categoryTree = ref<any[]>([]);
const loading = ref(true);
const search = ref('');
const showModal = ref(false);
const editingBrand = ref<any>(null);
const saving = ref(false);

const filteredBrands = computed(() => {
  if (!search.value.trim()) return brands.value;
  const q = search.value.toLowerCase();
  return brands.value.filter(b => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q));
});

async function loadAll() {
  loading.value = true;
  try {
    const [brandsRes, treeRes] = await Promise.all([
      fetchApi<any>('/api/v1/catalog/brands/?page_size=500'),
      fetchApi<any>('/api/v1/catalog/categories/?page_size=200'),
    ]);
    brands.value = Array.isArray(brandsRes?.results) ? brandsRes.results : (Array.isArray(brandsRes) ? brandsRes : []);
    categoryTree.value = Array.isArray(treeRes?.results) ? treeRes.results : (Array.isArray(treeRes) ? treeRes : []);
  } catch { brands.value = []; categoryTree.value = []; }
  finally { loading.value = false; }
}

function openCreate() { editingBrand.value = null; showModal.value = true; }
function openEdit(brand: BrandItem) { editingBrand.value = brand; showModal.value = true; }

async function handleSave(data: any) {
  saving.value = true;
  try {
    const isEdit = !!editingBrand.value;
    const url = isEdit ? `/api/v1/catalog/brands/${editingBrand.value.id}/` : '/api/v1/catalog/brands/';
    await fetchApi(url, { method: isEdit ? 'PATCH' : 'POST', data });
    success(isEdit ? 'Marca actualizada' : 'Marca creada');
    showModal.value = false; editingBrand.value = null;
    await loadAll();
  } catch (e: any) {
    notifyError(e?.response?.data?.detail || e?.message || 'Error al guardar');
  } finally { saving.value = false; }
}

async function toggleActive(brand: BrandItem) {
  try {
    await fetchApi(`/api/v1/catalog/brands/${brand.id}/`, { method: 'PATCH', data: { is_active: !brand.is_active } });
    brand.is_active = !brand.is_active;
    success(brand.is_active ? 'Marca activada' : 'Marca desactivada');
  } catch (e: any) { notifyError(e?.response?.data?.detail || 'Error'); }
}

onMounted(loadAll);
</script>
