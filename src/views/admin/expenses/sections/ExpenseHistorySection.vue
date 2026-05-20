<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Operation } from '../types';
import { timeAgo, CAT_BAR_COLORS } from '../types';
import { useCurrency } from '@/lib/currency';

const { formatAmount } = useCurrency();

const props = defineProps<{
  operations: Operation[];
  searchQuery: string;
  sortBy: string;
  availableProviders: string[];
  availableCategories: string[];
  availableVaults: string[];
  hasMore: boolean;
  loadingMore: boolean;
}>();

const emit = defineEmits<{
  'update:searchQuery': [v: string];
  'update:sortBy': [v: string];
  'open-detail': [op: Operation];
  'export-csv': [data: Operation[]];
  'export-pdf': [data: Operation[]];
  'load-more': [];
}>();

const filterProvider = ref('');
const filterCategory = ref('');
const filterVault = ref('');
const filterStatus = ref('');
const sentinel = ref<HTMLElement | null>(null);

const displayedOps = computed(() => {
  let ops = props.operations;
  if (filterProvider.value) ops = ops.filter(o => o.provider_info === filterProvider.value);
  if (filterCategory.value) ops = ops.filter(o => (o.expense_category_name || o.profile_name) === filterCategory.value);
  if (filterVault.value) ops = ops.filter(o => o.vault_name === filterVault.value);
  if (filterStatus.value) ops = ops.filter(o => o.status === filterStatus.value);
  return ops;
});

let observer: IntersectionObserver | null = null;

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && props.hasMore && !props.loadingMore) {
        emit('load-more');
      }
    },
    { rootMargin: '200px' }
  );
  if (sentinel.value) observer.observe(sentinel.value);
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>

<template>
  <div class="mt-4 mb-4">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Historial Reciente</p>
        <input :value="searchQuery" @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          placeholder="Buscar..." class="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs w-36 dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white"/>
        <select v-if="availableVaults.length" v-model="filterVault" class="h-8 px-1.5 rounded-lg border border-slate-200 bg-white text-xs truncate max-w-[100px] dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
          <option value="">📦 Todos</option>
          <option v-for="v in availableVaults" :key="v" :value="v">{{v}}</option>
        </select>
        <select v-if="availableCategories.length" v-model="filterCategory" class="h-8 px-1.5 rounded-lg border border-slate-200 bg-white text-xs truncate max-w-[100px] dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
          <option value="">📂 Todos</option>
          <option v-for="c in availableCategories" :key="c" :value="c">{{c}}</option>
        </select>
        <select v-if="availableProviders.length" v-model="filterProvider" class="h-8 px-1.5 rounded-lg border border-slate-200 bg-white text-xs truncate max-w-[110px] dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
          <option value="">🏢 Todos</option>
          <option v-for="p in availableProviders" :key="p" :value="p">{{p}}</option>
        </select>
        <select v-model="filterStatus" class="h-8 px-1.5 rounded-lg border border-slate-200 bg-white text-xs truncate w-28 dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
          <option value="">🔵 Todos</option>
          <option value="completed">✅ Completado</option>
          <option value="pending">🟡 Pendiente</option>
          <option value="cancelled">❌ Cancelado</option>
        </select>
        <select :value="sortBy" @change="emit('update:sortBy', ($event.target as HTMLSelectElement).value)"
          class="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs dark:border-white/[0.08] dark:bg-[#1a1f2e] dark:text-white">
          <option value="-created_at">Más reciente</option>
          <option value="created_at">Más antiguo</option>
          <option value="amount">Monto</option>
          <option value="-amount">Monto ↓</option>
        </select>
        <button @click="emit('export-csv', displayedOps)" class="inline-flex items-center gap-1 h-8 px-2 rounded-lg text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.08] dark:hover:bg-white/[0.06]">📥 Excel</button>
        <button @click="emit('export-pdf', displayedOps)" class="inline-flex items-center gap-1 h-8 px-2 rounded-lg text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:border-white/[0.08] dark:hover:bg-white/[0.06]">📄 PDF</button>
      </div>
    </div>
    <div v-if="displayedOps.length===0" class="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-white/[0.08] dark:bg-[#141824]">
      <p class="text-sm text-slate-400">No hay gastos con esos filtros</p>
    </div>
    <div v-else class="space-y-2">
      <div v-for="op in displayedOps" :key="op.id" @click="emit('open-detail', op)"
        class="flex items-start gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer dark:border-white/[0.07] dark:bg-[#141824] dark:hover:border-cyan-500/30"
        :style="{ borderLeft: `4px solid ${CAT_BAR_COLORS[op.profile_name]||'#94A3B8'}` }">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ formatAmount(op.amount, op.currency) }}</p>
            <span class="text-xs text-slate-500">{{ op.expense_category_name||op.profile_name||'General' }}</span>
            <span v-if="op.total_invoice_amount&&op.current_paid_amount&&op.total_invoice_amount>op.current_paid_amount" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Abono</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            <p class="text-xs text-slate-500">🧾 {{ op.invoice_number||'N/A' }}</p>
            <p v-if="op.provider_info" class="text-xs text-slate-500">🏢 {{ op.provider_info }}</p>
            <p class="text-xs text-slate-400">📦 {{ op.vault_name||'Sin gavetero' }}</p>
            <p class="text-xs text-slate-400">{{ timeAgo(op.created_at) }}</p>
            <p v-if="op.exchange_rate_at_transaction && op.currency !== 'VES'" class="text-xs text-cyan-600 dark:text-cyan-400">💱 {{ Number(op.exchange_rate_at_transaction).toFixed(2) }}</p>
          </div>
        </div>
        <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0 mt-0.5',op.status==='completed'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300':op.status==='pending'?'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300':'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400']">
          {{ op.status==='completed' ? 'Completado' : op.status==='pending' ? 'Pendiente' : 'Cancelado' }}
        </span>
      </div>
      <div ref="sentinel" v-if="hasMore && displayedOps.length > 0" class="h-2" />
      <div v-if="loadingMore" class="flex justify-center py-4">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-600"></div>
      </div>
      <div v-if="!hasMore && displayedOps.length > 0" class="text-center py-4 text-xs text-slate-400">
        No hay más registros
      </div>
    </div>
  </div>
</template>
