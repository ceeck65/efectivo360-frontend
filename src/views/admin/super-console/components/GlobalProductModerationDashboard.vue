<template>
  <div class="flex h-[calc(100vh-18rem)] gap-0 border border-slate-200 rounded-lg overflow-hidden bg-white dark:border-white/[0.06] dark:bg-[#111827]">
    <!-- LEFT: Product List -->
    <div class="w-80 shrink-0 border-r border-slate-200 dark:border-white/[0.06] flex flex-col">
      <div class="p-3 border-b border-slate-100 dark:border-white/[0.04]">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Pendientes</h3>
          <span class="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            {{ products.length }}
          </span>
        </div>
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre o código..."
            class="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
          />
        </div>
      </div>
      <!-- Scrollable list -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
          <Loader2 class="w-5 h-5 animate-spin" />
          <span class="text-xs">Cargando productos...</span>
        </div>
        <div v-else-if="filteredProducts.length === 0" class="flex flex-col items-center justify-center h-full gap-1 text-slate-400 px-4 text-center">
          <Package class="w-8 h-8 mb-1 opacity-40" />
          <p class="text-xs font-medium">Todo despejado</p>
          <p class="text-[11px]">No hay productos pendientes de revisión</p>
        </div>
        <button
          v-for="p in filteredProducts"
          :key="p.id"
          @click="selectProduct(p)"
          class="w-full text-left p-3 border-b border-slate-50 dark:border-white/[0.02] transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
          :class="selected?.id === p.id ? 'bg-cyan-50 border-l-2 border-l-cyan-500 dark:bg-cyan-900/10 dark:border-l-cyan-400' : ''"
        >
          <div class="flex gap-2.5">
            <!-- Thumbnail -->
            <div class="shrink-0 w-10 h-10 rounded-md bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center overflow-hidden">
              <img v-if="p.image_url || p.official_image_url" :src="p.image_url || p.official_image_url" class="w-full h-full object-cover" alt="" />
              <Package v-else class="w-4 h-4 text-slate-300" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{{ p.name }}</p>
              <p class="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{{ p.barcode || p.sku }}</p>
              <p v-if="p.proposed_by_tenant_name" class="text-[10px] text-cyan-600 dark:text-cyan-400 mt-0.5 truncate">{{ p.proposed_by_tenant_name }}</p>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- RIGHT: Detail Panel -->
    <div class="flex-1 flex flex-col min-w-0">
      <template v-if="selected">
        <div class="p-5 border-b border-slate-100 dark:border-white/[0.04] flex items-center gap-3">
          <div class="shrink-0 w-14 h-14 rounded-lg bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center overflow-hidden">
            <img v-if="selected.image_url || selected.official_image_url" :src="selected.image_url || selected.official_image_url" class="w-full h-full object-cover" alt="" />
            <Package v-else class="w-5 h-5 text-slate-300" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-slate-400 font-mono">{{ selected.barcode || selected.sku }}</p>
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">PENDIENTE</span>
              <span v-if="selected.proposed_by_tenant_name" class="text-[11px] text-slate-500">Propuesto por {{ selected.proposed_by_tenant_name }}</span>
            </div>
          </div>
        </div>

        <!-- Editable fields -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Nombre del producto</label>
            <input
              v-model="editName"
              type="text"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Marca</label>
            <input
              v-model="editBrand"
              type="text"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
              placeholder="Sin marca"
            />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Categoría</label>
            <select
              v-model="editCategory"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 bg-white dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            >
              <option value="">Sin categoría</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">URL de imagen oficial</label>
            <input
              v-model="editImageUrl"
              type="url"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
              placeholder="https://..."
            />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Atributos base (JSON)</label>
            <textarea
              v-model="editAttributes"
              rows="4"
              class="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 resize-none dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
              placeholder='{"color": "Rojo", "talla": "42"}'
            ></textarea>
          </div>

          <div v-if="selected.description" class="pt-1">
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Descripción actual</label>
            <p class="text-xs text-slate-500 leading-relaxed dark:text-slate-400">{{ selected.description }}</p>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="p-4 border-t border-slate-100 dark:border-white/[0.04] flex gap-3 bg-slate-50/50 dark:bg-white/[0.01]">
          <button
            @click="handleApprove"
            :disabled="actionLoading"
            class="flex-1 h-11 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <CheckCircle2 v-if="!actionLoading" class="w-4 h-4" />
            <Loader2 v-else class="w-4 h-4 animate-spin" />
            Aprobar
          </button>
          <button
            @click="handleRejectFormat"
            :disabled="actionLoading"
            class="flex-1 h-11 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <AlertTriangle class="w-4 h-4" />
            Rechazar Formato
          </button>
          <button
            @click="handleBan"
            :disabled="actionLoading"
            class="flex-1 h-11 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <ShieldOff class="w-4 h-4" />
            Banear
          </button>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else class="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Search class="w-10 h-10 opacity-30" />
        <p class="text-sm font-medium">Selecciona un producto para revisar</p>
        <p class="text-xs">Haz clic en un producto de la lista para ver sus detalles</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Search, Package, Loader2, CheckCircle2, AlertTriangle, ShieldOff,
} from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import Swal from 'sweetalert2';

