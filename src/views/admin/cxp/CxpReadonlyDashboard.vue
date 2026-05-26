<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useCurrency } from '@/lib/currency';
import { toast } from 'vue3-toastify';
import { X, Plus, Clock, Building2, TrendingDown, Eye } from 'lucide-vue-next';

const { fetchApi } = useApi();
const { formatAmount } = useCurrency();

const loading = ref(true);
const debts = ref<any[]>([]);
const kpi = ref({ total_pending: 0, overdue_count: 0, due_in_7_days: 0, total_pending_amount: 0 });
const statusFilter = ref('UNPAID');
const showCreateModal = ref(false);
const saving = ref(false);
const showDetailModal = ref(false);
const detailDebt = ref<any>(null);
const detailPayments = ref<any[]>([]);
const detailLoading = ref(false);

async function loadData() {
  loading.value = true;
  try {
    const d: any = await fetchApi(`/api/v1/cxp/debts/?status=${statusFilter.value}`);
    debts.value = d?.debts || [];
    kpi.value = d || {};
  } catch (e) { toast.error('Error al cargar datos'); }
  finally { loading.value = false; }
}

async function openDetail(debt: any) {
  showDetailModal.value = true; detailLoading.value = true; detailDebt.value = debt; detailPayments.value = [];
  try { const d: any = await fetchApi(`/api/v1/cxp/debts/${debt.id}/detail/`); detailDebt.value = d; detailPayments.value = d?.payments || []; }
  catch (e) { toast.error('Error al cargar detalle'); } finally { detailLoading.value = false; }
}
function closeDetail() { showDetailModal.value = false; detailDebt.value = null; detailPayments.value = []; }
function openCreate() { showCreateModal.value = true; }

const createForm = ref({ provider_name: '', invoice_number: '', total_amount: 0, currency_code: 'VES', due_date: '' });

async function submitCreate() {
  saving.value = true;
  try { await fetchApi('/api/v1/cxp/debts/', { method: 'POST', data: createForm.value }); toast.success('Deuda registrada'); showCreateModal.value = false; await loadData(); }
  catch (e) { toast.error('Error al guardar'); } finally { saving.value = false; }
}

