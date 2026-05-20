<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { toast } from 'vue3-toastify';
import { Plus, Pencil, X, Loader2, Building2, Power } from 'lucide-vue-next';
import Swal from 'sweetalert2';

interface Bank {
  id: number;
  name: string;
  business_name: string;
  country_code: string;
  bank_code: string;
  swift_bic: string;
  is_active: boolean;
  sort_order: number;
}

const { fetchApi } = useApi();

const loading = ref(true);
const saving = ref(false);
const banks = ref<Bank[]>([]);
const showModal = ref(false);
const editingBank = ref<Bank | null>(null);
const form = ref({
  name: '',
  business_name: '',
  country_code: 'VE',
  bank_code: '',
  swift_bic: '',
  sort_order: 0,
});

async function loadBanks() {
  loading.value = true;
  try {
    const response: any = await fetchApi('/api/v1/staff/financial-entities/');
    // DRF paginated response: { count, results: [...] }
    banks.value = response?.results || response || [];
  } catch (e) {
    toast.error('Error al cargar bancos');
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingBank.value = null;
  form.value = {
    name: '',
    business_name: '',
    country_code: 'VE',
    bank_code: '',
    swift_bic: '',
    sort_order: 0,
  };
  showModal.value = true;
}

function openEdit(bank: Bank) {
  editingBank.value = bank;
  form.value = {
    name: bank.name,
    business_name: bank.business_name,
    country_code: bank.country_code,
    bank_code: bank.bank_code,
    swift_bic: bank.swift_bic,
    sort_order: bank.sort_order,
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function toggleBank(bank: Bank) {
  const action = bank.is_active ? 'desactivar' : 'activar';
  const result = await Swal.fire({
    title: `¿${action} banco?`,
    text: `"${bank.name}"`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: action.charAt(0).toUpperCase() + action.slice(1),
    cancelButtonText: 'Cancelar',
    confirmButtonColor: bank.is_active ? '#f59e0b' : '#10b981',
  });
  if (!result.isConfirmed) return;

  try {
    await fetchApi(`/api/v1/staff/financial-entities/${bank.id}/toggle/`, { method: 'POST' });
    toast.success(bank.is_active ? 'Desactivado' : 'Activado');
    await loadBanks();
  } catch (e) {
    toast.error('Error al cambiar estado');
  }
}

async function saveBank() {
  saving.value = true;
  try {
    if (editingBank.value) {
      await fetchApi(`/api/v1/staff/financial-entities/${editingBank.value.id}/`, {
        method: 'PATCH',
        data: form.value,
      });
      toast.success('Entidad actualizada');
    } else {
      await fetchApi('/api/v1/staff/financial-entities/', {
        method: 'POST',
        data: form.value,
      });
      toast.success('Entidad creada');
    }
    closeModal();
    await loadBanks();
  } catch (e) {
    toast.error('Error al guardar');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadBanks();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Entidades Bancarias</h2>
        <p class="text-sm text-slate-500">{{ banks.length }} bancos</p>
      </div>
      <button @click="openCreate" class="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors">
        <Plus class="h-4 w-4" /> Agregar Banco
      </button>
    </div>

    <div v-if="loading" class="text-center py-12">
      <Loader2 class="mx-auto h-6 w-6 animate-spin text-slate-400" />
    </div>

    <div v-else-if="banks.length === 0" class="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08]">
      <Building2 class="mx-auto h-10 w-10 text-slate-400 mb-4" />
      <p class="text-slate-500">No hay entidades bancarias.</p>
    </div>

    <div v-else class="overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.06]">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 dark:bg-[#1a1f2e]">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Banco</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase hidden sm:table-cell">Código</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Estado</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <tr v-for="b in banks" :key="b.id" class="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
            <td class="px-4 py-3">
              <div class="font-medium text-slate-900 dark:text-white">{{ b.name }}</div>
              <div class="text-xs text-slate-500">{{ b.business_name || b.name }}</div>
            </td>
            <td class="px-4 py-3 text-slate-500 hidden sm:table-cell">{{ b.bank_code }}</td>
            <td class="px-4 py-3 text-center">
              <button @click="toggleBank(b)" :class="['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', b.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400']">
                <Power class="h-3 w-3 mr-1" />{{ b.is_active ? 'Activo' : 'Inactivo' }}
              </button>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button @click="openEdit(b)" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.06]">
                  <Pencil class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ editingBank ? 'Editar' : 'Nuevo' }} Banco</h2>
          <button @click="closeModal" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-300">
            <X class="h-5 w-5" />
          </button>
        </div>
        <form @submit.prevent="saveBank" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre corto <span class="text-red-500">*</span></label>
            <input v-model="form.name" required class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" placeholder="Ej: Banesco" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Razón social</label>
            <input v-model="form.business_name" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" placeholder="Banesco Banco Universal" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código (4 díg.)</label>
              <input v-model="form.bank_code" maxlength="4" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" placeholder="0134" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SWIFT/BIC</label>
              <input v-model="form.swift_bic" maxlength="11" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" placeholder="UNIOVECA" />
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
