<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useCurrency } from '@/lib/currency';
import { toast } from 'vue3-toastify';
import { X, Plus, Clock, TrendingUp, Eye, Banknote } from 'lucide-vue-next';

const { fetchApi } = useApi();
const { formatAmount } = useCurrency();

const loading = ref(true);
const debts = ref<any[]>([]);
const kpi = ref({ total_pending: 0, overdue_count: 0 });
const statusFilter = ref('UNPAID');
const showCreateModal = ref(false);
const saving = ref(false);
const showDetailModal = ref(false);
const detailDebt = ref<any>(null);
const detailPayments = ref<any[]>([]);
const detailLoading = ref(false);

// Pay modal
const showPayModal = ref(false);
const payingDebt = ref<any>(null);
const payAmount = ref(0);
const paymentInstances = ref<any[]>([]);
const selectedInstanceId = ref<number | null>(null);
const exchangeRate = ref(0);

const selectedInstance = computed(() => paymentInstances.value.find((i: any) => i.id === selectedInstanceId.value) || null);
const debtCur = computed(() => payingDebt.value?.currency_code || 'VES');
const vaultCur = computed(() => selectedInstance.value?.vault_currency || 'VES');
const isCrossCurrency = computed(() => debtCur.value !== vaultCur.value);
const amortizationLabel = computed(() => {
  if (!isCrossCurrency.value || !exchangeRate.value || !payAmount.value) return '';
  if (debtCur.value === 'USD' && vaultCur.value === 'VES')
    return `Recibe: ${formatAmount(payAmount.value, 'VES')} → amortiza ${formatAmount(payAmount.value / exchangeRate.value, 'USD')} de la deuda`;
  if (debtCur.value === 'VES' && vaultCur.value === 'USD')
    return `Cliente entrega: ${formatAmount(payAmount.value, 'USD')} → amortiza ${formatAmount(payAmount.value * exchangeRate.value, 'VES')} de la deuda`;
  return '';
});

async function loadData() {
  loading.value = true;
  try {
    const d: any = await fetchApi(`/api/v1/cxc/debts/?status=${statusFilter.value}`);
    debts.value = d?.results || d?.debts || []; kpi.value = d || {};
    const pi: any = await fetchApi('/api/v1/treasury/payment-instances/?active=true');
    paymentInstances.value = (pi?.instances || []).filter((i: any) => i.vault_id).map((i: any) => ({
      id: i.id, name: `${i.label || i.blueprint_name} (${i.vault_label || ''})`, vault_currency: i.currency_code || '',
    }));
  } catch (e) { toast.error('Error'); } finally { loading.value = false; }
}

async function openDetail(debt: any) {
  showDetailModal.value = true; detailLoading.value = true;
  try { const d: any = await fetchApi(`/api/v1/cxc/debts/${debt.id}/detail/`); detailDebt.value = d; detailPayments.value = d?.payments || []; }
  catch (e) { toast.error('Error'); } finally { detailLoading.value = false; }
}
function closeDetail() { showDetailModal.value = false; detailDebt.value = null; detailPayments.value = []; }
function openCreate() { showCreateModal.value = true; }
function closePay() { showPayModal.value = false; }

async function openPay(debt: any) {
  payingDebt.value = debt; payAmount.value = debt.remaining_balance; selectedInstanceId.value = null; exchangeRate.value = 0; showPayModal.value = true;
  try { const fx: any = await fetchApi('/api/v1/forex/rate/'); if (fx?.rate) exchangeRate.value = fx.rate; } catch (_) { }
}

async function submitPay() {
  if (!payAmount.value || payAmount.value <= 0) { toast.info('Ingresa un monto'); return; }
  if (!selectedInstanceId.value) { toast.info('Selecciona un método de cobro'); return; }
  saving.value = true;
  try {
    const payload: any = { debt_id: payingDebt.value.id, amount_received: payAmount.value, payment_instance_id: selectedInstanceId.value };
    if (isCrossCurrency.value && exchangeRate.value > 0) payload.exchange_rate_used = exchangeRate.value;
    await fetchApi('/api/v1/cxc/debts/collect/', { method: 'POST', data: payload });
    toast.success('Cobro registrado con éxito'); closePay(); await loadData();
  } catch (e: any) { toast.error(e?.data?.error || 'Error'); } finally { saving.value = false; }
}

const createForm = ref({ customer_name: '', reference_invoice: '', total_amount: 0, currency_code: 'VES', due_date: '' });
async function submitCreate() {
  saving.value = true;
  try { await fetchApi('/api/v1/cxc/debts/', { method: 'POST', data: createForm.value }); toast.success('Crédito registrado'); showCreateModal.value = false; await loadData(); }
  catch (e) { toast.error('Error'); } finally { saving.value = false; }
}

