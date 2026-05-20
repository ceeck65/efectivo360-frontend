<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useCurrency } from '@/lib/currency';
import { toast } from 'vue3-toastify';
import { X, Plus, Clock, Building2, TrendingDown, Eye, Banknote } from 'lucide-vue-next';

const { fetchApi } = useApi();
const { formatAmount } = useCurrency();

const loading = ref(true);
const debts = ref<any[]>([]);
const kpi = ref({ total_pending: 0, overdue_count: 0, due_in_7_days: 0, total_pending_amount: 0 });
const statusFilter = ref('UNPAID');
const showCreateModal = ref(false);
const saving = ref(false);

// Detail modal
const showDetailModal = ref(false);
const detailDebt = ref<any>(null);
const detailPayments = ref<any[]>([]);
const detailLoading = ref(false);

// Pay modal
const showPayModal = ref(false);
const payingDebt = ref<any>(null);
const payAmount = ref(0);
const selectedBlueprintCode = ref('');
const exchangeRate = ref(0);
const paymentBlueprints = ref<any[]>([]);

const selectedBlueprint = computed(() =>
  paymentBlueprints.value.find((b: any) => b.code === selectedBlueprintCode.value) || null
);
const isCrossCurrency = computed(() => {
  if (!payingDebt.value || !selectedBlueprint.value) return false;
  return payingDebt.value.currency_code !== selectedBlueprint.value.vault_currency;
});
const vaultDeduction = computed(() => {
  if (!isCrossCurrency.value || !exchangeRate.value) return payAmount.value;
  const dc = payingDebt.value.currency_code;
  const vc = selectedBlueprint.value.vault_currency;
  if (dc === 'USD' && vc === 'VES') return payAmount.value * exchangeRate.value;
  if (dc === 'VES' && vc === 'USD') return payAmount.value;
  return payAmount.value * exchangeRate.value;
});
const debtReduction = computed(() => {
  if (!isCrossCurrency.value || !exchangeRate.value) return payAmount.value;
  const dc = payingDebt.value.currency_code;
  const vc = selectedBlueprint.value.vault_currency;
  if (dc === 'USD' && vc === 'VES') return payAmount.value;
  if (dc === 'VES' && vc === 'USD') return payAmount.value * exchangeRate.value;
  return payAmount.value;
});
const conversionLabel = computed(() => {
  if (!isCrossCurrency.value || !exchangeRate.value) return '';
  const dc = payingDebt.value?.currency_code || 'USD';
  const vc = selectedBlueprint.value?.vault_currency || 'VES';
  if (dc === 'VES' && vc === 'USD') {
    return `Abonar ${formatAmount(payAmount.value, vc)} a la tasa ${exchangeRate.value} = se amortizan ${formatAmount(debtReduction.value, dc)} de la deuda en ${dc}`;
  }
  return `Amortizar ${formatAmount(payAmount.value, dc)} a la tasa ${exchangeRate.value} = ${formatAmount(vaultDeduction.value, vc)} de ${selectedBlueprint.value?.name || ''}`;
});

async function loadData() {
  loading.value = true;
  try {
    const d: any = await fetchApi(`/api/v1/cxp/debts/?status=${statusFilter.value}`);
    debts.value = d?.debts || [];
    kpi.value = d || {};
  } catch (e) { toast.error('Error al cargar datos'); }
  finally { loading.value = false; }
}

async function loadBlueprints() {
  try {
    const pi: any = await fetchApi('/api/v1/treasury/payment-instances/?active=true');
    paymentBlueprints.value = (pi?.instances || []).filter((i: any) => i.vault_id).map((i: any) => ({
      code: i.blueprint_code, name: `${i.label || i.blueprint_name} (${i.vault_label || ''})`, vault_currency: i.currency_code || '',
    }));
  } catch (_) { paymentBlueprints.value = []; }
}

async function openDetail(debt: any) {
  showDetailModal.value = true; detailLoading.value = true; detailDebt.value = debt; detailPayments.value = [];
  try { const d: any = await fetchApi(`/api/v1/cxp/debts/${debt.id}/detail/`); detailDebt.value = d; detailPayments.value = d?.payments || []; }
  catch (e) { toast.error('Error al cargar detalle'); } finally { detailLoading.value = false; }
}
function closeDetail() { showDetailModal.value = false; detailDebt.value = null; detailPayments.value = []; }
function openCreate() { showCreateModal.value = true; }

