<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useForexRate } from '@/composables/useForexRate';
import { useCurrency, getCurrencySymbol, getCurrencyStep, getCurrencyPlaceholder } from '@/lib/currency';
import { toast } from 'vue3-toastify';
import { X, ArrowLeft, DollarSign, TrendingDown, TrendingUp, AlertCircle, RefreshCw } from 'lucide-vue-next';
import Swal from 'sweetalert2';
import type { Category, Profile, Operation, Summary, OpDetail } from './types';
import { bc } from './types';
import ExpenseHistorySection from './sections/ExpenseHistorySection.vue';
const setTimeout = window.setTimeout.bind(window);

const { fetchApi } = useApi();
const { formatAmount } = useCurrency();
const { forexRate } = useForexRate();
const loading = ref(true), saving = ref(false), wizard = ref(false), step = ref(1);
const categories = ref<Category[]>([]), profiles = ref<Profile[]>([]), operations = ref<Operation[]>([]), summary = ref<Summary | null>(null);
const vaultsList = ref<{ code: string; name: string; currency: string }[]>([]);
const availCurrencies = computed(() => ['VES', 'USD']);
const providerInput = ref(''), showProviders = ref(false), dateFrom = ref(''), dateTo = ref(''), quickDays = ref(''), searchQuery = ref(''), sortBy = ref('-created_at'), filterCurrency = ref('');
const page = ref(1), hasMore = ref(true), loadingMore = ref(false);
const showDetail = ref(false), detail = ref<OpDetail | null>(null), detailLoading = ref(false);
const w = ref({ category: null as Category | null, profile: null as Profile | null, amount: 0, totalInvoice: null as number | null, currency: 'VES', provider: '', invoiceNum: '', observations: '', paymentDate: new Date().toISOString().split('T')[0], isRecurring: false, cycle: 'monthly', alias: '', attachment: null as File | null });
const suggestedProviders = computed(() => { const c = w.value.category; if (!c) return []; return (c.suggested_providers || []).filter(p => !providerInput.value || p.toLowerCase().includes(providerInput.value.toLowerCase())); });

const filteredOps = computed(() => {
  let ops = operations.value;
  if (filterCurrency.value) ops = ops.filter(o => o.currency === filterCurrency.value);
  return ops;
});
const availableProviders = computed(() => [...new Set(operations.value.map(o => o.provider_info).filter(Boolean))].sort() as string[]);
const availableCategories = computed(() => [...new Set(operations.value.map(o => o.expense_category_name || o.profile_name).filter(Boolean))].sort() as string[]);
const availableVaults = computed(() => [...new Set(operations.value.map(o => o.vault_name).filter(Boolean))].sort() as string[]);

const filteredCurrencyTotals = computed(() => {
  const totals = summary.value?.currency_totals || [];
  if (!filterCurrency.value) return totals;
  return totals.filter(ct => ct.currency === filterCurrency.value);
});

const convertedBalance = computed(() => {
  const rate = forexRate.value?.rate || 1;
  const totals = summary.value?.currency_totals || [];
  let total = 0;
  for (const ct of totals) {
    if (filterCurrency.value && ct.currency !== filterCurrency.value) continue;
    total += ct.currency === 'USD' ? ct.total * rate : ct.total;
  }
  return total;
});

function today() { return new Date().toISOString().split('T')[0]; }
function yesterday() { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; }
function handleQuickChange() {
  const val = quickDays.value;
  if (val === '') { dateFrom.value = ''; dateTo.value = ''; loadAll(); }
  else if (val === 'custom') { dateFrom.value = ''; dateTo.value = ''; }
  else if (val === 'range') { dateFrom.value = ''; dateTo.value = ''; }
  else { const days = parseInt(val); if (!isNaN(days)) { const d = new Date(); d.setDate(d.getDate() - days); dateFrom.value = d.toISOString().split('T')[0]; dateTo.value = today(); loadAll(); } }
}
function applyDateFilter() { if (quickDays.value === 'custom') dateTo.value = dateFrom.value; loadAll(); }

async function loadAll(append = false) {
  if (!append) { page.value = 1; hasMore.value = true; operations.value = []; }
  const first = !append;
  if (first) loading.value = true; else loadingMore.value = true;
  try {
    const params = new URLSearchParams();
    if (dateFrom.value) params.set('date_from', dateFrom.value);
    if (dateTo.value) params.set('date_to', dateTo.value);
    if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim());
    params.set('page', String(page.value));
    const qstr = params.toString() ? `?${params.toString()}` : '';
    if (first) {
      const [c, p, o, s] = await Promise.all([
        fetchApi('/api/v1/expenses/categories/'), fetchApi('/api/v1/expenses/profiles/'),
        fetchApi(`/api/v1/expenses/operations/${qstr}`), fetchApi('/api/v1/expenses/operations/summary/'),
      ]) as any;
      categories.value = c?.results || c || []; profiles.value = (p?.results || p || []).filter((x: Profile) => x.is_active);
      operations.value = (o?.results || o || []) as Operation[]; hasMore.value = !!o?.next; summary.value = s;
    } else {
      const o = await fetchApi(`/api/v1/expenses/operations/${qstr}`) as any;
      const newOps = (o?.results || o || []) as Operation[];
      operations.value = [...operations.value, ...newOps];
      hasMore.value = !!o?.next;
    }
    page.value++;
    sortOperations();
  } catch (e) { toast.error('Error'); } finally { loading.value = false; loadingMore.value = false; }
}
function loadMore() { loadAll(true); }
function refresh() { loadAll(); }

