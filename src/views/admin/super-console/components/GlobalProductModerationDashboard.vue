<template>
  <div class="flex h-[calc(100vh-18rem)] gap-0 border border-slate-200 rounded-lg overflow-hidden bg-white dark:border-white/[0.06] dark:bg-[#111827]">
    <!-- LEFT: Submission List -->
    <div class="w-80 shrink-0 border-r border-slate-200 dark:border-white/[0.06] flex flex-col">
      <div class="p-3 border-b border-slate-100 dark:border-white/[0.04]">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Pendientes</h3>
          <span class="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            {{ submissions.length }}
          </span>
        </div>
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre, código o tienda..."
            class="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
          />
        </div>
      </div>
      <!-- Scrollable list -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
          <Loader2 class="w-5 h-5 animate-spin" />
          <span class="text-xs">Cargando solicitudes...</span>
        </div>
        <div v-else-if="filteredSubmissions.length === 0" class="flex flex-col items-center justify-center h-full gap-1 text-slate-400 px-4 text-center">
          <Package class="w-8 h-8 mb-1 opacity-40" />
          <p class="text-xs font-medium">Todo despejado</p>
          <p class="text-[11px]">No hay productos pendientes de revisión</p>
        </div>
        <button
          v-for="p in filteredSubmissions"
          :key="p.id"
          @click="selectSubmission(p)"
          class="w-full text-left p-3 border-b border-slate-50 dark:border-white/[0.02] transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
          :class="selected?.id === p.id ? 'bg-cyan-50 border-l-2 border-l-cyan-500 dark:bg-cyan-900/10 dark:border-l-cyan-400' : ''"
        >
          <p class="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{{ p.name }}</p>
          <p class="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{{ p.barcode }}</p>
          <div class="flex items-center justify-between mt-1 gap-2">
            <span class="text-[10px] text-cyan-600 dark:text-cyan-400 truncate">{{ p.tenant_name || 'Tienda desconocida' }}</span>
            <span class="text-[10px] text-slate-400 shrink-0">{{ timeAgo(p.created_at) }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- RIGHT: Detail Panel -->
    <div class="flex-1 flex flex-col min-w-0">
      <template v-if="selected">
        <div class="p-5 border-b border-slate-100 dark:border-white/[0.04] flex flex-col sm:flex-row items-start gap-4">
          <div class="w-full sm:w-28 shrink-0">
            <ProductImageUpload v-model="editImageFile" :existing-url="null" />
          </div>
          <div class="min-w-0 sm:pt-6">
            <p class="text-xs text-slate-400 font-mono">{{ selected.barcode }}</p>
            <div class="flex items-center gap-2 flex-wrap mt-1">
              <span class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">PENDIENTE</span>
              <span class="text-[11px] text-slate-500">Propuesto por {{ selected.tenant_name || 'tienda desconocida' }} · {{ timeAgo(selected.created_at) }}</span>
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
              placeholder="Ej: Pepsi Cola 1.5L"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            />
          </div>

          <BrandSelect v-model="editBrandId" />

          <div>
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Código EAN/UPC</label>
            <div class="flex items-center gap-2 h-9 px-3 text-sm font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-400">
              <Lock class="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span class="truncate">{{ selected.barcode }}</span>
            </div>
          </div>

          <CategoryAsyncSelect v-model="editCategoryId" />

          <div>
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Impuesto (IVA)</label>
            <select
              v-model="editTaxType"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 bg-white dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            >
              <option v-for="opt in TAX_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <!-- Read-only context: what the tenant configured for stock handling -->
          <div class="flex items-center gap-1.5 flex-wrap pt-1">
            <span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-500 border border-slate-200 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-slate-400">
              Venta: {{ selected.sale_unit }}
            </span>
            <span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-500 border border-slate-200 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-slate-400">
              Compra: {{ selected.purchase_unit_name || '—' }} (×{{ selected.default_conversion_factor }})
            </span>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="p-4 border-t border-slate-100 dark:border-white/[0.04] flex gap-3 bg-slate-50/50 dark:bg-white/[0.01]">
          <button
            @click="handleApprove"
            :disabled="actionLoading || !editName.trim()"
            class="flex-1 h-11 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Loader2 v-if="actionLoading" class="w-4 h-4 animate-spin" />
            <span v-else>✅</span>
            Aprobar e Integrar a Banco Global
          </button>
          <button
            @click="handleReject"
            :disabled="actionLoading"
            class="h-11 px-5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            ❌ Rechazar
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
import { Search, Package, Loader2, Lock } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import { useNotify } from '@/composables/useNotify';
import Swal from 'sweetalert2';
import CategoryAsyncSelect from '@/views/admin/staff/products/CategoryAsyncSelect.vue';
import BrandSelect from './BrandSelect.vue';
import ProductImageUpload from './ProductImageUpload.vue';

const { fetchApi } = useApi();
const { success, error: notifyError } = useNotify();

// Matches GlobalProduct.TaxType / GlobalProductSubmission.tax_type (apps/products/models.py).
const TAX_TYPE_OPTIONS = [
  { value: 'EXEMPT', label: 'Exento de IVA (E)' },
  { value: 'IVA_16', label: 'IVA General (16%)' },
  { value: 'IVA_8', label: 'IVA Reducido (8%)' },
  { value: 'REDUCIDO', label: 'Reducido / Especial' },
];

interface PendingSubmission {
  id: string;
  barcode: string;
  name: string;
  category_name: string;
  tax_type: string;
  sale_unit: string;
  purchase_unit_name: string;
  default_conversion_factor: number;
  tenant_name: string;
  status: string;
  created_at: string;
}

const emit = defineEmits<{
  productCreated: [];
  productModified: [];
}>();

const submissions = ref<PendingSubmission[]>([]);
const selected = ref<PendingSubmission | null>(null);
const loading = ref(true);
const actionLoading = ref(false);
const searchQuery = ref('');

// Edit fields
const editName = ref('');
const editCategoryId = ref<string | number | null>(null);
const editBrandId = ref<string | number | null>(null);
const editTaxType = ref('EXEMPT');
const editImageFile = ref<File | null>(null);

const filteredSubmissions = computed(() => {
  if (!searchQuery.value) return submissions.value;
  const q = searchQuery.value.toLowerCase();
  return submissions.value.filter(
    p => p.name?.toLowerCase().includes(q)
      || p.barcode?.toLowerCase().includes(q)
      || p.tenant_name?.toLowerCase().includes(q),
  );
});

function timeAgo(dateStr: string): string {
  if (!dateStr) return '—';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'ahora mismo';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(dateStr).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function selectSubmission(p: PendingSubmission) {
  selected.value = p;
  editName.value = p.name;
  editCategoryId.value = null; // no category ulid in the list payload — leave as tenant-submitted unless the reviewer picks one
  editBrandId.value = null; // submissions never carry a brand — the reviewer assigns one at approval
  editTaxType.value = p.tax_type || 'EXEMPT';
  editImageFile.value = null;
}

function removeFromList(id: string) {
  submissions.value = submissions.value.filter(p => p.id !== id);
  if (selected.value?.id === id) {
    selected.value = null;
  }
}

function extractErrorMessage(e: any): string {
  const data = e?.data;
  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const val = firstKey ? data[firstKey] : null;
    if (Array.isArray(val) && val.length) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return e?.message || 'Error al procesar la solicitud';
}

async function loadSubmissions() {
  loading.value = true;
  try {
    const data = await fetchApi<any>('/api/v1/admin/global-catalog/submissions/?status=PENDING');
    const results = data?.results || data || [];
    submissions.value = Array.isArray(results) ? results : [];
  } catch (e) {
    submissions.value = [];
  } finally {
    loading.value = false;
  }
}

async function handleApprove() {
  if (!selected.value || !editName.value.trim()) return;
  actionLoading.value = true;
  try {
    const fd = new FormData();
    fd.append('name', editName.value.trim());
    // Omitted entirely (not sent as '') when untouched, so the backend keeps
    // the tenant's originally-submitted category instead of nulling it out.
    if (editCategoryId.value) fd.append('category_id', String(editCategoryId.value));
    fd.append('brand_id', editBrandId.value != null ? String(editBrandId.value) : '');
    fd.append('tax_type', editTaxType.value);
    if (editImageFile.value) fd.append('image', editImageFile.value);

    await fetchApi(`/api/v1/admin/global-catalog/submissions/${selected.value.id}/approve/`, {
      method: 'POST',
      data: fd,
    });
    success('Producto incorporado al Banco Global exitosamente');
    removeFromList(selected.value.id);
    emit('productModified');
  } catch (e: any) {
    notifyError(extractErrorMessage(e));
  } finally {
    actionLoading.value = false;
  }
}

function handleReject() {
  if (!selected.value) return;
  const submissionId = selected.value.id;
  Swal.fire({
    title: 'Rechazar producto',
    input: 'textarea',
    inputLabel: 'Motivo de rechazo',
    inputPlaceholder: 'Ej: Nomenclatura incorrecta o producto duplicado',
    inputAttributes: { 'aria-label': 'Motivo de rechazo' },
    showCancelButton: true,
    confirmButtonText: 'Rechazar',
    confirmButtonColor: '#dc2626',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => (!value || !value.trim() ? 'Debes escribir un motivo de rechazo' : null),
  }).then(async (result) => {
    if (!result.isConfirmed || !result.value?.trim()) return;
    actionLoading.value = true;
    try {
      await fetchApi(`/api/v1/admin/global-catalog/submissions/${submissionId}/reject/`, {
        method: 'POST',
        data: { reason: result.value.trim() },
      });
      success('Solicitud rechazada.');
      removeFromList(submissionId);
      emit('productModified');
    } catch (e: any) {
      notifyError(extractErrorMessage(e));
    } finally {
      actionLoading.value = false;
    }
  });
}

onMounted(() => {
  loadSubmissions();
});
</script>
