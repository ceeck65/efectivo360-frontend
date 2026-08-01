<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { toast } from 'vue3-toastify';
import {
  Search, ChevronLeft, ChevronRight, Eye, Ban, DollarSign,
  Receipt, CheckCircle2, XCircle, Loader2,
} from 'lucide-vue-next';
import { useSalesHistory, type SaleListItem, type SaleDetail } from '@/composables/useSalesHistory';
import SaleDetailModal from './SaleDetailModal.vue';

type QuickRange = 'today' | 'yesterday' | 'month' | 'custom';

const {
  sales, summary, loading, summaryLoading, voidingId, errorMessage,
  pagination, filters, refresh, setPage, setSearch, voidSale,
} = useSalesHistory();

// ── Filtros de fecha ──
const quickRange = ref<QuickRange>('today');
const customStart = ref('');
const customEnd = ref('');

function toLocalISODate(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

function applyQuickRange(range: QuickRange) {
  quickRange.value = range;
  const now = new Date();
  if (range === 'today') {
    const today = toLocalISODate(now);
    filters.start_date = today;
    filters.end_date = today;
  } else if (range === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const iso = toLocalISODate(yesterday);
    filters.start_date = iso;
    filters.end_date = iso;
  } else if (range === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    filters.start_date = toLocalISODate(first);
    filters.end_date = toLocalISODate(now);
  } else {
    // 'custom': se aplica desde los inputs (ver watch más abajo)
    filters.start_date = customStart.value || null;
    filters.end_date = customEnd.value || null;
    return;
  }
  refresh();
}

watch([customStart, customEnd], () => {
  if (quickRange.value !== 'custom') return;
  filters.start_date = customStart.value || null;
  filters.end_date = customEnd.value || null;
  refresh();
});

// ── Filtro de estado ──
const statusOptions: { value: typeof filters.status; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'REALIZADA', label: 'Realizadas' },
  { value: 'ANULADA', label: 'Anuladas' },
];

function onStatusChange(value: string) {
  filters.status = value as typeof filters.status;
  refresh();
}

// ── Búsqueda ──
const searchInput = ref('');
function onSearchInput() {
  setSearch(searchInput.value);
}