async function openPay(debt: any) {
  payingDebt.value = debt;
  exchangeRate.value = 0;
  try { const fx: any = await fetchApi('/api/v1/forex/rate/'); if (fx?.rate) exchangeRate.value = fx.rate; } catch (_) { }
  // Suggest sensible default based on currency
  payAmount.value = debt.remaining_balance;
  showPayModal.value = true;
  selectedBlueprintCode.value = '';
}

const createForm = ref({ provider_name: '', invoice_number: '', total_amount: 0, currency_code: 'VES', due_date: '' });

async function submitCreate() {
  saving.value = true;
  try { await fetchApi('/api/v1/cxp/debts/', { method: 'POST', data: createForm.value }); toast.success('Deuda registrada'); showCreateModal.value = false; await loadData(); }
  catch (e) { toast.error('Error al guardar'); } finally { saving.value = false; }
}

async function submitPay() {
  if (!payAmount.value || payAmount.value <= 0) { toast.info('Ingresa un monto'); return; }
  if (!selectedBlueprintCode.value) { toast.info('Selecciona un método de pago'); return; }
  saving.value = true;
  try {
    const payload: any = { debt_id: payingDebt.value.id, amount_to_pay: payAmount.value, payment_blueprint_code: selectedBlueprintCode.value };
    if (isCrossCurrency.value && exchangeRate.value > 0) payload.exchange_rate_used = exchangeRate.value;
    await fetchApi('/api/v1/treasury/approve-debt-payment/', { method: 'POST', data: payload });
    toast.success('Pago procesado con éxito'); showPayModal.value = false; await loadData();
  } catch (e: any) { toast.error(e?.response?.data?.error || e?.data?.error || 'Error al procesar'); }
  finally { saving.value = false; }
}

