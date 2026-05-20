<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { toast } from 'vue3-toastify';
import { Plus, Pencil, X, Loader2, Wallet, Power } from 'lucide-vue-next';
import Swal from 'sweetalert2';

interface VaultTpl {
  id: number;
  code: string;
  name: string;
  vault_type: string;
  description: string;
  default_currency: string;
  is_active: boolean;
  sort_order: number;
}

const LABELS: Record<string, string> = {
  CASH: 'Efectivo', BANK: 'Banco', SAFE: 'Caja Fuerte', TERMINAL: 'Terminal',
  MOBILE: 'Móvil', PETTY: 'Caja Chica', CRYPTO: 'Cripto', CUSTOM: 'Personalizado',
  DIGITAL: 'Billetera Digital', PLATFORM: 'Plataforma',
};

const { fetchApi } = useApi();

const loading = ref(true);
const saving = ref(false);
const templates = ref<VaultTpl[]>([]);
const showModal = ref(false);
const editing = ref<VaultTpl | null>(null);
const form = ref({
  code: '',
  name: '',
  vault_type: 'CASH',
  description: '',
  default_currency: 'VES',
  sort_order: 0,
});

async function loadData() {
  loading.value = true;
  try {
    const response: any = await fetchApi('/api/v1/vaults/?is_template=true');
    templates.value = response?.results || response || [];
  } catch (e) {
    toast.error('Error al cargar plantillas');
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  form.value = { code: '', name: '', vault_type: 'CASH', description: '', default_currency: 'VES', sort_order: 0 };
  showModal.value = true;
}

function openEdit(tpl: VaultTpl) {
  editing.value = tpl;
  form.value = {
    code: tpl.code,
    name: tpl.name,
    vault_type: tpl.vault_type,
    description: tpl.description,
    default_currency: tpl.default_currency,
    sort_order: tpl.sort_order,
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function toggleTemplate(tpl: VaultTpl) {
  const action = tpl.is_active ? 'desactivar' : 'activar';
  const result = await Swal.fire({
    title: `¿${action} plantilla?`,
    text: `"${tpl.name || tpl.code}"`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: action.charAt(0).toUpperCase() + action.slice(1),
    cancelButtonText: 'Cancelar',
    confirmButtonColor: tpl.is_active ? '#f59e0b' : '#10b981',
  });
  if (!result.isConfirmed) return;

  try {
    await fetchApi(`/api/v1/vaults/${tpl.id}/`, { method: 'PATCH', data: { is_active: !tpl.is_active } });
    toast.success(tpl.is_active ? 'Desactivada' : 'Activada');
    await loadData();
  } catch (e) {
    toast.error('Error al cambiar estado');
  }
}

async function saveTemplate() {
  saving.value = true;
  try {
    const payload = { ...form.value, is_template: true };
    if (editing.value) {
      await fetchApi(`/api/v1/vaults/${editing.value.id}/`, { method: 'PATCH', data: payload });
      toast.success('Plantilla actualizada');
    } else {
      await fetchApi('/api/v1/vaults/', { method: 'POST', data: payload });
      toast.success('Plantilla creada');
    }
    closeModal();
    await loadData();
  } catch (e) {
    toast.error('Error al guardar');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Plantillas de Bóveda</h2>
        <p class="text-sm text-slate-500">{{ templates.length }} plantillas</p>
      </div>
      <button @click="openCreate" class="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors">
        <Plus class="h-4 w-4" /> Nueva Plantilla
      </button>
    </div>

    <div v-if="loading" class="text-center py-12">
      <Loader2 class="mx-auto h-6 w-6 animate-spin text-slate-400" />
    </div>

    <div v-else-if="templates.length === 0" class="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08]">
      <Wallet class="mx-auto h-10 w-10 text-slate-400 mb-4" />
      <p class="text-slate-500">No hay plantillas de bóveda.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="t in templates" :key="t.id" class="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h4 class="font-semibold text-slate-900 dark:text-white">{{ t.name || t.code }}</h4>
            <p class="text-xs text-slate-500">{{ t.code }}</p>
          </div>
          <button @click="toggleTemplate(t)" :class="['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', t.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400']">
            <Power class="h-3 w-3 mr-1" />{{ t.is_active ? 'Activo' : 'Inactivo' }}
          </button>
        </div>
        <p class="text-sm text-slate-500 mb-3">{{ LABELS[t.vault_type] || t.vault_type }} · {{ t.default_currency }}</p>
        <button @click="openEdit(t)" class="w-full inline-flex items-center justify-center gap-1 h-9 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.08] dark:hover:bg-white/[0.06]">
          <Pencil class="h-4 w-4" /> Editar
        </button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ editing ? 'Editar' : 'Nueva' }} Plantilla</h2>
          <button @click="closeModal" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-300">
            <X class="h-5 w-5" />
          </button>
        </div>
        <form @submit.prevent="saveTemplate" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código <span class="text-red-500">*</span></label>
              <input v-model="form.code" required class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre <span class="text-red-500">*</span></label>
              <input v-model="form.name" required class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
              <select v-model="form.vault_type" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
                <option v-for="(label, code) in LABELS" :key="code" :value="code">{{ label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Moneda</label>
              <select v-model="form.default_currency" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
                <option value="VES">Bolívar (VES)</option>
                <option value="USD">Dólar (USD)</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="closeModal" class="h-9 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.08] dark:hover:bg-white/[0.06]">
              Cancelar
            </button>
            <button type="submit" :disabled="saving" class="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 dark:bg-cyan-600 dark:hover:bg-cyan-700">
              <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
              <span v-else>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
