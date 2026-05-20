<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useCurrency } from '@/lib/currency';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-vue-next';

const { fetchApi } = useApi();
const { formatAmount } = useCurrency();

const loading = ref(true);
const kpi = ref<any>(null);
const currencyView = ref<'USD' | 'VES' | 'all'>('all');
const forexRate = ref(35); // VES per USD, fallback

async function loadKpi() {
  loading.value = true;
  try {
    const r = await fetchApi('/api/v1/staff/vault-summary/kpi/') as any;
    kpi.value = r;
    // Try to get forex rate
    try { const fx = await fetchApi('/api/v1/currencies/forex-rate/') as any; if (fx?.rate) forexRate.value = fx.rate; } catch (_) { }
  } catch (e) { console.error('KPI load error', e); }
  finally { loading.value = false; }
}

const displayCurrency = computed(() => currencyView.value === 'all' ? 'USD' : currencyView.value);
const conversionRate = computed(() => displayCurrency.value === 'VES' ? forexRate.value : 1);

function convert(val: number): number {
  if (currencyView.value === 'all') return val;
  if (displayCurrency.value === 'VES') return val * conversionRate.value;
  return val / conversionRate.value;
}

const cards = computed(() => {
  if (!kpi.value) return [];
  return [
    {
      title: 'Balance Líquido Total',
      value: convert(kpi.value.total_balance),
      currency: displayCurrency.value,
      sub: `${kpi.value.vault_count || 0} gaveteros`,
      icon: Wallet,
      color: 'emerald',
      badge: 'En Caja/Bancos',
    },
    {
      title: 'Ingresos Directos (Mes)',
      value: convert(kpi.value.monthly_incomes),
      currency: displayCurrency.value,
      sub: 'Este mes',
      icon: TrendingUp,
      color: 'emerald',
      trend: '↑',
    },
    {
      title: 'Gastos Procesados (Mes)',
      value: convert(kpi.value.monthly_expenses),
      currency: displayCurrency.value,
      sub: 'Este mes',
      icon: TrendingDown,
      color: 'rose',
      trend: '↓',
    },
    {
      title: 'Egresos por Aprobar',
      value: convert(kpi.value.pending_expense_total),
      currency: displayCurrency.value,
      sub: `${kpi.value.pending_expense_count} solicitudes pendientes`,
      icon: AlertTriangle,
      color: kpi.value.risk_warning ? 'amber' : 'slate',
      risk: kpi.value.risk_warning,
    },
  ];
});

onMounted(loadKpi);
</script>

<template>
  <div class="space-y-6">
    <!-- Currency Segmented Control -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Panel de Tesorería</h3>
      <div class="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
        <button v-for="c in [{k:'USD',l:'Ver en USD'},{k:'VES',l:'Ver en VES'},{k:'all',l:'Desglosado'}]" :key="c.k"
          @click="currencyView = c.k as any"
          :class="['px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', currencyView === c.k ? 'bg-white text-slate-900 shadow-sm dark:bg-white/[0.1] dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400']">
          {{ c.l }}
        </button>
      </div>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="h-3 w-24 bg-slate-200 rounded mb-3 dark:bg-white/[0.06]" />
        <div class="h-7 w-32 bg-slate-200 rounded mb-2 dark:bg-white/[0.06]" />
        <div class="h-3 w-16 bg-slate-200 rounded dark:bg-white/[0.06]" />
      </div>
    </div>

    <!-- KPI Cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="card in cards" :key="card.title"
        :class="['rounded-2xl border bg-white p-6 transition-all hover:shadow-sm dark:bg-[#141824]',
          card.risk ? 'border-amber-300/60 dark:border-amber-500/20' : 'border-slate-200 dark:border-white/[0.06]']">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">{{ card.title }}</span>
          <div :class="['flex items-center justify-center h-8 w-8 rounded-lg', card.color === 'rose' ? 'bg-rose-50 dark:bg-rose-500/10' : card.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10' : card.color === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-100 dark:bg-white/[0.06]']">
            <component :is="card.icon" :class="['h-4 w-4', card.color === 'rose' ? 'text-rose-600 dark:text-rose-400' : card.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : card.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400']" />
          </div>
        </div>
        <div class="flex items-baseline gap-1.5 mb-1">
          <span class="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
            {{ currencyView === 'all' ? formatAmount(card.value, card.currency) : formatAmount(card.value, currencyView as string) }}
          </span>
          <span v-if="card.trend" :class="['text-lg font-semibold', card.trend === '↑' ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400']">{{ card.trend }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500 dark:text-slate-400">{{ card.sub }}</span>
          <span v-if="card.badge" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{{ card.badge }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