function openWizard() { wizard.value = true; step.value = 1; w.value = { category: null, profile: null, amount: 0, totalInvoice: null, currency: availCurrencies.value[0] || 'VES', provider: '', invoiceNum: '', observations: '', paymentDate: today(), isRecurring: false, cycle: 'monthly', alias: '', attachment: null }; providerInput.value = ''; showProviders.value = false; }
function closeWizard() { wizard.value = false; step.value = 1; }
function nextStep() { if (step.value < 3) step.value++; else submitExpense(); }
function prevStep() { if (step.value > 1) step.value--; }
function selectCategory(cat: Category) { w.value.category = cat; const p = profiles.value.find(x => x.category_slug === cat.slug); if (p) { w.value.profile = p; if (p.default_currency) w.value.currency = p.default_currency; if (p.default_amount) w.value.amount = p.default_amount; } w.value.isRecurring = p?.is_recurring || false; nextStep(); }

async function submitExpense() {
  if (!w.value.amount || w.value.amount <= 0) { toast.info('Ingresa un monto'); return; }
  saving.value = true;
  try {
    await fetchApi('/api/v1/expenses/requests/', { method: 'POST', data: {
      category_slug: w.value.category?.slug || '',
      amount: w.value.amount,
      currency_code: w.value.currency,
      provider_name: w.value.provider || '',
      total_invoice_amount: w.value.totalInvoice || null,
      description: w.value.observations || '',
    } });
    if (w.value.provider) fetchApi('/api/v1/expenses/frequent-providers/', { method: 'POST', data: { name: w.value.provider, category: w.value.category?.slug || 'otros' } }).catch(() => { });
    closeWizard();
    await Swal.fire({ icon: 'success', title: '¡Listo!', text: 'Solicitud de egreso enviada a Tesorería correctamente', timer: 3000, timerProgressBar: true, showConfirmButton: false });
    await loadAll();
  } catch (e) { toast.error('Error al enviar la solicitud'); } finally { saving.value = false; }
}