onMounted(loadData);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8 space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Cuentas por Pagar</h2>
        <p class="text-sm text-slate-400 mt-1">Deudas registradas con proveedores</p>
      </div>
      <button @click="openCreate" class="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium text-white bg-cyan-600 rounded-xl hover:bg-cyan-700"><Plus class="h-4 w-4" /> Nueva Deuda</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="flex items-center gap-2 mb-2"><TrendingDown class="h-4 w-4 text-rose-500" /><span class="text-xs font-medium text-slate-500">Total Pendiente</span></div>
        <div class="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{{ formatAmount(kpi.total_pending, 'USD') }}</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="flex items-center gap-2 mb-2"><Clock class="h-4 w-4 text-amber-500" /><span class="text-xs font-medium text-slate-500">Vencidas</span></div>
        <div class="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{{ kpi.overdue_count }} facturas</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="flex items-center gap-2 mb-2"><Building2 class="h-4 w-4 text-blue-500" /><span class="text-xs font-medium text-slate-500">Próx. 7 días</span></div>
        <div class="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">{{ kpi.due_in_7_days }} facturas</div>
      </div>
    </div>

    <div><select v-model="statusFilter" @change="loadData" class="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
      <option value="UNPAID">Pendientes</option><option value="PARTIALLY_PAID">Parcialmente Pagadas</option><option value="PAID">Pagadas</option><option value="">Todas</option>
    </select></div>

    <div v-if="loading" class="text-center py-12 text-sm text-slate-400">Cargando...</div>
    <div v-else-if="debts.length === 0" class="text-center py-16 rounded-2xl border border-dashed border-slate-200"><p class="text-sm text-slate-400">No hay deudas registradas</p></div>

    <div v-else class="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.06]">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 dark:bg-white/[0.04] text-left"><tr>
          <th class="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Proveedor</th><th class="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Factura</th><th class="px-4 py-3 font-medium text-slate-500 text-right whitespace-nowrap">Total</th><th class="px-4 py-3 font-medium text-slate-500 text-right whitespace-nowrap">Restante</th><th class="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Vence</th><th class="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Estado</th><th class="px-4 py-3 font-medium text-slate-500 text-right whitespace-nowrap"></th>
        </tr></thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="d in debts" :key="d.id" class="hover:bg-slate-50 transition-colors">
            <td class="px-4 py-3 font-medium text-slate-900">{{ d.provider_name }}</td>
            <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ d.invoice_number }}</td>
            <td class="px-4 py-3 text-right font-mono text-slate-700">{{ formatAmount(d.total_amount, d.currency_code) }}</td>
            <td class="px-4 py-3 text-right font-mono font-semibold text-slate-900">{{ formatAmount(d.remaining_balance, d.currency_code) }}</td>
            <td class="px-4 py-3 text-xs" :class="new Date(d.due_date) < new Date() && d.status !== 'PAID' ? 'text-red-500 font-medium' : 'text-slate-500'">{{ d.due_date }}</td>
            <td class="px-4 py-3"><span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', d.status==='PAID'?'bg-emerald-50 text-emerald-700':d.status==='PARTIALLY_PAID'?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-600']">{{ d.status }}</span></td>
            <td class="px-4 py-3 text-right"><button @click="openDetail(d)" class="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"><Eye class="h-3.5 w-3.5" /> Ver Detalle</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body"><div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showCreateModal=false"><div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md"><div class="flex items-center justify-between border-b px-6 py-4"><h3 class="text-lg font-semibold">Nueva Deuda</h3><button @click="showCreateModal=false"><X class="h-5 w-5 text-slate-400" /></button></div><div class="p-6 space-y-4"><div><label>Proveedor</label><input v-model="createForm.provider_name" class="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" /></div><div><label>N° Factura</label><input v-model="createForm.invoice_number" class="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" /></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label>Monto</label><input v-model.number="createForm.total_amount" type="number" class="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" /></div><div><label>Moneda</label><select v-model="createForm.currency_code" class="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm"><option value="VES">VES</option><option value="USD">USD</option></select></div></div><div><label>Vence</label><input v-model="createForm.due_date" type="date" class="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" /></div></div><div class="border-t px-6 py-4 flex items-center justify-end gap-3 flex-wrap"><button @click="showCreateModal=false" class="h-9 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg">Cancelar</button><button @click="submitCreate" :disabled="saving" class="h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg disabled:opacity-50">Registrar</button></div></div></div></Teleport>

    <Teleport to="body"><div v-if="showDetailModal && detailDebt" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closeDetail"><div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg"><div class="flex items-center justify-between border-b px-6 py-4"><h3 class="text-lg font-semibold">Detalle de Deuda</h3><button @click="closeDetail"><X class="h-5 w-5 text-slate-400" /></button></div><div class="p-6 space-y-4">
      <div v-if="detailLoading" class="text-center py-6 text-sm text-slate-400">Cargando...</div>
      <template v-else><div class="rounded-xl bg-slate-50 p-4 space-y-2">
        <div class="flex justify-between"><span class="text-sm text-slate-500">Proveedor</span><span>{{ detailDebt.provider_name }}</span></div>
        <div class="flex justify-between"><span class="text-sm text-slate-500">Factura</span><span class="font-mono">{{ detailDebt.invoice_number }}</span></div>
        <div class="flex justify-between"><span class="text-sm text-slate-500">Total</span><span class="font-bold">{{ formatAmount(detailDebt.total_amount, detailDebt.currency_code) }}</span></div>
        <div class="flex justify-between"><span class="text-sm text-slate-500">Pagado</span><span class="font-semibold text-emerald-600">{{ formatAmount(detailDebt.total_amount - detailDebt.remaining_balance, detailDebt.currency_code) }}</span></div>
        <div class="flex justify-between"><span class="text-sm text-slate-500">Restante</span><span class="font-bold text-rose-600">{{ formatAmount(detailDebt.remaining_balance, detailDebt.currency_code) }}</span></div>
        <div class="flex justify-between"><span class="text-sm text-slate-500">Vence</span><span :class="new Date(detailDebt.due_date) < new Date() && detailDebt.status !== 'PAID' ? 'text-red-500' : ''">{{ detailDebt.due_date }}</span></div>
        <div class="flex justify-between"><span class="text-sm text-slate-500">Estado</span><span>{{ detailDebt.status }}</span></div>
      </div>
      <h4 class="font-semibold mt-4">Historial de Pagos</h4>
      <div v-if="detailPayments.length === 0" class="text-sm text-slate-400 py-3 text-center">Sin abonos registrados</div>
      <div v-else class="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin"><div v-for="p in detailPayments" :key="p.id" class="rounded-lg border border-slate-100 bg-white px-4 py-3"><div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span class="font-semibold font-mono">{{ formatAmount(p.amount_to_pay, detailDebt.currency_code) }}</span>
        <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', p.status==='APPROVED'?'bg-emerald-50 text-emerald-700':p.status==='REJECTED'?'bg-red-50 text-red-600':'bg-amber-50 text-amber-700']">{{ p.status === 'APPROVED' ? 'Aprobado' : p.status === 'REJECTED' ? 'Rechazado' : 'Pendiente' }}</span>
      </div>
      <div class="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        <span>{{ p.requested_by_name }} · {{ new Date(p.created_at).toLocaleString('es-VE') }}</span>
        <span v-if="p.payment_method_name" class="text-slate-500">· {{ p.payment_method_name }}</span>
      </div>
      <div v-if="p.amount_in_vault_currency && p.vault_currency && p.vault_currency !== detailDebt.currency_code" class="flex flex-wrap gap-3 text-xs mt-1.5">
        <span class="text-slate-600">Débito: <strong class="font-mono">{{ formatAmount(p.amount_in_vault_currency, p.vault_currency) }}</strong></span>
        <span class="text-slate-400">(Amortizó: {{ formatAmount(p.amount_to_pay, detailDebt.currency_code) }})</span>
        <span v-if="p.exchange_rate_used" class="text-slate-400">Tasa: {{ p.exchange_rate_used.toFixed(4) }}</span>
      </div>
      <p v-if="p.rejection_reason" class="text-xs text-red-400 mt-1">Motivo: {{ p.rejection_reason }}</p>
      </div></div>
      </template>
    </div></div></div></Teleport>
  </div>
</template>
