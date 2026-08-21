<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { toast } from 'vue3-toastify';
import {
  Search, DollarSign, AlertTriangle, Users, Wallet, Loader2, HandCoins,
} from 'lucide-vue-next';
import { useCreditPortfolio, type CreditPortfolioRow } from '@/composables/useCreditPortfolio';
import { useForexRate } from '@/composables/useForexRate';
import RegisterCreditPaymentModal from './RegisterCreditPaymentModal.vue';

const {
  rows, totalBalanceUsd, totalCuentas, totalOverdue, loading, errorMessage,
  fetchPortfolio, setSearch,
} = useCreditPortfolio();

const { rateValue: tasaBCV, fetchForexRate } = useForexRate();

const searchInput = ref('');
function onSearchInput() {
  setSearch(searchInput.value);
}

function formatUSD(value: string | number): string {
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatVES(value: string | number): string {
  return Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

const totalBalanceVes = computed(() => Number(totalBalanceUsd.value) * tasaBCV.value);

const statusBadge: Record<CreditPortfolioRow['status'], { label: string; class: string }> = {
  OVERDUE: { label: 'Vencido', class: 'bg-rose-100 text-rose-700' },
  CURRENT: { label: 'Al día', class: 'bg-emerald-100 text-emerald-700' },
  SOLVENT: { label: 'Solvente', class: 'bg-slate-100 text-slate-500' },
};

// ── Modal de abono ──
const paymentTarget = ref<CreditPortfolioRow | null>(null);
function openPayment(row: CreditPortfolioRow) {
  paymentTarget.value = row;
}
function closePayment() {
  paymentTarget.value = null;
}
function onPaid() {
  toast.success('Abono registrado correctamente');
  fetchPortfolio();
}

onMounted(async () => {
  await Promise.all([fetchPortfolio(), fetchForexRate()]);
});
</script>

<template>
  <div class="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
    <div>
      <h1 class="text-lg font-black text-slate-800">Cuentas por Cobrar</h1>
      <p class="text-xs text-slate-400">Gestiona las ventas a crédito y registra los abonos de tus clientes</p>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2 text-blue-600">
          <DollarSign :size="16" />
          <span class="text-[10px] font-bold uppercase tracking-wider">Total por Cobrar</span>
        </div>
        <p class="mt-1.5 text-xl font-black text-slate-800">
          <template v-if="loading">…</template>
          <template v-else>${{ formatUSD(totalBalanceUsd) }}</template>
        </p>
        <p class="text-[10px] text-slate-400 font-mono">Bs. {{ formatVES(totalBalanceVes) }}</p>
      </div>
      <div class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2 text-rose-500">
          <AlertTriangle :size="16" />
          <span class="text-[10px] font-bold uppercase tracking-wider">Cuentas Vencidas</span>
        </div>
        <p class="mt-1.5 text-xl font-black text-slate-800">
          <template v-if="loading">…</template>
          <template v-else>{{ totalOverdue }}</template>
        </p>
      </div>
      <div class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2 text-amber-500">
          <Users :size="16" />
          <span class="text-[10px] font-bold uppercase tracking-wider">Clientes Morosos</span>
        </div>
        <p class="mt-1.5 text-xl font-black text-slate-800">
          <template v-if="loading">…</template>
          <template v-else>{{ totalOverdue }}</template>
        </p>
        <p class="text-[10px] text-slate-400">1 cuenta por cliente</p>
      </div>
      <div class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2 text-slate-500">
          <Wallet :size="16" />
          <span class="text-[10px] font-bold uppercase tracking-wider">Cuentas Activas</span>
        </div>
        <p class="mt-1.5 text-xl font-black text-slate-800">
          <template v-if="loading">…</template>
          <template v-else>{{ totalCuentas }}</template>
        </p>
      </div>
    </div>

    <!-- Búsqueda -->
    <div class="rounded-xl border border-slate-200/80 bg-white p-3 flex items-center gap-2">
      <div class="relative flex-1 min-w-[180px]">
        <Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchInput"
          @input="onSearchInput"
          type="text"
          placeholder="Buscar por cliente, RIF/CI o teléfono…"
          class="w-full h-9 pl-8 pr-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400"
        />
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <th class="text-left font-bold px-3 py-2.5">Cliente</th>
              <th class="text-left font-bold px-3 py-2.5">RIF / Teléfono</th>
              <th class="text-left font-bold px-3 py-2.5">Fecha Vencimiento</th>
              <th class="text-right font-bold px-3 py-2.5">Monto Original</th>
              <th class="text-right font-bold px-3 py-2.5">Saldo Pendiente</th>
              <th class="text-center font-bold px-3 py-2.5">Estado</th>
              <th class="text-right font-bold px-3 py-2.5">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td colspan="7" class="px-3 py-10 text-center text-slate-400">
                <Loader2 :size="20" class="animate-spin inline-block" />
              </td>
            </tr>
            <tr v-else-if="errorMessage">
              <td colspan="7" class="px-3 py-10 text-center text-rose-500">{{ errorMessage }}</td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td colspan="7" class="px-3 py-10 text-center text-slate-400">No hay cuentas por cobrar con saldo pendiente</td>
            </tr>
            <tr v-else v-for="row in rows" :key="row.credit_account_id" class="hover:bg-slate-50 transition-colors">
              <td class="px-3 py-2.5 font-bold text-slate-700">{{ row.name }}</td>
              <td class="px-3 py-2.5 text-slate-500">
                <p class="font-mono text-[11px]">{{ row.identity_document || '—' }}</p>
                <p class="text-[10px] text-slate-400">{{ row.phone || '—' }}</p>
              </td>
              <td class="px-3 py-2.5 text-slate-600 whitespace-nowrap">{{ formatDate(row.due_date) }}</td>
              <td class="px-3 py-2.5 text-right text-slate-500">${{ formatUSD(row.total_charged_usd) }}</td>
              <td class="px-3 py-2.5 text-right">
                <p class="font-black text-slate-800">${{ formatUSD(row.balance_usd) }}</p>
                <p class="text-[10px] text-slate-400 font-mono">Bs. {{ formatVES(Number(row.balance_usd) * tasaBCV) }}</p>
              </td>
              <td class="px-3 py-2.5 text-center">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold" :class="statusBadge[row.status].class">
                  {{ statusBadge[row.status].label }}
                </span>
              </td>
              <td class="px-3 py-2.5">
                <div class="flex justify-end">
                  <button @click="openPayment(row)"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Registrar abono">
                    <HandCoins :size="14" /> Abono
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <RegisterCreditPaymentModal
      v-if="paymentTarget"
      :account="paymentTarget"
      @close="closePayment"
      @paid="onPaid"
    />
  </div>
</template>