async function openDetail(op: Operation) { const targetId = op?.id || (op as any)?.pk; if (!targetId) return; detailLoading.value = true; showDetail.value = true; try { detail.value = await fetchApi(`/api/v1/expenses/operations/${targetId}/detail/`) as any; } catch (e) { toast.error('Error al cargar detalle'); } finally { detailLoading.value = false; } }
function closeDetail() { showDetail.value = false; detail.value = null; }
const payWizard = ref(false), paySettle = ref(false), payStep = ref(1), paying = ref(false);
const pw = ref({ amount: 0, currency: 'VES', date: new Date().toISOString().split('T')[0], vault: '', comment: '', attachment: null as File | null });
function openPayWizard(settle = false) { paySettle.value = settle; payStep.value = 1; pw.value = { amount: 0, currency: detail.value?.currency || 'VES', date: new Date().toISOString().split('T')[0], vault: '', comment: '', attachment: null }; payWizard.value = true; }
function closePayWizard() { payWizard.value = false; }
const debtRemaining = computed(() => { const d = detail.value?.debts; return d?.length ? d[d.length - 1].remaining_amount : 0; });
const debtInPaymentCurrency = computed(() => {
  if (!detail.value || !debtRemaining.value) return 0;
  if (pw.value.currency === detail.value.currency) return debtRemaining.value;
  const rate = forexRate.value?.rate || 1;
  if (!rate) return 0;
  return Math.round((debtRemaining.value / rate) * 100) / 100;
});
const payExceedsDebt = computed(() => {
  if (!pw.value.amount || !debtInPaymentCurrency.value) return false;
  return pw.value.amount > debtInPaymentCurrency.value;
});
const payConverted = computed(() => {
  if (!detail.value || !pw.value.amount || pw.value.currency === detail.value.currency) return 0;
  const rate = forexRate.value?.rate || 1;
  return Math.round(pw.value.amount * rate * 100) / 100;
});
const payRemainingAfter = computed(() => Math.max(0, debtRemaining.value - (pw.value.currency === detail.value?.currency ? pw.value.amount : payConverted.value)));
const payAmountLabel = computed(() => {
  if (!detail.value || !debtRemaining.value) return '';
  if (pw.value.currency === detail.value.currency) return formatAmount(debtRemaining.value, detail.value.currency);
  const rate = forexRate.value?.rate || 1;
  if (!rate) return '';
  const converted = debtRemaining.value / rate;
  pw.value.amount = Math.round(converted * 100) / 100;
  return formatAmount(converted, pw.value.currency);
});
async function submitPayment() {
  if (!detail.value || !pw.value.amount) return; paying.value = true;
  try {
    const cappedAmount = payExceedsDebt.value ? debtInPaymentCurrency.value : pw.value.amount;
    const body: any = { amount: cappedAmount, payment_currency: pw.value.currency, payment_date: pw.value.date, vault_name: pw.value.vault || detail.value.vault_name || '', comment: pw.value.comment };
    if (pw.value.currency !== detail.value.currency) body.exchange_rate = forexRate.value?.rate || 1;
    const url = paySettle.value ? `/api/v1/expenses/operations/${detail.value.id}/settle/` : `/api/v1/expenses/operations/${detail.value.id}/pay/`;
    await fetchApi(url, { method: 'POST', data: body });
    toast.success(paySettle.value ? 'Deuda saldada' : 'Abono registrado');
    payWizard.value = false;
    detail.value = await fetchApi(`/api/v1/expenses/operations/${detail.value.id}/detail/`) as any;
  } catch (e: any) { toast.error(e?.message || 'Error al registrar pago'); } finally { paying.value = false; }
}
function exportCSV(data: Operation[] = operations.value) { const r = [['Factura', 'Proveedor', 'Categoría', 'Monto', 'Moneda', 'Importe', 'Tasa aplicada', 'Abonado', 'Restante', 'Gavetero', 'Estado', 'Fecha', 'Registrado por']]; for (const op of data) { const monto = op.total_invoice_amount || op.amount; const abonado = op.status === 'completed' ? monto : (op.current_paid_amount || 0); const restante = Math.max(0, monto - abonado); r.push([op.invoice_number || '', op.provider_info || '', op.expense_category_name || op.profile_name || 'General', formatAmount(monto, op.currency), op.currency, formatAmount(op.amount, op.currency), op.exchange_rate_at_transaction && op.currency !== 'VES' ? Number(op.exchange_rate_at_transaction).toFixed(2) : 'N/A', formatAmount(abonado, op.currency), formatAmount(restante, op.currency), op.vault_name || 'Sin gavetero', op.status, new Date(op.created_at).toLocaleDateString(), op.created_by_name || 'Sistema']); } const csv = '\uFEFF' + r.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n'); const b = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'gastos.xls'; a.click(); }
function exportPDF(data: Operation[] = operations.value) { const w = window.open('', '_blank', 'width=1100,height=700'); if (!w) return; let h = '<html><head><meta charset="utf-8"><style>body{font-family:Arial;margin:20px}h1{font-size:18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:11px}th{background:#f5f5f5}</style></head><body><h1>Reporte de Gastos</h1><table><tr><th>Factura</th><th>Proveedor</th><th>Categoría</th><th>Monto</th><th>Moneda</th><th>Importe</th><th>Tasa aplicada</th><th>Abonado</th><th>Restante</th><th>Gavetero</th><th>Estado</th><th>Fecha</th><th>Registrado por</th></tr>'; for (const op of data) { const monto = op.total_invoice_amount || op.amount; const abonado = op.status === 'completed' ? monto : (op.current_paid_amount || 0); const restante = Math.max(0, monto - abonado); h += `<tr><td>${op.invoice_number || 'N/A'}</td><td>${op.provider_info || '—'}</td><td>${op.expense_category_name || op.profile_name || 'General'}</td><td>${formatAmount(monto, op.currency)}</td><td>${op.currency}</td><td>${formatAmount(op.amount, op.currency)}</td><td>${op.exchange_rate_at_transaction && op.currency !== 'VES' ? Number(op.exchange_rate_at_transaction).toFixed(2) : 'N/A'}</td><td>${formatAmount(abonado, op.currency)}</td><td>${formatAmount(restante, op.currency)}</td><td>${op.vault_name || 'Sin gavetero'}</td><td>${op.status}</td><td>${new Date(op.created_at).toLocaleDateString()}</td><td>${op.created_by_name || 'Sistema'}</td></tr>`; } h += '</table></body></html>'; w.document.write(h); w.document.close(); w.print(); }
function sortOperations() { operations.value.sort((a, b) => { if (sortBy.value === 'created_at') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); if (sortBy.value === '-created_at') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); if (sortBy.value === 'amount') return a.amount - b.amount; if (sortBy.value === '-amount') return b.amount - a.amount; return 0; }); }

