<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Marcas</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gestión de marcas del catálogo inteligente</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors"
      >
        <Plus class="w-4 h-4" />
        Nueva Marca
      </button>
    </div>

    <!-- Search -->
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        v-model="search"
        type="text"
        placeholder="Buscar por nombre..."
        class="w-full h-10 pl-9 pr-4 text-sm border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#141824] text-slate-900 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-slate-400">
      <Loader2 class="w-5 h-5 animate-spin mx-auto mb-2" /> Cargando marcas...
    </div>

    <!-- Brands Grid -->
    <div v-else-if="filteredBrands.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="brand in filteredBrands"
        :key="brand.id"
        class="bg-white dark:bg-[#141824] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors shadow-sm"
        :class="{ 'opacity-50': !brand.is_active }"
      >
        <div class="flex items-start justify-between">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{{ brand.name }}</p>
            <p class="text-[11px] text-slate-400 font-mono mt-0.5">{{ brand.slug }}</p>
            <div class="mt-2 flex items-center gap-2">
              <span
                class="px-1.5 py-0.5 text-[10px] font-medium rounded"
                :class="brand.is_active
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'"
              >
                {{ brand.is_active ? 'Activo' : 'Inactivo' }}
              </span>
              <span v-if="brand.tenant_id" class="text-[10px] text-slate-400">Personalizado</span>
              <span v-else class="text-[10px] text-cyan-600 dark:text-cyan-400">Global</span>
            </div>
          </div>
          <div class="flex gap-1 shrink-0">
            <button @click="openEditModal(brand)" class="p-1.5 rounded-md text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:text-cyan-400 dark:hover:bg-cyan-900/20 transition-colors" title="Editar">
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button @click="toggleActive(brand)" class="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/20 transition-colors" :title="brand.is_active ? 'Desactivar' : 'Activar'">
              <EyeOff v-if="brand.is_active" class="w-3.5 h-3.5" />
              <Eye v-else class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="text-center py-16 text-sm text-slate-400 italic">
      {{ search ? 'Sin resultados para "' + search + '"' : 'No hay marcas registradas' }}
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showModal = false" />
        <div class="relative bg-white dark:bg-[#141824] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white">{{ editingBrand ? 'Editar Marca' : 'Nueva Marca' }}</h3>
            <button @click="showModal = false" class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
              <X class="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nombre <span class="text-red-400">*</span></label>
              <input v-model="form.name" type="text" placeholder="Ej. Nike" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Slug</label>
              <input v-model="form.slug" type="text" placeholder="nike" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button @click="showModal = false" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">Cancelar</button>
            <button @click="save" :disabled="saving || !form.name.trim()" class="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-40 transition-colors flex items-center gap-2">
              <Save v-if="!saving" class="w-4 h-4" />
              <Loader2 v-else class="w-4 h-4 animate-spin" />
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Plus, Search, Loader2, Pencil, Eye, EyeOff, Save, X } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  tenant_id: string | null;
}

const { fetchApi } = useApi();
const { success: notifySuccess, error: notifyError } = useNotify();

const brands = ref<BrandItem[]>([]);
const loading = ref(true);
const search = ref('');
const showModal = ref(false);
const editingBrand = ref<BrandItem | null>(null);
const saving = ref(false);
const form = ref({ name: '', slug: '' });

const filteredBrands = computed(() => {
  if (!search.value.trim()) return brands.value;
  const q = search.value.toLowerCase();
  return brands.value.filter(b => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q));
});

async function loadBrands() {
  loading.value = true;
  try {
    const data = await fetchApi<any>('/api/v1/catalog/brands/?page_size=500');
    brands.value = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
  } catch { brands.value = []; }
  finally { loading.value = false; }
}

function openCreateModal() {
  editingBrand.value = null;
  form.value = { name: '', slug: '' };
  showModal.value = true;
}

function openEditModal(brand: BrandItem) {
  editingBrand.value = brand;
  form.value = { name: brand.name, slug: brand.slug || '' };
  showModal.value = true;
}

async function save() {
  if (saving.value || !form.value.name.trim()) return;
  saving.value = true;
  try {
    if (editingBrand.value) {
      await fetchApi(`/api/v1/catalog/brands/${editingBrand.value.id}/`, {
        method: 'PATCH',
        data: { name: form.value.name.trim(), slug: form.value.slug.trim() || undefined },
      });
      notifySuccess('Marca actualizada');
    } else {
      await fetchApi('/api/v1/catalog/brands/', {
        method: 'POST',
        data: { name: form.value.name.trim(), slug: form.value.slug.trim() || undefined },
      });
      notifySuccess('Marca creada');
    }
    showModal.value = false;
    await loadBrands();
  } catch (e: any) {
    notifyError(e?.response?.data?.detail || e?.message || 'Error al guardar');
  } finally { saving.value = false; }
}

async function toggleActive(brand: BrandItem) {
  try {
    await fetchApi(`/api/v1/catalog/brands/${brand.id}/`, {
      method: 'PATCH',
      data: { is_active: !brand.is_active },
    });
    brand.is_active = !brand.is_active;
    notifySuccess(brand.is_active ? 'Marca activada' : 'Marca desactivada');
  } catch (e: any) {
    notifyError(e?.response?.data?.detail || e?.message || 'Error al cambiar estado');
  }
}

onMounted(loadBrands);
</script>
