<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-vue-next';
import { useCustomers, type Customer } from '@/composables/useCustomers';
import { useNotify } from '@/composables/useNotify';
import CustomerFormModal from './CustomerFormModal.vue';

const { customers, loading, error, fetchCustomers, deleteCustomer } = useCustomers();
const { success, error: notifyError } = useNotify();

// ── Búsqueda con debounce ──
const searchQuery = ref('');
let searchTimer: ReturnType<typeof setTimeout> | null = null;
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchCustomers(searchQuery.value), 350);
}

// ── Modal crear/editar ──
const showFormModal = ref(false);
const editingCustomer = ref<Customer | null>(null);

function openCreate() {
  editingCustomer.value = null;
  showFormModal.value = true;
}
function openEdit(customer: Customer) {
  editingCustomer.value = customer;
  showFormModal.value = true;
}
function closeForm() {
  showFormModal.value = false;
  editingCustomer.value = null;
}
function onSaved(_customer: Customer) {
  success(editingCustomer.value ? 'Cliente actualizado' : 'Cliente creado');
  closeForm();
  fetchCustomers(searchQuery.value);
}

// ── Eliminar ──
const deleteTarget = ref<Customer | null>(null);
const deleting = ref(false);

function askDelete(customer: Customer) {
  deleteTarget.value = customer;
}
function cancelDelete() {
  deleteTarget.value = null;
}
async function confirmDelete() {
  if (!deleteTarget.value) return;
  deleting.value = true;
  const ok = await deleteCustomer(deleteTarget.value.id);
  deleting.value = false;
  if (ok) {
    success('Cliente eliminado');
    deleteTarget.value = null;
  } else {
    notifyError(error.value || 'No se pudo eliminar el cliente');
  }
}

// ── Formato / helpers de tabla ──
function fullName(c: Customer): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || '—';
}
function formatUSD(value: string | number): string {
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function isSolvent(c: Customer): boolean {
  const balance = Number(c.saldo_deudor_usd);
  const limit = Number(c.credit_limit_usd);
  if (balance <= 0) return true;
  return limit > 0 && balance <= limit;
}

onMounted(() => {
  fetchCustomers();
});
</script>

<template>
  <div class="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
    <!-- Cabecera -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-lg font-black text-slate-800 dark:text-white">Gestión de Clientes</h1>
        <p class="text-xs text-slate-400">Datos de contacto, crédito y estado de cuenta</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
      >
        <Plus :size="16" /> Nuevo Cliente
      </button>
    </div>

    <!-- Buscador -->
    <div class="relative max-w-md">
      <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        v-model="searchQuery"
        @input="onSearchInput"
        type="text"
        placeholder="Buscar por RIF/CI, nombre, teléfono o email…"
        class="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141824] text-sm text-slate-700 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
      />
    </div>

    <!-- Tabla -->
    <div class="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141824] overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-400">
              <th class="text-left font-bold px-3 py-2.5">Documento</th>
              <th class="text-left font-bold px-3 py-2.5">Nombre / Razón Social</th>
              <th class="text-left font-bold px-3 py-2.5">Teléfono</th>
              <th class="text-left font-bold px-3 py-2.5">Email</th>
              <th class="text-right font-bold px-3 py-2.5">Límite Crédito</th>
              <th class="text-right font-bold px-3 py-2.5">Deuda Actual</th>
              <th class="text-center font-bold px-3 py-2.5">Estado</th>
              <th class="text-right font-bold px-3 py-2.5">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <tr v-if="loading">
              <td colspan="8" class="px-3 py-10 text-center text-slate-400">
                <Loader2 :size="20" class="animate-spin inline-block" />
              </td>
            </tr>
            <tr v-else-if="customers.length === 0">
              <td colspan="8" class="px-3 py-10 text-center text-slate-400">
                {{ searchQuery ? 'No hay clientes que coincidan con la búsqueda' : 'Aún no hay clientes registrados' }}
              </td>
            </tr>
            <tr v-else v-for="c in customers" :key="c.id" class="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
              <td class="px-3 py-2.5 font-mono font-semibold text-slate-700 dark:text-slate-200">{{ c.identity_document }}</td>
              <td class="px-3 py-2.5 text-slate-700 dark:text-white font-medium truncate max-w-[200px]">{{ fullName(c) }}</td>
              <td class="px-3 py-2.5 text-slate-500 dark:text-slate-400">{{ c.phone || '—' }}</td>
              <td class="px-3 py-2.5 text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{{ c.email || '—' }}</td>
              <td class="px-3 py-2.5 text-right font-mono text-slate-600 dark:text-slate-300">${{ formatUSD(c.credit_limit_usd) }}</td>
              <td class="px-3 py-2.5 text-right font-mono font-semibold" :class="Number(c.saldo_deudor_usd) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'">
                ${{ formatUSD(c.saldo_deudor_usd) }}
              </td>
              <td class="px-3 py-2.5 text-center">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                  :class="isSolvent(c)
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'"
                >{{ isSolvent(c) ? 'Solvente' : 'Moroso' }}</span>
              </td>
              <td class="px-3 py-2.5">
                <div class="flex justify-end gap-1">
                  <button @click="openEdit(c)"
                    class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors"
                    title="Editar">
                    <Pencil :size="14" />
                  </button>
                  <button @click="askDelete(c)"
                    class="w-7 h-7 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    title="Eliminar">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal crear/editar -->
    <CustomerFormModal
      v-if="showFormModal"
      :customer="editingCustomer"
      @close="closeForm"
      @saved="onSaved"
    />

    <!-- Confirmación de eliminación -->
    <div v-if="deleteTarget" class="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4" @click.self="cancelDelete">
      <div class="bg-white dark:bg-[#141824] w-full max-w-sm rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/80 dark:border-white/[0.08] p-4 space-y-3">
        <div>
          <h3 class="text-sm font-black text-slate-800 dark:text-white">Eliminar cliente</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">
            ¿Eliminar a <strong class="text-slate-600 dark:text-slate-300">{{ fullName(deleteTarget) }}</strong> ({{ deleteTarget.identity_document }})? Esta acción no se puede deshacer.
          </p>
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <button @click="cancelDelete" :disabled="deleting"
            class="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-colors">
            Cancelar
          </button>
          <button @click="confirmDelete" :disabled="deleting"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors">
            <Loader2 v-if="deleting" :size="14" class="animate-spin" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