onMounted(loadAll);
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 dark:bg-[#0D0F14] p-4 sm:p-6">
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
    </div>
    <div v-else class="mx-auto max-w-7xl space-y-4">

      <!-- Header + Date Filter -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 shadow-sm ring-1 ring-cyan-200/50 dark:from-cyan-500/10 dark:to-cyan-600/10 dark:ring-cyan-500/20">
            <TrendingDown class="h-5 w-5 text-cyan-600 dark:text-cyan-400" stroke-width="1.5" />
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Egresos y Gastos</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400">Control de gastos operativos y compras</p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <select v-model="quickDays" @change="handleQuickChange"
            class="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs truncate w-28 dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
            <option value="">Fecha</option>
            <option value="custom">Personalizado</option>
            <option value="range">Rango de Fechas</option>
            <option value="1">24h</option>
            <option value="7">7d</option>
            <option value="30">30d</option>
            <option value="90">90d</option>
            <option value="365">1 año</option>
          </select>
          <select v-model="filterCurrency"
            class="h-8 px-4 rounded-lg border border-slate-200 bg-white text-xs truncate w-28 dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
            <option value="">Monedas</option>
              <option v-for="c in availCurrencies" :key="c" :value="c">{{ c }}</option>
          </select>
          <div v-if="quickDays === 'custom'" class="flex items-center gap-1">
            <input type="date" v-model="dateFrom" @change="applyDateFilter"
              class="h-8 w-32 px-2 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
          </div>
          <div v-if="quickDays === 'range'" class="flex items-center gap-1">
            <input type="date" v-model="dateFrom" @change="applyDateFilter"
              class="h-8 w-28 px-2 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
            <span class="text-xs text-slate-400">→</span>
            <input type="date" v-model="dateTo" @change="applyDateFilter"
              class="h-8 w-28 px-2 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
          </div>
          <button @click="refresh" :disabled="loading"
            class="inline-flex items-center justify-center gap-1 h-8 px-3 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:border-white/[0.06] dark:hover:bg-[#1a1f2e]">
            <RefreshCw :class="['h-3 w-3', loading && 'animate-spin']" />
          </button>
          <button @click="openWizard"
            class="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors">
            <span class="text-sm leading-none">+</span>Registrar Gasto
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="ct in filteredCurrencyTotals" :key="ct.currency"
          class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95"
            :class="bc(ct.currency).bar" />
          <div class="relative z-[2] flex items-center justify-between">
            <div>
              <p
                class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {{ ct.currency === 'USD' ? 'Dólares' : 'Bolívares' }}</p>
              <p class="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {{ formatAmount(ct.total, ct.currency) }}</p>
            </div>
            <div class="flex h-9 w-9 items-center justify-center rounded-xl ring-1" :class="bc(ct.currency).wrap">
              <DollarSign class="h-[16px] w-[16px]" stroke-width="1.5" :class="bc(ct.currency).icon" />
            </div>
          </div>
          <p class="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">{{ ct.count }} operaciones</p>
        </div>
        <!-- Pending -->
        <div
          class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div
            class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95 from-amber-400 via-amber-500 to-amber-600" />
          <div class="relative z-[2] flex items-center justify-between">
            <div>
              <p
                class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Pendientes</p>
              <p class="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {{ summary?.pending_count || 0 }}</p>
            </div>
            <div
              class="flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-amber-100 bg-amber-50 dark:ring-amber-500/20 dark:bg-amber-500/10">
              <AlertCircle class="h-[16px] w-[16px] text-amber-600 dark:text-amber-400" stroke-width="1.5" />
            </div>
          </div>
        </div>
        <!-- Balance -->
        <div
          class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:border-white/[0.07] dark:from-[#141824] dark:via-[#111620] dark:to-[#0c0f16] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div
            class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[3px] bg-gradient-to-r opacity-95 from-violet-400 via-violet-500 to-violet-600" />
          <div class="relative z-[2] flex items-center justify-between">
            <div>
              <p
                class="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Balance General</p>
              <p class="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {{ formatAmount(convertedBalance, 'VES') }}</p>
            </div>
            <div
              class="flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-violet-100 bg-violet-50 dark:ring-violet-500/20 dark:bg-violet-500/10">
              <TrendingUp class="h-[16px] w-[16px] text-violet-600 dark:text-violet-400" stroke-width="1.5" />
            </div>
          </div>
        </div>
      </div>

      <!-- History Section -->
      <ExpenseHistorySection :operations="filteredOps" :search-query="searchQuery" :sort-by="sortBy"
        :available-providers="availableProviders" :available-categories="availableCategories"
        :available-vaults="availableVaults" :has-more="hasMore" :loading-more="loadingMore"
        @update:search-query="searchQuery = $event; loadAll()"
        @update:sort-by="sortBy = $event; loadAll()" @open-detail="openDetail" @export-csv="exportCSV"
        @export-pdf="exportPDF" @load-more="loadMore" />

      <!-- Wizard Modal -->
      <Teleport to="body">
        <div v-if="wizard" class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          @click.self="closeWizard">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto dark:bg-[#141824]">
            <div class="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-white/[0.06]">
              <button v-if="step > 1" @click="prevStep"
                class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06]">
                <ArrowLeft class="h-4 w-4" />
              </button>
              <div class="flex-1">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{{ ['¿Qué pagaste?', '¿Cuánto fue?', '¿Con qué pagaste?'][step-1]}}</h2>
                <p class="text-xs text-slate-500">Paso {{ step }} de 3</p>
              </div>
              <button @click="closeWizard" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06]">
                <X class="h-4 w-4" />
              </button>
            </div>
            <!-- Step 1 -->
            <div v-if="step === 1" class="p-4 sm:p-6">
              <div v-if="!categories.length" class="text-center py-8 text-slate-500">No hay categorías</div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button v-for="cat in categories" :key="cat.id" @click="selectCategory(cat)"
                  :class="['flex items-center gap-3 p-4 rounded-xl border transition-all', w.category?.id === cat.id ? 'border-blue-500 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/10' : 'border-slate-200 hover:border-slate-300 dark:border-white/[0.08] dark:hover:border-white/[0.12]']">
                  <span class="text-2xl shrink-0">{{ cat.icon_name || '📌' }}</span><span
                    class="text-sm font-medium text-slate-900 dark:text-white">{{ cat.name }}</span>
                </button>
              </div>
            </div>
            <!-- Step 2 -->
            <div v-if="step === 2" class="p-4 sm:p-6 space-y-4">
              <div class="text-center">
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">{{ w.category?.name || 'Gasto' }}</p>
                <div class="flex justify-center gap-2 mb-3 flex-wrap">
                  <button v-for="cc in availCurrencies" :key="cc" @click="w.currency = cc"
                    :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', w.currency === cc ? 'bg-slate-900 text-white dark:bg-cyan-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]']">{{ getCurrencySymbol(cc) || cc }}</button>
                </div>
                <input v-model.number="w.amount" type="number" :step="getCurrencyStep(w.currency)" min="0" :placeholder="getCurrencyPlaceholder(w.currency)"
                  class="w-40 text-center bg-transparent border-b-2 border-cyan-500 outline-none text-2xl font-semibold text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autofocus />
                <p v-if="w.amount > 0" class="text-center text-xs text-slate-400">{{ formatAmount(w.amount, w.currency) }}</p>
              </div>
              <div class="relative"><label
                  class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proveedor</label><input
                  v-model="providerInput" @input="w.provider = providerInput" @focus="showProviders = true"
                  @blur="setTimeout(() => showProviders = false, 200)" placeholder="Buscar o escribir nuevo..."
                  class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
                <div v-if="showProviders"
                  class="absolute top-full left-0 right-0 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg z-10 max-h-48 overflow-y-auto dark:bg-[#1a1f2e] dark:border-white/[0.08]">
                  <button v-for="sp in suggestedProviders" :key="sp"
                    @mousedown.prevent="providerInput = sp; w.provider = sp; showProviders = false"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-500/10">{{ sp }}</button>
                  <div v-if="suggestedProviders.length === 0 && providerInput.trim()"
                    class="px-3 py-3 text-sm text-slate-400">Se usará "{{ providerInput }}"</div>
                </div>
              </div>
              <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">N°
                  Factura</label><input v-model="w.invoiceNum"
                  class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
              </div>
              <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha de
                  pago</label>
                <div class="flex gap-1.5 flex-wrap"><button @click="w.paymentDate = today()"
                    :class="['px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', w.paymentDate === today() ? 'bg-slate-900 text-white dark:bg-cyan-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]']">Hoy</button><button
                    @click="w.paymentDate = yesterday()"
                    :class="['px-3 py-1.5 rounded-lg text-xs font-medium', w.paymentDate === yesterday() ? 'bg-slate-900 text-white dark:bg-cyan-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]']">Ayer</button><input
                    type="date" v-model="w.paymentDate"
                    class="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
                </div>
              </div>
              <div><label
                  class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observaciones</label><textarea
                  v-model="w.observations" rows="2"
                  class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
              </div>
              <div><label
                  class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Comprobante</label><label
                  class="flex items-center gap-2 cursor-pointer"><input type="file" accept="image/*,.pdf"
                    @change="w.attachment = ($event.target as HTMLInputElement).files?.[0] || null" class="hidden" /><span
                    class="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-slate-300">{{ w.attachment ? ' ✓ '+w.attachment.name:'📎 Subir comprobante'}}</span></label></div>
            </div>
            <!-- Step 3 -->
            <div v-if="step === 3" class="p-4 sm:p-6 space-y-4">
              <p class="text-sm text-slate-500">{{ formatAmount(w.amount, w.currency) }} ·
                {{ w.category?.name || 'Gasto' }}</p>
              <div class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/[0.08]">
                <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="w.isRecurring"
                    class="rounded border-slate-300 text-cyan-600" /><span
                    class="text-sm text-slate-700 dark:text-slate-300">Gasto recurrente</span></label></div>
              <template v-if="w.isRecurring">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label
                      class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ciclo</label><select
                      v-model="w.cycle"
                      class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
                      <option v-for="c in ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'onetime']" :key="c"
                        :value="c">
                        {{ ({ weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual', quarterly: 'Trimestral', yearly: 'Anual', onetime: 'Único' })[c] }}
                      </option>
                    </select></div>
                  <div><label
                      class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alias</label><input
                      v-model="w.alias" placeholder="Ej: Luz Local"
                      class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
                  </div>
                </div>
              </template>
            </div>
            <div class="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-white/[0.06]"><button @click="nextStep"
                :disabled="saving"
                class="w-full h-10 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 disabled:opacity-50 transition-colors">{{ step === 3 ? 'Guardar Gasto':'Continuar'}}</button></div>
          </div>
        </div>
      </Teleport>

      <!-- Detail Modal -->
      <Teleport to="body">
        <div v-if="showDetail" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          @click.self="closeDetail">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto dark:bg-[#141824]">
            <div class="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-white/[0.06]">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Detalle del Gasto</h2><button
                @click="closeDetail" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06]">
                <X class="h-4 w-4" />
              </button>
            </div>
            <div v-if="detailLoading" class="text-center py-12">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600 mx-auto" />
            </div>
            <div v-else-if="detail" class="p-4 sm:p-6 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-bold text-slate-900 dark:text-white">
                    {{ formatAmount(detail.amount, detail.currency) }}</p>
                  <p class="text-xs text-slate-500">{{ detail.expense_category_name || detail.profile_name || 'Gasto' }}</p>
                </div><span
                  :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', detail.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : detail.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-slate-100 text-slate-500']">{{ detail.status === 'completed' ? 'Completado' : detail.status === 'pending' ? 'Pendiente' : 'Cancelado' }}</span>
              </div>
              <div class="border-t border-slate-200 pt-4 dark:border-white/[0.06] space-y-2">
                <p v-if="detail.provider_info"
                  class="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span class="text-base">🏢</span> <span class="text-slate-500">Proveedor:</span>
                  {{ detail.provider_info }}
                </p>
                <p class="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"><span
                    class="text-base">🧾</span> <span class="text-slate-500">Factura:</span>
                  {{ detail.invoice_number || 'N/A' }}
                </p>
                <p class="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"><span
                    class="text-base">📦</span> <span class="text-slate-500">Gavetero:</span> {{ detail.vault_name || 'Sin gavetero'}}</p>
                <p v-if="detail.expense_category_name"
                  class="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"><span
                    class="text-base">📂</span>
                  <span class="text-slate-500">Categoría:</span> {{ detail.expense_category_name }}
                </p>
                <p v-if="detail.payment_date"
                  class="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"><span
                    class="text-base">📅</span> <span class="text-slate-500">Fecha:</span> {{ detail.payment_date }}</p>
                <p class="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"><span
                    class="text-base">👤</span> <span class="text-slate-500">Registrado por:</span>
                  {{ detail.created_by_name || 'Sistema' }}</p>
                <p v-if="detail.exchange_rate_at_transaction && detail.currency !== 'VES'"
                  class="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  <span class="flex items-center gap-2"><span class="text-base">💱</span> <span class="text-slate-500">Tasa aplicada:</span>
                  {{ Number(detail.exchange_rate_at_transaction).toFixed(2) }} {{ getCurrencySymbol(detail.currency) || detail.currency }} por {{ formatAmount(1, detail.currency) }}</span>
                  <span class="block text-xs text-cyan-600 dark:text-cyan-400 pl-6">Monto {{ getCurrencySymbol(detail.currency) || detail.currency }}: {{ formatAmount(detail.amount, detail.currency) }} → {{ formatAmount(detail.amount * detail.exchange_rate_at_transaction, 'VES') }}</span>
                </p>
              </div>
              <div v-if="detail.observations" class="text-sm text-slate-500">📝 {{ detail.observations }}</div>
              <div v-if="detail.attachment">
                <a :href="detail.attachment" target="_blank"
                  class="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
                  📎 Ver comprobante
                </a>
              </div>
              <div v-if="detail.debts?.length" class="border-t border-slate-200 pt-4 dark:border-white/[0.06]">
                <p class="text-sm font-semibold text-slate-900 dark:text-white mb-2">Historial de Abonos</p>
                <div v-for="d in detail.debts" :key="d.id"
                  class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 dark:border-white/[0.06]">
                  <div>
                    <p class="text-sm text-slate-700 dark:text-slate-300">{{ d.provider_name }}</p>
                    <p class="text-xs text-slate-500">{{ new Date(d.created_at).toLocaleDateString() }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-medium text-red-600">-{{ formatAmount(d.paid_amount, d.currency) }}</p>
                    <p v-if="d.remaining_amount > 0" class="text-xs text-amber-600">Saldo: {{ formatAmount(d.remaining_amount, d.currency) }}</p>
                  </div>
                </div>
                <div v-if="detail.debts.length"
                  class="mt-2 pt-2 flex justify-between text-sm font-semibold border-t border-slate-200 dark:border-white/[0.06]">
                  <span class="text-slate-500">Total factura: {{ formatAmount(detail.total_invoice_amount, detail.currency) }}</span><span
                    class="text-amber-600">Restante: {{ formatAmount(detail.debts[detail.debts.length - 1]?.remaining_amount, detail.currency) }}</span>
                </div>
              </div>

              <!-- Payment History -->
              <div v-if="detail.payments?.length" class="border-t border-slate-200 pt-4 dark:border-white/[0.06]">
                <p class="text-sm font-semibold text-slate-900 dark:text-white mb-2">Historial de Pagos</p>
                <div v-for="p in detail.payments" :key="p.id"
                  class="flex items-start justify-between py-2 border-b border-slate-100 last:border-0 dark:border-white/[0.06]">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-slate-700 dark:text-slate-300">{{ formatAmount(p.amount_paid, p.payment_currency) }}</p>
                    <p v-if="p.exchange_rate_at_payment && p.payment_currency !== detail.currency" class="text-xs text-cyan-600 dark:text-cyan-400">
                      💱 Tasa: {{ Number(p.exchange_rate_at_payment).toFixed(2) }} {{ getCurrencySymbol(detail.currency) || detail.currency }} por {{ formatAmount(1, p.payment_currency) }}
                    </p>
                    <p v-if="p.exchange_rate_at_payment && p.payment_currency !== detail.currency" class="text-xs text-slate-500">
                      Monto {{ getCurrencySymbol(detail.currency) || detail.currency }}: {{ formatAmount(p.converted_amount || 0, detail.currency) }}
                    </p>
                    <p class="text-xs text-slate-500 truncate mt-0.5">
                      {{ p.paid_by }} · {{ new Date(p.payment_date).toLocaleDateString() }}
                      <span v-if="p.vault_name"> · 📦 {{ p.vault_name }}</span>
                      <span v-if="p.exchange_rate_at_payment && p.payment_currency !== detail.currency"> · 💱 {{ Number(p.exchange_rate_at_payment).toFixed(2) }}</span>
                    </p>
                    <p v-if="p.comment" class="text-xs text-slate-400 italic">{{ p.comment }}</p>
                  </div>
                  <span class="text-[10px] text-slate-400 shrink-0 ml-2">{{ p.created_by_name }}</span>
                </div>
              </div>
              <div v-if="detail.status === 'pending' && detail.debts?.length" class="flex gap-2 mt-3 flex-wrap">
                <button @click="openPayWizard(false)" class="flex-1 h-9 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors">Abonar</button>
                <button @click="openPayWizard(true)" class="flex-1 h-9 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">Saldar Deuda</button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Payment Wizard -->
      <Teleport to="body">
        <div v-if="payWizard" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closePayWizard">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto dark:bg-[#141824]">
            <div class="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-white/[0.06]">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{{ payStep === 2 ? 'Seleccionar Gavetero' : paySettle ? 'Saldar Deuda' : 'Abonar' }}</h2>
              <button @click="closePayWizard" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06]"><X class="h-4 w-4" /></button>
            </div>
            <div class="p-4 sm:p-6 space-y-4">
              <div v-if="payStep === 1" class="space-y-4">
                <div>
                  <p class="text-xs font-medium text-slate-500 mb-2">Moneda</p>
                  <div class="flex gap-2 flex-wrap">
                    <button v-for="cc in availCurrencies" :key="cc" @click="pw.currency = cc"
                      :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', pw.currency === cc ? 'bg-slate-900 text-white dark:bg-cyan-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]']">{{ getCurrencySymbol(cc) || cc }}</button>
                  </div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4 space-y-1 dark:bg-white/[0.04]">
                  <p class="text-xs text-slate-500">Deuda: {{ formatAmount(debtRemaining, detail?.currency || 'VES') }}</p>
                  <p v-if="pw.currency !== detail?.currency" class="text-xs text-slate-500">Tasa: 1 {{ getCurrencySymbol(pw.currency) || pw.currency }} = {{ formatAmount(forexRate?.rate || 1, 'VES') }}</p>
                  <p v-if="pw.currency !== detail?.currency" class="text-sm text-slate-700 dark:text-slate-300">Deuda en {{ getCurrencySymbol(pw.currency) || pw.currency }}: {{ formatAmount(debtInPaymentCurrency, pw.currency) }}</p>
                  <p v-if="paySettle" class="text-sm font-semibold text-slate-900 dark:text-white">
                    Monto a cancelar: {{ payAmountLabel || formatAmount(pw.amount, pw.currency) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs font-medium text-slate-500 mb-1">Monto a {{ paySettle ? 'cancelar' : 'abonar' }}</p>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">{{ getCurrencySymbol(pw.currency) }}</span>
                    <input v-model.number="pw.amount" type="number" :step="getCurrencyStep(pw.currency)" min="0" :placeholder="getCurrencyPlaceholder(pw.currency)"
                      class="w-full h-10 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-lg font-semibold text-slate-900 dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" autofocus />
                  </div>
                  <p v-if="pw.amount > 0" class="text-xs text-slate-400 mt-1">{{ formatAmount(pw.amount, pw.currency) }}</p>
                </div>
                <div v-if="!paySettle && pw.amount > 0" class="text-xs">
                  <span class="text-slate-500">Saldo restante: </span>
                  <span class="font-medium" :class="payRemainingAfter <= 0 ? 'text-emerald-600' : 'text-amber-600'">
                    {{ formatAmount(payRemainingAfter, detail?.currency || 'VES') }}
                    <span v-if="payRemainingAfter <= 0"> (Deuda saldada)</span>
                  </span>
                </div>
                <div v-if="payExceedsDebt" class="rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  ⚠️ El monto supera la deuda de {{ formatAmount(debtInPaymentCurrency, pw.currency) }}. Solo se tomará hasta {{ formatAmount(debtInPaymentCurrency, pw.currency) }} de la caja.</div>
                <div class="text-xs text-slate-500">Total factura: {{ formatAmount(detail?.total_invoice_amount || 0, detail?.currency || 'VES') }}</div>
                <div>
                  <p class="text-xs font-medium text-slate-500 mb-1">Fecha de pago</p>
                  <input v-model="pw.date" type="date"
                    class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
                </div>
                <div>
                  <p class="text-xs font-medium text-slate-500 mb-1">Observaciones</p>
                  <input v-model="pw.comment" placeholder="Opcional"
                    class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
                </div>
                <div>
                  <p class="text-xs font-medium text-slate-500 mb-1">Comprobante</p>
                  <input type="file" accept="image/*,.pdf" @change="pw.attachment = ($event.target as HTMLInputElement).files?.[0] || null"
                    class="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-white/[0.06] dark:file:text-slate-300" />
                </div>
                <button @click="payStep = 2" :disabled="!pw.amount || pw.amount <= 0"
                  class="w-full h-10 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 disabled:opacity-50 transition-colors">Continuar</button>
              </div>
              <div v-if="payStep === 2" class="space-y-4">
                <p class="text-sm text-slate-500">Resumen</p>
                <div class="bg-slate-50 rounded-xl p-4 space-y-1 dark:bg-white/[0.04]">
                  <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ formatAmount(pw.amount, pw.currency) }}</p>
                  <p class="text-xs text-slate-500">Deuda: {{ formatAmount(debtRemaining, detail?.currency || 'VES') }}</p>
                  <p v-if="pw.currency !== detail?.currency" class="text-xs text-slate-500">Tasa: 1 {{ getCurrencySymbol(pw.currency) || pw.currency }} = {{ formatAmount(forexRate?.rate || 1, 'VES') }}</p>
                  <p v-if="pw.comment" class="text-xs text-slate-400">📝 {{ pw.comment }}</p>
                  <p v-if="!paySettle" class="text-xs" :class="payRemainingAfter <= 0 ? 'text-emerald-600' : 'text-amber-600'">
                    Saldo restante: {{ formatAmount(payRemainingAfter, detail?.currency || 'VES') }}
                  </p>
                </div>
                <div>
                  <p class="text-xs font-medium text-slate-500 mb-1">Gavetero destino</p>
                  <select v-model="pw.vault"
                    class="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
                    <option value="">Sin gavetero</option>
                    <option v-for="v in vaultsList.filter(v => v.currency === pw.currency)" :key="v.code" :value="v.name">{{ v.name }}</option>
                  </select>
                </div>
                <div class="flex gap-2 flex-wrap">
                  <button @click="payStep = 1" class="flex-1 h-10 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:text-slate-300 transition-colors">Atrás</button>
                  <button @click="submitPayment" :disabled="paying"
                    class="flex-1 h-10 rounded-lg text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 transition-colors">{{ paying ? 'Guardando...' : paySettle ? 'Saldar Deuda' : 'Registrar Abono' }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

    </div>
  </div>
</template>
