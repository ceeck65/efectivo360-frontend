<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { useCurrency } from '@/lib/currency';
import { toast } from 'vue3-toastify';
import { TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-vue-next';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

const { fetchApi } = useApi();
const { formatAmount } = useCurrency();

const loading = ref(true);
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
const endDate = ref(new Date().toISOString().split('T')[0]);
const currencyView = ref<'all' | 'USD' | 'VES'>('all');
const data = ref<any>(null);
const page = ref(1);
const searchQuery = ref('');

const forexRate = ref(35);

async function loadReport() {
  loading.value = true;
  try {
    const params = new URLSearchParams({ start_date: startDate.value, end_date: endDate.value, page: String(page.value) });
    const r = await fetchApi(`/api/v1/treasury/cash-flow-report/?${params}`) as any;
    data.value = r;
    try { const fx: any = await fetchApi('/api/v1/currencies/forex-rate/'); if (fx?.rate) forexRate.value = fx.rate; } catch (_) { }
  } catch (e) { toast.error('Error al cargar reporte'); }
  finally { loading.value = false; }
}

watch([startDate, endDate], loadReport);

const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) return data.value?.items || [];
  const q = searchQuery.value.toLowerCase();
  return (data.value?.items || []).filter((i: any) =>
    (i.audit_correlative || '').toLowerCase().includes(q) ||
    (i.source || '').toLowerCase().includes(q)
  );
});

const kpiCards = computed(() => {
  if (!data.value) return [];
  const inc = data.value.income_total || 0;
  const exp = data.value.expense_total || 0;
  const net = data.value.net || 0;
  return [
    { title: 'Ingresos', value: inc, icon: TrendingUp, color: 'emerald', currency: 'USD' },
    { title: 'Egresos', value: exp, icon: TrendingDown, color: 'rose', currency: 'USD' },
    { title: 'Flujo Neto', value: net, icon: BarChart3, color: net >= 0 ? 'emerald' : 'rose', currency: 'USD' },
  ];
});

const chartData = computed(() => {
  if (!data.value?.daily) return null;
  const d = data.value.daily;
  return {
    labels: d.map((x: any) => x.date),
    datasets: [
      { label: 'Ingresos', data: d.map((x: any) => x.income), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, tension: 0.3, pointRadius: 2 },
      { label: 'Egresos', data: d.map((x: any) => x.expense), borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.06)', fill: true, tension: 0.3, pointRadius: 2 },
    ],
  };
});

const chartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const, labels: { usePointStyle: true, boxWidth: 8, padding: 16 } } },
  scales: { x: { grid: { display: false }, ticks: { maxRotation: 45 } }, y: { grid: { color: '#e2e8f0' } } },
  interaction: { intersect: false, mode: 'index' as const },
};

onMounted(loadReport);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Flujo de Caja</h3>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/[0.08] dark:bg-[#141824]">
          <Calendar class="h-4 w-4 text-slate-400" />
          <input v-model="startDate" type="date" class="bg-transparent text-sm text-slate-700 outline-none dark:text-slate-300" />
          <span class="text-xs text-slate-400">→</span>
          <input v-model="endDate" type="date" class="bg-transparent text-sm text-slate-700 outline-none dark:text-slate-300" />
        </div>
        <div class="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <button v-for="c in [{k:'all',l:'Total'},{k:'USD',l:'USD'},{k:'VES',l:'VES'}]" :key="c.k"
            @click="currencyView = c.k as any"
            :class="['px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', currencyView === c.k ? 'bg-white text-slate-900 shadow-sm dark:bg-white/[0.1] dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400']">
            {{ c.l }}
          </button>
        </div>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="grid grid-cols-3 gap-4 mb-6">
      <div v-for="i in 3" :key="i" class="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse dark:border-white/[0.06] dark:bg-[#141824]">
        <div class="h-3 w-20 bg-slate-200 rounded mb-3 dark:bg-white/[0.06]" />
        <div class="h-6 w-32 bg-slate-200 rounded dark:bg-white/[0.06]" />
      </div>
    </div>

    <template v-else>
      <!-- KPI Cards -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div v-for="card in kpiCards" :key="card.title"
          class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-[#141824]">
          <div class="flex items-center gap-2 mb-2">
            <component :is="card.icon" :class="['h-4 w-4', card.color === 'emerald' ? 'text-emerald-500' : 'text-rose-500']" />
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ card.title }}</span>
          </div>
          <div :class="['text-xl font-bold font-mono', card.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400']">
            {{ formatAmount(card.value, card.currency) }}
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div v-if="chartData" class="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/[0.06] dark:bg-[#141824]" style="height: 280px">
        <Line :data="chartData" :options="chartOptions" />
      </div>
      <div v-else class="rounded-2xl border border-dashed border-slate-200 p-12 text-center dark:border-white/[0.08]">
        <p class="text-sm text-slate-400">No hay datos en este rango de fechas</p>
      </div>

      <!-- Search -->
      <div class="flex items-center gap-3 mt-6">
        <input v-model="searchQuery" type="text" placeholder="Buscar por correlativo o beneficiario..."
          class="w-72 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white" />
      </div>

      <!-- Detail Table -->
      <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.06]">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 dark:bg-white/[0.04] text-left">
            <tr>
              <th class="px-4 py-3 font-medium text-slate-500">Fecha</th>
              <th class="px-4 py-3 font-medium text-slate-500">Correlativo</th>
              <th class="px-4 py-3 font-medium text-slate-500">Tipo</th>
              <th class="px-4 py-3 font-medium text-slate-500">Categoría</th>
              <th class="px-4 py-3 font-medium text-slate-500">Origen/Destino</th>
              <th class="px-4 py-3 font-medium text-slate-500 text-right">Monto</th>
              <th class="px-4 py-3 font-medium text-slate-500">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/[0.04]">
            <tr v-for="item in filteredItems" :key="item.audit_correlative" class="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
              <td class="px-4 py-3 text-xs text-slate-500">{{ new Date(item.date).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }}</td>
              <td class="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{{ item.audit_correlative }}</td>
              <td class="px-4 py-3">
                <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', item.type === 'income' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300']">
                  {{ item.type === 'income' ? 'Ingreso' : 'Egreso' }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-700 dark:text-slate-300">{{ item.category }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-400">{{ item.source || '—' }}</td>
              <td class="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">{{ formatAmount(item.amount, item.currency) }}</td>
              <td class="px-4 py-3"><span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', item.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-500']">{{ item.status }}</span></td>
            </tr>
          </tbody>
        </table>
        <div v-if="filteredItems.length === 0 && !loading" class="text-center py-8 text-sm text-slate-400">No se encontraron registros</div>
      </div>
    </template>
  </div>
</template>