onMounted(loadData);
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 gap-4"><div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-[#141824]"><div class="flex items-center gap-2 mb-2"><TrendingUp class="h-4 w-4 text-emerald-500" /><span class="text-xs font-medium text-slate-500">Total Pendiente</span></div><div class="text-xl font-bold font-mono text-emerald-600">{{ formatAmount(kpi.total_pending, 'USD') }}</div></div><div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-[#141824]"><div class="flex items-center gap-2 mb-2"><Clock class="h-4 w-4 text-amber-500" /><span class="text-xs font-medium text-slate-500">Vencidas</span></div><div class="text-xl font-bold font-mono text-amber-600">{{ kpi.overdue_count }} facturas</div></div></div>
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Cuentas por Cobrar</h3>
      <div class="flex items-center gap-3"><select v-model="statusFilter" @change="loadData" class="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white"><option value="UNPAID">Pendientes</option><option value="PARTIALLY_PAID">Abonadas</option><option value="PAID">Liquidadas</option><option value="">Todas</option></select><button @click="openCreate" class="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-white bg-cyan-600 rounded-xl hover:bg-cyan-700"><Plus class="h-4 w-4" /> Nuevo Crédito</button></div>
    </div>
    <div v-if="loading" class="text-center py-12 text-sm text-slate-400">Cargando...</div>
    <div v-else-if="debts.length === 0" class="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08]"><p class="text-sm text-slate-400">No hay créditos</p></div>
    <div v-else class="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.06]">
      <table class="w-full text-sm"><thead class="bg-slate-50 dark:bg-white/[0.04] text-left"><tr><th class="px-4 py-3 font-medium text-slate-500">Cliente</th><th class="px-4 py-3 font-medium text-slate-500">Factura</th><th class="px-4 py-3 font-medium text-slate-500 text-right">Total</th><th class="px-4 py-3 font-medium text-slate-500 text-right">Saldo</th><th class="px-4 py-3 font-medium text-slate-500">Vence</th><th class="px-4 py-3 font-medium text-slate-500">Estado</th><th class="px-4 py-3 font-medium text-slate-500 text-right"></th></tr></thead>
        <tbody class="divide-y divide-slate-100 dark:divide-white/[0.04]"><tr v-for="d in debts" :key="d.id" class="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
          <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">{{ d.customer_name }}</td>
          <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ d.reference_invoice }}</td>
          <td class="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">{{ formatAmount(d.total_amount, d.currency_code) }}</td>
          <td class="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">{{ formatAmount(d.remaining_balance, d.currency_code) }}</td>
          <td class="px-4 py-3 text-xs" :class="new Date(d.due_date) < new Date() && d.status !== 'PAID' ? 'text-red-500 font-medium' : 'text-slate-500'">{{ d.due_date }}</td>
          <td class="px-4 py-3"><span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', d.status==='PAID'?'bg-emerald-50 text-emerald-700':d.status==='PARTIALLY_PAID'?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-600']">{{ d.status }}</span></td>
          <td class="px-4 py-3 text-right"><div class="flex items-center justify-end gap-2"><button @click="openDetail(d)" class="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:bg-transparent dark:border-white/[0.08]"><Eye class="h-3.5 w-3.5" /> Detalle</button><button v-if="d.status !== 'PAID'" @click="openPay(d)" class="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"><Banknote class="h-3.5 w-3.5" /> Cobrar</button></div></td>
        </tr></tbody>
      </table>
    </div>
    <Teleport to="body"><div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showCreateModal=false"><div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md dark:border-white/[0.06] dark:bg-[#141824]"><div class="flex items-center justify-between border-b px-6 py-4"><h3>Nuevo Crédito</h3><button @click="showCreateModal=false"><X class="h-5 w-5" /></button></div><div class="p-6 space-y-4"><div><label>Cliente</label><input v-model="createForm.customer_name" class="w-full h-10 px-3 rounded-lg border text-sm" /></div><div><label>Factura</label><input v-model="createForm.reference_invoice" class="w-full h-10 px-3 rounded-lg border text-sm" /></div><div class="grid grid-cols-2 gap-3"><div><label>Monto</label><input v-model.number="createForm.total_amount" type="number" class="w-full h-10 px-3 rounded-lg border text-sm" /></div><div><label>Moneda</label><select v-model="createForm.currency_code" class="w-full h-10 px-3 rounded-lg border text-sm"><option value="VES">VES</option><option value="USD">USD</option></select></div></div><div><label>Vence</label><input v-model="createForm.due_date" type="date" class="w-full h-10 px-3 rounded-lg border text-sm" /></div></div><div class="border-t px-6 py-4 flex justify-end gap-3"><button class="h-9 px-4 text-sm font-medium border rounded-lg">Cancelar</button><button @click="submitCreate" :disabled="saving" class="h-9 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg disabled:opacity-50">Registrar</button></div></div></div></Teleport>
    <Teleport to="body"><div v-if="showDetailModal && detailDebt" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closeDetail"><div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg dark:border-white/[0.06] dark:bg-[#141824]"><div class="flex items-center justify-between border-b px-6 py-4"><h3>Detalle CXC</h3><button @click="closeDetail"><X class="h-5 w-5" /></button></div><div class="p-6 space-y-4">
      <div v-if="detailLoading" class="text-center py-6 text-sm text-slate-400">Cargando...</div>
      <template v-else><div class="rounded-xl bg-slate-50 dark:bg-white/[0.04] p-4 space-y-2">
        <div class="flex justify-between"><span class="text-sm text-slate-500">Cliente</span><span>{{ detailDebt.customer_name }}</span></div>
        <div class="flex justify-between"><span class="text-sm text-slate-500">Factura</span><span class="font-mono">{{ detailDebt.reference_invoice }}</span></div>
        <div class="flex justify-between"><span class="text-sm text-slate-500">Total</span><span class="font-bold">{{ formatAmount(detailDebt.total_amount, detailDebt.currency_code) }}</span></div>
        <div class="flex justify-between"><span class="text-sm text-slate-500">Cobrado</span><span class="font-semibold text-emerald-600">{{ formatAmount(detailDebt.total_amount - detailDebt.remaining_balance, detailDebt.currency_code) }}</span></div>
        <div class="flex justify-between"><span class="text-sm text-slate-500">Saldo</span><span class="font-bold text-rose-600">{{ formatAmount(detailDebt.remaining_balance, detailDebt.currency_code) }}</span></div>
        <div class="flex justify-between"><span class="text-sm text-slate-500">Vence</span><span :class="new Date(detailDebt.due_date) < new Date() && detailDebt.status !== 'PAID' ? 'text-red-500' : ''">{{ detailDebt.due_date }}</span></div>
        <div class="flex justify-between"><span class="text-sm text-slate-500">Estado</span><span>{{ detailDebt.status }}</span></div>
      </div>
      <h4 class="font-semibold mt-4">Historial de Cobros</h4>
      <div v-if="detailPayments.length === 0" class="text-sm text-slate-400 py-3 text-center">Sin cobros</div>
      <div v-else class="space-y-2 max-h-64 overflow-y-auto pr-1"><div v-for="p in detailPayments" :key="p.id" class="rounded-lg border px-4 py-3"><div class="flex gap-2"><span class="font-semibold font-mono">{{ formatAmount(p.amount_in_vault_currency, p.vault_currency_code) }}</span></div><div v-if="p.vault_currency_code !== detailDebt.currency_code" class="text-xs text-slate-400">Amortizó: {{ formatAmount(p.amount_in_debt_currency, detailDebt.currency_code) }} · Tasa: {{ p.rate_applied?.toFixed(4) }}</div><p class="text-xs text-slate-400 mt-0.5">{{ p.processed_by_name }} · {{ new Date(p.processed_at).toLocaleString('es-VE') }}</p></div></div>
      </template>
    </div></div></div></Teleport>
    <Teleport to="body"><div v-if="showPayModal && payingDebt" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closePay"><div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md dark:border-white/[0.06] dark:bg-[#141824]"><div class="flex items-center justify-between border-b px-6 py-4"><h3>Registrar Cobro</h3><button @click="closePay"><X class="h-5 w-5" /></button></div><div class="p-6 space-y-4">
      <div class="rounded-xl bg-slate-50 dark:bg-white/[0.04] p-4 space-y-2"><div class="flex justify-between"><span class="text-sm text-slate-500">Cliente</span><span class="font-medium">{{ payingDebt.customer_name }}</span></div><div class="flex justify-between"><span class="text-sm text-slate-500">Factura</span><span class="font-mono">{{ payingDebt.reference_invoice }}</span></div><div class="flex justify-between"><span class="text-sm text-slate-500">Saldo</span><span class="font-bold">{{ formatAmount(payingDebt.remaining_balance, payingDebt.currency_code) }}</span></div></div>
      <div><label class="text-sm font-medium mb-1">Monto recibido <span class="text-red-500">*</span></label><input v-model.number="payAmount" type="number" class="w-full h-10 px-3 rounded-lg border text-sm" /></div>
      <div><label class="text-sm font-medium mb-1">Método de Cobro <span class="text-red-500">*</span></label><select v-model="selectedInstanceId" class="w-full h-10 px-3 rounded-lg border text-sm"><option :value="null">Seleccionar...</option><option v-for="pi in paymentInstances" :key="pi.id" :value="pi.id">{{ pi.name }}</option></select></div>
      <div v-if="isCrossCurrency" class="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2"><div><label class="text-xs font-medium mb-1">Tasa de Cambio <span class="text-red-500">*</span></label><input v-model.number="exchangeRate" type="number" step="0.0001" class="w-full h-10 px-3 rounded-lg border text-sm" /></div><div v-if="exchangeRate > 0 && payAmount > 0" class="text-sm bg-white rounded-lg p-3 border border-amber-200">{{ amortizationLabel }}</div></div>
    </div><div class="border-t px-6 py-4 flex items-center justify-end gap-3"><button @click="closePay" class="h-9 px-4 text-sm font-medium border rounded-lg">Cancelar</button><button @click="submitPay" :disabled="saving" class="h-9 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg disabled:opacity-50">Registrar Cobro</button></div></div></div></Teleport>
  </div>
</template>