// ── Formato ──
function formatUSD(value: string | number): string {
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatVES(value: string | number): string {
  return Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function shortHash(hash: string): string {
  return hash ? hash.slice(0, 8) : '—';
}

// ── Modal de detalle ──
const detailSaleId = ref<number | null>(null);
function openDetail(sale: SaleListItem) {
  detailSaleId.value = sale.id;
}
function closeDetail() {
  detailSaleId.value = null;
}

// ── Confirmación de anulación ──
const voidTarget = ref<{ id: number; label: string } | null>(null);
const voidReason = ref('');

function askVoid(sale: SaleListItem) {
  voidTarget.value = { id: sale.id, label: sale.public_hash ? shortHash(sale.public_hash) : `#${sale.id}` };
  voidReason.value = '';
}
function askVoidFromDetail(sale: SaleDetail) {
  detailSaleId.value = null;
  voidTarget.value = { id: sale.id, label: sale.invoice_number || `#${sale.id}` };
  voidReason.value = '';
}
function cancelVoid() {
  voidTarget.value = null;
  voidReason.value = '';
}
async function confirmVoid() {
  if (!voidTarget.value) return;
  const ok = await voidSale(voidTarget.value.id, voidReason.value);
  if (ok) {
    toast.success('Venta anulada correctamente');
    voidTarget.value = null;
    voidReason.value = '';
  } else {
    toast.error(errorMessage.value || 'No se pudo anular la venta');
  }
}

onMounted(() => {
  applyQuickRange('today');
});
</script>

<template>
  <div class="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
    <div>
      <h1 class="text-lg font-black text-slate-800 dark:text-white">Histórico de Ventas</h1>
      <p class="text-xs text-slate-400">Consulta, filtra y gestiona las ventas realizadas en el POS</p>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141824] p-4 shadow-sm">
        <div class="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <DollarSign :size="16" />
          <span class="text-[10px] font-bold uppercase tracking-wider">Total Facturado USD</span>
        </div>
        <p class="mt-1.5 text-xl font-black text-slate-800 dark:text-white">
          <template v-if="summaryLoading">…</template>
          <template v-else>${{ formatUSD(summary?.total_amount_usd ?? 0) }}</template>
        </p>
      </div>
      <div class="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141824] p-4 shadow-sm">
        <div class="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
          <Receipt :size="16" />
          <span class="text-[10px] font-bold uppercase tracking-wider">Total Facturado VES</span>
        </div>
        <p class="mt-1.5 text-xl font-black text-slate-800 dark:text-white font-mono">
          <template v-if="summaryLoading">…</template>
          <template v-else>Bs. {{ formatVES(summary?.total_amount_ves ?? 0) }}</template>
        </p>
      </div>
      <div class="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141824] p-4 shadow-sm">
        <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <CheckCircle2 :size="16" />
          <span class="text-[10px] font-bold uppercase tracking-wider">Ventas Realizadas</span>
        </div>
        <p class="mt-1.5 text-xl font-black text-slate-800 dark:text-white">
          <template v-if="summaryLoading">…</template>
          <template v-else>{{ summary?.total_sales_count ?? 0 }}</template>
        </p>
      </div>
      <div class="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141824] p-4 shadow-sm">
        <div class="flex items-center gap-2 text-rose-500 dark:text-rose-400">
          <XCircle :size="16" />
          <span class="text-[10px] font-bold uppercase tracking-wider">Ventas Anuladas</span>
        </div>
        <p class="mt-1.5 text-xl font-black text-slate-800 dark:text-white">
          <template v-if="summaryLoading">…</template>
          <template v-else>{{ summary?.voided_sales_count ?? 0 }}</template>
        </p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141824] p-3 flex flex-wrap items-center gap-2">
      <!-- Rango rápido -->
      <div class="flex bg-slate-50 dark:bg-white/[0.04] p-0.5 rounded-lg border border-slate-200 dark:border-white/[0.08]">
        <button
          v-for="opt in [['today','Hoy'],['yesterday','Ayer'],['month','Este Mes'],['custom','Personalizado']] as const"
          :key="opt[0]"
          @click="applyQuickRange(opt[0])"
          class="px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all"
          :class="quickRange === opt[0] ? 'bg-slate-800 dark:bg-cyan-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'"
        >{{ opt[1] }}</button>
      </div>

      <!-- Rango personalizado -->
      <div v-if="quickRange === 'custom'" class="flex items-center gap-1.5">
        <input type="date" v-model="customStart"
          class="h-8 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1320] text-xs text-slate-700 dark:text-white" />
        <span class="text-slate-300 text-xs">→</span>
        <input type="date" v-model="customEnd"
          class="h-8 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1320] text-xs text-slate-700 dark:text-white" />
      </div>

      <!-- Estado -->
      <select :value="filters.status" @change="onStatusChange(($event.target as HTMLSelectElement).value)"
        class="h-8 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1320] text-xs text-slate-700 dark:text-white">
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>

      <!-- Búsqueda -->
      <div class="relative flex-1 min-w-[180px]">
        <Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchInput"
          @input="onSearchInput"
          type="text"
          placeholder="Buscar por cliente, ID o hash…"
          class="w-full h-8 pl-8 pr-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1320] text-xs text-slate-700 dark:text-white placeholder:text-slate-400"
        />
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141824] overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-400">
              <th class="text-left font-bold px-3 py-2.5">#/Hash</th>
              <th class="text-left font-bold px-3 py-2.5">Fecha/Hora</th>
              <th class="text-left font-bold px-3 py-2.5">Cliente</th>
              <th class="text-right font-bold px-3 py-2.5">Total ($ / Bs)</th>
              <th class="text-right font-bold px-3 py-2.5">Tasa</th>
              <th class="text-center font-bold px-3 py-2.5">Estado</th>
              <th class="text-right font-bold px-3 py-2.5">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <tr v-if="loading">
              <td colspan="7" class="px-3 py-10 text-center text-slate-400">
                <Loader2 :size="20" class="animate-spin inline-block" />
              </td>
            </tr>
            <tr v-else-if="sales.length === 0">
              <td colspan="7" class="px-3 py-10 text-center text-slate-400">No hay ventas con estos filtros</td>
            </tr>
            <tr v-else v-for="sale in sales" :key="sale.id"
              class="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
              <td class="px-3 py-2.5">
                <p class="font-bold text-slate-700 dark:text-white">#{{ sale.id }}</p>
                <p class="text-[10px] text-slate-400 font-mono">{{ shortHash(sale.public_hash) }}</p>
              </td>
              <td class="px-3 py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{{ formatDateTime(sale.sold_at) }}</td>
              <td class="px-3 py-2.5 text-slate-600 dark:text-slate-300 truncate max-w-[160px]">{{ sale.customer_name }}</td>
              <td class="px-3 py-2.5 text-right">
                <p class="font-bold text-slate-800 dark:text-white">${{ formatUSD(sale.total_usd) }}</p>
                <p class="text-[10px] text-slate-400 font-mono">Bs. {{ formatVES(sale.total_ves) }}</p>
              </td>
              <td class="px-3 py-2.5 text-right text-slate-500 dark:text-slate-400 font-mono">{{ formatVES(sale.exchange_rate) }}</td>
              <td class="px-3 py-2.5 text-center">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                  :class="sale.status === 'REALIZADA'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-600 dark:bg-white/[0.06] dark:text-slate-400'"
                >{{ sale.status }}</span>
              </td>
              <td class="px-3 py-2.5">
                <div class="flex justify-end gap-1">
                  <button @click="openDetail(sale)"
                    class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors"
                    title="Ver detalle">
                    <Eye :size="14" />
                  </button>
                  <button
                    v-if="sale.status === 'REALIZADA'"
                    @click="askVoid(sale)"
                    :disabled="voidingId === sale.id"
                    class="w-7 h-7 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-40 transition-colors"
                    title="Anular venta">
                    <Ban :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div class="flex items-center justify-between px-3 py-2.5 border-t border-slate-200 dark:border-white/[0.08] text-[11px] text-slate-400">
        <span>{{ pagination.count }} venta{{ pagination.count === 1 ? '' : 's' }} · Página {{ pagination.page }} de {{ pagination.totalPages }}</span>
        <div class="flex gap-1">
          <button @click="setPage(pagination.page - 1)" :disabled="pagination.page <= 1"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/[0.08] disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">
            <ChevronLeft :size="14" />
          </button>
          <button @click="setPage(pagination.page + 1)" :disabled="pagination.page >= pagination.totalPages"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/[0.08] disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors">
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de detalle -->
    <SaleDetailModal
      v-if="detailSaleId !== null"
      :sale-id="detailSaleId"
      @close="closeDetail"
      @void="askVoidFromDetail"
    />

    <!-- Confirmación de anulación -->
    <div v-if="voidTarget" class="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4" @click.self="cancelVoid">
      <div class="bg-white dark:bg-[#141824] w-full max-w-sm rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200/80 dark:border-white/[0.08] p-4 space-y-3">
        <div>
          <h3 class="text-sm font-black text-slate-800 dark:text-white">Anular venta {{ voidTarget.label }}</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">Esta acción es irreversible: se emitirá una Nota de Crédito y se reintegrará el stock.</p>
        </div>
        <textarea
          v-model="voidReason"
          rows="2"
          placeholder="Motivo de la anulación (opcional)"
          class="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/[0.08] rounded-xl bg-white dark:bg-[#0f1320] text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 resize-none"
        />
        <div class="flex justify-end gap-2 pt-1">
          <button @click="cancelVoid" :disabled="voidingId !== null"
            class="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-colors">
            Cancelar
          </button>
          <button @click="confirmVoid" :disabled="voidingId !== null"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors">
            <Loader2 v-if="voidingId !== null" :size="14" class="animate-spin" />
            Confirmar Anulación
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