const { fetchApi } = useApi();

interface PendingProduct {
  id: number;
  barcode: string;
  sku: string;
  name: string;
  brand: string;
  description: string;
  category: string;
  image_url: string;
  official_image_url: string;
  base_attributes: Record<string, any>;
  proposed_by_tenant_name?: string;
  proposed_by_tenant?: number;
}

const products = ref<PendingProduct[]>([]);
const selected = ref<PendingProduct | null>(null);
const loading = ref(true);
const actionLoading = ref(false);
const searchQuery = ref('');

// Edit fields
const editName = ref('');
const editBrand = ref('');
const editCategory = ref('');
const editImageUrl = ref('');
const editAttributes = ref('');

const categories = ref<string[]>([]);

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value;
  const q = searchQuery.value.toLowerCase();
  return products.value.filter(
    p => p.name.toLowerCase().includes(q)
      || p.barcode.toLowerCase().includes(q)
      || p.sku.toLowerCase().includes(q),
  );
});

function selectProduct(p: PendingProduct) {
  selected.value = p;
  editName.value = p.name;
  editBrand.value = p.brand || '';
  editCategory.value = p.category || '';
  editImageUrl.value = p.official_image_url || p.image_url || '';
  editAttributes.value = JSON.stringify(p.base_attributes || {}, null, 2);
}

function removeFromList(id: number) {
  products.value = products.value.filter(p => p.id !== id);
  if (selected.value?.id === id) {
    selected.value = null;
  }
}

async function loadProducts() {
  loading.value = true;
  try {
    const data = await fetchApi<any>('/api/v1/global-products/?status=PENDING');
    const results = data?.results || data || [];
    products.value = Array.isArray(results) ? results : [];
  } catch (e) {
    console.error('Error loading products:', e);
  } finally {
    loading.value = false;
  }
}

async function loadCategories() {
  try {
    const data = await fetchApi<any>('/api/v1/global-products/categories/');
    const cats = data?.results || data || [];
    categories.value = Array.isArray(cats) ? cats : [];
  } catch {
    // non-critical
  }
}

async function handleApprove() {
  if (!selected.value) return;
  actionLoading.value = true;
  try {
    await fetchApi('/api/v1/product-moderation/approve/', {
      method: 'POST',
      data: {
        id: selected.value.id,
        name: editName.value !== selected.value.name ? editName.value : '',
        image_url: editImageUrl.value,
        category_code: editCategory.value !== selected.value.category ? editCategory.value : '',
      },
    });
    removeFromList(selected.value.id);
  } catch (e: any) {
    Swal.fire('Error', e?.response?.data?.error || e?.message || 'Error al aprobar', 'error');
  } finally {
    actionLoading.value = false;
  }
}

function showRejectModal(title: string, confirmText: string, confirmColor: string, callApi: (reason: string) => Promise<void>) {
  Swal.fire({
    title,
    input: 'textarea',
    inputLabel: 'Motivo de rechazo',
    inputPlaceholder: 'Explica por qué se rechaza este producto...',
    inputAttributes: { 'aria-label': 'Motivo de rechazo' },
    showCancelButton: true,
    confirmButtonText: confirmText,
    confirmButtonColor: confirmColor,
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return 'Debes escribir un motivo de rechazo';
      }
      return null;
    },
    customClass: {
      input: 'text-sm',
    },
  }).then(async (result) => {
    if (result.isConfirmed && result.value?.trim()) {
      actionLoading.value = true;
      try {
        await callApi(result.value.trim());
        removeFromList(selected.value!.id);
      } catch (e: any) {
        Swal.fire('Error', e?.response?.data?.error || e?.message || 'Error al procesar', 'error');
      } finally {
        actionLoading.value = false;
      }
    }
  });
}

function handleRejectFormat() {
  if (!selected.value) return;
  showRejectModal(
    'Rechazar por formato',
    'Rechazar',
    '#f59e0b',
    async (reason) => {
      await fetchApi('/api/v1/product-moderation/reject-format/', {
        method: 'POST',
        data: { id: selected.value!.id, reason },
      });
    },
  );
}

function handleBan() {
  if (!selected.value) return;
  showRejectModal(
    'Banear producto',
    'Banear',
    '#dc2626',
    async (reason) => {
      await fetchApi('/api/v1/product-moderation/reject-banned/', {
        method: 'POST',
        data: { id: selected.value!.id, reason },
      });
    },
  );
}

onMounted(() => {
  loadProducts();
  loadCategories();
});
</script>