onMounted(() => { loadData(); loadBlueprints(); });
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-3 gap-4">
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
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Cuentas por Pagar</h3>
      <div class="flex items-center gap-3">
        <select v-model="statusFilter" @change="loadData" class="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
          <option value="UNPAID">Pendientes</option><option value="PARTIALLY_PAID">Parcialmente Pagadas</option><option value="PAID">Pagadas</option><option value="">Todas</option></select>
        <button @click="openCreate" class="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-white bg-cyan-600 rounded-xl hover:bg-cyan-700"><Plus class="h-4 w-4" /> Nueva Deuda</button>
      </div>
    </div>
    <div v-if="loading" class="text-center py-12 text-sm text-slate-400">Cargando...</div>
    <div v-else-if="debts.length === 0" class="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08]"><p class="text-sm text-slate-400">No hay deudas registradas</p></div>
    <div v-else class="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.06]">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 dark:bg-white/[0.04] text-left"><tr>
          <th class="px-4 py-3 font-medium text-slate-500">Proveedor</th><th class="px-4 py-3 font-medium text-slate-500">Factura</th><th class="px-4 py-3 font-medium text-slate-500 text-right">Total</th><th class="px-4 py-3 font-medium text-slate-500 text-right">Restante</th><th class="px-4 py-3 font-medium text-slate-500">Vence</th><th class="px-4 py-3 font-medium text-slate-500">Estado</th><th class="px-4 py-3 font-medium text-slate-500 text-right"></th>
        </tr></thead>
        <tbody class="divide-y divide-slate-100 dark:divide-white/[0.04]">
          <tr v-for="d in debts" :key="d.id" class="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
            <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">{{ d.provider_name }}</td>
            <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ d.invoice_number }}</td>
            <td class="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">{{ formatAmount(d.total_amount, d.currency_code) }}</td>
            <td class="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">{{ formatAmount(d.remaining_balance, d.currency_code) }}</td>
            <td class="px-4 py-3 text-xs" :class="new Date(d.due_date) < new Date() && d.status !== 'PAID' ? 'text-red-500 font-medium' : 'text-slate-500'">{{ d.due_date }}</td>
            <td class="px-4 py-3"><span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', d.status==='PAID'?'bg-emerald-50 text-emerald-700':d.status==='PARTIALLY_PAID'?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-600']">{{ d.status === 'PAID' ? 'Pagado' : d.status === 'PARTIALLY_PAID' ? 'Parcial' : 'Pendiente' }}</span></td>
            <td class="px-4 py-3 text-right"><div class="flex items-center justify-end gap-2">
              <button @click="openDetail(d)" class="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:bg-transparent dark:border-white/[0.08]"><Eye class="h-3.5 w-3.5" /> Detalle</button>
              <button v-if="d.status !== 'PAID'" @click="openPay(d)" class="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-700"><Banknote class="h-3.5 w-3.5" /> Liquidar</button>
            </div></td>
          </tr>
        </tbody>
      </table>
    </div>
    <Teleport to="body"><div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showCreateModal=false"><div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md dark:border-white/[0.06] dark:bg-[#141824]"><div class="flex items-center justify-between border-b border-slate-200 px-6 py-4"><h3 class="text-lg font-semibold text-slate-900 dark:text-white">Nueva Deuda</h3><button @click="showCreateModal=false"><X class="h-5 w-5 text-slate-400" /></button></div><div class="p-6 space-y-4"><div><label>Proveedor</label><input v-model="createForm.provider_name" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" /></div><div><label>N° Factura</label><input v-model="createForm.invoice_number" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm" /></div><div class="grid grid-cols-2 gap-3"><div><label>Monto</label><input v-model.number="createForm.total_amount" type="number" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm" /></div><div><label>Moneda</label><select v-model="createForm.currency_code" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"><option value="VES">VES</option><option value="USD">USD</option></select></div></div><div><label>Vence</label><input v-model="createForm.due_date" type="date" class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm" /></div></div><div class="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3"><button class="h-9 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg">Cancelar</button><button @click="submitCreate" :disabled="saving" class="h-9 px-4 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50">Registrar Deuda</button></div></div></div></Teleport>
    <Teleport to="body"><div v-if="showDetailModal && detailDebt" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closeDetail"><div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg dark:border-white/[0.06] dark:bg-[#141824]"><div class="flex items-center justify-between border-b border-slate-200 px-6 py-4"><h3 class="text-lg font-semibold text-slate-900 dark:text-white">Detalle</h3><button @click="closeDetail"><X class="h-5 w-5 text-slate-400" /></button></div><div class="p-6 space-y-4">
      <div v-if="detailLoading" class="text-center py-6 text-sm text-slate-400">Cargando...</div>
      <template v-else><div class="rounded-xl bg-slate-50 p-4 space-y-2">
        <div class="flex justify-between"><span>Proveedor</span><span>{{ detailDebt.provider_name }}</span></div>
        <div class="flex justify-between"><span>Factura</span><span class="font-mono">{{ detailDebt.invoice_number }}</span></div>
        <div class="flex justify-between"><span>Total</span><span class="font-bold">{{ formatAmount(detailDebt.total_amount, detailDebt.currency_code) }}</span></div>
        <div class="flex justify-between"><span>Pagado</span><span class="font-semibold text-emerald-600">{{ formatAmount(detailDebt.total_amount - detailDebt.remaining_balance, detailDebt.currency_code) }}</span></div>
        <div class="flex justify-between"><span>Restante</span><span class="font-bold text-rose-600">{{ formatAmount(detailDebt.remaining_balance, detailDebt.currency_code) }}</span></div>
        <div class="flex justify-between"><span>Vence</span><span :class="new Date(detailDebt.due_date) < new Date() && detailDebt.status !== 'PAID' ? 'text-red-500' : ''">{{ detailDebt.due_date }}</span></div>
        <div class="flex justify-between"><span>Estado</span><span :class="detailDebt.status==='PAID'?'text-emerald-600':detailDebt.status==='PARTIALLY_PAID'?'text-amber-600':'text-slate-600'">{{ detailDebt.status === 'PAID' ? 'Pagado' : detailDebt.status === 'PARTIALLY_PAID' ? 'Parcial' : 'Pendiente' }}</span></div>
      </div>
      <h4 class="font-semibold mt-4">Historial de Pagos</h4>
      <div v-if="detailPayments.length === 0" class="text-sm text-slate-400 py-3 text-center">Sin abonos</div>
      <div v-else class="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin"><div v-for="p in detailPayments" :key="p.id" class="rounded-lg border border-slate-100 bg-white px-4 py-3"><div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span class="font-semibold font-mono">{{ formatAmount(p.amount_to_pay, detailDebt.currency_code) }}</span>
        <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', p.status==='APPROVED'?'bg-emerald-50 text-emerald-700':p.status==='REJECTED'?'bg-red-50 text-red-600':'bg-amber-50 text-amber-700']">{{ p.status === 'APPROVED' ? 'Aprobado' : p.status === 'REJECTED' ? 'Rechazado' : 'Pendiente' }}</span>
      </div>
      <p class="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        <span>{{ p.requested_by_name }} · {{ new Date(p.created_at).toLocaleString('es-VE') }}</span>
        <span v-if="p.payment_method_name" class="text-slate-500">· {{ p.payment_method_name }}</span>
      </p>
      <div v-if="p.amount_in_vault_currency && p.vault_currency && p.vault_currency !== detailDebt.currency_code" class="flex flex-wrap gap-3 text-xs mt-1.5">
        <span class="text-slate-600">Débito: <strong class="font-mono">{{ formatAmount(p.amount_in_vault_currency, p.vault_currency) }}</strong></span>
        <span class="text-slate-400">(Amortizó: {{ formatAmount(p.amount_to_pay, detailDebt.currency_code) }})</span>
        <span v-if="p.exchange_rate_used" class="text-slate-400">Tasa: {{ p.exchange_rate_used.toFixed(4) }}</span>
      </div>
      <p v-if="p.rejection_reason" class="text-xs text-red-400 mt-1">Motivo: {{ p.rejection_reason }}</p>
      </div></div>
      </template>
    </div></div></div></Teleport>
    <Teleport to="body"><div v-if="showPayModal && payingDebt" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showPayModal=false"><div class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md dark:border-white/[0.06] dark:bg-[#141824]"><div class="flex items-center justify-between border-b border-slate-200 px-6 py-4"><h3>Liquidar Deuda</h3><button @click="showPayModal=false"><X class="h-5 w-5" /></button></div><div class="p-6 space-y-4">
      <div class="rounded-xl bg-slate-50 p-4 space-y-2"><div class="flex justify-between"><span>Proveedor</span><span>{{ payingDebt.provider_name }}</span></div><div class="flex justify-between"><span>Factura</span><span class="font-mono">{{ payingDebt.invoice_number }}</span></div><div class="flex justify-between"><span>Saldo</span><span class="font-bold">{{ formatAmount(payingDebt.remaining_balance, payingDebt.currency_code) }}</span></div></div>
      <div><label>Monto <span class="text-red-500">*</span></label><input v-model.number="payAmount" type="number" :max="payingDebt.remaining_balance" class="w-full h-10 px-3 rounded-lg border" /></div>
      <div><label>Método de Pago <span class="text-red-500">*</span></label><select v-model="selectedBlueprintCode" class="w-full h-10 px-3 rounded-lg border"><option value="">Seleccionar...</option><option v-for="bp in paymentBlueprints" :key="bp.code" :value="bp.code">{{ bp.name }}</option></select></div>
      <div v-if="isCrossCurrency" class="rounded-xl bg-amber-50 border border-amber-200 p-4"><p class="text-xs font-medium text-amber-700">💱 {{ payingDebt.currency_code }} → {{ selectedBlueprint.vault_currency }}</p><div><label class="text-xs">Tasa *</label><input v-model.number="exchangeRate" type="number" step="0.0001" class="w-full h-10 px-3 rounded-lg border" /></div><div v-if="exchangeRate > 0" class="text-sm mt-2">{{ conversionLabel }}</div></div>
    </div><div class="border-t px-6 py-4 flex items-center justify-end gap-3"><button class="h-9 px-4 text-sm font-medium text-slate-700 bg-white border rounded-lg">Cancelar</button><button @click="submitPay" :disabled="saving" class="h-9 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg disabled:opacity-50">{{ saving ? '...' : 'Confirmar' }}</button></div></div></div></Teleport>
  </div>
</template>
