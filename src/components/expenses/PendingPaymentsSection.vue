<script setup lang="ts">
import { useCurrency } from '../../lib/currency';

const { formatAmount } = useCurrency();

export interface PendingDebt {
  id: number;
  provider_name: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  currency: string;
  due_date: string | null;
  created_at: string;
}

defineProps<{
  debts: PendingDebt[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  'pay-debt': [debt: PendingDebt];
  'view-detail': [debt: PendingDebt];
}>();
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        Cuentas por Pagar
      </p>
      <span v-if="debts.length" class="text-[10px] font-medium text-amber-600 dark:text-amber-400">
        {{ debts.length }} pendientes
      </span>
    </div>
    <div v-if="loading">
      <div v-for="n in 2" :key="n" class="h-16 animate-pulse rounded-xl bg-slate-200 mb-2 dark:bg-white/[0.08]" />
    </div>
    <div v-else-if="debts.length === 0"
      class="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-400 dark:border-white/[0.08] dark:bg-[#141824]">
      No hay cuentas pendientes
    </div>
    <div v-else class="space-y-2">
      <div v-for="d in debts.slice(0, 5)" :key="d.id" @click="emit('view-detail', d)"
        class="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm hover:shadow-md cursor-pointer transition-all dark:border-white/[0.07] dark:bg-[#141824]">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-slate-900 dark:text-white truncate">{{ d.provider_name }}</p>
          <p class="text-[11px] text-slate-400">
            {{ d.due_date ? `Vence: ${new Date(d.due_date).toLocaleDateString()}` : 'Sin fecha' }}
          </p>
        </div>
        <div class="text-right shrink-0 ml-3">
          <p class="text-sm font-semibold text-red-600">{{ formatAmount(d.remaining_amount, d.currency) }}</p>
          <p class="text-[10px] text-slate-400">De {{ formatAmount(d.total_amount, d.currency) }}</p>
        </div>
        <button @click.stop="emit('pay-debt', d)"
          class="ml-3 h-8 px-3 rounded-lg text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors shrink-0">
          Pagar
        </button>
      </div>
      <button v-if="debts.length > 5"
        class="w-full text-center text-xs text-blue-600 hover:text-blue-700 py-1 dark:text-blue-400">
        Ver las {{ debts.length }} pendientes →
      </button>
    </div>
  </div>
</template>
